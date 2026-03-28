/**
 * Backup Guard Middleware
 * Returns 503 Service Unavailable while a backup is in progress.
 * Mount BEFORE other middleware so all routes are protected.
 */

import { getIsBackingUp } from '../services/backupService.js';

const backupGuard = (req, res, next) => {
  if (getIsBackingUp()) {
    res.set('Retry-After', '5');
    return res.status(503).json({
      error: 'ServiceUnavailable',
      message: 'Sikkerhetskopi pagar. Prov igjen om noen sekunder.',
    });
  }
  next();
};

export default backupGuard;
