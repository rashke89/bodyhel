const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const { authenticate, authorize, authorizeOwnershipOrAdmin } = require('../middleware/auth');
const { validationRules } = require('../middleware/validation');
const auditLog = require('../middleware/audit');

// Get all appointments (with filters)
router.get('/', authenticate, async (req, res) => {
  try {
    const { patient, doctor, status, date, startDate, endDate } = req.query;
    const query = {};

    // Role-based filtering
    if (req.user.role === 'patient') {
      query.patient = req.user._id;
    } else if (req.user.role === 'doctor' || req.user.role === 'nurse') {
      query.doctor = req.user._id;
    } else if (req.user.role !== 'admin') {
      // Receptionist can see all, but let's filter by specific criteria
    }

    // Additional filters
    if (patient) query.patient = patient;
    if (doctor) query.doctor = doctor;
    if (status) query.status = status;
    
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query.date = { $gte: startOfDay, $lte: endOfDay };
    }

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const appointments = await Appointment.find(query)
      .populate('patient', 'firstName lastName email phone patientId')
      .populate('doctor', 'firstName lastName email specialization')
      .sort({ date: 1, startTime: 1 });

    res.json({ appointments });
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// Get appointment by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('patient', 'firstName lastName email phone patientId dateOfBirth bloodType')
      .populate('doctor', 'firstName lastName email specialization department')
      .populate('originalAppointment');

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Check access
    const isOwner = appointment.patient._id.toString() === req.user._id.toString() ||
                    appointment.doctor._id.toString() === req.user._id.toString();
    
    if (!isOwner && !['admin', 'receptionist'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ appointment });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch appointment' });
  }
});

// Create new appointment
router.post('/', authenticate, validationRules.createAppointment, async (req, res) => {
  try {
    const appointmentData = {
      ...req.body,
      createdBy: req.user._id
    };

    // Check if doctor exists and is active
    const doctor = await User.findById(req.body.doctor);
    if (!doctor || doctor.role !== 'doctor' || !doctor.isActive) {
      return res.status(400).json({ error: 'Invalid or inactive doctor' });
    }

    // Check if patient exists
    if (req.user.role !== 'patient') {
      const patient = await User.findById(req.body.patient);
      if (!patient || patient.role !== 'patient') {
        return res.status(400).json({ error: 'Invalid patient' });
      }
    } else {
      appointmentData.patient = req.user._id;
    }

    // Check for time conflicts
    const conflictingAppointment = await Appointment.findOne({
      doctor: appointmentData.doctor,
      date: appointmentData.date,
      status: { $nin: ['cancelled', 'no-show'] },
      $or: [
        {
          startTime: { $lt: appointmentData.endTime },
          endTime: { $gt: appointmentData.startTime }
        }
      ]
    });

    if (conflictingAppointment) {
      return res.status(400).json({ 
        error: 'Time slot already booked',
        conflictingAppointment: conflictingAppointment._id
      });
    }

    const appointment = new Appointment(appointmentData);
    await appointment.save();

    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('patient', 'firstName lastName email phone')
      .populate('doctor', 'firstName lastName email specialization');

    res.status(201).json({
      message: 'Appointment created successfully',
      appointment: populatedAppointment
    });
  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({ error: 'Failed to create appointment', details: error.message });
  }
});

// Update appointment
router.put('/:id', authenticate, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Check permissions
    const canEdit = req.user.role === 'admin' ||
                    req.user.role === 'receptionist' ||
                    appointment.doctor.toString() === req.user._id.toString() ||
                    (req.user.role === 'patient' && appointment.patient.toString() === req.user._id.toString() && appointment.status === 'scheduled');

    if (!canEdit) {
      return res.status(403).json({ error: 'Cannot edit this appointment' });
    }

    const allowedUpdates = ['date', 'startTime', 'endTime', 'duration', 'reason', 'notes', 'status', 'roomNumber', 'bedNumber', 'isRecurring', 'recurringPattern', 'recurringEndDate'];
    const updates = {};
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    Object.assign(appointment, updates);
    await appointment.save();

    const updatedAppointment = await Appointment.findById(appointment._id)
      .populate('patient', 'firstName lastName email phone')
      .populate('doctor', 'firstName lastName email specialization');

    res.json({
      message: 'Appointment updated successfully',
      appointment: updatedAppointment
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update appointment', details: error.message });
  }
});

// Reschedule appointment
router.post('/:id/reschedule', authenticate, async (req, res) => {
  try {
    const { newDate, newStartTime, newEndTime, reason } = req.body;

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Check if can reschedule
    const canReschedule = req.user.role === 'admin' ||
                          req.user.role === 'receptionist' ||
                          appointment.doctor.toString() === req.user._id.toString() ||
                          (req.user.role === 'patient' && appointment.patient.toString() === req.user._id.toString());

    if (!canReschedule) {
      return res.status(403).json({ error: 'Cannot reschedule this appointment' });
    }

    // Check for conflicts at new time
    const conflictingAppointment = await Appointment.findOne({
      _id: { $ne: appointment._id },
      doctor: appointment.doctor,
      date: newDate,
      status: { $nin: ['cancelled', 'no-show'] },
      $or: [
        {
          startTime: { $lt: newEndTime },
          endTime: { $gt: newStartTime }
        }
      ]
    });

    if (conflictingAppointment) {
      return res.status(400).json({ error: 'Time slot already booked' });
    }

    // Store original appointment reference
    const originalDate = appointment.date;
    const originalStartTime = appointment.startTime;

    appointment.date = newDate;
    appointment.startTime = newStartTime;
    appointment.endTime = newEndTime;
    appointment.rescheduledFrom = originalDate;
    appointment.status = 'rescheduled';
    if (reason) appointment.notes = (appointment.notes || '') + `\nRescheduled: ${reason}`;

    await appointment.save();

    res.json({
      message: 'Appointment rescheduled successfully',
      appointment
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reschedule appointment', details: error.message });
  }
});

// Cancel appointment
router.post('/:id/cancel', authenticate, async (req, res) => {
  try {
    const { reason } = req.body;

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    const canCancel = req.user.role === 'admin' ||
                      req.user.role === 'receptionist' ||
                      appointment.doctor.toString() === req.user._id.toString() ||
                      appointment.patient.toString() === req.user._id.toString();

    if (!canCancel) {
      return res.status(403).json({ error: 'Cannot cancel this appointment' });
    }

    appointment.status = 'cancelled';
    if (reason) {
      appointment.notes = (appointment.notes || '') + `\nCancelled: ${reason}`;
    }
    await appointment.save();

    res.json({ message: 'Appointment cancelled successfully', appointment });
  } catch (error) {
    res.status(500).json({ error: 'Failed to cancel appointment' });
  }
});

// Delete appointment
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Check permissions - only admin, receptionist, or appointment owner can delete
    const canDelete = req.user.role === 'admin' ||
                      req.user.role === 'receptionist' ||
                      appointment.doctor.toString() === req.user._id.toString() ||
                      appointment.patient.toString() === req.user._id.toString();

    if (!canDelete) {
      return res.status(403).json({ error: 'Cannot delete this appointment' });
    }

    await Appointment.findByIdAndDelete(req.params.id);

    res.json({ message: 'Appointment deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete appointment', details: error.message });
  }
});

// Get doctor's available time slots
router.get('/availability/:doctorId', authenticate, async (req, res) => {
  try {
    const { date } = req.query;
    const doctorId = req.params.doctorId;

    if (!date) {
      return res.status(400).json({ error: 'Date parameter is required' });
    }

    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Get booked appointments
    const bookedAppointments = await Appointment.find({
      doctor: doctorId,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { $nin: ['cancelled', 'no-show'] }
    }).select('startTime endTime');

    // Generate available slots (assuming 9 AM - 5 PM working hours, 30 min slots)
    const workingHours = { start: '09:00', end: '17:00' };
    const slotDuration = 30; // minutes
    const availableSlots = [];
    const bookedTimes = bookedAppointments.map(apt => ({ start: apt.startTime, end: apt.endTime }));

    let currentTime = workingHours.start;
    while (currentTime < workingHours.end) {
      const [hours, minutes] = currentTime.split(':').map(Number);
      const slotStart = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      
      const slotEndMinutes = minutes + slotDuration;
      const slotEndHours = hours + Math.floor(slotEndMinutes / 60);
      const slotEndMins = slotEndMinutes % 60;
      const slotEnd = `${slotEndHours.toString().padStart(2, '0')}:${slotEndMins.toString().padStart(2, '0')}`;

      // Check if slot is available
      const isBooked = bookedTimes.some(booked => {
        return (slotStart >= booked.start && slotStart < booked.end) ||
               (slotEnd > booked.start && slotEnd <= booked.end) ||
               (slotStart <= booked.start && slotEnd >= booked.end);
      });

      if (!isBooked) {
        availableSlots.push({
          startTime: slotStart,
          endTime: slotEnd
        });
      }

      // Move to next slot
      const nextMinutes = minutes + slotDuration;
      currentTime = `${(hours + Math.floor(nextMinutes / 60)).toString().padStart(2, '0')}:${(nextMinutes % 60).toString().padStart(2, '0')}`;
      
      if (currentTime >= workingHours.end) break;
    }

    res.json({
      date,
      doctorId,
      availableSlots,
      bookedAppointments: bookedAppointments.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch availability' });
  }
});

// Schedule follow-up from completed appointment
router.post('/:id/follow-up', authenticate, authorize('doctor', 'admin'), async (req, res) => {
  try {
    const originalAppointment = await Appointment.findById(req.params.id)
      .populate('patient', 'firstName lastName')
      .populate('doctor', 'firstName lastName');

    if (!originalAppointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    if (originalAppointment.status !== 'completed') {
      return res.status(400).json({ error: 'Can only schedule follow-up for completed appointments' });
    }

    if (req.user.role === 'doctor' && originalAppointment.doctor._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Can only schedule follow-up for your own appointments' });
    }

    const { date, startTime, endTime, duration, reason, isRecurring, recurringPattern, recurringEndDate } = req.body;

    if (!date || !startTime || !endTime) {
      return res.status(400).json({ error: 'Date, start time, and end time are required' });
    }

    // Check for time conflicts
    const conflictingAppointment = await Appointment.findOne({
      doctor: originalAppointment.doctor._id,
      date: new Date(date),
      status: { $nin: ['cancelled', 'no-show'] },
      $or: [{ startTime: { $lt: endTime }, endTime: { $gt: startTime } }],
    });

    if (conflictingAppointment) {
      return res.status(400).json({ error: 'Time slot already booked' });
    }

    const followUp = new Appointment({
      patient: originalAppointment.patient._id,
      doctor: originalAppointment.doctor._id,
      appointmentType: originalAppointment.appointmentType,
      appointmentCategory: originalAppointment.appointmentCategory,
      date: new Date(date),
      startTime,
      endTime,
      duration: duration || originalAppointment.duration,
      status: 'scheduled',
      reason: reason || `Kontrola - nastavak od ${new Date(originalAppointment.date).toLocaleDateString('sr-RS')}`,
      originalAppointment: originalAppointment._id,
      isRecurring: isRecurring || false,
      recurringPattern,
      recurringEndDate: recurringEndDate ? new Date(recurringEndDate) : undefined,
    });

    await followUp.save();

    const populatedFollowUp = await Appointment.findById(followUp._id)
      .populate('patient', 'firstName lastName email phone')
      .populate('doctor', 'firstName lastName email specialization');

    res.status(201).json({
      message: 'Follow-up appointment scheduled',
      appointment: populatedFollowUp,
    });
  } catch (error) {
    console.error('Follow-up scheduling error:', error);
    res.status(500).json({ error: 'Failed to schedule follow-up', details: error.message });
  }
});

module.exports = router;