const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/login', authController.login);

// API chạy 1 lần để tạo tài khoản admin test
router.get('/seed', authController.seedAdmin);

module.exports = router;