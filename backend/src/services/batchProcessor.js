/**
 * Claude Batch API Processor
 *
 * Wrapper for Anthropic's Batch API for async bulk processing.
 * Batch API gives 50% cost reduction on all requests.
 * Good for: end-of-day summaries, training data scoring, bulk analysis.
 */

import logger from '../utils/logger.js';

let Anthropic = null;

async function getClient() {
  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) {
    throw new Error('Batch processing requires CLAUDE_API_KEY');
  }
  if (!Anthropic) {
    const sdk = await import('@anthropic-ai/sdk');
    Anthropic = sdk.default || sdk.Anthropic;
  }
  return new Anthropic({ apiKey });
}

/**
 * Create a batch of message requests for async processing.
 *
 * @param {Array} requests - Array of { customId, model, maxTokens, system, messages }
 * @param {Object} options - { model: default model }
 * @returns {Object} Batch object with id, status, request_counts
 */
export async function createBatch(requests, options = {}) {
  const { model = 'claude-sonnet-4-6' } = options;
  const client = await getClient();

  const batchRequests = requests.map((req) => ({
    custom_id: req.customId,
    params: {
      model: req.model || model,
      max_tokens: req.maxTokens || 1024,
      system: req.system,
      messages: req.messages,
    },
  }));

  const batch = await client.messages.batches.create({ requests: batchRequests });
  logger.info('Batch created', { batchId: batch.id, requestCount: batchRequests.length });
  return batch;
}

/**
 * Get batch status
 */
export async function getBatchStatus(batchId) {
  const client = await getClient();
  return client.messages.batches.retrieve(batchId);
}

/**
 * Get batch results (only when status is 'ended')
 */
export async function getBatchResults(batchId) {
  const client = await getClient();
  const results = [];
  for await (const result of client.messages.batches.results(batchId)) {
    results.push(result);
  }
  return results;
}

/**
 * Cancel a running batch
 */
export async function cancelBatch(batchId) {
  const client = await getClient();
  return client.messages.batches.cancel(batchId);
}

/**
 * List all batches
 */
export async function listBatches(options = {}) {
  const client = await getClient();
  const batches = [];
  for await (const batch of client.messages.batches.list({ limit: options.limit || 20 })) {
    batches.push(batch);
  }
  return batches;
}

/**
 * Convenience: Score training data quality in batch.
 * Takes an array of training examples and scores them.
 */
export async function scoreTrainingData(examples) {
  const requests = examples.map((example, i) => ({
    customId: `training-score-${i}`,
    model: 'claude-haiku-4-5',
    maxTokens: 256,
    system:
      'Score the following clinical training example on quality (1-5) and accuracy (1-5). Respond with JSON: { "quality": N, "accuracy": N, "issues": ["..."] }',
    messages: [{ role: 'user', content: JSON.stringify(example) }],
  }));

  return createBatch(requests, { model: 'claude-haiku-4-5' });
}

/**
 * Convenience: Generate end-of-day summaries in batch.
 */
export async function batchDailySummaries(encounters) {
  const requests = encounters.map((enc) => ({
    customId: `summary-${enc.id}`,
    model: 'claude-sonnet-4-6',
    maxTokens: 512,
    system:
      'Du er en klinisk assistent. Skriv et kort daglig sammendrag av denne konsultasjonen på norsk bokmål.',
    messages: [
      {
        role: 'user',
        content: `Konsultasjon:\nSubjektivt: ${enc.subjective || ''}\nObjektivt: ${enc.objective || ''}\nVurdering: ${enc.assessment || ''}\nPlan: ${enc.plan || ''}`,
      },
    ],
  }));

  return createBatch(requests);
}
