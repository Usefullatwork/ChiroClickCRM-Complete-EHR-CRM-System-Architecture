# ChiroClickCRM Database Setup Guide

This guide provides comprehensive instructions for setting up the ChiroClickCRM database.

## Prerequisites

### Required Software

| Software | Minimum Version | Recommended Version | Purpose |
|----------|-----------------|---------------------|---------|
| PostgreSQL | 14.0 | 15.x or 16.x | Primary database |
| Node.js | 18.0 | 20.x LTS | Backend runtime |
| npm | 9.0 | 10.x | Package manager |

### Verify Installation

```bash
# Check PostgreSQL version
psql --version
# Expected: psql (PostgreSQL) 14.x or higher

# Check Node.js version
node --version
# Expected: v18.x or higher

# Check npm version
npm --version
# Expected: 9.x or higher
```

### PostgreSQL Service

Ensure PostgreSQL service is running:

**Windows:**
```cmd
# Check service status
sc query postgresql-x64-16

# Start service if not running
net start postgresql-x64-16
```

**macOS:**
```bash
# Using Homebrew
brew services start postgresql@16

# Check status
brew services list
```

**Linux (Ubuntu/Debian):**
```bash
# Check status
sudo systemctl status postgresql

# Start service
sudo systemctl start postgresql
```

---

## Environment Variables

Create a `.env` file in the project root with the following database configuration:

```env
# Database Configuration
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=chiroclickcrm
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password

# Connection URL (alternative format)
DATABASE_URL=postgresql://postgres:your_secure_password@localhost:5432/chiroclickcrm

# Optional: Connection pool settings
DB_POOL_MIN=2
DB_POOL_MAX=10
```

### Environment Variable Reference

| Variable | Default | Description |
|----------|---------|-------------|
| `POSTGRES_HOST` | localhost | Database server hostname |
| `POSTGRES_PORT` | 5432 | Database server port |
| `POSTGRES_DB` | chiroclickcrm | Database name |
| `POSTGRES_USER` | postgres | Database user |
| `POSTGRES_PASSWORD` | - | Database password (required) |
| `DATABASE_URL` | - | Full connection string (alternative) |

---

## Step-by-Step Setup Instructions

### Option 1: Automated Setup (Recommended)

**Windows:**
```cmd
cd F:\ChiroClickCRM-Complete-EHR-CRM-System-Architecture
scripts\setup-database.bat
```

**Unix/Linux/macOS:**
```bash
cd /path/to/ChiroClickCRM-Complete-EHR-CRM-System-Architecture
chmod +x scripts/setup-database.sh
./scripts/setup-database.sh
```

The automated script will:
1. Check if the database exists (prompt to recreate if it does)
2. Create the `chiroclickcrm` database
3. Run the main schema (`database/schema.sql`)
4. Run all migrations in order
5. Run seed files to populate initial data

### Option 2: Manual Setup

#### 1. Create the Database

```bash
# Connect as postgres superuser
psql -U postgres

# Create the database
CREATE DATABASE chiroclickcrm;

# Exit psql
\q
```

#### 2. Run the Schema

```bash
psql -U postgres -d chiroclickcrm -f database/schema.sql
```

#### 3. Run Migrations

Migrations should be run in numerical order:

```bash
# Database migrations
psql -U postgres -d chiroclickcrm -f database/migrations/002_add_patient_crm_fields.sql
psql -U postgres -d chiroclickcrm -f database/migrations/002_neurological_exam.sql
psql -U postgres -d chiroclickcrm -f database/migrations/003_add_clinical_templates.sql
# ... continue for all migration files

# Backend migrations
psql -U postgres -d chiroclickcrm -f backend/migrations/008_clinical_templates.sql
psql -U postgres -d chiroclickcrm -f backend/migrations/009_ai_feedback_system.sql
# ... continue for all migration files
```

#### 4. Run Seeds

```bash
psql -U postgres -d chiroclickcrm -f database/seeds/01_icpc2_codes.sql
psql -U postgres -d chiroclickcrm -f database/seeds/02_takster_codes.sql
psql -U postgres -d chiroclickcrm -f database/seeds/03_orthopedic_templates.sql
psql -U postgres -d chiroclickcrm -f database/seeds/04_clinical_phrases.sql
psql -U postgres -d chiroclickcrm -f database/seeds/05_evidence_based_enhancements.sql
```

### Option 3: Using Docker

```bash
# Start PostgreSQL container
docker-compose up -d postgres

# Run migrations using the backend service
docker-compose exec backend npm run db:migrate
```

---

## Running Migrations

### Using npm Scripts

If configured in `package.json`:

```bash
# Run all pending migrations
npm run db:migrate

# Rollback last migration
npm run db:rollback

# Reset database (caution: deletes all data)
npm run db:reset
```

### Using the Migration Runner

The project includes a JavaScript migration runner:

```bash
node database/migrations/run.js
```

### Manual Migration

To run a single migration:

```bash
psql -U postgres -d chiroclickcrm -f backend/migrations/018_examination_clusters.sql
```

---

## Verifying Setup

### 1. List All Tables

```bash
psql -U postgres -d chiroclickcrm -c "\dt"
```

Expected output should include tables like:
- `patients`
- `appointments`
- `clinical_encounters`
- `clinical_templates`
- `users`
- `audit_logs`
- And many more...

### 2. Check Table Count

```bash
psql -U postgres -d chiroclickcrm -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"
```

### 3. Verify Seed Data

```bash
# Check ICPC-2 codes
psql -U postgres -d chiroclickcrm -c "SELECT COUNT(*) FROM icpc2_codes;"

# Check clinical templates
psql -U postgres -d chiroclickcrm -c "SELECT COUNT(*) FROM clinical_templates;"
```

### 4. Test Connection from Application

```bash
# Start the backend
cd backend
npm run dev

# Check logs for successful database connection
```

---

## Troubleshooting

### Common Issues

#### 1. "createdb: command not found"

**Problem:** PostgreSQL bin directory is not in PATH.

**Solution:**

Windows:
```cmd
set PATH=%PATH%;C:\Program Files\PostgreSQL\16\bin
```

macOS/Linux:
```bash
export PATH=$PATH:/usr/local/pgsql/bin
# Or add to ~/.bashrc or ~/.zshrc
```

#### 2. "psql: FATAL: password authentication failed"

**Problem:** Incorrect password or pg_hba.conf configuration.

**Solutions:**
1. Check your password in `.env` file
2. Edit `pg_hba.conf` to use `trust` for local connections (development only):
   ```
   # IPv4 local connections:
   host    all    all    127.0.0.1/32    trust
   ```
3. Restart PostgreSQL after changes

#### 3. "psql: FATAL: database 'chiroclickcrm' does not exist"

**Problem:** Database was not created.

**Solution:**
```bash
createdb -U postgres chiroclickcrm
```

#### 4. "ERROR: relation already exists"

**Problem:** Migration or schema was run twice.

**Solutions:**
1. Drop and recreate the database:
   ```bash
   dropdb -U postgres chiroclickcrm
   createdb -U postgres chiroclickcrm
   ```
2. Or skip the problematic migration if data exists

#### 5. "ERROR: permission denied for table"

**Problem:** Current user lacks permissions.

**Solution:**
```sql
-- Connect as superuser
psql -U postgres -d chiroclickcrm

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_user;
```

#### 6. "Connection refused" or "Could not connect to server"

**Problem:** PostgreSQL service is not running.

**Solutions:**

Windows:
```cmd
net start postgresql-x64-16
```

macOS:
```bash
brew services start postgresql@16
```

Linux:
```bash
sudo systemctl start postgresql
```

#### 7. Port Already in Use

**Problem:** Another process is using port 5432.

**Solutions:**
1. Find and stop the process:
   ```bash
   # Linux/macOS
   lsof -i :5432

   # Windows
   netstat -ano | findstr :5432
   ```
2. Or change the port in PostgreSQL configuration and `.env`

### Getting Help

If you encounter issues not covered here:

1. Check PostgreSQL logs:
   - Windows: `C:\Program Files\PostgreSQL\16\data\log\`
   - Linux: `/var/log/postgresql/`
   - macOS: `/usr/local/var/log/postgresql/`

2. Enable verbose output:
   ```bash
   psql -U postgres -d chiroclickcrm -f migration.sql -v ON_ERROR_STOP=1
   ```

3. Check the project's GitHub Issues or documentation

---

## Database Backup and Restore

### Backup

```bash
# Full backup
pg_dump -U postgres -d chiroclickcrm > backup_$(date +%Y%m%d).sql

# Or use the project's backup script
./scripts/backup-database.sh
```

### Restore

```bash
# Restore from backup
psql -U postgres -d chiroclickcrm < backup_20250103.sql

# Or use the project's restore script
./scripts/restore-database.sh backup_20250103.sql
```

---

## Production Considerations

1. **Never use default passwords** - Generate strong, unique passwords
2. **Enable SSL/TLS** - Configure PostgreSQL for encrypted connections
3. **Regular backups** - Set up automated daily backups
4. **Connection pooling** - Use PgBouncer for production workloads
5. **Monitoring** - Set up database monitoring and alerts
6. **Access control** - Use role-based access with minimum required privileges

---

## Quick Reference

```bash
# Connect to database
psql -U postgres -d chiroclickcrm

# List tables
\dt

# Describe table
\d table_name

# List users
\du

# Exit
\q
```
