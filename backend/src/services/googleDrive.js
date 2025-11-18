/**
 * Google Drive Service
 * Fetch training documents from Google Drive
 */

import { google } from 'googleapis';
import logger from '../utils/logger.js';
import { promises as fs } from 'fs';
import path from 'path';

// OAuth2 client setup
let oauth2Client = null;
let accessToken = null;
let refreshToken = null;
let tokenExpiry = null;

const GOOGLE_DRIVE_CLIENT_ID = process.env.GOOGLE_DRIVE_CLIENT_ID;
const GOOGLE_DRIVE_CLIENT_SECRET = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
const GOOGLE_DRIVE_REDIRECT_URI = process.env.GOOGLE_DRIVE_REDIRECT_URI || 'http://localhost:3000/api/v1/google-drive/callback';

/**
 * Initialize OAuth2 client
 */
export const initializeOAuth2Client = () => {
  if (!GOOGLE_DRIVE_CLIENT_ID || !GOOGLE_DRIVE_CLIENT_SECRET) {
    logger.warn('Google Drive credentials not configured');
    return null;
  }

  oauth2Client = new google.auth.OAuth2(
    GOOGLE_DRIVE_CLIENT_ID,
    GOOGLE_DRIVE_CLIENT_SECRET,
    GOOGLE_DRIVE_REDIRECT_URI
  );

  return oauth2Client;
};

/**
 * Get authorization URL for OAuth2 flow
 */
export const getAuthorizationUrl = () => {
  const client = oauth2Client || initializeOAuth2Client();
  if (!client) {
    throw new Error('Google Drive not configured');
  }

  const scopes = [
    'https://www.googleapis.com/auth/drive.readonly',
    'https://www.googleapis.com/auth/drive.metadata.readonly'
  ];

  return client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent'
  });
};

/**
 * Exchange authorization code for tokens
 */
export const exchangeCodeForTokens = async (code) => {
  try {
    const client = oauth2Client || initializeOAuth2Client();
    const { tokens } = await client.getToken(code);

    client.setCredentials(tokens);
    accessToken = tokens.access_token;
    refreshToken = tokens.refresh_token;
    tokenExpiry = Date.now() + (tokens.expiry_date || 3600 * 1000);

    logger.info('Google Drive tokens obtained');
    return tokens;
  } catch (error) {
    logger.error('Error exchanging code for tokens:', error);
    throw new Error('Failed to authenticate with Google Drive');
  }
};

/**
 * Refresh access token if expired
 */
const ensureValidToken = async () => {
  if (!oauth2Client || !refreshToken) {
    throw new Error('Not authenticated with Google Drive');
  }

  if (Date.now() >= tokenExpiry - 60000) { // Refresh if expires in < 1 min
    try {
      oauth2Client.setCredentials({ refresh_token: refreshToken });
      const { credentials } = await oauth2Client.refreshAccessToken();

      accessToken = credentials.access_token;
      tokenExpiry = Date.now() + (credentials.expiry_date || 3600 * 1000);
      oauth2Client.setCredentials(credentials);

      logger.info('Google Drive token refreshed');
    } catch (error) {
      logger.error('Error refreshing Google Drive token:', error);
      throw new Error('Failed to refresh Google Drive token');
    }
  }
};

/**
 * List files in a Google Drive folder
 */
export const listFilesInFolder = async (folderId, options = {}) => {
  await ensureValidToken();

  const {
    mimeTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    maxResults = 100
  } = options;

  try {
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    let query = `'${folderId}' in parents and trashed = false`;
    if (mimeTypes.length > 0) {
      const mimeQuery = mimeTypes.map(type => `mimeType='${type}'`).join(' or ');
      query += ` and (${mimeQuery})`;
    }

    const response = await drive.files.list({
      q: query,
      pageSize: maxResults,
      fields: 'files(id, name, mimeType, size, createdTime, modifiedTime, description)',
      orderBy: 'modifiedTime desc'
    });

    logger.info('Google Drive files listed:', { count: response.data.files.length, folderId });
    return response.data.files;
  } catch (error) {
    logger.error('Error listing Google Drive files:', error);
    throw new Error('Failed to list Google Drive files');
  }
};

/**
 * Download file from Google Drive
 */
export const downloadFile = async (fileId, destinationPath) => {
  await ensureValidToken();

  try {
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    // Get file metadata
    const metadata = await drive.files.get({
      fileId: fileId,
      fields: 'name, mimeType'
    });

    // Download file
    const response = await drive.files.get(
      { fileId: fileId, alt: 'media' },
      { responseType: 'arraybuffer' }
    );

    // Write to file
    await fs.writeFile(destinationPath, Buffer.from(response.data));

    logger.info('Google Drive file downloaded:', {
      fileId,
      name: metadata.data.name,
      size: response.data.byteLength
    });

    return {
      fileId,
      name: metadata.data.name,
      mimeType: metadata.data.mimeType,
      path: destinationPath,
      size: response.data.byteLength
    };
  } catch (error) {
    logger.error('Error downloading Google Drive file:', error);
    throw new Error('Failed to download file from Google Drive');
  }
};

/**
 * Sync training documents from Google Drive folder
 */
export const syncTrainingDocuments = async (folderId, localDirectory) => {
  await ensureValidToken();

  try {
    // Ensure local directory exists
    await fs.mkdir(localDirectory, { recursive: true });

    // List files
    const files = await listFilesInFolder(folderId, {
      mimeTypes: [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
        'text/plain'
      ]
    });

    const results = {
      total: files.length,
      downloaded: 0,
      skipped: 0,
      errors: []
    };

    for (const file of files) {
      try {
        const fileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_'); // Sanitize
        const localPath = path.join(localDirectory, fileName);

        // Check if file already exists
        try {
          await fs.access(localPath);
          logger.info(`File already exists, skipping: ${fileName}`);
          results.skipped++;
          continue;
        } catch {
          // File doesn't exist, proceed with download
        }

        await downloadFile(file.id, localPath);
        results.downloaded++;

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        logger.error(`Error downloading file ${file.name}:`, error);
        results.errors.push({ file: file.name, error: error.message });
      }
    }

    logger.info('Training documents sync completed:', results);
    return results;
  } catch (error) {
    logger.error('Error syncing training documents:', error);
    throw error;
  }
};

/**
 * Search for files by name pattern
 */
export const searchFiles = async (searchQuery, options = {}) => {
  await ensureValidToken();

  const {
    mimeTypes = [],
    maxResults = 50
  } = options;

  try {
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    let query = `name contains '${searchQuery}' and trashed = false`;
    if (mimeTypes.length > 0) {
      const mimeQuery = mimeTypes.map(type => `mimeType='${type}'`).join(' or ');
      query += ` and (${mimeQuery})`;
    }

    const response = await drive.files.list({
      q: query,
      pageSize: maxResults,
      fields: 'files(id, name, mimeType, size, createdTime, modifiedTime)',
      orderBy: 'modifiedTime desc'
    });

    return response.data.files;
  } catch (error) {
    logger.error('Error searching Google Drive files:', error);
    throw new Error('Failed to search Google Drive');
  }
};

/**
 * Check Google Drive connection status
 */
export const checkConnection = async () => {
  if (!oauth2Client || !refreshToken) {
    return { connected: false, error: 'Not authenticated' };
  }

  try {
    await ensureValidToken();
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    await drive.about.get({ fields: 'user' });

    return { connected: true, expiresAt: new Date(tokenExpiry) };
  } catch (error) {
    logger.error('Google Drive connection check failed:', error);
    return { connected: false, error: error.message };
  }
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
