
const express = require('express');
const router = express.Router();

const { verifyToken } = require('../middleware/verifyToken');
const { allowRoles } = require('../middleware/checkRole');

const {
  getUserReports
} = require('../controllers/report.controller');

// Get user reports (Admin only)
router.get(
  '/users',
  verifyToken,
  allowRoles('admin'),
  getUserReports
);

module.exports = router;
