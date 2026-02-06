/**
 * Google Drive Service - Stub
 * Desktop standalone mode: Google Drive integration not available
 * Training documents should be loaded from local filesystem instead
 */

import logger from '../utils/logger.js';

const NOT_AVAILABLE = 'Google Drive not available in standalone desktop mode. Use local file import instead.';

export const initializeOAuth2Client = () => {
  logger.info('Google Drive: disabled in desktop mode');
  return null;
};

export const getAuthorizationUrl = () => {
  throw new Error(NOT_AVAILABLE);
};

export const exchangeCodeForTokens = async () => {
  throw new Error(NOT_AVAILABLE);
};

export const listFilesInFolder = async () => {
  return [];
};

export const downloadFile = async () => {
  throw new Error(NOT_AVAILABLE);
};

export const syncTrainingDocuments = async () => {
  return { total: 0, downloaded: 0, skipped: 0, errors: [{ error: NOT_AVAILABLE }] };
};

export const searchFiles = async () => {
  return [];
};

export const checkConnection = async () => {
  return { connected: false, error: NOT_AVAILABLE };
};

export default {
  initializeOAuth2Client,
  getAuthorizationUrl,
  exchangeCodeForTokens,
  listFilesInFolder,
  downloadFile,
  syncTrainingDocuments,
  searchFiles,
  checkConnection
};
