/**
 * Clinical Vision Service
 * Image analysis for X-ray, MRI, posture photos using Claude's vision capabilities.
 * Base64 upload -> structured clinical findings.
 */

import logger from '../utils/logger.js';
import fs from 'fs';

let Anthropic = null;

const SUPPORTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_IMAGE_SIZE = 20 * 1024 * 1024; // 20MB

const ANALYSIS_TYPES = {
  xray: 'Analyser dette rontgenbildet. Beskriv relevante funn systematisk: strukturer, alignment, benvev, leddrom, blotvev. Identifiser eventuelle patologiske funn.',
  mri: 'Analyser dette MR-bildet. Beskriv relevante funn: diskusdegenerasjon, nerverotkompresjon, ligamentskader, benmarg, blotvev. Grader funn etter klinisk betydning.',
  posture:
    'Analyser dette holdningsbildet. Vurder: sagittalbalanse, skulderasymmetri, bekkenhelning, hodeplassering, kyfose/lordose. Gi klinisk relevante observasjoner.',
  general: 'Analyser dette medisinske bildet og beskriv relevante kliniske funn.',
};

async function getClient() {
  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) throw new Error('Clinical vision requires CLAUDE_API_KEY');
  if (!Anthropic) {
    const sdk = await import('@anthropic-ai/sdk');
    Anthropic = sdk.default || sdk.Anthropic;
  }
  return new Anthropic({ apiKey });
}

/**
 * Analyze a clinical image using Claude's vision capabilities
 * @param {Object} imageData - { base64, mediaType } or { filePath, mediaType }
 * @param {Object} options - { analysisType, additionalContext, model }
 * @returns {{ analysis: string, analysisType: string, model: string, disclaimer: string, usage: Object }}
 */
export async function analyzeImage(imageData, options = {}) {
  const { analysisType = 'general', additionalContext = '', model = 'claude-sonnet-4-6' } = options;

  let base64;
  let mediaType;

  if (imageData.base64) {
    base64 = imageData.base64;
    mediaType = imageData.mediaType || 'image/jpeg';
  } else if (imageData.filePath) {
    const buffer = fs.readFileSync(imageData.filePath);
    if (buffer.length > MAX_IMAGE_SIZE) {
      throw new Error(`Image exceeds ${MAX_IMAGE_SIZE / 1024 / 1024}MB limit`);
    }
    base64 = buffer.toString('base64');
    mediaType = imageData.mediaType || 'image/jpeg';
  } else {
    throw new Error('imageData must include base64 or filePath');
  }

  if (!SUPPORTED_TYPES.includes(mediaType)) {
    throw new Error(
      `Unsupported image type: ${mediaType}. Supported: ${SUPPORTED_TYPES.join(', ')}`
    );
  }

  const systemPrompt =
    'Du er en erfaren klinisk radiolog/kiropraktor. Analyser medisinske bilder og gi strukturerte, klinisk relevante funn. Skriv alltid pa norsk bokmal. VIKTIG: Angi alltid at endelig tolkning ma bekreftes av kvalifisert helsepersonell.';

  let prompt = ANALYSIS_TYPES[analysisType] || ANALYSIS_TYPES.general;
  if (additionalContext) prompt += `\n\nTilleggsinformasjon: ${additionalContext}`;

  logger.debug('Clinical vision analysis', { analysisType, model, mediaType });

  const client = await getClient();

  const response = await client.messages.create({
    model,
    max_tokens: 2000,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: base64 },
          },
          { type: 'text', text: prompt },
        ],
      },
    ],
  });

  const text = response.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('');

  logger.debug('Clinical vision complete', { analysisType, responseLength: text.length });

  return {
    analysis: text,
    analysisType,
    model,
    disclaimer: 'Denne analysen er AI-assistert og ma bekreftes av kvalifisert helsepersonell.',
    usage: {
      inputTokens: response.usage?.input_tokens || 0,
      outputTokens: response.usage?.output_tokens || 0,
    },
  };
}

export { ANALYSIS_TYPES, SUPPORTED_TYPES };
