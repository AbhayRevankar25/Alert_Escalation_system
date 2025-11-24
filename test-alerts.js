const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testAlertSystem() {
  console.log('🚀 Testing Alert Escalation System...\n');

  // Test data
  const testDriver = 'driver_123';
  
  try {
    // Test 1: Create overspeed alerts for escalation
    console.log('1. Creating overspeed alerts for escalation test...');
    for (let i = 0; i < 3; i++) {
      const alert = {
        sourceType: 'overspeed',
        driverId: testDriver,
        vehicleId: 'vehicle_001',
        metadata: { 
          speed: 85 + i, 
          limit: 60, 
          location: 'Highway 1',
          instance: i + 1 
        }
      };
      
      const response = await axios.post(`${BASE_URL}/alerts`, alert);
      console.log(`   ✅ Alert ${i + 1}: ${response.data.success ? 'SUCCESS' : 'FAILED'}`);
      
      if (i === 2) {
        console.log('   ⚠️  Third overspeed alert should trigger escalation');
      }
      
      // Small delay between alerts
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Wait for rule evaluation
    console.log('\n2. Waiting for rule evaluation...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Test 2: Create negative feedback alerts
    console.log('\n3. Creating negative feedback alerts...');
    const feedbackAlert = {
      sourceType: 'feedback_negative',
      driverId: testDriver,
      metadata: { 
        rating: 1, 
        comment: 'Rude behavior', 
        tripId: 'trip_456' 
      }
    };
    
    await axios.post(`${BASE_URL}/alerts`, feedbackAlert);
    console.log('   ✅ Negative feedback alert created');

    // Test 3: Check alert stats
    console.log('\n4. Checking alert statistics...');
    const statsResponse = await axios.get(`${BASE_URL}/alerts/stats`);
    console.log('   📊 Alert Stats:', JSON.stringify(statsResponse.data.stats, null, 2));

    // Test 4: Check dashboard data - FIXED ENDPOINT
    console.log('\n5. Checking dashboard data...');
    const dashboardResponse = await axios.get('http://localhost:3000/dashboard/data');
    const dashboardData = dashboardResponse.data.data;
    
    console.log('   🚗 Top Drivers with Alerts:');
    if (dashboardData.topDrivers && dashboardData.topDrivers.length > 0) {
      dashboardData.topDrivers.forEach((driver, index) => {
        console.log(`      ${index + 1}. ${driver.driverId}: ${driver.openAlertCount} alerts (${driver.escalatedCount} escalated)`);
      });
    } else {
      console.log('      No drivers with open alerts found');
    }

    // Test 5: Check recent auto-closed alerts
    console.log('\n6. Recent Auto-Closed Alerts:');
    if (dashboardData.recentAutoClosed && dashboardData.recentAutoClosed.length > 0) {
      dashboardData.recentAutoClosed.forEach((alert, index) => {
        console.log(`      ${index + 1}. ${alert.sourceType} - ${alert.driverId} - ${alert.metadata.autoCloseReason || 'No reason'}`);
      });
    } else {
      console.log('      No auto-closed alerts found');
    }

    console.log('\n7. Testing completed! 🎉');
    console.log('\n🌐 Visit http://localhost:3000/dashboard to view the web interface');
    console.log('🔍 Visit http://localhost:3000/health to check system health');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    console.log('💡 Make sure the server is running on http://localhost:3000');
  }
}

// Only run if this script is executed directly
if (require.main === module) {
  testAlertSystem();
}

module.exports = testAlertSystem;