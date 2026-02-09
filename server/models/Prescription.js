const mongoose = require("mongoose");

const prescriptionSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
    },
    diagnosis: {
      code: String,
      description: String,
    },
    medications: [
      {
        name: {
          type: String,
          required: true,
        },
        genericName: String,
        dosage: {
          amount: String, // npr. "500mg"
          unit: String,
        },
        frequency: {
          type: String, // npr. "2x daily", "every 8 hours"
          required: true,
        },
        duration: {
          type: String, // npr. "7 days", "until finished"
          required: true,
        },
        instructions: String,
        quantity: Number,
        substitutionsAllowed: {
          type: Boolean,
          default: true,
        },
      },
    ],
    issueDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
    expiryDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["active", "completed", "cancelled", "expired"],
      default: "active",
    },
    notes: String,
    ePrescriptionId: {
      type: String,
      unique: true,
      sparse: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index
prescriptionSchema.index({ patient: 1, issueDate: -1 });
prescriptionSchema.index({ doctor: 1 });
prescriptionSchema.index({ status: 1 });

module.exports = mongoose.model("Prescription", prescriptionSchema);
