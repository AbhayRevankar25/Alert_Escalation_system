## Alert Management System - Enhanced Dashboard

A comprehensive alert management and escalation system with real-time monitoring capabilities.  
This system provides a modern, responsive dashboard for tracking, analyzing, and managing alerts across driver operations.

---

## Features

### 🔐 Authentication & Security
- Role-based access control (Admin, Operator, Viewer)
- JWT token authentication
- Secure login with demo credentials
- API token management

### 📊 Real-time Monitoring
- Live alert statistics with trend indicators
- Interactive charts showing 7-day alert trends
- Top drivers with most open alerts
- Auto-closed alerts tracking

### ⚡ Alert Management
- Create new alerts with multiple types
- Severity classification (Critical, Warning, Info)
- Driver and vehicle tracking
- Alert lifecycle management

### 🔍 Analytics & Insights
- System insights with trend analysis
- Performance metrics
- Historical data visualization
- Smart trend detection

### 🛠️ System Operations
- Webhook testing for document renewal
- System health monitoring
- API token generation
- Auto-refresh capabilities

---

## Demo Credentials

| Role | Username | Password |
|------|----------|----------|
| 👑 Admin | `admin` | `admin123` |
| 👨‍💼 Operator | `operator` | `operator123` |
| 👁️ Viewer | `viewer` | `viewer123` |

---

## Technical Implementation

## Architecture & Design Patterns

### Object-Oriented Principles ✅

```m
// Encapsulation
class AlertService {
  constructor() {
    this.ALERT_PREFIX = 'alert:'; // Private constant
  }
  
  async createAlert(alertData) { // Public interface
    const alert = new Alert(alertData);
    await this.#storeAlert(alert); // Private method
  }
  
  #storeAlert(alert) { // Private implementation
    // Internal storage logic
  }
}

// Inheritance & Polymorphism
class Rule {
  constructor(type, config) {
    this.type = type;
    this.config = config;
  }
  
  evaluate(alert) {
    // Base evaluation logic
  }
}

class TimeBasedRule extends Rule {
  evaluate(alert) {
    // Specialized time-based evaluation
    return super.evaluate(alert);
  }
}

```
## Time & Space Complexity Analysis ✅

| Operation            | Time Complexity | Space Complexity | Implementation                     |
|----------------------|------------------|------------------|------------------------------------|
| Alert Creation       | O(1) average     | O(n)             | Redis hash set                     |
| Rule Evaluation      | O(log n + m)     | O(1)             | Sorted set query + iteration       |
| Statistics Retrieval | O(1)             | O(1)             | Redis set cardinality              |
| Dashboard Loading    | O(k)             | O(k)             | Multiple parallel queries          |

## Efficient Algorithms

- Time-window queries using Redis sorted sets (O(log n))

- O(1) alert retrieval via Redis hashes

- Pre-computed aggregations for statistics

- Background job optimization with safety locks

## Fault Tolerance & Error Handling
System Failure Handling

```md
// Redis connection retry with exponential backoff
const redis = new Redis({
  host: 'localhost',
  port: 6379,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
});

// Graceful degradation
async sadd(key, ...members) {
  try {
    return await redis.sadd(key, ...members);
  } catch (error) {
    console.error(`Redis operation failed for ${key}`, error);
    return 0; // System continues with default value
  }
}

// Background job safety with locks
async autoCloseExpiredAlerts() {
  if (this.isRunning) {
    console.log('Job already running, skipping...');
    return;
  }
  
  this.isRunning = true;
  try {
    // Process alerts
  } finally {
    this.isRunning = false; // Always release lock
  }
}
```
## Caching Strategy


