/**
 * SMS Provider Abstraction
 * Factory pattern for SMS sending — supports mock, phoneBridge providers
 */

import logger from '../../utils/logger.js';
// database query available via ../../config/database.js

/**
 * MockSmsProvider — logs to console and writes to DB
 * Used in DESKTOP_MODE or when no real SMS provider is configured
 */
class MockSmsProvider {
  constructor() {
    this.name = 'mock';
  }

  async send(phoneNumber, message) {
    const formattedNumber = this._formatNumber(phoneNumber);
    logger.info('[MockSMS] Would send SMS', {
      to: formattedNumber,
      messageLength: message.length,
      preview: message.substring(0, 50),
    });

    return {
      success: true,
      method: 'mock',
      externalId: `MOCK-SMS-${Date.now()}`,
      pendingApproval: false,
    };
  }

  async checkConnection() {
    return {
      method: 'mock',
      connected: true,
      message: 'Mock provider always connected',
    };
  }

  _formatNumber(phoneNumber) {
    const clean = phoneNumber.replace(/\s/g, '');
    return clean.startsWith('+47') ? clean : `+47${clean}`;
  }
}

/**
 * PhoneBridgeSmsProvider — wraps existing phoneBridge.js
 */
class PhoneBridgeSmsProvider {
  constructor() {
    this.name = 'phonebridge';
    this._bridge = null;
  }

  async _loadBridge() {
    if (!this._bridge) {
      this._bridge = await import('../phoneBridge.js');
    }
    return this._bridge;
  }

  async send(phoneNumber, message) {
    const bridge = await this._loadBridge();
    return await bridge.sendSMS(phoneNumber, message);
  }

  async checkConnection() {
    const bridge = await this._loadBridge();
    return await bridge.checkPhoneConnection();
  }
}

/**
 * Factory function to create the appropriate SMS provider
 */
export function createSmsProvider(type) {
  switch (type) {
    case 'mock':
      return new MockSmsProvider();
    case 'phonebridge':
      return new PhoneBridgeSmsProvider();
    default:
      logger.warn(`Unknown SMS provider type "${type}", defaulting to mock`);
      return new MockSmsProvider();
  }
}

export { MockSmsProvider, PhoneBridgeSmsProvider };
