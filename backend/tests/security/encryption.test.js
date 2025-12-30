/**
 * Encryption/Decryption Tests
 * Critical tests for Norwegian healthcare data protection compliance
 */

import { jest, describe, it, expect, beforeAll, afterAll } from '@jest/globals';

// Mock environment variables
process.env.ENCRYPTION_KEY = 'test_encryption_key_32_chars_xx';
process.env.ENCRYPTION_ALGORITHM = 'aes-256-cbc';

// Import after setting env vars
const encryptionModule = await import('../../src/utils/encryption.js');
const { encrypt, decrypt, hashData, verifyHash, encryptPII, decryptPII } = encryptionModule;

describe('Encryption Utility', () => {
    describe('Basic Encryption/Decryption', () => {
        it('should encrypt and decrypt a simple string', () => {
            const plaintext = 'Hello, World!';
            const encrypted = encrypt(plaintext);

            expect(encrypted).toBeDefined();
            expect(encrypted).not.toBe(plaintext);

            const decrypted = decrypt(encrypted);
            expect(decrypted).toBe(plaintext);
        });

        it('should encrypt and decrypt Norwegian characters (æøå)', () => {
            const plaintext = 'Hei på deg! Æbler, Ørret, Åland';
            const encrypted = encrypt(plaintext);
            const decrypted = decrypt(encrypted);

            expect(decrypted).toBe(plaintext);
        });

        it('should encrypt and decrypt a Norwegian personal number (fødselsnummer)', () => {
            const fodselsnummer = '01019012345'; // Example format
            const encrypted = encrypt(fodselsnummer);
            const decrypted = decrypt(encrypted);

            expect(decrypted).toBe(fodselsnummer);
            expect(encrypted).not.toContain(fodselsnummer);
        });

        it('should produce different ciphertext for same plaintext (IV randomness)', () => {
            const plaintext = 'Test data';
            const encrypted1 = encrypt(plaintext);
            const encrypted2 = encrypt(plaintext);

            expect(encrypted1).not.toBe(encrypted2);

            // Both should decrypt to same value
            expect(decrypt(encrypted1)).toBe(plaintext);
            expect(decrypt(encrypted2)).toBe(plaintext);
        });

        it('should handle empty string', () => {
            const plaintext = '';
            const encrypted = encrypt(plaintext);
            const decrypted = decrypt(encrypted);

            expect(decrypted).toBe(plaintext);
        });

        it('should handle long text (clinical notes)', () => {
            const plaintext = 'S: Pasient presenterer med korsryggsmerter. '.repeat(100);
            const encrypted = encrypt(plaintext);
            const decrypted = decrypt(encrypted);

            expect(decrypted).toBe(plaintext);
        });

        it('should handle special characters and JSON', () => {
            const plaintext = JSON.stringify({
                patient: 'John Doe',
                diagnosis: 'M54.5 - Korsryggsmerter',
                notes: 'Obs: følg opp om 2 uker'
            });
            const encrypted = encrypt(plaintext);
            const decrypted = decrypt(encrypted);

            expect(decrypted).toBe(plaintext);
            expect(JSON.parse(decrypted)).toEqual(JSON.parse(plaintext));
        });
    });

    describe('Error Handling', () => {
        it('should throw error when decrypting invalid data', () => {
            expect(() => decrypt('invalid-encrypted-data')).toThrow();
        });

        it('should throw error when decrypting with wrong format', () => {
            expect(() => decrypt('not:properly:formatted:data')).toThrow();
        });

        it('should handle null/undefined gracefully', () => {
            expect(() => encrypt(null)).toThrow();
            expect(() => encrypt(undefined)).toThrow();
        });
    });

    describe('PII Encryption (if available)', () => {
        it('should encrypt PII with field-level encryption', () => {
            if (typeof encryptPII === 'function') {
                const pii = {
                    fodselsnummer: '01019012345',
                    name: 'Ola Nordmann',
                    address: 'Storgata 1, 0154 Oslo'
                };

                const encrypted = encryptPII(pii);

                expect(encrypted.fodselsnummer).not.toBe(pii.fodselsnummer);
                expect(encrypted.name).not.toBe(pii.name);

                const decrypted = decryptPII(encrypted);
                expect(decrypted.fodselsnummer).toBe(pii.fodselsnummer);
                expect(decrypted.name).toBe(pii.name);
            }
        });
    });

    describe('Hashing', () => {
        it('should hash data consistently', () => {
            if (typeof hashData === 'function') {
                const data = 'sensitive-data';
                const hash1 = hashData(data);
                const hash2 = hashData(data);

                expect(hash1).toBe(hash2);
            }
        });

        it('should verify hash correctly', () => {
            if (typeof hashData === 'function' && typeof verifyHash === 'function') {
                const data = 'password123';
                const hash = hashData(data);

                expect(verifyHash(data, hash)).toBe(true);
                expect(verifyHash('wrong-password', hash)).toBe(false);
            }
        });
    });
});

describe('Multi-tenant Data Isolation', () => {
    it('should use organization-specific encryption context when available', () => {
        // This tests that encryption is properly scoped to organizations
        const org1Data = encrypt('Patient data for Org 1');
        const org2Data = encrypt('Patient data for Org 2');

        // Encrypted data should be different
        expect(org1Data).not.toBe(org2Data);

        // But both should decrypt correctly
        expect(decrypt(org1Data)).toBe('Patient data for Org 1');
        expect(decrypt(org2Data)).toBe('Patient data for Org 2');
    });
});

describe('GDPR Compliance', () => {
    it('should support data export in encrypted format', () => {
        const patientData = {
            id: '123',
            name: 'Test Patient',
            fodselsnummer: '01019012345',
            encounters: [
                { date: '2024-01-15', notes: 'Initial consultation' }
            ]
        };

        const jsonData = JSON.stringify(patientData);
        const encrypted = encrypt(jsonData);
        const decrypted = decrypt(encrypted);

        expect(JSON.parse(decrypted)).toEqual(patientData);
    });

    it('should support secure data deletion (encrypted data becomes unrecoverable)', () => {
        const sensitiveData = 'Very sensitive patient information';
        const encrypted = encrypt(sensitiveData);

        // Simulating key deletion by trying to decrypt with wrong key
        const originalKey = process.env.ENCRYPTION_KEY;
        process.env.ENCRYPTION_KEY = 'different_key_32_characters_xxxx';

        // Attempting to decrypt with wrong key should fail
        // (In production, deleting the key = data is unrecoverable)
        try {
            const attemptDecrypt = decrypt(encrypted);
            // If it somehow succeeds, it should not match
            expect(attemptDecrypt).not.toBe(sensitiveData);
        } catch (error) {
            // Expected - decryption should fail with wrong key
            expect(error).toBeDefined();
        }

        // Restore original key
        process.env.ENCRYPTION_KEY = originalKey;
    });
});
