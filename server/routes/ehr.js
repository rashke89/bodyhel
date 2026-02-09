const express = require('express');
const router = express.Router();
const EHR = require('../models/EHR');
const User = require('../models/User');
const { authenticate, authorize } = require('../middleware/auth');
const { validationRules } = require('../middleware/validation');

// Get patient EHR
router.get('/patient/:patientId', authenticate, async (req, res) => {
  try {
    const { patientId } = req.params;

    // Check access - only patient, their doctors, or admin
    const patient = await User.findById(patientId);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const canAccess = req.user.role === 'admin' ||
                      patientId === req.user._id.toString() ||
                      (['doctor', 'nurse'].includes(req.user.role));

    if (!canAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    let ehr = await EHR.findOne({ patient: patientId });

    // Create EHR if doesn't exist (for new patients)
    if (!ehr) {
      ehr = new EHR({
        patient: patientId,
        createdBy: req.user._id
      });
      await ehr.save();
    }

    const populatedEHR = await EHR.findById(ehr._id)
      .populate('patient', 'firstName lastName email phone patientId dateOfBirth gender bloodType')
      .populate('createdBy', 'firstName lastName role')
      .populate('diagnoses.doctor', 'firstName lastName specialization')
      .populate('medicalAlerts.addedBy', 'firstName lastName')
      .populate('vitalSigns.measuredBy', 'firstName lastName')
      .populate('notes.createdBy', 'firstName lastName role');

    res.json({ ehr: populatedEHR });
  } catch (error) {
    console.error('Get EHR error:', error);
    res.status(500).json({ error: 'Failed to fetch EHR' });
  }
});

// Update EHR
router.put('/patient/:patientId', authenticate, authorize('doctor', 'nurse', 'admin'), async (req, res) => {
  try {
    const { patientId } = req.params;
    const updates = req.body;

    let ehr = await EHR.findOne({ patient: patientId });

    if (!ehr) {
      ehr = new EHR({
        patient: patientId,
        createdBy: req.user._id
      });
    }

    // Update diagnoses
    if (updates.diagnoses) {
      updates.diagnoses.forEach(diagnosis => {
        ehr.diagnoses.push({
          ...diagnosis,
          doctor: req.user._id,
          date: new Date()
        });
      });
    }

    // Update medical alerts
    if (updates.medicalAlerts) {
      updates.medicalAlerts.forEach(alert => {
        ehr.medicalAlerts.push({
          ...alert,
          addedBy: req.user._id,
          dateAdded: new Date()
        });
      });
    }

    // Add vital signs
    if (updates.vitalSigns) {
      updates.vitalSigns.forEach(vital => {
        ehr.vitalSigns.push({
          ...vital,
          measuredBy: req.user._id
        });
      });
    }

    // Update medical history
    if (updates.medicalHistory) {
      ehr.medicalHistory = { ...ehr.medicalHistory, ...updates.medicalHistory };
    }

    // Add note
    if (updates.note) {
      ehr.notes.push({
        content: updates.note,
        createdBy: req.user._id,
        category: updates.noteCategory || 'clinical'
      });
    }

    await ehr.save();

    const populatedEHR = await EHR.findById(ehr._id)
      .populate('patient', 'firstName lastName email patientId')
      .populate('diagnoses.doctor', 'firstName lastName specialization');

    res.json({
      message: 'EHR updated successfully',
      ehr: populatedEHR
    });
  } catch (error) {
    console.error('Update EHR error:', error);
    res.status(500).json({ error: 'Failed to update EHR', details: error.message });
  }
});

// Add diagnosis (ICD-10)
router.post('/patient/:patientId/diagnosis', authenticate, authorize('doctor', 'admin'), async (req, res) => {
  try {
    const { patientId } = req.params;
    const { code, description, isPrimary, status } = req.body;

    if (!code || !description) {
      return res.status(400).json({ error: 'ICD-10 code and description are required' });
    }

    let ehr = await EHR.findOne({ patient: patientId });
    if (!ehr) {
      ehr = new EHR({
        patient: patientId,
        createdBy: req.user._id
      });
    }

    // If this is primary, unset other primary diagnoses
    if (isPrimary) {
      ehr.diagnoses.forEach(d => d.isPrimary = false);
    }

    ehr.diagnoses.push({
      code,
      description,
      doctor: req.user._id,
      date: new Date(),
      isPrimary: isPrimary || false,
      status: status || 'active'
    });

    await ehr.save();

    res.status(201).json({
      message: 'Diagnosis added successfully',
      diagnosis: ehr.diagnoses[ehr.diagnoses.length - 1]
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add diagnosis' });
  }
});

// Add medical alert
router.post('/patient/:patientId/alert', authenticate, authorize('doctor', 'nurse', 'admin'), async (req, res) => {
  try {
    const { patientId } = req.params;
    const { type, severity, description, medication, active } = req.body;

    if (!type || !description) {
      return res.status(400).json({ error: 'Alert type and description are required' });
    }

    let ehr = await EHR.findOne({ patient: patientId });
    if (!ehr) {
      ehr = new EHR({
        patient: patientId,
        createdBy: req.user._id
      });
    }

    ehr.medicalAlerts.push({
      type,
      severity: severity || 'medium',
      description,
      medication,
      active: active !== undefined ? active : true,
      addedBy: req.user._id,
      dateAdded: new Date()
    });

    await ehr.save();

    res.status(201).json({
      message: 'Medical alert added successfully',
      alert: ehr.medicalAlerts[ehr.medicalAlerts.length - 1]
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add medical alert' });
  }
});

// Add vital signs
router.post('/patient/:patientId/vitals', authenticate, async (req, res) => {
  try {
    const { patientId } = req.params;
    const vitalData = req.body;

    let ehr = await EHR.findOne({ patient: patientId });
    if (!ehr) {
      ehr = new EHR({
        patient: patientId,
        createdBy: req.user._id
      });
    }

    // Calculate BMI if weight and height provided
    if (vitalData.weight && vitalData.height) {
      const heightInMeters = vitalData.height / 100;
      vitalData.bmi = (vitalData.weight / (heightInMeters * heightInMeters)).toFixed(2);
    }

    ehr.vitalSigns.push({
      ...vitalData,
      measuredBy: req.user._id,
      date: new Date()
    });

    await ehr.save();

    res.status(201).json({
      message: 'Vital signs recorded successfully',
      vitalSigns: ehr.vitalSigns[ehr.vitalSigns.length - 1]
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to record vital signs' });
  }
});

// Upload document to EHR
router.post('/patient/:patientId/documents', authenticate, authorize('doctor', 'nurse', 'admin'), async (req, res) => {
  try {
    const { patientId } = req.params;
    const { type, title, fileUrl, fileSize, mimeType, tags } = req.body;

    if (!type || !title || !fileUrl) {
      return res.status(400).json({ error: 'Document type, title, and file URL are required' });
    }

    let ehr = await EHR.findOne({ patient: patientId });
    if (!ehr) {
      ehr = new EHR({
        patient: patientId,
        createdBy: req.user._id
      });
    }

    ehr.documents.push({
      type,
      title,
      fileUrl,
      fileSize,
      mimeType,
      uploadedBy: req.user._id,
      uploadedAt: new Date(),
      tags: tags || []
    });

    await ehr.save();

    res.status(201).json({
      message: 'Document uploaded successfully',
      document: ehr.documents[ehr.documents.length - 1]
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to upload document' });
  }
});

// Search EHR
router.get('/search', authenticate, authorize('doctor', 'nurse', 'admin'), async (req, res) => {
  try {
    const { patientId, diagnosisCode, alertType, dateFrom, dateTo } = req.query;
    const query = {};

    if (patientId) {
      query.patient = patientId;
    }

    if (diagnosisCode) {
      query['diagnoses.code'] = diagnosisCode;
    }

    if (alertType) {
      query['medicalAlerts.type'] = alertType;
      query['medicalAlerts.active'] = true;
    }

    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    const ehrs = await EHR.find(query)
      .populate('patient', 'firstName lastName email patientId')
      .populate('diagnoses.doctor', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ ehrs, count: ehrs.length });
  } catch (error) {
    res.status(500).json({ error: 'Search failed' });
  }
});

module.exports = router;