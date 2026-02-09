const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    appointmentType: {
      type: String,
      enum: [
        "consultation",
        "checkup",
        "systematic",
        "dental",
        "emergency",
        "telemedicine",
      ],
      required: true,
    },
    appointmentCategory: {
      type: String,
      enum: ["ambulatory", "inpatient"],
      default: "ambulatory",
    },
    date: {
      type: Date,
      required: true,
    },
    startTime: {
      type: String, // Format: "HH:mm"
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    duration: {
      type: Number, // u minutima
      default: 30,
    },
    status: {
      type: String,
      enum: [
        "scheduled",
        "confirmed",
        "in-progress",
        "completed",
        "cancelled",
        "no-show",
        "rescheduled",
      ],
      default: "scheduled",
    },
    reason: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
    },
    // Za stacionarno lečenje
    admissionDate: {
      type: Date,
    },
    dischargeDate: {
      type: Date,
    },
    roomNumber: {
      type: String,
    },
    bedNumber: {
      type: String,
    },
    // Rescheduling
    originalAppointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
    },
    rescheduledFrom: {
      type: Date,
    },
    // Notifikacije
    remindersSent: {
      type: Number,
      default: 0,
    },
    lastReminderSent: {
      type: Date,
    },
    // Ponavljajuci pregledi
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurringPattern: {
      type: String,
      enum: ["weekly", "biweekly", "monthly", "quarterly"],
    },
    recurringEndDate: {
      type: Date,
    },
    parentAppointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
    },
  },
  {
    timestamps: true,
  }
);

// Index za brze pretrage
appointmentSchema.index({ patient: 1, date: 1 });
appointmentSchema.index({ doctor: 1, date: 1 });
appointmentSchema.index({ status: 1 });
appointmentSchema.index({ date: 1, startTime: 1 });
appointmentSchema.index({ isRecurring: 1, status: 1 });
appointmentSchema.index({ parentAppointment: 1 });

module.exports = mongoose.model("Appointment", appointmentSchema);
