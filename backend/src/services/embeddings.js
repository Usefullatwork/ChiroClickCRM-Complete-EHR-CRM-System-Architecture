/**
 * Clinical Embeddings Service
 *
 * Generates vector embeddings for clinical text using:
 * - e5-multilingual-large (primary)
 * - Ollama local embeddings (fallback)
 *
 * Supports hybrid search with pgvector for RAG retrieval.
 */

import logger from '../utils/logger.js';

// Embedding model configuration
const EMBEDDING_CONFIG = {
  // Primary: e5-multilingual-large via HuggingFace Inference API
  primary: {
    provider: 'huggingface',
    model: 'intfloat/e5-large-v2',
    dimensions: 1024,
    maxTokens: 512,
    instructionPrefix: {
      query: 'query: ',
      document: 'passage: ',
    },
  },
  // Fallback: Ollama local embeddings
  fallback: {
    provider: 'ollama',
    model: 'nomic-embed-text',
    dimensions: 768,
    maxTokens: 8192,
  },
};

class EmbeddingsService {
  constructor() {
    this.provider = process.env.EMBEDDING_PROVIDER || 'ollama';
    this.ollamaUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    this.hfApiKey = process.env.HUGGINGFACE_API_KEY;
    this.cache = new Map(); // Simple in-memory cache
    this.cacheMaxSize = 1000;
  }

  /**
   * Generate embedding for text
   * @param {string} text - Text to embed
   * @param {string} type - 'query' or 'document'
   * @returns {Promise<number[]>} Vector embedding
   */
  async embed(text, type = 'document') {
    if (!text || typeof text !== 'string') {
      throw new Error('Text must be a non-empty string');
    }

    // Check cache
    const cacheKey = `${type}:${text.substring(0, 100)}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    let embedding;

    try {
      if (this.provider === 'huggingface' && this.hfApiKey) {
        embedding = await this.embedWithHuggingFace(text, type);
      } else {
        embedding = await this.embedWithOllama(text);
      }
    } catch (error) {
      logger.warn(`Primary embedding failed, trying fallback: ${error.message}`);
      embedding = await this.embedWithOllama(text);
    }

    // Cache result
    if (this.cache.size >= this.cacheMaxSize) {
      // Remove oldest entry
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(cacheKey, embedding);

    return embedding;
  }

  /**
   * Embed multiple texts in batch
   * @param {string[]} texts - Texts to embed
   * @param {string} type - 'query' or 'document'
   * @returns {Promise<number[][]>} Array of embeddings
   */
  async embedBatch(texts, type = 'document') {
    // Process in parallel with concurrency limit
    const batchSize = 10;
    const results = [];

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch.map((text) => this.embed(text, type)));
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Embed using HuggingFace Inference API
   */
  async embedWithHuggingFace(text, type) {
    const config = EMBEDDING_CONFIG.primary;
    const prefix = config.instructionPrefix[type] || '';
    const inputText = prefix + text;

    const response = await fetch(
      `https://api-inference.huggingface.co/pipeline/feature-extraction/${config.model}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.hfApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: inputText,
          options: {
            wait_for_model: true,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`HuggingFace API error: ${response.status}`);
    }

    const data = await response.json();

    // Handle nested array response
    if (Array.isArray(data) && Array.isArray(data[0])) {
      // Mean pooling over token embeddings
      return this.meanPool(data);
    }

    return data;
  }

  /**
   * Embed using Ollama local embeddings
   */
  async embedWithOllama(text) {
    const config = EMBEDDING_CONFIG.fallback;

    const response = await fetch(`${this.ollamaUrl}/api/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.model,
        prompt: text,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama embedding error: ${response.status}`);
    }

    const data = await response.json();

    // Pad to 1024 dimensions if needed (for pgvector compatibility)
    let embedding = data.embedding;
    if (embedding.length < 1024) {
      embedding = [...embedding, ...new Array(1024 - embedding.length).fill(0)];
    }

    return embedding;
  }

  /**
   * Mean pooling for token embeddings
   */
  meanPool(tokenEmbeddings) {
    if (!tokenEmbeddings.length) {
      return [];
    }

    const dimensions = tokenEmbeddings[0].length;
    const pooled = new Array(dimensions).fill(0);

    for (const embedding of tokenEmbeddings) {
      for (let i = 0; i < dimensions; i++) {
        pooled[i] += embedding[i];
      }
    }

    for (let i = 0; i < dimensions; i++) {
      pooled[i] /= tokenEmbeddings.length;
    }

    return pooled;
  }

  /**
   * Calculate cosine similarity between two embeddings
   */
  cosineSimilarity(a, b) {
    if (a.length !== b.length) {
      throw new Error('Embeddings must have same dimensions');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (normA * normB);
  }

  /**
   * Format embedding for PostgreSQL vector type
   */
  toPgVector(embedding) {
    return `[${embedding.join(',')}]`;
  }

  /**
   * Get embedding dimensions
   */
  getDimensions() {
    return this.provider === 'huggingface'
      ? EMBEDDING_CONFIG.primary.dimensions
      : EMBEDDING_CONFIG.fallback.dimensions;
  }

  /**
   * Check if embedding service is available
   */
  async healthCheck() {
    try {
      const testEmbedding = await this.embed('test', 'document');
      return {
        available: true,
        provider: this.provider,
        dimensions: testEmbedding.length,
      };
    } catch (error) {
      return {
        available: false,
        provider: this.provider,
        error: error.message,
      };
    }
  }
}

// Singleton instance
const embeddingsService = new EmbeddingsService();

export { EmbeddingsService, embeddingsService };

// Convenience functions
export const embed = (text, type) => embeddingsService.embed(text, type);
export const embedBatch = (texts, type) => embeddingsService.embedBatch(texts, type);
export const toPgVector = (embedding) => embeddingsService.toPgVector(embedding);
export const cosineSimilarity = (a, b) => embeddingsService.cosineSimilarity(a, b);
