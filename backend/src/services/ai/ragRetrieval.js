/**
 * RAG Retrieval Module
 * RAG document retrieval, embedding search, context injection
 */

import logger from '../../utils/logger.js';

const RAG_ENABLED = process.env.RAG_ENABLED !== 'false';

// Import RAG service for context augmentation
let ragService = null;
try {
  const rag = await import('../rag.js');
  ragService = rag.ragService;
} catch (e) {
  logger.warn('RAG service not available:', e.message);
}

/**
 * Augment a prompt with RAG context if enabled and available
 * @returns {{ augmentedPrompt: string, ragContext: object|null }}
 */
export const augmentWithRAG = async (sanitizedPrompt, clinicalContext, options = {}) => {
  const { organizationId, patientId } = options;

  if (!RAG_ENABLED || !ragService || !organizationId) {
    return { augmentedPrompt: sanitizedPrompt, ragContext: null };
  }

  try {
    const ragResult = await ragService.augmentPrompt(sanitizedPrompt, clinicalContext, {
      organizationId,
      patientId,
      maxChunks: 3,
      maxContextLength: 2000,
    });

    if (ragResult.context) {
      logger.debug('RAG context added', {
        chunksUsed: ragResult.chunks.length,
        contextLength: ragResult.context.length,
      });
      return {
        augmentedPrompt: ragResult.prompt,
        ragContext: {
          chunksUsed: ragResult.chunks.length,
          contextLength: ragResult.context.length,
        },
      };
    }
  } catch (ragError) {
    logger.warn('RAG augmentation failed, proceeding without context:', ragError.message);
  }

  return { augmentedPrompt: sanitizedPrompt, ragContext: null };
};

export { ragService, RAG_ENABLED };
