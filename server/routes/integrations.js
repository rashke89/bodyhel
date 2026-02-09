const express = require('express');
const router = express.Router();
const externalServices = require('../integrations/externalServices');
const { authenticate, authorize } = require('../middleware/auth');

// All integration routes require authentication
router.use(authenticate);

// Verify insurance with RFZO
router.post('/rfzo/verify-insurance', authorize('receptionist', 'admin', 'doctor'), async (req, res) => {
  try {
    const { insuranceNumber } = req.body;

    if (!insuranceNumber) {
      return res.status(400).json({ error: 'Insurance number is required' });
    }

    const result = await externalServices.verifyInsurance(insuranceNumber);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to verify insurance', details: error.message });
  }
});

// Submit claim to RFZO
router.post('/rfzo/submit-claim', authorize('admin'), async (req, res) => {
  try {
    const result = await externalServices.submitClaim(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit claim', details: error.message });
  }
});

// Get ICD-10 codes
router.get('/izjzs/icd10', authorize('doctor', 'nurse', 'admin'), async (req, res) => {
  try {
    const { search } = req.query;
    const codes = await externalServices.getICD10Codes(search);
    res.json({ codes });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch ICD-10 codes' });
  }
});

// Submit epidemiological data to IZJZS
router.post('/izjzs/epidemiological', authorize('admin'), async (req, res) => {
  try {
    const result = await externalServices.submitEpidemiologicalData(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit epidemiological data', details: error.message });
  }
});

// Send lab order to LIS
router.post('/lis/send-order', authorize('doctor', 'admin'), async (req, res) => {
  try {
    const result = await externalServices.sendLabOrder(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to send lab order', details: error.message });
  }
});

// Webhook endpoint for LIS results
router.post('/lis/webhook', async (req, res) => {
  try {
    // Verify webhook signature in production
    const webhookSecret = req.headers['x-webhook-secret'];
    if (webhookSecret !== process.env.LIS_WEBHOOK_SECRET) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await externalServices.receiveLabResults(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to process webhook' });
  }
});

// Send imaging order to RIS
router.post('/ris/send-order', authorize('doctor', 'admin'), async (req, res) => {
  try {
    const result = await externalServices.sendImagingOrder(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to send imaging order', details: error.message });
  }
});

// Webhook endpoint for RIS results
router.post('/ris/webhook', async (req, res) => {
  try {
    // Verify webhook signature in production
    const webhookSecret = req.headers['x-webhook-secret'];
    if (webhookSecret !== process.env.RIS_WEBHOOK_SECRET) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await externalServices.receiveImagingResults(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to process webhook' });
  }
});

module.exports = router;