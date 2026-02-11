const mongoose = require("mongoose");

const ehrSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      index: true,
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Dijagnoze (ICD-10)
    diagnoses: [
      {
        code: {
          type: String, // ICD-10 kod
          required: true,
        },
        description: {
          type: String,
          required: true,
        },
        date: {
          type: Date,
          default: Date.now,
        },
        doctor: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        isPrimary: {
          type: Boolean,
          default: false,
        },
        status: {
          type: String,
          enum: ["active", "resolved", "chronic"],
          default: "active",
        },
      },
    ],
    // Medicinska upozorenja
    medicalAlerts: [
      {
        type: {
          type: String,
          enum: [
            "allergy",
            "drug-interaction",
            "contraindication",
            "chronic-condition",
            "other",
          ],
          required: true,
        },
        severity: {
          type: String,
          enum: ["low", "medium", "high", "critical"],
          default: "medium",
        },
        description: {
          type: String,
          required: true,
        },
        medication: {
          type: String,
        },
        active: {
          type: Boolean,
          default: true,
        },
        addedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        dateAdded: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // Vitalni znaci
    vitalSigns: [
      {
        date: {
          type: Date,
          default: Date.now,
        },
        bloodPressure: {
          systolic: Number,
          diastolic: Number,
        },
        heartRate: Number,
        temperature: Number,
        oxygenSaturation: Number,
        respiratoryRate: Number,
        weight: Number,
        height: Number,
        bmi: Number,
        measuredBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      },
    ],
    // Anamneza
    medicalHistory: {
      pastIllnesses: [String],
      surgeries: [
        {
          name: String,
          date: Date,
          hospital: String,
        },
      ],
      familyHistory: [String],
      socialHistory: {
        smoking: {
          status: String,
          details: String,
        },
        alcohol: {
          status: String,
          details: String,
        },
        exercise: String,
      },
    },
    // Dokumenta
    documents: [
      {
        type: {
          type: String,
          enum: [
            "lab-result",
            "imaging",
            "report",
            "prescription",
            "discharge-summary",
            "other",
          ],
          required: true,
        },
        title: {
          type: String,
          required: true,
        },
        fileUrl: {
          type: String,
          required: true,
        },
        fileSize: Number,
        mimeType: String,
        uploadedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
        tags: [String],
      },
    ],
    // Napomene i beleške
    notes: [
      {
        content: {
          type: String,
          required: true,
        },
        createdBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
        category: {
          type: String,
          enum: ["clinical", "administrative", "patient-reported"],
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Index za brze pretrage
ehrSchema.index({ patient: 1, createdAt: -1 });
ehrSchema.index({ "diagnoses.code": 1 });
ehrSchema.index({ "medicalAlerts.active": 1 });

module.exports = mongoose.model("EHR", ehrSchema);
