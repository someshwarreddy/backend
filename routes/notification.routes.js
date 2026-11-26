const express = require('express');
const router = express.Router();
const { allowRoles } = require('../middleware/checkRole');
const { verifyToken } = require('../middleware/verifyToken');

const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createNotification
} = require('../controllers/notification.controller');

router.get('/', verifyToken, getNotifications);

router.get('/unread-count', verifyToken, getUnreadCount);

router.patch('/read-all', verifyToken, markAllAsRead);

router.patch('/:id/read', verifyToken, markAsRead);

router.delete('/:id', verifyToken, deleteNotification);

router.post('/', verifyToken, allowRoles('admin'), createNotification);
module.exports = router;