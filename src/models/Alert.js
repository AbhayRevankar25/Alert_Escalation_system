const { v4: uuidv4 } = require('uuid');

class Alert {
  constructor(data) {
    this.alertId = data.alertId || uuidv4();
    this.sourceType = data.sourceType; // overspeed, feedback_negative, document_expiry, safety_incident
    this.driverId = data.driverId;
    this.vehicleId = data.vehicleId || null;
    this.severity = data.severity || 'WARNING'; // INFO, WARNING, CRITICAL
    this.timestamp = data.timestamp || new Date().toISOString();
    this.status = data.status || 'OPEN'; // OPEN, ESCALATED, AUTO_CLOSED, RESOLVED
    this.metadata = data.metadata || {};
    this.escalatedAt = data.escalatedAt || null;
    this.resolvedAt = data.resolvedAt || null;
    this.autoClosedAt = data.autoClosedAt || null;
    this.ruleTriggered = data.ruleTriggered || null;
  }

  toJSON() {
    return {
      alertId: this.alertId,
      sourceType: this.sourceType,
      driverId: this.driverId,
      vehicleId: this.vehicleId,
      severity: this.severity,
      timestamp: this.timestamp,
      status: this.status,
      metadata: this.metadata,
      escalatedAt: this.escalatedAt,
      resolvedAt: this.resolvedAt,
      autoClosedAt: this.autoClosedAt,
      ruleTriggered: this.ruleTriggered
    };
  }

  static fromJSON(data) {
    return new Alert(data);
  }
}

module.exports = Alert;