const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

exports.verifyToken = async (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      message: 'No token provided'
    });
  }

  try {
   const decoded = jwt.verify(token, process.env.JWT_SECRET);

console.log('Decoded JWT:', decoded);

const user = await User.findById(decoded.id).select('-password');

console.log('Authenticated user:', user);;

    if (!user) {
      return res.status(401).json({
        message: 'User no longer exists'
      });
    }

    req.user = user;
    next();

  } catch (err) {
    console.error('Authentication middleware error:', err);

    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(403).json({
        message: 'Invalid or expired token'
      });
    }

    return res.status(500).json({
      message: 'Authentication server error'
    });
  }
};