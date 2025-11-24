const express = require('express');
const webhookController = require('../controllers/webhookController');

const router = express.Router();

// Webhook endpoints (typically don't require auth, but can use API keys)
router.post('/document-renewal', webhookController.handleDocumentRenewal);
router.post('/external-alert', webhookController.handleExternalAlert);

module.exports = router;