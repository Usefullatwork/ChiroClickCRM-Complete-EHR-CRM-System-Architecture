/**
 * FHIR Adapter Package
 * Re-exports FHIR R4 adapter, HelseID client, and route handlers
 */

export { default as fhirAdapter } from './fhirAdapter.js';
export {
  default as HelseIdClient,
  helseIdAuth,
  requireHprNumber,
  validateFodselsnummer,
  validateHprNumber,
  extractHprNumber,
  extractPersonalNumber,
  getHelseIdStatus,
} from './helseId.js';
export { default as fhirRoutes } from './routes/fhir.js';
export { default as helseIdRoutes } from './routes/helseId.js';
