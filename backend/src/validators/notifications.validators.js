/**
 * Notifications Validation Schemas
 */

import Joi from 'joi';

const uuidSchema = Joi.string().uuid();

/**
 * List notifications validation
 */
export const listNotificationsSchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    unreadOnly: Joi.string().valid('true', 'false'),
  }),
};

/**
 * Mark notification as read validation
 */
export const markAsReadSchema = {
  params: Joi.object({
    id: uuidSchema.required(),
  }),
};

/**
 * Delete notification validation
 */
export const deleteNotificationSchema = {
  params: Joi.object({
    id: uuidSchema.required(),
  }),
};
