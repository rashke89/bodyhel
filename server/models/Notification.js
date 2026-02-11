const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        "message",
        "appointment",
        "lab-result",
        "prescription",
        "system",
      ],
      default: "system",
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    body: {
      type: String,
      trim: true,
    },
    // Optional reference to related resource
    relatedResource: {
      type: {
        resourceType: {
          type: String,
          enum: [
            "appointment",
            "message",
            "lab-result",
            "prescription",
            "ehr",
            "user",
            "telemedicine",
          ],
        },
        resourceId: {
          type: mongoose.Schema.Types.ObjectId,
        },
      },
      _id: false,
    },
    // Frontend navigation helper (optional)
    link: {
      type: String,
      trim: true,
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

notificationSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);

