/**
 * Contact Sync Service
 *
 * Synchronization layer for external contact sources:
 * - Google Contacts (via Google People API)
 * - Windows Phone / Microsoft Contacts (via Microsoft Graph API)
 * - VCF/vCard import/export
 *
 * Features:
 * - OAuth2 authentication for Google and Microsoft
 * - Two-way sync with conflict resolution
 * - Contact import wizard
 * - Duplicate detection
 * - Norwegian name/phone formatting
 */

// Storage keys
const STORAGE_KEYS = {
  GOOGLE_TOKEN: 'chiroclick_google_token',
  MICROSOFT_TOKEN: 'chiroclick_microsoft_token',
  SYNC_CONFIG: 'chiroclick_sync_config',
  LAST_SYNC: 'chiroclick_last_sync',
};

// Sync providers
export const SYNC_PROVIDERS = {
  GOOGLE: {
    id: 'google',
    name: 'Google Contacts',
    icon: '🔵',
    color: 'blue',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    apiUrl: 'https://people.googleapis.com/v1',
    scopes: ['https://www.googleapis.com/auth/contacts.readonly'],
  },
  MICROSOFT: {
    id: 'microsoft',
    name: 'Microsoft/Windows Phone',
    icon: '🟦',
    color: 'cyan',
    authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    apiUrl: 'https://graph.microsoft.com/v1.0',
    scopes: ['Contacts.Read'],
  },
};

// Default sync configuration
const DEFAULT_CONFIG = {
  enabled: false,
  providers: [],
  autoSync: false,
  syncInterval: 24, // hours
  lastSync: null,
  conflictResolution: 'ask', // 'ask', 'prefer_local', 'prefer_remote'
};

// =============================================================================
// CONFIGURATION
// =============================================================================

/**
 * Get sync configuration
 */
export function getSyncConfig() {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.SYNC_CONFIG);
    return stored ? { ...DEFAULT_CONFIG, ...JSON.parse(stored) } : DEFAULT_CONFIG;
  } catch (e) {
    return DEFAULT_CONFIG;
  }
}

/**
 * Save sync configuration
 */
export function saveSyncConfig(config) {
  try {
    localStorage.setItem(STORAGE_KEYS.SYNC_CONFIG, JSON.stringify(config));
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Check if a provider is connected
 */
export function isProviderConnected(providerId) {
  const tokenKey =
    providerId === 'google' ? STORAGE_KEYS.GOOGLE_TOKEN : STORAGE_KEYS.MICROSOFT_TOKEN;
  const token = localStorage.getItem(tokenKey);

  if (!token) {
    return false;
  }

  try {
    const parsed = JSON.parse(token);
    // Check if token is expired
    if (parsed.expiresAt && new Date(parsed.expiresAt) < new Date()) {
      return false;
    }
    return true;
  } catch (e) {
    return false;
  }
}

// =============================================================================
// OAUTH AUTHENTICATION
// =============================================================================

/**
 * Generate OAuth URL for provider
 */
export function getOAuthUrl(providerId, clientId, redirectUri) {
  const provider = SYNC_PROVIDERS[providerId.toUpperCase()];
  if (!provider) {
    throw new Error('Unknown provider');
  }

  const state = generateRandomState();
  localStorage.setItem('oauth_state', state);

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: provider.scopes.join(' '),
    state,
    access_type: 'offline',
    prompt: 'consent',
  });

  return `${provider.authUrl}?${params.toString()}`;
}

/**
 * Handle OAuth callback
 */
export async function handleOAuthCallback(providerId, code, clientId, clientSecret, redirectUri) {
  const provider = SYNC_PROVIDERS[providerId.toUpperCase()];
  if (!provider) {
    throw new Error('Unknown provider');
  }

  // Exchange code for token
  // In production, this should go through your backend to protect the client secret
  const tokenResponse = await fetch(provider.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  const tokenData = await tokenResponse.json();

  if (tokenData.error) {
    throw new Error(tokenData.error_description || tokenData.error);
  }

  // Store token
  const tokenKey =
    providerId === 'google' ? STORAGE_KEYS.GOOGLE_TOKEN : STORAGE_KEYS.MICROSOFT_TOKEN;
  const tokenInfo = {
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token,
    expiresAt: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
  };

  localStorage.setItem(tokenKey, JSON.stringify(tokenInfo));

  return tokenInfo;
}

/**
 * Disconnect provider
 */
export function disconnectProvider(providerId) {
  const tokenKey =
    providerId === 'google' ? STORAGE_KEYS.GOOGLE_TOKEN : STORAGE_KEYS.MICROSOFT_TOKEN;
  localStorage.removeItem(tokenKey);
}

// =============================================================================
// CONTACT FETCHING
// =============================================================================

/**
 * Fetch contacts from Google
 */
export async function fetchGoogleContacts() {
  const tokenData = getToken('google');
  if (!tokenData) {
    throw new Error('Not authenticated with Google');
  }

  const response = await fetch(
    `${SYNC_PROVIDERS.GOOGLE.apiUrl}/people/me/connections?personFields=names,emailAddresses,phoneNumbers,addresses,birthdays&pageSize=1000`,
    {
      headers: {
        Authorization: `Bearer ${tokenData.accessToken}`,
      },
    }
  );

  if (!response.ok) {
    if (response.status === 401) {
      // Token expired, try refresh
      throw new Error('Token expired');
    }
    throw new Error('Failed to fetch contacts');
  }

  const data = await response.json();

  return (data.connections || []).map((contact) => parseGoogleContact(contact));
}

/**
 * Fetch contacts from Microsoft
 */
export async function fetchMicrosoftContacts() {
  const tokenData = getToken('microsoft');
  if (!tokenData) {
    throw new Error('Not authenticated with Microsoft');
  }

  const response = await fetch(`${SYNC_PROVIDERS.MICROSOFT.apiUrl}/me/contacts?$top=1000`, {
    headers: {
      Authorization: `Bearer ${tokenData.accessToken}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Token expired');
    }
    throw new Error('Failed to fetch contacts');
  }

  const data = await response.json();

  return (data.value || []).map((contact) => parseMicrosoftContact(contact));
}

/**
 * Fetch contacts from all connected providers
 */
export async function fetchAllContacts() {
  const results = {
    google: [],
    microsoft: [],
    errors: [],
  };

  if (isProviderConnected('google')) {
    try {
      results.google = await fetchGoogleContacts();
    } catch (e) {
      results.errors.push({ provider: 'google', error: e.message });
    }
  }

  if (isProviderConnected('microsoft')) {
    try {
      results.microsoft = await fetchMicrosoftContacts();
    } catch (e) {
      results.errors.push({ provider: 'microsoft', error: e.message });
    }
  }

  // Combine and deduplicate
  const combined = [...results.google, ...results.microsoft];
  results.combined = deduplicateContacts(combined);

  return results;
}

// =============================================================================
// CONTACT PARSING
// =============================================================================

/**
 * Parse Google contact to standard format
 */
function parseGoogleContact(contact) {
  const name = contact.names?.[0] || {};
  const email = contact.emailAddresses?.[0]?.value || '';
  const phone = contact.phoneNumbers?.[0]?.value || '';
  const address = contact.addresses?.[0] || {};
  const birthday = contact.birthdays?.[0]?.date || null;

  return {
    externalId: contact.resourceName,
    source: 'google',
    first_name: name.givenName || '',
    last_name: name.familyName || '',
    email,
    phone: formatPhoneForImport(phone),
    address: address.streetAddress || '',
    city: address.city || '',
    postal_code: address.postalCode || '',
    country: address.country || 'Norway',
    date_of_birth: birthday
      ? `${birthday.year}-${String(birthday.month).padStart(2, '0')}-${String(birthday.day).padStart(2, '0')}`
      : null,
    raw: contact,
  };
}

/**
 * Parse Microsoft contact to standard format
 */
function parseMicrosoftContact(contact) {
  const address = contact.homeAddress || contact.businessAddress || {};

  return {
    externalId: contact.id,
    source: 'microsoft',
    first_name: contact.givenName || '',
    last_name: contact.surname || '',
    email: contact.emailAddresses?.[0]?.address || '',
    phone: formatPhoneForImport(contact.mobilePhone || contact.homePhones?.[0] || ''),
    address: address.street || '',
    city: address.city || '',
    postal_code: address.postalCode || '',
    country: address.countryOrRegion || 'Norway',
    date_of_birth: contact.birthday ? contact.birthday.split('T')[0] : null,
    raw: contact,
  };
}

/**
 * Format phone number for import (Norwegian format)
 */
function formatPhoneForImport(phone) {
  if (!phone) {
    return '';
  }

  // Remove all non-digits except +
  const cleaned = phone.replace(/[^\d+]/g, '');

  // Ensure Norwegian country code
  if (cleaned.startsWith('+47')) {
    return cleaned;
  } else if (cleaned.startsWith('47') && cleaned.length === 10) {
    return `+${cleaned}`;
  } else if (cleaned.length === 8 && !cleaned.startsWith('+')) {
    return `+47${cleaned}`;
  }

  return phone;
}

// =============================================================================
// DUPLICATE DETECTION
// =============================================================================

/**
 * Deduplicate contacts by phone/email
 */
function deduplicateContacts(contacts) {
  const seen = new Map();

  return contacts.filter((contact) => {
    // Create unique key from phone and email
    const key = `${contact.phone}_${contact.email}`.toLowerCase();

    if (seen.has(key)) {
      // Merge info from duplicate
      const existing = seen.get(key);
      existing.sources = existing.sources || [existing.source];
      existing.sources.push(contact.source);
      return false;
    }

    seen.set(key, contact);
    return true;
  });
}

/**
 * Find potential duplicates with existing patients
 */
export function findDuplicates(importedContact, existingPatients) {
  const duplicates = [];

  for (const patient of existingPatients) {
    let score = 0;

    // Phone match (strong indicator)
    if (importedContact.phone && patient.phone) {
      const normalizedImport = importedContact.phone.replace(/\D/g, '');
      const normalizedExisting = patient.phone.replace(/\D/g, '');
      if (
        normalizedImport.endsWith(normalizedExisting) ||
        normalizedExisting.endsWith(normalizedImport)
      ) {
        score += 50;
      }
    }

    // Email match (strong indicator)
    if (importedContact.email && patient.email) {
      if (importedContact.email.toLowerCase() === patient.email.toLowerCase()) {
        score += 50;
      }
    }

    // Name match
    if (importedContact.first_name && patient.first_name) {
      if (importedContact.first_name.toLowerCase() === patient.first_name.toLowerCase()) {
        score += 20;
      }
    }

    if (importedContact.last_name && patient.last_name) {
      if (importedContact.last_name.toLowerCase() === patient.last_name.toLowerCase()) {
        score += 20;
      }
    }

    if (score >= 50) {
      duplicates.push({ patient, score });
    }
  }

  return duplicates.sort((a, b) => b.score - a.score);
}

// =============================================================================
// VCF/VCARD IMPORT/EXPORT
// =============================================================================

/**
 * Parse VCF file content
 */
export function parseVCF(vcfContent) {
  const contacts = [];
  const cards = vcfContent.split('END:VCARD');

  for (const card of cards) {
    if (!card.includes('BEGIN:VCARD')) {
      continue;
    }

    const contact = {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      address: '',
      source: 'vcf',
    };

    // Parse name
    const nameMatch = card.match(/N:([^;]*);([^;\r\n]*)/);
    if (nameMatch) {
      contact.last_name = nameMatch[1] || '';
      contact.first_name = nameMatch[2] || '';
    }

    // Parse email
    const emailMatch = card.match(/EMAIL[^:]*:([^\r\n]+)/);
    if (emailMatch) {
      contact.email = emailMatch[1];
    }

    // Parse phone
    const phoneMatch = card.match(/TEL[^:]*:([^\r\n]+)/);
    if (phoneMatch) {
      contact.phone = formatPhoneForImport(phoneMatch[1]);
    }

    // Parse address
    const addrMatch = card.match(/ADR[^:]*:([^\r\n]+)/);
    if (addrMatch) {
      const parts = addrMatch[1].split(';');
      contact.address = parts[2] || '';
      contact.city = parts[3] || '';
      contact.postal_code = parts[5] || '';
      contact.country = parts[6] || 'Norway';
    }

    if (contact.first_name || contact.last_name || contact.email || contact.phone) {
      contacts.push(contact);
    }
  }

  return contacts;
}

/**
 * Export contacts to VCF format
 */
export function exportToVCF(contacts) {
  const vcfCards = contacts.map((contact) => {
    const lines = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `N:${contact.last_name || ''};${contact.first_name || ''};;;`,
      `FN:${contact.first_name || ''} ${contact.last_name || ''}`.trim(),
    ];

    if (contact.email) {
      lines.push(`EMAIL:${contact.email}`);
    }

    if (contact.phone) {
      lines.push(`TEL;TYPE=CELL:${contact.phone}`);
    }

    if (contact.address || contact.city || contact.postal_code) {
      lines.push(
        `ADR:;;${contact.address || ''};${contact.city || ''};;${contact.postal_code || ''};${contact.country || 'Norway'}`
      );
    }

    if (contact.date_of_birth) {
      lines.push(`BDAY:${contact.date_of_birth.replace(/-/g, '')}`);
    }

    lines.push('END:VCARD');

    return lines.join('\r\n');
  });

  return vcfCards.join('\r\n');
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get stored token for provider
 */
function getToken(providerId) {
  const tokenKey =
    providerId === 'google' ? STORAGE_KEYS.GOOGLE_TOKEN : STORAGE_KEYS.MICROSOFT_TOKEN;
  const stored = localStorage.getItem(tokenKey);

  if (!stored) {
    return null;
  }

  try {
    return JSON.parse(stored);
  } catch (e) {
    return null;
  }
}

/**
 * Generate random state for OAuth
 */
function generateRandomState() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  // Configuration
  getSyncConfig,
  saveSyncConfig,
  isProviderConnected,

  // OAuth
  getOAuthUrl,
  handleOAuthCallback,
  disconnectProvider,

  // Fetching
  fetchGoogleContacts,
  fetchMicrosoftContacts,
  fetchAllContacts,

  // Duplicates
  findDuplicates,

  // VCF
  parseVCF,
  exportToVCF,

  // Constants
  SYNC_PROVIDERS,
};
