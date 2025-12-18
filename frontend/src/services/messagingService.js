/**
 * Messaging Service
 *
 * Two-way SMS and communication service layer.
 * Designed for Telnyx integration but abstracted for other providers.
 *
 * Features:
 * - Send SMS messages
 * - Receive and process incoming SMS
 * - Message templates with variable substitution
 * - Conversation history
 * - Delivery status tracking
 * - Norwegian phone number formatting
 */

// Storage keys
const STORAGE_KEYS = {
  CONFIG: 'chiroclick_messaging_config',
  CONVERSATIONS: 'chiroclick_conversations',
  TEMPLATES: 'chiroclick_message_templates',
};

// Default configuration
const DEFAULT_CONFIG = {
  provider: 'telnyx', // telnyx, twilio, mock
  apiKey: '',
  phoneNumber: '', // Clinic's phone number
  webhookUrl: '',
  enabled: false,
};

// Message statuses
export const MESSAGE_STATUS = {
  PENDING: 'pending',
  SENT: 'sent',
  DELIVERED: 'delivered',
  FAILED: 'failed',
  READ: 'read',
};

// =============================================================================
// CONFIGURATION
// =============================================================================

/**
 * Get messaging configuration
 */
export function getMessagingConfig() {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.CONFIG);
    return stored ? { ...DEFAULT_CONFIG, ...JSON.parse(stored) } : DEFAULT_CONFIG;
  } catch (e) {
    return DEFAULT_CONFIG;
  }
}

/**
 * Save messaging configuration
 */
export function saveMessagingConfig(config) {
  try {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Check if messaging is configured and enabled
 */
export function isMessagingEnabled() {
  const config = getMessagingConfig();
  return config.enabled && config.apiKey && config.phoneNumber;
}

// =============================================================================
// PHONE NUMBER FORMATTING
// =============================================================================

/**
 * Format phone number for Norwegian format
 */
export function formatNorwegianPhone(phone) {
  if (!phone) return '';

  // Remove all non-digits
  let digits = phone.replace(/\D/g, '');

  // Handle Norwegian numbers
  if (digits.startsWith('47')) {
    digits = digits.substring(2);
  } else if (digits.startsWith('0047')) {
    digits = digits.substring(4);
  }

  // Format as +47 XXX XX XXX
  if (digits.length === 8) {
    return `+47 ${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5)}`;
  }

  return phone;
}

/**
 * Normalize phone number for API calls (E.164 format)
 */
export function normalizePhone(phone, countryCode = '47') {
  if (!phone) return '';

  // Remove all non-digits
  let digits = phone.replace(/\D/g, '');

  // Add country code if not present
  if (!digits.startsWith('47') && !digits.startsWith('1')) {
    digits = countryCode + digits;
  }

  return '+' + digits;
}

// =============================================================================
// MESSAGE TEMPLATES
// =============================================================================

/**
 * Default message templates (bilingual)
 */
export const DEFAULT_TEMPLATES = {
  appointment_reminder: {
    id: 'appointment_reminder',
    name: { en: 'Appointment Reminder', no: 'Timepåminnelse' },
    content: {
      en: 'Hi {firstName}! This is a reminder of your appointment at {clinicName} on {date} at {time}. Reply YES to confirm or CANCEL to reschedule.',
      no: 'Hei {firstName}! Dette er en påminnelse om din time hos {clinicName} den {date} kl. {time}. Svar JA for å bekrefte eller AVBRYT for å endre.',
    },
  },
  appointment_confirmation: {
    id: 'appointment_confirmation',
    name: { en: 'Booking Confirmation', no: 'Bestillingsbekreftelse' },
    content: {
      en: 'Your appointment at {clinicName} is confirmed for {date} at {time}. See you then!',
      no: 'Din time hos {clinicName} er bekreftet for {date} kl. {time}. Vi sees!',
    },
  },
  waitlist_notification: {
    id: 'waitlist_notification',
    name: { en: 'Waitlist Notification', no: 'Ventelistevarsel' },
    content: {
      en: 'Good news, {firstName}! A spot has opened up at {clinicName} on {date} at {time}. Reply YES to book or NO to pass.',
      no: 'Gode nyheter, {firstName}! En time har blitt ledig hos {clinicName} den {date} kl. {time}. Svar JA for å bestille eller NEI for å avslå.',
    },
  },
  recall_reactivation: {
    id: 'recall_reactivation',
    name: { en: 'Reactivation', no: 'Reaktivering' },
    content: {
      en: "Hi {firstName}! It's been a while since your last visit to {clinicName}. We'd love to see you again. Reply YES to schedule.",
      no: 'Hei {firstName}! Det er en stund siden ditt siste besøk hos {clinicName}. Vi vil gjerne se deg igjen. Svar JA for å bestille.',
    },
  },
  recall_birthday: {
    id: 'recall_birthday',
    name: { en: 'Birthday Wishes', no: 'Bursdagshilsen' },
    content: {
      en: 'Happy Birthday, {firstName}! 🎂 From all of us at {clinicName}. Enjoy 20% off your next visit!',
      no: 'Gratulerer med dagen, {firstName}! 🎂 Fra oss alle på {clinicName}. Nyt 20% rabatt på ditt neste besøk!',
    },
  },
  custom: {
    id: 'custom',
    name: { en: 'Custom Message', no: 'Egendefinert melding' },
    content: {
      en: '{customMessage}',
      no: '{customMessage}',
    },
  },
};

/**
 * Get all message templates
 */
export function getMessageTemplates() {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.TEMPLATES);
    const custom = stored ? JSON.parse(stored) : {};
    return { ...DEFAULT_TEMPLATES, ...custom };
  } catch (e) {
    return DEFAULT_TEMPLATES;
  }
}

/**
 * Save custom message template
 */
export function saveMessageTemplate(template) {
  try {
    const templates = getMessageTemplates();
    templates[template.id] = template;
    localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(templates));
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Format message template with variables
 */
export function formatMessage(templateContent, variables = {}) {
  let message = templateContent;

  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`\\{${key}\\}`, 'g');
    message = message.replace(regex, value || '');
  });

  return message;
}

// =============================================================================
// SEND MESSAGES
// =============================================================================

/**
 * Send SMS message
 */
export async function sendSMS(to, message, options = {}) {
  const config = getMessagingConfig();

  if (!config.enabled) {
    console.warn('Messaging is not enabled');
    return { success: false, error: 'Messaging not enabled' };
  }

  const normalizedTo = normalizePhone(to);

  // Create message record
  const messageRecord = {
    id: Date.now().toString(),
    to: normalizedTo,
    from: config.phoneNumber,
    body: message,
    direction: 'outbound',
    status: MESSAGE_STATUS.PENDING,
    timestamp: new Date().toISOString(),
    ...options,
  };

  try {
    // In production, this would call the actual SMS API
    // For now, we'll simulate the send
    if (config.provider === 'mock' || !config.apiKey) {
      // Mock mode - simulate successful send
      console.log('[MOCK SMS]', { to: normalizedTo, message });
      messageRecord.status = MESSAGE_STATUS.SENT;

      // Store in conversation history
      storeMessage(messageRecord);

      return {
        success: true,
        messageId: messageRecord.id,
        message: messageRecord,
      };
    }

    // Real API call would go here
    const response = await callSMSAPI(config, normalizedTo, message);

    messageRecord.status = response.success ? MESSAGE_STATUS.SENT : MESSAGE_STATUS.FAILED;
    messageRecord.externalId = response.messageId;
    messageRecord.error = response.error;

    storeMessage(messageRecord);

    return {
      success: response.success,
      messageId: messageRecord.id,
      externalId: response.messageId,
      message: messageRecord,
    };
  } catch (error) {
    messageRecord.status = MESSAGE_STATUS.FAILED;
    messageRecord.error = error.message;
    storeMessage(messageRecord);

    return {
      success: false,
      error: error.message,
      message: messageRecord,
    };
  }
}

/**
 * Send bulk SMS messages
 */
export async function sendBulkSMS(recipients, template, variables = {}, language = 'en') {
  const results = [];

  for (const recipient of recipients) {
    const personalizedVars = {
      ...variables,
      firstName: recipient.first_name,
      lastName: recipient.last_name,
    };

    const content = typeof template === 'string'
      ? template
      : template.content?.[language] || template.content?.en;

    const message = formatMessage(content, personalizedVars);

    const result = await sendSMS(recipient.phone, message, {
      patientId: recipient.id,
      templateId: template.id,
    });

    results.push({
      recipient,
      ...result,
    });

    // Small delay between messages to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return results;
}

// =============================================================================
// CONVERSATION MANAGEMENT
// =============================================================================

/**
 * Store message in conversation history
 */
function storeMessage(message) {
  try {
    const conversations = getConversations();
    const phone = message.direction === 'inbound' ? message.from : message.to;

    if (!conversations[phone]) {
      conversations[phone] = {
        phone,
        messages: [],
        lastMessage: null,
        unreadCount: 0,
      };
    }

    conversations[phone].messages.push(message);
    conversations[phone].lastMessage = message;

    if (message.direction === 'inbound') {
      conversations[phone].unreadCount++;
    }

    localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(conversations));
  } catch (e) {
    console.error('Failed to store message:', e);
  }
}

/**
 * Get all conversations
 */
export function getConversations() {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
    return stored ? JSON.parse(stored) : {};
  } catch (e) {
    return {};
  }
}

/**
 * Get conversation for a specific phone number
 */
export function getConversation(phone) {
  const normalizedPhone = normalizePhone(phone);
  const conversations = getConversations();
  return conversations[normalizedPhone] || { phone: normalizedPhone, messages: [], unreadCount: 0 };
}

/**
 * Mark conversation as read
 */
export function markConversationRead(phone) {
  try {
    const conversations = getConversations();
    const normalizedPhone = normalizePhone(phone);

    if (conversations[normalizedPhone]) {
      conversations[normalizedPhone].unreadCount = 0;
      localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(conversations));
    }
  } catch (e) {
    console.error('Failed to mark conversation read:', e);
  }
}

/**
 * Get total unread count across all conversations
 */
export function getTotalUnreadCount() {
  const conversations = getConversations();
  return Object.values(conversations).reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
}

// =============================================================================
// API CALLS (Provider-specific)
// =============================================================================

/**
 * Call SMS API (Telnyx implementation)
 * In production, this would be a real API call
 */
async function callSMSAPI(config, to, message) {
  // This is a placeholder for the actual Telnyx API call
  // In production, this would be:
  // POST https://api.telnyx.com/v2/messages
  // with proper authentication and payload

  if (config.provider === 'telnyx') {
    // Simulated Telnyx API call structure
    /*
    const response = await fetch('https://api.telnyx.com/v2/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        from: config.phoneNumber,
        to: to,
        text: message,
      }),
    });

    const data = await response.json();
    return {
      success: response.ok,
      messageId: data.data?.id,
      error: data.errors?.[0]?.detail,
    };
    */
  }

  // Mock response for development
  return {
    success: true,
    messageId: 'mock_' + Date.now(),
  };
}

/**
 * Process incoming SMS webhook
 */
export function processIncomingSMS(webhookPayload) {
  // Parse webhook payload (format depends on provider)
  const message = {
    id: webhookPayload.id || Date.now().toString(),
    from: webhookPayload.from,
    to: webhookPayload.to,
    body: webhookPayload.text || webhookPayload.body,
    direction: 'inbound',
    status: MESSAGE_STATUS.DELIVERED,
    timestamp: webhookPayload.received_at || new Date().toISOString(),
  };

  storeMessage(message);

  // Check for auto-reply keywords
  const autoReply = checkAutoReply(message.body);

  return {
    message,
    autoReply,
  };
}

/**
 * Check for auto-reply keywords
 */
function checkAutoReply(messageBody) {
  const body = messageBody.toLowerCase().trim();

  const keywords = {
    confirm: ['yes', 'ja', 'confirm', 'bekreft', 'ok'],
    cancel: ['no', 'nei', 'cancel', 'avbryt', 'stop'],
    help: ['help', 'hjelp', 'info'],
  };

  for (const [action, words] of Object.entries(keywords)) {
    if (words.some((word) => body === word || body.startsWith(word + ' '))) {
      return { action, originalMessage: messageBody };
    }
  }

  return null;
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  // Configuration
  getMessagingConfig,
  saveMessagingConfig,
  isMessagingEnabled,

  // Phone formatting
  formatNorwegianPhone,
  normalizePhone,

  // Templates
  getMessageTemplates,
  saveMessageTemplate,
  formatMessage,
  DEFAULT_TEMPLATES,

  // Sending
  sendSMS,
  sendBulkSMS,

  // Conversations
  getConversations,
  getConversation,
  markConversationRead,
  getTotalUnreadCount,

  // Webhooks
  processIncomingSMS,

  // Constants
  MESSAGE_STATUS,
};
