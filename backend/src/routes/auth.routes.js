const express = require('express');
const router = express.Router();
const { register, login, logout, refresh, forgotPassword, resetPassword, bootstrapAdmin } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const { authLimiter } = require('../middleware/rateLimit.middleware');
const {
  registerSchema, loginSchema, refreshSchema,
  forgotPasswordSchema, resetPasswordSchema,
} = require('../validators/auth.validator');

router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/logout', authenticate, logout);
router.post('/refresh', authLimiter, validate(refreshSchema), refresh);
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);
router.post('/bootstrap-admin', bootstrapAdmin);

module.exports = router;
