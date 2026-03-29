/**
 * Journal Prompts
 * Old journal organization, batch processing, and note merging
 */

import logger from '../../utils/logger.js';
import {
  isAIAvailable,
  extractCompletionText,
  AI_MODEL,
  generateCompletion,
} from './promptShared.js';
import { JOURNAL_ORGANIZATION_PROMPT, MERGE_NOTES_PROMPT } from './systemPrompts.js';

/**
 * Organize and structure old journal notes using AI
 */
export const organizeOldJournalNotes = async (noteContent, patientContext = {}) => {
  if (!isAIAvailable()) {
    return { success: false, organizedData: null, aiAvailable: false, error: 'AI is disabled' };
  }

  const prompt = `Pasientkontekst:
Navn: ${patientContext.first_name || ''} ${patientContext.last_name || ''}
Alder: ${patientContext.age || 'ukjent'}
${patientContext.medical_history ? `Sykehistorie: ${patientContext.medical_history}` : ''}

Gammel journalnotat som skal struktureres:
---
${noteContent}
---

Analyser og strukturer dette notatet i henhold til instruksjonene.
VIKTIG: Identifiser ALLE handlingsoppgaver som må følges opp!
Svar kun med JSON.`;

  try {
    const completionResult = await generateCompletion(prompt, JOURNAL_ORGANIZATION_PROMPT, {
      maxTokens: 2000,
      temperature: 0.4,
      taskType: 'journal_organization',
    });
    const response = extractCompletionText(completionResult);

    let organizedData;
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      organizedData = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(response);
    } catch (parseError) {
      logger.error('JSON parse error in organizeOldJournalNotes:', parseError);
      organizedData = {
        structured_data: { raw_content: noteContent, parsing_error: true },
        soap: {
          subjective: { chief_complaint: noteContent.substring(0, 500) },
          objective: {},
          assessment: {},
          plan: {},
        },
        actionable_items: [],
        communication_history: [],
        missing_information: [],
        tags: [],
        confidence_score: 0.3,
        notes:
          'Kunne ikke fullstendig strukturere notatet automatisk. Manuell gjennomgang anbefales.',
      };
    }

    return {
      success: true,
      organizedData,
      rawResponse: response,
      model: AI_MODEL,
      provider: 'ollama',
      aiAvailable: true,
    };
  } catch (error) {
    logger.error('Organize old journal notes error:', error);
    return { success: false, error: error.message, organizedData: null, aiAvailable: false };
  }
};

/**
 * Batch organize multiple old journal notes
 */
export const organizeMultipleNotes = async (notes, patientContext = {}) => {
  if (!isAIAvailable()) {
    return {
      totalNotes: notes.length,
      successfullyProcessed: 0,
      results: notes.map((note) => ({
        noteId: note.id || null,
        filename: note.filename || null,
        success: false,
        error: 'AI is disabled',
      })),
      aiAvailable: false,
    };
  }

  const results = [];
  for (const note of notes) {
    try {
      const result = await organizeOldJournalNotes(note.content, patientContext);
      results.push({ noteId: note.id || null, filename: note.filename || null, ...result });
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      results.push({
        noteId: note.id || null,
        filename: note.filename || null,
        success: false,
        error: error.message,
      });
    }
  }

  return {
    totalNotes: notes.length,
    successfullyProcessed: results.filter((r) => r.success).length,
    results,
  };
};

/**
 * Refine and merge multiple organized notes into a single comprehensive entry
 */
export const mergeOrganizedNotes = async (organizedNotes, patientContext = {}) => {
  if (!isAIAvailable()) {
    return {
      success: false,
      mergedNote: '',
      sourceNotesCount: organizedNotes.length,
      aiAvailable: false,
      error: 'AI is disabled',
    };
  }

  const notesText = organizedNotes
    .map(
      (note, index) =>
        `=== Notat ${index + 1} (${note.suggested_date || 'ukjent dato'}) ===\n${JSON.stringify(note.soap, null, 2)}`
    )
    .join('\n\n');

  const prompt = `Pasientkontekst:
Navn: ${patientContext.first_name || ''} ${patientContext.last_name || ''}

Følgende notater skal konsolideres:
${notesText}

Lag ett samlet, kronologisk SOAP-notat som fanger hele pasienthistorikken.`;

  try {
    const mergeResult = await generateCompletion(prompt, MERGE_NOTES_PROMPT, {
      maxTokens: 2000,
      temperature: 0.5,
      taskType: 'clinical_summary',
    });
    const mergedText = extractCompletionText(mergeResult);

    return {
      success: true,
      mergedNote: mergedText.trim(),
      sourceNotesCount: organizedNotes.length,
      dateRange: {
        earliest: organizedNotes.reduce(
          (min, n) =>
            !min || (n.suggested_date && n.suggested_date < min) ? n.suggested_date : min,
          null
        ),
        latest: organizedNotes.reduce(
          (max, n) =>
            !max || (n.suggested_date && n.suggested_date > max) ? n.suggested_date : max,
          null
        ),
      },
      aiAvailable: true,
    };
  } catch (error) {
    logger.error('Merge organized notes error:', error);
    return { success: false, error: error.message, aiAvailable: false };
  }
};
