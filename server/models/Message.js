const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    subject: {
      type: String,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["message", "notification", "reminder", "alert"],
      default: "message",
    },
    priority: {
      type: String,
      enum: ["low", "normal", "high", "urgent"],
      default: "normal",
    },
    relatedTo: {
      type: {
        type: String,
        enum: [
          "appointment",
          "prescription",
          "lab-result",
          "ehr",
          "telemedicine",
        ],
      },
      id: mongoose.Schema.Types.ObjectId,
    },
    read: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
    },
    attachments: [
      {
        fileUrl: String,
        fileName: String,
        fileType: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Index za brze pretrage
messageSchema.index({ recipient: 1, read: 1, createdAt: -1 });
messageSchema.index({ sender: 1, createdAt: -1 });

module.exports = mongoose.model("Message", messageSchema);
