const alertService = require('../services/alertService');

class WebhookController {
  async handleDocumentRenewal(req, res) {
    try {
      const { driverId, documentType, renewalDate, documentId } = req.body;

      if (!driverId || !documentType) {
        return res.status(400).json({
          success: false,
          error: 'driverId and documentType are required'
        });
      }

      console.log(`📄 Document renewal webhook: ${documentType} for driver ${driverId}`);

      // Find open document expiry alerts for this driver
      const openAlerts = await alertService.getAlertsByStatus('OPEN');
      const escalatedAlerts = await alertService.getAlertsByStatus('ESCALATED');
      
      const allAlerts = [...openAlerts, ...escalatedAlerts];
      const documentAlerts = allAlerts.filter(alert => 
        alert.sourceType === 'document_expiry' && 
        alert.driverId === driverId &&
        alert.metadata?.documentType === documentType
      );

      let closedCount = 0;
      for (const alert of documentAlerts) {
        await alertService.autoCloseAlert(
          alert.alertId,
          `Document ${documentType} renewed on ${renewalDate || new Date().toISOString().split('T')[0]}`
        );
        closedCount++;
      }

      res.json({
        success: true,
        message: `Processed document renewal for ${driverId}`,
        alertsClosed: closedCount,
        documentType,
        driverId
      });

    } catch (error) {
      console.error('Error processing document renewal webhook:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async handleExternalAlert(req, res) {
    try {
      const { source, type, driverId, data } = req.body;

      if (!source || !type || !driverId) {
        return res.status(400).json({
          success: false,
          error: 'source, type, and driverId are required'
        });
      }

      console.log(`🌐 External alert webhook: ${type} from ${source} for driver ${driverId}`);

      // Map external alert types to internal types
      const typeMapping = {
        'speeding': 'overspeed',
        'speed_violation': 'overspeed',
        'negative_review': 'feedback_negative',
        'poor_rating': 'feedback_negative',
        'document_expiration': 'document_expiry',
        'safety_concern': 'safety_incident'
      };

      const internalType = typeMapping[type] || type;

      // Create alert from webhook
      const alert = await alertService.createAlert({
        sourceType: internalType,
        driverId: driverId,
        metadata: {
          ...data,
          externalSource: source,
          externalType: type,
          receivedVia: 'webhook',
          timestamp: new Date().toISOString()
        }
      });

      res.json({
        success: true,
        message: 'External alert processed successfully',
        alertId: alert.alertId,
        internalType,
        driverId
      });

    } catch (error) {
      console.error('Error processing external alert webhook:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new WebhookController();