const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const EHR = require('../models/EHR');
const Prescription = require('../models/Prescription');
const LabResult = require('../models/LabResult');
const Message = require('../models/Message');
const { authenticate, authorize } = require('../middleware/auth');

// Patient portal routes - all require patient role
router.use(authenticate);
router.use(authorize('patient'));

// Get patient dashboard data
router.get('/dashboard', async (req, res) => {
  try {
    const patientId = req.user._id;

    // Get upcoming appointments
    const upcomingAppointments = await Appointment.find({
      patient: patientId,
      date: { $gte: new Date() },
      status: { $in: ['scheduled', 'confirmed'] }
    })
      .populate('doctor', 'firstName lastName specialization')
      .sort({ date: 1, startTime: 1 })
      .limit(5);

    // Get recent prescriptions
    const recentPrescriptions = await Prescription.find({
      patient: patientId,
      status: 'active'
    })
      .populate('doctor', 'firstName lastName specialization')
      .sort({ issueDate: -1 })
      .limit(5);

    // Get unread messages
    const unreadMessagesCount = await Message.countDocuments({
      recipient: patientId,
      read: false
    });

    // Get recent lab results
    const recentLabResults = await LabResult.find({
      patient: patientId,
      status: 'completed'
    })
      .populate('orderedBy', 'firstName lastName')
      .sort({ resultDate: -1 })
      .limit(5);

    // Get medical alerts
    const ehr = await EHR.findOne({ patient: patientId });
    const activeAlerts = ehr ? ehr.medicalAlerts.filter(alert => alert.active) : [];

    res.json({
      upcomingAppointments,
      recentPrescriptions,
      unreadMessagesCount,
      recentLabResults,
      activeAlerts: activeAlerts.slice(0, 5),
      summary: {
        totalAppointments: upcomingAppointments.length,
        activePrescriptions: recentPrescriptions.length,
        unreadMessages: unreadMessagesCount,
        recentLabResults: recentLabResults.length
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Get patient's medical records summary
router.get('/medical-records', async (req, res) => {
  try {
    const patientId = req.user._id;

    const ehr = await EHR.findOne({ patient: patientId })
      .populate('diagnoses.doctor', 'firstName lastName specialization')
      .populate('medicalAlerts.addedBy', 'firstName lastName')
      .populate('vitalSigns.measuredBy', 'firstName lastName')
      .populate('documents.uploadedBy', 'firstName lastName');

    if (!ehr) {
      return res.json({ ehr: null, message: 'No medical records found' });
    }

    // Return summary
    res.json({
      ehr: {
        diagnoses: ehr.diagnoses,
        medicalAlerts: ehr.medicalAlerts.filter(alert => alert.active),
        recentVitalSigns: ehr.vitalSigns.slice(-10).reverse(),
        documents: ehr.documents,
        medicalHistory: ehr.medicalHistory
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch medical records' });
  }
});

// Get patient's documents
router.get('/documents', async (req, res) => {
  try {
    const { type } = req.query;
    const ehr = await EHR.findOne({ patient: req.user._id });

    if (!ehr) {
      return res.json({ documents: [] });
    }

    let documents = ehr.documents;
    if (type) {
      documents = documents.filter(doc => doc.type === type);
    }

    // Sort by upload date, newest first
    documents.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

    res.json({ documents });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// Get patient's appointments
router.get('/appointments', async (req, res) => {
  try {
    const { status, upcoming, past } = req.query;
    const query = { patient: req.user._id };

    if (status) {
      query.status = status;
    } else if (upcoming === 'true') {
      query.date = { $gte: new Date() };
      query.status = { $in: ['scheduled', 'confirmed'] };
    } else if (past === 'true') {
      query.date = { $lt: new Date() };
      query.status = { $in: ['completed', 'cancelled'] };
    }

    const appointments = await Appointment.find(query)
      .populate('doctor', 'firstName lastName email specialization department')
      .sort({ date: -1 });

    res.json({ appointments });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// Book appointment (for patient)
router.post('/appointments', async (req, res) => {
  try {
    const { doctor, appointmentType, date, startTime, endTime, reason } = req.body;

    if (!doctor || !date || !startTime || !endTime) {
      return res.status(400).json({ error: 'Doctor, date, start time, and end time are required' });
    }

    // Check if doctor exists and is active
    const doctorUser = await User.findById(doctor);
    if (!doctorUser || doctorUser.role !== 'doctor' || !doctorUser.isActive) {
      return res.status(400).json({ error: 'Invalid or inactive doctor' });
    }

    // Check for time conflicts
    const conflictingAppointment = await Appointment.findOne({
      doctor,
      date,
      status: { $nin: ['cancelled', 'no-show'] },
      $or: [
        {
          startTime: { $lt: endTime },
          endTime: { $gt: startTime }
        }
      ]
    });

    if (conflictingAppointment) {
      return res.status(400).json({ error: 'Time slot already booked' });
    }

    const appointment = new Appointment({
      patient: req.user._id,
      doctor,
      appointmentType: appointmentType || 'consultation',
      date,
      startTime,
      endTime,
      duration: calculateDuration(startTime, endTime),
      reason,
      status: 'scheduled',
      organization: doctorUser.organization || undefined
    });

    await appointment.save();

    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('doctor', 'firstName lastName email specialization');

    res.status(201).json({
      message: 'Appointment booked successfully',
      appointment: populatedAppointment
    });
  } catch (error) {
    console.error('Book appointment error:', error);
    res.status(500).json({ error: 'Failed to book appointment', details: error.message });
  }
});

// Helper function to calculate duration
function calculateDuration(startTime, endTime) {
  const [startHours, startMinutes] = startTime.split(':').map(Number);
  const [endHours, endMinutes] = endTime.split(':').map(Number);
  
  const startTotal = startHours * 60 + startMinutes;
  const endTotal = endHours * 60 + endMinutes;
  
  return endTotal - startTotal;
}

// Get patient's prescriptions
router.get('/prescriptions', async (req, res) => {
  try {
    const { status } = req.query;
    const query = { patient: req.user._id };

    if (status) query.status = status;

    const prescriptions = await Prescription.find(query)
      .populate('doctor', 'firstName lastName specialization')
      .populate('appointment')
      .sort({ issueDate: -1 });

    res.json({ prescriptions });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch prescriptions' });
  }
});

// Get patient's lab results
router.get('/lab-results', async (req, res) => {
  try {
    const { status, testType } = req.query;
    const query = { patient: req.user._id };

    if (status) query.status = status;
    if (testType) query.testType = testType;

    const labResults = await LabResult.find(query)
      .populate('orderedBy', 'firstName lastName specialization')
      .populate('reviewedBy', 'firstName lastName')
      .sort({ orderedDate: -1 });

    res.json({ labResults });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch lab results' });
  }
});

// Get available doctors for booking
router.get('/doctors', async (req, res) => {
  try {
    const { specialization } = req.query;
    const query = { role: 'doctor', isActive: true };

    if (specialization) {
      query.specialization = new RegExp(specialization, 'i');
    }

    const doctors = await User.find(query)
      .select('firstName lastName email specialization department licenseNumber')
      .sort({ lastName: 1, firstName: 1 });

    res.json({ doctors });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch doctors' });
  }
});

module.exports = router;