const fs = require('fs').promises;
const path = require('path');
const Rule = require('../models/Rule');
const redisHelpers = require('../utils/redisHelpers');

class RuleEngine {
  constructor() {
    this.rules = new Map();
    this.ruleFile = path.join(__dirname, '../../rules/alert-rules.json');
  }

  async loadRules() {
    try {
      const rulesData = await fs.readFile(this.ruleFile, 'utf8');
      const rulesConfig = JSON.parse(rulesData);
      
      this.rules.clear();
      for (const [type, config] of Object.entries(rulesConfig)) {
        this.rules.set(type, new Rule(type, config));
      }
      
      console.log('✅ Rules loaded successfully');
    } catch (error) {
      console.error('❌ Error loading rules:', error);
      throw error;
    }
  }

  getRule(alertType) {
    return this.rules.get(alertType);
  }

  async evaluateEscalation(alert) {
    try {
      const rule = this.getRule(alert.sourceType);
      if (!rule || !rule.escalateIfCount) {
        return null;
      }

      // Count similar alerts in the time window
      const windowStart = new Date(Date.now() - rule.windowMins * 60000).getTime();
      
      const similarAlerts = await redisHelpers.zrangebyscore(
        `alerts:${alert.driverId}:${alert.sourceType}`,
        windowStart,
        '+inf'
      );

      const alertCount = similarAlerts.length + 1; // +1 for current alert

      if (rule.shouldEscalate(alertCount)) {
        return {
          shouldEscalate: true,
          reason: `${alertCount} ${alert.sourceType} alerts in last ${rule.windowMins} minutes`,
          newSeverity: rule.escalatedSeverity
        };
      }

      return { shouldEscalate: false };
    } catch (error) {
      console.error('Error in evaluateEscalation:', error);
      return { shouldEscalate: false };
    }
  }

  async storeAlertForEvaluation(alert) {
    try {
      const rule = this.getRule(alert.sourceType);
      if (!rule || !rule.escalateIfCount) return;

      const score = new Date(alert.timestamp).getTime();
      const key = `alerts:${alert.driverId}:${alert.sourceType}`;
      
      await redisHelpers.zadd(key, score, alert.alertId);
      
      // Clean up old alerts outside the evaluation window
      const cutoffTime = Date.now() - (rule.windowMins * 60000);
      await redisHelpers.zremrangebyscore(key, '-inf', cutoffTime);
    } catch (error) {
      console.error('Error in storeAlertForEvaluation:', error);
    }
  }
}

module.exports = new RuleEngine();