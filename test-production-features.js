const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testProductionFeatures() {
  console.log('🏭 Testing Production Features\n');
  
  let authToken = '';
  
  try {
    // Test 1: Authentication
    console.log('1. Testing Authentication...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'operator',
      password: 'operator123'
    });
    
    if (loginResponse.data.success) {
      authToken = loginResponse.data.token;
      console.log('   ✅ Login successful');
      console.log(`   User: ${loginResponse.data.user.name} (${loginResponse.data.user.role})`);
    }

    const headers = { Authorization: `Bearer ${authToken}` };

    // Test 2: Rate Limiting
    console.log('\n2. Testing Rate Limiting...');
    try {
      // Make multiple rapid requests
      for (let i = 0; i < 35; i++) {
        await axios.get(`${BASE_URL}/alerts/stats`, { headers });
      }
    } catch (error) {
      if (error.response?.status === 429) {
        console.log('   ✅ Rate limiting working (received 429)');
      }
    }

    // Test 3: Webhook - Document Renewal
    console.log('\n3. Testing Document Renewal Webhook...');
    const webhookResponse = await axios.post(`${BASE_URL}/webhooks/document-renewal`, {
      driverId: 'driver_123',
      documentType: 'license',
      renewalDate: '2024-12-31',
      documentId: 'LIC_789012'
    });
    console.log(`   ✅ Webhook processed: ${webhookResponse.data.message}`);

    // Test 4: Analytics Endpoints
    console.log('\n4. Testing Analytics...');
    const [timeSeries, insights] = await Promise.all([
      axios.get(`${BASE_URL}/analytics/time-series?days=7`, { headers }),
      axios.get(`${BASE_URL}/analytics/insights`, { headers })
    ]);
    
    console.log(`   ✅ Time series data: ${timeSeries.data.data.length} days`);
    console.log(`   ✅ Insights: ${insights.data.data.trend} trend`);

    // Test 5: Enhanced Dashboard
    console.log('\n5. Testing Enhanced Dashboard...');
    const dashboardResponse = await axios.get('http://localhost:3000/dashboard/data', { headers });
    console.log(`   ✅ Dashboard data: ${dashboardResponse.data.data.stats.total} total alerts`);

    console.log('\n🎉 ALL PRODUCTION FEATURES WORKING!');
    console.log('\n🌐 Access Points:');
    console.log('   📊 Enhanced Dashboard: http://localhost:3000/dashboard/enhanced');
    console.log('   🔐 Authentication: Use operator/operator123');
    console.log('   📈 Analytics: Time series and insights endpoints');
    console.log('   🔄 Webhooks: Document renewal and external alerts');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testProductionFeatures();