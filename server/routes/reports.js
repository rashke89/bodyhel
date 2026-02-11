const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const EHR = require('../models/EHR');
const Prescription = require('../models/Prescription');
const LabResult = require('../models/LabResult');
const User = require('../models/User');
const Report = require('../models/Report');
const { authenticate, authorize } = require('../middleware/auth');

const { generateReportPDF } = require('../utils/pdfGenerator');

// All reports require authentication
router.use(authenticate);

// Export report as PDF
router.get('/export', authorize('admin'), async (req, res) => {
  try {
    const { reportType, startDate, endDate } = req.query;
    const dateQuery = {};
    let statistics = {};

    if (startDate && endDate) {
      dateQuery.$gte = new Date(startDate);
      dateQuery.$lte = new Date(endDate);
    }

    const orgFilter = req.user.organization
      ? { organization: req.user.organization }
      : {};

    switch (reportType) {
      case 'appointments': {
        const query = startDate && endDate ? { date: dateQuery, ...orgFilter } : { ...orgFilter };
        const appointments = await Appointment.find(query)
          .populate('doctor', 'firstName lastName');
        statistics = { total: appointments.length, byStatus: {}, byType: {}, byDoctor: {} };
        appointments.forEach(apt => {
          statistics.byStatus[apt.status] = (statistics.byStatus[apt.status] || 0) + 1;
          statistics.byType[apt.appointmentType] = (statistics.byType[apt.appointmentType] || 0) + 1;
          const dn = `${apt.doctor.firstName} ${apt.doctor.lastName}`;
          statistics.byDoctor[dn] = (statistics.byDoctor[dn] || 0) + 1;
        });
        break;
      }
      case 'prescriptions': {
        const query = startDate && endDate ? { issueDate: dateQuery, ...orgFilter } : { ...orgFilter };
        const prescriptions = await Prescription.find(query)
          .populate('doctor', 'firstName lastName');
        statistics = { total: prescriptions.length, byStatus: {}, medicationsPrescribed: {} };
        prescriptions.forEach(p => {
          statistics.byStatus[p.status] = (statistics.byStatus[p.status] || 0) + 1;
          p.medications.forEach(m => {
            statistics.medicationsPrescribed[m.name] = (statistics.medicationsPrescribed[m.name] || 0) + 1;
          });
        });
        break;
      }
      case 'lab-results': {
        const query = startDate && endDate ? { orderedDate: dateQuery, ...orgFilter } : { ...orgFilter };
        const labResults = await LabResult.find(query);
        statistics = {
          total: labResults.length,
          byStatus: {},
          byTestType: {},
          pending: labResults.filter(r => ['ordered', 'collected'].includes(r.status)).length,
          completed: labResults.filter(r => r.status === 'completed').length,
        };
        labResults.forEach(r => {
          statistics.byStatus[r.status] = (statistics.byStatus[r.status] || 0) + 1;
          statistics.byTestType[r.testType] = (statistics.byTestType[r.testType] || 0) + 1;
        });
        break;
      }
      default:
        return res.status(400).json({ error: 'Invalid report type' });
    }

    const pdfBytes = await generateReportPDF({ statistics, startDate, endDate }, reportType);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=izvestaj-${reportType}-${Date.now()}.pdf`);
    res.send(Buffer.from(pdfBytes));
  } catch (error) {
    console.error('Report PDF export error:', error);
    res.status(500).json({ error: 'Failed to export report' });
  }
});

// Get appointment statistics
router.get('/appointments', async (req, res) => {
  try {
    const { startDate, endDate, doctor, status } = req.query;
    const query = {};

    // Date range filter
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    if (doctor) query.doctor = doctor;
    if (status) query.status = status;

    // Role-based filtering
    if (req.user.role === 'doctor') {
      query.doctor = req.user._id;
    } else if (req.user.role === 'patient') {
      query.patient = req.user._id;
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (req.user.role === 'admin' && req.user.organization) {
      query.organization = req.user.organization;
    }

    const appointments = await Appointment.find(query)
      .populate('patient', 'firstName lastName')
      .populate('doctor', 'firstName lastName specialization');

    // Generate statistics
    const stats = {
      total: appointments.length,
      byStatus: {},
      byType: {},
      byDoctor: {},
      dailyCount: {}
    };

    appointments.forEach(apt => {
      // Count by status
      stats.byStatus[apt.status] = (stats.byStatus[apt.status] || 0) + 1;

      // Count by type
      stats.byType[apt.appointmentType] = (stats.byType[apt.appointmentType] || 0) + 1;

      // Count by doctor
      const doctorName = `${apt.doctor.firstName} ${apt.doctor.lastName}`;
      stats.byDoctor[doctorName] = (stats.byDoctor[doctorName] || 0) + 1;

      // Daily count
      const dateKey = apt.date.toISOString().split('T')[0];
      stats.dailyCount[dateKey] = (stats.dailyCount[dateKey] || 0) + 1;
    });

    res.json({
      period: { startDate, endDate },
      statistics: stats,
      appointments: appointments.slice(0, 100) // Limit for response size
    });
  } catch (error) {
    console.error('Appointment report error:', error);
    res.status(500).json({ error: 'Failed to generate appointment report' });
  }
});

// Get prescription report
router.get('/prescriptions', authorize('doctor', 'admin'), async (req, res) => {
  try {
    const { startDate, endDate, doctor } = req.query;
    const query = {};

    if (startDate && endDate) {
      query.issueDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    if (doctor) {
      query.doctor = doctor;
    } else if (req.user.role === 'doctor') {
      query.doctor = req.user._id;
    }

    if (req.user.role === 'admin' && req.user.organization) {
      query.organization = req.user.organization;
    }

    const prescriptions = await Prescription.find(query)
      .populate('patient', 'firstName lastName')
      .populate('doctor', 'firstName lastName specialization');

    // Generate statistics
    const stats = {
      total: prescriptions.length,
      byStatus: {},
      medicationsPrescribed: {},
      byDoctor: {}
    };

    prescriptions.forEach(presc => {
      // Count by status
      stats.byStatus[presc.status] = (stats.byStatus[presc.status] || 0) + 1;

      // Count medications
      presc.medications.forEach(med => {
        stats.medicationsPrescribed[med.name] = (stats.medicationsPrescribed[med.name] || 0) + 1;
      });

      // Count by doctor
      const doctorName = `${presc.doctor.firstName} ${presc.doctor.lastName}`;
      stats.byDoctor[doctorName] = (stats.byDoctor[doctorName] || 0) + 1;
    });

    res.json({
      period: { startDate, endDate },
      statistics: stats,
      prescriptions: prescriptions.slice(0, 100)
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate prescription report' });
  }
});

// Get lab results report
router.get('/lab-results', authorize('doctor', 'nurse', 'admin'), async (req, res) => {
  try {
    const { startDate, endDate, testType, status } = req.query;
    const query = {};

    if (startDate && endDate) {
      query.orderedDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    if (testType) query.testType = testType;
    if (status) query.status = status;

    if (req.user.role === 'admin' && req.user.organization) {
      query.organization = req.user.organization;
    }

    const labResults = await LabResult.find(query)
      .populate('patient', 'firstName lastName')
      .populate('orderedBy', 'firstName lastName');

    const stats = {
      total: labResults.length,
      byStatus: {},
      byTestType: {},
      pending: labResults.filter(r => ['ordered', 'collected'].includes(r.status)).length,
      completed: labResults.filter(r => r.status === 'completed').length
    };

    labResults.forEach(result => {
      stats.byStatus[result.status] = (stats.byStatus[result.status] || 0) + 1;
      stats.byTestType[result.testType] = (stats.byTestType[result.testType] || 0) + 1;
    });

    res.json({
      period: { startDate, endDate },
      statistics: stats,
      labResults: labResults.slice(0, 100)
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate lab results report' });
  }
});

// Get patient demographics report (admin only)
router.get('/demographics', authorize('admin'), async (req, res) => {
  try {
    const orgFilter = req.user.organization
      ? { organization: req.user.organization }
      : {};
    const patients = await User.find({ role: 'patient', ...orgFilter }).select('dateOfBirth gender address');

    const stats = {
      total: patients.length,
      byGender: {},
      byAgeGroup: {
        '0-18': 0,
        '19-35': 0,
        '36-50': 0,
        '51-65': 0,
        '65+': 0
      },
      byCity: {}
    };

    const today = new Date();

    patients.forEach(patient => {
      // Gender distribution
      if (patient.gender) {
        stats.byGender[patient.gender] = (stats.byGender[patient.gender] || 0) + 1;
      }

      // Age groups
      if (patient.dateOfBirth) {
        const age = today.getFullYear() - new Date(patient.dateOfBirth).getFullYear();
        if (age <= 18) stats.byAgeGroup['0-18']++;
        else if (age <= 35) stats.byAgeGroup['19-35']++;
        else if (age <= 50) stats.byAgeGroup['36-50']++;
        else if (age <= 65) stats.byAgeGroup['51-65']++;
        else stats.byAgeGroup['65+']++;
      }

      // City distribution
      if (patient.address && patient.address.city) {
        stats.byCity[patient.address.city] = (stats.byCity[patient.address.city] || 0) + 1;
      }
    });

    res.json({ statistics: stats });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate demographics report' });
  }
});

// CRUD for saved reports
// Get all saved reports
router.get('/saved', authorize('admin'), async (req, res) => {
  try {
    const { reportType, status, limit = 50, page = 1 } = req.query;
    const query = { createdBy: req.user._id };

    if (req.user.organization) {
      query.organization = req.user.organization;
    }

    if (reportType) query.reportType = reportType;
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const reports = await Report.find(query)
      .populate('createdBy', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Report.countDocuments(query);

    res.json({
      reports,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// Get report by ID
router.get('/saved/:id', authorize('admin'), async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('createdBy', 'firstName lastName email');

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Check if user has access
    if (report.createdBy._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ report });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch report' });
  }
});

// Create new report
router.post('/saved', authorize('admin'), async (req, res) => {
  try {
    const { title, reportType, description, startDate, endDate, filters, data, tags, notes } = req.body;

    const report = new Report({
      title,
      reportType,
      description,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      filters: filters || {},
      data: data || {},
      tags: tags || [],
      notes,
      createdBy: req.user._id,
      organization: req.user.organization || undefined,
      status: 'draft'
    });

    await report.save();

    const populatedReport = await Report.findById(report._id)
      .populate('createdBy', 'firstName lastName email');

    res.status(201).json({
      message: 'Report created successfully',
      report: populatedReport
    });
  } catch (error) {
    console.error('Create report error:', error);
    res.status(500).json({ error: 'Failed to create report', details: error.message });
  }
});

// Update report
router.put('/saved/:id', authorize('admin'), async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Check if user has access
    if (report.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const allowedUpdates = ['title', 'description', 'startDate', 'endDate', 'filters', 'data', 'status', 'tags', 'notes'];
    const updates = {};

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'startDate' || field === 'endDate') {
          updates[field] = req.body[field] ? new Date(req.body[field]) : undefined;
        } else {
          updates[field] = req.body[field];
        }
      }
    });

    Object.assign(report, updates);
    await report.save();

    const updatedReport = await Report.findById(report._id)
      .populate('createdBy', 'firstName lastName email');

    res.json({
      message: 'Report updated successfully',
      report: updatedReport
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update report', details: error.message });
  }
});

// Delete report
router.delete('/saved/:id', authorize('admin'), async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Check if user has access
    if (report.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    await Report.findByIdAndDelete(req.params.id);

    res.json({ message: 'Report deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete report' });
  }
});

module.exports = router;