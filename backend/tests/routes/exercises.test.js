/**
 * Exercise Routes Tests
 * Integration tests for exercise API endpoints using supertest
 */

import { jest, describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import 'express-async-errors';
import express from 'express';
import request from 'supertest';
import {
  createTestExercise,
  createTestPrescription,
  createTestUser,
  createTestPatient,
  createMockRequest,
  createMockResponse,
  createMany,
} from '../setup.js';

// Mock dependencies
const mockExerciseLibraryService = {
  getExercises: jest.fn(),
  getExerciseById: jest.fn(),
  createExercise: jest.fn(),
  updateExercise: jest.fn(),
  deleteExercise: jest.fn(),
  getCategories: jest.fn(),
  seedDefaultExercises: jest.fn(),
  createPrescription: jest.fn(),
  getPatientPrescriptions: jest.fn(),
  getPrescriptionById: jest.fn(),
  updatePrescriptionStatus: jest.fn(),
  getProgressHistory: jest.fn(),
};

const mockExerciseDeliveryService = {
  generatePrescriptionPDF: jest.fn(),
  sendPrescriptionEmail: jest.fn(),
  sendExerciseReminder: jest.fn(),
  sendPortalSMS: jest.fn(),
};

jest.unstable_mockModule('../../src/services/exerciseLibrary.js', () => ({
  default: mockExerciseLibraryService,
  ...mockExerciseLibraryService,
}));

jest.unstable_mockModule('../../src/services/exerciseDelivery.js', () => ({
  default: mockExerciseDeliveryService,
  ...mockExerciseDeliveryService,
}));

jest.unstable_mockModule('../../src/utils/audit.js', () => ({
  logAudit: jest.fn().mockResolvedValue(true),
}));

// Import controllers after mocking
const exerciseController = await import('../../src/controllers/exercises.js');

describe('Exercise Routes', () => {
  let app;
  const mockUser = createTestUser();
  const organizationId = 'test-org-id-456';

  // Mock auth middleware
  const mockAuthMiddleware = (req, res, next) => {
    req.organizationId = organizationId;
    req.user = mockUser;
    next();
  };

  beforeAll(() => {
    // Create Express app for testing
    app = express();
    app.use(express.json());

    // Apply mock auth to all routes
    app.use(mockAuthMiddleware);

    // Setup routes
    app.get('/api/v1/exercises/categories', exerciseController.getCategories);
    app.get('/api/v1/exercises', exerciseController.getExercises);
    app.get('/api/v1/exercises/:id', exerciseController.getExerciseById);
    app.post('/api/v1/exercises', exerciseController.createExercise);
    app.put('/api/v1/exercises/:id', exerciseController.updateExercise);
    app.delete('/api/v1/exercises/:id', exerciseController.deleteExercise);
    app.post('/api/v1/exercises/seed', exerciseController.seedDefaultExercises);

    // Prescription routes
    app.post('/api/v1/exercises/prescriptions', exerciseController.createPrescription);
    app.get(
      '/api/v1/exercises/prescriptions/patient/:patientId',
      exerciseController.getPatientPrescriptions
    );
    app.get('/api/v1/exercises/prescriptions/:id', exerciseController.getPrescriptionById);
    app.patch(
      '/api/v1/exercises/prescriptions/:id/status',
      exerciseController.updatePrescriptionStatus
    );
    app.get('/api/v1/exercises/prescriptions/:id/progress', exerciseController.getProgressHistory);

    // Error handler (matches global error handler in server.js)
    app.use((err, req, res, next) => {
      const statusCode = err.statusCode || err.status || 500;
      res.status(statusCode).json({
        error: err.name || 'Error',
        message: err.message,
      });
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================================
  // GET /api/v1/exercises TESTS
  // ============================================================================

  describe('GET /api/v1/exercises', () => {
    it('should return list of exercises', async () => {
      const mockExercises = createMany(createTestExercise, 5);
      mockExerciseLibraryService.getExercises.mockResolvedValue(mockExercises);

      const response = await request(app).get('/api/v1/exercises').expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(5);
      expect(response.body.count).toBe(5);
    });

    it('should pass query parameters to service', async () => {
      mockExerciseLibraryService.getExercises.mockResolvedValue([]);

      await request(app)
        .get('/api/v1/exercises')
        .query({
          category: 'Nakke',
          difficultyLevel: 'beginner',
          search: 'stretch',
          limit: '10',
          offset: '0',
        })
        .expect(200);

      expect(mockExerciseLibraryService.getExercises).toHaveBeenCalledWith(
        organizationId,
        expect.objectContaining({
          category: 'Nakke',
          difficultyLevel: 'beginner',
          search: 'stretch',
          limit: 10,
          offset: 0,
        })
      );
    });

    it('should handle isActive filter correctly', async () => {
      mockExerciseLibraryService.getExercises.mockResolvedValue([]);

      await request(app).get('/api/v1/exercises').query({ isActive: 'true' }).expect(200);

      expect(mockExerciseLibraryService.getExercises).toHaveBeenCalledWith(
        organizationId,
        expect.objectContaining({ isActive: true })
      );

      await request(app).get('/api/v1/exercises').query({ isActive: 'false' }).expect(200);

      expect(mockExerciseLibraryService.getExercises).toHaveBeenCalledWith(
        organizationId,
        expect.objectContaining({ isActive: false })
      );
    });

    it('should return 500 on service error', async () => {
      mockExerciseLibraryService.getExercises.mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/api/v1/exercises').expect(500);

      expect(response.body.message).toBe('Database error');
    });
  });

  // ============================================================================
  // GET /api/v1/exercises/:id TESTS
  // ============================================================================

  describe('GET /api/v1/exercises/:id', () => {
    it('should return exercise by ID', async () => {
      const mockExercise = createTestExercise();
      mockExerciseLibraryService.getExerciseById.mockResolvedValue(mockExercise);

      const response = await request(app).get(`/api/v1/exercises/${mockExercise.id}`).expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(mockExercise.id);
    });

    it('should return 404 when exercise not found', async () => {
      mockExerciseLibraryService.getExerciseById.mockResolvedValue(null);

      const response = await request(app).get('/api/v1/exercises/non-existent-id').expect(404);

      expect(response.body.error).toBe('Exercise not found');
    });

    it('should return 500 on service error', async () => {
      mockExerciseLibraryService.getExerciseById.mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/api/v1/exercises/test-id').expect(500);

      expect(response.body.message).toBe('Database error');
    });
  });

  // ============================================================================
  // POST /api/v1/exercises TESTS
  // ============================================================================

  describe('POST /api/v1/exercises', () => {
    it('should create a new exercise', async () => {
      const exerciseData = {
        name: 'New Exercise',
        category: 'Nakke',
        difficultyLevel: 'beginner',
        instructions: 'Test instructions',
      };

      const createdExercise = createTestExercise(exerciseData);
      mockExerciseLibraryService.createExercise.mockResolvedValue(createdExercise);

      const response = await request(app).post('/api/v1/exercises').send(exerciseData).expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(exerciseData.name);
    });

    it('should pass user ID to service', async () => {
      mockExerciseLibraryService.createExercise.mockResolvedValue(createTestExercise());

      await request(app).post('/api/v1/exercises').send({ name: 'Test' }).expect(201);

      expect(mockExerciseLibraryService.createExercise).toHaveBeenCalledWith(
        organizationId,
        mockUser.id,
        expect.any(Object)
      );
    });

    it('should return 500 on service error', async () => {
      mockExerciseLibraryService.createExercise.mockRejectedValue(new Error('Insert failed'));

      const response = await request(app)
        .post('/api/v1/exercises')
        .send({ name: 'Test' })
        .expect(500);

      expect(response.body.message).toBe('Insert failed');
    });
  });

  // ============================================================================
  // PUT /api/v1/exercises/:id TESTS
  // ============================================================================

  describe('PUT /api/v1/exercises/:id', () => {
    it('should update an exercise', async () => {
      const updateData = { name: 'Updated Name' };
      const updatedExercise = createTestExercise(updateData);
      mockExerciseLibraryService.updateExercise.mockResolvedValue(updatedExercise);

      const response = await request(app)
        .put('/api/v1/exercises/test-id')
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Name');
    });

    it('should return 404 when exercise not found', async () => {
      mockExerciseLibraryService.updateExercise.mockResolvedValue(null);

      const response = await request(app)
        .put('/api/v1/exercises/non-existent-id')
        .send({ name: 'Updated' })
        .expect(404);

      expect(response.body.error).toBe('Exercise not found');
    });

    it('should return 500 on service error', async () => {
      mockExerciseLibraryService.updateExercise.mockRejectedValue(new Error('Update failed'));

      const response = await request(app)
        .put('/api/v1/exercises/test-id')
        .send({ name: 'Updated' })
        .expect(500);

      expect(response.body.message).toBe('Update failed');
    });
  });

  // ============================================================================
  // DELETE /api/v1/exercises/:id TESTS
  // ============================================================================

  describe('DELETE /api/v1/exercises/:id', () => {
    it('should delete an exercise', async () => {
      mockExerciseLibraryService.deleteExercise.mockResolvedValue(true);

      const response = await request(app).delete('/api/v1/exercises/test-id').expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Exercise deleted successfully');
    });

    it('should return 404 when exercise not found', async () => {
      mockExerciseLibraryService.deleteExercise.mockResolvedValue(false);

      const response = await request(app).delete('/api/v1/exercises/non-existent-id').expect(404);

      expect(response.body.error).toBe('Exercise not found');
    });

    it('should return 500 on service error', async () => {
      mockExerciseLibraryService.deleteExercise.mockRejectedValue(new Error('Delete failed'));

      const response = await request(app).delete('/api/v1/exercises/test-id').expect(500);

      expect(response.body.message).toBe('Delete failed');
    });
  });

  // ============================================================================
  // GET /api/v1/exercises/categories TESTS
  // ============================================================================

  describe('GET /api/v1/exercises/categories', () => {
    it('should return exercise categories', async () => {
      const mockCategories = [
        { category: 'Nakke', subcategories: ['Mobilitet', 'Styrke'], exercise_count: '5' },
        { category: 'Skulder', subcategories: ['Stabilitet'], exercise_count: '3' },
      ];
      mockExerciseLibraryService.getCategories.mockResolvedValue(mockCategories);

      const response = await request(app).get('/api/v1/exercises/categories').expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });

    it('should return 500 on service error', async () => {
      mockExerciseLibraryService.getCategories.mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/api/v1/exercises/categories').expect(500);

      expect(response.body.message).toBe('Database error');
    });
  });

  // ============================================================================
  // POST /api/v1/exercises/prescriptions TESTS
  // ============================================================================

  describe('POST /api/v1/exercises/prescriptions', () => {
    it('should create a prescription', async () => {
      const prescriptionData = {
        patientId: 'patient-123',
        exercises: [{ exerciseId: 'ex-1', sets: 3, reps: 10 }],
      };

      const createdPrescription = createTestPrescription();
      mockExerciseLibraryService.createPrescription.mockResolvedValue(createdPrescription);

      const response = await request(app)
        .post('/api/v1/exercises/prescriptions')
        .send(prescriptionData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
    });

    it('should pass prescribedBy from user', async () => {
      mockExerciseLibraryService.createPrescription.mockResolvedValue(createTestPrescription());

      await request(app)
        .post('/api/v1/exercises/prescriptions')
        .send({ patientId: 'patient-123' })
        .expect(201);

      expect(mockExerciseLibraryService.createPrescription).toHaveBeenCalledWith(
        organizationId,
        expect.objectContaining({ prescribedBy: mockUser.id })
      );
    });

    it('should return 500 on service error', async () => {
      mockExerciseLibraryService.createPrescription.mockRejectedValue(new Error('Insert failed'));

      const response = await request(app)
        .post('/api/v1/exercises/prescriptions')
        .send({ patientId: 'patient-123' })
        .expect(500);

      expect(response.body.message).toBe('Insert failed');
    });
  });

  // ============================================================================
  // GET /api/v1/exercises/prescriptions/patient/:patientId TESTS
  // ============================================================================

  describe('GET /api/v1/exercises/prescriptions/patient/:patientId', () => {
    it('should return prescriptions for a patient', async () => {
      const mockPrescriptions = [createTestPrescription(), createTestPrescription({ id: 'rx-2' })];
      mockExerciseLibraryService.getPatientPrescriptions.mockResolvedValue(mockPrescriptions);

      const response = await request(app)
        .get('/api/v1/exercises/prescriptions/patient/patient-123')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });

    it('should pass status filter to service', async () => {
      mockExerciseLibraryService.getPatientPrescriptions.mockResolvedValue([]);

      await request(app)
        .get('/api/v1/exercises/prescriptions/patient/patient-123')
        .query({ status: 'active' })
        .expect(200);

      expect(mockExerciseLibraryService.getPatientPrescriptions).toHaveBeenCalledWith(
        organizationId,
        'patient-123',
        'active'
      );
    });

    it('should return 500 on service error', async () => {
      mockExerciseLibraryService.getPatientPrescriptions.mockRejectedValue(
        new Error('Database error')
      );

      const response = await request(app)
        .get('/api/v1/exercises/prescriptions/patient/patient-123')
        .expect(500);

      expect(response.body.message).toBe('Database error');
    });
  });

  // ============================================================================
  // GET /api/v1/exercises/prescriptions/:id TESTS
  // ============================================================================

  describe('GET /api/v1/exercises/prescriptions/:id', () => {
    it('should return prescription by ID', async () => {
      const mockPrescription = createTestPrescription();
      mockExerciseLibraryService.getPrescriptionById.mockResolvedValue(mockPrescription);

      const response = await request(app).get('/api/v1/exercises/prescriptions/rx-123').expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
    });

    it('should return 404 when prescription not found', async () => {
      mockExerciseLibraryService.getPrescriptionById.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/v1/exercises/prescriptions/non-existent')
        .expect(404);

      expect(response.body.error).toBe('Prescription not found');
    });

    it('should return 500 on service error', async () => {
      mockExerciseLibraryService.getPrescriptionById.mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/api/v1/exercises/prescriptions/rx-123').expect(500);

      expect(response.body.message).toBe('Database error');
    });
  });

  // ============================================================================
  // PATCH /api/v1/exercises/prescriptions/:id/status TESTS
  // ============================================================================

  describe('PATCH /api/v1/exercises/prescriptions/:id/status', () => {
    it('should update prescription status', async () => {
      const updatedPrescription = createTestPrescription({ status: 'completed' });
      mockExerciseLibraryService.updatePrescriptionStatus.mockResolvedValue(updatedPrescription);

      const response = await request(app)
        .patch('/api/v1/exercises/prescriptions/rx-123/status')
        .send({ status: 'completed' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('completed');
    });

    it('should return 404 when prescription not found', async () => {
      mockExerciseLibraryService.updatePrescriptionStatus.mockResolvedValue(null);

      const response = await request(app)
        .patch('/api/v1/exercises/prescriptions/non-existent/status')
        .send({ status: 'completed' })
        .expect(404);

      expect(response.body.error).toBe('Prescription not found');
    });

    it('should return 500 on service error', async () => {
      mockExerciseLibraryService.updatePrescriptionStatus.mockRejectedValue(
        new Error('Update failed')
      );

      const response = await request(app)
        .patch('/api/v1/exercises/prescriptions/rx-123/status')
        .send({ status: 'completed' })
        .expect(500);

      expect(response.body.message).toBe('Update failed');
    });
  });

  // ============================================================================
  // GET /api/v1/exercises/prescriptions/:id/progress TESTS
  // ============================================================================

  describe('GET /api/v1/exercises/prescriptions/:id/progress', () => {
    it('should return progress history', async () => {
      const mockProgress = [
        { id: 'p-1', exercise_name: 'Test', completed_at: new Date().toISOString() },
      ];
      mockExerciseLibraryService.getProgressHistory.mockResolvedValue(mockProgress);

      const response = await request(app)
        .get('/api/v1/exercises/prescriptions/rx-123/progress')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });

    it('should return 500 on service error', async () => {
      mockExerciseLibraryService.getProgressHistory.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/v1/exercises/prescriptions/rx-123/progress')
        .expect(500);

      expect(response.body.message).toBe('Database error');
    });
  });

  // ============================================================================
  // POST /api/v1/exercises/seed TESTS
  // ============================================================================

  describe('POST /api/v1/exercises/seed', () => {
    it('should seed default exercises', async () => {
      mockExerciseLibraryService.seedDefaultExercises.mockResolvedValue({
        inserted: 10,
        skipped: 2,
        total: 12,
      });

      const response = await request(app).post('/api/v1/exercises/seed').expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Default exercises seeded successfully');
    });

    it('should return 500 on service error', async () => {
      mockExerciseLibraryService.seedDefaultExercises.mockRejectedValue(new Error('Seed failed'));

      const response = await request(app).post('/api/v1/exercises/seed').expect(500);

      expect(response.body.message).toBe('Seed failed');
    });
  });
});
