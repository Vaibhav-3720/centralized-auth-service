const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const rateLimiter = require('../middleware/rateLimiter');
const authGuard = require('../middleware/authGuard');

// Public endpoint for registration
router.post('/register', authController.register);

// Endpoint for login, protected by custom rate limiter (max 5 requests per minute)
router.post('/login', rateLimiter, authController.login);

// Endpoint for logout, protected by JWT authentication check (blacklists token)
router.post('/logout', authGuard, authController.logout);

// Protected dummy endpoint to test validation of JWT tokens and check the blacklist
router.get('/profile', authGuard, (req, res) => {
  res.status(200).json({
    message: 'Authorized access to profile route.',
    user: req.user
  });
});

module.exports = router;
