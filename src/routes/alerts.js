const express = require('express');
const alertController = require('../controllers/alertController');

const router = express.Router();

router.post('/', alertController.createAlert);
router.get('/stats', alertController.getAlertStats);
router.get('/status/:status', alertController.getAlertsByStatus);
router.get('/:alertId', alertController.getAlert);
router.patch('/:alertId/resolve', alertController.resolveAlert);

module.exports = router;