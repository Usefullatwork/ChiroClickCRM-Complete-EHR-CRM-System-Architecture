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
 * @swagger
 * /auth/helseid/login:
 *   get:
 *     summary: Initiate HelseID login flow
 *     description: >
 *       Generates a HelseID authorization URL with PKCE and redirects the browser
 *       to the Norwegian HelseID identity provider. Requests HPR number for
 *       healthcare personnel by default. The generated state value is stored in
 *       the session for CSRF verification on the callback.
 *     tags:
 *       - HelseID
 *     responses:
 *       302:
 *         description: Redirect to HelseID authorization endpoint.
 *         headers:
 *           Location:
 *             description: HelseID authorization URL including state and PKCE challenge.
 *             schema:
 *               type: string
 *               format: uri
 *       500:
 *         description: Failed to initialize HelseID client or build authorization URL.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: AuthenticationError
 *                 message:
 *                   type: string
 *                   example: Kunne ikke starte innlogging med HelseID
 */
router.get('/login', async (req, res) => {
  try {
    await helseId.initialize();

    const { authorizationUrl, state } = helseId.getAuthorizationUrl({
      requestHprNumber: true, // Request HPR number for healthcare personnel
      requestPid: false, // Don't request fødselsnummer by default
      locale: 'nb',
    });

    // Store state in session for verification
    req.session = req.session || {};
    req.session.helseIdState = state;

    res.redirect(authorizationUrl);
  } catch (error) {
    logger.error('HelseID login initiation failed', { error: error.message });
    res.status(500).json({
      error: 'AuthenticationError',
      message: 'Kunne ikke starte innlogging med HelseID',
    });
  }
});

/**
 * @swagger
 * /auth/helseid/callback:
 *   get:
 *     summary: Handle HelseID OAuth callback
 *     description: >
 *       Receives the authorization code from HelseID after the user authenticates.
 *       Verifies the state parameter against the session to prevent CSRF attacks,
 *       exchanges the authorization code for tokens, retrieves user info and HPR
 *       details, and creates or updates the user record in the database. On success
 *       the session is populated and the browser is redirected to the dashboard (or
 *       the original intended URL). On error the browser is redirected back to the
 *       login page with an error query parameter.
 *     tags:
 *       - HelseID
 *     parameters:
 *       - in: query
 *         name: code
 *         schema:
 *           type: string
 *         description: Authorization code issued by HelseID.
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         description: State value that must match the value stored in the session.
 *       - in: query
 *         name: error
 *         schema:
 *           type: string
 *         description: Error code returned by HelseID when authentication fails.
 *       - in: query
 *         name: error_description
 *         schema:
 *           type: string
 *         description: Human-readable description of the HelseID error.
 *     responses:
 *       302:
 *         description: >
 *           Redirect to dashboard on success, or to /login?error=... on failure
 *           (invalid state, HelseID error, or token exchange failure).
 *         headers:
 *           Location:
 *             description: Target URL after processing the callback.
 *             schema:
 *               type: string
 *               format: uri
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
      securityLevel: helseId.getSecurityLevel(tokens.claims),
    });

    // Create session
    req.session.userId = user.id;
    req.session.accessToken = tokens.accessToken;
    req.session.idToken = tokens.idToken;
    req.session.refreshToken = tokens.refreshToken;
    req.session.tokenExpiry = Date.now() + tokens.expiresIn * 1000;

    // Clear temporary state
    delete req.session.helseIdState;

    logger.info('HelseID login successful', {
      userId: user.id,
      hasHpr: !!hprInfo?.hprNumber,
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
 * @swagger
 * /auth/helseid/logout:
 *   get:
 *     summary: Initiate HelseID logout
 *     description: >
 *       Destroys the local session and, when an ID token is present, redirects
 *       the browser to the HelseID end-session endpoint to perform a federated
 *       (single sign-out) logout. If no ID token is available the browser is
 *       redirected directly to the application root. On unexpected errors the
 *       browser is also sent to the root so the user is never left on an error
 *       page.
 *     tags:
 *       - HelseID
 *     responses:
 *       302:
 *         description: >
 *           Redirect to HelseID end-session endpoint (federated logout) or to
 *           the application root when no ID token is present.
 *         headers:
 *           Location:
 *             description: Target URL after session destruction.
 *             schema:
 *               type: string
 *               format: uri
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
 * @swagger
 * /auth/helseid/refresh:
 *   post:
 *     summary: Refresh HelseID access token
 *     description: >
 *       Uses the refresh token stored in the current session to obtain a new
 *       access token from HelseID. No request body is required — authentication
 *       state is read entirely from the session cookie. The session is updated
 *       in-place with the new tokens and expiry time. Returns 401 both when no
 *       refresh token exists in the session and when the token exchange fails
 *       (e.g. the refresh token has expired or been revoked).
 *     tags:
 *       - HelseID
 *     security:
 *       - sessionCookie: []
 *     responses:
 *       200:
 *         description: Token refreshed successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 expiresIn:
 *                   type: integer
 *                   description: Remaining lifetime of the new access token in seconds.
 *                   example: 3600
 *       401:
 *         description: No refresh token in session, or token refresh rejected by HelseID.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: RefreshFailed
 *                 message:
 *                   type: string
 *                   example: Could not refresh token. Please log in again.
 */
router.post('/refresh', async (req, res) => {
  try {
    const refreshToken = req.session?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No refresh token available',
      });
    }

    const tokens = await helseId.refreshAccessToken(refreshToken);

    // Update session
    req.session.accessToken = tokens.access_token;
    req.session.refreshToken = tokens.refresh_token || refreshToken;
    req.session.tokenExpiry = Date.now() + tokens.expires_in * 1000;

    res.json({
      success: true,
      expiresIn: tokens.expires_in,
    });
  } catch (error) {
    logger.error('Token refresh failed', { error: error.message });
    res.status(401).json({
      error: 'RefreshFailed',
      message: 'Could not refresh token. Please log in again.',
    });
  }
});

/**
 * @swagger
 * /auth/helseid/userinfo:
 *   get:
 *     summary: Get current user info from HelseID
 *     description: >
 *       Calls the HelseID userinfo endpoint using the access token stored in the
 *       current session and returns the raw claims object. Requires an active
 *       authenticated session — returns 401 when no access token is present.
 *       Returns 500 when the HelseID userinfo endpoint itself returns an error.
 *     tags:
 *       - HelseID
 *     security:
 *       - sessionCookie: []
 *     responses:
 *       200:
 *         description: HelseID user info claims for the authenticated user.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               description: >
 *                 Standard OIDC userinfo claims returned by HelseID. Common
 *                 fields include sub, name, email, and hpr_number, but the
 *                 exact shape depends on the scopes requested during login.
 *               properties:
 *                 sub:
 *                   type: string
 *                   description: HelseID subject identifier (unique per user).
 *                   example: "c1234567-abcd-efgh-ijkl-mn0123456789"
 *                 name:
 *                   type: string
 *                   example: Ola Nordmann
 *                 email:
 *                   type: string
 *                   format: email
 *                   example: ola.nordmann@helfo.no
 *       401:
 *         description: No active session or access token not present in session.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Unauthorized
 *                 message:
 *                   type: string
 *                   example: Not authenticated
 *       500:
 *         description: HelseID userinfo endpoint returned an error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: UserInfoError
 *                 message:
 *                   type: string
 *                   example: Could not retrieve user information
 */
router.get('/userinfo', async (req, res) => {
  try {
    const accessToken = req.session?.accessToken;

    if (!accessToken) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Not authenticated',
      });
    }

    const userInfo = await helseId.getUserInfo(accessToken);
    res.json(userInfo);
  } catch (error) {
    logger.error('UserInfo request failed', { error: error.message });
    res.status(500).json({
      error: 'UserInfoError',
      message: 'Could not retrieve user information',
    });
  }
});

/**
 * Helper: Find or create user from HelseID claims
 */
async function findOrCreateUser(helseIdUser) {
  const { query } = await import('../config/database.js');

  // Try to find existing user by HelseID subject
  const existing = await query('SELECT * FROM users WHERE helseid_sub = $1', [helseIdUser.sub]);

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
      helseIdUser.securityLevel,
    ]
  );

  return result.rows[0];
}

export default router;
