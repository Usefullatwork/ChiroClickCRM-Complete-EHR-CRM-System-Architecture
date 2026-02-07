/**
 * HelseID / ID-porten Integration Service
 * Norwegian Healthcare Identity Provider for secure authentication
 *
 * HelseID is the national identity solution for the Norwegian health sector
 * Built on OpenID Connect (OIDC) and OAuth 2.0
 *
 * Documentation: https://helseid.atlassian.net/wiki/spaces/HELSEID/
 */

import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';
import secrets from '../utils/vault.js';

// ============================================================================
// HELSEID CONFIGURATION
// ============================================================================

const HELSEID_ENVIRONMENTS = {
  test: {
    issuer: 'https://helseid-sts.test.nhn.no',
    authorizationEndpoint: 'https://helseid-sts.test.nhn.no/connect/authorize',
    tokenEndpoint: 'https://helseid-sts.test.nhn.no/connect/token',
    userInfoEndpoint: 'https://helseid-sts.test.nhn.no/connect/userinfo',
    jwksUri: 'https://helseid-sts.test.nhn.no/.well-known/openid-configuration/jwks',
    endSessionEndpoint: 'https://helseid-sts.test.nhn.no/connect/endsession',
  },
  production: {
    issuer: 'https://helseid-sts.nhn.no',
    authorizationEndpoint: 'https://helseid-sts.nhn.no/connect/authorize',
    tokenEndpoint: 'https://helseid-sts.nhn.no/connect/token',
    userInfoEndpoint: 'https://helseid-sts.nhn.no/connect/userinfo',
    jwksUri: 'https://helseid-sts.nhn.no/.well-known/openid-configuration/jwks',
    endSessionEndpoint: 'https://helseid-sts.nhn.no/connect/endsession',
  },
};

// Standard HelseID scopes for healthcare applications
const HELSEID_SCOPES = {
  openid: 'openid', // Required for OIDC
  profile: 'profile', // Basic profile info
  hprNumber: 'helseid://scopes/hpr/hpr_number', // HPR number (Helsepersonellregisteret)
  identity: 'helseid://scopes/identity/pid', // Norwegian personal ID
  securityLevel: 'helseid://scopes/identity/security_level', // Auth security level
  assuranceLevel: 'helseid://scopes/identity/assurance_level', // Identity assurance
  network: 'helseid://scopes/identity/network_identifier', // Network (Norsk Helsenett)
};

// ============================================================================
// HELSEID CLIENT
// ============================================================================

class HelseIdClient {
  constructor(options = {}) {
    this.environment = options.environment || process.env.HELSEID_ENV || 'test';
    this.config = HELSEID_ENVIRONMENTS[this.environment];

    this.clientId = options.clientId || process.env.HELSEID_CLIENT_ID;
    this.redirectUri = options.redirectUri || process.env.HELSEID_REDIRECT_URI;

    // PKCE and state storage (use Redis in production)
    this.authStateStore = new Map();

    // JWKS cache
    this.jwksCache = null;
    this.jwksCacheExpiry = null;

    this.initialized = false;
  }

  /**
   * Initialize the client and fetch JWKS
   */
  async initialize() {
    if (this.initialized) return;

    try {
      // Get client secret from Vault
      this.clientSecret = await secrets.get('helseid_client_secret');

      // Fetch JWKS for token validation
      await this.refreshJwks();

      this.initialized = true;
      logger.info('✓ HelseID client initialized', { environment: this.environment });
    } catch (error) {
      logger.error('HelseID initialization failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Generate PKCE code verifier and challenge
   */
  generatePKCE() {
    // Generate random code verifier (43-128 chars)
    const codeVerifier = crypto
      .randomBytes(32)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    // Generate code challenge (S256)
    const codeChallenge = crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    return { codeVerifier, codeChallenge };
  }

  /**
   * Generate authorization URL for login
   * @param {Object} options - Authorization options
   * @returns {Object} Authorization URL and state for verification
   */
  getAuthorizationUrl(options = {}) {
    const { codeVerifier, codeChallenge } = this.generatePKCE();
    const state = crypto.randomBytes(16).toString('hex');
    const nonce = crypto.randomBytes(16).toString('hex');

    // Build scopes
    const scopes = [
      HELSEID_SCOPES.openid,
      HELSEID_SCOPES.profile,
      ...(options.requestHprNumber ? [HELSEID_SCOPES.hprNumber] : []),
      ...(options.requestPid ? [HELSEID_SCOPES.identity] : []),
      HELSEID_SCOPES.securityLevel,
    ];

    // Build authorization URL
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: options.redirectUri || this.redirectUri,
      scope: scopes.join(' '),
      state,
      nonce,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      // Optional: request specific authentication method
      ...(options.acrValues && { acr_values: options.acrValues }),
      // Optional: UI locale
      ui_locales: options.locale || 'nb', // Norwegian Bokmål
    });

    const authUrl = `${this.config.authorizationEndpoint}?${params.toString()}`;

    // Store state for verification (expires in 10 minutes)
    this.authStateStore.set(state, {
      codeVerifier,
      nonce,
      redirectUri: options.redirectUri || this.redirectUri,
      createdAt: Date.now(),
      expiresAt: Date.now() + 10 * 60 * 1000,
    });

    // Cleanup expired states
    this.cleanupExpiredStates();

    return {
      authorizationUrl: authUrl,
      state,
      codeVerifier, // Return for session storage on client
    };
  }

  /**
   * Exchange authorization code for tokens
   * @param {string} code - Authorization code from callback
   * @param {string} state - State parameter for verification
   * @param {string} codeVerifier - PKCE code verifier (if not stored server-side)
   */
  async exchangeCodeForTokens(code, state, codeVerifier = null) {
    await this.ensureInitialized();

    // Verify state
    const storedState = this.authStateStore.get(state);
    if (!storedState) {
      throw new Error('Invalid or expired state parameter');
    }

    // Check expiry
    if (Date.now() > storedState.expiresAt) {
      this.authStateStore.delete(state);
      throw new Error('Authorization state expired');
    }

    const verifier = codeVerifier || storedState.codeVerifier;

    // Exchange code for tokens
    const tokenParams = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: storedState.redirectUri,
      client_id: this.clientId,
      client_secret: this.clientSecret,
      code_verifier: verifier,
    });

    const response = await fetch(this.config.tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: tokenParams.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error('Token exchange failed', { error });
      throw new Error(`Token exchange failed: ${error}`);
    }

    const tokens = await response.json();

    // Validate ID token
    const idTokenClaims = await this.validateIdToken(tokens.id_token, storedState.nonce);

    // Clean up state
    this.authStateStore.delete(state);

    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      idToken: tokens.id_token,
      expiresIn: tokens.expires_in,
      tokenType: tokens.token_type,
      claims: idTokenClaims,
    };
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken) {
    await this.ensureInitialized();

    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: this.clientId,
      client_secret: this.clientSecret,
    });

    const response = await fetch(this.config.tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    return await response.json();
  }

  /**
   * Validate ID token
   */
  async validateIdToken(idToken, expectedNonce = null) {
    await this.ensureInitialized();

    // Decode header to get key ID
    const [headerB64] = idToken.split('.');
    const header = JSON.parse(Buffer.from(headerB64, 'base64').toString());

    // Get signing key from JWKS
    const signingKey = await this.getSigningKey(header.kid);

    // Verify token
    const claims = jwt.verify(idToken, signingKey, {
      issuer: this.config.issuer,
      audience: this.clientId,
      algorithms: ['RS256'],
    });

    // Validate nonce if provided
    if (expectedNonce && claims.nonce !== expectedNonce) {
      throw new Error('Invalid nonce in ID token');
    }

    // Validate auth_time is recent (within 1 hour)
    if (claims.auth_time) {
      const authAge = Date.now() / 1000 - claims.auth_time;
      if (authAge > 3600) {
        logger.warn('ID token auth_time is older than 1 hour', { authAge });
      }
    }

    return claims;
  }

  /**
   * Get user info from HelseID
   */
  async getUserInfo(accessToken) {
    const response = await fetch(this.config.userInfoEndpoint, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user info');
    }

    return await response.json();
  }

  /**
   * Get logout URL
   */
  getLogoutUrl(idToken, postLogoutRedirectUri) {
    const params = new URLSearchParams({
      id_token_hint: idToken,
      post_logout_redirect_uri: postLogoutRedirectUri,
    });

    return `${this.config.endSessionEndpoint}?${params.toString()}`;
  }

  /**
   * Fetch and cache JWKS
   */
  async refreshJwks() {
    const response = await fetch(this.config.jwksUri);
    if (!response.ok) {
      throw new Error('Failed to fetch JWKS');
    }

    this.jwksCache = await response.json();
    this.jwksCacheExpiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    logger.debug('JWKS refreshed', { keys: this.jwksCache.keys.length });
  }

  /**
   * Get signing key for token validation
   */
  async getSigningKey(kid) {
    // Refresh JWKS if expired
    if (!this.jwksCache || Date.now() > this.jwksCacheExpiry) {
      await this.refreshJwks();
    }

    const key = this.jwksCache.keys.find((k) => k.kid === kid);
    if (!key) {
      // Try refreshing in case key was rotated
      await this.refreshJwks();
      const retryKey = this.jwksCache.keys.find((k) => k.kid === kid);
      if (!retryKey) {
        throw new Error(`Signing key not found: ${kid}`);
      }
      return this.jwkToPem(retryKey);
    }

    return this.jwkToPem(key);
  }

  /**
   * Convert JWK to PEM format
   */
  jwkToPem(jwk) {
    // Use crypto to convert JWK to PEM
    const keyObject = crypto.createPublicKey({ key: jwk, format: 'jwk' });
    return keyObject.export({ type: 'spki', format: 'pem' });
  }

  /**
   * Parse HPR number from claims
   * HPR = Helsepersonellregisteret (Healthcare Personnel Registry)
   */
  parseHprNumber(claims) {
    // HPR number claim format varies
    const hprClaim =
      claims['helseid://claims/hpr/hpr_number'] || claims['hpr_number'] || claims.hpr_number;

    if (!hprClaim) return null;

    return {
      hprNumber: hprClaim,
      // Additional HPR claims if available
      authorization: claims['helseid://claims/hpr/authorization'],
      profession: claims['helseid://claims/hpr/profession'],
    };
  }

  /**
   * Get security level from claims
   */
  getSecurityLevel(claims) {
    const level = claims['helseid://claims/identity/security_level'] || claims.acr;

    // Map to standard levels
    const levelMap = {
      'idporten-loa-substantial': 'substantial', // BankID, MinID with SMS
      'idporten-loa-high': 'high', // BankID, Buypass
      Level3: 'substantial',
      Level4: 'high',
    };

    return levelMap[level] || level;
  }

  /**
   * Cleanup expired authorization states
   */
  cleanupExpiredStates() {
    const now = Date.now();
    for (const [state, data] of this.authStateStore.entries()) {
      if (now > data.expiresAt) {
        this.authStateStore.delete(state);
      }
    }
  }

  async ensureInitialized() {
    if (!this.initialized) {
      await this.initialize();
    }
  }
}

// ============================================================================
// EXPRESS MIDDLEWARE
// ============================================================================

/**
 * HelseID Authentication Middleware
 */
export const helseIdAuth = (options = {}) => {
  const client = new HelseIdClient(options);
  const requiredLevel = options.requiredSecurityLevel || 'substantial';

  return async (req, res, next) => {
    try {
      await client.ensureInitialized();

      // Get token from Authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Missing or invalid authorization header',
        });
      }

      const token = authHeader.substring(7);

      // Validate token
      const claims = await client.validateIdToken(token);

      // Check security level
      const securityLevel = client.getSecurityLevel(claims);
      if (requiredLevel === 'high' && securityLevel !== 'high') {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'This action requires high security level authentication (BankID)',
        });
      }

      // Parse HPR number
      const hprInfo = client.parseHprNumber(claims);

      // Attach user info to request
      req.helseIdUser = {
        sub: claims.sub,
        name: claims.name,
        pid: claims['helseid://claims/identity/pid'], // Fødselsnummer (if granted)
        hpr: hprInfo,
        securityLevel,
        authTime: claims.auth_time,
        claims,
      };

      next();
    } catch (error) {
      logger.error('HelseID authentication failed', { error: error.message });
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired token',
      });
    }
  };
};

/**
 * Require HPR number middleware
 * Use after helseIdAuth to ensure user has valid HPR registration
 */
export const requireHprNumber = () => {
  return (req, res, next) => {
    if (!req.helseIdUser?.hpr?.hprNumber) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Valid HPR registration required for this action',
      });
    }
    next();
  };
};

// ============================================================================
// STANDALONE UTILITY FUNCTIONS
// ============================================================================

/**
 * Validate Norwegian fødselsnummer (11-digit personal ID)
 * @param {string} fnr - The fødselsnummer to validate
 * @returns {Object} { valid, birthDate, gender, isDNumber, error }
 */
export function validateFodselsnummer(fnr) {
  if (fnr == null) {
    return { valid: false, error: 'Fødselsnummer not provided' };
  }

  if (typeof fnr !== 'string') {
    return { valid: false, error: 'Must be a string' };
  }

  // Clean up spaces
  fnr = fnr.replace(/\s/g, '');

  if (fnr.length !== 11) {
    return { valid: false, error: 'Must be 11 digits' };
  }

  if (!/^\d{11}$/.test(fnr)) {
    return { valid: false, error: 'Must contain only digits' };
  }

  const digits = fnr.split('').map(Number);

  // Check for D-number (day + 40)
  let day = parseInt(fnr.substring(0, 2), 10);
  const isDNumber = day > 40;
  if (isDNumber) {
    day -= 40;
  }

  const month = parseInt(fnr.substring(2, 4), 10);
  const yearPart = parseInt(fnr.substring(4, 6), 10);
  const individualNumber = parseInt(fnr.substring(6, 9), 10);

  // Determine century from individual number
  let year;
  if (individualNumber < 500) {
    year = 1900 + yearPart;
  } else if (individualNumber < 750 && yearPart >= 54) {
    year = 1800 + yearPart;
  } else if (individualNumber >= 500 && individualNumber < 1000 && yearPart < 40) {
    year = 2000 + yearPart;
  } else {
    year = 1900 + yearPart;
  }

  // Validate date
  const birthDate = new Date(year, month - 1, day);
  if (birthDate.getMonth() !== month - 1 || birthDate.getDate() !== day) {
    return { valid: false, error: 'Invalid birth date' };
  }

  // Checksum validation (weighted modulus 11)
  const w1 = [3, 7, 6, 1, 8, 9, 4, 5, 2];
  const w2 = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];

  // Gender: odd individual number = male, even = female
  const gender = individualNumber % 2 === 0 ? 'FEMALE' : 'MALE';
  const birthDateStr = birthDate.toISOString().split('T')[0];

  // Checksum validation (weighted modulus 11)
  let sum1 = 0;
  for (let i = 0; i < 9; i++) sum1 += digits[i] * w1[i];
  const r1 = 11 - (sum1 % 11);
  const k1 = r1 === 11 ? 0 : r1;
  if (k1 === 10 || k1 !== digits[9]) {
    return { valid: false, error: 'Invalid checksum', birthDate: birthDateStr, gender, isDNumber };
  }

  let sum2 = 0;
  for (let i = 0; i < 10; i++) sum2 += digits[i] * w2[i];
  const r2 = 11 - (sum2 % 11);
  const k2 = r2 === 11 ? 0 : r2;
  if (k2 === 10 || k2 !== digits[10]) {
    return { valid: false, error: 'Invalid checksum', birthDate: birthDateStr, gender, isDNumber };
  }

  return {
    valid: true,
    birthDate: birthDateStr,
    gender,
    isDNumber,
  };
}

/**
 * Validate HPR number format and optionally check against DB
 * @param {string} hprNumber - The HPR number to validate
 * @returns {Object} { valid, error }
 */
export async function validateHprNumber(hprNumber) {
  if (hprNumber == null) {
    return { valid: false, error: 'HPR number not provided' };
  }

  if (typeof hprNumber !== 'string') {
    hprNumber = String(hprNumber);
  }

  // HPR numbers are 7-9 digits
  if (!/^\d{7,9}$/.test(hprNumber)) {
    return { valid: false, error: 'Invalid HPR number format' };
  }

  // Format is valid - would need DB/API lookup for full validation
  return { valid: true, error: null };
}

/**
 * Extract HPR number from HelseID claims object
 * @param {Object} claims - HelseID token claims
 * @returns {string|null} HPR number or null
 */
export function extractHprNumber(claims) {
  if (!claims) return null;
  return claims['helseid://claims/hpr/hpr_number'] || claims['hpr_number'] || null;
}

/**
 * Extract personal number (fødselsnummer) from HelseID claims
 * @param {Object} claims - HelseID token claims
 * @returns {string|null} Personal number or null
 */
export function extractPersonalNumber(claims) {
  if (!claims) return null;
  return claims['helseid://claims/identity/pid'] || claims['pid'] || null;
}

/**
 * Get HelseID configuration status
 * @returns {Object} Status information
 */
export function getHelseIdStatus() {
  const env = process.env.HELSEID_ENV || 'test';
  const config = HELSEID_ENVIRONMENTS[env];

  return {
    configured: !!(process.env.HELSEID_CLIENT_ID && process.env.HELSEID_REDIRECT_URI),
    environment: env,
    clientInitialized: false,
    endpoints: {
      issuer: config.issuer,
      authorization_endpoint: config.authorizationEndpoint,
      token_endpoint: config.tokenEndpoint,
    },
  };
}

// Export client class and middleware
export { HelseIdClient };
export default HelseIdClient;
