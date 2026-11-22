const express = require('express');
const {
  register,
  login,
  checkmail,
  activateAccount
} = require('../controllers/auth.controller');


const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/checkmail', checkmail);
router.post('/activate', activateAccount);

module.exports = router;
