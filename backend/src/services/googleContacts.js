/**
 * Google Contacts Service
 * Syncs patient phone numbers with Google Contacts for Windows Phone Bluetooth integration
 * Uses Google People API (Contacts API v3 deprecated)
 */

import axios from 'axios';
import logger from '../utils/logger.js';
import { query } from '../config/database.js';

// Google OAuth2 configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || null;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || null;
const GOOGLE_REDIRECT_URI =
  process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/v1/auth/google/callback';
const PEOPLE_API_BASE = 'https://people.googleapis.com/v1';

// Token storage (in production, use Redis or database)
let accessToken = null;
let refreshToken = null;
let tokenExpiry = null;

/**
 * Get OAuth2 authorization URL
 */
export const getAuthorizationUrl = () => {
  const scopes =
    'https://www.googleapis.com/auth/contacts https://www.googleapis.com/auth/contacts.other.readonly';
  const authUrl =
    `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${GOOGLE_CLIENT_ID}` +
    `&response_type=code` +
    `&redirect_uri=${encodeURIComponent(GOOGLE_REDIRECT_URI)}` +
    `&scope=${encodeURIComponent(scopes)}` +
    `&access_type=offline` +
    `&prompt=consent`;

  return authUrl;
};

/**
 * Exchange authorization code for access token
 */
export const exchangeCodeForToken = async (code) => {
  try {
    const response = await axios.post('https://oauth2.googleapis.com/token', {
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      code: code,
      redirect_uri: GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code',
    });

    accessToken = response.data.access_token;
    refreshToken = response.data.refresh_token;
    tokenExpiry = Date.now() + response.data.expires_in * 1000;

    logger.info('Google Contacts access token obtained');
    return {
      success: true,
      expiresIn: response.data.expires_in,
    };
  } catch (error) {
    logger.error('Error exchanging code for token:', error.response?.data || error.message);
    throw new Error('Failed to obtain Google Contacts access token');
  }
};

/**
 * Refresh access token
 */
export const refreshAccessToken = async () => {
  try {
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await axios.post('https://oauth2.googleapis.com/token', {
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    });

    accessToken = response.data.access_token;
    tokenExpiry = Date.now() + response.data.expires_in * 1000;

    logger.info('Google Contacts access token refreshed');
    return true;
  } catch (error) {
    logger.error('Error refreshing token:', error);
    accessToken = null;
    refreshToken = null;
    tokenExpiry = null;
    return false;
  }
};

/**
 * Ensure we have a valid access token
 */
const ensureValidToken = async () => {
  if (!accessToken) {
    throw new Error('Google Contacts not authenticated. Please authenticate first.');
  }

  if (tokenExpiry && Date.now() > tokenExpiry - 300000) {
    const refreshed = await refreshAccessToken();
    if (!refreshed) {
      throw new Error('Failed to refresh Google token. Re-authentication required.');
    }
  }
};

/**
 * Create or update contact in Google Contacts
 */
export const syncPatientToContact = async (patientData) => {
  try {
    await ensureValidToken();

    const { first_name, last_name, phone, email, solvit_id } = patientData;

    // Create contact resource
    const person = {
      names: [
        {
          givenName: first_name,
          familyName: last_name,
          displayName: `${first_name} ${last_name}`,
        },
      ],
      phoneNumbers: phone
        ? [
            {
              value: phone,
              type: 'mobile',
            },
          ]
        : [],
      emailAddresses: email
        ? [
            {
              value: email,
              type: 'home',
            },
          ]
        : [],
      userDefined: [
        {
          key: 'SolvitID',
          value: solvit_id,
        },
        {
          key: 'Source',
          value: 'ChiroClickCRM',
        },
      ],
    };

    // Try to find existing contact first
    const existing = await findContactByPhone(phone);

    if (existing) {
      // Update existing contact
      const response = await axios.patch(
        `${PEOPLE_API_BASE}/${existing.resourceName}:updateContact`,
        person,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          params: {
            updatePersonFields: 'names,phoneNumbers,emailAddresses,userDefined',
          },
        }
      );

      logger.info('Google contact updated:', { phone, resourceName: response.data.resourceName });
      return {
        action: 'updated',
        resourceName: response.data.resourceName,
      };
    } else {
      // Create new contact
      const response = await axios.post(`${PEOPLE_API_BASE}/people:createContact`, person, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      logger.info('Google contact created:', { phone, resourceName: response.data.resourceName });
      return {
        action: 'created',
        resourceName: response.data.resourceName,
      };
    }
  } catch (error) {
    logger.error(
      'Error syncing patient to Google Contacts:',
      error.response?.data || error.message
    );
    throw error;
  }
};

/**
 * Find contact by phone number
 */
export const findContactByPhone = async (phoneNumber) => {
  try {
    await ensureValidToken();

    const cleanPhone = phoneNumber.replace(/\s/g, '');

    const response = await axios.get(`${PEOPLE_API_BASE}/people:searchContacts`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: {
        query: cleanPhone,
        readMask: 'names,phoneNumbers,emailAddresses',
      },
    });

    if (response.data.results && response.data.results.length > 0) {
      return response.data.results[0].person;
    }

    return null;
  } catch (error) {
    logger.error('Error finding contact:', error);
    return null;
  }
};

/**
 * Sync all active patients to Google Contacts
 */
export const syncAllPatients = async (organizationId) => {
  try {
    const result = await query(
      `SELECT id, solvit_id, first_name, last_name, phone, email
       FROM patients
       WHERE organization_id = $1
         AND status = 'ACTIVE'
         AND phone IS NOT NULL
       ORDER BY last_name, first_name`,
      [organizationId]
    );

    const patients = result.rows;
    const results = {
      total: patients.length,
      created: 0,
      updated: 0,
      failed: 0,
      errors: [],
    };

    for (const patient of patients) {
      try {
        const syncResult = await syncPatientToContact(patient);
        if (syncResult.action === 'created') {
          results.created++;
        } else {
          results.updated++;
        }

        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 200));
      } catch (error) {
        results.failed++;
        results.errors.push({
          patient: `${patient.first_name} ${patient.last_name}`,
          error: error.message,
        });
      }
    }

    logger.info('Patient sync to Google Contacts completed:', results);
    return results;
  } catch (error) {
    logger.error('Error syncing all patients:', error);
    throw error;
  }
};

/**
 * Delete contact from Google Contacts
 */
export const deleteContact = async (resourceName) => {
  try {
    await ensureValidToken();

    await axios.delete(`${PEOPLE_API_BASE}/${resourceName}:deleteContact`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    logger.info('Google contact deleted:', { resourceName });
    return { success: true };
  } catch (error) {
    logger.error('Error deleting contact:', error);
    throw error;
  }
};

/**
 * Get all contacts (for backup/verification)
 */
export const getAllContacts = async () => {
  try {
    await ensureValidToken();

    const response = await axios.get(`${PEOPLE_API_BASE}/people/me/connections`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: {
        personFields: 'names,phoneNumbers,emailAddresses',
        pageSize: 100,
      },
    });

    return response.data.connections || [];
  } catch (error) {
    logger.error('Error getting contacts:', error);
    return [];
  }
};

/**
 * Check Google Contacts connection status
 */
export const checkConnection = async () => {
  try {
    if (!accessToken) {
      return {
        connected: false,
        authenticated: false,
        message: 'Not authenticated',
      };
    }

    const response = await axios.get(`${PEOPLE_API_BASE}/people/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: {
        personFields: 'names,emailAddresses',
      },
    });

    const name = response.data.names?.[0]?.displayName || 'Unknown';
    const email = response.data.emailAddresses?.[0]?.value || 'Unknown';

    return {
      connected: true,
      authenticated: true,
      account: {
        name,
        email,
      },
    };
  } catch (error) {
    return {
      connected: false,
      authenticated: false,
      message: error.message,
    };
  }
};

/**
 * Set tokens manually (for persistence)
 */
export const setTokens = (tokens) => {
  accessToken = tokens.accessToken;
  refreshToken = tokens.refreshToken;
  tokenExpiry = tokens.tokenExpiry;
};

/**
 * Get tokens (for persistence)
 */
export const getTokens = () => ({
  accessToken,
  refreshToken,
  tokenExpiry,
});

export default {
  getAuthorizationUrl,
  exchangeCodeForToken,
  refreshAccessToken,
  syncPatientToContact,
  findContactByPhone,
  syncAllPatients,
  deleteContact,
  getAllContacts,
  checkConnection,
  setTokens,
  getTokens,
};
