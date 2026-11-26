const Notification = require('../models/notification.model');

// Get notifications for the logged-in user
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      recipient: req.user._id
    }).sort({ createdAt: -1 });

    res.status(200).json(notifications);
  } catch (error) {
    console.error('Get notifications error:', error);

    res.status(500).json({
      message: 'Failed to fetch notifications'
    });
  }
};

// Get unread notification count
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false
    });

    res.status(200).json({ count });
  } catch (error) {
    console.error('Unread count error:', error);

    res.status(500).json({
      message: 'Failed to fetch unread count'
    });
  }
};
// Mark one notification as read
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      {
        _id: req.params.id,
        recipient: req.user._id
      },
      {
        isRead: true
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!notification) {
      return res.status(404).json({
        message: 'Notification not found'
      });
    }

    res.status(200).json({
      message: 'Notification marked as read',
      notification
    });
  } catch (error) {
    console.error('Mark notification as read error:', error);

    res.status(500).json({
      message: 'Failed to mark notification as read'
    });
  }
};
// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      {
        recipient: req.user._id,
        isRead: false
      },
      {
        isRead: true
      }
    );

    res.status(200).json({
      message: 'All notifications marked as read',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);

    res.status(500).json({
      message: 'Failed to mark all notifications as read'
    });
  }
};
// Delete one notification
exports.deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: req.user._id
    });

    if (!notification) {
      return res.status(404).json({
        message: 'Notification not found'
      });
    }

    res.status(200).json({
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Delete notification error:', error);

    res.status(500).json({
      message: 'Failed to delete notification'
    });
  }
};
// Create notification (Admin only)
exports.createNotification = async (req, res) => {
  try {
    const { recipient, title, message, type } = req.body;

    if (!recipient || !title || !message) {
      return res.status(400).json({
        message: 'Recipient, title and message are required'
      });
    }

    const User = require('../models/user.model');

    const userExists = await User.exists({ _id: recipient });

    if (!userExists) {
      return res.status(404).json({
        message: 'Recipient user not found'
      });
    }

    const notification = await Notification.create({
      recipient,
      title,
      message,
      type: type || 'info'
    });

    res.status(201).json({
      message: 'Notification created successfully',
      notification
    });
  } catch (error) {
    console.error('Create notification error:', error);

    res.status(500).json({
      message: 'Failed to create notification'
    });
  }
};