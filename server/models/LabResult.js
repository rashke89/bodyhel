const mongoose = require("mongoose");

const labResultSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    orderNumber: {
      type: String,
      unique: true,
      required: true,
    },
    orderedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
    },
    testType: {
      type: String,
      enum: ["blood", "urine", "imaging", "pathology", "microbiology", "other"],
      required: true,
    },
    testName: {
      type: String,
      required: true,
    },
    orderedDate: {
      type: Date,
      default: Date.now,
    },
    collectedDate: {
      type: Date,
    },
    resultDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["ordered", "collected", "in-progress", "completed", "cancelled"],
      default: "ordered",
    },
    results: [
      {
        parameter: {
          type: String,
          required: true,
        },
        value: {
          type: mongoose.Schema.Types.Mixed,
          required: true,
        },
        unit: String,
        referenceRange: String,
        flag: {
          type: String,
          enum: ["normal", "high", "low", "critical"],
        },
      },
    ],
    findings: String,
    interpretation: String,
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reviewedAt: {
      type: Date,
    },
    attachments: [
      {
        fileUrl: String,
        fileName: String,
        fileType: String,
      },
    ],
    externalLabId: String, // Za integraciju sa LIS sistemima
  },
  {
    timestamps: true,
  }
);

// Index
labResultSchema.index({ patient: 1, resultDate: -1 });
labResultSchema.index({ orderNumber: 1 });
labResultSchema.index({ status: 1 });

module.exports = mongoose.model("LabResult", labResultSchema);
