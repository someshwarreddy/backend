// controllers/user.controller.js
const User = require('../models/user.model');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { sendActivationEmail } = require('../services/email.service');
// Get all users (Admin only)
exports.getAllUsers = async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);
    const skip = (page - 1) * limit;
    const search = req.query.search?.trim();

    const filter = search
      ? {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { role: { $regex: search, $options: 'i' } },
          { status: { $regex: search, $options: 'i' } }
        ]
      }
      : {};

    const [users, total] = await Promise.all([
      User.find(filter, '-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(filter)
    ]);

    res.status(200).json({
      users,
      total,
      skip,
      limit
    });
  } catch (err) {
    res.status(500).json({
      message: 'Server error',
      error: err.message
    });
  }
};



// Update user role (Admin only)
exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const userId = req.params.id;

    if (!['admin', 'user'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) return res.status(404).json({ message: 'User not found' });

    res.status(200).json({ message: 'Role updated', user: updatedUser });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Delete user (Admin only)
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const deleted = await User.findByIdAndDelete(userId);
    if (!deleted) return res.status(404).json({ message: 'User not found' });

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
exports.createUser = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      age,
      role,
      gender,
      image,
      username,
      company
    } = req.body;

    // Validate required fields
    if (!name?.trim() || !email?.trim()) {
      return res.status(400).json({
        message: 'Name and email are required'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check duplicate email
    const existingUser = await User.findOne({
      email: normalizedEmail
    });

    if (existingUser) {
      return res.status(409).json({
        message: 'Email already exists'
      });
    }

    // Validate role
    const allowedRoles = ['admin', 'user'];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        message: 'Invalid role'
      });
    }

    // Generate secure activation token
    const activationToken = crypto.randomBytes(32).toString('hex');

    const activationTokenHash = crypto
      .createHash('sha256')
      .update(activationToken)
      .digest('hex');

    const user = new User({
      name: name.trim(),
      email: normalizedEmail,
      phone,
      age,
      role,
      gender,
      image,
      username,
      company,
      status: 'pending',
      activationTokenHash,
      activationTokenExpires: Date.now() + 24 * 60 * 60 * 1000
    });

    await user.save();
    let emailSent = false;

    const activationUrl =
      `${process.env.FRONTEND_URL}/activate?token=${encodeURIComponent(activationToken)}`;

    try {
      await sendActivationEmail({
        to: user.email,
        name: user.name,
        activationUrl
      });

      emailSent = true;
    } catch (emailError) {
      console.error('Activation email error:', emailError);
    }

    // Never expose the activation token in production.
    const response = {
      message: 'User created successfully. Activation is pending.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      }
    };

    if (process.env.NODE_ENV !== 'production') {
      response.activationToken = activationToken;
    }

    return res.status(201).json({
      message: emailSent
        ? 'User created successfully. Activation email sent.'
        : 'User created successfully, but activation email could not be sent. Please resend activation.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      },
      emailSent
    });

  } catch (error) {
    console.error('Create user error:', error);

    res.status(500).json({
      message: 'Failed to create user'
    });
  }
};

exports.resendActivation = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the user
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    // Only pending accounts need activation
    if (user.status === 'active') {
      return res.status(409).json({
        message: 'This account is already activated'
      });
    }

    // Generate a fresh activation token
    const activationToken = crypto
      .randomBytes(32)
      .toString('hex');

    // Store only the hashed token
    const activationTokenHash = crypto
      .createHash('sha256')
      .update(activationToken)
      .digest('hex');

    user.activationTokenHash = activationTokenHash;
    user.activationTokenExpires = new Date(
      Date.now() + 24 * 60 * 60 * 1000
    );

    await user.save();
    const activationUrl =
      `${process.env.FRONTEND_URL}/activate?token=${encodeURIComponent(activationToken)}`;

    let emailSent = false;

    try {
      await sendActivationEmail({
        to: user.email,
        name: user.name,
        activationUrl
      });

      emailSent = true;
    } catch (emailError) {
      console.error('Resend activation email error:', emailError);
    }

    return res.status(200).json({
      message: emailSent
        ? 'Activation email sent successfully'
        : 'Activation token generated, but email could not be sent',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        status: user.status
      },
      emailSent
    });

   // Development testing only
if (process.env.NODE_ENV !== 'production') {
  response.activationToken = activationToken;
}

    return res.status(200).json(response);

  } catch (error) {
    console.error('Resend activation error:', error);

    return res.status(500).json({
      message: 'Failed to generate activation token'
    });
  }
};
// Upload user profile image
exports.uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: 'Please select an image'
      });
    }

    const userId = req.user._id;

    const imagePath = `/uploads/users/${req.file.filename}`;

    const user = await User.findByIdAndUpdate(
      userId,
      { image: imagePath },
      { new: true, select: '-password' }
    );

    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    res.status(200).json({
      message: 'Profile image uploaded successfully',
      user
    });

  } catch (err) {
    res.status(500).json({
      message: 'Image upload failed',
      error: err.message
    });
  }
};
// Get single user by ID (Admin or Self)
exports.getUserById = async (req, res) => {
  try {
    const userId = req.params.id;
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const user = await User.findById(userId, '-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.status(200).json({ user });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};