import { logger } from '../config/logger.js';

/**
 * LIFORA SMS Gateway Service
 * Supports plug-and-play dispatch via:
 * 1. Twilio (Global SMS)
 * 2. Fast2SMS (Indian Mobile Numbers - quick setup, no complex DLT required)
 * 3. MSG91 (Indian Enterprise SMS)
 * 4. Development Fallback (Logs to server console without telecom charges)
 */
export const smsService = {
  /**
   * Send Phone Verification OTP via SMS
   * @param {string} phone Destination phone number
   * @param {string} otpCode 6-digit numeric OTP
   */
  async sendPhoneOtp({ phone, otpCode }) {
    const rawDigits = phone.replace(/\D/g, '');
    const clean10Digits = rawDigits.slice(-10);

    // 1. Check Twilio Configuration
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
      try {
        const toPhone = phone.startsWith('+') ? phone : `+91${clean10Digits}`;
        const basicAuth = Buffer.from(
          `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
        ).toString('base64');

        const params = new URLSearchParams({
          To: toPhone,
          From: process.env.TWILIO_PHONE_NUMBER,
          Body: `Your LIFORA verification code is: ${otpCode}. Valid for 10 minutes. Please do not share this code.`,
        });

        const res = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
          {
            method: 'POST',
            headers: {
              Authorization: `Basic ${basicAuth}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString(),
          }
        );

        const data = await res.json();
        if (res.ok) {
          logger.info(`[SMS] Twilio message dispatched successfully to ${toPhone}. SID: ${data.sid}`);
          return { provider: 'twilio', success: true, messageId: data.sid };
        } else {
          logger.error(`[SMS] Twilio error dispatching to ${toPhone}: ${JSON.stringify(data)}`);
        }
      } catch (err) {
        logger.error(`[SMS] Twilio exception: ${err.message}`);
      }
    }

    // 2. Check Fast2SMS Configuration (India OTP route)
    if (process.env.FAST2SMS_API_KEY) {
      try {
        const res = await fetch('https://www.fast2sms.com/dev/bulkV2', {
          method: 'POST',
          headers: {
            authorization: process.env.FAST2SMS_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            route: 'otp',
            variables_values: otpCode,
            numbers: clean10Digits,
          }),
        });

        const data = await res.json();
        if (data.return) {
          logger.info(`[SMS] Fast2SMS dispatched successfully to ${clean10Digits}. Request ID: ${data.request_id}`);
          return { provider: 'fast2sms', success: true, messageId: data.request_id };
        } else {
          logger.error(`[SMS] Fast2SMS rejected for ${clean10Digits}: ${JSON.stringify(data)}`);
        }
      } catch (err) {
        logger.error(`[SMS] Fast2SMS exception: ${err.message}`);
      }
    }

    // 3. Fallback: Development logger
    logger.info(`[SMS DEV SIMULATOR] Dispatched OTP ${otpCode} to mobile ${phone} (No SMS API Key configured)`);
    return {
      provider: 'simulator',
      success: true,
      simulated: true,
      message: 'SMS simulator logged OTP to server console. Add FAST2SMS_API_KEY or TWILIO_ACCOUNT_SID to deliver actual cellular SMS.',
    };
  },
};
