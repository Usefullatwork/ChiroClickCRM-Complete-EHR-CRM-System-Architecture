/**
 * Slash Commands Routes
 * CRUD endpoints for user-defined slash commands
 */

import express from 'express';
import * as slashCommandController from '../controllers/slashCommands.js';
import { requireAuth, requireOrganization, requireRole } from '../middleware/auth.js';
import validate from '../middleware/validation.js';
import Joi from 'joi';

const router = express.Router();

router.use(requireAuth);
router.use(requireOrganization);

const createSlashCommandSchema = {
  body: Joi.object({
    command_trigger: Joi.string().min(2).max(50).required(),
    output_text: Joi.string().min(1).max(5000).required(),
    category: Joi.string().max(100).default('general'),
  }),
};

const updateSlashCommandSchema = {
  params: Joi.object({ id: Joi.string().uuid().required() }),
  body: Joi.object({
    command_trigger: Joi.string().min(2).max(50),
    output_text: Joi.string().min(1).max(5000),
    category: Joi.string().max(100),
  }).min(1),
};

const slashCommandIdSchema = {
  params: Joi.object({ id: Joi.string().uuid().required() }),
};

/**
 * @swagger
 * /slash-commands:
 *   get:
 *     summary: Get all slash commands for the organization
 *     tags: [Slash Commands]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of slash commands
 */
router.get(
  '/',
  requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),
  slashCommandController.getSlashCommands
);

/**
 * @swagger
 * /slash-commands:
 *   post:
 *     summary: Create a new slash command
 *     tags: [Slash Commands]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [command_trigger, output_text]
 *             properties:
 *               command_trigger:
 *                 type: string
 *               output_text:
 *                 type: string
 *               category:
 *                 type: string
 *     responses:
 *       201:
 *         description: Slash command created
 */
router.post(
  '/',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(createSlashCommandSchema),
  slashCommandController.createSlashCommand
);

/**
 * @swagger
 * /slash-commands/{id}:
 *   patch:
 *     summary: Update a slash command
 *     tags: [Slash Commands]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Slash command updated
 */
router.patch(
  '/:id',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(updateSlashCommandSchema),
  slashCommandController.updateSlashCommand
);

/**
 * @swagger
 * /slash-commands/{id}:
 *   delete:
 *     summary: Soft-delete a slash command
 *     tags: [Slash Commands]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Slash command deleted
 */
router.delete(
  '/:id',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(slashCommandIdSchema),
  slashCommandController.deleteSlashCommand
);

export default router;
