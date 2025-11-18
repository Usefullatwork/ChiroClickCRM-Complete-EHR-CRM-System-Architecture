/**
 * Users Controller
 */

import * as userService from '../services/users.js';
import { logAudit } from '../utils/audit.js';
import logger from '../utils/logger.js';

export const getUsers = async (req, res) => {
  try {
    const { organizationId } = req;
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 50,
      search: req.query.search,
      role: req.query.role,
      status: req.query.status
    };

    const result = await userService.getAllUsers(organizationId, options);
    res.json(result);
  } catch (error) {
    logger.error('Error in getUsers controller:', error);
    res.status(500).json({ error: 'Failed to retrieve users' });
  }
};

export const getUser = async (req, res) => {
  try {
    const { organizationId } = req;
    const { id } = req.params;

    const user = await userService.getUserById(organizationId, id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    logger.error('Error in getUser controller:', error);
    res.status(500).json({ error: 'Failed to retrieve user' });
  }
};

export const createUser = async (req, res) => {
  try {
    const { organizationId, user: currentUser } = req;
    const newUser = await userService.createUser(organizationId, req.body);

    await logAudit({
      organizationId,
      userId: currentUser.id,
      userEmail: currentUser.email,
      userRole: currentUser.role,
      action: 'CREATE',
      resourceType: 'USER',
      resourceId: newUser.id,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.status(201).json(newUser);
  } catch (error) {
    logger.error('Error in createUser controller:', error);
    res.status(500).json({ error: error.message || 'Failed to create user' });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { organizationId, user: currentUser } = req;
    const { id } = req.params;

    const updatedUser = await userService.updateUser(organizationId, id, req.body);

    await logAudit({
      organizationId,
      userId: currentUser.id,
      userEmail: currentUser.email,
      userRole: currentUser.role,
      action: 'UPDATE',
      resourceType: 'USER',
      resourceId: id,
      changes: req.body,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json(updatedUser);
  } catch (error) {
    logger.error('Error in updateUser controller:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
};

export const updateUserPreferences = async (req, res) => {
  try {
    const { organizationId } = req;
    const { id } = req.params;

    const preferences = await userService.updateUserPreferences(organizationId, id, req.body);
    res.json(preferences);
  } catch (error) {
    logger.error('Error in updateUserPreferences controller:', error);
    res.status(500).json({ error: 'Failed to update user preferences' });
  }
};

export const deactivateUser = async (req, res) => {
  try {
    const { organizationId, user: currentUser } = req;
    const { id } = req.params;

    const deactivatedUser = await userService.deactivateUser(organizationId, id);

    await logAudit({
      organizationId,
      userId: currentUser.id,
      userEmail: currentUser.email,
      userRole: currentUser.role,
      action: 'UPDATE',
      resourceType: 'USER',
      resourceId: id,
      changes: { status: 'INACTIVE' },
      reason: 'User deactivated',
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json(deactivatedUser);
  } catch (error) {
    logger.error('Error in deactivateUser controller:', error);
    res.status(500).json({ error: 'Failed to deactivate user' });
  }
};

export const reactivateUser = async (req, res) => {
  try {
    const { organizationId, user: currentUser } = req;
    const { id } = req.params;

    const reactivatedUser = await userService.reactivateUser(organizationId, id);

    await logAudit({
      organizationId,
      userId: currentUser.id,
      userEmail: currentUser.email,
      userRole: currentUser.role,
      action: 'UPDATE',
      resourceType: 'USER',
      resourceId: id,
      changes: { status: 'ACTIVE' },
      reason: 'User reactivated',
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json(reactivatedUser);
  } catch (error) {
    logger.error('Error in reactivateUser controller:', error);
    res.status(500).json({ error: 'Failed to reactivate user' });
  }
};

export const getUserStats = async (req, res) => {
  try {
    const { organizationId } = req;
    const { id } = req.params;

    const stats = await userService.getUserStats(organizationId, id);
    res.json(stats);
  } catch (error) {
    logger.error('Error in getUserStats controller:', error);
    res.status(500).json({ error: 'Failed to retrieve user statistics' });
  }
};

export const getPractitioners = async (req, res) => {
  try {
    const { organizationId } = req;
    const practitioners = await userService.getPractitioners(organizationId);
    res.json(practitioners);
  } catch (error) {
    logger.error('Error in getPractitioners controller:', error);
    res.status(500).json({ error: 'Failed to retrieve practitioners' });
  }
};

export default {
  getUsers,
  getUser,
  createUser,
  updateUser,
  updateUserPreferences,
  deactivateUser,
  reactivateUser,
  getUserStats,
  getPractitioners
};
