# Integration Examples - Using New Features

This document provides practical examples of integrating the new security, performance, and compliance features into your application.

---

## 🔐 1. Secure Key Management Integration

### Example: User Authentication Controller

```javascript
// backend/src/controllers/auth.js
import { getJWTSecrets } from '../config/vault.js';
import { logAction, ACTION_TYPES } from '../services/auditLog.js';
import jwt from 'jsonwebtoken';

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Get JWT secrets from Vault
    const jwtSecrets = await getJWTSecrets();

    // Authenticate user (your existing logic)
    const user = await authenticateUser(email, password);

    if (!user) {
      // Log failed login attempt
      await logAction(ACTION_TYPES.USER_LOGIN_FAILED, null, {
        metadata: { email, reason: 'Invalid credentials' },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        success: false
      });

      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate tokens
    const accessToken = jwt.sign(
      { userId: user.id, role: user.role },
      jwtSecrets.accessTokenSecret,
      { expiresIn: jwtSecrets.expiresIn }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      jwtSecrets.refreshTokenSecret,
      { expiresIn: jwtSecrets.refreshExpiresIn }
    );

    // Log successful login
    await logAction(ACTION_TYPES.USER_LOGIN, user.id, {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      success: true
    });

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
```

---

## 📝 2. Clinical Validation Integration

### Example: Create/Update Clinical Encounter

```javascript
// backend/src/controllers/encounters.js
import { validateClinicalContent, validateSOAPCompleteness } from '../services/clinicalValidation.js';
import { logEncounterAction, ACTION_TYPES } from '../services/auditLog.js';
import { cacheEncounter } from '../config/redis.js';
import { query, transaction } from '../config/database-enhanced.js';

export const createEncounter = async (req, res) => {
  const { patient_id, subjective, objective, assessment, plan } = req.body;
  const practitioner_id = req.user.id;

  try {
    // 1. Validate completeness
    const completeness = validateSOAPCompleteness(req.body);
    if (!completeness.isComplete) {
      return res.status(400).json({
        error: 'Incomplete SOAP note',
        missing: completeness.missing
      });
    }

    // 2. Validate clinical content for safety
    const validation = await validateClinicalContent('', {
      subjective,
      objective,
      assessment,
      plan
    });

    // 3. Check for critical red flags
    if (validation.hasRedFlags) {
      const criticalFlags = validation.redFlags.filter(
        flag => flag.severity === 'CRITICAL'
      );

      if (criticalFlags.length > 0) {
        // Log critical flags immediately
        await logEncounterAction(
          'encounter.red_flag_detected',
          practitioner_id,
          null,
          {
            metadata: { redFlags: criticalFlags },
            ipAddress: req.ip
          }
        );

        return res.status(400).json({
          error: 'Critical red flags detected',
          redFlags: criticalFlags,
          requiresImmediateAction: true
        });
      }
    }

    // 4. Create encounter with transaction
    const encounter = await transaction(async (client) => {
      const result = await client.query(
        `INSERT INTO clinical_encounters (
          patient_id, practitioner_id, encounter_date,
          subjective, objective, assessment, plan, created_at
        ) VALUES ($1, $2, NOW(), $3, $4, $5, $6, NOW())
        RETURNING *`,
        [patient_id, practitioner_id, subjective, objective, assessment, plan]
      );

      return result.rows[0];
    });

    // 5. Invalidate patient's encounters cache
    await cacheEncounter.invalidate(encounter.id, patient_id);

    // 6. Log creation
    await logEncounterAction(
      ACTION_TYPES.ENCOUNTER_CREATE,
      practitioner_id,
      encounter.id,
      {
        metadata: {
          validation: {
            confidence: validation.confidence,
            warnings: validation.warnings.length
          }
        },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    );

    res.status(201).json({
      encounter,
      validation: {
        confidence: validation.confidence,
        warnings: validation.warnings,
        requiresReview: validation.requiresReview
      }
    });
  } catch (error) {
    console.error('Create encounter error:', error);
    res.status(500).json({ error: 'Failed to create encounter' });
  }
};

export const updateEncounter = async (req, res) => {
  const { id } = req.params;
  const { subjective, objective, assessment, plan, change_reason } = req.body;
  const practitioner_id = req.user.id;

  try {
    // 1. Check if encounter is signed (should use amendment instead)
    const existing = await query(
      'SELECT is_signed FROM clinical_encounters WHERE id = $1',
      [id]
    );

    if (existing.rows[0]?.is_signed) {
      return res.status(400).json({
        error: 'Cannot edit signed encounter',
        message: 'Use amendment endpoint for signed encounters'
      });
    }

    // 2. Validate content
    const validation = await validateClinicalContent('', {
      subjective,
      objective,
      assessment,
      plan
    });

    // 3. Update with transaction (versioning happens automatically via trigger)
    const updated = await transaction(async (client) => {
      const result = await client.query(
        `UPDATE clinical_encounters
         SET subjective = $1, objective = $2, assessment = $3, plan = $4,
             updated_by = $5, updated_at = NOW()
         WHERE id = $6
         RETURNING *`,
        [subjective, objective, assessment, plan, practitioner_id, id]
      );

      // Update version's change reason
      if (change_reason) {
        await client.query(
          `UPDATE clinical_encounter_versions
           SET change_reason = $1
           WHERE encounter_id = $2
             AND version_number = (
               SELECT MAX(version_number)
               FROM clinical_encounter_versions
               WHERE encounter_id = $2
             )`,
          [change_reason, id]
        );
      }

      return result.rows[0];
    });

    // 4. Invalidate cache
    await cacheEncounter.invalidate(id, updated.patient_id);

    // 5. Log update
    await logEncounterAction(
      ACTION_TYPES.ENCOUNTER_UPDATE,
      practitioner_id,
      id,
      {
        metadata: {
          change_reason,
          validation: validation.confidence
        },
        ipAddress: req.ip
      }
    );

    res.json({
      encounter: updated,
      validation
    });
  } catch (error) {
    console.error('Update encounter error:', error);
    res.status(500).json({ error: 'Failed to update encounter' });
  }
};
```

---

## 🤖 3. AI Feedback Integration

### Example: AI Suggestion Endpoint

```javascript
// backend/src/controllers/ai.js
import { validateClinicalContent } from '../services/clinicalValidation.js';
import { recordFeedback } from '../services/aiLearning.js';
import { logAISuggestion } from '../services/auditLog.js';

export const generateSuggestion = async (req, res) => {
  const { encounter_id, suggestion_type, context } = req.body;

  try {
    // 1. Generate AI suggestion (your Ollama integration)
    const aiResponse = await generateWithOllama(context);

    // 2. Validate the suggestion
    const validation = await validateClinicalContent(aiResponse.text, context);

    // 3. Calculate confidence
    const confidence = validation.confidence;

    res.json({
      suggestion: aiResponse.text,
      confidence,
      validation: {
        hasRedFlags: validation.hasRedFlags,
        warnings: validation.warnings,
        requiresReview: validation.requiresReview
      }
    });
  } catch (error) {
    console.error('AI suggestion error:', error);
    res.status(500).json({ error: 'Failed to generate suggestion' });
  }
};

export const submitFeedback = async (req, res) => {
  const {
    encounter_id,
    suggestion_type,
    original_suggestion,
    user_correction,
    accepted,
    correction_type,
    user_rating,
    time_to_decision
  } = req.body;

  try {
    // Record feedback for learning
    const feedback = await recordFeedback({
      encounterId: encounter_id,
      suggestionType: suggestion_type,
      originalSuggestion: original_suggestion,
      userCorrection: user_correction,
      accepted,
      correctionType: correction_type,
      userId: req.user.id,
      userRating,
      timeToDecision: time_to_decision
    });

    // Log for audit trail
    await logAISuggestion(req.user.id, {
      suggestionType: suggestion_type,
      originalText: original_suggestion,
      suggestedText: original_suggestion,
      finalText: user_correction || original_suggestion,
      confidence: req.body.confidence,
      accepted,
      modified: correction_type === 'minor' || correction_type === 'major',
      encounterId: encounter_id
    });

    res.json({
      success: true,
      feedback_id: feedback.id,
      message: accepted ? 'Feedback recorded' : 'Rejection recorded for improvement'
    });
  } catch (error) {
    console.error('Feedback submission error:', error);
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
};
```

---

## 💾 4. Redis Caching Integration

### Example: Patient Controller with Caching

```javascript
// backend/src/controllers/patients.js
import { cachePatient, cache, TTL } from '../config/redis.js';
import { logPatientAccess } from '../services/auditLog.js';
import { queryRead } from '../config/database-enhanced.js';

export const getPatient = async (req, res) => {
  const { id } = req.params;

  try {
    // 1. Try cache first
    let patient = await cachePatient.get(id);

    if (patient) {
      console.log('✅ Cache hit for patient:', id);
    } else {
      console.log('❌ Cache miss for patient:', id);

      // 2. Query database (use read replica)
      const result = await queryRead(
        'SELECT * FROM patients WHERE id = $1',
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Patient not found' });
      }

      patient = result.rows[0];

      // 3. Cache for 5 minutes
      await cachePatient.set(id, patient);
    }

    // 4. Log access (GDPR requirement)
    await logPatientAccess(
      req.user.id,
      id,
      'Patient record viewed',
      req.ip,
      req.headers['user-agent']
    );

    res.json(patient);
  } catch (error) {
    console.error('Get patient error:', error);
    res.status(500).json({ error: 'Failed to retrieve patient' });
  }
};

export const updatePatient = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    // Update in database
    const result = await query(
      `UPDATE patients
       SET first_name = $1, last_name = $2, phone = $3, email = $4, updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [updates.first_name, updates.last_name, updates.phone, updates.email, id]
    );

    const updated = result.rows[0];

    // Invalidate cache
    await cachePatient.invalidate(id);

    res.json(updated);
  } catch (error) {
    console.error('Update patient error:', error);
    res.status(500).json({ error: 'Failed to update patient' });
  }
};

// Cache-aside pattern for complex queries
export const getPatientEncounters = async (req, res) => {
  const { patient_id } = req.params;
  const { limit = 10, offset = 0 } = req.query;

  try {
    const cacheKey = `patient:${patient_id}:encounters:${limit}:${offset}`;

    const encounters = await cache.getOrSet(
      cacheKey,
      async () => {
        const result = await queryRead(
          `SELECT * FROM clinical_encounters
           WHERE patient_id = $1
           ORDER BY encounter_date DESC
           LIMIT $2 OFFSET $3`,
          [patient_id, limit, offset]
        );
        return result.rows;
      },
      TTL.FIVE_MINUTES
    );

    res.json(encounters);
  } catch (error) {
    console.error('Get encounters error:', error);
    res.status(500).json({ error: 'Failed to retrieve encounters' });
  }
};
```

---

## 🏥 5. FHIR Integration

### Example: FHIR Endpoints

```javascript
// backend/src/routes/fhir.js
import express from 'express';
import { patientToFHIR, encounterToFHIR, createBundle } from '../fhir/adapters.js';
import { queryRead } from '../config/database-enhanced.js';

const router = express.Router();

// Get Patient in FHIR format
router.get('/Patient/:id', async (req, res) => {
  try {
    const result = await queryRead(
      'SELECT * FROM patients WHERE id = $1',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        resourceType: 'OperationOutcome',
        issue: [{
          severity: 'error',
          code: 'not-found',
          diagnostics: 'Patient not found'
        }]
      });
    }

    const fhirPatient = patientToFHIR(result.rows[0]);
    res.json(fhirPatient);
  } catch (error) {
    console.error('FHIR Patient error:', error);
    res.status(500).json({
      resourceType: 'OperationOutcome',
      issue: [{
        severity: 'error',
        code: 'exception',
        diagnostics: error.message
      }]
    });
  }
});

// Get Encounter in FHIR format
router.get('/Encounter/:id', async (req, res) => {
  try {
    const result = await queryRead(
      `SELECT e.*, p.first_name, p.last_name, pr.name as practitioner_name
       FROM clinical_encounters e
       JOIN patients p ON e.patient_id = p.id
       JOIN users pr ON e.practitioner_id = pr.id
       WHERE e.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        resourceType: 'OperationOutcome',
        issue: [{ severity: 'error', code: 'not-found' }]
      });
    }

    const encounter = result.rows[0];
    const patient = {
      first_name: encounter.first_name,
      last_name: encounter.last_name
    };
    const practitioner = { name: encounter.practitioner_name };

    const fhirEncounter = encounterToFHIR(encounter, patient, practitioner);
    res.json(fhirEncounter);
  } catch (error) {
    console.error('FHIR Encounter error:', error);
    res.status(500).json({
      resourceType: 'OperationOutcome',
      issue: [{ severity: 'error', code: 'exception' }]
    });
  }
});

// Get Patient with all Encounters as Bundle
router.get('/Patient/:id/$everything', async (req, res) => {
  try {
    // Get patient
    const patientResult = await queryRead(
      'SELECT * FROM patients WHERE id = $1',
      [req.params.id]
    );

    if (patientResult.rows.length === 0) {
      return res.status(404).json({
        resourceType: 'OperationOutcome',
        issue: [{ severity: 'error', code: 'not-found' }]
      });
    }

    // Get all encounters
    const encountersResult = await queryRead(
      `SELECT e.*, pr.name as practitioner_name
       FROM clinical_encounters e
       JOIN users pr ON e.practitioner_id = pr.id
       WHERE e.patient_id = $1
       ORDER BY e.encounter_date DESC`,
      [req.params.id]
    );

    const resources = [
      patientToFHIR(patientResult.rows[0]),
      ...encountersResult.rows.map(enc =>
        encounterToFHIR(enc, patientResult.rows[0], { name: enc.practitioner_name })
      )
    ];

    const bundle = createBundle(resources, 'searchset');
    res.json(bundle);
  } catch (error) {
    console.error('FHIR Bundle error:', error);
    res.status(500).json({
      resourceType: 'OperationOutcome',
      issue: [{ severity: 'error', code: 'exception' }]
    });
  }
});

export default router;
```

---

## 📊 6. Template Quality Integration

### Example: Template Management

```javascript
// backend/src/controllers/templates.js
import {
  scoreTemplateQuality,
  getTemplatesNeedingReview,
  approveTemplate,
  rejectTemplate
} from '../services/templateQuality.js';
import { cacheTemplate } from '../config/redis.js';

export const createTemplate = async (req, res) => {
  const { template_text, template_category } = req.body;

  try {
    // 1. Score quality automatically
    const qualityAnalysis = scoreTemplateQuality({
      template_text,
      template_category
    });

    // 2. Auto-reject if PII detected
    if (qualityAnalysis.recommendation.status === 'REJECT' &&
        qualityAnalysis.scores.piiCheck < 1.0) {
      return res.status(400).json({
        error: 'Template contains PII',
        details: qualityAnalysis.scores.details.piiCheck.issues
      });
    }

    // 3. Create template with quality score
    const result = await query(
      `INSERT INTO clinical_templates (
        template_text, template_category, quality_score,
        review_status, created_by, created_at
      ) VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *`,
      [
        template_text,
        template_category,
        qualityAnalysis.totalScore,
        qualityAnalysis.recommendation.status.toLowerCase(),
        req.user.id
      ]
    );

    const template = result.rows[0];

    res.status(201).json({
      template,
      quality: {
        score: qualityAnalysis.totalScore,
        recommendation: qualityAnalysis.recommendation,
        requiresReview: qualityAnalysis.requiresReview,
        details: qualityAnalysis.scores.details
      }
    });
  } catch (error) {
    console.error('Create template error:', error);
    res.status(500).json({ error: 'Failed to create template' });
  }
};

// Admin endpoint: Review pending templates
export const getReviewQueue = async (req, res) => {
  try {
    const templates = await getTemplatesNeedingReview(50);

    res.json({
      templates,
      total: templates.length
    });
  } catch (error) {
    console.error('Review queue error:', error);
    res.status(500).json({ error: 'Failed to get review queue' });
  }
};

// Admin endpoint: Approve template
export const approveTemplateEndpoint = async (req, res) => {
  const { id } = req.params;
  const { notes } = req.body;

  try {
    await approveTemplate(id, req.user.id, notes);

    // Invalidate cache
    await cacheTemplate.invalidateAll();

    res.json({ message: 'Template approved' });
  } catch (error) {
    console.error('Approve template error:', error);
    res.status(500).json({ error: 'Failed to approve template' });
  }
};
```

---

## 🚀 7. Middleware Integration

### Example: Request Validation & Logging Middleware

```javascript
// backend/src/middleware/requestLogger.js
import { logAction } from '../services/auditLog.js';
import { rateLimit } from '../config/redis.js';

export const auditMiddleware = (actionType) => {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);

    res.json = async (data) => {
      // Log after response
      setImmediate(async () => {
        await logAction(actionType, req.user?.id, {
          resourceType: extractResourceType(req.path),
          resourceId: req.params.id || data?.id,
          metadata: {
            method: req.method,
            path: req.path,
            query: req.query
          },
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          success: res.statusCode < 400
        });
      });

      return originalJson(data);
    };

    next();
  };
};

export const rateLimitMiddleware = (limit = 100, windowSeconds = 60) => {
  return async (req, res, next) => {
    const identifier = req.user?.id || req.ip;

    const result = await rateLimit.check(
      identifier,
      req.path,
      limit,
      windowSeconds
    );

    if (!result.allowed) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        limit: result.limit,
        current: result.current,
        resetIn: result.resetIn
      });
    }

    res.set('X-RateLimit-Limit', result.limit);
    res.set('X-RateLimit-Remaining', result.limit - result.current);
    res.set('X-RateLimit-Reset', result.resetIn);

    next();
  };
};

const extractResourceType = (path) => {
  const match = path.match(/\/api\/([^\/]+)/);
  return match ? match[1] : 'unknown';
};
```

### Usage in Routes

```javascript
// backend/src/routes/encounters.js
import express from 'express';
import { auditMiddleware, rateLimitMiddleware } from '../middleware/requestLogger.js';
import { ACTION_TYPES } from '../services/auditLog.js';

const router = express.Router();

// Apply rate limiting and audit logging
router.get(
  '/:id',
  rateLimitMiddleware(60, 60), // 60 requests per minute
  auditMiddleware(ACTION_TYPES.ENCOUNTER_READ),
  getEncounter
);

router.post(
  '/',
  rateLimitMiddleware(20, 60), // 20 creates per minute
  auditMiddleware(ACTION_TYPES.ENCOUNTER_CREATE),
  createEncounter
);

export default router;
```

---

## ✅ Complete Integration Example

### Full Express Server with All Features

```javascript
// backend/server.js
import express from 'express';
import { initializeSecrets } from './src/config/vault.js';
import { initializeDatabase, closeDatabase } from './src/config/database-enhanced.js';
import { redis, closeRedis } from './src/config/redis.js';
import { auditMiddleware, rateLimitMiddleware } from './src/middleware/requestLogger.js';

const app = express();

// Middleware
app.use(express.json());
app.use(rateLimitMiddleware(100, 60)); // Global rate limit

// Routes
import patientsRouter from './src/routes/patients.js';
import encountersRouter from './src/routes/encounters.js';
import fhirRouter from './src/routes/fhir.js';

app.use('/api/patients', patientsRouter);
app.use('/api/encounters', encountersRouter);
app.use('/api/fhir/r4', fhirRouter);

// Health check
app.get('/health', async (req, res) => {
  const dbHealth = await healthCheck();
  const redisHealth = redis.status === 'ready';

  res.json({
    status: dbHealth.healthy && redisHealth ? 'healthy' : 'unhealthy',
    components: {
      database: dbHealth,
      redis: { connected: redisHealth },
      vault: { available: true } // Add vault health check
    },
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 Shutting down...');
  await closeDatabase();
  await closeRedis();
  process.exit(0);
});

// Start
(async () => {
  try {
    await initializeSecrets();
    await initializeDatabase();

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Startup failed:', error);
    process.exit(1);
  }
})();
```

---

**For more examples, see:**
- IMPLEMENTATION_GUIDE.md - Step-by-step implementation
- DEPLOYMENT_GUIDE.md - Production deployment
- API documentation at /api-docs (Swagger)
