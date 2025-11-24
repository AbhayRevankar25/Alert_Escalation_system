const cron = require('node-cron');
const alertService = require('./alertService');
const ruleEngine = require('./ruleEngine');

class BackgroundJobs {
  constructor() {
    this.isRunning = false;
  }

  start() {
    console.log('🔄 Starting background jobs...');

    // Run every 2 minutes for auto-closing alerts
    cron.schedule('*/2 * * * *', async () => {
      if (this.isRunning) {
        console.log('⏳ Background job already running, skipping...');
        return;
      }
      
      this.isRunning = true;
      try {
        await this.autoCloseExpiredAlerts();
        console.log('✅ Auto-close background job completed');
      } catch (error) {
        console.error('❌ Error in auto-close background job:', error);
      } finally {
        this.isRunning = false;
      }
    });

    // Run every 5 minutes for re-evaluating escalations
    cron.schedule('*/5 * * * *', async () => {
      try {
        await this.reevaluateEscalations();
        console.log('✅ Escalation re-evaluation job completed');
      } catch (error) {
        console.error('❌ Error in escalation re-evaluation job:', error);
      }
    });

    console.log('✅ Background jobs started successfully');
  }

  async autoCloseExpiredAlerts() {
    try {
      const openAlerts = await alertService.getAlertsByStatus('OPEN');
      const escalatedAlerts = await alertService.getAlertsByStatus('ESCALATED');
      const allAlerts = [...openAlerts, ...escalatedAlerts];

      console.log(`🔍 Checking ${allAlerts.length} alerts for auto-close...`);

      for (const alert of allAlerts) {
        const rule = ruleEngine.getRule(alert.sourceType);
        if (rule && rule.isExpired(alert.timestamp)) {
          await alertService.autoCloseAlert(
            alert.alertId, 
            `Alert expired after ${rule.autoCloseAfterMins} minutes`
          );
        }
      }
    } catch (error) {
      console.error('Error in autoCloseExpiredAlerts:', error);
      throw error;
    }
  }

  async reevaluateEscalations() {
    try {
      const openAlerts = await alertService.getAlertsByStatus('OPEN');
      console.log(`🔍 Re-evaluating ${openAlerts.length} open alerts for escalation...`);
      
      for (const alert of openAlerts) {
        const escalationResult = await ruleEngine.evaluateEscalation(alert);
        if (escalationResult && escalationResult.shouldEscalate) {
          await alertService.escalateAlert(alert.alertId, escalationResult);
        }
      }
    } catch (error) {
      console.error('Error in reevaluateEscalations:', error);
      throw error;
    }
  }
}

module.exports = new BackgroundJobs();