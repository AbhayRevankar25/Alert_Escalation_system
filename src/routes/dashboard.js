const express = require('express');
const dashboardController = require('../controllers/dashboardController');

const router = express.Router();

// ALL DASHBOARD ROUTES ARE PUBLIC FOR DEMO

// API endpoints (public for demo)
router.get('/data', dashboardController.getDashboardData);
router.get('/api/alerts', dashboardController.getAlerts);

// HTML dashboards (public)
router.get('/', dashboardController.renderDashboard);

module.exports = router;