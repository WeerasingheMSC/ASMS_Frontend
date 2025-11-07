/**
 * Debug Helper for Notification Authentication Issues
 * 
 * Run these commands in your browser console after logging in to diagnose the issue:
 */

// 1. Check what's stored in localStorage
console.log('=== AUTHENTICATION DEBUG ===');
console.log('User Data:', localStorage.getItem('user'));
console.log('Auth Token:', localStorage.getItem('authToken'));

// 2. Parse and inspect user object
try {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  console.log('Parsed User Object:', user);
  console.log('User ID:', user.id);
  console.log('User Role:', user.role);
  console.log('Token in User:', user.token || user.jwt || user.accessToken || 'NOT FOUND');
} catch (e) {
  console.error('Error parsing user:', e);
}

// 3. Test API call manually
const testNotificationAPI = async () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('authToken') || user.token || user.jwt || user.accessToken;
  
  console.log('Testing with token:', token ? 'Token present' : 'NO TOKEN');
  
  try {
    const response = await fetch('http://localhost:8080/api/notifications/unread/count', {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response Status:', response.status);
    console.log('Response OK:', response.ok);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Success! Unread Count:', data);
    } else {
      const error = await response.text();
      console.error('Error Response:', error);
    }
  } catch (error) {
    console.error('Network Error:', error);
  }
};

// Run the test
console.log('Running API test...');
testNotificationAPI();

/**
 * EXPECTED OUTPUT:
 * 
 * If working correctly, you should see:
 * - User object with id and role
 * - Token present (either in authToken or user.token)
 * - Response Status: 200
 * - Success! Unread Count: 0 (or some number)
 * 
 * If you see 403:
 * - Check if token is present
 * - Check if token format is correct
 * - Verify backend JWT configuration
 * - Check backend SecurityConfig allows /api/notifications endpoints
 */

/**
 * COMMON FIXES:
 * 
 * 1. If token is in user object but not in authToken:
 *    After successful login, add:
 *    localStorage.setItem('authToken', result.token);
 * 
 * 2. If backend doesn't send token:
 *    Check your backend login endpoint to ensure it returns JWT token
 * 
 * 3. If 403 persists:
 *    Check backend SecurityConfig.java:
 *    - Ensure /api/notifications/** is protected but accessible to authenticated users
 *    - Verify JWT filter is correctly configured
 *    - Check CORS configuration
 */
