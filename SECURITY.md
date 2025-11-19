# Security Implementation Guide

## Overview

ChiroClickCRM implements comprehensive security measures to protect sensitive patient data (PHI/PII) in compliance with Norwegian healthcare regulations, GDPR, and industry best practices.

## Critical Security Features

### 1. SSL/TLS Encryption ✅

**Database Connections:**
- Production databases MUST use SSL with certificate verification
- `rejectUnauthorized: true` enforces certificate validation
- Self-signed certificates are NOT recommended for production

**Environment Configuration:**
```env
DB_SSL=true
NODE_ENV=production
```

**File:** `backend/src/config/database.js`

### 2. CSRF Protection ✅

**Implementation:**
- Token-based CSRF protection using `csurf` middleware
- Tokens stored in httpOnly cookies
- Double-submit cookie pattern

**Usage:**
The CSRF token is automatically sent to clients in the `XSRF-TOKEN` cookie. Frontend applications should include this token in requests:

```javascript
// Axios example
axios.defaults.headers.common['X-CSRF-Token'] = getCookie('XSRF-TOKEN');

// Fetch example
fetch('/api/v1/patients', {
  method: 'POST',
  headers: {
    'X-CSRF-Token': getCookie('XSRF-TOKEN'),
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(data)
});
```

**Public endpoints excluded from CSRF:**
- `/health`
- `/api/v1/auth/login`
- `/api/v1/auth/register`

**File:** `backend/src/middleware/security.js`

### 3. Two-Factor Authentication (2FA) Enforcement ✅

**Requirements:**
- MANDATORY for roles: `ADMIN`, `SUPER_ADMIN`, `OWNER`
- Session verification required every 12 hours
- Integration with Clerk authentication provider

**Enforcement Flow:**
1. User logs in with username/password
2. System checks user role
3. If admin role → verify 2FA is enabled
4. If not enabled → return 403 with setup instructions
5. If enabled → require 2FA verification
6. Session marked as `mfaVerified` for 12 hours

**Usage Example:**
```javascript
import { enforce2FA } from './middleware/security.js';

// Protect admin routes
router.post('/admin/delete-patient',
  authenticate,      // Verify user is logged in
  enforce2FA,        // Require 2FA
  requireRole(['ADMIN']),
  deletePatient
);
```

**File:** `backend/src/middleware/security.js:45-92`

### 4. Rate Limiting ✅

**Three levels of rate limiting:**

#### Global Rate Limit (Moderate)
- 100 requests per 15 minutes per IP
- Applied to all `/api/v1/*` endpoints

#### Moderate Rate Limit
- 60 requests per minute per user/IP
- For normal endpoints (viewing data, searching)

```javascript
import { moderateRateLimit } from './middleware/security.js';

router.get('/patients', moderateRateLimit, getPatients);
```

#### Strict Rate Limit
- 5 requests per 15 minutes per user/IP
- For sensitive operations (deletion, data export, admin actions)

```javascript
import { strictRateLimit } from './middleware/security.js';

router.delete('/patients/:id', strictRateLimit, deletePatient);
router.post('/gdpr/export', strictRateLimit, exportPatientData);
```

**File:** `backend/src/middleware/security.js:122-174`

### 5. Input Sanitization ✅

**Automatic sanitization of:**
- Query parameters
- Request body fields
- Headers

**Protected against:**
- XSS (Cross-Site Scripting)
- Script injection
- Event handler injection
- iframe injection

**Preserved fields** (clinical content):
- `subjective`, `objective`, `assessment`, `plan`, `notes`

**File:** `backend/src/middleware/security.js:210-244`

### 6. Security Headers ✅

**Implemented using Helmet.js:**

- **Content Security Policy (CSP)**: Prevents unauthorized script execution
- **HSTS**: Forces HTTPS connections (1 year max-age)
- **X-Content-Type-Options**: Prevents MIME-type sniffing
- **X-Frame-Options**: Prevents clickjacking (DENY)
- **XSS Filter**: Browser-level XSS protection

**File:** `backend/src/middleware/security.js:179-204`

### 7. Session Security ✅

**Configuration:**
- Custom session name (not default `connect.sid`)
- httpOnly cookies (prevent JavaScript access)
- secure cookies in production (HTTPS only)
- sameSite: strict (CSRF protection)
- 24-hour session lifetime with rolling refresh

**Environment Variable:**
```env
SESSION_SECRET=your_session_secret_here  # Generate with: openssl rand -base64 32
```

**File:** `backend/src/middleware/security.js:293-305`

### 8. Organization Isolation ✅

**Multi-tenant security:**
- Users can only access data from their own organization
- Enforced at middleware level
- Super admins can access all organizations

**Usage:**
```javascript
import { validateOrganization } from './middleware/security.js';

router.get('/patients',
  authenticate,
  validateOrganization,  // Ensure user belongs to requested organization
  getPatients
);
```

**File:** `backend/src/middleware/security.js:250-276`

### 9. Norwegian Fødselsnummer Validation ✅

**CRITICAL LEGAL REQUIREMENT:**
- Full Mod11 checksum validation
- Supports regular fødselsnummer and D-numbers
- Extracts birth date with century detection
- Gender extraction

**Functions:**
- `validateFodselsnummer(fnr)` - Full validation with checksums
- `extractBirthDate(fnr)` - Extract birth date (handles century)
- `extractGender(fnr)` - Extract gender from digit 9
- `isDNumber(fnr)` - Check if it's a D-number (foreign temporary ID)
- `calculateAge(fnr)` - Calculate current age
- `validateAndSanitize(fnr)` - Complete validation with error messages

**Usage:**
```javascript
import { validateFodselsnummer, extractBirthDate } from './utils/norwegianIdValidation.js';

// Validate before saving
if (!validateFodselsnummer(patientData.fodselsnummer)) {
  throw new ValidationError('Invalid Norwegian fødselsnummer');
}

// Extract birth date
const birthDate = extractBirthDate(patientData.fodselsnummer);
```

**File:** `backend/src/utils/norwegianIdValidation.js`

### 10. Comprehensive Error Handling ✅

**Custom Error Classes:**
- `ValidationError` (400) - Input validation failures
- `AuthenticationError` (401) - Authentication required
- `AuthorizationError` (403) - Insufficient permissions
- `NotFoundError` (404) - Resource not found
- `DatabaseError` (500) - Database operation failures

**PostgreSQL Error Handling:**
Automatically translates PostgreSQL error codes to user-friendly messages:
- `23505` - Duplicate value
- `23503` - Invalid reference
- `23502` - Required field missing
- `40001` - Serialization failure (retry needed)

**Security Event Logging:**
Automatically logs security-relevant errors to audit log:
- Authentication failures
- Authorization failures
- CSRF violations

**Usage:**
```javascript
import { ValidationError, asyncHandler } from './middleware/errorHandler.js';

// Wrap async route handlers
router.post('/patients', asyncHandler(async (req, res) => {
  if (!req.body.firstName) {
    throw new ValidationError('First name is required');
  }

  const patient = await createPatient(req.body);
  res.json(patient);
}));
```

**File:** `backend/src/middleware/errorHandler.js`

## Security Checklist for Production

### Before Deployment:

- [ ] **SSL/TLS**: Verify database SSL is enabled with `rejectUnauthorized: true`
- [ ] **Environment Variables**: Generate secure random values for:
  - [ ] `SESSION_SECRET` (32+ characters)
  - [ ] `JWT_SECRET` (32+ characters)
  - [ ] `ENCRYPTION_KEY` (32 characters exactly)
- [ ] **HTTPS**: Ensure application is served over HTTPS
- [ ] **2FA**: Verify all admin users have 2FA enabled
- [ ] **Rate Limiting**: Verify strict rate limiting on sensitive endpoints
- [ ] **CSRF**: Test CSRF protection with frontend
- [ ] **Headers**: Verify security headers using https://securityheaders.com
- [ ] **Session Store**: Use Redis for session storage (not in-memory)
- [ ] **Database**: Review and apply all migrations
- [ ] **Audit Logging**: Verify audit logs are being written
- [ ] **Backup**: Test database backup and restore procedures
- [ ] **Error Handling**: Verify error messages don't leak sensitive info

### Environment Setup:

```bash
# Generate SESSION_SECRET
openssl rand -base64 32

# Generate JWT_SECRET
openssl rand -base64 32

# Generate ENCRYPTION_KEY (exactly 32 characters)
openssl rand -hex 16
```

### Required Environment Variables:

```env
NODE_ENV=production
SESSION_SECRET=<generated_secret>
JWT_SECRET=<generated_secret>
ENCRYPTION_KEY=<generated_key>
DB_SSL=true
REDIS_ENABLED=true
SECRET_PROVIDER=vault  # or aws, azure
```

## Security Best Practices

### For Developers:

1. **Always use `asyncHandler` for async routes:**
   ```javascript
   router.get('/patients', asyncHandler(async (req, res) => {
     // Your code here
   }));
   ```

2. **Use custom error classes:**
   ```javascript
   throw new ValidationError('Invalid input', { field: 'email' });
   throw new AuthorizationError('Admin access required');
   ```

3. **Apply appropriate rate limiting:**
   - Strict: Delete, export, admin operations
   - Moderate: Normal CRUD operations
   - Global: Catches everything else

4. **Validate organization access:**
   ```javascript
   router.get('/patients', authenticate, validateOrganization, getPatients);
   ```

5. **Enforce 2FA on admin routes:**
   ```javascript
   router.post('/admin/settings', authenticate, enforce2FA, updateSettings);
   ```

6. **Validate Norwegian IDs:**
   ```javascript
   import { validateFodselsnummer } from './utils/norwegianIdValidation.js';

   if (!validateFodselsnummer(fnr)) {
     throw new ValidationError('Invalid fødselsnummer');
   }
   ```

### For Frontend Developers:

1. **Include CSRF token in all requests:**
   ```javascript
   const csrfToken = getCookie('XSRF-TOKEN');

   fetch('/api/v1/patients', {
     method: 'POST',
     headers: {
       'X-CSRF-Token': csrfToken,
       'Content-Type': 'application/json'
     },
     body: JSON.stringify(data)
   });
   ```

2. **Handle rate limit responses:**
   ```javascript
   if (response.status === 429) {
     const retryAfter = response.headers.get('X-RateLimit-Reset');
     // Show user-friendly message
     alert(`Too many requests. Please try again in ${retryAfter} seconds.`);
   }
   ```

3. **Handle 2FA enforcement:**
   ```javascript
   if (response.status === 403 && data.action === 'ENABLE_2FA') {
     // Redirect to 2FA setup
     window.location.href = data.setupUrl;
   }
   ```

## Audit Logging

All security-relevant events are automatically logged to the audit log:

- Authentication attempts (success/failure)
- Authorization failures
- CSRF violations
- Sensitive data access (patient records, clinical notes)
- Admin actions (user management, data deletion)

**Query audit logs:**
```sql
-- Recent security events
SELECT * FROM audit_log
WHERE action_type IN ('login_failed', 'csrf_error', 'unauthorized_access')
ORDER BY created_at DESC
LIMIT 100;

-- Suspicious activity (view)
SELECT * FROM suspicious_activity;
```

**File:** `backend/src/services/auditLog.js`

## Compliance

### GDPR Compliance:
- ✅ Audit logging (all access tracked)
- ✅ Data encryption (fødselsnummer, sensitive fields)
- ✅ Right to be forgotten (GDPR export/delete endpoints)
- ✅ Consent tracking
- ✅ 10-year retention policy

### Norwegian Healthcare Compliance:
- ✅ Fødselsnummer validation (Mod11 algorithm)
- ✅ Clinical notes versioning (legal requirement)
- ✅ 10-year backup retention
- ✅ ICPC-2 and ICD-10 coding

### Security Standards:
- ✅ OWASP Top 10 protection
- ✅ CWE/SANS Top 25 protection
- ✅ PCI DSS principles (where applicable)

## Monitoring and Alerts

### Health Checks:

```bash
# Application health
curl http://localhost:3000/health

# Database health
curl http://localhost:3000/api/v1/health/database

# Redis health (if enabled)
curl http://localhost:3000/api/v1/health/redis
```

### Security Monitoring:

```sql
-- Failed login attempts (last 24 hours)
SELECT user_id, ip_address, COUNT(*) as attempts
FROM audit_log
WHERE action_type = 'login_failed'
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY user_id, ip_address
HAVING COUNT(*) > 5;

-- Unauthorized access attempts
SELECT * FROM suspicious_activity
WHERE created_at > NOW() - INTERVAL '1 hour';
```

## Incident Response

### In case of security incident:

1. **Immediate Actions:**
   - Identify and isolate affected systems
   - Review audit logs for timeline and scope
   - Change all secrets and credentials
   - Notify affected users (GDPR requirement)

2. **Investigation:**
   - Query audit logs: `SELECT * FROM audit_log WHERE created_at > '<incident_time>'`
   - Check suspicious activity view
   - Review application logs
   - Check database for unauthorized changes

3. **Recovery:**
   - Restore from backup if needed
   - Apply security patches
   - Update security measures
   - Document lessons learned

## Support and Resources

### Documentation:
- DEPLOYMENT_GUIDE.md - Production deployment instructions
- IMPLEMENTATION_GUIDE.md - Feature implementation examples
- INTEGRATION_EXAMPLES.md - Code examples

### Files Reference:
- Security middleware: `backend/src/middleware/security.js`
- Error handling: `backend/src/middleware/errorHandler.js`
- Norwegian ID validation: `backend/src/utils/norwegianIdValidation.js`
- Audit logging: `backend/src/services/auditLog.js`
- Database config: `backend/src/config/database.js`

### External Resources:
- OWASP Security Practices: https://owasp.org/
- Norwegian Data Protection Authority: https://www.datatilsynet.no/
- GDPR Compliance: https://gdpr.eu/

---

**Last Updated:** 2025-11-19
**Version:** 1.0.0
