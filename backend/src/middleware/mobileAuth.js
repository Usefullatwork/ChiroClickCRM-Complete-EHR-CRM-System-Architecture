/**
 * Mobile Authentication Middleware
 * JWT verification and patient context resolution for mobile app routes
 */

import * as mobileAuth from '../services/mobileAuth.js';
import { query } from '../config/database.js';

// Logger - noop fallback avoids raw console usage
const noop = () => {};
const fallbackLogger = { info: noop, error: noop, warn: noop, debug: noop };
let logger = fallbackLogger;
try {
  const mod = await import('../utils/logger.js');
  logger = mod.default || mod;
} catch {
  // Logger not available; structured logging disabled
}

/**
 * Middleware to verify mobile JWT token
 */
export const authenticateMobile = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = mobileAuth.verifyAccessToken(token);

    req.mobileUser = {
      id: decoded.userId,
      phone: decoded.phone,
    };

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

/**
 * Middleware to resolve patient context from mobile user
 * Links mobile auth (phone-based) to patient records (UUID-based)
 */
export const resolvePatientContext = async (req, res, next) => {
  try {
    const result = await query(
      'SELECT patient_id, organization_id FROM mobile_users WHERE id = $1',
      [req.mobileUser.id]
    );
    if (!result.rows[0]?.patient_id) {
      return res.status(403).json({ error: 'Ingen koblet pasientkonto. Kontakt klinikken din.' });
    }
    req.mobileUser.patientId = result.rows[0].patient_id;
    req.mobileUser.organizationId = result.rows[0].organization_id;
    next();
  } catch (error) {
    logger.error('Patient context error:', error);
    res.status(500).json({ error: 'Feil ved oppslag av pasientkontekst' });
  }
};
