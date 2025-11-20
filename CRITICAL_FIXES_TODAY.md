# Critical Fixes - Implement Today (2.5 Hours)

**Date:** 2025-11-20
**Priority:** CRITICAL
**Estimated Time:** 2.5 hours
**Impact:** Prevents production security vulnerabilities

---

## ✅ Checklist

- [ ] Fix 1: Database SSL Configuration (30 min)
- [ ] Fix 2: CSRF Protection (30 min)
- [ ] Fix 3: Fødselsnummer Modulo 11 Validation (15 min)
- [ ] Fix 4: Backup Scripts (1 hour)
- [ ] Fix 5: ESLint & Prettier Configuration (15 min)
- [ ] Commit & Push Changes

---

## Fix 1: Database SSL Configuration (30 minutes)

### Problem
Current configuration accepts self-signed certificates → vulnerable to MITM attacks

**File:** `backend/src/config/database.js:24-29`

### Solution

#### Step 1: Get SSL Certificates

**For Development (Self-signed):**
```bash
cd backend/ssl
openssl req -x509 -newkey rsa:4096 -keyout server-key.pem -out server-cert.pem -days 365 -nodes
```

**For Production:**
Use certificates from your PostgreSQL provider (Supabase, AWS RDS, Azure, etc.)

#### Step 2: Update Configuration

**File:** `backend/src/config/database.js`

Replace lines 24-29:
```javascript
// OLD (INSECURE)
if (process.env.NODE_ENV === 'production' || process.env.DB_SSL === 'true') {
  poolConfig.ssl = {
    rejectUnauthorized: false  // ❌ DANGEROUS!
  };
}
```

With:
```javascript
// NEW (SECURE)
if (process.env.NODE_ENV === 'production' || process.env.DB_SSL === 'true') {
  poolConfig.ssl = {
    rejectUnauthorized: true,
    ca: process.env.DB_SSL_CA ? fs.readFileSync(process.env.DB_SSL_CA) : undefined,
    key: process.env.DB_SSL_KEY ? fs.readFileSync(process.env.DB_SSL_KEY) : undefined,
    cert: process.env.DB_SSL_CERT ? fs.readFileSync(process.env.DB_SSL_CERT) : undefined
  };
}
```

Add import at top:
```javascript
import fs from 'fs';
```

#### Step 3: Update Environment Variables

**File:** `backend/.env`

Add:
```env
# Database SSL Configuration
DB_SSL=true
DB_SSL_CA=/path/to/ca-certificate.crt
DB_SSL_KEY=/path/to/client-key.key
DB_SSL_CERT=/path/to/client-cert.crt
```

**File:** `backend/.env.example`

Update:
```env
# Database SSL (REQUIRED IN PRODUCTION!)
DB_SSL=false
DB_SSL_CA=
DB_SSL_KEY=
DB_SSL_CERT=
```

#### Step 4: Test

```bash
npm run dev

# You should see successful database connection
# If SSL fails, check certificate paths
```

---

## Fix 2: CSRF Protection (30 minutes)

### Problem
No CSRF token validation → vulnerable to cross-site request forgery

### Solution

#### Step 1: Install Dependencies

```bash
cd backend
npm install csurf cookie-parser
```

#### Step 2: Update Server Configuration

**File:** `backend/src/server.js`

Add imports after line 13:
```javascript
import cookieParser from 'cookie-parser';
import csrf from 'csurf';
```

Add middleware after CORS (around line 40):
```javascript
// Cookie parser (required for CSRF)
app.use(cookieParser());

// CSRF Protection
const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  }
});

// Apply CSRF to all API routes except auth callbacks
app.use('/api/v1/*', (req, res, next) => {
  // Skip CSRF for Clerk webhooks
  if (req.path.includes('/webhooks/')) {
    return next();
  }
  csrfProtection(req, res, next);
});

// CSRF Token Endpoint
app.get('/api/v1/csrf-token', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});
```

#### Step 3: Update Frontend API Client

**File:** `frontend/src/services/api.js`

Add after apiClient creation (around line 20):
```javascript
// Fetch CSRF token on app start
let csrfToken = null;

export const initializeCSRF = async () => {
  try {
    const response = await apiClient.get('/csrf-token');
    csrfToken = response.data.csrfToken;

    // Add CSRF token to all requests
    apiClient.defaults.headers.common['X-CSRF-Token'] = csrfToken;
  } catch (error) {
    console.error('Failed to fetch CSRF token:', error);
  }
};

// Refresh CSRF token periodically (every 30 minutes)
setInterval(initializeCSRF, 30 * 60 * 1000);
```

**File:** `frontend/src/main.jsx`

Add before ReactDOM.render (around line 20):
```javascript
import { initializeCSRF } from './services/api';

// Initialize CSRF protection
initializeCSRF();
```

#### Step 4: Test

```bash
# Start backend
cd backend && npm run dev

# Start frontend
cd frontend && npm run dev

# Test CSRF endpoint
curl http://localhost:5000/api/v1/csrf-token

# Should return: {"csrfToken":"..."}
```

---

## Fix 3: Fødselsnummer Modulo 11 Validation (15 minutes)

### Problem
Current validation only checks format, not checksum

**File:** `backend/src/utils/encryption.js:129`
```javascript
// TODO: Implement full checksum validation (Modulo 11 algorithm)
```

### Solution

#### Step 1: Add Checksum Validation Function

**File:** `backend/src/utils/encryption.js`

Add after line 133 (after current validateFodselsnummer):
```javascript
/**
 * Validate fødselsnummer checksum using Modulo 11 algorithm
 * @param {string} fodselsnummer - 11-digit Norwegian ID
 * @returns {boolean} - True if checksum is valid
 */
export function validateFodselsnummerChecksum(fodselsnummer) {
  if (!fodselsnummer || fodselsnummer.length !== 11) {
    return false;
  }

  // Weights for first control digit
  const weights1 = [3, 7, 6, 1, 8, 9, 4, 5, 2];
  // Weights for second control digit
  const weights2 = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];

  const digits = fodselsnummer.split('').map(Number);

  // Calculate first control digit
  const sum1 = digits.slice(0, 9).reduce((sum, digit, i) =>
    sum + digit * weights1[i], 0
  );
  let checksum1 = 11 - (sum1 % 11);
  if (checksum1 === 11) checksum1 = 0;
  if (checksum1 === 10) return false; // Invalid

  // Calculate second control digit
  const sum2 = digits.slice(0, 10).reduce((sum, digit, i) =>
    sum + digit * weights2[i], 0
  );
  let checksum2 = 11 - (sum2 % 11);
  if (checksum2 === 11) checksum2 = 0;
  if (checksum2 === 10) return false; // Invalid

  // Validate both checksums
  return digits[9] === checksum1 && digits[10] === checksum2;
}
```

#### Step 2: Update Main Validation Function

Replace the current `validateFodselsnummer` function (lines 108-133):
```javascript
export function validateFodselsnummer(fodselsnummer) {
  if (!fodselsnummer) return false;

  // Remove spaces and hyphens
  const cleaned = fodselsnummer.replace(/[\s-]/g, '');

  // Must be 11 digits
  if (!/^\d{11}$/.test(cleaned)) return false;

  // Validate date portion (DDMMYY)
  const day = parseInt(cleaned.substring(0, 2));
  const month = parseInt(cleaned.substring(2, 4));
  const year = parseInt(cleaned.substring(4, 6));

  if (day < 1 || day > 31) return false;
  if (month < 1 || month > 12) return false;

  // Validate Modulo 11 checksum
  if (!validateFodselsnummerChecksum(cleaned)) return false;

  return true;
}
```

#### Step 3: Test

Create test file (optional but recommended):
```javascript
// Quick test in Node.js REPL
import { validateFodselsnummer } from './src/utils/encryption.js';

// Valid fødselsnummer (test data)
console.log(validateFodselsnummer('15057512345')); // Should validate checksum

// Invalid checksum
console.log(validateFodselsnummer('15057512346')); // Should return false
```

---

## Fix 4: Backup Scripts (1 hour)

### Problem
No automated backups → risk of total data loss

### Solution

#### Step 1: Create Backup Script

**File:** `backend/scripts/backup-database.sh`

```bash
#!/bin/bash
set -e

# Configuration
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="${BACKUP_DIR:-/backups/postgresql}"
RETENTION_DAYS=${RETENTION_DAYS:-3650}  # 10 years for GDPR compliance

# Database credentials from environment
DB_HOST="${DB_HOST:-postgres}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-postgres}"
DB_NAME="${DB_NAME:-chiroclickcrm}"

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR"

echo "=========================================="
echo "ChiroClick CRM Database Backup"
echo "=========================================="
echo "Date: $(date)"
echo "Database: $DB_NAME"
echo "Backup Directory: $BACKUP_DIR"
echo "=========================================="

# Create backup
echo "Creating backup..."
BACKUP_FILE="$BACKUP_DIR/backup_${TIMESTAMP}.sql"
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -F p -f "$BACKUP_FILE"

if [ $? -eq 0 ]; then
  echo "✅ Backup created: $BACKUP_FILE"
else
  echo "❌ Backup failed!"
  exit 1
fi

# Compress backup
echo "Compressing backup..."
gzip "$BACKUP_FILE"
BACKUP_FILE="${BACKUP_FILE}.gz"
echo "✅ Backup compressed: $BACKUP_FILE"

# Encrypt backup (optional but recommended for GDPR)
if [ -n "$BACKUP_ENCRYPTION_KEY" ]; then
  echo "Encrypting backup..."
  openssl enc -aes-256-cbc -salt -pbkdf2 \
    -in "$BACKUP_FILE" \
    -out "${BACKUP_FILE}.enc" \
    -k "$BACKUP_ENCRYPTION_KEY"

  if [ $? -eq 0 ]; then
    rm "$BACKUP_FILE"  # Remove unencrypted backup
    BACKUP_FILE="${BACKUP_FILE}.enc"
    echo "✅ Backup encrypted: $BACKUP_FILE"
  else
    echo "⚠️  Encryption failed, keeping unencrypted backup"
  fi
fi

# Calculate backup size
BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "Backup size: $BACKUP_SIZE"

# Upload to cloud storage (optional)
if [ -n "$S3_BUCKET" ]; then
  echo "Uploading to S3..."
  aws s3 cp "$BACKUP_FILE" "s3://$S3_BUCKET/backups/$(basename $BACKUP_FILE)"
  echo "✅ Backup uploaded to S3"
fi

# Delete old backups (keep 10 years)
echo "Cleaning old backups (retention: $RETENTION_DAYS days)..."
find "$BACKUP_DIR" -type f -name "backup_*.sql.gz*" -mtime +$RETENTION_DAYS -delete
echo "✅ Old backups cleaned"

# Create backup manifest
MANIFEST_FILE="$BACKUP_DIR/manifest.log"
echo "$TIMESTAMP|$BACKUP_FILE|$BACKUP_SIZE|SUCCESS" >> "$MANIFEST_FILE"

echo "=========================================="
echo "✅ Backup completed successfully!"
echo "=========================================="
```

Make executable:
```bash
chmod +x backend/scripts/backup-database.sh
```

#### Step 2: Create Restore Script

**File:** `backend/scripts/restore-database.sh`

```bash
#!/bin/bash
set -e

if [ -z "$1" ]; then
  echo "Usage: ./restore-database.sh <backup-file>"
  echo "Example: ./restore-database.sh /backups/postgresql/backup_20251120_120000.sql.gz.enc"
  exit 1
fi

BACKUP_FILE="$1"
DB_HOST="${DB_HOST:-postgres}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-postgres}"
DB_NAME="${DB_NAME:-chiroclickcrm}"

echo "=========================================="
echo "ChiroClick CRM Database Restore"
echo "=========================================="
echo "⚠️  WARNING: This will OVERWRITE the current database!"
echo "Backup file: $BACKUP_FILE"
read -p "Are you sure? (type 'YES' to confirm): " CONFIRM

if [ "$CONFIRM" != "YES" ]; then
  echo "Restore cancelled."
  exit 0
fi

# Decrypt if needed
if [[ "$BACKUP_FILE" == *.enc ]]; then
  echo "Decrypting backup..."
  DECRYPTED_FILE="${BACKUP_FILE%.enc}"
  openssl enc -aes-256-cbc -d -pbkdf2 \
    -in "$BACKUP_FILE" \
    -out "$DECRYPTED_FILE" \
    -k "$BACKUP_ENCRYPTION_KEY"
  BACKUP_FILE="$DECRYPTED_FILE"
fi

# Decompress if needed
if [[ "$BACKUP_FILE" == *.gz ]]; then
  echo "Decompressing backup..."
  gunzip -k "$BACKUP_FILE"
  BACKUP_FILE="${BACKUP_FILE%.gz}"
fi

# Drop existing database and recreate
echo "Dropping existing database..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -c "DROP DATABASE IF EXISTS $DB_NAME;"
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -c "CREATE DATABASE $DB_NAME;"

# Restore backup
echo "Restoring backup..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$BACKUP_FILE"

echo "=========================================="
echo "✅ Restore completed successfully!"
echo "=========================================="
```

Make executable:
```bash
chmod +x backend/scripts/restore-database.sh
```

#### Step 3: Add to Docker Compose

**File:** `docker-compose.yml`

Add service after line 190:
```yaml
  backup:
    image: postgres:15-alpine
    container_name: chiroclickcrm-backup
    depends_on:
      - postgres
    volumes:
      - ./backend/scripts:/scripts
      - ./backups:/backups
    environment:
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_USER=${DB_USER}
      - DB_NAME=${DB_NAME}
      - PGPASSWORD=${DB_PASSWORD}
      - BACKUP_DIR=/backups/postgresql
      - RETENTION_DAYS=3650
      - BACKUP_ENCRYPTION_KEY=${BACKUP_ENCRYPTION_KEY}
      - S3_BUCKET=${S3_BUCKET:-}
    command: >
      sh -c "apk add --no-cache aws-cli &&
             while true; do
               /scripts/backup-database.sh
               sleep 86400
             done"
    profiles: ["production"]
    networks:
      - chiroclickcrm-network
```

Add volume:
```yaml
volumes:
  postgres_data:
  redis_data:
  backend_logs:
  backend_temp:
  backups:  # Add this
```

#### Step 4: Update Environment Variables

**File:** `backend/.env`

Add:
```env
# Backup Configuration
BACKUP_ENCRYPTION_KEY=your-secure-backup-encryption-key-min-32-chars
S3_BUCKET=your-s3-bucket-name
```

#### Step 5: Test Backup

```bash
# Manual backup test
docker-compose run --rm backup /scripts/backup-database.sh

# Check backup created
ls -lh backups/postgresql/

# Test restore (use test database!)
docker-compose run --rm backup /scripts/restore-database.sh /backups/postgresql/backup_XXXXXX.sql.gz.enc
```

---

## Fix 5: ESLint & Prettier Configuration (15 minutes)

### Problem
Code quality tools installed but not configured

### Solution

#### Step 1: Backend Configuration

**File:** `backend/.eslintrc.js`

```javascript
export default {
  env: {
    node: true,
    es2021: true,
    jest: true
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  rules: {
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-unused-vars': ['error', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_'
    }],
    'prefer-const': 'error',
    'no-var': 'error',
    'eqeqeq': ['error', 'always'],
    'curly': ['error', 'all'],
    'brace-style': ['error', '1tbs'],
    'no-throw-literal': 'error',
    'prefer-promise-reject-errors': 'error'
  }
};
```

**File:** `backend/.prettierrc.json`

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

**File:** `backend/.prettierignore`

```
node_modules
dist
build
coverage
*.log
.env
.env.local
```

#### Step 2: Frontend Configuration

**File:** `frontend/.eslintrc.js`

```javascript
export default {
  env: {
    browser: true,
    es2021: true
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    }
  },
  plugins: ['react', 'react-hooks'],
  rules: {
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-unused-vars': ['error', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_'
    }],
    'prefer-const': 'error',
    'no-var': 'error',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn'
  },
  settings: {
    react: {
      version: 'detect'
    }
  }
};
```

**File:** `frontend/.prettierrc.json`

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "always",
  "jsxSingleQuote": false,
  "jsxBracketSameLine": false
}
```

#### Step 3: Update package.json Scripts

**Backend:**
```json
{
  "scripts": {
    "lint": "eslint src/**/*.js",
    "lint:fix": "eslint src/**/*.js --fix",
    "format": "prettier --write \"src/**/*.js\"",
    "format:check": "prettier --check \"src/**/*.js\""
  }
}
```

**Frontend:**
```json
{
  "scripts": {
    "lint": "eslint src/**/*.{js,jsx}",
    "lint:fix": "eslint src/**/*.{js,jsx} --fix",
    "format": "prettier --write \"src/**/*.{js,jsx,json,css}\"",
    "format:check": "prettier --check \"src/**/*.{js,jsx,json,css}\""
  }
}
```

#### Step 4: Run Linter

```bash
# Backend
cd backend
npm run lint:fix
npm run format

# Frontend
cd frontend
npm run lint:fix
npm run format
```

---

## Final Step: Commit & Push

```bash
git add .
git commit -m "fix: Implement critical security improvements

- Fix database SSL configuration with proper certificate validation
- Add CSRF protection for all state-changing operations
- Complete fødselsnummer Modulo 11 checksum validation
- Implement automated backup scripts with encryption
- Configure ESLint and Prettier for code quality

BREAKING CHANGE: Database SSL now requires valid certificates in production.
Set DB_SSL_CA, DB_SSL_KEY, and DB_SSL_CERT environment variables."

git push -u origin claude/review-security-improvements-01XuJfMnYrGYBJNh87MvW8No
```

---

## Verification Checklist

After implementing all fixes, verify:

### SSL Configuration
```bash
# Check SSL connection
psql "postgresql://user:pass@host:5432/db?sslmode=require"
```

### CSRF Protection
```bash
# Get CSRF token
curl http://localhost:5000/api/v1/csrf-token

# Try request without token (should fail)
curl -X POST http://localhost:5000/api/v1/patients -d '{"name":"test"}'
```

### Fødselsnummer Validation
```javascript
// Test in Node.js
import { validateFodselsnummer } from './backend/src/utils/encryption.js';
console.log(validateFodselsnummer('15057512345')); // Should validate checksum
```

### Backup
```bash
# Run manual backup
docker-compose run --rm backup /scripts/backup-database.sh

# Check backup exists
ls -lh backups/postgresql/
```

### Linting
```bash
# Should show no errors
cd backend && npm run lint
cd frontend && npm run lint
```

---

## Next Steps (After Today)

Once critical fixes are done, continue with:

1. **Week 1 Remaining:**
   - Write encryption tests
   - Write GDPR tests
   - Write authentication tests

2. **Week 2:**
   - Add database indexes
   - Integrate Redis caching
   - Setup CI/CD pipeline

3. **Week 3:**
   - Setup monitoring (Prometheus/Grafana)
   - Add error tracking (Sentry)
   - Create API documentation

---

**Total Time:** 2.5 hours
**Impact:** Prevents 5 critical security vulnerabilities
**Next Review:** Tomorrow (verify all fixes are working)
