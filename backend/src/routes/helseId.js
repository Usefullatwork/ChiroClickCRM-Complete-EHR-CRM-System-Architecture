/**
 * HelseID Authentication Routes
 * Norwegian Healthcare Identity Provider integration
 */

import express from 'express';
import HelseIdClient from '../services/helseId.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Initialize HelseID client
const helseId = new HelseIdClient();

/**
 * GET /auth/helseid/login
 * Initiates HelseID login flow
 */
router.get('/login', async (req, res) => {
    try {
        await helseId.initialize();

        const { authorizationUrl, state } = helseId.getAuthorizationUrl({
            requestHprNumber: true, // Request HPR number for healthcare personnel
            requestPid: false, // Don't request fødselsnummer by default
            locale: 'nb'
        });

        // Store state in session for verification
        req.session = req.session || {};
        req.session.helseIdState = state;

        res.redirect(authorizationUrl);
    } catch (error) {
        logger.error('HelseID login initiation failed', { error: error.message });
        res.status(500).json({
            error: 'AuthenticationError',
            message: 'Kunne ikke starte innlogging med HelseID'
        });
    }
});

/**
 * GET /auth/helseid/callback
 * Handles HelseID OAuth callback
 */
router.get('/callback', async (req, res) => {
    try {
        const { code, state, error, error_description } = req.query;

        // Check for errors from HelseID
        if (error) {
            logger.warn('HelseID callback error', { error, error_description });
            return res.redirect(`/login?error=${encodeURIComponent(error_description || error)}`);
        }

        // Verify state
        const storedState = req.session?.helseIdState;
        if (!state || state !== storedState) {
            logger.warn('HelseID state mismatch');
            return res.redirect('/login?error=invalid_state');
        }

        // Exchange code for tokens
        const tokens = await helseId.exchangeCodeForTokens(code, state);

        // Get user info
        const userInfo = await helseId.getUserInfo(tokens.accessToken);

        // Parse HPR information
        const hprInfo = helseId.parseHprNumber(tokens.claims);

        // Create or update user in database
        const user = await findOrCreateUser({
            sub: tokens.claims.sub,
            name: userInfo.name || tokens.claims.name,
            email: userInfo.email,
            hprNumber: hprInfo?.hprNumber,
            securityLevel: helseId.getSecurityLevel(tokens.claims)
        });

        // Create session
        req.session.userId = user.id;
        req.session.accessToken = tokens.accessToken;
        req.session.idToken = tokens.idToken;
        req.session.refreshToken = tokens.refreshToken;
        req.session.tokenExpiry = Date.now() + (tokens.expiresIn * 1000);

        // Clear temporary state
        delete req.session.helseIdState;

        logger.info('HelseID login successful', {
            userId: user.id,
            hasHpr: !!hprInfo?.hprNumber
        });

        // Redirect to dashboard or intended URL
        const returnTo = req.session.returnTo || '/dashboard';
        delete req.session.returnTo;
        res.redirect(returnTo);

    } catch (error) {
        logger.error('HelseID callback failed', { error: error.message });
        res.redirect('/login?error=authentication_failed');
    }
});

/**
 * GET /auth/helseid/logout
 * Initiates HelseID logout
 */
router.get('/logout', async (req, res) => {
    try {
        const idToken = req.session?.idToken;
        const postLogoutUrl = `${process.env.APP_URL || 'http://localhost:3000'}/`;

        // Clear session
        if (req.session) {
            req.session.destroy();
        }

        // If we have an ID token, perform HelseID logout
        if (idToken) {
            const logoutUrl = helseId.getLogoutUrl(idToken, postLogoutUrl);
            return res.redirect(logoutUrl);
        }

        res.redirect('/');
    } catch (error) {
        logger.error('HelseID logout failed', { error: error.message });
        res.redirect('/');
    }
});

/**
 * POST /auth/helseid/refresh
 * Refresh access token
 */
router.post('/refresh', async (req, res) => {
    try {
        const refreshToken = req.session?.refreshToken;

        if (!refreshToken) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'No refresh token available'
            });
        }

        const tokens = await helseId.refreshAccessToken(refreshToken);

        // Update session
        req.session.accessToken = tokens.access_token;
        req.session.refreshToken = tokens.refresh_token || refreshToken;
        req.session.tokenExpiry = Date.now() + (tokens.expires_in * 1000);

        res.json({
            success: true,
            expiresIn: tokens.expires_in
        });
    } catch (error) {
        logger.error('Token refresh failed', { error: error.message });
        res.status(401).json({
            error: 'RefreshFailed',
            message: 'Could not refresh token. Please log in again.'
        });
    }
});

/**
 * GET /auth/helseid/userinfo
 * Get current user info from HelseID
 */
router.get('/userinfo', async (req, res) => {
    try {
        const accessToken = req.session?.accessToken;

        if (!accessToken) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Not authenticated'
            });
        }

        const userInfo = await helseId.getUserInfo(accessToken);
        res.json(userInfo);
    } catch (error) {
        logger.error('UserInfo request failed', { error: error.message });
        res.status(500).json({
            error: 'UserInfoError',
            message: 'Could not retrieve user information'
        });
    }
});

/**
 * Helper: Find or create user from HelseID claims
 */
async function findOrCreateUser(helseIdUser) {
    const { query } = await import('../config/database.js');

    // Try to find existing user by HelseID subject
    const existing = await query(
        'SELECT * FROM users WHERE helseid_sub = $1',
        [helseIdUser.sub]
    );

    if (existing.rows.length > 0) {
        // Update last login
        await query(
            `UPDATE users SET
                last_login = CURRENT_TIMESTAMP,
                hpr_number = COALESCE($2, hpr_number),
                security_level = $3
            WHERE id = $4`,
            [helseIdUser.hprNumber, helseIdUser.securityLevel, existing.rows[0].id]
        );
        return existing.rows[0];
    }

    // Create new user
    const result = await query(
        `INSERT INTO users (
            helseid_sub,
            name,
            email,
            hpr_number,
            security_level,
            created_at,
            last_login
        ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *`,
        [
            helseIdUser.sub,
            helseIdUser.name,
            helseIdUser.email,
            helseIdUser.hprNumber,
            helseIdUser.securityLevel
        ]
    );

    return result.rows[0];
}

export default router;
