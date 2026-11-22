const express = require('express');
const { verifyToken } = require('../middleware/verifyToken');
const { allowRoles } = require('../middleware/checkRole');

const {
  getAllUsers,
  getUserById,
  createUser,
  resendActivation,
  uploadProfileImage
} = require('../controllers/user.controller');
const upload = require('../middleware/upload');
const router = express.Router();

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
router.get('/admin-data', verifyToken, allowRoles('admin'), (req, res) => {
  res.json({ message: 'Welcome admin' });
});
// Resend -activation endpoint
router.post(
  '/:id/resend-activation',
  verifyToken,
  allowRoles('admin'),
  resendActivation
);

router.post(
  '/upload-profile-image',
  verifyToken,
  upload.single('image'),
  uploadProfileImage
);



// Get user by ID (Admin only)
router.get(
  '/:id',
  verifyToken,
  getUserById
);
// resend activation
router.post(
  '/:id/resend-activation',
  verifyToken,
  allowRoles('admin'),
  resendActivation
);
// upload profile image
router.post(
  '/upload-profile-image',
  (req, res, next) => {
    console.log('UPLOAD ROUTE MATCHED');
    next();
  },
  verifyToken,
  upload.single('image'),
  uploadProfileImage
);
// 
router.get('/:id', verifyToken, getUserById);

module.exports = router;