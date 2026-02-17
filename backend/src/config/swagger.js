/**
 * Swagger/OpenAPI Configuration
 * Interactive API documentation
 */

export const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ChiroClickCRM API',
      version: '2.0.0',
      description: 'Norwegian-compliant EHR-CRM-PMS API for chiropractic practices',
      contact: {
        name: 'ChiroClickCRM Support',
        email: 'support@chiroclickcrm.no',
      },
      license: {
        name: 'Private and Confidential',
        url: 'https://chiroclickcrm.no/license',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000/api/v1',
        description: 'Development server',
      },
      {
        url: 'https://api.chiroclickcrm.no/api/v1',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Session or API key token',
        },
        OrganizationId: {
          type: 'apiKey',
          in: 'header',
          name: 'X-Organization-Id',
          description: 'Multi-tenant organization identifier (UUID)',
        },
      },
      schemas: {
        Patient: {
          type: 'object',
          required: ['first_name', 'last_name'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Patient unique identifier',
            },
            first_name: {
              type: 'string',
              maxLength: 100,
              example: 'Ola',
            },
            last_name: {
              type: 'string',
              maxLength: 100,
              example: 'Nordmann',
            },
            date_of_birth: {
              type: 'string',
              format: 'date',
              example: '1985-05-15',
            },
            fodselsnummer: {
              type: 'string',
              pattern: '^\\d{11}$',
              description: 'Norwegian fødselsnummer (11 digits)',
              example: '15058512345',
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'ola.nordmann@example.com',
            },
            phone: {
              type: 'string',
              pattern: '^\\+47\\d{8}$',
              example: '+4791234567',
            },
            address: {
              type: 'object',
              properties: {
                street: { type: 'string', example: 'Storgata 1' },
                postal_code: { type: 'string', example: '0123' },
                city: { type: 'string', example: 'Oslo' },
              },
            },
            consent_sms: {
              type: 'boolean',
              description: 'Consent for SMS communications',
            },
            consent_email: {
              type: 'boolean',
              description: 'Consent for email communications',
            },
            consent_marketing: {
              type: 'boolean',
              description: 'Consent for marketing communications',
            },
          },
        },
        ClinicalEncounter: {
          type: 'object',
          required: ['patient_id', 'encounter_date', 'chief_complaint'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            patient_id: {
              type: 'string',
              format: 'uuid',
            },
            encounter_date: {
              type: 'string',
              format: 'date-time',
              example: '2025-01-15T14:30:00Z',
            },
            encounter_type: {
              type: 'string',
              enum: ['INITIAL', 'FOLLOW_UP', 'REASSESSMENT', 'EMERGENCY'],
              example: 'INITIAL',
            },
            chief_complaint: {
              type: 'string',
              example: 'Low back pain for 2 weeks',
            },
            soap_notes: {
              type: 'object',
              properties: {
                subjective: { type: 'string' },
                objective: { type: 'string' },
                assessment: { type: 'string' },
                plan: { type: 'string' },
              },
            },
            diagnosis_codes: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  icpc2_code: { type: 'string', example: 'L03' },
                  icd10_code: { type: 'string', example: 'M54.5' },
                  description: { type: 'string', example: 'Low back pain' },
                },
              },
            },
            is_signed: {
              type: 'boolean',
              description: 'Whether encounter has been digitally signed (immutable after signing)',
            },
          },
        },
        Appointment: {
          type: 'object',
          required: ['patient_id', 'appointment_date', 'appointment_time'],
          properties: {
            id: { type: 'string', format: 'uuid' },
            patient_id: { type: 'string', format: 'uuid' },
            practitioner_id: { type: 'string', format: 'uuid' },
            appointment_date: { type: 'string', format: 'date', example: '2025-03-15' },
            appointment_time: { type: 'string', example: '14:30' },
            duration: { type: 'integer', example: 30, description: 'Duration in minutes' },
            visit_type: {
              type: 'string',
              enum: ['INITIAL', 'FOLLOW_UP', 'REASSESSMENT', 'EMERGENCY'],
            },
            status: {
              type: 'string',
              enum: [
                'scheduled',
                'confirmed',
                'checked_in',
                'in_progress',
                'completed',
                'cancelled',
                'no_show',
              ],
            },
            notes: { type: 'string' },
          },
        },
        Exercise: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string', example: 'Cat-Cow Stretch' },
            name_no: { type: 'string', example: 'Katt-Ku Tøyning' },
            category: {
              type: 'string',
              enum: [
                'stretching',
                'strengthening',
                'mobility',
                'balance',
                'vestibular',
                'breathing',
                'posture',
                'nerve_glide',
              ],
            },
            body_region: {
              type: 'string',
              enum: [
                'cervical',
                'thoracic',
                'lumbar',
                'shoulder',
                'hip',
                'knee',
                'ankle',
                'core',
                'full_body',
              ],
            },
            difficulty: { type: 'string', enum: ['beginner', 'intermediate', 'advanced'] },
            description: { type: 'string' },
            video_url: { type: 'string', format: 'uri' },
            image_url: { type: 'string', format: 'uri' },
          },
        },
        Macro: {
          type: 'object',
          required: ['name', 'text', 'category'],
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string', example: 'Cervical ROM Normal' },
            text: { type: 'string', example: 'Full cervical ROM without pain or restriction.' },
            category: { type: 'string', example: 'examination' },
            variables: { type: 'array', items: { type: 'string' } },
            is_global: { type: 'boolean' },
          },
        },
        Automation: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string', example: 'Follow-up after 3 visits' },
            trigger_type: { type: 'string', example: 'visit_count' },
            conditions: { type: 'object' },
            actions: { type: 'array', items: { type: 'object' } },
            is_active: { type: 'boolean' },
          },
        },
        Communication: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            patient_id: { type: 'string', format: 'uuid' },
            channel: { type: 'string', enum: ['sms', 'email'] },
            direction: { type: 'string', enum: ['outbound', 'inbound'] },
            status: { type: 'string', enum: ['pending', 'sent', 'delivered', 'failed'] },
            message: { type: 'string' },
            sent_at: { type: 'string', format: 'date-time' },
          },
        },
        VestibularAssessment: {
          type: 'object',
          required: ['patient_id'],
          properties: {
            id: { type: 'string', format: 'uuid' },
            patient_id: { type: 'string', format: 'uuid' },
            encounter_id: { type: 'string', format: 'uuid' },
            dix_hallpike: { type: 'object' },
            head_impulse: { type: 'object' },
            gaze_stability: { type: 'object' },
            balance_tests: { type: 'object' },
            bppv_diagnosis: { type: 'object' },
            clinical_impression: { type: 'string' },
          },
        },
        SpineTemplate: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            segment: { type: 'string', example: 'C2' },
            direction: { type: 'string', example: 'left' },
            text: { type: 'string', example: 'Nedsatt segmentell mobilitet C2 mot venstre.' },
            is_custom: { type: 'boolean' },
          },
        },
        ClinicalSettings: {
          type: 'object',
          properties: {
            adjustment: {
              type: 'object',
              properties: {
                style: {
                  type: 'string',
                  enum: ['gonstead', 'diversified', 'segment_listing', 'activator', 'custom'],
                },
              },
            },
            tests: {
              type: 'object',
              properties: {
                orthopedic: { type: 'object' },
                neurological: { type: 'object' },
                rom: { type: 'object' },
              },
            },
            letters: { type: 'object' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message',
            },
            code: {
              type: 'string',
              description: 'Error code',
            },
            details: {
              type: 'object',
              description: 'Additional error details',
            },
          },
        },
      },
      responses: {
        UnauthorizedError: {
          description: 'Authentication token missing or invalid',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                error: 'Unauthorized',
                code: 'AUTH_REQUIRED',
              },
            },
          },
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                error: 'Resource not found',
                code: 'NOT_FOUND',
              },
            },
          },
        },
        ValidationError: {
          description: 'Request validation failed',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                error: 'Validation failed',
                code: 'VALIDATION_ERROR',
                details: {
                  field: 'email',
                  message: 'Invalid email format',
                },
              },
            },
          },
        },
      },
    },
    security: [
      {
        BearerAuth: [],
        OrganizationId: [],
      },
    ],
    tags: [
      { name: 'Auth', description: 'Authentication and session management' },
      { name: 'Patients', description: 'Patient management operations' },
      { name: 'Encounters', description: 'Clinical encounter documentation' },
      { name: 'Appointments', description: 'Appointment scheduling and management' },
      { name: 'Billing', description: 'Claims management, care episodes, and revenue cycle' },
      {
        name: 'Exercises',
        description: 'Exercise library, prescriptions, and compliance tracking',
      },
      { name: 'Diagnosis', description: 'ICPC-2 and ICD-10 diagnosis code lookup and statistics' },
      { name: 'Treatments', description: 'Treatment codes, pricing, and usage statistics' },
      { name: 'Outcomes', description: 'Clinical outcomes and treatment effectiveness' },
      {
        name: 'AI',
        description: 'AI-powered clinical intelligence (SOAP, diagnosis, red flags, spell check)',
      },
      { name: 'AI Feedback', description: 'AI suggestion feedback and performance metrics' },
      { name: 'AI Retraining', description: 'AI model retraining pipeline and RLAIF' },
      { name: 'Training', description: 'AI model training data and pipeline management' },
      {
        name: 'Clinical Settings',
        description: 'Clinical documentation preferences and notation styles',
      },
      {
        name: 'Spine Templates',
        description: 'Spine palpation text templates for quick-click documentation',
      },
      { name: 'Vestibular', description: 'Vestibular assessment and BPPV management' },
      {
        name: 'Neuroexam',
        description: 'Neurological examination with cluster scoring and red flags',
      },
      { name: 'Macros', description: 'Clinical text macros and hot buttons' },
      { name: 'Automations', description: 'Workflow automations and trigger management' },
      { name: 'Communications', description: 'SMS, email, and patient communications' },
      { name: 'Bulk Communications', description: 'Mass SMS and email campaigns' },
      { name: 'Scheduler', description: 'Smart scheduling and communication scheduling' },
      { name: 'Notifications', description: 'In-app user notifications' },
      { name: 'Kiosk', description: 'Patient self-service kiosk (check-in, intake, consent)' },
      { name: 'Portal', description: 'Patient portal (PIN auth, exercises, appointments)' },
      {
        name: 'Search',
        description: 'Full-text search across patients, encounters, and diagnoses',
      },
      { name: 'Import', description: 'Data import from Excel, CSV, and text' },
      { name: 'PDF', description: 'PDF generation (letters, invoices, treatment summaries)' },
      {
        name: 'Follow-ups',
        description: 'Follow-up tasks, recall scheduling, and patient outreach',
      },
      { name: 'Progress', description: 'Exercise progress tracking and compliance analytics' },
      { name: 'Dashboard', description: 'Dashboard statistics and overview' },
      { name: 'Financial', description: 'Financial metrics and invoicing' },
      { name: 'KPI', description: 'Key performance indicators and analytics' },
      { name: 'CRM', description: 'Lead management, lifecycle, retention, and campaigns' },
      { name: 'Organizations', description: 'Organization and user management' },
      { name: 'GDPR', description: 'Data privacy and GDPR compliance' },
      { name: 'FHIR', description: 'HL7 FHIR R4 interoperability endpoints' },
      { name: 'Telehealth', description: 'Video consultation management' },
    ],
  },
  apis: ['./src/routes/*.js'], // Path to route files with JSDoc comments
};

export default swaggerOptions;
