/**
 * Email Provider Abstraction
 * Factory pattern for email sending — supports mock, outlook, smtp providers
 */

import logger from '../../utils/logger.js';

/**
 * MockEmailProvider — logs to console and writes to DB
 * Used in DESKTOP_MODE or when no real email provider is configured
 */
class MockEmailProvider {
  constructor() {
    this.name = 'mock';
  }

  async send(emailData) {
    const { to, subject, body } = emailData;
    logger.info('[MockEmail] Would send email', {
      to,
      subject,
      bodyLength: body?.length || 0,
    });

    return {
      success: true,
      method: 'mock',
      messageId: `MOCK-EMAIL-${Date.now()}`,
    };
  }

  async checkConnection() {
    return {
      connected: true,
      authenticated: true,
      message: 'Mock provider always connected',
    };
  }
}

/**
 * OutlookEmailProvider — wraps existing outlookBridge.js
 */
class OutlookEmailProvider {
  constructor() {
    this.name = 'outlook';
    this._bridge = null;
  }

  async _loadBridge() {
    if (!this._bridge) {
      this._bridge = await import('../outlookBridge.js');
    }
    return this._bridge;
  }

  async send(emailData) {
    const bridge = await this._loadBridge();
    return await bridge.sendEmail(emailData);
  }

  async checkConnection() {
    const bridge = await this._loadBridge();
    return await bridge.checkConnection();
  }
}

/**
 * SmtpEmailProvider — uses nodemailer for direct SMTP
 */
class SmtpEmailProvider {
  constructor() {
    this.name = 'smtp';
    this._transporter = null;
  }

  async _getTransporter() {
    if (!this._transporter) {
      const nodemailer = await import('nodemailer');
      this._transporter = nodemailer.default.createTransport({
        host: process.env.SMTP_HOST || 'localhost',
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_SECURE === 'true',
        auth: process.env.SMTP_USER
          ? {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS || '',
            }
          : undefined,
      });
    }
    return this._transporter;
  }

  async send(emailData) {
    const { to, subject, body, cc, bcc } = emailData;
    const transporter = await this._getTransporter();

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@chiroclickcrm.no',
      to: Array.isArray(to) ? to.join(', ') : to,
      cc: cc || undefined,
      bcc: bcc || undefined,
      subject,
      html: body,
    });

    logger.info('Email sent via SMTP', { messageId: info.messageId, to });

    return {
      success: true,
      method: 'smtp',
      messageId: info.messageId,
    };
  }

  async checkConnection() {
    try {
      const transporter = await this._getTransporter();
      await transporter.verify();
      return {
        connected: true,
        authenticated: true,
        message: 'SMTP connection verified',
      };
    } catch (error) {
      logger.error('SMTP connection check failed:', error.message);
      return {
        connected: false,
        authenticated: false,
        message: error.message,
      };
    }
  }
}

/**
 * Factory function to create the appropriate email provider
 */
export function createEmailProvider(type) {
  switch (type) {
    case 'mock':
      return new MockEmailProvider();
    case 'outlook':
      return new OutlookEmailProvider();
    case 'smtp':
      return new SmtpEmailProvider();
    default:
      logger.warn(`Unknown email provider type "${type}", defaulting to mock`);
      return new MockEmailProvider();
  }
}

export { MockEmailProvider, OutlookEmailProvider, SmtpEmailProvider };
