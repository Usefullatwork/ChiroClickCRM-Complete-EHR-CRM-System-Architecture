/**
 * Authentication Routes
 * Local authentication endpoints for self-hosted installations
 */

import express from 'express';
import * as authService from '../auth/authService.js';
import { validateSession, getUserSessions, refreshSessionFreshness } from '../auth/sessions.js';
import { requireLocalAuth, requireFreshSession } from '../middleware/auth.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * POST /auth/register
 * Register a new user account
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, organizationId, role, hprNumber } = req.body;

    if (!email || !password || !firstName || !lastName || !organizationId) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Email, password, first name, last name, and organization ID are required'
      });
    }

    const result = await authService.registerUser({
      email,
      password,
      firstName,
      lastName,
      organizationId,
      role,
      hprNumber
    });

    // Set session cookie
    res.cookie('session', result.session.sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: result.session.expiresAt
    });

    res.status(201).json({
      message: 'Account created successfully',
      user: result.user,
      // In dev, return verify token for testing. In prod, send email
      ...(process.env.NODE_ENV === 'development' && {
        emailVerifyToken: result.emailVerifyToken
      })
    });
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(400).json({
      error: 'Registration Failed',
      message: error.message
    });
  }
});

/**
 * POST /auth/login
 * Login with email and password
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Email and password are required'
      });
    }

    const result = await authService.loginWithPassword(email, password, {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    // Set session cookie
    res.cookie('session', result.session.sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: result.session.expiresAt
    });

    res.json({
      message: 'Login successful',
      user: result.user
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(401).json({
      error: 'Authentication Failed',
      message: error.message
    });
  }
});

/**
 * POST /auth/logout
 * Logout current session
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
      message: 'An error occurred during logout'
    });
  }
});

/**
 * POST /auth/logout-all
 * Logout from all devices
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
      message: 'An error occurred during logout'
    });
  }
});

/**
 * GET /auth/me
 * Get current user info
 */
router.get('/me', requireLocalAuth, async (req, res) => {
  res.json({
    user: req.user,
    session: {
      fresh: req.session?.fresh || false
    }
  });
});

/**
 * GET /auth/sessions
 * Get all active sessions for current user
 */
router.get('/sessions', requireLocalAuth, async (req, res) => {
  try {
    const sessions = await getUserSessions(req.user.id);

    // Mark current session
    const currentSessionId = req.cookies?.session?.substring(0, 8) + '...';
    sessions.forEach(s => {
      s.current = s.id === currentSessionId;
    });

    res.json({ sessions });
  } catch (error) {
    logger.error('Get sessions error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Failed to retrieve sessions'
    });
  }
});

/**
 * POST /auth/forgot-password
 * Request password reset
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Email is required'
      });
    }

    const result = await authService.requestPasswordReset(email);

    // Always return success to prevent email enumeration
    res.json({
      message: 'If an account exists with this email, a reset link has been sent',
      // In dev, return token for testing. In prod, send email
      ...(process.env.NODE_ENV === 'development' && result && {
        resetToken: result.token
      })
    });
  } catch (error) {
    logger.error('Password reset request error:', error);
    res.json({
      message: 'If an account exists with this email, a reset link has been sent'
    });
  }
});

/**
 * POST /auth/reset-password
 * Reset password with token
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Token and new password are required'
      });
    }

    await authService.resetPassword(token, password);

    res.json({ message: 'Password has been reset successfully. Please login with your new password' });
  } catch (error) {
    logger.error('Password reset error:', error);
    res.status(400).json({
      error: 'Reset Failed',
      message: error.message
    });
  }
});

/**
 * POST /auth/change-password
 * Change password (authenticated, requires fresh session)
 */
router.post('/change-password', requireLocalAuth, requireFreshSession, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Current password and new password are required'
      });
    }

    await authService.changePassword(req.user.id, currentPassword, newPassword);

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    logger.error('Password change error:', error);
    res.status(400).json({
      error: 'Change Failed',
      message: error.message
    });
  }
});

/**
 * POST /auth/verify-email
 * Verify email address
 */
router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Verification token is required'
      });
    }

    await authService.verifyEmail(token);

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    logger.error('Email verification error:', error);
    res.status(400).json({
      error: 'Verification Failed',
      message: error.message
    });
  }
});

/**
 * POST /auth/resend-verification
 * Resend email verification
 */
router.post('/resend-verification', requireLocalAuth, async (req, res) => {
  try {
    const token = await authService.resendVerification(req.user.id);

    res.json({
      message: 'Verification email sent',
      // In dev, return token for testing
      ...(process.env.NODE_ENV === 'development' && { token })
    });
  } catch (error) {
    logger.error('Resend verification error:', error);
    res.status(400).json({
      error: 'Resend Failed',
      message: error.message
    });
  }
});

/**
 * POST /auth/confirm-password
 * Confirm password to make session "fresh" for sensitive operations
 */
router.post('/confirm-password', requireLocalAuth, async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Password is required'
      });
    }

    // Verify password by attempting login
    await authService.loginWithPassword(req.user.email, password, {});

    // Refresh session freshness
    await refreshSessionFreshness(req.cookies?.session);

    res.json({ message: 'Password confirmed, session is now fresh' });
  } catch (error) {
    logger.error('Password confirmation error:', error);
    res.status(401).json({
      error: 'Confirmation Failed',
      message: 'Incorrect password'
    });
  }
});

export default router;
