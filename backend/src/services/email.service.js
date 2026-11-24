import nodemailer from 'nodemailer';
import { logger } from '../config/logger.js';

let transporter = null;

const createTransporter = () => {
  if (transporter) return transporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  const isDummySmtp =
    !SMTP_HOST ||
    !SMTP_USER ||
    !SMTP_PASS ||
    SMTP_USER.includes('example.com') ||
    SMTP_PASS.includes('ethereal_pass');

  if (!isDummySmtp) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: parseInt(SMTP_PORT || '587', 10),
      secure: SMTP_PORT === '465',
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });
    logger.info(`Nodemailer configured with live SMTP host: ${SMTP_HOST}`);
  } else {
    // Development / Test JSON transport that captures sent messages without failing
    transporter = nodemailer.createTransport({
      jsonTransport: true,
    });
    logger.info('Nodemailer initialized in Mock/Dev mode (captured internally, no external SMTP connection).');
  }

  return transporter;
};

export const emailService = {
  async sendEmail({ to, subject, html, text }) {
    try {
      const mailer = createTransporter();
      const from = process.env.EMAIL_FROM || process.env.SMTP_FROM || '"LIFORA Blood Donation Network" <alerts@lifora.org>';

      const info = await mailer.sendMail({
        from,
        to,
        subject,
        text,
        html,
      });

      logger.info(`Email dispatched to ${to}. MessageId: ${info.messageId || 'DEV_MOCK_ID'}`);
      return { success: true, messageId: info.messageId || 'DEV_MOCK_ID' };
    } catch (error) {
      logger.error(`Failed to send email to ${to}: ${error.message}`);
      // In development / test, ensure mock fallback so business flow never halts
      if (process.env.NODE_ENV !== 'production') {
        return { success: true, messageId: 'DEV_FALLBACK_ID', warning: error.message };
      }
      return { success: false, error: error.message };
    }
  },

  // 1. Emergency Blood Request Alert to Matching Donors
  async sendEmergencyBloodAlert({ donorEmail, donorName, bloodGroup, unitsRequired, urgency, location, trackingCode }) {
    const subject = `[URGENT LIFORA ALERT] Critical Blood Needed: ${bloodGroup} at ${location}`;
    const trackingUrl = `https://lifora.org/track/${trackingCode}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #fee2e2; border-radius: 8px;">
        <div style="background-color: #dc2626; color: white; padding: 12px 20px; border-radius: 6px; text-align: center;">
          <h2 style="margin: 0;">LIFORA EMERGENCY BLOOD ALERT</h2>
        </div>
        <p style="margin-top: 20px;">Dear <strong>${donorName}</strong>,</p>
        <p>A high-priority requisition matching your blood group (<strong>${bloodGroup}</strong>) has just been broadcast:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Blood Group:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee; color: #dc2626; font-weight: bold;">${bloodGroup}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Required Units:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${unitsRequired} Unit(s)</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Urgency Level:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${urgency}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Location:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${location}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Tracking Code:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee; font-family: monospace;">${trackingCode}</td></tr>
        </table>
        <div style="text-align: center; margin: 25px 0;">
          <a href="${trackingUrl}" style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Details & Respond Now</a>
        </div>
        <p style="font-size: 12px; color: #6b7280; text-align: center;">Your prompt response can directly save a life. Thank you for being a registered LIFORA hero.</p>
      </div>
    `;

    return this.sendEmail({
      to: donorEmail,
      subject,
      html,
      text: `LIFORA EMERGENCY ALERT: Blood group ${bloodGroup} urgently needed at ${location}. Tracking: ${trackingCode}. Visit ${trackingUrl} to respond.`,
    });
  },

  // 2. Donor Blood Report Verification Outcome
  async sendReportVerificationResult({ donorEmail, donorName, status, rejectionReason }) {
    const isApproved = status.toUpperCase() === 'APPROVED' || status.toUpperCase() === 'VERIFIED';
    const subject = isApproved
      ? 'Congratulations! Your LIFORA Blood Group Verification is Approved'
      : 'Action Required: LIFORA Blood Group Verification Update';

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <div style="background-color: ${isApproved ? '#059669' : '#d97706'}; color: white; padding: 12px 20px; border-radius: 6px; text-align: center;">
          <h2 style="margin: 0;">Verification Status: ${status}</h2>
        </div>
        <p style="margin-top: 20px;">Dear <strong>${donorName}</strong>,</p>
        ${
          isApproved
            ? '<p>Your uploaded laboratory blood report has been clinically verified by authorized hospital medical personnel. You have earned the <strong>Verified Donor Badge</strong> on the LIFORA network.</p>'
            : `<p>Your uploaded medical document could not be verified. <strong>Reason:</strong> ${rejectionReason || 'Document details were unclear'}. Please log in to your donor portal to resubmit a clear diagnostic report.</p>`
        }
        <div style="text-align: center; margin: 25px 0;">
          <a href="https://lifora.org/donor/profile" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Go to Donor Portal</a>
        </div>
      </div>
    `;

    return this.sendEmail({
      to: donorEmail,
      subject,
      html,
      text: `Dear ${donorName}, your LIFORA blood report verification status is: ${status}. ${!isApproved ? 'Reason: ' + rejectionReason : ''}`,
    });
  },

  // 3. Request Fulfilled Notification to Recipient
  async sendRequestFulfilledEmail({ recipientEmail, recipientName, trackingCode, unitsFulfilled }) {
    const subject = `[LIFORA] Blood Request ${trackingCode} Has Been Fulfilled!`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #10b981; border-radius: 8px;">
        <div style="background-color: #059669; color: white; padding: 12px 20px; border-radius: 6px; text-align: center;">
          <h2 style="margin: 0;">Requisition Fulfilled</h2>
        </div>
        <p style="margin-top: 20px;">Dear <strong>${recipientName}</strong>,</p>
        <p>Great news! All required blood units (${unitsFulfilled} units) for request <strong>${trackingCode}</strong> have been successfully collected and secured.</p>
        <div style="text-align: center; margin: 25px 0;">
          <a href="https://lifora.org/track/${trackingCode}" style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Tracking Summary</a>
        </div>
        <p style="font-size: 12px; color: #6b7280; text-align: center;">We wish the patient a swift and complete recovery. - The LIFORA Team</p>
      </div>
    `;

    return this.sendEmail({
      to: recipientEmail,
      subject,
      html,
      text: `Dear ${recipientName}, your LIFORA blood request ${trackingCode} has been completely fulfilled with ${unitsFulfilled} units collected.`,
    });
  },
};
