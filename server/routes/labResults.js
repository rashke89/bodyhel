const express = require('express');
const router = express.Router();
const LabResult = require('../models/LabResult');
const { authenticate, authorize } = require('../middleware/auth');
const { generateLabResultPDF } = require('../utils/pdfGenerator');

// Download lab result as PDF
router.get('/:id/pdf', authenticate, async (req, res) => {
  try {
    const labResult = await LabResult.findById(req.params.id)
      .populate('patient', 'firstName lastName email patientId dateOfBirth')
      .populate('orderedBy', 'firstName lastName specialization')
      .populate('reviewedBy', 'firstName lastName');

    if (!labResult) {
      return res.status(404).json({ error: 'Lab result not found' });
    }

    const canAccess = req.user.role === 'admin' ||
                      labResult.patient._id.toString() === req.user._id.toString() ||
                      ['doctor', 'nurse'].includes(req.user.role);
    if (!canAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const pdfBytes = await generateLabResultPDF(labResult);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=nalaz-${labResult.orderNumber}.pdf`);
    res.send(Buffer.from(pdfBytes));
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

// Get lab results
router.get('/', authenticate, async (req, res) => {
  try {
    const { patient, status, testType } = req.query;
    const query = {};

    // Role-based filtering
    if (req.user.role === 'patient') {
      query.patient = req.user._id;
    }

    if (patient) query.patient = patient;
    if (status) query.status = status;
    if (testType) query.testType = testType;

    const labResults = await LabResult.find(query)
      .populate('patient', 'firstName lastName email patientId')
      .populate('orderedBy', 'firstName lastName specialization')
      .populate('reviewedBy', 'firstName lastName')
      .populate('appointment')
      .sort({ orderedDate: -1 });

    res.json({ labResults });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch lab results' });
  }
});

// Get lab result by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const labResult = await LabResult.findById(req.params.id)
      .populate('patient', 'firstName lastName email patientId dateOfBirth')
      .populate('orderedBy', 'firstName lastName specialization')
      .populate('reviewedBy', 'firstName lastName');

    if (!labResult) {
      return res.status(404).json({ error: 'Lab result not found' });
    }

    // Check access
    const canAccess = req.user.role === 'admin' ||
                      labResult.patient._id.toString() === req.user._id.toString() ||
                      ['doctor', 'nurse'].includes(req.user.role);

    if (!canAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ labResult });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch lab result' });
  }
});

// Order lab test
router.post('/', authenticate, authorize('doctor', 'admin'), async (req, res) => {
  try {
    const { patient, testType, testName, appointment } = req.body;

    if (!patient || !testType || !testName) {
      return res.status(400).json({ error: 'Patient, test type, and test name are required' });
    }

    const orderNumber = `LAB${Date.now()}${Math.floor(Math.random() * 1000)}`;

    const labResult = new LabResult({
      patient,
      orderNumber,
      orderedBy: req.user._id,
      appointment,
      testType,
      testName,
      orderedDate: new Date(),
      status: 'ordered'
    });

    await labResult.save();

    const populatedLabResult = await LabResult.findById(labResult._id)
      .populate('patient', 'firstName lastName email patientId')
      .populate('orderedBy', 'firstName lastName specialization');

    res.status(201).json({
      message: 'Lab test ordered successfully',
      labResult: populatedLabResult
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to order lab test', details: error.message });
  }
});

// Update lab result (for lab staff/admin)
router.put('/:id', authenticate, authorize('doctor', 'nurse', 'admin'), async (req, res) => {
  try {
    const labResult = await LabResult.findById(req.params.id);
    if (!labResult) {
      return res.status(404).json({ error: 'Lab result not found' });
    }

    const allowedUpdates = ['collectedDate', 'resultDate', 'results', 'findings', 'interpretation', 'status', 'attachments'];
    const updates = {};

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    // If results are being added, update status
    if (updates.results && updates.results.length > 0) {
      updates.status = updates.status || 'completed';
      updates.resultDate = updates.resultDate || new Date();
    }

    Object.assign(labResult, updates);
    await labResult.save();

    res.json({
      message: 'Lab result updated successfully',
      labResult
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update lab result' });
  }
});

// Review lab result (doctor reviews and approves)
router.post('/:id/review', authenticate, authorize('doctor', 'admin'), async (req, res) => {
  try {
    const { interpretation, notes } = req.body;

    const labResult = await LabResult.findById(req.params.id);
    if (!labResult) {
      return res.status(404).json({ error: 'Lab result not found' });
    }

    labResult.reviewedBy = req.user._id;
    labResult.reviewedAt = new Date();
    if (interpretation) labResult.interpretation = interpretation;

    await labResult.save();

    res.json({
      message: 'Lab result reviewed successfully',
      labResult
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to review lab result' });
  }
});

module.exports = router;