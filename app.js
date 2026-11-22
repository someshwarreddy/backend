const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');

dotenv.config();
const app = express();
const router = express.Router();
router.use((req, res, next) => {
  console.log('USER ROUTER:', req.method, req.originalUrl);
  console.log('USER ROUTER PATH:', req.path);
  next();
});
app.use(cors());
app.use(express.json());
app.use(
  '/uploads',
  express.static(path.join(__dirname, 'uploads'))
);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

module.exports = app;
