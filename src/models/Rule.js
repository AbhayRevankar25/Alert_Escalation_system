class Rule {
  constructor(type, config) {
    this.type = type;
    this.escalateIfCount = config.escalate_if_count;
    this.windowMins = config.window_mins;
    this.initialSeverity = config.initial_severity;
    this.escalatedSeverity = config.escalated_severity;
    this.autoCloseAfterMins = config.auto_close_after_mins;
    this.autoCloseIf = config.auto_close_if;
  }

  shouldEscalate(alertCount) {
    return this.escalateIfCount && alertCount >= this.escalateIfCount;
  }

  isExpired(alertTimestamp) {
    if (!this.autoCloseAfterMins) return false;
    
    const alertTime = new Date(alertTimestamp);
    const expiryTime = new Date(alertTime.getTime() + this.autoCloseAfterMins * 60000);
    return new Date() > expiryTime;
  }
}

module.exports = Rule;