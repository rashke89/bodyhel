const mongoose = require("mongoose");

const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["clinic", "hospital", "health-center", "lab", "other"],
      default: "clinic",
    },
    legalName: {
      type: String,
      trim: true,
    },
    taxId: {
      type: String,
      trim: true,
    },
    logoUrl: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    address: {
      street: String,
      city: String,
      postalCode: String,
      country: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    settings: {
      timeZone: String,
      locale: String,
      workingHours: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  },
);

organizationSchema.index({ name: 1 });
organizationSchema.index({ isActive: 1 });

module.exports = mongoose.model("Organization", organizationSchema);

