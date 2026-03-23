/**
 * RAG Retrieval Module
 * RAG document retrieval, embedding search, context injection
 */

import logger from '../../utils/logger.js';
import { buildTieredContext, TIERED_ENABLED } from './contextManager.js';
import { getSessionContext } from './sessionMemory.js';

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
  const { organizationId, patientId, taskType } = options;

  let prompt = sanitizedPrompt;
  const ragContext = null;

  // Step 1: Add tiered patient context if enabled
  if (TIERED_ENABLED && patientId && organizationId) {
    try {
      const tiered = await buildTieredContext(taskType || 'general', { patientId, organizationId });
      if (tiered.contextText) {
        prompt = `${tiered.contextText}\n\n${prompt}`;
        logger.debug('Tiered context added', {
          tiers: tiered.tiers,
          tokenEstimate: tiered.tokenEstimate,
        });
      }

      // Also inject session learnings
      const sessionCtx = getSessionContext(organizationId, patientId);
      if (sessionCtx) {
        prompt = `${sessionCtx}\n\n${prompt}`;
      }
    } catch (tieredError) {
      logger.warn('Tiered context load failed, continuing:', tieredError.message);
    }
  }

  // Step 2: Add RAG context if enabled
  if (!RAG_ENABLED || !ragService || !organizationId) {
    return { augmentedPrompt: prompt, ragContext };
  }

  try {
    const ragResult = await ragService.augmentPrompt(prompt, clinicalContext, {
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

  return { augmentedPrompt: prompt, ragContext };
};

export { ragService, RAG_ENABLED };
