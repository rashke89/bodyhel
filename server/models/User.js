const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ["patient", "doctor", "nurse", "admin", "receptionist"],
      required: true,
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      // Za sada nije hard-required zbog postojećih podataka;
      // može se kasnije postrožiti za osoblje.
    },
    phone: {
      type: String,
      trim: true,
    },
    dateOfBirth: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
    },
    address: {
      street: String,
      city: String,
      postalCode: String,
      country: String,
    },
    // Doktor/medicinski radnik specifični podaci
    specialization: {
      type: String, // npr. "kardiologija", "pedijatrija"
      required: function () {
        return ["doctor", "nurse"].includes(this.role);
      },
    },
    licenseNumber: {
      type: String,
      required: function () {
        return ["doctor", "nurse"].includes(this.role);
      },
    },
    department: {
      type: String,
    },
    // Pacijent specifični podaci
    patientId: {
      type: String,
      unique: true,
      sparse: true,
    },
    bloodType: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
    },
    emergencyContact: {
      name: String,
      phone: String,
      relationship: String,
    },
    insuranceNumber: {
      type: String,
    },
    // Status i dozvole
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
    permissions: [
      {
        type: String,
      },
    ],
    // Avatar
    avatar: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password pre snimanja
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Metoda za proveru passworda
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Metoda za generisanje patient ID-a
userSchema.methods.generatePatientId = function () {
  if (this.role === "patient" && !this.patientId) {
    const prefix = "PAT";
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    this.patientId = `${prefix}${timestamp}${random}`;
  }
};

// Index za brze pretrage
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ patientId: 1 });
userSchema.index({ specialization: 1 });
userSchema.index({ organization: 1, role: 1 });

module.exports = mongoose.model("User", userSchema);
