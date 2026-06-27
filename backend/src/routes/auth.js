import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  forgotPassword,
  login,
  logout,
  me,
  resetPassword,
  signup
} from '../controllers/authController.js';
import { authenticate } from '../middleware/authenticate.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts. Please try again in 15 minutes.' }
});

const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests. Please try again in 15 minutes.' }
});

const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many accounts created from this IP. Please try again later.' }
});

const router = Router();

router.post('/login', loginLimiter, asyncHandler(login));
router.post('/logout', asyncHandler(logout));
router.get('/me', authenticate, asyncHandler(me));
router.post('/forgot-password', passwordResetLimiter, asyncHandler(forgotPassword));
router.post('/reset-password', passwordResetLimiter, asyncHandler(resetPassword));
router.post('/signup', signupLimiter, asyncHandler(signup));

export default router;
