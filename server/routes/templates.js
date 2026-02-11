const express = require("express");
const router = express.Router();
const NoteTemplate = require("../models/NoteTemplate");
const { authenticate, authorize } = require("../middleware/auth");

// Templates are primarily for doctors/nurses/admins
router.use(authenticate);

// Get note templates for current user
router.get("/notes", authorize("doctor", "nurse", "admin"), async (req, res) => {
  try {
    const templates = await NoteTemplate.find({
      owner: req.user._id,
    })
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ templates });
  } catch (error) {
    console.error("Get note templates error:", error);
    res.status(500).json({ error: "Failed to fetch note templates" });
  }
});

// Create new note template
router.post("/notes", authorize("doctor", "nurse", "admin"), async (req, res) => {
  try {
    const { title, content, category, tags } = req.body;

    if (!title || !content) {
      return res
        .status(400)
        .json({ error: "Title and content are required" });
    }

    const template = new NoteTemplate({
      owner: req.user._id,
      title,
      content,
      category: category || "ehr-note",
      tags: tags || [],
    });

    await template.save();

    res.status(201).json({ template });
  } catch (error) {
    console.error("Create note template error:", error);
    res.status(500).json({ error: "Failed to create note template" });
  }
});

// Update note template
router.put("/notes/:id", authorize("doctor", "nurse", "admin"), async (req, res) => {
  try {
    const template = await NoteTemplate.findById(req.params.id);

    if (!template) {
      return res.status(404).json({ error: "Template not found" });
    }

    if (template.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const { title, content, category, tags } = req.body;
    if (title !== undefined) template.title = title;
    if (content !== undefined) template.content = content;
    if (category !== undefined) template.category = category;
    if (tags !== undefined) template.tags = tags;

    await template.save();

    res.json({ template });
  } catch (error) {
    console.error("Update note template error:", error);
    res.status(500).json({ error: "Failed to update note template" });
  }
});

// Delete note template
router.delete("/notes/:id", authorize("doctor", "nurse", "admin"), async (req, res) => {
  try {
    const template = await NoteTemplate.findById(req.params.id);

    if (!template) {
      return res.status(404).json({ error: "Template not found" });
    }

    if (template.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not authorized" });
    }

    await NoteTemplate.findByIdAndDelete(req.params.id);

    res.json({ message: "Template deleted" });
  } catch (error) {
    console.error("Delete note template error:", error);
    res.status(500).json({ error: "Failed to delete note template" });
  }
});

module.exports = router;

