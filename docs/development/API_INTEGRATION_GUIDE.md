# ChiroClickCRM API Integration Guide

## Table of Contents
1. [Authentication](#authentication)
2. [Multi-Tenancy](#multi-tenancy)
3. [API Endpoints](#api-endpoints)
4. [Error Handling](#error-handling)
5. [Rate Limiting](#rate-limiting)
6. [Caching Strategy](#caching-strategy)
7. [Best Practices](#best-practices)

---

## Authentication

ChiroClickCRM uses **Clerk.com** for authentication with JWT tokens.

### Getting Started

1. **Obtain API credentials** from your Clerk dashboard
2. **Authenticate** users to receive a JWT token
3. **Include the token** in all API requests

### Request Headers

```http
Authorization: Bearer <jwt_token>
X-Organization-Id: <organization_uuid>
```

### Example: Authentication Flow

```javascript
// Frontend - Using Clerk React
import { useAuth } from '@clerk/clerk-react';

const MyComponent = () => {
  const { getToken } = useAuth();

  const fetchPatients = async () => {
    const token = await getToken();
    const response = await fetch('http://localhost:3000/api/v1/patients', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Organization-Id': localStorage.getItem('organizationId')
      }
    });

    return await response.json();
  };
};
```

---

## Multi-Tenancy

ChiroClickCRM is **multi-tenant** at the organization level.

### Organization Isolation

- Every API request **MUST** include `X-Organization-Id` header
- Data is strictly isolated by organization
- Schema-per-tenant architecture ensures security

### Example: Organization Context

```javascript
const organizationId = 'a1b2c3d4-e5f6-4789-0123-456789abcdef';

axios.defaults.headers.common['X-Organization-Id'] = organizationId;
```

---

## API Endpoints

### Base URL

```
Development: http://localhost:3000/api/v1
Production: https://api.chiroclickcrm.no/api/v1
```

### Patients

#### List Patients
```http
GET /api/v1/patients
```

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20)
- `search` (string): Search by name
- `status` (string): Filter by status

**Response:**
```json
{
  "patients": [
    {
      "id": "uuid",
      "first_name": "Ola",
      "last_name": "Nordmann",
      "date_of_birth": "1985-05-15",
      "email": "ola@example.com",
      "phone": "+4791234567",
      "fodselsnummer_masked": "150585*****",
      "created_at": "2025-01-15T10:00:00Z"
    }
  ],
  "total": 150,
  "page": 1,
  "totalPages": 8
}
```

#### Create Patient
```http
POST /api/v1/patients
```

**Request Body:**
```json
{
  "first_name": "Kari",
  "last_name": "Hansen",
  "date_of_birth": "1990-03-20",
  "fodselsnummer": "20039012345",
  "email": "kari@example.com",
  "phone": "+4798765432",
  "address": {
    "street": "Storgata 1",
    "postal_code": "0123",
    "city": "Oslo"
  },
  "consent_sms": true,
  "consent_email": true,
  "consent_marketing": false
}
```

**Response: 201 Created**
```json
{
  "id": "new-uuid",
  "first_name": "Kari",
  "last_name": "Hansen",
  ...
}
```

### Clinical Encounters

#### Create Encounter
```http
POST /api/v1/encounters
```

**Request Body:**
```json
{
  "patient_id": "patient-uuid",
  "encounter_date": "2025-01-15T14:30:00Z",
  "encounter_type": "INITIAL",
  "chief_complaint": "Low back pain",
  "soap_notes": {
    "subjective": "Patient reports 2 weeks of low back pain...",
    "objective": "Positive SLR at 45 degrees...",
    "assessment": "L03 - Low back pain, likely muscular origin",
    "plan": "HVLA manipulation L4-L5, home exercises"
  },
  "diagnosis_codes": [
    {
      "icpc2_code": "L03",
      "icd10_code": "M54.5",
      "description": "Low back pain"
    }
  ],
  "treatment": {
    "modalities": ["HVLA", "SOFT_TISSUE"],
    "regions": ["LUMBAR"],
    "vas_before": 7,
    "vas_after": 3
  }
}
```

#### Sign Encounter (Make Immutable)
```http
POST /api/v1/encounters/:id/sign
```

**Note:** Once signed, the encounter becomes read-only.

### Appointments

#### Create Appointment
```http
POST /api/v1/appointments
```

**Request Body:**
```json
{
  "patient_id": "patient-uuid",
  "practitioner_id": "practitioner-uuid",
  "start_time": "2025-01-20T10:00:00Z",
  "end_time": "2025-01-20T10:30:00Z",
  "appointment_type": "FOLLOW_UP",
  "notes": "Follow-up after initial treatment",
  "send_reminder": true,
  "recurring": {
    "pattern": "WEEKLY",
    "interval": 1,
    "occurrences": 4
  }
}
```

### GDPR

#### Data Access Request (Article 15)
```http
GET /api/v1/gdpr/patient/:patientId/data-access
```

**Response:** Complete patient data export

#### Data Portability (Article 20)
```http
GET /api/v1/gdpr/patient/:patientId/data-portability
```

**Response:** Machine-readable JSON export

#### Request Erasure (Article 17)
```http
POST /api/v1/gdpr/requests/:requestId/erasure
```

---

## Error Handling

### Standard Error Response

```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "field": "fodselsnummer",
    "message": "Invalid fødselsnummer format"
  },
  "timestamp": "2025-01-15T10:00:00Z"
}
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 409 | Conflict (duplicate resource) |
| 429 | Too Many Requests (rate limit exceeded) |
| 500 | Internal Server Error |

---

## Rate Limiting

### Limits

- **100 requests per 15 minutes** per IP address
- Returns `429 Too Many Requests` when exceeded

### Response Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642348800
```

### Retry Strategy

```javascript
const fetchWithRetry = async (url, options, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    const response = await fetch(url, options);

    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
      continue;
    }

    return response;
  }
};
```

---

## Caching Strategy

### GET Requests

- **Caching:** GET requests are cached for **5 minutes** (when Redis is configured)
- **Invalidation:** Cache is automatically cleared on POST/PUT/PATCH/DELETE

### Cache Headers

```http
Cache-Control: private, max-age=300
ETag: "33a64df551425fcc55e4d42a148795d9f25f89d4"
```

### Bypassing Cache

Add `Cache-Control: no-cache` header to bypass cache:

```javascript
fetch('/api/v1/patients', {
  headers: {
    'Cache-Control': 'no-cache'
  }
});
```

---

## Best Practices

### 1. Always Include Organization ID

```javascript
// ✅ Correct
axios.defaults.headers.common['X-Organization-Id'] = organizationId;

// ❌ Wrong
// Missing header will result in 400 Bad Request
```

### 2. Handle Pagination

```javascript
const getAllPatients = async () => {
  let allPatients = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await fetch(`/api/v1/patients?page=${page}&limit=100`);
    const data = await response.json();

    allPatients = [...allPatients, ...data.patients];
    hasMore = data.page < data.totalPages;
    page++;
  }

  return allPatients;
};
```

### 3. Use FHIR Resources (When Available)

For interoperability, prefer FHIR endpoints:

```javascript
// FHIR Patient resource
GET /api/v1/fhir/Patient/:id

// FHIR Encounter resource
GET /api/v1/fhir/Encounter/:id
```

### 4. Validate Before Submission

Always validate Norwegian fødselsnummer on the client:

```javascript
const validateFodselsnummer = (fnr) => {
  // Must be 11 digits
  if (!/^\d{11}$/.test(fnr)) return false;

  // Validate date portion (DDMMYY)
  const day = parseInt(fnr.substring(0, 2));
  const month = parseInt(fnr.substring(2, 4));

  if (day < 1 || day > 31 || month < 1 || month > 12) {
    return false;
  }

  return true; // Server will validate checksum
};
```

### 5. Handle Consent Properly

```javascript
// Check consent before sending marketing messages
const sendMarketingEmail = async (patientId) => {
  const patient = await getPatient(patientId);

  if (!patient.consent_marketing) {
    throw new Error('Patient has not consented to marketing');
  }

  await sendEmail(patient.email, template);
};
```

### 6. Implement Proper Error Handling

```javascript
try {
  const response = await createEncounter(data);
} catch (error) {
  if (error.response?.status === 400) {
    // Validation error - show user-friendly message
    showValidationErrors(error.response.data.details);
  } else if (error.response?.status === 401) {
    // Unauthorized - redirect to login
    redirectToLogin();
  } else {
    // Unknown error - log and show generic message
    logger.error(error);
    showGenericError();
  }
}
```

---

## Interactive API Documentation

Access the **Swagger UI** for interactive documentation:

```
http://localhost:3000/api-docs
```

---

## Support

For integration support:
- Email: api-support@chiroclickcrm.no
- Documentation: https://docs.chiroclickcrm.no
- GitHub Issues: https://github.com/chiroclickcrm/issues
