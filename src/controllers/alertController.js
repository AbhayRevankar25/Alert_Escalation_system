const Joi = require('joi');
const alertService = require('../services/alertService');

const alertSchema = Joi.object({
  sourceType: Joi.string().valid('overspeed', 'feedback_negative', 'document_expiry', 'safety_incident').required(),
  driverId: Joi.string().required(),
  vehicleId: Joi.string().optional(),
  severity: Joi.string().valid('INFO', 'WARNING', 'CRITICAL').optional(),
  metadata: Joi.object().optional()
});

class AlertController {
  async createAlert(req, res) {
    try {
      const { error, value } = alertSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.details
        });
      }

      const alert = await alertService.createAlert(value);
      
      res.status(201).json({
        success: true,
        message: 'Alert created successfully',
        alert
      });
    } catch (error) {
      console.error('Error creating alert:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getAlert(req, res) {
    try {
      const { alertId } = req.params;
      const alert = await alertService.getAlert(alertId);
      
      if (!alert) {
        return res.status(404).json({
          success: false,
          error: 'Alert not found'
        });
      }

      res.json({
        success: true,
        alert
      });
    } catch (error) {
      console.error('Error fetching alert:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async resolveAlert(req, res) {
    try {
      const { alertId } = req.params;
      const alert = await alertService.resolveAlert(alertId);
      
      if (!alert) {
        return res.status(404).json({
          success: false,
          error: 'Alert not found'
        });
      }

      res.json({
        success: true,
        message: 'Alert resolved successfully',
        alert
      });
    } catch (error) {
      console.error('Error resolving alert:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getAlertsByStatus(req, res) {
    try {
      const { status } = req.params;
      const { limit = 50 } = req.query;
      
      const alerts = await alertService.getAlertsByStatus(status, parseInt(limit));
      
      res.json({
        success: true,
        alerts
      });
    } catch (error) {
      console.error('Error fetching alerts by status:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getAlertStats(req, res) {
    try {
      const stats = await alertService.getAlertStats();
      
      res.json({
        success: true,
        stats
      });
    } catch (error) {
      console.error('Error fetching alert stats:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new AlertController();