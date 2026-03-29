/**
 * Bulk Communication Service — Barrel re-export
 * Sub-modules: bulkDispatch.js, bulkTemplating.js, bulkFiltering.js
 */

// Queue creation & processing
export { queueBulkCommunications, processCommunicationQueue } from './bulkDispatch.js';

// Filtering, status & batch management
export { getQueueStatus, cancelBatch, getPendingQueue, getBatches } from './bulkFiltering.js';

// Templating & preview
export { personalizeTemplate, previewMessage, getAvailableVariables } from './bulkTemplating.js';

// Default export for backward compatibility
import { queueBulkCommunications, processCommunicationQueue } from './bulkDispatch.js';
import { getQueueStatus, cancelBatch, getPendingQueue, getBatches } from './bulkFiltering.js';
import { personalizeTemplate, previewMessage, getAvailableVariables } from './bulkTemplating.js';

export default {
  queueBulkCommunications,
  processCommunicationQueue,
  getQueueStatus,
  cancelBatch,
  getPendingQueue,
  getBatches,
  previewMessage,
  personalizeTemplate,
  getAvailableVariables,
};
