const Alert = require('../models/Alert');
const ruleEngine = require('./ruleEngine');
const redisHelpers = require('../utils/redisHelpers');

class AlertService {
  constructor() {
    this.ALERT_PREFIX = 'alert:';
    this.ALERTS_SET = 'alerts:all';
    this.ALERTS_BY_DRIVER = 'alerts:driver:';
    this.ALERTS_BY_STATUS = 'alerts:status:';
    this.ALERTS_BY_SEVERITY = 'alerts:severity:';
  }

  async createAlert(alertData) {
    try {
      const rule = ruleEngine.getRule(alertData.sourceType);
      if (!rule) {
        throw new Error(`No rule defined for alert type: ${alertData.sourceType}`);
      }

      // Set initial severity from rule
      alertData.severity = rule.initialSeverity;

      const alert = new Alert(alertData);
      
      // Store alert in Redis
      await this.storeAlert(alert);
      
      // Store for rule evaluation
      await ruleEngine.storeAlertForEvaluation(alert);
      
      // Evaluate for escalation
      const escalationResult = await ruleEngine.evaluateEscalation(alert);
      if (escalationResult && escalationResult.shouldEscalate) {
        await this.escalateAlert(alert.alertId, escalationResult);
      }

      return alert;
    } catch (error) {
      console.error('Error in createAlert:', error);
      throw error;
    }
  }

  async storeAlert(alert) {
    const alertKey = `${this.ALERT_PREFIX}${alert.alertId}`;
    const alertData = alert.toJSON();
    
    // Store alert as hash
    await redisHelpers.hsetMultiple(alertKey, alertData);
    
    // Add to various indexes
    await redisHelpers.sadd(this.ALERTS_SET, alert.alertId);
    await redisHelpers.sadd(`${this.ALERTS_BY_DRIVER}${alert.driverId}`, alert.alertId);
    await redisHelpers.sadd(`${this.ALERTS_BY_STATUS}${alert.status}`, alert.alertId);
    await redisHelpers.sadd(`${this.ALERTS_BY_SEVERITY}${alert.severity}`, alert.alertId);
    
    // Add timestamp index for sorting
    await redisHelpers.zadd('alerts:by_timestamp', new Date(alert.timestamp).getTime(), alert.alertId);
  }

  async getAlert(alertId) {
    const alertKey = `${this.ALERT_PREFIX}${alertId}`;
    const alertData = await redisHelpers.hgetall(alertKey);
    
    if (!alertData || Object.keys(alertData).length === 0) {
      return null;
    }
    
    // Parse the data back to proper types
    const parsedData = {};
    for (const [key, value] of Object.entries(alertData)) {
      if (value) {
        // Try to parse JSON fields
        if ((key === 'metadata' || key === 'metadataString') && value) {
          try {
            parsedData[key === 'metadataString' ? 'metadata' : key] = JSON.parse(value);
          } catch {
            parsedData[key === 'metadataString' ? 'metadata' : key] = value;
          }
        } else {
          parsedData[key] = value;
        }
      }
    }
    
    return Alert.fromJSON(parsedData);
  }

  async escalateAlert(alertId, escalationResult) {
    const alert = await this.getAlert(alertId);
    if (!alert || alert.status === 'ESCALATED') {
      return null;
    }

    // Update alert status and severity
    alert.status = 'ESCALATED';
    alert.severity = escalationResult.newSeverity || alert.severity;
    alert.escalatedAt = new Date().toISOString();
    alert.ruleTriggered = escalationResult.reason;

    // Update in storage
    await this.updateAlert(alert);
    
    console.log(`🚨 Alert ${alertId} escalated: ${escalationResult.reason}`);
    return alert;
  }

  async updateAlert(alert) {
    const alertKey = `${this.ALERT_PREFIX}${alert.alertId}`;
    
    // Remove from old indexes
    const oldAlert = await this.getAlert(alert.alertId);
    if (oldAlert) {
      await redisHelpers.srem(`${this.ALERTS_BY_STATUS}${oldAlert.status}`, alert.alertId);
      await redisHelpers.srem(`${this.ALERTS_BY_SEVERITY}${oldAlert.severity}`, alert.alertId);
    }
    
    // Update alert data
    await redisHelpers.hsetMultiple(alertKey, alert.toJSON());
    
    // Add to new indexes
    await redisHelpers.sadd(`${this.ALERTS_BY_STATUS}${alert.status}`, alert.alertId);
    await redisHelpers.sadd(`${this.ALERTS_BY_SEVERITY}${alert.severity}`, alert.alertId);
  }

  async autoCloseAlert(alertId, reason) {
    const alert = await this.getAlert(alertId);
    if (!alert || alert.status === 'AUTO_CLOSED' || alert.status === 'RESOLVED') {
      return null;
    }

    alert.status = 'AUTO_CLOSED';
    alert.autoClosedAt = new Date().toISOString();
    if (!alert.metadata) alert.metadata = {};
    alert.metadata.autoCloseReason = reason;

    await this.updateAlert(alert);
    console.log(`✅ Alert ${alertId} auto-closed: ${reason}`);
    return alert;
  }

  async resolveAlert(alertId) {
    const alert = await this.getAlert(alertId);
    if (!alert) {
      return null;
    }

    alert.status = 'RESOLVED';
    alert.resolvedAt = new Date().toISOString();

    await this.updateAlert(alert);
    return alert;
  }

  async getAlertsByStatus(status, limit = 50) {
    try {
      const alertIds = await redisHelpers.smembers(`${this.ALERTS_BY_STATUS}${status}`);
      const limitedIds = alertIds.slice(0, limit);
      
      const alerts = [];
      for (const alertId of limitedIds) {
        const alert = await this.getAlert(alertId);
        if (alert) alerts.push(alert);
      }
      
      return alerts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } catch (error) {
      console.error(`Error in getAlertsByStatus for status ${status}:`, error);
      return [];
    }
  }

  async getAlertsBySeverity(severity) {
    try {
      const alertIds = await redisHelpers.smembers(`${this.ALERTS_BY_SEVERITY}${severity}`);
      
      const alerts = [];
      for (const alertId of alertIds) {
        const alert = await this.getAlert(alertId);
        if (alert) alerts.push(alert);
      }
      
      return alerts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } catch (error) {
      console.error(`Error in getAlertsBySeverity for severity ${severity}:`, error);
      return [];
    }
  }

  async getTopDriversWithAlerts(limit = 5) {
    try {
      const driverKeys = await redisHelpers.keys('alerts:driver:*');
      const driverStats = [];

      for (const key of driverKeys) {
        const driverId = key.replace('alerts:driver:', '');
        const alertIds = await redisHelpers.smembers(key);
        
        const openAlerts = [];
        for (const alertId of alertIds) {
          const alert = await this.getAlert(alertId);
          if (alert && (alert.status === 'OPEN' || alert.status === 'ESCALATED')) {
            openAlerts.push(alert);
          }
        }

        if (openAlerts.length > 0) {
          driverStats.push({
            driverId,
            openAlertCount: openAlerts.length,
            escalatedCount: openAlerts.filter(a => a.status === 'ESCALATED').length,
            alerts: openAlerts.slice(0, 5) // Limit alert details
          });
        }
      }

      return driverStats
        .sort((a, b) => b.openAlertCount - a.openAlertCount)
        .slice(0, limit);
    } catch (error) {
      console.error('Error in getTopDriversWithAlerts:', error);
      return [];
    }
  }

  async getAlertStats() {
    try {
      const severities = ['CRITICAL', 'WARNING', 'INFO'];
      const statuses = ['OPEN', 'ESCALATED', 'AUTO_CLOSED', 'RESOLVED'];
      
      const stats = {
        bySeverity: {},
        byStatus: {},
        total: 0
      };

      for (const severity of severities) {
        const count = await redisHelpers.scard(`alerts:severity:${severity}`);
        stats.bySeverity[severity] = parseInt(count) || 0;
        stats.total += parseInt(count) || 0;
      }

      for (const status of statuses) {
        const count = await redisHelpers.scard(`alerts:status:${status}`);
        stats.byStatus[status] = parseInt(count) || 0;
      }

      return stats;
    } catch (error) {
      console.error('Error in getAlertStats:', error);
      // Return default stats on error
      return {
        bySeverity: { CRITICAL: 0, WARNING: 0, INFO: 0 },
        byStatus: { OPEN: 0, ESCALATED: 0, AUTO_CLOSED: 0, RESOLVED: 0 },
        total: 0
      };
    }
  }

  // Get all alerts for debugging
  async getAllAlerts(limit = 100) {
    try {
      const alertIds = await redisHelpers.smembers(this.ALERTS_SET);
      const limitedIds = alertIds.slice(0, limit);
      
      const alerts = [];
      for (const alertId of limitedIds) {
        const alert = await this.getAlert(alertId);
        if (alert) alerts.push(alert);
      }
      
      return alerts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } catch (error) {
      console.error('Error in getAllAlerts:', error);
      return [];
    }
  }
}

module.exports = new AlertService();