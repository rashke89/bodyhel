const mongoose = require("mongoose");

const noteTemplateSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ["ehr-note", "report", "other"],
      default: "ehr-note",
    },
    tags: [String],
  },
  {
    timestamps: true,
  },
);

noteTemplateSchema.index({ owner: 1, createdAt: -1 });

module.exports = mongoose.model("NoteTemplate", noteTemplateSchema);

