# ChiroClickCRM Deployment Runbook

## Table of Contents
1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Environment Setup](#environment-setup)
3. [Database Migration](#database-migration)
4. [Azure Deployment](#azure-deployment)
5. [Health Checks](#health-checks)
6. [Rollback Procedure](#rollback-procedure)
7. [Monitoring](#monitoring)
8. [Disaster Recovery](#disaster-recovery)
9. [Troubleshooting](#troubleshooting)

---

## Pre-Deployment Checklist

### Code Quality
- [ ] All tests passing (`npm test` in backend and frontend)
- [ ] Code coverage ≥ 70%
- [ ] Linting passes without errors
- [ ] Security audit passes (`npm audit`)
- [ ] No console.log statements in code

### Configuration
- [ ] Environment variables documented
- [ ] Secrets rotated (database passwords, API keys)
- [ ] DNS records configured
- [ ] SSL certificates valid

### Database
- [ ] Migrations tested in staging
- [ ] Backup created before migration
- [ ] Rollback scripts prepared

### Compliance
- [ ] GDPR compliance verified
- [ ] Normen self-declaration completed
- [ ] Data residency confirmed (Azure Norway)
- [ ] Audit logging enabled

---

## Environment Setup

### Required Environment Variables

#### Backend (.env)

```bash
# Server
NODE_ENV=production
PORT=3000
API_URL=https://api.chiroclickcrm.no

# Database
DATABASE_URL=postgresql://user:password@host:5432/chiroclickcrm
DB_SSL=true
DATABASE_POOL_MIN=5
DATABASE_POOL_MAX=20

# Authentication (Clerk.com)
CLERK_SECRET_KEY=sk_live_...
CLERK_PUBLISHABLE_KEY=pk_live_...

# Encryption (32 characters exactly)
ENCRYPTION_KEY=<your-32-character-encryption-key>
ENCRYPTION_ALGORITHM=aes-256-cbc

# Redis (Optional but recommended)
REDIS_URL=redis://user:password@redis-host:6379

# Monitoring
SENTRY_DSN=https://...@sentry.io/...
SENTRY_TRACES_SAMPLE_RATE=0.1
SENTRY_PROFILES_SAMPLE_RATE=0.1

# Email
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=<sendgrid-api-key>

# SMS (Telnyx)
TELNYX_API_KEY=<telnyx-api-key>
TELNYX_PHONE_NUMBER=+4712345678

# Feature Flags
ENABLE_FHIR_API=false
ENABLE_TELEHEALTH=false
ENABLE_PATIENT_PORTAL=false
```

#### Frontend (.env)

```bash
# API
VITE_API_URL=https://api.chiroclickcrm.no/api/v1

# Authentication
VITE_CLERK_PUBLISHABLE_KEY=pk_live_...

# Features
VITE_ENABLE_ANALYTICS=true
VITE_SENTRY_DSN=https://...@sentry.io/...
```

### Azure App Service Configuration

```bash
# App Service Settings
az webapp config appsettings set \
  --resource-group chiroclickcrm-prod \
  --name chiroclickcrm-api \
  --settings \
    NODE_ENV=production \
    DATABASE_URL="<connection-string>" \
    CLERK_SECRET_KEY="<secret>" \
    ...
```

---

## Database Migration

### Step 1: Create Backup

```bash
# SSH into database server or use Azure CLI
az postgres server backup create \
  --resource-group chiroclickcrm-prod \
  --server-name chiroclickcrm-db \
  --name pre-migration-backup-$(date +%Y%m%d-%H%M%S)

# Or manual backup
pg_dump -h <host> -U <user> -d chiroclickcrm > backup-$(date +%Y%m%d).sql
```

### Step 2: Run Migrations

```bash
# Connect to production database
psql -h <production-db-host> -U <user> -d chiroclickcrm

# Run schema migration
\i database/schema.sql

# Run strategic enhancements migration
\i database/migrations/003_strategic_enhancements.sql

# Seed reference data
\i database/seeds/01_icpc2_codes.sql
\i database/seeds/02_takster_codes.sql

# Verify migration
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

# Exit
\q
```

### Step 3: Verify Data Integrity

```sql
-- Check table counts
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
  (SELECT count(*) FROM information_schema.columns WHERE table_schema = schemaname AND table_name = tablename) AS columns
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Verify critical tables have data
SELECT count(*) as patients FROM patients;
SELECT count(*) as encounters FROM clinical_encounters;
SELECT count(*) as organizations FROM organizations;
```

---

## Azure Deployment

### Architecture

```
┌────────────────────────────────────────────────────┐
│  Azure Front Door (CDN + WAF)                     │
│  - SSL Termination                                 │
│  - DDoS Protection                                 │
└────────────┬───────────────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────────────┐
│  Azure App Service (Norway East)                   │
│  - Node.js Backend API                             │
│  - Auto-scaling: 2-10 instances                    │
│  - Health check: /health                           │
└────────────┬───────────────────────────────────────┘
             │
             ├─────────────────────────────┐
             ▼                             ▼
┌──────────────────────────┐   ┌──────────────────────────┐
│  Azure Database for      │   │  Azure Cache for Redis   │
│  PostgreSQL 15           │   │  - Session storage       │
│  - Flexible Server       │   │  - API caching           │
│  - Zone redundant        │   └──────────────────────────┘
│  - Daily backups         │
│  - Customer-managed keys │
└──────────────────────────┘
             │
             ▼
┌──────────────────────────┐
│  Azure Key Vault         │
│  - Encryption keys       │
│  - Secrets management    │
└──────────────────────────┘
```

### Step 1: Create Resource Group

```bash
az group create \
  --name chiroclickcrm-prod \
  --location norwayeast
```

### Step 2: Deploy PostgreSQL

```bash
az postgres flexible-server create \
  --resource-group chiroclickcrm-prod \
  --name chiroclickcrm-db \
  --location norwayeast \
  --admin-user dbadmin \
  --admin-password '<secure-password>' \
  --sku-name Standard_D4s_v3 \
  --tier GeneralPurpose \
  --version 15 \
  --storage-size 128 \
  --backup-retention 30 \
  --geo-redundant-backup Disabled \
  --zone 1

# Enable customer-managed keys
az postgres flexible-server key create \
  --server-name chiroclickcrm-db \
  --resource-group chiroclickcrm-prod \
  --key-identifier https://chiroclickcrm-kv.vault.azure.net/keys/postgres-key/...
```

### Step 3: Deploy Redis

```bash
az redis create \
  --resource-group chiroclickcrm-prod \
  --name chiroclickcrm-redis \
  --location norwayeast \
  --sku Premium \
  --vm-size P1 \
  --zones 1 \
  --minimum-tls-version 1.2
```

### Step 4: Deploy Backend API

```bash
# Create App Service Plan
az appservice plan create \
  --name chiroclickcrm-plan \
  --resource-group chiroclickcrm-prod \
  --location norwayeast \
  --sku P1V2 \
  --is-linux \
  --number-of-workers 2

# Create Web App
az webapp create \
  --resource-group chiroclickcrm-prod \
  --plan chiroclickcrm-plan \
  --name chiroclickcrm-api \
  --runtime "NODE:18-lts"

# Configure deployment from GitHub
az webapp deployment source config \
  --name chiroclickcrm-api \
  --resource-group chiroclickcrm-prod \
  --repo-url https://github.com/your-org/chiroclickcrm \
  --branch main \
  --manual-integration

# Enable health check
az webapp config set \
  --resource-group chiroclickcrm-prod \
  --name chiroclickcrm-api \
  --health-check-path "/health"

# Enable logging
az webapp log config \
  --resource-group chiroclickcrm-prod \
  --name chiroclickcrm-api \
  --application-logging filesystem \
  --web-server-logging filesystem

# Set environment variables (from .env)
az webapp config appsettings set \
  --resource-group chiroclickcrm-prod \
  --name chiroclickcrm-api \
  --settings @appsettings.json
```

### Step 5: Deploy Frontend (Static Web App)

```bash
# Build frontend
cd frontend
npm run build

# Deploy to Azure Static Web Apps
az staticwebapp create \
  --name chiroclickcrm-frontend \
  --resource-group chiroclickcrm-prod \
  --location norwayeast \
  --source https://github.com/your-org/chiroclickcrm \
  --branch main \
  --app-location "/frontend" \
  --output-location "/dist"
```

---

## Health Checks

### Automated Health Monitoring

```bash
# Check API health
curl https://api.chiroclickcrm.no/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2025-01-15T10:00:00Z",
  "uptime": 3600,
  "services": {
    "database": {
      "status": "healthy",
      "responseTime": 45
    },
    "redis": {
      "status": "healthy",
      "responseTime": 5
    }
  },
  "system": {
    "memory": {
      "used": 512,
      "total": 2048,
      "unit": "MB"
    }
  }
}
```

### Kubernetes Probes (if using AKS)

```yaml
livenessProbe:
  httpGet:
    path: /health/live
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /health/ready
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 5
```

---

## Rollback Procedure

### Step 1: Identify Issue

```bash
# Check application logs
az webapp log tail \
  --resource-group chiroclickcrm-prod \
  --name chiroclickcrm-api

# Check error rate in Sentry
# https://sentry.io/organizations/chiroclickcrm/issues/
```

### Step 2: Rollback Application

```bash
# List deployment history
az webapp deployment list \
  --resource-group chiroclickcrm-prod \
  --name chiroclickcrm-api

# Rollback to previous deployment
az webapp deployment slot swap \
  --resource-group chiroclickcrm-prod \
  --name chiroclickcrm-api \
  --slot staging \
  --target-slot production \
  --action swap
```

### Step 3: Rollback Database (if needed)

```bash
# Restore from backup
az postgres flexible-server restore \
  --resource-group chiroclickcrm-prod \
  --name chiroclickcrm-db-restored \
  --source-server chiroclickcrm-db \
  --restore-time "2025-01-15T09:00:00Z"

# Update connection string to point to restored database
az webapp config connection-string set \
  --resource-group chiroclickcrm-prod \
  --name chiroclickcrm-api \
  --connection-string-type PostgreSQL \
  --settings DefaultConnection="<restored-db-connection-string>"
```

### Step 4: Verify Rollback

```bash
# Test critical endpoints
curl -X POST https://api.chiroclickcrm.no/api/v1/patients/search \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Organization-Id: $ORG_ID" \
  -d '{"q": "test"}'

# Check error rate returned to normal
# Monitor Sentry dashboard
```

---

## Monitoring

### Sentry Configuration

```javascript
// backend/src/server.js
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  beforeSend(event) {
    // Scrub sensitive data
    if (event.request) {
      delete event.request.cookies;
      delete event.request.headers.authorization;
    }
    return event;
  }
});
```

### Key Metrics to Monitor

| Metric | Threshold | Action |
|--------|-----------|--------|
| Error Rate | > 1% | Alert on-call engineer |
| Response Time (p95) | > 2000ms | Investigate slow queries |
| Database CPU | > 80% | Scale up database |
| Memory Usage | > 90% | Restart or scale app instances |
| Failed Login Attempts | > 10/min | Potential brute force attack |

### Azure Monitor Alerts

```bash
# Create alert for high error rate
az monitor metrics alert create \
  --name high-error-rate \
  --resource-group chiroclickcrm-prod \
  --scopes /subscriptions/.../chiroclickcrm-api \
  --condition "avg Http5xx > 10" \
  --window-size 5m \
  --evaluation-frequency 1m \
  --action-group chiroclickcrm-oncall
```

---

## Disaster Recovery

### Backup Strategy

#### Database Backups
- **Frequency:** Daily automated backups
- **Retention:** 30 days
- **Location:** Azure Backup Vault (Norway East)
- **Recovery Time Objective (RTO):** 4 hours
- **Recovery Point Objective (RPO):** 24 hours

#### Application Backups
- **Source Code:** Git repository (GitHub)
- **Configuration:** Azure Key Vault
- **Media Files:** Azure Blob Storage (GRS)

### Recovery Procedure

#### Scenario 1: Database Corruption

```bash
# 1. Stop application to prevent further writes
az webapp stop \
  --resource-group chiroclickcrm-prod \
  --name chiroclickcrm-api

# 2. Restore database from backup
az postgres flexible-server restore \
  --resource-group chiroclickcrm-prod \
  --name chiroclickcrm-db-restored \
  --source-server chiroclickcrm-db \
  --restore-time "2025-01-15T06:00:00Z"

# 3. Update connection string
az webapp config connection-string set \
  --resource-group chiroclickcrm-prod \
  --name chiroclickcrm-api \
  --settings DefaultConnection="<new-connection-string>"

# 4. Restart application
az webapp start \
  --resource-group chiroclickcrm-prod \
  --name chiroclickcrm-api

# 5. Verify health
curl https://api.chiroclickcrm.no/health
```

#### Scenario 2: Regional Outage (Norway East Down)

```bash
# 1. Promote failover database (if configured)
az postgres flexible-server geo-restore \
  --resource-group chiroclickcrm-westeurope \
  --name chiroclickcrm-db-failover \
  --source-server chiroclickcrm-db

# 2. Update DNS to point to West Europe region
az network traffic-manager endpoint update \
  --resource-group chiroclickcrm-prod \
  --profile-name chiroclickcrm-tm \
  --name norwayeast \
  --type azureEndpoints \
  --endpoint-status Disabled

# 3. Monitor recovery
# ETA: Regional outages typically resolve within 2-4 hours
```

---

## Troubleshooting

### Common Issues

#### Issue: Database Connection Failures

**Symptoms:**
```
Error: connect ETIMEDOUT
```

**Diagnosis:**
```bash
# Check database server status
az postgres flexible-server show \
  --resource-group chiroclickcrm-prod \
  --name chiroclickcrm-db

# Check firewall rules
az postgres flexible-server firewall-rule list \
  --resource-group chiroclickcrm-prod \
  --server-name chiroclickcrm-db
```

**Solution:**
```bash
# Add App Service IPs to firewall
az postgres flexible-server firewall-rule create \
  --resource-group chiroclickcrm-prod \
  --server-name chiroclickcrm-db \
  --name allow-app-service \
  --start-ip-address <app-service-outbound-ip> \
  --end-ip-address <app-service-outbound-ip>
```

#### Issue: High Memory Usage

**Diagnosis:**
```bash
# Check app metrics
az monitor metrics list \
  --resource /subscriptions/.../chiroclickcrm-api \
  --metric MemoryWorkingSet \
  --start-time 2025-01-15T00:00:00Z \
  --end-time 2025-01-15T23:59:59Z
```

**Solution:**
```bash
# Restart app instances
az webapp restart \
  --resource-group chiroclickcrm-prod \
  --name chiroclickcrm-api

# If persistent, scale up
az appservice plan update \
  --name chiroclickcrm-plan \
  --resource-group chiroclickcrm-prod \
  --sku P2V2
```

#### Issue: Slow API Responses

**Diagnosis:**
```bash
# Check database query performance
psql -h <host> -U <user> -d chiroclickcrm -c "
SELECT
  substring(query, 1, 50) as query,
  mean_exec_time,
  calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
"
```

**Solution:**
```sql
-- Add missing indexes (use query optimizer tool)
CREATE INDEX idx_encounters_patient_date
  ON clinical_encounters(patient_id, encounter_date DESC);
```

---

## Post-Deployment Verification

### Smoke Tests

```bash
#!/bin/bash
# smoke-test.sh

API_URL="https://api.chiroclickcrm.no/api/v1"
TOKEN="<test-token>"
ORG_ID="<test-org-id>"

# Test 1: Health check
echo "Testing health endpoint..."
curl -f "$API_URL/../health" || exit 1

# Test 2: List patients
echo "Testing patients endpoint..."
curl -f -H "Authorization: Bearer $TOKEN" \
     -H "X-Organization-Id: $ORG_ID" \
     "$API_URL/patients" || exit 1

# Test 3: Create encounter
echo "Testing encounter creation..."
curl -f -X POST \
     -H "Authorization: Bearer $TOKEN" \
     -H "X-Organization-Id: $ORG_ID" \
     -H "Content-Type: application/json" \
     -d '{"patient_id":"test","encounter_date":"2025-01-15T10:00:00Z","chief_complaint":"test"}' \
     "$API_URL/encounters" || exit 1

echo "All smoke tests passed!"
```

---

## Emergency Contacts

| Role | Contact | Availability |
|------|---------|--------------|
| On-Call Engineer | +47 xxx xxxxx | 24/7 |
| Database Admin | dba@chiroclickcrm.no | Business hours |
| Security Officer | security@chiroclickcrm.no | 24/7 |
| Compliance Officer | compliance@chiroclickcrm.no | Business hours |

---

## Maintenance Windows

- **Scheduled:** Every Sunday 02:00-04:00 CET
- **Duration:** Max 2 hours
- **Notification:** 7 days advance notice to clients

---

**Document Version:** 2.0
**Last Updated:** 2025-01-15
**Next Review:** 2025-04-15
