/**
 * Outlook Bridge Service
 * Sends emails through Microsoft Outlook using Graph API
 * Supports both personal and organizational Microsoft 365 accounts
 */

import axios from 'axios';
import logger from '../utils/logger.js';

// Microsoft Graph API configuration
const GRAPH_API_BASE = 'https://graph.microsoft.com/v1.0';
const OUTLOOK_CLIENT_ID = process.env.OUTLOOK_CLIENT_ID || null;
const OUTLOOK_CLIENT_SECRET = process.env.OUTLOOK_CLIENT_SECRET || null;
const OUTLOOK_TENANT_ID = process.env.OUTLOOK_TENANT_ID || 'common';
const OUTLOOK_REDIRECT_URI = process.env.OUTLOOK_REDIRECT_URI || 'http://localhost:3000/api/v1/auth/outlook/callback';

// Token storage (in production, use Redis or database)
let accessToken = null;
let refreshToken = null;
let tokenExpiry = null;

/**
 * Get OAuth2 authorization URL
 */
export const getAuthorizationUrl = () => {
  const scopes = 'Mail.Send Mail.ReadWrite User.Read offline_access';
  const authUrl = `https://login.microsoftonline.com/${OUTLOOK_TENANT_ID}/oauth2/v2.0/authorize?` +
    `client_id=${OUTLOOK_CLIENT_ID}` +
    `&response_type=code` +
    `&redirect_uri=${encodeURIComponent(OUTLOOK_REDIRECT_URI)}` +
    `&scope=${encodeURIComponent(scopes)}`;

  return authUrl;
};

/**
 * Exchange authorization code for access token
 */
export const exchangeCodeForToken = async (code) => {
  try {
    const response = await axios.post(
      `https://login.microsoftonline.com/${OUTLOOK_TENANT_ID}/oauth2/v2.0/token`,
      new URLSearchParams({
        client_id: OUTLOOK_CLIENT_ID,
        client_secret: OUTLOOK_CLIENT_SECRET,
        code: code,
        redirect_uri: OUTLOOK_REDIRECT_URI,
        grant_type: 'authorization_code'
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    );

    accessToken = response.data.access_token;
    refreshToken = response.data.refresh_token;
    tokenExpiry = Date.now() + (response.data.expires_in * 1000);

    logger.info('Outlook access token obtained');
    return {
      success: true,
      expiresIn: response.data.expires_in
    };
  } catch (error) {
    logger.error('Error exchanging code for token:', error.response?.data || error.message);
    throw new Error('Failed to obtain Outlook access token');
  }
};

/**
 * Refresh access token using refresh token
 */
export const refreshAccessToken = async () => {
  try {
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await axios.post(
      `https://login.microsoftonline.com/${OUTLOOK_TENANT_ID}/oauth2/v2.0/token`,
      new URLSearchParams({
        client_id: OUTLOOK_CLIENT_ID,
        client_secret: OUTLOOK_CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    );

    accessToken = response.data.access_token;
    refreshToken = response.data.refresh_token || refreshToken;
    tokenExpiry = Date.now() + (response.data.expires_in * 1000);

    logger.info('Outlook access token refreshed');
    return true;
  } catch (error) {
    logger.error('Error refreshing token:', error.response?.data || error.message);
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
    throw new Error('Outlook not authenticated. Please authenticate first.');
  }

  // Refresh token if it expires in less than 5 minutes
  if (tokenExpiry && Date.now() > (tokenExpiry - 300000)) {
    const refreshed = await refreshAccessToken();
    if (!refreshed) {
      throw new Error('Failed to refresh Outlook token. Re-authentication required.');
    }
  }
};

/**
 * Send email via Outlook
 */
export const sendEmail = async (emailData) => {
  try {
    await ensureValidToken();

    const { to, subject, body, cc = null, bcc = null, attachments = null } = emailData;

    // Build email message
    const message = {
      subject: subject,
      body: {
        contentType: 'HTML',
        content: body
      },
      toRecipients: Array.isArray(to) ? to.map(email => ({ emailAddress: { address: email } })) : [{ emailAddress: { address: to } }]
    };

    if (cc) {
      message.ccRecipients = Array.isArray(cc) ? cc.map(email => ({ emailAddress: { address: email } })) : [{ emailAddress: { address: cc } }];
    }

    if (bcc) {
      message.bccRecipients = Array.isArray(bcc) ? bcc.map(email => ({ emailAddress: { address: email } })) : [{ emailAddress: { address: bcc } }];
    }

    if (attachments && attachments.length > 0) {
      message.attachments = attachments.map(att => ({
        '@odata.type': '#microsoft.graph.fileAttachment',
        name: att.name,
        contentBytes: att.content, // Base64 encoded
        contentType: att.contentType || 'application/octet-stream'
      }));
    }

    // Send email
    const response = await axios.post(
      `${GRAPH_API_BASE}/me/sendMail`,
      {
        message: message,
        saveToSentItems: true
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    logger.info('Email sent via Outlook:', { to, subject });
    return {
      success: true,
      messageId: response.headers['request-id'] || `OUTLOOK-${Date.now()}`,
      method: 'outlook'
    };
  } catch (error) {
    logger.error('Error sending email via Outlook:', error.response?.data || error.message);
    throw new Error(`Outlook email send failed: ${error.response?.data?.error?.message || error.message}`);
  }
};

/**
 * Send email with template
 */
export const sendTemplateEmail = async (to, templateName, variables) => {
  // This would fetch the template from database and populate variables
  // For now, basic implementation
  const subject = variables.subject || 'Melding fra ChiroClickCRM';
  const body = `
    <html>
      <body>
        <p>Hei ${variables.patient_name || ''},</p>
        <p>${variables.message || ''}</p>
        <p>Med vennlig hilsen,<br>${variables.clinic_name || 'ChiroClickCRM'}</p>
      </body>
    </html>
  `;

  return await sendEmail({ to, subject, body });
};

/**
 * Get user profile (for verification)
 */
export const getUserProfile = async () => {
  try {
    await ensureValidToken();

    const response = await axios.get(`${GRAPH_API_BASE}/me`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    return {
      email: response.data.mail || response.data.userPrincipalName,
      displayName: response.data.displayName,
      id: response.data.id
    };
  } catch (error) {
    logger.error('Error getting user profile:', error);
    return null;
  }
};

/**
 * Get inbox messages (for receiving replies)
 */
export const getInboxMessages = async (top = 10, filter = null) => {
  try {
    await ensureValidToken();

    let url = `${GRAPH_API_BASE}/me/mailFolders/inbox/messages?$top=${top}&$select=id,subject,from,receivedDateTime,bodyPreview,isRead`;

    if (filter) {
      url += `&$filter=${filter}`;
    }

    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    return response.data.value || [];
  } catch (error) {
    logger.error('Error getting inbox messages:', error);
    return [];
  }
};

/**
 * Check Outlook connection status
 */
export const checkConnection = async () => {
  try {
    if (!accessToken) {
      return {
        connected: false,
        authenticated: false,
        message: 'Not authenticated'
      };
    }

    const profile = await getUserProfile();
    if (profile) {
      return {
        connected: true,
        authenticated: true,
        email: profile.email,
        displayName: profile.displayName
      };
    } else {
      return {
        connected: false,
        authenticated: false,
        message: 'Token invalid'
      };
    }
  } catch (error) {
    return {
      connected: false,
      authenticated: false,
      message: error.message
    };
  }
};

/**
 * Set tokens manually (for persistence across restarts)
 */
export const setTokens = (tokens) => {
  accessToken = tokens.accessToken;
  refreshToken = tokens.refreshToken;
  tokenExpiry = tokens.tokenExpiry;
};

/**
 * Get tokens (for persistence)
 */
export const getTokens = () => {
  return {
    accessToken,
    refreshToken,
    tokenExpiry
  };
};

export default {
  getAuthorizationUrl,
  exchangeCodeForToken,
  refreshAccessToken,
  sendEmail,
  sendTemplateEmail,
  getUserProfile,
  getInboxMessages,
  checkConnection,
  setTokens,
  getTokens
};
