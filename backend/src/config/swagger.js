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
        email: 'support@chiroclickcrm.no'
      },
      license: {
        name: 'Private and Confidential',
        url: 'https://chiroclickcrm.no/license'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000/api/v1',
        description: 'Development server'
      },
      {
        url: 'https://api.chiroclickcrm.no/api/v1',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Clerk.com JWT token'
        },
        OrganizationId: {
          type: 'apiKey',
          in: 'header',
          name: 'X-Organization-Id',
          description: 'Multi-tenant organization identifier (UUID)'
        }
      },
      schemas: {
        Patient: {
          type: 'object',
          required: ['first_name', 'last_name'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Patient unique identifier'
            },
            first_name: {
              type: 'string',
              maxLength: 100,
              example: 'Ola'
            },
            last_name: {
              type: 'string',
              maxLength: 100,
              example: 'Nordmann'
            },
            date_of_birth: {
              type: 'string',
              format: 'date',
              example: '1985-05-15'
            },
            fodselsnummer: {
              type: 'string',
              pattern: '^\\d{11}$',
              description: 'Norwegian fødselsnummer (11 digits)',
              example: '15058512345'
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'ola.nordmann@example.com'
            },
            phone: {
              type: 'string',
              pattern: '^\\+47\\d{8}$',
              example: '+4791234567'
            },
            address: {
              type: 'object',
              properties: {
                street: { type: 'string', example: 'Storgata 1' },
                postal_code: { type: 'string', example: '0123' },
                city: { type: 'string', example: 'Oslo' }
              }
            },
            consent_sms: {
              type: 'boolean',
              description: 'Consent for SMS communications'
            },
            consent_email: {
              type: 'boolean',
              description: 'Consent for email communications'
            },
            consent_marketing: {
              type: 'boolean',
              description: 'Consent for marketing communications'
            }
          }
        },
        ClinicalEncounter: {
          type: 'object',
          required: ['patient_id', 'encounter_date', 'chief_complaint'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            patient_id: {
              type: 'string',
              format: 'uuid'
            },
            encounter_date: {
              type: 'string',
              format: 'date-time',
              example: '2025-01-15T14:30:00Z'
            },
            encounter_type: {
              type: 'string',
              enum: ['INITIAL', 'FOLLOW_UP', 'REASSESSMENT', 'EMERGENCY'],
              example: 'INITIAL'
            },
            chief_complaint: {
              type: 'string',
              example: 'Low back pain for 2 weeks'
            },
            soap_notes: {
              type: 'object',
              properties: {
                subjective: { type: 'string' },
                objective: { type: 'string' },
                assessment: { type: 'string' },
                plan: { type: 'string' }
              }
            },
            diagnosis_codes: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  icpc2_code: { type: 'string', example: 'L03' },
                  icd10_code: { type: 'string', example: 'M54.5' },
                  description: { type: 'string', example: 'Low back pain' }
                }
              }
            },
            is_signed: {
              type: 'boolean',
              description: 'Whether encounter has been digitally signed (immutable after signing)'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message'
            },
            code: {
              type: 'string',
              description: 'Error code'
            },
            details: {
              type: 'object',
              description: 'Additional error details'
            }
          }
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Authentication token missing or invalid',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                error: 'Unauthorized',
                code: 'AUTH_REQUIRED'
              }
            }
          }
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                error: 'Resource not found',
                code: 'NOT_FOUND'
              }
            }
          }
        },
        ValidationError: {
          description: 'Request validation failed',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                error: 'Validation failed',
                code: 'VALIDATION_ERROR',
                details: {
                  field: 'email',
                  message: 'Invalid email format'
                }
              }
            }
          }
        }
      }
    },
    security: [
      {
        BearerAuth: [],
        OrganizationId: []
      }
    ],
    tags: [
      {
        name: 'Patients',
        description: 'Patient management operations'
      },
      {
        name: 'Encounters',
        description: 'Clinical encounter documentation'
      },
      {
        name: 'Appointments',
        description: 'Appointment scheduling and management'
      },
      {
        name: 'Communications',
        description: 'SMS, email, and patient communications'
      },
      {
        name: 'Follow-ups',
        description: 'CRM follow-up tasks and automation'
      },
      {
        name: 'Financial',
        description: 'Financial metrics and invoicing'
      },
      {
        name: 'KPI',
        description: 'Key performance indicators and analytics'
      },
      {
        name: 'Outcomes',
        description: 'Clinical outcomes and treatment effectiveness'
      },
      {
        name: 'GDPR',
        description: 'Data privacy and GDPR compliance'
      },
      {
        name: 'FHIR',
        description: 'HL7 FHIR R4 interoperability endpoints'
      },
      {
        name: 'Telehealth',
        description: 'Video consultation management'
      },
      {
        name: 'Portal',
        description: 'Patient portal and engagement'
      }
    ]
  },
  apis: ['./src/routes/*.js'] // Path to route files with JSDoc comments
};

export default swaggerOptions;
