const express = require('express');
const router = express.Router();
const TelemedicineSession = require('../models/TelemedicineSession');
const Appointment = require('../models/Appointment');
const { authenticate, authorize } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

// Get telemedicine sessions
router.get('/', authenticate, async (req, res) => {
  try {
    const { patient, doctor, status } = req.query;
    const query = {};

    if (req.user.role === 'patient') {
      query.patient = req.user._id;
    } else if (req.user.role === 'doctor') {
      query.doctor = req.user._id;
    }

    if (patient) query.patient = patient;
    if (doctor) query.doctor = doctor;
    if (status) query.status = status;

    const sessions = await TelemedicineSession.find(query)
      .populate('patient', 'firstName lastName email phone')
      .populate('doctor', 'firstName lastName email specialization')
      .populate('appointment')
      .sort({ scheduledStart: -1 });

    res.json({ sessions });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch telemedicine sessions' });
  }
});

// Get session by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const session = await TelemedicineSession.findById(req.params.id)
      .populate('patient', 'firstName lastName email phone')
      .populate('doctor', 'firstName lastName email specialization')
      .populate('appointment')
      .populate('chatMessages.sender', 'firstName lastName role')
      .populate('sharedDocuments.sharedBy', 'firstName lastName');

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Check access
    const canAccess = req.user.role === 'admin' ||
                      session.patient._id.toString() === req.user._id.toString() ||
                      session.doctor._id.toString() === req.user._id.toString();

    if (!canAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ session });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});

// Create telemedicine session
router.post('/', authenticate, async (req, res) => {
  try {
    const { appointmentId, sessionType } = req.body;

    if (!appointmentId || !sessionType) {
      return res.status(400).json({ error: 'Appointment ID and session type are required' });
    }

    const appointment = await Appointment.findById(appointmentId)
      .populate('patient doctor');

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    if (appointment.appointmentType !== 'telemedicine') {
      return res.status(400).json({ error: 'Appointment is not a telemedicine appointment' });
    }

    // Check if session already exists
    let session = await TelemedicineSession.findOne({ appointment: appointmentId });

    if (!session) {
      const roomId = `room-${uuidv4()}`;

      session = new TelemedicineSession({
        appointment: appointmentId,
        patient: appointment.patient._id,
        doctor: appointment.doctor._id,
        sessionType: sessionType || 'video',
        scheduledStart: appointment.date,
        roomId,
        status: 'scheduled'
      });

      await session.save();
    }

    const populatedSession = await TelemedicineSession.findById(session._id)
      .populate('patient', 'firstName lastName email')
      .populate('doctor', 'firstName lastName email specialization');

    res.status(201).json({
      message: 'Telemedicine session created successfully',
      session: populatedSession
    });
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({ error: 'Failed to create session', details: error.message });
  }
});

// Start session
router.post('/:id/start', authenticate, async (req, res) => {
  try {
    const session = await TelemedicineSession.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Check if user is part of session
    const isParticipant = session.patient.toString() === req.user._id.toString() ||
                          session.doctor.toString() === req.user._id.toString();

    if (!isParticipant && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to start this session' });
    }

    if (session.status !== 'scheduled') {
      return res.status(400).json({ error: 'Session cannot be started in current status' });
    }

    session.status = 'in-progress';
    session.actualStart = new Date();
    await session.save();

    res.json({
      message: 'Session started',
      session
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to start session' });
  }
});

// End session
router.post('/:id/end', authenticate, async (req, res) => {
  try {
    const { summary, notes, followUpRequired, followUpDate, recordingUrl, recordingDuration, vitalSigns } = req.body;

    const session = await TelemedicineSession.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Check authorization
    const isParticipant = session.patient.toString() === req.user._id.toString() ||
                          session.doctor.toString() === req.user._id.toString();

    if (!isParticipant && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to end this session' });
    }

    session.status = 'completed';
    session.actualEnd = new Date();

    if (session.actualStart) {
      session.duration = Math.floor((session.actualEnd - session.actualStart) / 1000);
    }

    if (summary) session.summary = summary;
    if (notes) session.notes = notes;
    if (followUpRequired !== undefined) session.followUpRequired = followUpRequired;
    if (followUpDate) session.followUpDate = followUpDate;
    if (recordingUrl) session.recordingUrl = recordingUrl;
    if (recordingDuration) session.recordingDuration = recordingDuration;
    if (vitalSigns) session.vitalSignsDuringSession = vitalSigns;

    await session.save();

    res.json({
      message: 'Session ended successfully',
      session
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to end session' });
  }
});

// Add chat message
router.post('/:id/messages', authenticate, async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    const session = await TelemedicineSession.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Check if user is part of session
    const isParticipant = session.patient.toString() === req.user._id.toString() ||
                          session.doctor.toString() === req.user._id.toString();

    if (!isParticipant && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    session.chatMessages.push({
      sender: req.user._id,
      message,
      timestamp: new Date()
    });

    await session.save();

    res.status(201).json({
      message: 'Message sent successfully',
      chatMessage: session.chatMessages[session.chatMessages.length - 1]
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Add vital signs during session
router.post('/:id/vitals', authenticate, async (req, res) => {
  try {
    const vitalData = req.body;

    const session = await TelemedicineSession.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    session.vitalSignsDuringSession.push({
      ...vitalData,
      timestamp: new Date(),
      source: vitalData.source || 'manual'
    });

    await session.save();

    res.status(201).json({
      message: 'Vital signs recorded',
      vitalSigns: session.vitalSignsDuringSession[session.vitalSignsDuringSession.length - 1]
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to record vital signs' });
  }
});

// Get room token/info for joining
router.get('/:id/join', authenticate, async (req, res) => {
  try {
    const session = await TelemedicineSession.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Check if user is part of session
    const isParticipant = session.patient.toString() === req.user._id.toString() ||
                          session.doctor.toString() === req.user._id.toString();

    if (!isParticipant && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    res.json({
      roomId: session.roomId,
      sessionType: session.sessionType,
      status: session.status,
      scheduledStart: session.scheduledStart
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get session info' });
  }
});

module.exports = router;