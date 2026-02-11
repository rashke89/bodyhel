const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification");
const { authenticate } = require("../middleware/auth");

// All notification routes require authentication
router.use(authenticate);

// Get notifications for current user
router.get("/", async (req, res) => {
  try {
    const { read, limit = 20 } = req.query;
    const query = { user: req.user._id };

    if (read === "true") {
      query.read = true;
    } else if (read === "false") {
      query.read = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit, 10));

    res.json({ notifications });
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// Get unread notification count
router.get("/unread-count", async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      user: req.user._id,
      read: false,
    });

    res.json({ unreadCount: count });
  } catch (error) {
    console.error("Get notifications unread count error:", error);
    res.status(500).json({ error: "Failed to get unread count" });
  }
});

// Mark single notification as read
router.put("/:id/read", async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    if (
      notification.user.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ error: "Not authorized" });
    }

    notification.read = true;
    notification.readAt = new Date();
    await notification.save();

    res.json({ message: "Notification marked as read", notification });
  } catch (error) {
    console.error("Mark notification as read error:", error);
    res.status(500).json({ error: "Failed to mark notification as read" });
  }
});

// Mark all notifications as read for current user
router.post("/read-all", async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, read: false },
      { read: true, readAt: new Date() },
    );

    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("Mark all notifications as read error:", error);
    res.status(500).json({ error: "Failed to mark notifications as read" });
  }
});

module.exports = router;

