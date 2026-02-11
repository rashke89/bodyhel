const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    resource: {
      type: String,
      required: true, // npr. 'user', 'appointment', 'ehr'
    },
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    method: {
      type: String,
      enum: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    },
    endpoint: {
      type: String,
    },
    requestBody: {
      type: mongoose.Schema.Types.Mixed,
    },
    responseStatus: {
      type: Number,
    },
    changes: {
      before: mongoose.Schema.Types.Mixed,
      after: mongoose.Schema.Types.Mixed,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index za brze pretrage
auditLogSchema.index({ user: 1, createdAt: -1 });
auditLogSchema.index({ resource: 1, resourceId: 1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: -1 }); // Za retention policy

module.exports = mongoose.model("AuditLog", auditLogSchema);
