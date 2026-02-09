const { body, param, query, validationResult } = require('express-validator');

// Validation result handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// Common validation rules
const validationRules = {
  // User registration
  register: [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain at least 8 characters, one uppercase, one lowercase, and one number'),
    body('firstName').trim().notEmpty(),
    body('lastName').trim().notEmpty(),
    body('role').isIn(['patient', 'doctor', 'nurse', 'admin', 'receptionist']),
    body('phone').optional().isMobilePhone(),
    handleValidationErrors
  ],

  // Login
  login: [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
    handleValidationErrors
  ],

  // Appointment
  createAppointment: [
    body('patient').isMongoId(),
    body('doctor').isMongoId(),
    body('appointmentType').isIn(['consultation', 'checkup', 'systematic', 'dental', 'emergency', 'telemedicine']),
    body('date').isISO8601(),
    body('startTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    body('endTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    body('duration').optional().isInt({ min: 15 }),
    handleValidationErrors
  ],

  // EHR
  createEHR: [
    body('patient').isMongoId(),
    body('diagnoses').optional().isArray(),
    body('diagnoses.*.code').optional().notEmpty(),
    body('diagnoses.*.description').optional().notEmpty(),
    handleValidationErrors
  ],

  // Prescription
  createPrescription: [
    body('patient').isMongoId(),
    body('doctor').isMongoId(),
    body('medications').isArray({ min: 1 }),
    body('medications.*.name').notEmpty(),
    body('medications.*.frequency').notEmpty(),
    body('medications.*.duration').notEmpty(),
    handleValidationErrors
  ],

  // MongoDB ID param
  mongoId: [
    param('id').isMongoId(),
    handleValidationErrors
  ]
};

module.exports = { validationRules, handleValidationErrors };