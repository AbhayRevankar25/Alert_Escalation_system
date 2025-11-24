const alertService = require('../services/alertService');
const analyticsService = require('../services/analyticsService');

class DashboardController {
  async getDashboardData(req, res) {
    try {
      const [stats, topDrivers, recentAutoClosed] = await Promise.all([
        alertService.getAlertStats(),
        alertService.getTopDriversWithAlerts(5),
        alertService.getAlertsByStatus('AUTO_CLOSED', 10)
      ]);

      res.json({
        success: true,
        data: {
          stats,
          topDrivers,
          recentAutoClosed
        }
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async renderDashboard(req, res) {
    try {
      const [stats, topDrivers, recentAutoClosed] = await Promise.all([
        alertService.getAlertStats(),
        alertService.getTopDriversWithAlerts(5),
        alertService.getAlertsByStatus('AUTO_CLOSED', 10)
      ]);

      res.render('dashboard', {
        title: 'Alert Escalation Dashboard',
        stats,
        topDrivers,
        recentAutoClosed,
        currentTime: new Date().toLocaleString()
      });
    } catch (error) {
      console.error('Error rendering dashboard:', error);
      res.status(500).send('Error loading dashboard');
    }
  }

  async renderEnhancedDashboard(req, res) {
    try {
      // For enhanced dashboard, we'll let the frontend handle data loading
      res.render('dashboard-enhanced', {
        title: 'Enhanced Alert Dashboard',
        currentTime: new Date().toLocaleString()
      });
    } catch (error) {
      console.error('Error rendering enhanced dashboard:', error);
      res.status(500).send('Error loading enhanced dashboard');
    }
  }

  async getAlerts(req, res) {
    try {
      const { status, severity, driverId } = req.query;
      let alerts = [];

      if (status) {
        alerts = await alertService.getAlertsByStatus(status);
      } else if (severity) {
        alerts = await alertService.getAlertsBySeverity(severity);
      } else {
        // Get all alerts (limited)
        const openAlerts = await alertService.getAlertsByStatus('OPEN', 100);
        const escalatedAlerts = await alertService.getAlertsByStatus('ESCALATED', 100);
        alerts = [...openAlerts, ...escalatedAlerts]
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
          .slice(0, 100);
      }

      res.json({
        success: true,
        alerts
      });
    } catch (error) {
      console.error('Error fetching alerts:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new DashboardController();