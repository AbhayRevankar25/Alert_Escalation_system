const analyticsService = require('./src/services/analyticsService');

async function updateDashboardData() {
    console.log('🔄 Updating dashboard with sample data...');
    await analyticsService.generateSampleTrendData();
    console.log('✅ Dashboard data updated successfully!');
    process.exit(0);
}

updateDashboardData();