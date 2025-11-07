# WebSocket 403 Error - Solutions

## Problem
WebSocket connection is getting 403 Forbidden because JWT authentication is not configured for WebSocket handshake.

## Solution 1: Update Backend WebSocket Config (RECOMMENDED)

Your backend needs to accept JWT token for WebSocket connections. Update `WebSocketConfig.java`:

### Option A: Token in Query Parameter
```java
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    
    @Autowired
    private JwtTokenProvider jwtTokenProvider;
    
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws/notifications")
                .setAllowedOrigins("http://localhost:3000", "http://localhost:3001")
                .setHandshakeHandler(new DefaultHandshakeHandler() {
                    @Override
                    protected Principal determineUser(
                            ServerHttpRequest request, 
                            WebSocketHandler wsHandler,
                            Map<String, Object> attributes) {
                        
                        if (request instanceof ServletServerHttpRequest) {
                            ServletServerHttpRequest servletRequest = 
                                (ServletServerHttpRequest) request;
                            
                            // Get token from query parameter
                            String token = servletRequest.getServletRequest()
                                .getParameter("token");
                            
                            if (token != null && jwtTokenProvider.validateToken(token)) {
                                String username = jwtTokenProvider.getUsernameFromToken(token);
                                Long userId = jwtTokenProvider.getUserIdFromToken(token);
                                attributes.put("userId", userId);
                                return () -> username;
                            }
                        }
                        return null;
                    }
                })
                .withSockJS();
    }
}
```

### Option B: Disable WebSocket Security Temporarily
If you want to test without authentication first:

```java
@Configuration
@EnableWebSocketSecurity
public class WebSocketSecurityConfig {
    
    @Bean
    public AuthorizationManager<Message<?>> messageAuthorizationManager(
            MessageMatcherDelegatingAuthorizationManager.Builder messages) {
        
        messages
            .nullDestMatcher().authenticated()
            .simpDestMatchers("/topic/**").permitAll()
            .simpSubscribeDestMatchers("/topic/**").permitAll()
            .anyMessage().permitAll();
            
        return messages.build();
    }
}
```

## Solution 2: Use REST API Polling (Frontend - Temporary Workaround)

If you can't modify backend immediately, use polling instead of WebSocket.

I can update the frontend to poll for new notifications every 30 seconds instead of using WebSocket.

Would you like me to:
1. Wait for you to update backend WebSocket config (RECOMMENDED)
2. Implement REST API polling as temporary workaround
3. Both (polling now, WebSocket later)

## Current Status
- ✅ REST API working (with JWT token)
- ❌ WebSocket not working (403 error - needs backend config)
