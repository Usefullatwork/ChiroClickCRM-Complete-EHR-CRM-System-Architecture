/**
 * Organizations Controller
 */

import * as organizationService from '../services/organizations.js';
import { logAudit } from '../utils/audit.js';
import logger from '../utils/logger.js';

export const getCurrentOrganization = async (req, res) => {
  try {
    const { organizationId } = req;

    if (!organizationId) {
      return res.status(404).json({ error: 'No organization associated with user' });
    }

    const organization = await organizationService.getOrganizationById(organizationId);

    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    res.json(organization);
  } catch (error) {
    logger.error('Error in getCurrentOrganization controller:', error);
    res.status(500).json({ error: 'Failed to retrieve organization' });
  }
};

export const updateCurrentOrganization = async (req, res) => {
  try {
    const { organizationId, user } = req;

    const organization = await organizationService.updateOrganization(organizationId, req.body);

    await logAudit({
      organizationId,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'UPDATE',
      resourceType: 'ORGANIZATION',
      resourceId: organizationId,
      changes: req.body,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json(organization);
  } catch (error) {
    logger.error('Error in updateCurrentOrganization controller:', error);
    res.status(500).json({ error: 'Failed to update organization' });
  }
};

export const getCurrentOrganizationUsers = async (req, res) => {
  try {
    const { organizationId } = req;
    const users = await organizationService.getOrganizationUsers(organizationId);
    res.json(users);
  } catch (error) {
    logger.error('Error in getCurrentOrganizationUsers controller:', error);
    res.status(500).json({ error: 'Failed to retrieve organization users' });
  }
};

export const inviteUser = async (req, res) => {
  try {
    const { organizationId, user } = req;
    const { email, role, first_name, last_name } = req.body;

    const invitation = await organizationService.inviteUser(organizationId, {
      email,
      role: role || 'ASSISTANT',
      first_name,
      last_name,
      invited_by: user.id
    });

    await logAudit({
      organizationId,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'CREATE',
      resourceType: 'INVITATION',
      resourceId: invitation.id,
      details: { invited_email: email, role },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.status(201).json({ success: true, data: invitation, message: 'Invitation sent' });
  } catch (error) {
    logger.error('Error in inviteUser controller:', error);
    res.status(500).json({ error: 'Failed to invite user' });
  }
};

export const getOrganizations = async (req, res) => {
  try {
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 50,
      search: req.query.search,
      status: req.query.status
    };

    const result = await organizationService.getAllOrganizations(options);
    res.json(result);
  } catch (error) {
    logger.error('Error in getOrganizations controller:', error);
    res.status(500).json({ error: 'Failed to retrieve organizations' });
  }
};

export const getOrganization = async (req, res) => {
  try {
    const { id } = req.params;
    const organization = await organizationService.getOrganizationById(id);

    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    res.json(organization);
  } catch (error) {
    logger.error('Error in getOrganization controller:', error);
    res.status(500).json({ error: 'Failed to retrieve organization' });
  }
};

export const createOrganization = async (req, res) => {
  try {
    const { user } = req;
    const organization = await organizationService.createOrganization(req.body);

    await logAudit({
      organizationId: organization.id,
      userId: user?.id,
      userEmail: user?.email || 'system',
      userRole: user?.role || 'ADMIN',
      action: 'CREATE',
      resourceType: 'ORGANIZATION',
      resourceId: organization.id,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.status(201).json(organization);
  } catch (error) {
    logger.error('Error in createOrganization controller:', error);
    res.status(500).json({ error: 'Failed to create organization' });
  }
};

export const updateOrganization = async (req, res) => {
  try {
    const { user } = req;
    const { id } = req.params;

    const organization = await organizationService.updateOrganization(id, req.body);

    await logAudit({
      organizationId: id,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'UPDATE',
      resourceType: 'ORGANIZATION',
      resourceId: id,
      changes: req.body,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json(organization);
  } catch (error) {
    logger.error('Error in updateOrganization controller:', error);
    res.status(500).json({ error: 'Failed to update organization' });
  }
};

export const getOrganizationSettings = async (req, res) => {
  try {
    const { id } = req.params;
    const settings = await organizationService.getOrganizationSettings(id);
    res.json(settings);
  } catch (error) {
    logger.error('Error in getOrganizationSettings controller:', error);
    res.status(500).json({ error: 'Failed to retrieve organization settings' });
  }
};

export const updateOrganizationSettings = async (req, res) => {
  try {
    const { user } = req;
    const { id } = req.params;

    const settings = await organizationService.updateOrganizationSettings(id, req.body);

    await logAudit({
      organizationId: id,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'UPDATE',
      resourceType: 'ORGANIZATION_SETTINGS',
      resourceId: id,
      changes: req.body,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json(settings);
  } catch (error) {
    logger.error('Error in updateOrganizationSettings controller:', error);
    res.status(500).json({ error: 'Failed to update organization settings' });
  }
};

export const getOrganizationStats = async (req, res) => {
  try {
    const { id } = req.params;
    const stats = await organizationService.getOrganizationStats(id);
    res.json(stats);
  } catch (error) {
    logger.error('Error in getOrganizationStats controller:', error);
    res.status(500).json({ error: 'Failed to retrieve organization statistics' });
  }
};

export const checkOrganizationLimits = async (req, res) => {
  try {
    const { id } = req.params;
    const limits = await organizationService.checkOrganizationLimits(id);
    res.json(limits);
  } catch (error) {
    logger.error('Error in checkOrganizationLimits controller:', error);
    res.status(500).json({ error: 'Failed to check organization limits' });
  }
};

export default {
  getCurrentOrganization,
  updateCurrentOrganization,
  getCurrentOrganizationUsers,
  inviteUser,
  getOrganizations,
  getOrganization,
  createOrganization,
  updateOrganization,
  getOrganizationSettings,
  updateOrganizationSettings,
  getOrganizationStats,
  checkOrganizationLimits
};
