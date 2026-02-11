import logger from './utils/logger.js';

logger.info('Current NODE_ENV:', { NODE_ENV: process.env.NODE_ENV });
try {
  logger.info('Attempting to import server...');
  import('./server.js')
    .then((module) => {
      logger.info('Import successful.', { exportKeys: Object.keys(module) });
      // Keep alive to see if it stays up
      setTimeout(() => {
        logger.info('Debug timeout reached (10s), exiting check.');
      }, 10000);
    })
    .catch((err) => {
      logger.error('Import failed promise:', { error: err.message, stack: err.stack });
    });
} catch (error) {
  logger.error('Synchronous error:', { error: error.message, stack: error.stack });
}
