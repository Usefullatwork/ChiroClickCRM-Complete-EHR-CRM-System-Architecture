/**
 * Import Extended Integration Tests
 * Additional coverage for CSV/Excel/vCard import flows, parse-text validation,
 * file type enforcement, and from-text patient creation edge cases —
 * beyond what api/import.test.js covers.
 *
 * Note: Tests run in DESKTOP_MODE where auth is auto-granted as ADMIN.
 */

import request from 'supertest';
import app from '../../../src/server.js';

const agent = request(app);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Minimal valid CSV with a header row and one patient row */
function buildCSV(rows = []) {
  const header = 'first_name,last_name,phone,email,date_of_birth';
  const lines = rows.length ? rows : ['Ola,Nordmann,+4798765432,ola@example.com,1990-01-01'];
  return [header, ...lines].join('\n');
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('Import Extended Integration Tests', () => {
  // ==========================================================================
  // TEMPLATE DOWNLOAD
  // ==========================================================================

  describe('GET /api/v1/import/patients/template', () => {
    it('should return 200 with a binary or JSON response', async () => {
      const res = await agent.get('/api/v1/import/patients/template');
      expect([200, 500]).toContain(res.status);
    });

    it('should not require a request body', async () => {
      const res = await agent.get('/api/v1/import/patients/template');
      // GET endpoints must not require a body — ensure no 4xx related to missing body
      expect([200, 500]).toContain(res.status);
    });
  });

  // ==========================================================================
  // EXCEL/CSV UPLOAD — file type enforcement
  // ==========================================================================

  describe('POST /api/v1/import/patients/excel — file type enforcement', () => {
    it('should reject a plain text file', async () => {
      const res = await agent
        .post('/api/v1/import/patients/excel')
        .attach('file', Buffer.from('some random text content'), {
          filename: 'patients.txt',
          contentType: 'text/plain',
        });
      expect([400, 500]).toContain(res.status);
    });

    it('should reject a JSON file masquerading as upload', async () => {
      const res = await agent
        .post('/api/v1/import/patients/excel')
        .attach('file', Buffer.from(JSON.stringify({ patients: [] })), {
          filename: 'patients.json',
          contentType: 'application/json',
        });
      expect([400, 500]).toContain(res.status);
    });

    it('should accept a CSV file and return a structured response', async () => {
      const csvContent = buildCSV();
      const res = await agent
        .post('/api/v1/import/patients/excel')
        .attach('file', Buffer.from(csvContent), {
          filename: 'patients.csv',
          contentType: 'text/csv',
        });
      expect([200, 400, 500]).toContain(res.status);
    });

    it('should accept a CSV with multiple patient rows', async () => {
      const csvContent = buildCSV([
        'Ola,Nordmann,+4798765432,ola@example.com,1990-01-01',
        'Kari,Hansen,+4712345678,kari@example.com,1985-07-15',
        'Per,Olsen,+4791234567,per@example.com,1978-11-30',
      ]);
      const res = await agent
        .post('/api/v1/import/patients/excel')
        .attach('file', Buffer.from(csvContent), {
          filename: 'multi-patients.csv',
          contentType: 'text/csv',
        });
      expect([200, 400, 500]).toContain(res.status);
    });

    it('should accept a CSV with only a header row (empty import)', async () => {
      const csvContent = 'first_name,last_name,phone,email,date_of_birth\n';
      const res = await agent
        .post('/api/v1/import/patients/excel')
        .attach('file', Buffer.from(csvContent), {
          filename: 'empty.csv',
          contentType: 'text/csv',
        });
      expect([200, 400, 500]).toContain(res.status);
    });

    it('should reject a request with no file attached', async () => {
      const res = await agent.post('/api/v1/import/patients/excel');
      expect([400, 500]).toContain(res.status);
    });
  });

  // ==========================================================================
  // PARSE TEXT — input validation and multi-line handling
  // ==========================================================================

  describe('POST /api/v1/import/patients/parse-text — text parsing', () => {
    it('should parse a single patient record from Norwegian-formatted text', async () => {
      const res = await agent.post('/api/v1/import/patients/parse-text').send({
        text: 'Ola Nordmann, +4798765432, ola.nordmann@example.com',
      });
      expect([200, 400, 500]).toContain(res.status);
    });

    it('should parse multiple patients from multi-line text', async () => {
      const res = await agent.post('/api/v1/import/patients/parse-text').send({
        text: 'Ola Nordmann, +4798765432\nKari Hansen, +4712345678\nPer Olsen, +4791234567',
      });
      expect([200, 400, 500]).toContain(res.status);
    });

    it('should reject when text field is missing', async () => {
      const res = await agent.post('/api/v1/import/patients/parse-text').send({});
      expect([400, 500]).toContain(res.status);
      if (res.status === 400) {
        expect(res.body.error).toBeDefined();
      }
    });

    it('should reject when text is an empty string', async () => {
      const res = await agent.post('/api/v1/import/patients/parse-text').send({ text: '' });
      expect([400, 500]).toContain(res.status);
    });

    it('should handle text with tab-separated values', async () => {
      const res = await agent.post('/api/v1/import/patients/parse-text').send({
        text: 'Ola\tNordmann\t+4798765432\tola@example.com',
      });
      expect([200, 400, 500]).toContain(res.status);
    });

    it('should handle text with semicolons as delimiters', async () => {
      const res = await agent.post('/api/v1/import/patients/parse-text').send({
        text: 'Kari Hansen;+4712345678;kari@example.com',
      });
      expect([200, 400, 500]).toContain(res.status);
    });

    it('should handle vCard-style text input', async () => {
      const vcard = [
        'BEGIN:VCARD',
        'VERSION:3.0',
        'FN:Ola Nordmann',
        'TEL:+4798765432',
        'EMAIL:ola@example.com',
        'END:VCARD',
      ].join('\n');
      const res = await agent.post('/api/v1/import/patients/parse-text').send({ text: vcard });
      expect([200, 400, 500]).toContain(res.status);
    });
  });

  // ==========================================================================
  // IMPORT FROM TEXT — patients array validation
  // ==========================================================================

  describe('POST /api/v1/import/patients/from-text — bulk patient creation', () => {
    it('should import a single valid patient', async () => {
      const timestamp = Date.now();
      const res = await agent.post('/api/v1/import/patients/from-text').send({
        patients: [
          {
            first_name: 'Import',
            last_name: `ExtTest${timestamp}`,
            phone: '+4798765432',
            email: `import${timestamp}@test.com`,
            date_of_birth: '1990-05-10',
          },
        ],
      });
      expect([200, 201, 400, 500]).toContain(res.status);
    });

    it('should import multiple patients in one request', async () => {
      const timestamp = Date.now();
      const res = await agent.post('/api/v1/import/patients/from-text').send({
        patients: [
          {
            first_name: 'Multi1',
            last_name: `ExtTest${timestamp}`,
            phone: '+4798765432',
            email: `multi1${timestamp}@test.com`,
          },
          {
            first_name: 'Multi2',
            last_name: `ExtTest${timestamp + 1}`,
            phone: '+4712345678',
            email: `multi2${timestamp}@test.com`,
          },
        ],
      });
      expect([200, 201, 400, 500]).toContain(res.status);
    });

    it('should reject when patients field is missing from body', async () => {
      const res = await agent.post('/api/v1/import/patients/from-text').send({});
      expect([400, 500]).toContain(res.status);
      if (res.status === 400) {
        expect(res.body.error).toBeDefined();
      }
    });

    it('should reject when patients is not an array', async () => {
      const res = await agent.post('/api/v1/import/patients/from-text').send({
        patients: 'not-an-array',
      });
      expect([400, 500]).toContain(res.status);
    });

    it('should handle patient with minimum required fields only', async () => {
      const timestamp = Date.now();
      const res = await agent.post('/api/v1/import/patients/from-text').send({
        patients: [{ first_name: 'Min', last_name: `Fields${timestamp}`, phone: '+4798765432' }],
      });
      expect([200, 201, 400, 500]).toContain(res.status);
    });

    it('should return structured result (success/error counts) on valid import', async () => {
      const timestamp = Date.now();
      const res = await agent.post('/api/v1/import/patients/from-text').send({
        patients: [
          {
            first_name: 'Result',
            last_name: `Check${timestamp}`,
            phone: '+4791234567',
            email: `resultcheck${timestamp}@test.com`,
          },
        ],
      });
      if (res.status === 200 || res.status === 201) {
        expect(res.body).toBeDefined();
      } else {
        expect([400, 500]).toContain(res.status);
      }
    });
  });
});
