const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');

// Get messages (inbox)
router.get('/', authenticate, async (req, res) => {
  try {
    const { type, priority, read, limit = 50 } = req.query;
    const query = { recipient: req.user._id };

    if (type) query.type = type;
    if (priority) query.priority = priority;
    if (read !== undefined) query.read = read === 'true';

    const messages = await Message.find(query)
      .populate('sender', 'firstName lastName email role specialization avatar')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({ messages, count: messages.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Get sent messages
router.get('/sent', authenticate, async (req, res) => {
  try {
    const messages = await Message.find({ sender: req.user._id })
      .populate('recipient', 'firstName lastName email role')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ messages });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sent messages' });
  }
});

// Get unread count
router.get('/unread-count', authenticate, async (req, res) => {
  try {
    const count = await Message.countDocuments({
      recipient: req.user._id,
      read: false
    });

    res.json({ unreadCount: count });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get unread count' });
  }
});

// Get message by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id)
      .populate('sender', 'firstName lastName email role specialization avatar')
      .populate('recipient', 'firstName lastName email role');

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Check access
    if (message.recipient._id.toString() !== req.user._id.toString() &&
        message.sender._id.toString() !== req.user._id.toString() &&
        req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Mark as read if recipient
    if (message.recipient._id.toString() === req.user._id.toString() && !message.read) {
      message.read = true;
      message.readAt = new Date();
      await message.save();
    }

    res.json({ message });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch message' });
  }
});

// Send message
router.post('/', authenticate, async (req, res) => {
  try {
    const { recipient, subject, content, type, priority, relatedTo, attachments } = req.body;

    if (!recipient || !content) {
      return res.status(400).json({ error: 'Recipient and content are required' });
    }

    // Verify recipient exists
    const recipientUser = await User.findById(recipient);
    if (!recipientUser) {
      return res.status(404).json({ error: 'Recipient not found' });
    }

    const message = new Message({
      sender: req.user._id,
      recipient,
      subject,
      content,
      type: type || 'message',
      priority: priority || 'normal',
      relatedTo,
      attachments: attachments || []
    });

    await message.save();

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'firstName lastName email role')
      .populate('recipient', 'firstName lastName email role');

    res.status(201).json({
      message: 'Message sent successfully',
      message: populatedMessage
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message', details: error.message });
  }
});

// Mark as read
router.put('/:id/read', authenticate, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (message.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    message.read = true;
    message.readAt = new Date();
    await message.save();

    res.json({ message: 'Message marked as read', message });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark message as read' });
  }
});

// Mark all as read
router.put('/read-all', authenticate, async (req, res) => {
  try {
    await Message.updateMany(
      { recipient: req.user._id, read: false },
      { read: true, readAt: new Date() }
    );

    res.json({ message: 'All messages marked as read' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
});

// Delete message
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // User can only delete their own messages
    if (message.sender.toString() !== req.user._id.toString() &&
        message.recipient.toString() !== req.user._id.toString() &&
        req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this message' });
    }

    await Message.findByIdAndDelete(req.params.id);

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

module.exports = router;