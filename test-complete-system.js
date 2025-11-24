const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testCompleteSystem() {
  console.log('🏭 Testing Complete Alert System\n');
  
  let authToken = '';
  
  try {
    // Test 1: Public endpoints
    console.log('1. Testing public endpoints...');
    const publicEndpoints = [
      '/dashboard',
      '/health',
      '/debug/alerts'
    ];

    for (const endpoint of publicEndpoints) {
      const response = await axios.get(`${BASE_URL}${endpoint}`);
      console.log(`   ✅ ${endpoint}: ${response.status}`);
    }

    // Test 2: Authentication
    console.log('\n2. Testing authentication...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: 'operator',
      password: 'operator123'
    });
    
    if (loginResponse.data.success) {
      authToken = loginResponse.data.token;
      console.log('   ✅ Login successful');
      console.log(`   👤 User: ${loginResponse.data.user.name}`);
      console.log(`   🔑 Token: ${authToken.substring(0, 50)}...`);
    }

    const headers = { Authorization: `Bearer ${authToken}` };

    // Test 3: Protected endpoints
    console.log('\n3. Testing protected endpoints...');
    const protectedEndpoints = [
      '/api/alerts/stats',
      '/api/analytics/dashboard-data',
      '/api/analytics/time-series',
      '/api/analytics/insights'
    ];

    for (const endpoint of protectedEndpoints) {
      const response = await axios.get(`${BASE_URL}${endpoint}`, { headers });
      console.log(`   ✅ ${endpoint}: ${response.data.success ? 'SUCCESS' : 'FAILED'}`);
    }

    // Test 4: Alert creation
    console.log('\n4. Testing alert creation...');
    const alertResponse = await axios.post(`${BASE_URL}/api/alerts`, {
      sourceType: 'overspeed',
      driverId: 'test_driver_' + Date.now(),
      metadata: {
        speed: 75,
        limit: 60,
        location: 'Test Highway'
      }
    }, { headers });

    if (alertResponse.data.success) {
      console.log('   ✅ Alert created successfully');
      console.log(`   🆔 Alert ID: ${alertResponse.data.alert.alertId}`);
    }

    // Test 5: Webhooks
    console.log('\n5. Testing webhooks...');
    const webhookResponse = await axios.post(`${BASE_URL}/api/webhooks/document-renewal`, {
      driverId: 'driver_123',
      documentType: 'license',
      renewalDate: new Date().toISOString().split('T')[0]
    });

    console.log(`   ✅ Webhook: ${webhookResponse.data.message}`);

    console.log('\n🎉 COMPLETE SYSTEM TEST PASSED!');
    console.log('\n🌐 Access Points:');
    console.log('   📊 Public Dashboard: http://localhost:3000/dashboard');
    console.log('   🌟 Enhanced Dashboard: http://localhost:3000/dashboard/enhanced');
    console.log('   🔐 Login Required for full features');
    console.log('\n🔑 Demo Credentials:');
    console.log('   👑 Admin: admin / admin123');
    console.log('   👨‍💼 Operator: operator / operator123');
    console.log('   👁️ Viewer: viewer / viewer123');
    console.log('\n💡 How to get API token:');
    console.log('   1. Go to Enhanced Dashboard');
    console.log('   2. Login with any credentials');
    console.log('   3. Click "Show API Token" button');
    console.log('   4. Use the token in your API requests:');
    console.log('      Authorization: Bearer YOUR_TOKEN_HERE');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testCompleteSystem();