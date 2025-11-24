const express = require('express');
const analyticsController = require('../controllers/analyticsController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.get('/time-series', authMiddleware.verifyToken, analyticsController.getTimeSeries);
router.get('/insights', authMiddleware.verifyToken, analyticsController.getInsights);
router.get('/dashboard-data', authMiddleware.verifyToken, analyticsController.getDashboardData);
router.get('/alerts/:alertId/details', authMiddleware.verifyToken, analyticsController.getAlertDetails);
// Add this route to analytics routes
router.post('/generate-sample-data', authMiddleware.verifyToken, async (req, res) => {
    try {
        const analyticsService = require('../services/analyticsService');
        const timeSeries = await analyticsService.generateSampleTrendData();
        
        res.json({
            success: true,
            message: 'Sample trend data generated successfully',
            data: timeSeries
        });
    } catch (error) {
        console.error('Error generating sample data:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;