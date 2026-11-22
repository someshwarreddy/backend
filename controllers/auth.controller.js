const User = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({
        message: 'Name, email and password are required'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const hashed = await bcrypt.hash(password, 10);

    const user = new User({
      name: name.trim(),
      email: normalizedEmail,
      password: hashed,
      role: 'user'
    });

    await user.save();

    res.status(201).json({
      message: 'Registration successful'
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: 'Email already exists'
      });
    }

    console.error('Registration error:', error);

    res.status(500).json({
      message: 'Registration failed'
    });
  }
};

// exports.login = async (req, res) => {
//   const { email, password } = req.body;
//   const user = await User.findOne({ email });
//   if (!user || !(await bcrypt.compare(password, user.password)))
//     return res.status(400).json({ message: 'Invalid credentials' });

//   const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
//   res.json({ token });
// };
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email?.trim() || !password) {
      return res.status(400).json({
        message: 'Email and password are required'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail
    });

    if (!user) {
      return res.status(401).json({
        message: 'Invalid email or password'
      });
    }

    if (user.status === 'pending') {
      return res.status(403).json({
        message: 'Please activate your account before logging in'
      });
    }

    if (!user.password || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        message: 'Invalid email or password'
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(200).json({ token });

  } catch (error) {
    console.error('Login error:', error);

    res.status(500).json({
      message: 'Login failed'
    });
  }
};
exports.activateAccount = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        message: 'Token and password are required'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: 'Password must contain at least 8 characters'
      });
    }

    // Hash the received token
    const activationTokenHash = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find account with a valid, unexpired activation token
    const user = await User.findOne({
      activationTokenHash,
      activationTokenExpires: { $gt: new Date() },
      status: 'pending'
    }).select('+activationTokenHash +activationTokenExpires');

    if (!user) {
      return res.status(400).json({
        message: 'Invalid or expired activation link'
      });
    }

    // Set password
    user.password = await bcrypt.hash(password, 10);

    // Activate account
    user.status = 'active';

    // Make activation token unusable
    user.activationTokenHash = undefined;
    user.activationTokenExpires = undefined;

    await user.save();

    return res.status(200).json({
  message: 'Account activated successfully. You can now log in.',
  user: {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status
  }
});

  } catch (error) {
    console.error('Account activation error:', error);

    res.status(500).json({
      message: 'Account activation failed'
    });
  }
};
exports.checkmail = async (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ error: 'Email query param is required' });
  }

  try {
    const user = await User.findOne({ email });
    res.json({ exists: !!user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};
