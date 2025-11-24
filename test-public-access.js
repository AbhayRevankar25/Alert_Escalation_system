const axios = require('axios');

async function testPublicAccess() {
  console.log('🌐 Testing Public Access Points...\n');
  
  const endpoints = [
    { name: 'Public Dashboard', url: 'http://localhost:3000/dashboard' },
    { name: 'Enhanced Dashboard', url: 'http://localhost:3000/dashboard/enhanced' },
    { name: 'Health Check', url: 'http://localhost:3000/health' },
    { name: 'Debug Data', url: 'http://localhost:3000/debug/alerts' },
    { name: 'Dashboard API', url: 'http://localhost:3000/dashboard/data' }
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await axios.get(endpoint.url);
      console.log(`✅ ${endpoint.name}: ACCESSIBLE (Status: ${response.status})`);
    } catch (error) {
      console.log(`❌ ${endpoint.name}: BLOCKED - ${error.response?.data?.error || error.message}`);
    }
  }

  console.log('\n🎯 Expected Results:');
  console.log('   ✅ All dashboard endpoints should be accessible without login');
  console.log('   ✅ Health and debug endpoints should work');
  console.log('   ❌ Only /api/alerts and /api/analytics should require authentication');
}

testPublicAccess();