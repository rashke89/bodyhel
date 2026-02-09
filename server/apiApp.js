const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const connectDB = require('./config/database');
const { authenticate } = require('./middleware/auth');
const auditLog = require('./middleware/audit');

// Initialize Express app for API routes (no server listener here)
const app = express();

// Connect to MongoDB (mongoose caches the connection)
connectDB();

// CORS configuration (must be before helmet)
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })
);

// Security middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'BodyHel API is running',
    timestamp: new Date().toISOString(),
  });
});

// API Routes (no /api prefix here)
app.use('/auth', require('./routes/auth'));
app.use(
  '/appointments',
  authenticate,
  auditLog('appointment', 'appointment'),
  require('./routes/appointments')
);
app.use('/ehr', authenticate, auditLog('ehr', 'ehr'), require('./routes/ehr'));
app.use(
  '/prescriptions',
  authenticate,
  auditLog('prescription', 'prescription'),
  require('./routes/prescriptions')
);
app.use(
  '/lab-results',
  authenticate,
  auditLog('lab-result', 'labResult'),
  require('./routes/labResults')
);
app.use(
  '/telemedicine',
  authenticate,
  auditLog('telemedicine', 'telemedicine'),
  require('./routes/telemedicine')
);
app.use(
  '/messages',
  authenticate,
  auditLog('message', 'message'),
  require('./routes/messages')
);
app.use('/patient-portal', require('./routes/patient-portal'));
app.use('/admin', auditLog('admin', 'admin'), require('./routes/admin'));
app.use('/reports', auditLog('report', 'report'), require('./routes/reports'));
app.use('/integrations', auditLog('integration', 'integration'), require('./routes/integrations'));
app.use('/contact', require('./routes/contact'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);

  res.status(err.status || 500).json({
    error: err.message || 'Something went wrong!',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

module.exports = app;
