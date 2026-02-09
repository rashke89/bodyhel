const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const EHR = require('../models/EHR');
const Prescription = require('../models/Prescription');
const LabResult = require('../models/LabResult');
const Message = require('../models/Message');
const AuditLog = require('../models/AuditLog');
const { authenticate, authorize } = require('../middleware/auth');

// All admin routes require admin role
router.use(authenticate);
router.use(authorize('admin'));

// Get dashboard statistics
router.get('/dashboard', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // User statistics
    const totalUsers = await User.countDocuments();
    const totalPatients = await User.countDocuments({ role: 'patient' });
    const totalDoctors = await User.countDocuments({ role: 'doctor' });
    const activeUsers = await User.countDocuments({ isActive: true });

    // Appointment statistics
    const totalAppointments = await Appointment.countDocuments();
    const todayAppointments = await Appointment.countDocuments({
      date: { $gte: today, $lt: tomorrow }
    });
    const upcomingAppointments = await Appointment.countDocuments({
      date: { $gte: new Date() },
      status: { $in: ['scheduled', 'confirmed'] }
    });

    // EHR statistics
    const totalEHRs = await EHR.countDocuments();

    // Prescription statistics
    const totalPrescriptions = await Prescription.countDocuments();
    const activePrescriptions = await Appointment.countDocuments({ status: 'active' });

    // Lab results statistics
    const totalLabResults = await LabResult.countDocuments();
    const pendingLabResults = await LabResult.countDocuments({ status: { $in: ['ordered', 'collected'] } });

    // Messages
    const totalMessages = await Message.countDocuments();
    const unreadMessages = await Message.countDocuments({ read: false });

    res.json({
      users: {
        total: totalUsers,
        patients: totalPatients,
        doctors: totalDoctors,
        active: activeUsers
      },
      appointments: {
        total: totalAppointments,
        today: todayAppointments,
        upcoming: upcomingAppointments
      },
      ehrs: {
        total: totalEHRs
      },
      prescriptions: {
        total: totalPrescriptions,
        active: activePrescriptions
      },
      labResults: {
        total: totalLabResults,
        pending: pendingLabResults
      },
      messages: {
        total: totalMessages,
        unread: unreadMessages
      }
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

// User management
router.get('/users', async (req, res) => {
  try {
    const { role, isActive, search, limit = 50, page = 1 } = req.query;
    const query = {};

    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    if (search) {
      query.$or = [
        { firstName: new RegExp(search, 'i') },
        { lastName: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
        { patientId: new RegExp(search, 'i') }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Create new user
router.post('/users', async (req, res) => {
  try {
    const { email, password, firstName, lastName, role, phone, dateOfBirth, gender, specialization, licenseNumber, department, address, bloodType, insuranceNumber, emergencyContact } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Create new user
    const user = new User({
      email,
      password, // Will be hashed by pre-save hook
      firstName,
      lastName,
      role,
      phone,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      gender,
      specialization,
      licenseNumber,
      department,
      address,
      bloodType,
      insuranceNumber,
      emergencyContact,
      isActive: true
    });

    // Generate patient ID if patient
    if (role === 'patient') {
      user.generatePatientId();
    }

    await user.save();

    const createdUser = await User.findById(user._id).select('-password');
    res.status(201).json({
      message: 'User created successfully',
      user: createdUser
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user', details: error.message });
  }
});

// Get user by ID
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Update user
router.put('/users/:id', async (req, res) => {
  try {
    const { firstName, lastName, email, phone, role, isActive, specialization, licenseNumber, department, permissions } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const allowedUpdates = {
      firstName, lastName, email, phone, role, isActive,
      specialization, licenseNumber, department, permissions
    };

    Object.keys(allowedUpdates).forEach(key => {
      if (allowedUpdates[key] !== undefined) {
        user[key] = allowedUpdates[key];
      }
    });

    await user.save();

    const updatedUser = await User.findById(user._id).select('-password');
    res.json({
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user', details: error.message });
  }
});

// Delete user (soft delete - set inactive)
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.isActive = false;
    await user.save();

    res.json({ message: 'User deactivated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to deactivate user' });
  }
});

// Get audit logs
router.get('/audit-logs', async (req, res) => {
  try {
    const { user, action, resource, startDate, endDate, limit = 100, page = 1 } = req.query;
    const query = {};

    if (user) query.user = user;
    if (action) query.action = action;
    if (resource) query.resource = resource;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const logs = await AuditLog.find(query)
      .populate('user', 'firstName lastName email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await AuditLog.countDocuments(query);

    res.json({
      logs,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

// System settings (placeholder)
router.get('/settings', async (req, res) => {
  res.json({
    message: 'System settings endpoint',
    settings: {
      // Placeholder for system settings
    }
  });
});

module.exports = router;