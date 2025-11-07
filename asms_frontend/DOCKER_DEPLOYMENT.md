# ASMS Frontend - Docker Deployment Guide

## Prerequisites

- Docker Engine 20.10+
- Docker Compose v2.0+
- 1GB+ available RAM
- Port 3000 available
- Backend API running (or accessible)

## Quick Start

### 1. Build and Run with Docker Compose

```bash
# Build and start the frontend
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the frontend
docker-compose down
```

### 2. Build and Run with Docker Only

```bash
# Build the image
docker build -t asms-frontend:latest .

# Run the container
docker run -d \
  --name asms-frontend \
  -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL="http://localhost:8080" \
  asms-frontend:latest

# View logs
docker logs -f asms-frontend

# Stop the container
docker stop asms-frontend
docker rm asms-frontend
```

## Environment Variables

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Then edit `.env` with your configuration.

### Required Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | http://localhost:8080 |

### Optional Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Node environment | production |
| `NEXT_TELEMETRY_DISABLED` | Disable Next.js telemetry | 1 |

## Health Check

The container includes a health check that runs every 30 seconds:

```bash
# Check container health
docker ps

# Manual health check
curl http://localhost:3000
```

## Production Deployment

### 1. Build for Production

The Dockerfile uses multi-stage builds for optimization:
- Stage 1: Install dependencies
- Stage 2: Build the application
- Stage 3: Production runtime (minimal image)

### 2. Environment-Specific Builds

For different environments, create separate `.env` files:

```bash
# Development
docker build -t asms-frontend:dev --build-arg ENV_FILE=.env.development .

# Staging
docker build -t asms-frontend:staging --build-arg ENV_FILE=.env.staging .

# Production
docker build -t asms-frontend:latest --build-arg ENV_FILE=.env.production .
```

### 3. Using Docker Compose with Backend

If running both frontend and backend together:

```bash
# Start both services
docker-compose up -d

# The frontend will automatically connect to the backend
# via the shared network
```

### 4. Behind a Reverse Proxy (Nginx/Traefik)

Example Nginx configuration:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Performance Optimization

### 1. Image Size

The production image is optimized:
- Multi-stage build reduces final size
- Alpine Linux base (minimal footprint)
- Standalone Next.js output
- No dev dependencies included

```bash
# Check image size
docker images asms-frontend
```

### 2. Caching

Docker layer caching is optimized:
- Dependencies installed before source copy
- Faster rebuilds when only source changes

### 3. Resource Limits

Limit container resources in production:

```yaml
services:
  frontend:
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          memory: 256M
```

## Troubleshooting

### Container won't start

```bash
# Check logs
docker logs asms-frontend

# Check if port is already in use
lsof -i :3000

# Restart the container
docker-compose restart
```

### API connection issues

```bash
# Verify NEXT_PUBLIC_API_URL is correct
docker exec asms-frontend env | grep NEXT_PUBLIC_API_URL

# Test backend connectivity
docker exec asms-frontend wget -O- http://backend:8080/actuator/health
```

### Build failures

```bash
# Clear Docker build cache
docker builder prune

# Rebuild without cache
docker build --no-cache -t asms-frontend:latest .
```

### Out of memory during build

```bash
# Increase Docker memory limit in Docker Desktop settings
# Or build with swap enabled
docker build --memory-swap=-1 -t asms-frontend:latest .
```

## Development vs Production

### Development with Hot Reload

For development, mount source code as volume:

```yaml
services:
  frontend-dev:
    image: node:22-alpine
    working_dir: /app
    volumes:
      - ./:/app
      - /app/node_modules
    ports:
      - "3000:3000"
    command: npm run dev
```

### Production Build

Production uses optimized standalone output:
- Smaller image size
- Faster startup time
- Better performance

## Monitoring

### View Real-time Logs

```bash
docker-compose logs -f frontend
```

### Resource Usage

```bash
docker stats asms-frontend
```

### Access Container Shell

```bash
docker exec -it asms-frontend sh
```

## Backup and Restore

### Export Configuration

```bash
# Backup environment variables
docker exec asms-frontend env > frontend-env-backup.txt

# Export container
docker commit asms-frontend asms-frontend-backup:$(date +%Y%m%d)

# Save image
docker save asms-frontend-backup:$(date +%Y%m%d) | gzip > asms-frontend-backup-$(date +%Y%m%d).tar.gz
```

### Restore

```bash
# Load image
docker load < asms-frontend-backup-20250107.tar.gz

# Run from backup
docker run -d --name asms-frontend asms-frontend-backup:20250107
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Build and Deploy Frontend

on:
  push:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Docker image
        run: docker build -t asms-frontend:${{ github.sha }} .
      
      - name: Push to registry
        run: |
          echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
          docker push asms-frontend:${{ github.sha }}
```

## Security Best Practices

1. **Environment Variables**
   - Never commit `.env` files
   - Use Docker secrets for sensitive data
   - Prefix public variables with `NEXT_PUBLIC_`

2. **Image Security**
   - Run as non-root user (configured in Dockerfile)
   - Keep base images updated
   - Scan for vulnerabilities:
     ```bash
     docker scan asms-frontend:latest
     ```

3. **Network Security**
   - Use Docker networks for service communication
   - Don't expose unnecessary ports
   - Use HTTPS in production

## Scaling

### Horizontal Scaling

```bash
# Scale to 3 instances
docker-compose up -d --scale frontend=3

# Use with load balancer (Nginx, HAProxy, etc.)
```

### Load Balancing with Nginx

```nginx
upstream frontend_backend {
    server localhost:3001;
    server localhost:3002;
    server localhost:3003;
}

server {
    listen 80;
    location / {
        proxy_pass http://frontend_backend;
    }
}
```

## Cleaning Up

```bash
# Stop and remove containers
docker-compose down

# Remove images
docker rmi asms-frontend:latest

# Remove all unused images and containers
docker system prune -a

# Clean build cache
docker builder prune -a
```

## Useful Commands

```bash
# Rebuild and restart
docker-compose up -d --build

# View container details
docker inspect asms-frontend

# Check resource usage
docker stats asms-frontend

# Execute commands in container
docker exec -it asms-frontend npm --version

# Copy files from container
docker cp asms-frontend:/app/.next ./backup-next
```

## Support

For issues and questions:
- Check logs: `docker-compose logs -f frontend`
- Verify environment variables are set correctly
- Ensure backend API is accessible
- Check network connectivity between services
- Verify port is not already in use

## License

Copyright © 2025 ASMS Team
