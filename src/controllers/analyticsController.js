const analyticsService = require('../services/analyticsService');
const alertService = require('../services/alertService');

class AnalyticsController {
  async getTimeSeries(req, res) {
    try {
      const { days = 7 } = req.query;
      const timeSeries = await analyticsService.getTimeSeriesData(parseInt(days));
      
      res.json({
        success: true,
        data: timeSeries
      });
    } catch (error) {
      console.error('Error getting time series:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getInsights(req, res) {
    try {
      const insights = await analyticsService.getAlertInsights();
      
      res.json({
        success: true,
        data: insights
      });
    } catch (error) {
      console.error('Error getting insights:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

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
      console.error('Error getting dashboard data:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getAlertDetails(req, res) {
    try {
      const { alertId } = req.params;
      const alert = await alertService.getAlert(alertId);
      
      if (!alert) {
        return res.status(404).json({
          success: false,
          error: 'Alert not found'
        });
      }

      // Get similar alerts for context
      const similarAlerts = await alertService.getAlertsByStatus(alert.status);
      const driverAlerts = similarAlerts.filter(a => a.driverId === alert.driverId);

      res.json({
        success: true,
        alert,
        context: {
          driverAlertCount: driverAlerts.length,
          similarAlertsCount: similarAlerts.length,
          driverRecentAlerts: driverAlerts.slice(0, 5)
        }
      });
    } catch (error) {
      console.error('Error getting alert details:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new AnalyticsController();