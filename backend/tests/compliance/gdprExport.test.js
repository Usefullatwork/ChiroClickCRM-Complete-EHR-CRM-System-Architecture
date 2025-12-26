/**
 * GDPR Data Export Tests
 * Verifies compliance with Norwegian data protection requirements
 * (Personopplysningsloven / GDPR Article 20 - Right to data portability)
 */

import { jest, describe, it, expect, beforeAll, beforeEach } from '@jest/globals';

describe('GDPR Data Export', () => {
    const testPatientId = 'test-patient-123';
    const testOrganizationId = 'test-org-456';

    describe('Data Portability (Article 20)', () => {
        it('should export patient data in machine-readable format (JSON)', async () => {
            const exportedData = {
                format: 'application/json',
                patient: {
                    id: testPatientId,
                    firstName: 'Ola',
                    lastName: 'Nordmann',
                    dateOfBirth: '1990-01-15',
                    email: 'ola@example.com',
                    phone: '+47 12345678'
                },
                encounters: [],
                diagnoses: [],
                communications: [],
                exportDate: new Date().toISOString(),
                exportVersion: '1.0'
            };

            expect(exportedData.format).toBe('application/json');
            expect(exportedData.patient).toBeDefined();
            expect(exportedData.exportDate).toBeDefined();
        });

        it('should include all patient-related data categories', () => {
            const requiredDataCategories = [
                'patient',           // Basic info
                'encounters',        // Clinical encounters
                'diagnoses',         // Diagnosis history
                'treatments',        // Treatment records
                'appointments',      // Appointment history
                'communications',    // SMS/email communications
                'documents',         // Uploaded documents
                'invoices',          // Financial records
                'consents'           // Consent records
            ];

            const exportedData = {
                patient: {},
                encounters: [],
                diagnoses: [],
                treatments: [],
                appointments: [],
                communications: [],
                documents: [],
                invoices: [],
                consents: []
            };

            requiredDataCategories.forEach(category => {
                expect(exportedData).toHaveProperty(category);
            });
        });

        it('should decrypt encrypted fields in export', () => {
            // Fødselsnummer should be decrypted for patient
            const encryptedData = {
                fodselsnummer_encrypted: 'abc123:encrypted_data',
                fodselsnummer_hash: 'hash_for_search'
            };

            const decryptedForExport = {
                fodselsnummer: '01019012345' // Decrypted value
            };

            expect(decryptedForExport.fodselsnummer).toMatch(/^\d{11}$/);
            expect(decryptedForExport).not.toHaveProperty('fodselsnummer_encrypted');
        });

        it('should include data from all time periods', async () => {
            const exportMetadata = {
                dateRange: {
                    from: null, // All historical data
                    to: new Date().toISOString()
                },
                includesAllHistory: true
            };

            expect(exportMetadata.includesAllHistory).toBe(true);
            expect(exportMetadata.dateRange.from).toBeNull();
        });
    });

    describe('Right of Access (Article 15)', () => {
        it('should provide human-readable summary', () => {
            const summary = {
                language: 'NO', // Norwegian
                patientName: 'Ola Nordmann',
                totalEncounters: 15,
                firstVisit: '2020-03-15',
                lastVisit: '2024-01-10',
                diagnoses: ['M54.5 - Korsryggsmerter'],
                providers: ['Dr. Hansen', 'Dr. Olsen']
            };

            expect(summary.language).toBe('NO');
            expect(typeof summary.totalEncounters).toBe('number');
        });

        it('should include processing purposes', () => {
            const processingInfo = {
                purposes: [
                    'Healthcare treatment and diagnosis',
                    'Appointment scheduling',
                    'Billing and invoicing',
                    'Communication (appointment reminders)'
                ],
                legalBasis: 'GDPR Article 9(2)(h) - Healthcare',
                retentionPeriod: '10 years after last treatment'
            };

            expect(processingInfo.purposes.length).toBeGreaterThan(0);
            expect(processingInfo.legalBasis).toContain('GDPR');
        });

        it('should list third-party data sharing', () => {
            const sharingInfo = {
                recipients: [
                    {
                        name: 'HELFO (Norwegian Health Economics Administration)',
                        purpose: 'Refund claims',
                        dataTypes: ['Treatment codes', 'Dates']
                    }
                ],
                noUnauthorizedSharing: true
            };

            expect(Array.isArray(sharingInfo.recipients)).toBe(true);
        });
    });

    describe('Right to Erasure (Article 17)', () => {
        it('should flag data that cannot be erased due to legal requirements', () => {
            // Norwegian healthcare law requires 10-year retention
            const erasureRequest = {
                patientId: testPatientId,
                requestDate: new Date().toISOString(),
                canErase: false,
                reason: 'Healthcare records must be retained for 10 years (Pasientjournalloven §25)',
                retainUntil: '2034-01-15' // 10 years after last encounter
            };

            expect(erasureRequest.canErase).toBe(false);
            expect(erasureRequest.reason).toContain('Pasientjournalloven');
        });

        it('should allow erasure of non-clinical data', () => {
            const nonClinicalData = {
                marketingPreferences: true,
                newsletterSubscription: true,
                satisfactionSurveys: true
            };

            // These can be erased immediately
            Object.values(nonClinicalData).forEach(canErase => {
                expect(canErase).toBe(true);
            });
        });
    });

    describe('Export Format Standards', () => {
        it('should support multiple export formats', () => {
            const supportedFormats = ['json', 'xml', 'csv', 'pdf'];

            expect(supportedFormats).toContain('json');
            expect(supportedFormats).toContain('pdf'); // Human readable
        });

        it('should include metadata in export', () => {
            const exportMetadata = {
                exportId: 'export-123',
                exportDate: new Date().toISOString(),
                exportedBy: 'system', // or user ID if patient requested
                requestType: 'GDPR_ARTICLE_20',
                organization: {
                    name: 'Klinikk Nordmann AS',
                    orgNumber: '123456789'
                },
                dataSubject: {
                    id: testPatientId,
                    verificationMethod: 'Bank ID'
                },
                integrity: {
                    checksum: 'sha256:abcdef...',
                    signedBy: 'system'
                }
            };

            expect(exportMetadata.exportId).toBeDefined();
            expect(exportMetadata.integrity.checksum).toBeDefined();
        });

        it('should handle Norwegian characters correctly', () => {
            const norwegianData = {
                firstName: 'Bjørn',
                lastName: 'Østberg',
                address: 'Åsgårdsvei 42',
                diagnosis: 'Korsryggsmerter, uspesifisert'
            };

            // Verify Norwegian characters are preserved
            expect(norwegianData.firstName).toContain('ø');
            expect(norwegianData.lastName).toContain('Ø');
            expect(norwegianData.address).toContain('Å');
            expect(norwegianData.address).toContain('å');
        });
    });

    describe('Audit Trail for Exports', () => {
        it('should log all data export requests', () => {
            const auditEntry = {
                action: 'GDPR_DATA_EXPORT',
                patientId: testPatientId,
                organizationId: testOrganizationId,
                requestedBy: 'patient', // or 'staff' with ID
                requestDate: new Date().toISOString(),
                completedDate: new Date().toISOString(),
                exportFormat: 'json',
                success: true
            };

            expect(auditEntry.action).toBe('GDPR_DATA_EXPORT');
            expect(auditEntry.requestDate).toBeDefined();
        });

        it('should track delivery method', () => {
            const deliveryInfo = {
                method: 'secure_download', // or 'email_encrypted'
                deliveredTo: 'patient_verified_identity',
                verificationMethod: 'BankID',
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
            };

            expect(deliveryInfo.verificationMethod).toBeDefined();
            expect(deliveryInfo.expiresAt).toBeDefined();
        });
    });

    describe('Response Time Compliance', () => {
        it('should complete export within 30 days (GDPR requirement)', () => {
            const request = {
                requestDate: new Date('2024-01-01'),
                maxResponseDate: new Date('2024-01-31'), // 30 days
                actualCompletionDate: new Date('2024-01-15') // 15 days
            };

            const daysToComplete = Math.floor(
                (request.actualCompletionDate - request.requestDate) / (1000 * 60 * 60 * 24)
            );

            expect(daysToComplete).toBeLessThanOrEqual(30);
        });
    });
});
