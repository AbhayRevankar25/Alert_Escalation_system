const express = require('express');
const path = require('path');
const cors = require('cors');
const ruleEngine = require('./services/ruleEngine');
const backgroundJobs = require('./services/backgroundJobs');
const redisConfig = require('./config/redis');
const redisHelpers = require('./utils/redisHelpers');

// Routes
const alertRoutes = require('./routes/alerts');
const dashboardRoutes = require('./routes/dashboard');
const authRoutes = require('./routes/auth');
const analyticsRoutes = require('./routes/analytics');
const webhookRoutes = require('./routes/webhooks');

// Middleware
const rateLimit = require('./middleware/rateLimit');
const authMiddleware = require('./middleware/auth');

// Controllers
const dashboardController = require('./controllers/dashboardController');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set EJS as templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// Global rate limiting (except for health and static files)
app.use(rateLimit.limit());

// ========== PUBLIC ROUTES (No authentication required) ==========

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const redisConnected = await redisConfig.testConnection();
    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      service: 'Alert Escalation System',
      redis: redisConnected ? 'connected' : 'disconnected'
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      error: error.message
    });
  }
});

// Debug endpoint
app.get('/debug/alerts', async (req, res) => {
  try {
    const alertService = require('./services/alertService');
    const alerts = await alertService.getAllAlerts(20);
    res.json({
      success: true,
      count: alerts.length,
      alerts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Authentication routes
app.use('/api/auth', authRoutes);

// Webhook routes
app.use('/api/webhooks', webhookRoutes);

// ========== DASHBOARD ROUTES (Completely public for demo) ==========

// Dashboard routes (PUBLIC - no auth middleware)
app.use('/dashboard', dashboardRoutes);

// Enhanced dashboard route (PUBLIC)
app.get('/dashboard/enhanced', dashboardController.renderEnhancedDashboard);

// Root endpoint - redirect to basic dashboard
app.get('/', (req, res) => {
  res.redirect('/dashboard');
});

// ========== PROTECTED API ROUTES (Authentication required) ==========

// Alert routes (protected)
app.use('/api/alerts', 
  authMiddleware.verifyToken, 
  authMiddleware.requireOperator, 
  rateLimit.userLimit(), 
  alertRoutes
);

// Analytics routes (protected)
app.use('/api/analytics', 
  authMiddleware.verifyToken, 
  rateLimit.userLimit(), 
  analyticsRoutes
);

// ========== ERROR HANDLING ==========

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

async function initializeApp() {
  try {
    console.log('🚀 Initializing Alert Escalation System...');
    
    // Test Redis connection
    const redisConnected = await redisConfig.testConnection();
    if (!redisConnected) {
      console.warn('⚠️  Redis connection test failed, but continuing...');
    }

    // Test Redis commands
    await redisHelpers.testRedisCommands();

    // Load rules
    await ruleEngine.loadRules();
    
    // Start background jobs
    backgroundJobs.start();
    
    // Start server
    app.listen(PORT, () => {
      console.log(`✅ Alert Escalation System running on port ${PORT}`);
      console.log(`📊 Public Dashboard: http://localhost:${PORT}/dashboard`);
      console.log(`🌟 Enhanced Dashboard: http://localhost:${PORT}/dashboard/enhanced`);
      console.log(`🔧 API Health check: http://localhost:${PORT}/health`);
      console.log(`🐛 Debug endpoint: http://localhost:${PORT}/debug/alerts`);
      console.log(`🔐 Protected APIs: /api/alerts, /api/analytics`);
      console.log(`🔑 Demo Login: operator/operator123`);
    });
  } catch (error) {
    console.error('❌ Failed to initialize application:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

initializeApp();

module.exports = app;