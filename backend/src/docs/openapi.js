/**
 * OpenAPI/Swagger Documentation
 * API specification for ChiroClickCRM
 */

export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'ChiroClickCRM API',
    description: `
# ChiroClickCRM EHR-CRM API Documentation

ChiroClickCRM is a comprehensive Electronic Health Record (EHR) and Customer Relationship Management (CRM) system designed specifically for chiropractic clinics in Norway.

## Features

- **Patient Management**: Full CRUD operations with GDPR-compliant data handling
- **Clinical Documentation**: SOAP notes with ICPC-2/ICD-10 coding
- **Appointments**: Scheduling with reminders and recurring appointments
- **Communications**: SMS and email with template support
- **KPI Dashboard**: Practice analytics and reporting
- **GDPR Compliance**: Built-in consent management and data access rights

## Authentication

This API uses session-based authentication or API keys. Include the Bearer token in the Authorization header:

\`\`\`
Authorization: Bearer <your_token>
\`\`\`

All requests must also include the organization ID header:

\`\`\`
X-Organization-Id: <organization_uuid>
\`\`\`

## Rate Limiting

- General API: 100 requests per 15 minutes
- SMS sending: 10 per hour per user
- Email sending: 20 per hour per user

## Norwegian Healthcare Compliance

This API is designed to comply with:
- GDPR (Personvernforordningen)
- Norwegian Health Records Act (Pasientjournalloven)
- ICPC-2 and ICD-10 coding standards
- Norwegian Takster treatment codes
    `,
    version: '1.0.0',
    contact: {
      name: 'ChiroClickCRM Support',
      email: 'support@chiroclickcrm.no',
    },
    license: {
      name: 'Proprietary',
    },
  },
  servers: [
    {
      url: '/api/v1',
      description: 'API Version 1',
    },
  ],
  tags: [
    { name: 'Health', description: 'Health check endpoints' },
    { name: 'Patients', description: 'Patient management' },
    { name: 'Encounters', description: 'Clinical encounters (SOAP notes)' },
    { name: 'Appointments', description: 'Appointment scheduling' },
    { name: 'Communications', description: 'SMS and email communications' },
    { name: 'Follow-ups', description: 'Patient follow-up tracking' },
    { name: 'KPI', description: 'Key Performance Indicators' },
    { name: 'Financial', description: 'Financial tracking and invoicing' },
    { name: 'GDPR', description: 'GDPR compliance endpoints' },
    { name: 'Diagnosis', description: 'Diagnosis code lookup' },
    { name: 'Treatments', description: 'Treatment code lookup' },
  ],
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        description: 'Check API and database health status',
        security: [],
        responses: {
          200: {
            description: 'Service is healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'healthy' },
                    timestamp: { type: 'string', format: 'date-time' },
                    uptime: { type: 'number' },
                    database: { type: 'string', example: 'connected' },
                  },
                },
              },
            },
          },
          503: {
            description: 'Service is unhealthy',
          },
        },
      },
    },
    '/patients': {
      get: {
        tags: ['Patients'],
        summary: 'Get all patients',
        description: 'Retrieve paginated list of patients with optional filters',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          {
            name: 'search',
            in: 'query',
            schema: { type: 'string' },
            description: 'Search by name, email, phone',
          },
          {
            name: 'status',
            in: 'query',
            schema: { type: 'string', enum: ['ACTIVE', 'INACTIVE', 'FINISHED'] },
          },
          { name: 'category', in: 'query', schema: { type: 'string' } },
          { name: 'sortBy', in: 'query', schema: { type: 'string', default: 'last_name' } },
          {
            name: 'sortOrder',
            in: 'query',
            schema: { type: 'string', enum: ['asc', 'desc'], default: 'asc' },
          },
        ],
        responses: {
          200: {
            description: 'Paginated list of patients',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    patients: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Patient' },
                    },
                    pagination: { $ref: '#/components/schemas/Pagination' },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Patients'],
        summary: 'Create patient',
        description: 'Create a new patient record',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/PatientCreate' },
            },
          },
        },
        responses: {
          201: {
            description: 'Patient created successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Patient' },
              },
            },
          },
          400: { $ref: '#/components/responses/ValidationError' },
        },
      },
    },
    '/patients/{id}': {
      get: {
        tags: ['Patients'],
        summary: 'Get patient by ID',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          200: {
            description: 'Patient details',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Patient' },
              },
            },
          },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
      patch: {
        tags: ['Patients'],
        summary: 'Update patient',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/PatientUpdate' },
            },
          },
        },
        responses: {
          200: {
            description: 'Patient updated successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Patient' },
              },
            },
          },
        },
      },
      delete: {
        tags: ['Patients'],
        summary: 'Delete patient',
        description: 'Soft delete - sets status to INACTIVE',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          200: { description: 'Patient deleted successfully' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/encounters': {
      get: {
        tags: ['Encounters'],
        summary: 'Get all encounters',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'patientId', in: 'query', schema: { type: 'string', format: 'uuid' } },
          { name: 'practitionerId', in: 'query', schema: { type: 'string', format: 'uuid' } },
          { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' } },
        ],
        responses: {
          200: {
            description: 'List of clinical encounters',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    encounters: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Encounter' },
                    },
                    pagination: { $ref: '#/components/schemas/Pagination' },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Encounters'],
        summary: 'Create encounter',
        description: 'Create a new clinical encounter (SOAP note)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/EncounterCreate' },
            },
          },
        },
        responses: {
          201: {
            description: 'Encounter created successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Encounter' },
              },
            },
          },
        },
      },
    },
    '/encounters/{id}/sign': {
      post: {
        tags: ['Encounters'],
        summary: 'Sign encounter',
        description: 'Sign and lock an encounter (makes it immutable)',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          200: {
            description: 'Encounter signed successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Encounter' },
              },
            },
          },
          400: {
            description: 'Encounter cannot be signed in current state',
          },
        },
      },
    },
    '/appointments': {
      get: {
        tags: ['Appointments'],
        summary: 'Get appointments',
        parameters: [
          { name: 'date', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'practitionerId', in: 'query', schema: { type: 'string', format: 'uuid' } },
          {
            name: 'status',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'],
            },
          },
        ],
        responses: {
          200: {
            description: 'List of appointments',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Appointment' },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Appointments'],
        summary: 'Create appointment',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AppointmentCreate' },
            },
          },
        },
        responses: {
          201: {
            description: 'Appointment created successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Appointment' },
              },
            },
          },
        },
      },
    },
    '/communications/sms': {
      post: {
        tags: ['Communications'],
        summary: 'Send SMS',
        description: 'Send SMS to a patient',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['patientId', 'message'],
                properties: {
                  patientId: { type: 'string', format: 'uuid' },
                  message: { type: 'string', maxLength: 1600 },
                  templateId: { type: 'string', format: 'uuid' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'SMS sent successfully' },
          429: { description: 'Rate limit exceeded' },
        },
      },
    },
    '/kpi/dashboard': {
      get: {
        tags: ['KPI'],
        summary: 'Get KPI dashboard',
        description: 'Get comprehensive KPI metrics for the organization',
        parameters: [
          { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' } },
        ],
        responses: {
          200: {
            description: 'KPI dashboard data',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/KPIDashboard' },
              },
            },
          },
        },
      },
    },
    '/gdpr/access-request': {
      post: {
        tags: ['GDPR'],
        summary: 'Create data access request',
        description: 'Create a GDPR Article 15 data access request for a patient',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['patientId'],
                properties: {
                  patientId: { type: 'string', format: 'uuid' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Access request created' },
        },
      },
    },
    '/gdpr/erasure-request': {
      post: {
        tags: ['GDPR'],
        summary: 'Create erasure request',
        description: 'Create a GDPR Article 17 right to erasure request',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['patientId'],
                properties: {
                  patientId: { type: 'string', format: 'uuid' },
                  reason: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Erasure request created' },
          422: { description: 'Erasure not possible due to legal retention requirements' },
        },
      },
    },
    '/diagnosis/search': {
      get: {
        tags: ['Diagnosis'],
        summary: 'Search diagnosis codes',
        parameters: [
          {
            name: 'q',
            in: 'query',
            required: true,
            schema: { type: 'string' },
            description: 'Search term',
          },
          { name: 'system', in: 'query', schema: { type: 'string', enum: ['ICPC-2', 'ICD-10'] } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: {
          200: {
            description: 'Matching diagnosis codes',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/DiagnosisCode' },
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      Patient: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          solvit_id: { type: 'string' },
          first_name: { type: 'string' },
          last_name: { type: 'string' },
          date_of_birth: { type: 'string', format: 'date' },
          gender: { type: 'string', enum: ['M', 'F', 'O'] },
          email: { type: 'string', format: 'email' },
          phone: { type: 'string' },
          status: { type: 'string', enum: ['ACTIVE', 'INACTIVE', 'FINISHED', 'DECEASED'] },
          category: { type: 'string' },
          consent_sms: { type: 'boolean' },
          consent_email: { type: 'boolean' },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
        },
      },
      PatientCreate: {
        type: 'object',
        required: ['first_name', 'last_name', 'date_of_birth'],
        properties: {
          solvit_id: { type: 'string' },
          first_name: { type: 'string' },
          last_name: { type: 'string' },
          date_of_birth: { type: 'string', format: 'date' },
          gender: { type: 'string', enum: ['M', 'F', 'O'] },
          email: { type: 'string', format: 'email' },
          phone: { type: 'string' },
          personal_number: { type: 'string', description: 'Norwegian fødselsnummer (encrypted)' },
          consent_sms: { type: 'boolean', default: false },
          consent_email: { type: 'boolean', default: false },
          consent_data_storage: { type: 'boolean', default: true },
        },
      },
      PatientUpdate: {
        type: 'object',
        properties: {
          first_name: { type: 'string' },
          last_name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          phone: { type: 'string' },
          status: { type: 'string', enum: ['ACTIVE', 'INACTIVE', 'FINISHED'] },
        },
      },
      Encounter: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          patient_id: { type: 'string', format: 'uuid' },
          practitioner_id: { type: 'string', format: 'uuid' },
          encounter_date: { type: 'string', format: 'date' },
          encounter_type: {
            type: 'string',
            enum: ['INITIAL', 'FOLLOWUP', 'REASSESSMENT', 'DISCHARGE'],
          },
          subjective: { type: 'object' },
          objective: { type: 'object' },
          assessment: { type: 'object' },
          plan: { type: 'object' },
          icpc_codes: { type: 'array', items: { type: 'string' } },
          vas_pain: { type: 'integer', minimum: 0, maximum: 10 },
          is_signed: { type: 'boolean' },
          signed_at: { type: 'string', format: 'date-time' },
        },
      },
      EncounterCreate: {
        type: 'object',
        required: ['patient_id', 'encounter_date'],
        properties: {
          patient_id: { type: 'string', format: 'uuid' },
          encounter_date: { type: 'string', format: 'date' },
          encounter_type: { type: 'string', default: 'FOLLOWUP' },
          subjective: { type: 'object' },
          objective: { type: 'object' },
          assessment: { type: 'object' },
          plan: { type: 'object' },
          icpc_codes: { type: 'array', items: { type: 'string' } },
          vas_pain: { type: 'integer', minimum: 0, maximum: 10 },
        },
      },
      Appointment: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          patient_id: { type: 'string', format: 'uuid' },
          practitioner_id: { type: 'string', format: 'uuid' },
          start_time: { type: 'string', format: 'date-time' },
          end_time: { type: 'string', format: 'date-time' },
          appointment_type: { type: 'string' },
          status: { type: 'string' },
          notes: { type: 'string' },
        },
      },
      AppointmentCreate: {
        type: 'object',
        required: ['patient_id', 'practitioner_id', 'start_time', 'end_time'],
        properties: {
          patient_id: { type: 'string', format: 'uuid' },
          practitioner_id: { type: 'string', format: 'uuid' },
          start_time: { type: 'string', format: 'date-time' },
          end_time: { type: 'string', format: 'date-time' },
          appointment_type: { type: 'string', default: 'FOLLOWUP' },
          notes: { type: 'string' },
        },
      },
      KPIDashboard: {
        type: 'object',
        properties: {
          daily: {
            type: 'object',
            properties: {
              revenue: { type: 'number' },
              visits: { type: 'integer' },
              new_patients: { type: 'integer' },
              no_shows: { type: 'integer' },
            },
          },
          weekly: {
            type: 'object',
            properties: {
              rebooking_rate: { type: 'number' },
              avg_visits_per_patient: { type: 'number' },
            },
          },
          monthly: {
            type: 'object',
            properties: {
              growth_rate: { type: 'number' },
              retention_rate: { type: 'number' },
            },
          },
        },
      },
      DiagnosisCode: {
        type: 'object',
        properties: {
          code: { type: 'string' },
          description_no: { type: 'string' },
          description_en: { type: 'string' },
          system: { type: 'string', enum: ['ICPC-2', 'ICD-10'] },
          category: { type: 'string' },
        },
      },
      Pagination: {
        type: 'object',
        properties: {
          page: { type: 'integer' },
          limit: { type: 'integer' },
          total: { type: 'integer' },
          pages: { type: 'integer' },
        },
      },
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string' },
          code: { type: 'string' },
          message: { type: 'string' },
          details: { type: 'object' },
        },
      },
    },
    responses: {
      NotFound: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
          },
        },
      },
      ValidationError: {
        description: 'Validation error',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
          },
        },
      },
      Unauthorized: {
        description: 'Authentication required',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
          },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
};

export default openApiSpec;
