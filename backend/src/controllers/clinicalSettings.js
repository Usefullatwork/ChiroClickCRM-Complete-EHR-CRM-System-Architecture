/**
 * Clinical Settings Controller
 * Handles API requests for clinical documentation preferences
 */

import * as clinicalSettingsService from '../services/clinical/clinicalSettings.js';
import logger from '../utils/logger.js';

/**
 * Get clinical settings for the user's organization
 */
export const getClinicalSettings = async (req, res) => {
  try {
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: 'Organization ID required',
      });
    }

    const settings = await clinicalSettingsService.getClinicalSettings(organizationId);

    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    logger.error('Error getting clinical settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get clinical settings',
      error: error.message,
    });
  }
};

/**
 * Update clinical settings for the user's organization
 */
export const updateClinicalSettings = async (req, res) => {
  try {
    const organizationId = req.user?.organizationId;
    const updates = req.body;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: 'Organization ID required',
      });
    }

    const settings = await clinicalSettingsService.updateClinicalSettings(organizationId, updates);

    res.json({
      success: true,
      message: 'Clinical settings updated',
      data: settings,
    });
  } catch (error) {
    logger.error('Error updating clinical settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update clinical settings',
      error: error.message,
    });
  }
};

/**
 * Update a specific section of clinical settings
 */
export const updateClinicalSettingsSection = async (req, res) => {
  try {
    const organizationId = req.user?.organizationId;
    const { section } = req.params;
    const sectionData = req.body;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: 'Organization ID required',
      });
    }

    const validSections = ['adjustment', 'tests', 'letters', 'soap', 'ai', 'display'];
    if (!validSections.includes(section)) {
      return res.status(400).json({
        success: false,
        message: `Invalid section. Valid sections: ${validSections.join(', ')}`,
      });
    }

    const settings = await clinicalSettingsService.updateClinicalSettings(organizationId, {
      [section]: sectionData,
    });

    res.json({
      success: true,
      message: `${section} settings updated`,
      data: settings,
    });
  } catch (error) {
    logger.error('Error updating clinical settings section:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update clinical settings',
      error: error.message,
    });
  }
};

/**
 * Reset clinical settings to defaults
 */
export const resetClinicalSettings = async (req, res) => {
  try {
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: 'Organization ID required',
      });
    }

    const settings = await clinicalSettingsService.resetClinicalSettings(organizationId);

    res.json({
      success: true,
      message: 'Clinical settings reset to defaults',
      data: settings,
    });
  } catch (error) {
    logger.error('Error resetting clinical settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset clinical settings',
      error: error.message,
    });
  }
};

/**
 * Get default clinical settings (for reference)
 */
export const getDefaultClinicalSettings = async (req, res) => {
  res.json({
    success: true,
    data: clinicalSettingsService.DEFAULT_CLINICAL_SETTINGS,
  });
};

/**
 * Get adjustment notation templates based on current settings
 */
export const getAdjustmentNotationTemplates = async (req, res) => {
  try {
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: 'Organization ID required',
      });
    }

    const templates = await clinicalSettingsService.getAdjustmentNotationTemplates(organizationId);

    res.json({
      success: true,
      data: templates,
    });
  } catch (error) {
    logger.error('Error getting adjustment templates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get adjustment templates',
      error: error.message,
    });
  }
};

/**
 * Update adjustment notation style
 */
export const setAdjustmentStyle = async (req, res) => {
  try {
    const organizationId = req.user?.organizationId;
    const { style } = req.body;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: 'Organization ID required',
      });
    }

    const validStyles = ['gonstead', 'diversified', 'segment_listing', 'activator', 'custom'];
    if (!validStyles.includes(style)) {
      return res.status(400).json({
        success: false,
        message: `Invalid style. Valid styles: ${validStyles.join(', ')}`,
      });
    }

    const settings = await clinicalSettingsService.updateClinicalSettings(organizationId, {
      adjustment: { style },
    });

    res.json({
      success: true,
      message: `Adjustment style set to ${style}`,
      data: settings.adjustment,
    });
  } catch (error) {
    logger.error('Error setting adjustment style:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set adjustment style',
      error: error.message,
    });
  }
};

/**
 * Update test documentation preferences
 */
export const updateTestSettings = async (req, res) => {
  try {
    const organizationId = req.user?.organizationId;
    const { testType } = req.params;
    const testSettings = req.body;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: 'Organization ID required',
      });
    }

    const validTestTypes = ['orthopedic', 'neurological', 'rom', 'palpation'];
    if (!validTestTypes.includes(testType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid test type. Valid types: ${validTestTypes.join(', ')}`,
      });
    }

    const settings = await clinicalSettingsService.updateClinicalSettings(organizationId, {
      tests: { [testType]: testSettings },
    });

    res.json({
      success: true,
      message: `${testType} test settings updated`,
      data: settings.tests[testType],
    });
  } catch (error) {
    logger.error('Error updating test settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update test settings',
      error: error.message,
    });
  }
};

/**
 * Update letter/document settings
 */
export const updateLetterSettings = async (req, res) => {
  try {
    const organizationId = req.user?.organizationId;
    const letterSettings = req.body;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: 'Organization ID required',
      });
    }

    const settings = await clinicalSettingsService.updateClinicalSettings(organizationId, {
      letters: letterSettings,
    });

    res.json({
      success: true,
      message: 'Letter settings updated',
      data: settings.letters,
    });
  } catch (error) {
    logger.error('Error updating letter settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update letter settings',
      error: error.message,
    });
  }
};

/**
 * Get panel configuration for the authenticated user
 * Stored per-user within organization clinical settings
 */
export const getPanelConfig = async (req, res) => {
  try {
    const organizationId = req.user?.organizationId;
    const userId = req.user?.id;

    if (!organizationId) {
      return res.status(400).json({ success: false, message: 'Organization ID required' });
    }

    const settings = await clinicalSettingsService.getClinicalSettings(organizationId);
    const userPanels = settings.panelConfigs?.[userId] || null;

    res.json({
      success: true,
      data: userPanels || { panels: DEFAULT_PANELS, presetName: 'default' },
    });
  } catch (error) {
    logger.error('Error getting panel config:', error);
    res.status(500).json({ success: false, message: 'Failed to get panel config' });
  }
};

/**
 * Update panel configuration for the authenticated user
 */
export const updatePanelConfig = async (req, res) => {
  try {
    const organizationId = req.user?.organizationId;
    const userId = req.user?.id;
    const { panels, presetName } = req.body;

    if (!organizationId) {
      return res.status(400).json({ success: false, message: 'Organization ID required' });
    }

    await clinicalSettingsService.updateClinicalSettings(organizationId, {
      panelConfigs: { [userId]: { panels, presetName: presetName || '' } },
    });

    res.json({
      success: true,
      message: 'Panel configuration saved',
      data: { panels, presetName },
    });
  } catch (error) {
    logger.error('Error updating panel config:', error);
    res.status(500).json({ success: false, message: 'Failed to update panel config' });
  }
};

const DEFAULT_PANELS = [
  { id: 'neuroExam', visible: true, order: 0, pinned: false },
  { id: 'orthoExam', visible: true, order: 1, pinned: false },
  { id: 'bodyDiagram', visible: true, order: 2, pinned: false },
  { id: 'romTable', visible: true, order: 3, pinned: false },
  { id: 'exercisePanel', visible: true, order: 4, pinned: false },
  { id: 'anatomyPanel', visible: false, order: 5, pinned: false },
  { id: 'outcomeMeasures', visible: false, order: 6, pinned: false },
  { id: 'headacheAssessment', visible: false, order: 7, pinned: false },
  { id: 'cranialNerves', visible: false, order: 8, pinned: false },
  { id: 'sensoryExam', visible: false, order: 9, pinned: false },
  { id: 'mmt', visible: false, order: 10, pinned: false },
  { id: 'dtr', visible: false, order: 11, pinned: false },
  { id: 'coordination', visible: false, order: 12, pinned: false },
  { id: 'nerveTension', visible: false, order: 13, pinned: false },
  { id: 'painAssessment', visible: false, order: 14, pinned: false },
  { id: 'tissueMarkers', visible: false, order: 15, pinned: false },
  { id: 'regionalDiagrams', visible: false, order: 16, pinned: false },
];

export default {
  getClinicalSettings,
  updateClinicalSettings,
  updateClinicalSettingsSection,
  resetClinicalSettings,
  getDefaultClinicalSettings,
  getAdjustmentNotationTemplates,
  setAdjustmentStyle,
  updateTestSettings,
  updateLetterSettings,
  getPanelConfig,
  updatePanelConfig,
};
