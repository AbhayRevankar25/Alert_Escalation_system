const axios = require('axios');

async function testDashboardAccess() {
  console.log('🧪 Testing Dashboard Access...\n');
  
  try {
    // Test 1: Public dashboard access
    console.log('1. Testing public dashboard access...');
    const dashboardResponse = await axios.get('http://localhost:3000/dashboard');
    console.log('   ✅ Public dashboard accessible');
    
    // Test 2: Dashboard data API
    console.log('2. Testing dashboard data API...');
    const dataResponse = await axios.get('http://localhost:3000/dashboard/data');
    console.log('   ✅ Dashboard data accessible');
    console.log(`   📊 Total alerts: ${dataResponse.data.data.stats.total}`);
    
    // Test 3: Enhanced dashboard
    console.log('3. Testing enhanced dashboard...');
    const enhancedResponse = await axios.get('http://localhost:3000/dashboard/enhanced');
    console.log('   ✅ Enhanced dashboard accessible');
    
    // Test 4: Health endpoint
    console.log('4. Testing health endpoint...');
    const healthResponse = await axios.get('http://localhost:3000/health');
    console.log('   ✅ Health endpoint working');
    console.log(`   🟢 Status: ${healthResponse.data.status}`);
    
    // Test 5: Authentication
    console.log('5. Testing authentication...');
    const authResponse = await axios.post('http://localhost:3000/api/auth/login', {
      username: 'operator',
      password: 'operator123'
    });
    console.log('   ✅ Authentication working');
    console.log(`   🔑 Logged in as: ${authResponse.data.user.name}`);
    
    console.log('\n🎉 ALL DASHBOARD ACCESS TESTS PASSED!');
    console.log('\n🌐 Access Points:');
    console.log('   📊 Public Dashboard: http://localhost:3000/dashboard');
    console.log('   🌟 Enhanced Dashboard: http://localhost:3000/dashboard/enhanced');
    console.log('   🔐 Login: Use operator/operator123');
    console.log('   🩺 Health: http://localhost:3000/health');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    console.log('\n💡 Solution: Make sure the server is running and routes are properly configured.');
  }
}

testDashboardAccess();