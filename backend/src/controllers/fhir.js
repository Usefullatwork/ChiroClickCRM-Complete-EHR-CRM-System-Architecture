/**
 * FHIR R4 Controller
 * Handle FHIR resource requests
 */

import fhirAdapter from '../services/fhirAdapter.js';
import { query } from '../config/database.js';
import { logAudit } from '../utils/audit.js';
import logger from '../utils/logger.js';

// ============================================================================
// CAPABILITY STATEMENT
// ============================================================================

/**
 * Get FHIR CapabilityStatement (metadata)
 */
export const getCapabilityStatement = async (req, res) => {
  const statement = {
    resourceType: 'CapabilityStatement',
    id: 'chiroclickcrm-capability',
    url: `${fhirAdapter.FHIR_BASE_URL}/metadata`,
    version: fhirAdapter.FHIR_VERSION,
    name: 'ChiroClickCRM FHIR Server',
    title: 'ChiroClickCRM FHIR R4 Capability Statement',
    status: 'active',
    experimental: false,
    date: new Date().toISOString(),
    publisher: 'ChiroClickCRM',
    description: 'FHIR R4 API for Norwegian chiropractic EHR system',
    kind: 'instance',
    fhirVersion: '4.0.1',
    format: ['json', 'application/fhir+json'],
    rest: [{
      mode: 'server',
      documentation: 'RESTful FHIR server for clinical data access',
      security: {
        cors: true,
        service: [{
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/restful-security-service',
            code: 'OAuth',
            display: 'OAuth'
          }]
        }],
        description: 'OAuth2 authentication required'
      },
      resource: [
        {
          type: 'Patient',
          profile: 'http://hl7.no/fhir/StructureDefinition/no-basis-Patient',
          interaction: [
            { code: 'read' },
            { code: 'search-type' }
          ],
          searchParam: [
            { name: 'identifier', type: 'token' },
            { name: 'name', type: 'string' },
            { name: 'birthdate', type: 'date' }
          ]
        },
        {
          type: 'Encounter',
          profile: 'http://hl7.no/fhir/StructureDefinition/no-basis-Encounter',
          interaction: [
            { code: 'read' },
            { code: 'search-type' }
          ],
          searchParam: [
            { name: 'patient', type: 'reference' },
            { name: 'date', type: 'date' },
            { name: 'status', type: 'token' }
          ]
        },
        {
          type: 'Condition',
          profile: 'http://hl7.no/fhir/StructureDefinition/no-basis-Condition',
          interaction: [
            { code: 'read' },
            { code: 'search-type' }
          ],
          searchParam: [
            { name: 'patient', type: 'reference' },
            { name: 'code', type: 'token' }
          ]
        },
        {
          type: 'Observation',
          interaction: [
            { code: 'read' },
            { code: 'search-type' }
          ],
          searchParam: [
            { name: 'patient', type: 'reference' },
            { name: 'code', type: 'token' },
            { name: 'date', type: 'date' }
          ]
        }
      ],
      operation: [
        {
          name: 'everything',
          definition: 'http://hl7.org/fhir/OperationDefinition/Patient-everything'
        }
      ]
    }]
  };

  res.set('Content-Type', 'application/fhir+json');
  res.json(statement);
};

// ============================================================================
// PATIENT OPERATIONS
// ============================================================================

/**
 * Get single patient as FHIR resource
 */
export const getPatient = async (req, res) => {
  try {
    const { id } = req.params;
    const { organizationId } = req.user;

    const result = await query(
      `SELECT * FROM patients
       WHERE id = $1 AND organization_id = $2`,
      [id, organizationId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        resourceType: 'OperationOutcome',
        issue: [{
          severity: 'error',
          code: 'not-found',
          diagnostics: `Patient/${id} not found`
        }]
      });
    }

    const fhirPatient = fhirAdapter.patientToFHIR(result.rows[0], {
      includeIdentifier: req.query._include === 'identifier'
    });

    await logAudit('FHIR_READ', req.user.userId, {
      resourceType: 'Patient',
      resourceId: id,
      organizationId
    });

    res.set('Content-Type', 'application/fhir+json');
    res.json(fhirPatient);

  } catch (error) {
    logger.error('FHIR getPatient error:', error);
    res.status(500).json({
      resourceType: 'OperationOutcome',
      issue: [{
        severity: 'error',
        code: 'exception',
        diagnostics: error.message
      }]
    });
  }
};

/**
 * Search patients
 */
export const searchPatients = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { name, birthdate, identifier, _count = 50 } = req.query;

    let sql = `SELECT * FROM patients WHERE organization_id = $1`;
    const params = [organizationId];
    let paramIndex = 2;

    if (name) {
      sql += ` AND (first_name ILIKE $${paramIndex} OR last_name ILIKE $${paramIndex})`;
      params.push(`%${name}%`);
      paramIndex++;
    }

    if (birthdate) {
      sql += ` AND date_of_birth = $${paramIndex}`;
      params.push(birthdate);
      paramIndex++;
    }

    sql += ` LIMIT $${paramIndex}`;
    params.push(parseInt(_count));

    const result = await query(sql, params);

    const bundle = {
      resourceType: 'Bundle',
      type: 'searchset',
      total: result.rows.length,
      entry: result.rows.map(patient => ({
        fullUrl: `${fhirAdapter.FHIR_BASE_URL}/Patient/${patient.id}`,
        resource: fhirAdapter.patientToFHIR(patient)
      }))
    };

    res.set('Content-Type', 'application/fhir+json');
    res.json(bundle);

  } catch (error) {
    logger.error('FHIR searchPatients error:', error);
    res.status(500).json({
      resourceType: 'OperationOutcome',
      issue: [{
        severity: 'error',
        code: 'exception',
        diagnostics: error.message
      }]
    });
  }
};

// ============================================================================
// ENCOUNTER OPERATIONS
// ============================================================================

/**
 * Get single encounter as FHIR resource
 */
export const getEncounter = async (req, res) => {
  try {
    const { id } = req.params;
    const { organizationId } = req.user;

    const result = await query(
      `SELECT ce.*, p.first_name as patient_first_name, p.last_name as patient_last_name
       FROM clinical_encounters ce
       JOIN patients p ON ce.patient_id = p.id
       WHERE ce.id = $1 AND ce.organization_id = $2`,
      [id, organizationId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        resourceType: 'OperationOutcome',
        issue: [{
          severity: 'error',
          code: 'not-found',
          diagnostics: `Encounter/${id} not found`
        }]
      });
    }

    const encounter = result.rows[0];
    const patient = {
      first_name: encounter.patient_first_name,
      last_name: encounter.patient_last_name
    };

    const fhirEncounter = fhirAdapter.encounterToFHIR(encounter, patient);

    await logAudit('FHIR_READ', req.user.userId, {
      resourceType: 'Encounter',
      resourceId: id,
      organizationId
    });

    res.set('Content-Type', 'application/fhir+json');
    res.json(fhirEncounter);

  } catch (error) {
    logger.error('FHIR getEncounter error:', error);
    res.status(500).json({
      resourceType: 'OperationOutcome',
      issue: [{
        severity: 'error',
        code: 'exception',
        diagnostics: error.message
      }]
    });
  }
};

/**
 * Search encounters
 */
export const searchEncounters = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { patient, date, status, _count = 50 } = req.query;

    let sql = `
      SELECT ce.*, p.first_name as patient_first_name, p.last_name as patient_last_name
      FROM clinical_encounters ce
      JOIN patients p ON ce.patient_id = p.id
      WHERE ce.organization_id = $1
    `;
    const params = [organizationId];
    let paramIndex = 2;

    if (patient) {
      sql += ` AND ce.patient_id = $${paramIndex}`;
      params.push(patient.replace('Patient/', ''));
      paramIndex++;
    }

    if (date) {
      sql += ` AND DATE(ce.encounter_date) = $${paramIndex}`;
      params.push(date);
      paramIndex++;
    }

    sql += ` ORDER BY ce.encounter_date DESC LIMIT $${paramIndex}`;
    params.push(parseInt(_count));

    const result = await query(sql, params);

    const bundle = {
      resourceType: 'Bundle',
      type: 'searchset',
      total: result.rows.length,
      entry: result.rows.map(encounter => ({
        fullUrl: `${fhirAdapter.FHIR_BASE_URL}/Encounter/${encounter.id}`,
        resource: fhirAdapter.encounterToFHIR(encounter, {
          first_name: encounter.patient_first_name,
          last_name: encounter.patient_last_name
        })
      }))
    };

    res.set('Content-Type', 'application/fhir+json');
    res.json(bundle);

  } catch (error) {
    logger.error('FHIR searchEncounters error:', error);
    res.status(500).json({
      resourceType: 'OperationOutcome',
      issue: [{
        severity: 'error',
        code: 'exception',
        diagnostics: error.message
      }]
    });
  }
};

// ============================================================================
// CONDITION OPERATIONS
// ============================================================================

export const getCondition = async (req, res) => {
  // Conditions are embedded in encounters - return OperationOutcome
  res.status(501).json({
    resourceType: 'OperationOutcome',
    issue: [{
      severity: 'information',
      code: 'not-supported',
      diagnostics: 'Conditions are embedded in Encounter resources. Use Encounter/$everything or Patient/$everything.'
    }]
  });
};

export const searchConditions = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { patient, code, _count = 50 } = req.query;

    let sql = `
      SELECT ce.id, ce.patient_id, ce.encounter_date, ce.icpc_codes, ce.icd10_codes
      FROM clinical_encounters ce
      WHERE ce.organization_id = $1
        AND (ce.icpc_codes IS NOT NULL OR ce.icd10_codes IS NOT NULL)
    `;
    const params = [organizationId];
    let paramIndex = 2;

    if (patient) {
      sql += ` AND ce.patient_id = $${paramIndex}`;
      params.push(patient.replace('Patient/', ''));
      paramIndex++;
    }

    sql += ` ORDER BY ce.encounter_date DESC LIMIT $${paramIndex}`;
    params.push(parseInt(_count));

    const result = await query(sql, params);

    const entries = [];
    for (const row of result.rows) {
      const codes = [...(row.icpc_codes || []), ...(row.icd10_codes || [])];
      for (const diagCode of codes) {
        const condition = fhirAdapter.diagnosisToFHIR(
          { code: diagCode, system: diagCode.match(/^[A-Z]\d{2}$/) ? 'ICPC2' : 'ICD10' },
          row.patient_id,
          row.id
        );
        entries.push({
          fullUrl: `${fhirAdapter.FHIR_BASE_URL}/Condition/${condition.id}`,
          resource: condition
        });
      }
    }

    res.set('Content-Type', 'application/fhir+json');
    res.json({
      resourceType: 'Bundle',
      type: 'searchset',
      total: entries.length,
      entry: entries
    });

  } catch (error) {
    logger.error('FHIR searchConditions error:', error);
    res.status(500).json({
      resourceType: 'OperationOutcome',
      issue: [{
        severity: 'error',
        code: 'exception',
        diagnostics: error.message
      }]
    });
  }
};

// ============================================================================
// OBSERVATION OPERATIONS
// ============================================================================

export const getObservation = async (req, res) => {
  res.status(501).json({
    resourceType: 'OperationOutcome',
    issue: [{
      severity: 'information',
      code: 'not-supported',
      diagnostics: 'Observations are generated from clinical_measurements. Use search instead.'
    }]
  });
};

export const searchObservations = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { patient, date, _count = 50 } = req.query;

    let sql = `
      SELECT cm.*, p.id as patient_id
      FROM clinical_measurements cm
      JOIN patients p ON cm.patient_id = p.id
      WHERE p.organization_id = $1
    `;
    const params = [organizationId];
    let paramIndex = 2;

    if (patient) {
      sql += ` AND cm.patient_id = $${paramIndex}`;
      params.push(patient.replace('Patient/', ''));
      paramIndex++;
    }

    if (date) {
      sql += ` AND DATE(cm.created_at) = $${paramIndex}`;
      params.push(date);
      paramIndex++;
    }

    sql += ` ORDER BY cm.created_at DESC LIMIT $${paramIndex}`;
    params.push(parseInt(_count));

    const result = await query(sql, params);

    const entries = [];
    for (const measurement of result.rows) {
      const observations = fhirAdapter.measurementToFHIR(
        measurement,
        measurement.patient_id,
        measurement.encounter_id
      );
      for (const obs of observations) {
        entries.push({
          fullUrl: `${fhirAdapter.FHIR_BASE_URL}/Observation/${obs.id}`,
          resource: obs
        });
      }
    }

    res.set('Content-Type', 'application/fhir+json');
    res.json({
      resourceType: 'Bundle',
      type: 'searchset',
      total: entries.length,
      entry: entries
    });

  } catch (error) {
    logger.error('FHIR searchObservations error:', error);
    res.status(500).json({
      resourceType: 'OperationOutcome',
      issue: [{
        severity: 'error',
        code: 'exception',
        diagnostics: error.message
      }]
    });
  }
};

// ============================================================================
// BUNDLE OPERATIONS
// ============================================================================

/**
 * Get everything for a patient
 */
export const getPatientEverything = async (req, res) => {
  try {
    const { id } = req.params;
    const { organizationId } = req.user;

    // Verify patient belongs to organization
    const patientCheck = await query(
      'SELECT id FROM patients WHERE id = $1 AND organization_id = $2',
      [id, organizationId]
    );

    if (patientCheck.rows.length === 0) {
      return res.status(404).json({
        resourceType: 'OperationOutcome',
        issue: [{
          severity: 'error',
          code: 'not-found',
          diagnostics: `Patient/${id} not found`
        }]
      });
    }

    const bundle = await fhirAdapter.createPatientBundle(id, {
      includeIdentifier: req.query._include === 'identifier'
    });

    await logAudit('FHIR_EXPORT', req.user.userId, {
      resourceType: 'Patient',
      resourceId: id,
      operation: '$everything',
      resourceCount: bundle.total,
      organizationId
    });

    res.set('Content-Type', 'application/fhir+json');
    res.json(bundle);

  } catch (error) {
    logger.error('FHIR getPatientEverything error:', error);
    res.status(500).json({
      resourceType: 'OperationOutcome',
      issue: [{
        severity: 'error',
        code: 'exception',
        diagnostics: error.message
      }]
    });
  }
};

/**
 * Process FHIR Bundle (transaction)
 */
export const processBundle = async (req, res) => {
  // Read-only server for now
  res.status(501).json({
    resourceType: 'OperationOutcome',
    issue: [{
      severity: 'information',
      code: 'not-supported',
      diagnostics: 'Bundle transactions are not yet supported. This is a read-only FHIR server.'
    }]
  });
};

/**
 * Export patient data
 */
export const exportPatient = async (req, res) => {
  try {
    const { id } = req.params;
    const { format = 'json' } = req.query;
    const { organizationId } = req.user;

    const bundle = await fhirAdapter.createPatientBundle(id, {
      includeIdentifier: true
    });

    await logAudit('FHIR_EXPORT', req.user.userId, {
      resourceType: 'Patient',
      resourceId: id,
      format,
      resourceCount: bundle.total,
      organizationId
    });

    if (format === 'xml') {
      // XML conversion would require a library like fhir.js
      res.status(501).json({
        resourceType: 'OperationOutcome',
        issue: [{
          severity: 'information',
          code: 'not-supported',
          diagnostics: 'XML format not yet supported'
        }]
      });
    } else {
      res.set('Content-Type', 'application/fhir+json');
      res.set('Content-Disposition', `attachment; filename="patient-${id}-fhir.json"`);
      res.json(bundle);
    }

  } catch (error) {
    logger.error('FHIR exportPatient error:', error);
    res.status(500).json({
      resourceType: 'OperationOutcome',
      issue: [{
        severity: 'error',
        code: 'exception',
        diagnostics: error.message
      }]
    });
  }
};

export default {
  getCapabilityStatement,
  getPatient,
  searchPatients,
  getEncounter,
  searchEncounters,
  getCondition,
  searchConditions,
  getObservation,
  searchObservations,
  getPatientEverything,
  processBundle,
  exportPatient
};
