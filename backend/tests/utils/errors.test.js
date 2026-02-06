/**
 * Custom Error Classes Tests
 */

import { describe, it, expect } from '@jest/globals';
import {
  AppError,
  NotFoundError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  ConflictError,
  BadRequestError,
  DatabaseError,
  ExternalServiceError,
  RateLimitError,
  BusinessLogicError,
  GDPRError,
} from '../../src/utils/errors.js';

describe('Custom Error Classes', () => {
  describe('AppError', () => {
    it('should create an error with all properties', () => {
      const error = new AppError('Test error', 500, 'TEST_ERROR', { key: 'value' });

      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('TEST_ERROR');
      expect(error.details).toEqual({ key: 'value' });
      expect(error.isOperational).toBe(true);
      expect(error.name).toBe('AppError');
    });

    it('should convert to JSON correctly', () => {
      const error = new AppError('Test error', 400, 'TEST_ERROR', { field: 'email' });
      const json = error.toJSON();

      expect(json).toEqual({
        error: 'AppError',
        code: 'TEST_ERROR',
        message: 'Test error',
        details: { field: 'email' },
      });
    });

    it('should omit details in JSON when not provided', () => {
      const error = new AppError('Test error', 400, 'TEST_ERROR');
      const json = error.toJSON();

      expect(json).toEqual({
        error: 'AppError',
        code: 'TEST_ERROR',
        message: 'Test error',
      });
    });
  });

  describe('NotFoundError', () => {
    it('should create with resource only', () => {
      const error = new NotFoundError('Patient');

      expect(error.message).toBe('Patient not found');
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('RESOURCE_NOT_FOUND');
      expect(error.details).toEqual({ resource: 'Patient', identifier: null });
    });

    it('should create with resource and identifier', () => {
      const error = new NotFoundError('Patient', '123');

      expect(error.message).toBe("Patient with identifier '123' not found");
      expect(error.details).toEqual({ resource: 'Patient', identifier: '123' });
    });
  });

  describe('ValidationError', () => {
    it('should create with message', () => {
      const error = new ValidationError('Invalid email format');

      expect(error.message).toBe('Invalid email format');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('VALIDATION_ERROR');
    });

    it('should create with details', () => {
      const details = { field: 'email', value: 'invalid' };
      const error = new ValidationError('Validation failed', details);

      expect(error.details).toEqual(details);
    });
  });

  describe('AuthenticationError', () => {
    it('should create with default message', () => {
      const error = new AuthenticationError();

      expect(error.message).toBe('Authentication failed');
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe('AUTHENTICATION_ERROR');
    });

    it('should create with custom message', () => {
      const error = new AuthenticationError('Token expired');

      expect(error.message).toBe('Token expired');
    });
  });

  describe('AuthorizationError', () => {
    it('should create with default message', () => {
      const error = new AuthorizationError();

      expect(error.message).toBe('You do not have permission to perform this action');
      expect(error.statusCode).toBe(403);
      expect(error.code).toBe('AUTHORIZATION_ERROR');
    });

    it('should create with custom message', () => {
      const error = new AuthorizationError('Admin access required');

      expect(error.message).toBe('Admin access required');
    });
  });

  describe('ConflictError', () => {
    it('should create with resource, field, and value', () => {
      const error = new ConflictError('Patient', 'email', 'test@example.com');

      expect(error.message).toBe("Patient with email 'test@example.com' already exists");
      expect(error.statusCode).toBe(409);
      expect(error.code).toBe('RESOURCE_CONFLICT');
      expect(error.details).toEqual({
        resource: 'Patient',
        field: 'email',
        value: 'test@example.com',
      });
    });
  });

  describe('BadRequestError', () => {
    it('should create with message', () => {
      const error = new BadRequestError('Invalid request body');

      expect(error.message).toBe('Invalid request body');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('BAD_REQUEST');
    });
  });

  describe('DatabaseError', () => {
    it('should create with message only', () => {
      const error = new DatabaseError('Connection failed');

      expect(error.message).toBe('Connection failed');
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('DATABASE_ERROR');
      expect(error.details).toBeNull();
    });

    it('should create with original error', () => {
      const originalError = new Error('ECONNREFUSED');
      const error = new DatabaseError('Connection failed', originalError);

      expect(error.details).toEqual({ originalError: 'ECONNREFUSED' });
    });
  });

  describe('ExternalServiceError', () => {
    it('should create with service name only', () => {
      const error = new ExternalServiceError('Ollama');

      expect(error.message).toBe("External service 'Ollama' is unavailable");
      expect(error.statusCode).toBe(502);
      expect(error.code).toBe('EXTERNAL_SERVICE_ERROR');
      expect(error.details).toEqual({ service: 'Ollama' });
    });

    it('should create with custom message', () => {
      const error = new ExternalServiceError('Ollama', 'API rate limit exceeded');

      expect(error.message).toBe('API rate limit exceeded');
    });
  });

  describe('RateLimitError', () => {
    it('should create without retry after', () => {
      const error = new RateLimitError();

      expect(error.message).toBe('Too many requests, please try again later');
      expect(error.statusCode).toBe(429);
      expect(error.code).toBe('RATE_LIMIT_EXCEEDED');
      expect(error.details).toBeNull();
    });

    it('should create with retry after', () => {
      const error = new RateLimitError(60);

      expect(error.details).toEqual({ retryAfter: 60 });
    });
  });

  describe('BusinessLogicError', () => {
    it('should create with message', () => {
      const error = new BusinessLogicError('Cannot book appointment in the past');

      expect(error.message).toBe('Cannot book appointment in the past');
      expect(error.statusCode).toBe(422);
      expect(error.code).toBe('BUSINESS_LOGIC_ERROR');
    });

    it('should create with details', () => {
      const error = new BusinessLogicError('Encounter already signed', { encounterId: '123' });

      expect(error.details).toEqual({ encounterId: '123' });
    });
  });

  describe('GDPRError', () => {
    it('should create with message', () => {
      const error = new GDPRError('Consent required for data processing');

      expect(error.message).toBe('Consent required for data processing');
      expect(error.statusCode).toBe(451);
      expect(error.code).toBe('GDPR_COMPLIANCE_ERROR');
    });
  });

  describe('Error inheritance', () => {
    it('all custom errors should be instances of Error', () => {
      const errors = [
        new AppError('test', 500, 'TEST'),
        new NotFoundError('Resource'),
        new ValidationError('test'),
        new AuthenticationError(),
        new AuthorizationError(),
        new ConflictError('Resource', 'field', 'value'),
        new BadRequestError('test'),
        new DatabaseError('test'),
        new ExternalServiceError('service'),
        new RateLimitError(),
        new BusinessLogicError('test'),
        new GDPRError('test'),
      ];

      errors.forEach((error) => {
        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(AppError);
      });
    });

    it('errors should have stack traces', () => {
      const error = new NotFoundError('Patient');

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('NotFoundError');
    });
  });
});
