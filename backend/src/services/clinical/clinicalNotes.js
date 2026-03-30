/**
 * Clinical Notes Service — Barrel re-export
 * Sub-modules: noteCrud.js, noteFormatting.js, noteSearch.js
 */

// Note CRUD & lifecycle
export {
  getAllNotes,
  getNoteById,
  getPatientNotes,
  createNote,
  updateNote,
  autoSaveDraft,
  signNote,
  deleteNote,
  getNoteTemplates,
  getUserDrafts,
  getNoteHistory,
  createAmendment,
} from './noteCrud.js';

// Note formatting & PDF
export { generateFormattedNote, generateNotePDF } from './noteFormatting.js';

// Note search
export { searchNotes } from './noteSearch.js';

// Default export for backward compatibility
import * as noteCrud from './noteCrud.js';
import * as noteFormatting from './noteFormatting.js';
import * as noteSearch from './noteSearch.js';

export default {
  ...noteCrud,
  ...noteFormatting,
  ...noteSearch,
};
