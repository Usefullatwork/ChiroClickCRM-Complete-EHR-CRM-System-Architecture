# Sample Data for ChiroClickCRM

This folder contains sample data files for testing the import features.

## Files

### CSV Import Files

- **patients_import_sample.csv** - Norwegian headers (Fornavn, Etternavn, etc.)
- **patients_import_english.csv** - English headers (First Name, Last Name, etc.)

Both files contain 15-25 sample patients with realistic Norwegian data.

### vCard Import

- **contacts_sample.vcf** - 15 contacts in vCard 3.0 format

## Usage

### Import via UI
1. Go to Settings > Import
2. Select CSV or vCard import
3. Upload the appropriate file
4. Map columns (auto-detected for standard headers)
5. Review and import

### Import via API

```bash
# CSV Import
curl -X POST http://localhost:3000/api/v1/import/patients/csv \
  -H "Authorization: Bearer <token>" \
  -F "file=@sample-data/patients_import_sample.csv" \
  -F "mappings={\"Fornavn\":\"first_name\",\"Etternavn\":\"last_name\"}"

# vCard Import
curl -X POST http://localhost:3000/api/v1/import/patients/vcard \
  -H "Authorization: Bearer <token>" \
  -F "file=@sample-data/contacts_sample.vcf"
```

## Database Seed Data

For larger datasets, use the SQL seed files:

```bash
cd backend
npm run migrate
psql -U postgres -d chiroclickcrm -f seeds/024_crm_seed_data.sql
psql -U postgres -d chiroclickcrm -f seeds/025_extended_patient_data.sql
```

This creates:
- 200+ patients with realistic Norwegian data
- Message templates (SMS/Email)
- Automation workflows
- Sample AI feedback records
- Appointments and follow-ups

## Column Mapping Reference

| Norwegian | English | Database Field |
|-----------|---------|----------------|
| Fornavn | First Name | first_name |
| Etternavn | Last Name | last_name |
| E-post | Email | email |
| Telefon | Phone | phone |
| Fodselsdato | Date of Birth | date_of_birth |
| Kjonn | Gender | gender |
| Adresse | Address | address_street |
| Postnummer | Postal Code | address_postal_code |
| By | City | address_city |
| Hovedproblem | Main Problem | main_problem |
| Status | Status | status |
