/**
 * Authentication Routes
 * Local authentication endpoints for self-hosted installations
 */

import express from 'express';
import * as authService from '../auth/authService.js';
import { validateSession, getUserSessions, refreshSessionFreshness } from '../auth/sessions.js';
import { requireLocalAuth, requireFreshSession } from '../middleware/auth.js';
import { loginLimiter } from '../middleware/rateLimiting.js';
import { authBruteForceLimit } from '../middleware/security.js';
import validate from '../middleware/validation.js';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  verifyEmailSchema,
  confirmPasswordSchema,
} from '../validators/auth.validators.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user account
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, firstName, lastName, organizationId]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               organizationId:
 *                 type: string
 *                 format: uuid
 *               role:
 *                 type: string
 *                 enum: [ADMIN, PRACTITIONER, ASSISTANT]
 *               hprNumber:
 *                 type: string
 *     responses:
 *       201:
 *         description: Account created successfully
 *       400:
 *         description: Validation error or registration failed
 */
router.post('/register', loginLimiter, validate(registerSchema), async (req, res) => {
  try {
    const { email, password, firstName, lastName, organizationId, role, hprNumber } = req.body;

    const result = await authService.registerUser({
      email,
      password,
      firstName,
      lastName,
      organizationId,
      role,
      hprNumber,
    });

    // Set session cookie
    res.cookie('session', result.session.sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: result.session.expiresAt,
    });

    res.status(201).json({
      message: 'Account created successfully',
      user: result.user,
      // In dev, return verify token for testing. In prod, send email
      ...(process.env.NODE_ENV === 'development' && {
        emailVerifyToken: result.emailVerifyToken,
      }),
    });
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(400).json({
      error: 'Registration Failed',
      message: error.message,
    });
  }
});

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login with email and password
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful, session cookie set
 *       401:
 *         description: Invalid credentials
 */
router.post(
  '/login',
  loginLimiter,
  authBruteForceLimit,
  validate(loginSchema),
  async (req, res) => {
    try {
      const { email, password } = req.body;

      const result = await authService.loginWithPassword(email, password, {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      // Set session cookie
      res.cookie('session', result.session.sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        expires: result.session.expiresAt,
      });

      res.json({
        message: 'Login successful',
        user: result.user,
      });
    } catch (error) {
      logger.error('Login error:', error);
      res.status(401).json({
        error: 'Authentication Failed',
        message: error.message,
      });
    }
  }
);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout current session
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Logged out successfully
 *       500:
 *         description: Server error
 */
router.post('/logout', async (req, res) => {
  try {
    const sessionId = req.cookies?.session;

    if (sessionId) {
      await authService.logout(sessionId);
    }

    res.clearCookie('session');

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({
      error: 'Logout Failed',
      message: 'An error occurred during logout',
    });
  }
});

/**
 * @swagger
 * /auth/logout-all:
 *   post:
 *     summary: Logout from all devices
 *     tags: [Auth]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out from all devices
 *       500:
 *         description: Server error
 */
router.post('/logout-all', requireLocalAuth, async (req, res) => {
  try {
    await authService.logoutAllDevices(req.user.id);
    res.clearCookie('session');

    res.json({ message: 'Logged out from all devices' });
  } catch (error) {
    logger.error('Logout all error:', error);
    res.status(500).json({
      error: 'Logout Failed',
      message: 'An error occurred during logout',
    });
  }
});

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current authenticated user info
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Current user and session info
 *       401:
 *         description: Not authenticated
 */
router.get('/me', requireLocalAuth, async (req, res) => {
  res.json({
    user: req.user,
    session: {
      fresh: req.session?.fresh || false,
    },
  });
});

/**
 * @swagger
 * /auth/sessions:
 *   get:
 *     summary: Get all active sessions for current user
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: List of active sessions
 *       401:
 *         description: Not authenticated
 */
router.get('/sessions', requireLocalAuth, async (req, res) => {
  try {
    const sessions = await getUserSessions(req.user.id);

    // Mark current session
    const currentSessionId = req.cookies?.session?.substring(0, 8) + '...';
    sessions.forEach((s) => {
      s.current = s.id === currentSessionId;
    });

    res.json({ sessions });
  } catch (error) {
    logger.error('Get sessions error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Failed to retrieve sessions',
    });
  }
});

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Reset email sent (always returns success to prevent enumeration)
 */
router.post('/forgot-password', validate(forgotPasswordSchema), async (req, res) => {
  try {
    const { email } = req.body;

    const result = await authService.requestPasswordReset(email);

    // Always return success to prevent email enumeration
    res.json({
      message: 'If an account exists with this email, a reset link has been sent',
      // In dev, return token for testing. In prod, send email
      ...(process.env.NODE_ENV === 'development' &&
        result && {
          resetToken: result.token,
        }),
    });
  } catch (error) {
    logger.error('Password reset request error:', error);
    res.json({
      message: 'If an account exists with this email, a reset link has been sent',
    });
  }
});

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset password with token
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, password]
 *             properties:
 *               token:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Invalid or expired token
 */
router.post('/reset-password', validate(resetPasswordSchema), async (req, res) => {
  try {
    const { token, password } = req.body;

    await authService.resetPassword(token, password);

    res.json({
      message: 'Password has been reset successfully. Please login with your new password',
    });
  } catch (error) {
    logger.error('Password reset error:', error);
    res.status(400).json({
      error: 'Reset Failed',
      message: error.message,
    });
  }
});

/**
 * @swagger
 * /auth/change-password:
 *   post:
 *     summary: Change password (requires fresh session)
 *     tags: [Auth]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password changed
 *       400:
 *         description: Invalid current password
 *       401:
 *         description: Session not fresh
 */
router.post(
  '/change-password',
  requireLocalAuth,
  requireFreshSession,
  validate(changePasswordSchema),
  async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;

      await authService.changePassword(req.user.id, currentPassword, newPassword);

      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      logger.error('Password change error:', error);
      res.status(400).json({
        error: 'Change Failed',
        message: error.message,
      });
    }
  }
);

/**
 * @swagger
 * /auth/verify-email:
 *   post:
 *     summary: Verify email address with token
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token]
 *             properties:
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email verified
 *       400:
 *         description: Invalid or expired token
 */
router.post('/verify-email', validate(verifyEmailSchema), async (req, res) => {
  try {
    const { token } = req.body;

    await authService.verifyEmail(token);

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    logger.error('Email verification error:', error);
    res.status(400).json({
      error: 'Verification Failed',
      message: error.message,
    });
  }
});

/**
 * @swagger
 * /auth/resend-verification:
 *   post:
 *     summary: Resend email verification
 *     tags: [Auth]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Verification email sent
 *       400:
 *         description: Email already verified
 */
router.post('/resend-verification', requireLocalAuth, async (req, res) => {
  try {
    const token = await authService.resendVerification(req.user.id);

    res.json({
      message: 'Verification email sent',
      // In dev, return token for testing
      ...(process.env.NODE_ENV === 'development' && { token }),
    });
  } catch (error) {
    logger.error('Resend verification error:', error);
    res.status(400).json({
      error: 'Resend Failed',
      message: error.message,
    });
  }
});

/**
 * @swagger
 * /auth/confirm-password:
 *   post:
 *     summary: Confirm password to make session fresh for sensitive operations
 *     tags: [Auth]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [password]
 *             properties:
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Session refreshed
 *       401:
 *         description: Incorrect password
 */
router.post(
  '/confirm-password',
  requireLocalAuth,
  validate(confirmPasswordSchema),
  async (req, res) => {
    try {
      const { password } = req.body;

      // Verify password by attempting login
      await authService.loginWithPassword(req.user.email, password, {});

      // Refresh session freshness
      await refreshSessionFreshness(req.cookies?.session);

      res.json({ message: 'Password confirmed, session is now fresh' });
    } catch (error) {
      logger.error('Password confirmation error:', error);
      res.status(401).json({
        error: 'Confirmation Failed',
        message: 'Incorrect password',
      });
    }
  }
);

export default router;
