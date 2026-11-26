
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/verifyToken');
const { allowRoles } = require('../middleware/checkRole');
const upload = require('../middleware/upload');
const {
  getAllUsers,
  getUserById,
  createUser,
  resendActivation,
  uploadProfileImage
} = require('../controllers/user.controller');

// Get all users (Admin only)
router.get(
  '/users-all',
  verifyToken,
  allowRoles('admin'),
  getAllUsers
);

// Create user (Admin only)
router.post(
  '/',
  verifyToken,
  allowRoles('admin'),
  createUser
);

// Get logged-in user
router.get('/loggedin-user', verifyToken, (req, res) => {
  res.json({ user: req.user });
});

// Admin-only test endpoint
router.get(
  '/admin-data',
  verifyToken,
  allowRoles('admin'),
  (req, res) => {
    res.json({ message: 'Welcome admin' });
  }
);

// Resend activation email (Admin only)
router.post(
  '/:id/resend-activation',
  verifyToken,
  allowRoles('admin'),
  resendActivation
);

// Upload profile image
router.post(
  '/upload-profile-image',
  verifyToken,
  upload.single('image'),
  uploadProfileImage
);

// Get user by ID (Admin or Self, according to controller logic)
router.get(
  '/:id',
  verifyToken,
  getUserById
);

module.exports = router;
