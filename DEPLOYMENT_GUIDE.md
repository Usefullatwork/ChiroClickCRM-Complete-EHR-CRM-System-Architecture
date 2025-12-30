# ChiroClickCRM - Production Deployment Guide

## 🚀 Quick Start: Critical Implementations

This guide covers deploying the enhanced ChiroClickCRM system with all critical security, performance, and compliance features.

---

## 📋 Prerequisites

### System Requirements

```bash
# Required
- Node.js 18+ or 20+
- PostgreSQL 14+ or 15+
- Redis 7+ (for caching)
- Hashicorp Vault OR AWS Secrets Manager (for production)

# Optional but Recommended
- Docker & Docker Compose
- Nginx (reverse proxy)
- PM2 (process manager)
- Let's Encrypt (SSL certificates)
```

### Environment Setup

```bash
# Clone repository
git clone <your-repo-url>
cd ChiroClickCRM-Complete-EHR-CRM-System-Architecture

# Install dependencies
cd backend
npm install

cd ../frontend
npm install
```

---

## 🔐 Step 1: Secure Key Management Setup

### Option A: Hashicorp Vault (Recommended)

```bash
# 1. Install Vault
wget https://releases.hashicorp.com/vault/1.15.0/vault_1.15.0_linux_amd64.zip
unzip vault_1.15.0_linux_amd64.zip
sudo mv vault /usr/local/bin/

# 2. Create Vault config
cat > /etc/vault/config.hcl << 'EOF'
storage "file" {
  path = "/var/vault/data"
}

listener "tcp" {
  address = "127.0.0.1:8200"
  tls_disable = 1  # Use TLS in production!
}

ui = true
EOF

# 3. Start Vault
vault server -config=/etc/vault/config.hcl &

# 4. Initialize Vault (SAVE THE KEYS!)
export VAULT_ADDR='http://127.0.0.1:8200'
vault operator init

# 5. Unseal Vault (use keys from step 4)
vault operator unseal <key1>
vault operator unseal <key2>
vault operator unseal <key3>

# 6. Login with root token
vault login <root-token>

# 7. Store secrets
vault kv put secret/chiroclickcrm \
  encryption_key="$(openssl rand -hex 32)" \
  jwt_access_secret="$(openssl rand -hex 32)" \
  jwt_refresh_secret="$(openssl rand -hex 32)"

vault kv put secret/chiroclickcrm/database \
  host="localhost" \
  port="5432" \
  database="chiroclickcrm" \
  user="chiroclickcrm_user" \
  password="YOUR_SECURE_PASSWORD"
```

### Option B: AWS Secrets Manager

```bash
# Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Configure AWS
aws configure

# Create secrets
aws secretsmanager create-secret \
  --name chiroclickcrm/encryption \
  --secret-string '{
    "encryption_key": "'$(openssl rand -hex 32)'",
    "jwt_access_secret": "'$(openssl rand -hex 32)'",
    "jwt_refresh_secret": "'$(openssl rand -hex 32)'"
  }'

aws secretsmanager create-secret \
  --name chiroclickcrm/database \
  --secret-string '{
    "host": "your-rds-endpoint.amazonaws.com",
    "port": "5432",
    "database": "chiroclickcrm",
    "user": "chiroclickcrm_user",
    "password": "YOUR_SECURE_PASSWORD"
  }'
```

### Environment Variables

Create `.env` file:

```env
# Environment
NODE_ENV=production

# Secret Provider
SECRET_PROVIDER=vault  # or 'aws' or 'azure'
VAULT_ADDR=http://127.0.0.1:8200
VAULT_TOKEN=your-vault-token

# OR for AWS
# AWS_REGION=eu-north-1

# Database (only needed if not using Vault)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=chiroclickcrm
DB_USER=chiroclickcrm_user
DB_PASSWORD=your_password

# Database Pool
DB_POOL_MAX=20
DB_POOL_MIN=5
DB_STATEMENT_TIMEOUT=30000
DB_CONNECTION_TIMEOUT=5000

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# Read Replica (optional)
DB_READ_REPLICA_HOST=your-replica-host
DB_READ_REPLICA_PORT=5432
```

---

## 💾 Step 2: Database Setup

### 2.1 Create Database

```bash
# Create PostgreSQL user and database
sudo -u postgres psql << EOF
CREATE USER chiroclickcrm_user WITH PASSWORD 'your_secure_password';
CREATE DATABASE chiroclickcrm OWNER chiroclickcrm_user;
GRANT ALL PRIVILEGES ON DATABASE chiroclickcrm TO chiroclickcrm_user;

-- Connect to database
\c chiroclickcrm

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For full-text search

-- Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO chiroclickcrm_user;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO chiroclickcrm_user;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO chiroclickcrm_user;
EOF
```

### 2.2 Run Migrations

```bash
# Run all migrations in order
cd backend

# Base schema (if you have it)
psql -U chiroclickcrm_user -d chiroclickcrm < migrations/001_initial_schema.sql

# Critical new migrations
psql -U chiroclickcrm_user -d chiroclickcrm < migrations/011_audit_logging.sql
psql -U chiroclickcrm_user -d chiroclickcrm < migrations/012_ai_feedback_system.sql
psql -U chiroclickcrm_user -d chiroclickcrm < migrations/013_clinical_notes_versioning.sql
psql -U chiroclickcrm_user -d chiroclickcrm < migrations/014_template_quality_governance.sql
psql -U chiroclickcrm_user -d chiroclickcrm < migrations/015_performance_indexes.sql

# Verify migrations
psql -U chiroclickcrm_user -d chiroclickcrm -c "\dt"
```

### 2.3 Configure WAL Archiving

Edit `/etc/postgresql/15/main/postgresql.conf`:

```conf
# WAL Archiving for Point-in-Time Recovery
wal_level = replica
archive_mode = on
archive_command = 'test ! -f /var/lib/postgresql/wal_archive/%f && cp %p /var/lib/postgresql/wal_archive/%f'
archive_timeout = 3600  # Archive every hour

# WAL Retention
wal_keep_size = 1GB
max_wal_senders = 3

# Performance
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 16MB
maintenance_work_mem = 128MB
```

Restart PostgreSQL:

```bash
sudo systemctl restart postgresql
```

---

## 🔴 Step 3: Setup Automated Backups

### 3.1 Configure Backup Script

```bash
# Edit backup script
vim scripts/backup-database.sh

# Set these variables:
# BACKUP_DIR="/var/backups/chiroclickcrm"
# DB_NAME="chiroclickcrm"
# DB_USER="chiroclickcrm_user"
# DB_PASSWORD (will use .pgpass or PGPASSWORD)

# Create .pgpass for passwordless backups
cat > ~/.pgpass << EOF
localhost:5432:chiroclickcrm:chiroclickcrm_user:your_password
EOF
chmod 600 ~/.pgpass

# Test backup manually
./scripts/backup-database.sh
```

### 3.2 Setup Cron Job

```bash
# Edit crontab
crontab -e

# Add these lines:
# Daily backup at 2 AM
0 2 * * * /home/user/ChiroClickCRM-Complete-EHR-CRM-System-Architecture/scripts/backup-database.sh

# Weekly vacuum at 3 AM on Sunday
0 3 * * 0 psql -U chiroclickcrm_user -d chiroclickcrm -c "VACUUM ANALYZE;"

# Daily AI metrics update at 4 AM
0 4 * * * psql -U chiroclickcrm_user -d chiroclickcrm -c "SELECT update_daily_ai_metrics();"
```

### 3.3 Setup Cloud Backup (Optional)

```bash
# For S3
aws s3 mb s3://chiroclickcrm-backups

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket chiroclickcrm-backups \
  --versioning-configuration Status=Enabled

# Update backup script
export CLOUD_ENABLED=true
export CLOUD_PROVIDER=s3
export CLOUD_BUCKET=chiroclickcrm-backups
```

---

## ⚡ Step 4: Redis Setup

### 4.1 Install Redis

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install redis-server

# Configure Redis
sudo vim /etc/redis/redis.conf

# Set:
# bind 127.0.0.1
# requirepass your_redis_password
# maxmemory 256mb
# maxmemory-policy allkeys-lru

# Restart
sudo systemctl restart redis
sudo systemctl enable redis
```

### 4.2 Test Redis

```bash
redis-cli
AUTH your_redis_password
PING  # Should return PONG
SET test "Hello"
GET test
EXIT
```

---

## 🏗️ Step 5: Application Setup

### 5.1 Install Dependencies

```bash
cd backend

# Install production dependencies
npm install --production

# Install additional required packages
npm install node-vault ioredis @aws-sdk/client-secrets-manager
```

### 5.2 Initialize Application

Create `backend/server.js` (or update existing):

```javascript
import express from 'express';
import { initializeSecrets } from './src/config/vault.js';
import { initializeDatabase, closeDatabase } from './src/config/database-enhanced.js';
import { redis, closeRedis } from './src/config/redis.js';

const app = express();

// Middleware
app.use(express.json());

// Health check endpoint
app.get('/health', async (req, res) => {
  const dbHealth = await healthCheck();
  const redisHealth = redis.status === 'ready';

  res.json({
    status: dbHealth.healthy && redisHealth ? 'healthy' : 'unhealthy',
    database: dbHealth,
    redis: { connected: redisHealth },
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown
const shutdown = async () => {
  console.log('🛑 Shutting down gracefully...');
  await closeDatabase();
  await closeRedis();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start server
const start = async () => {
  try {
    // 1. Initialize secrets
    await initializeSecrets();

    // 2. Initialize database
    await initializeDatabase();

    // 3. Start server
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

start();
```

---

## 🧪 Step 6: Testing

### 6.1 Test Database Versioning

```bash
# Test versioning trigger
psql -U chiroclickcrm_user -d chiroclickcrm << EOF
-- Create test encounter
INSERT INTO clinical_encounters (id, patient_id, practitioner_id, encounter_date, subjective)
VALUES (gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), NOW(), 'Test subjective');

-- Update it (should create version)
UPDATE clinical_encounters
SET subjective = 'Updated subjective'
WHERE subjective = 'Test subjective';

-- Check versions
SELECT * FROM clinical_encounter_versions LIMIT 5;
EOF
```

### 6.2 Test Audit Logging

```javascript
// In your code
import { logAction, ACTION_TYPES } from './services/auditLog.js';

await logAction(ACTION_TYPES.PATIENT_READ, userId, {
  resourceType: 'patient',
  resourceId: patientId,
  ipAddress: req.ip,
  userAgent: req.headers['user-agent']
});

// Check audit log
const audit = await query('SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 5');
console.log(audit.rows);
```

### 6.3 Test Redis Caching

```javascript
import { cache, cachePatient } from './config/redis.js';

// Cache a patient
await cachePatient.set(patientId, patientData);

// Retrieve from cache
const cached = await cachePatient.get(patientId);

// Invalidate
await cachePatient.invalidate(patientId);
```

### 6.4 Test Clinical Validation

```javascript
import { validateClinicalContent } from './services/clinicalValidation.js';

const validation = await validateClinicalContent('Pasient har cauda equina symptomer', {
  subjective: 'Plutselig ryggsmerte med bilateral bensvakhet'
});

console.log('Has red flags:', validation.hasRedFlags);
console.log('Warnings:', validation.warnings);
```

---

## 📊 Step 7: Monitoring Setup

### 7.1 Database Monitoring Queries

```sql
-- Check index usage
SELECT * FROM index_usage_stats ORDER BY scans DESC LIMIT 10;

-- Find unused indexes
SELECT * FROM unused_indexes;

-- Check slow queries
SELECT * FROM pg_stat_statements
WHERE mean_exec_time > 1000
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Active connections
SELECT COUNT(*) FROM pg_stat_activity WHERE datname = 'chiroclickcrm';

-- Database size
SELECT pg_size_pretty(pg_database_size('chiroclickcrm'));
```

### 7.2 Application Monitoring

```javascript
// Add to your app
app.get('/metrics', async (req, res) => {
  const dbStats = getPoolStats();
  const cacheStats = await getCacheStats();
  const activeQueries = await getActiveQueries();

  res.json({
    database: {
      pool: dbStats,
      activeQueries: activeQueries.length
    },
    cache: cacheStats,
    timestamp: new Date().toISOString()
  });
});
```

---

## 🚦 Step 8: Production Deployment

### 8.1 Using PM2

```bash
# Install PM2
npm install -g pm2

# Create ecosystem file
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'chiroclickcrm-api',
    script: './server.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
EOF

# Start app
pm2 start ecosystem.config.js

# Setup startup script
pm2 startup
pm2 save

# Monitor
pm2 monit
```

### 8.2 Using Docker

```dockerfile
# Dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - SECRET_PROVIDER=vault
      - VAULT_ADDR=http://vault:8200
    depends_on:
      - postgres
      - redis
      - vault

  postgres:
    image: postgres:15-alpine
    volumes:
      - pgdata:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: chiroclickcrm
      POSTGRES_USER: chiroclickcrm_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}

  vault:
    image: vault:latest
    cap_add:
      - IPC_LOCK
    volumes:
      - vault-data:/vault/data

volumes:
  pgdata:
  vault-data:
```

---

## 📚 Step 9: Documentation & Training

### Update API Documentation

```bash
# Install Swagger
npm install swagger-jsdoc swagger-ui-express

# Add to server.js
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ChiroClickCRM API',
      version: '1.0.0',
      description: 'Norwegian Chiropractic EHR/CRM System'
    },
    servers: [{ url: 'http://localhost:3000' }]
  },
  apis: ['./src/routes/*.js']
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
```

---

## ✅ Deployment Checklist

- [ ] Vault/AWS Secrets Manager configured
- [ ] Database migrations run successfully
- [ ] WAL archiving enabled
- [ ] Backup script tested and scheduled
- [ ] Redis installed and configured
- [ ] All environment variables set
- [ ] Dependencies installed
- [ ] Application starts without errors
- [ ] Health check endpoint working
- [ ] Audit logging tested
- [ ] Clinical validation working
- [ ] Template quality scoring functional
- [ ] Monitoring endpoints accessible
- [ ] PM2/Docker deployment configured
- [ ] SSL certificates installed (nginx)
- [ ] Firewall rules configured
- [ ] Backup restore tested
- [ ] Team trained on new features

---

## 🆘 Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check connections
psql -U chiroclickcrm_user -d chiroclickcrm -c "SELECT count(*) FROM pg_stat_activity;"

# Kill stuck queries
psql -U chiroclickcrm_user -d chiroclickcrm -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle in transaction';"
```

### Redis Connection Issues

```bash
# Check Redis
redis-cli ping
redis-cli INFO

# Clear cache if needed
redis-cli FLUSHDB
```

### Vault Issues

```bash
# Check Vault status
vault status

# Unseal if needed
vault operator unseal

# List secrets
vault kv list secret/chiroclickcrm
```

---

## 📞 Support

- Documentation: See IMPLEMENTATION_GUIDE.md
- Issues: Create GitHub issue
- Email: support@chiroclickcrm.no

---

**Last Updated:** 2025-11-19
**Version:** 2.0.0
