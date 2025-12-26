/**
 * HelseID Authentication Service
 * Norwegian Health Network Identity Provider Integration
 *
 * HelseID is the national identity solution for the Norwegian health sector.
 * This service provides integration with HelseID for authentication and
 * HPR (Health Personnel Registry) validation.
 *
 * @see https://www.nhn.no/helseid
 * @see https://helseid.atlassian.net/wiki/spaces/HELSEID/
 */

import { Issuer, generators } from 'openid-client';
import logger from '../utils/logger.js';
import { query } from '../config/database.js';

// ============================================================================
// CONFIGURATION
// ============================================================================

const HELSEID_CONFIG = {
  // Production endpoints
  production: {
    issuer: 'https://helseid.no',
    authorization_endpoint: 'https://helseid.no/connect/authorize',
    token_endpoint: 'https://helseid.no/connect/token',
    userinfo_endpoint: 'https://helseid.no/connect/userinfo',
    jwks_uri: 'https://helseid.no/.well-known/openid-configuration/jwks'
  },
  // Test endpoints
  test: {
    issuer: 'https://helseid-sts.test.nhn.no',
    authorization_endpoint: 'https://helseid-sts.test.nhn.no/connect/authorize',
    token_endpoint: 'https://helseid-sts.test.nhn.no/connect/token',
    userinfo_endpoint: 'https://helseid-sts.test.nhn.no/connect/userinfo',
    jwks_uri: 'https://helseid-sts.test.nhn.no/.well-known/openid-configuration/jwks'
  }
};

// Environment configuration
const ENVIRONMENT = process.env.HELSEID_ENV || 'test';
const CLIENT_ID = process.env.HELSEID_CLIENT_ID;
const CLIENT_SECRET = process.env.HELSEID_CLIENT_SECRET;
const REDIRECT_URI = process.env.HELSEID_REDIRECT_URI || 'http://localhost:3000/auth/helseid/callback';

// Scopes for HelseID
const SCOPES = [
  'openid',
  'profile',
  'helseid://scopes/identity/pid', // Personal ID (fødselsnummer)
  'helseid://scopes/identity/assurance_level',
  'helseid://scopes/hpr/hpr_number', // HPR number
  'helseid://scopes/identity/security_level'
];

// ============================================================================
// HELSEID CLIENT SETUP
// ============================================================================

let helseIdClient = null;

/**
 * Initialize HelseID OpenID Connect client
 */
export const setupHelseID = async () => {
  try {
    const config = HELSEID_CONFIG[ENVIRONMENT];

    if (!CLIENT_ID || !CLIENT_SECRET) {
      logger.warn('HelseID credentials not configured. Running in stub mode.');
      return null;
    }

    // Discover HelseID issuer
    const helseIdIssuer = await Issuer.discover(config.issuer);

    logger.info('HelseID issuer discovered:', helseIdIssuer.issuer);

    // Create client
    helseIdClient = new helseIdIssuer.Client({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uris: [REDIRECT_URI],
      response_types: ['code'],
      token_endpoint_auth_method: 'client_secret_post'
    });

    logger.info('HelseID client initialized successfully');
    return helseIdClient;

  } catch (error) {
    logger.error('HelseID setup error:', error);
    throw error;
  }
};

/**
 * Get HelseID client (initialize if needed)
 */
export const getHelseIdClient = async () => {
  if (!helseIdClient) {
    await setupHelseID();
  }
  return helseIdClient;
};

// ============================================================================
// AUTHENTICATION FLOW
// ============================================================================

/**
 * Generate HelseID authorization URL
 */
export const getAuthorizationUrl = async (state = null, nonce = null) => {
  const client = await getHelseIdClient();

  if (!client) {
    throw new Error('HelseID not configured');
  }

  const generatedState = state || generators.state();
  const generatedNonce = nonce || generators.nonce();
  const codeVerifier = generators.codeVerifier();
  const codeChallenge = generators.codeChallenge(codeVerifier);

  const authUrl = client.authorizationUrl({
    scope: SCOPES.join(' '),
    state: generatedState,
    nonce: generatedNonce,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    acr_values: 'idporten-loa-high' // Require high level of assurance
  });

  return {
    url: authUrl,
    state: generatedState,
    nonce: generatedNonce,
    codeVerifier
  };
};

/**
 * Handle HelseID callback and exchange code for tokens
 */
export const handleCallback = async (callbackParams, storedState, storedNonce, codeVerifier) => {
  const client = await getHelseIdClient();

  if (!client) {
    throw new Error('HelseID not configured');
  }

  try {
    // Exchange code for tokens
    const tokenSet = await client.callback(
      REDIRECT_URI,
      callbackParams,
      {
        state: storedState,
        nonce: storedNonce,
        code_verifier: codeVerifier
      }
    );

    // Get user info
    const userInfo = await client.userinfo(tokenSet.access_token);

    return {
      tokens: {
        accessToken: tokenSet.access_token,
        refreshToken: tokenSet.refresh_token,
        idToken: tokenSet.id_token,
        expiresAt: tokenSet.expires_at
      },
      claims: tokenSet.claims(),
      userInfo
    };

  } catch (error) {
    logger.error('HelseID callback error:', error);
    throw error;
  }
};

/**
 * Extract HPR number from HelseID claims
 */
export const extractHprNumber = (claims) => {
  // HPR number is typically in the 'helseid://claims/hpr/hpr_number' claim
  return claims['helseid://claims/hpr/hpr_number'] ||
         claims['hpr_number'] ||
         claims.hpr_number ||
         null;
};

/**
 * Extract fødselsnummer from HelseID claims
 */
export const extractPersonalNumber = (claims) => {
  return claims['helseid://claims/identity/pid'] ||
         claims['pid'] ||
         claims.pid ||
         null;
};

// ============================================================================
// HPR VALIDATION
// ============================================================================

/**
 * Validate HPR number against Health Personnel Registry
 * Note: This is a stub - actual implementation requires NHN API access
 */
export const validateHprNumber = async (hprNumber) => {
  if (!hprNumber) {
    return {
      valid: false,
      error: 'HPR number not provided'
    };
  }

  // HPR number format validation (9 digits)
  if (!/^\d{9}$/.test(hprNumber)) {
    return {
      valid: false,
      error: 'Invalid HPR number format'
    };
  }

  // In production, this would call the HPR API
  // For now, we do a basic format check and database lookup
  try {
    const result = await query(
      `SELECT id, first_name, last_name, role, license_valid_until
       FROM users
       WHERE hpr_number = $1 AND is_active = true`,
      [hprNumber]
    );

    if (result.rows.length === 0) {
      return {
        valid: false,
        error: 'HPR number not found in system'
      };
    }

    const user = result.rows[0];
    const isLicenseValid = !user.license_valid_until ||
      new Date(user.license_valid_until) > new Date();

    return {
      valid: isLicenseValid,
      user: {
        id: user.id,
        name: `${user.first_name} ${user.last_name}`,
        role: user.role
      },
      licenseValidUntil: user.license_valid_until,
      error: isLicenseValid ? null : 'License has expired'
    };

  } catch (error) {
    logger.error('HPR validation error:', error);
    return {
      valid: false,
      error: 'Validation service error'
    };
  }
};

// ============================================================================
// NORWEGIAN ID (FØDSELSNUMMER) VALIDATION
// ============================================================================

/**
 * Validate Norwegian fødselsnummer (11 digits with checksum)
 */
export const validateFodselsnummer = (fnr) => {
  if (!fnr || typeof fnr !== 'string') {
    return { valid: false, error: 'Fødselsnummer not provided' };
  }

  // Remove any spaces or dashes
  const cleanFnr = fnr.replace(/[\s-]/g, '');

  // Must be 11 digits
  if (!/^\d{11}$/.test(cleanFnr)) {
    return { valid: false, error: 'Must be 11 digits' };
  }

  const digits = cleanFnr.split('').map(Number);

  // Control digit 1 (position 10, index 9)
  const weights1 = [3, 7, 6, 1, 8, 9, 4, 5, 2];
  let sum1 = 0;
  for (let i = 0; i < 9; i++) {
    sum1 += digits[i] * weights1[i];
  }
  const control1 = 11 - (sum1 % 11);
  const expectedControl1 = control1 === 11 ? 0 : control1;

  if (expectedControl1 === 10 || digits[9] !== expectedControl1) {
    return { valid: false, error: 'Invalid control digit 1' };
  }

  // Control digit 2 (position 11, index 10)
  const weights2 = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  let sum2 = 0;
  for (let i = 0; i < 10; i++) {
    sum2 += digits[i] * weights2[i];
  }
  const control2 = 11 - (sum2 % 11);
  const expectedControl2 = control2 === 11 ? 0 : control2;

  if (expectedControl2 === 10 || digits[10] !== expectedControl2) {
    return { valid: false, error: 'Invalid control digit 2' };
  }

  // Extract date components
  const day = parseInt(cleanFnr.substring(0, 2), 10);
  const month = parseInt(cleanFnr.substring(2, 4), 10);
  const year = parseInt(cleanFnr.substring(4, 6), 10);
  const individual = parseInt(cleanFnr.substring(6, 9), 10);

  // Determine century and full year
  let century;
  if (individual >= 0 && individual <= 499) {
    century = year >= 0 && year <= 99 ? 1900 : 1900;
  } else if (individual >= 500 && individual <= 749 && year >= 54) {
    century = 1800;
  } else if (individual >= 500 && individual <= 999 && year >= 0 && year <= 39) {
    century = 2000;
  } else if (individual >= 900 && individual <= 999 && year >= 40) {
    century = 1900;
  } else {
    century = 1900;
  }

  const fullYear = century + year;

  // Determine gender (odd individual number = male)
  const gender = individual % 2 === 0 ? 'FEMALE' : 'MALE';

  // Check for D-number (temporary number for foreigners)
  const isDNumber = day > 40;
  const actualDay = isDNumber ? day - 40 : day;

  // Validate date
  const birthDate = new Date(fullYear, month - 1, actualDay);
  const isValidDate = birthDate.getFullYear() === fullYear &&
                      birthDate.getMonth() === month - 1 &&
                      birthDate.getDate() === actualDay;

  if (!isValidDate) {
    return { valid: false, error: 'Invalid birth date' };
  }

  return {
    valid: true,
    birthDate: birthDate.toISOString().split('T')[0],
    gender,
    isDNumber,
    age: Math.floor((new Date() - birthDate) / (365.25 * 24 * 60 * 60 * 1000))
  };
};

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

/**
 * Create or update user from HelseID authentication
 */
export const createOrUpdateUserFromHelseId = async (helseIdData, organizationId) => {
  const { claims, userInfo } = helseIdData;

  const hprNumber = extractHprNumber(claims);
  const personalNumber = extractPersonalNumber(claims);

  // Validate HPR number
  if (hprNumber) {
    const hprValidation = await validateHprNumber(hprNumber);
    if (!hprValidation.valid && !hprValidation.user) {
      logger.warn(`Invalid HPR number attempted login: ${hprNumber}`);
    }
  }

  // Check if user exists
  const existingUser = await query(
    `SELECT * FROM users
     WHERE hpr_number = $1 OR email = $2`,
    [hprNumber, userInfo.email]
  );

  if (existingUser.rows.length > 0) {
    // Update existing user
    const user = existingUser.rows[0];
    await query(
      `UPDATE users SET
        last_login_at = NOW(),
        hpr_number = COALESCE($1, hpr_number),
        updated_at = NOW()
       WHERE id = $2`,
      [hprNumber, user.id]
    );

    return { user, isNewUser: false };
  }

  // Create new user
  const newUserResult = await query(
    `INSERT INTO users (
      organization_id, email, first_name, last_name,
      role, hpr_number, is_active, last_login_at
     ) VALUES ($1, $2, $3, $4, 'PRACTITIONER', $5, true, NOW())
     RETURNING *`,
    [
      organizationId,
      userInfo.email,
      userInfo.given_name || userInfo.name?.split(' ')[0] || 'Unknown',
      userInfo.family_name || userInfo.name?.split(' ').slice(1).join(' ') || 'Unknown',
      hprNumber
    ]
  );

  return { user: newUserResult.rows[0], isNewUser: true };
};

// ============================================================================
// MIDDLEWARE
// ============================================================================

/**
 * Express middleware to require HelseID authentication
 */
export const requireHelseIdAuth = async (req, res, next) => {
  // Check for HelseID session
  const helseIdSession = req.session?.helseId;

  if (!helseIdSession) {
    return res.status(401).json({
      error: 'HelseID authentication required',
      loginUrl: '/auth/helseid/login'
    });
  }

  // Check if token is expired
  if (helseIdSession.expiresAt && new Date(helseIdSession.expiresAt * 1000) < new Date()) {
    return res.status(401).json({
      error: 'HelseID session expired',
      loginUrl: '/auth/helseid/login'
    });
  }

  // Validate HPR number is still valid
  if (helseIdSession.hprNumber) {
    const validation = await validateHprNumber(helseIdSession.hprNumber);
    if (!validation.valid) {
      return res.status(403).json({
        error: 'HPR number no longer valid',
        reason: validation.error
      });
    }
  }

  req.helseIdUser = helseIdSession;
  next();
};

// ============================================================================
// STATUS CHECK
// ============================================================================

/**
 * Check HelseID integration status
 */
export const getHelseIdStatus = () => {
  return {
    configured: !!(CLIENT_ID && CLIENT_SECRET),
    environment: ENVIRONMENT,
    clientInitialized: !!helseIdClient,
    endpoints: HELSEID_CONFIG[ENVIRONMENT]
  };
};

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  setupHelseID,
  getHelseIdClient,
  getAuthorizationUrl,
  handleCallback,
  extractHprNumber,
  extractPersonalNumber,
  validateHprNumber,
  validateFodselsnummer,
  createOrUpdateUserFromHelseId,
  requireHelseIdAuth,
  getHelseIdStatus,
  SCOPES
};
