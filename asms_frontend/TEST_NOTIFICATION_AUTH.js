// Copy and paste this in browser console to test authentication

console.clear();
console.log('🔍 NOTIFICATION AUTH DEBUG TEST\n');

// 1. Check localStorage
const userStr = localStorage.getItem('user');
const authToken = localStorage.getItem('authToken');

console.log('📦 LocalStorage Check:');
console.log('- user exists:', !!userStr);
console.log('- authToken exists:', !!authToken);

if (userStr) {
  const user = JSON.parse(userStr);
  console.log('\n👤 User Object:');
  console.log('- email:', user.email);
  console.log('- username:', user.username);
  console.log('- role:', user.role);
  console.log('- token exists:', !!user.token);
  console.log('- token preview:', user.token ? user.token.substring(0, 30) + '...' : 'N/A');
  
  // 2. Test API call
  console.log('\n🌐 Testing API Call...');
  const token = authToken || user.token;
  
  fetch('http://localhost:8080/api/notifications/unread/count', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
  .then(response => {
    console.log('\n📡 Response:');
    console.log('- Status:', response.status);
    console.log('- Status Text:', response.statusText);
    
    if (response.ok) {
      return response.json();
    } else {
      return response.text().then(text => {
        throw new Error(`${response.status}: ${text}`);
      });
    }
  })
  .then(data => {
    console.log('- Success! ✅');
    console.log('- Unread Count:', data);
  })
  .catch(error => {
    console.error('- Failed! ❌');
    console.error('- Error:', error.message);
    console.log('\n💡 Troubleshooting:');
    console.log('1. Check if backend is running on http://localhost:8080');
    console.log('2. Verify /api/notifications endpoints are accessible to authenticated users');
    console.log('3. Check backend SecurityConfig.java');
    console.log('4. Verify JWT token is valid and not expired');
  });
} else {
  console.log('❌ No user data found. Please login first.');
}
