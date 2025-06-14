// src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Route for user registration
router.post('/register', authController.register);

// Route for user login
router.post('/login', authController.login);

module.exports = router;