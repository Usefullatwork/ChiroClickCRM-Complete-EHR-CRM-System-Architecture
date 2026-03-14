import { query } from '../config/database.js';
import cache from '../utils/cache.js';
import logger from '../utils/logger.js';

const MODULE_CACHE_TTL = 300;

async function getOrgModules(organizationId) {
  const cacheKey = `org_modules_${organizationId}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  try {
    const result = await query('SELECT settings FROM organizations WHERE id = $1', [
      organizationId,
    ]);
    const settings = result.rows[0]?.settings || {};
    const modules = settings.enabled_modules || { core_ehr: true };
    cache.set(cacheKey, modules, MODULE_CACHE_TTL);
    return modules;
  } catch (err) {
    logger.error('Failed to fetch org modules:', { organizationId, error: err.message });
    return { core_ehr: true };
  }
}

export function requireModule(moduleName) {
  return async (req, res, next) => {
    if (moduleName === 'core_ehr') return next();
    if (process.env.DEV_SKIP_AUTH === 'true') return next();

    const organizationId = req.user?.organization_id || req.user?.organizationId;
    if (!organizationId) {
      return res.status(403).json({ error: 'MODULE_NOT_ENABLED', module: moduleName });
    }

    const modules = await getOrgModules(organizationId);
    if (modules[moduleName]) return next();

    return res.status(403).json({ error: 'MODULE_NOT_ENABLED', module: moduleName });
  };
}

export function clearModuleCache(organizationId) {
  cache.delete(`org_modules_${organizationId}`);
}
