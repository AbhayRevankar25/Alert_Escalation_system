const axios = require('axios');

async function checkSystem() {
  console.log('🔍 Checking Alert System Status...\n');
  
  try {
    // Check health endpoint
    const healthResponse = await axios.get('http://localhost:3000/health');
    console.log('✅ Health Check:', healthResponse.data);
    
    // Check alert stats
    const statsResponse = await axios.get('http://localhost:3000/api/alerts/stats');
    console.log('📊 Alert Statistics:', statsResponse.data.stats);
    
    // Check dashboard data
    const dashboardResponse = await axios.get('http://localhost:3000/dashboard/data');
    console.log('🎯 Dashboard Data Available');
    
    console.log('\n🌐 System is running correctly!');
    console.log('   Dashboard: http://localhost:3000/dashboard');
    console.log('   API Docs:');
    console.log('     - POST /api/alerts - Create alert');
    console.log('     - GET /api/alerts/stats - Get statistics');
    console.log('     - GET /api/alerts/status/:status - Get alerts by status');
    
  } catch (error) {
    console.error('❌ System check failed:', error.message);
    console.log('💡 Make sure the server is running with: npm run dev');
  }
}

checkSystem();