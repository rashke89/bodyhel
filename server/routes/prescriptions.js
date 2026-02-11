const express = require('express');
const router = express.Router();
const Prescription = require('../models/Prescription');
const EHR = require('../models/EHR');
const { authenticate, authorize } = require('../middleware/auth');
const { validationRules } = require('../middleware/validation');
const { generatePrescriptionPDF } = require('../utils/pdfGenerator');

// Download prescription as PDF
router.get('/:id/pdf', authenticate, async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate('patient', 'firstName lastName email patientId dateOfBirth')
      .populate('doctor', 'firstName lastName specialization licenseNumber');

    if (!prescription) {
      return res.status(404).json({ error: 'Prescription not found' });
    }

    const canAccess = req.user.role === 'admin' ||
                      prescription.patient._id.toString() === req.user._id.toString() ||
                      prescription.doctor._id.toString() === req.user._id.toString();
    if (!canAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const pdfBytes = await generatePrescriptionPDF(prescription);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=recept-${prescription.ePrescriptionId || prescription._id}.pdf`);
    res.send(Buffer.from(pdfBytes));
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

// Get prescriptions
router.get('/', authenticate, async (req, res) => {
  try {
    const { patient, doctor, status } = req.query;
    const query = {};

    // Role-based filtering
    if (req.user.role === 'patient') {
      query.patient = req.user._id;
    } else if (req.user.role === 'doctor') {
      query.doctor = req.user._id;
    }

    if (patient) query.patient = patient;
    if (doctor) query.doctor = doctor;
    if (status) query.status = status;

    const prescriptions = await Prescription.find(query)
      .populate('patient', 'firstName lastName email patientId')
      .populate('doctor', 'firstName lastName specialization')
      .populate('appointment')
      .sort({ issueDate: -1 });

    res.json({ prescriptions });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch prescriptions' });
  }
});

// Get prescription by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate('patient', 'firstName lastName email patientId dateOfBirth')
      .populate('doctor', 'firstName lastName specialization licenseNumber')
      .populate('appointment');

    if (!prescription) {
      return res.status(404).json({ error: 'Prescription not found' });
    }

    // Check access
    const canAccess = req.user.role === 'admin' ||
                      prescription.patient._id.toString() === req.user._id.toString() ||
                      prescription.doctor._id.toString() === req.user._id.toString();

    if (!canAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ prescription });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch prescription' });
  }
});

// Create prescription
router.post('/', authenticate, authorize('doctor', 'admin'), validationRules.createPrescription, async (req, res) => {
  try {
    const prescriptionData = {
      ...req.body,
      doctor: req.user.role === 'doctor' ? req.user._id : req.body.doctor,
      issueDate: new Date()
    };

    // Set organization
    if (req.user.organization) {
      prescriptionData.organization = req.user.organization;
    }

    // Generate e-prescription ID
    prescriptionData.ePrescriptionId = `EP${Date.now()}${Math.floor(Math.random() * 1000)}`;

    const prescription = new Prescription(prescriptionData);
    await prescription.save();

    // Add to EHR
    let ehr = await EHR.findOne({ patient: prescription.patient });
    if (ehr && prescription.diagnosis) {
      ehr.diagnoses.push({
        code: prescription.diagnosis.code,
        description: prescription.diagnosis.description,
        doctor: prescription.doctor,
        date: new Date()
      });
      await ehr.save();
    }

    const populatedPrescription = await Prescription.findById(prescription._id)
      .populate('patient', 'firstName lastName email patientId')
      .populate('doctor', 'firstName lastName specialization');

    res.status(201).json({
      message: 'Prescription created successfully',
      prescription: populatedPrescription
    });
  } catch (error) {
    console.error('Create prescription error:', error);
    res.status(500).json({ error: 'Failed to create prescription', details: error.message });
  }
});

// Update prescription
router.put('/:id', authenticate, authorize('doctor', 'admin'), async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id);
    if (!prescription) {
      return res.status(404).json({ error: 'Prescription not found' });
    }

    // Only prescribing doctor or admin can update
    if (prescription.doctor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Cannot update this prescription' });
    }

    const allowedUpdates = ['medications', 'status', 'notes', 'expiryDate'];
    const updates = {};

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    Object.assign(prescription, updates);
    await prescription.save();

    res.json({
      message: 'Prescription updated successfully',
      prescription
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update prescription' });
  }
});

module.exports = router;