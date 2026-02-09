const mongoose = require('mongoose');

const telemedicineSessionSchema = new mongoose.Schema({
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: true
  },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sessionType: {
    type: String,
    enum: ['video', 'audio', 'chat'],
    required: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'in-progress', 'completed', 'cancelled', 'no-show'],
    default: 'scheduled'
  },
  scheduledStart: {
    type: Date,
    required: true
  },
  actualStart: {
    type: Date
  },
  actualEnd: {
    type: Date
  },
  duration: {
    type: Number // u sekundama
  },
  // Video/audio stream info
  roomId: {
    type: String,
    unique: true,
    required: true
  },
  recordingUrl: {
    type: String
  },
  recordingDuration: Number,
  // Vitalni podaci tokom sesije
  vitalSignsDuringSession: [{
    timestamp: Date,
    heartRate: Number,
    bloodPressure: {
      systolic: Number,
      diastolic: Number
    },
    temperature: Number,
    oxygenSaturation: Number,
    source: {
      type: String,
      enum: ['manual', 'device', 'reported']
    }
  }],
  // Chat log (ako je chat sesija)
  chatMessages: [{
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    message: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  // Dokumenti podeljeni tokom sesije
  sharedDocuments: [{
    documentId: mongoose.Schema.Types.ObjectId,
    sharedBy: mongoose.Schema.Types.ObjectId,
    sharedAt: Date
  }],
  // Beleške i zaključci
  notes: String,
  summary: String,
  followUpRequired: {
    type: Boolean,
    default: false
  },
  followUpDate: Date
}, {
  timestamps: true
});

// Index
telemedicineSessionSchema.index({ patient: 1, scheduledStart: -1 });
telemedicineSessionSchema.index({ doctor: 1, scheduledStart: -1 });
telemedicineSessionSchema.index({ roomId: 1 });
telemedicineSessionSchema.index({ status: 1 });

module.exports = mongoose.model('TelemedicineSession', telemedicineSessionSchema);