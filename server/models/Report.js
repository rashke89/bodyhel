const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    reportType: {
      type: String,
      enum: ['appointments', 'prescriptions', 'lab-results', 'demographics', 'financial', 'custom'],
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
    // Date range for the report
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    // Filters applied
    filters: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    // Generated statistics/data
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    // Report status
    status: {
      type: String,
      enum: ['draft', 'generated', 'archived'],
      default: 'draft',
    },
    // Who created and can access
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // File export (if exported)
    exportedFile: {
      fileUrl: String,
      fileName: String,
      fileType: String,
      exportedAt: Date,
    },
    // Tags for organization
    tags: [String],
    // Notes
    notes: String,
    // Organization scope (multi-tenant)
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
reportSchema.index({ createdBy: 1, createdAt: -1 });
reportSchema.index({ reportType: 1 });
reportSchema.index({ status: 1 });

module.exports = mongoose.model('Report', reportSchema);
