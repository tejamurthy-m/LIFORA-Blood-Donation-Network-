import { logger } from '../config/logger.js';
import { config } from '../config/environment.js';

/**
 * Normalizes a phone number into international E.164 format.
 * Defaults to India (+91) for 10-digit Indian numbers.
 * @param {string} phone
 * @returns {string} E.164 formatted phone number (e.g. +919876543210)
 */
export const normalizePhoneNumber = (phone) => {
  if (!phone || typeof phone !== 'string') {
    throw new Error('A valid phone number string is required.');
  }

  const trimmed = phone.trim();
  // Strip all non-digit characters except leading plus
  const hasLeadingPlus = trimmed.startsWith('+');
  const digitsOnly = trimmed.replace(/\D/g, '');

  if (!digitsOnly || digitsOnly.length < 8 || digitsOnly.length > 15) {
    throw new Error('Phone number must contain between 8 and 15 digits.');
  }

  if (hasLeadingPlus) {
    return `+${digitsOnly}`;
  }

  // Handle standard 10-digit Indian numbers
  if (digitsOnly.length === 10) {
    return `+91${digitsOnly}`;
  }

  // Handle 11-digit numbers starting with 0 (e.g. 09876543210 in India)
  if (digitsOnly.length === 11 && digitsOnly.startsWith('0')) {
    return `+91${digitsOnly.slice(1)}`;
  }

  // Handle 12-digit Indian numbers starting with 91
  if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
    return `+${digitsOnly}`;
  }

  // Fallback: prefix with +
  return `+${digitsOnly}`;
};

/**
 * Masks a phone number for privacy in logs and UI (e.g. +91 ******3210)
 * @param {string} phone
 * @returns {string}
 */
export const maskPhoneNumber = (phone) => {
  if (!phone) return '';
  const str = String(phone).trim();
  if (str.length <= 4) return '****';
  const lastFour = str.slice(-4);
  const prefix = str.startsWith('+') ? str.slice(0, 3) : '';
  return `${prefix} ******${lastFour}`;
};

/**
 * LIFORA Android SIM-Based SMS Gateway Service
 * Integrates directly with 'SMS Gateway for Android (SMS Gate)' local HTTP API:
 * Backend -> Local HTTP API (Basic Auth) -> Android Phone -> SIM -> Recipient
 */
export const smsService = {
  /**
   * Normalizes phone number using E.164 formatting
   */
  normalizePhoneNumber,

  /**
   * Masks phone number for display/logging
   */
  maskPhoneNumber,

  /**
   * Dispatches OTP via Android SIM SMS Gateway
   * @param {Object} params
   * @param {string} params.phone Destination mobile number
   * @param {string} params.otpCode 6-digit numeric OTP
   * @param {number} [params.expiryMinutes=5] Validity duration
   * @returns {Promise<{success: boolean, status: string, message: string, messageId?: string, simulated?: boolean}>}
   */
  async sendPhoneOtp({ phone, otpCode, expiryMinutes = 5 }) {
    const formattedPhone = normalizePhoneNumber(phone);
    const masked = maskPhoneNumber(formattedPhone);

    const gatewayUrl = config.smsGateway?.url;
    const username = config.smsGateway?.username;
    const password = config.smsGateway?.password;
    const isDemoMode = config.smsGateway?.demoMode === true;

    // Check Demo Mode or Missing Gateway Credentials
    if (isDemoMode || !gatewayUrl || !username || !password) {
      if (isDemoMode) {
        logger.info(`[SMS GATEWAY - DEMO MODE] OTP for ${masked} simulated. Gateway calls suppressed.`);
      } else {
        logger.warn(
          `[SMS GATEWAY - MOCK] No Android SMS Gateway configured at SMS_GATEWAY_URL. Simulating dispatch to ${masked}.`
        );
      }
      return {
        provider: 'android-sim-gateway-mock',
        success: true,
        status: 'simulated',
        simulated: true,
        message: 'Verification code has been queued for delivery (Demo/Simulated Mode).',
      };
    }

    const endpoint = `${gatewayUrl}/message`;
    const basicAuth = Buffer.from(`${username}:${password}`).toString('base64');
    const smsText = `LIFORA: ${otpCode}`;

    const payload = {
      textMessage: {
        text: smsText,
      },
      phoneNumbers: [formattedPhone],
      withDeliveryReport: false,
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000); // 8-second timeout for local network gateway

    try {
      logger.info(`[SMS GATEWAY] Dispatching OTP SMS to ${masked} via Android Gateway at ${gatewayUrl}`);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${basicAuth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (response.status === 401) {
        logger.error(`[SMS GATEWAY] HTTP 401 Unauthorized from Android SMS Gateway. Please check SMS_GATEWAY_USERNAME and SMS_GATEWAY_PASSWORD in backend/.env.`);
        throw new Error('SMS Gateway authentication failed. Please check gateway credentials on the host.');
      }

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        logger.error(`[SMS GATEWAY] Gateway responded with status ${response.status}: ${errorText}`);
        throw new Error(`SMS Gateway responded with error status ${response.status}.`);
      }

      const responseData = await response.json().catch(() => ({}));
      logger.info(`[SMS GATEWAY] Gateway accepted message for ${masked}. Response: ${JSON.stringify(responseData)}`);

      // Inspect response status reported by SMS Gate
      // SMS Gate response may return state "Pending", "Queued", "Sent", or an array of message states
      let deliveryState = 'queued';
      let messageId = responseData.id || responseData.messageId || (Array.isArray(responseData) ? responseData[0]?.id : null);

      if (responseData.state) {
        const stateLower = String(responseData.state).toLowerCase();
        if (stateLower.includes('sent')) deliveryState = 'sent';
        else if (stateLower.includes('fail') || stateLower.includes('reject')) deliveryState = 'failed';
        else deliveryState = 'queued';
      }

      if (deliveryState === 'failed') {
        logger.error(`[SMS GATEWAY] Gateway reported failed state for ${masked}: ${JSON.stringify(responseData)}`);
        throw new Error('SMS Gateway failed to send the message. Please check your SIM balance or signal.');
      }

      return {
        provider: 'android-sim-gateway',
        success: true,
        status: deliveryState,
        simulated: false,
        messageId: messageId ? String(messageId) : undefined,
        message:
          deliveryState === 'sent'
            ? 'Verification code sent via SMS.'
            : 'Verification code has been queued for delivery.',
      };
    } catch (err) {
      clearTimeout(timeout);

      if (err.name === 'AbortError') {
        logger.error(`[SMS GATEWAY] Timeout reaching Android Gateway at ${gatewayUrl}. Ensure phone is on same Wi-Fi and SMS Gate server is active.`);
        throw new Error('Connection to SMS Gateway timed out. Ensure your Android phone and laptop are on the same network.');
      }

      if (err.code === 'ECONNREFUSED' || err.message?.includes('ECONNREFUSED') || err.message?.includes('fetch failed')) {
        logger.error(`[SMS GATEWAY] Cannot connect to Android Gateway at ${gatewayUrl}. Connection refused.`);
        throw new Error('Cannot reach Android SMS Gateway. Check that SMS Gate server is running and the IP address is correct.');
      }

      logger.error(`[SMS GATEWAY] Failed to dispatch SMS to ${masked}: ${err.message}`);
      throw err;
    }
  },
};
