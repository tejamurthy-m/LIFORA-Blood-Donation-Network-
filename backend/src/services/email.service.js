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

  // 4. Email Verification OTP
  async sendEmailVerificationOtp({ email, otpCode }) {
    const subject = `[LIFORA] Verify Your Email Address - Code: ${otpCode}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <div style="background-color: #C1123F; color: white; padding: 12px 20px; border-radius: 6px; text-align: center;">
          <h2 style="margin: 0;">LIFORA Email Verification</h2>
        </div>
        <p style="margin-top: 20px;">Hello,</p>
        <p>Please use the following 6-digit verification code to confirm your email on LIFORA:</p>
        <div style="text-align: center; margin: 25px 0;">
          <span style="display: inline-block; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #C1123F; background: #fff1f2; padding: 12px 24px; border-radius: 8px; border: 1px dashed #C1123F;">${otpCode}</span>
        </div>
        <p style="font-size: 13px; color: #64748b;">This code is valid for 15 minutes. If you did not request this verification, please disregard this email.</p>
        <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 24px;">LIFORA - Lifesaving Fast Online Response & Allocation</p>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject,
      html,
      text: `Your LIFORA email verification code is: ${otpCode}. It is valid for 15 minutes.`,
    });
  },

  // 5. Password Reset Token / Code
  async sendPasswordResetToken({ email, token, resetCode }) {
    const subject = `[LIFORA] Reset Your Account Password`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <div style="background-color: #172033; color: white; padding: 12px 20px; border-radius: 6px; text-align: center;">
          <h2 style="margin: 0;">LIFORA Password Reset</h2>
        </div>
        <p style="margin-top: 20px;">Hello,</p>
        <p>We received a request to reset your password. Use the following single-use reset code in the app:</p>
        <div style="text-align: center; margin: 25px 0;">
          <span style="display: inline-block; font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #172033; background: #f1f5f9; padding: 12px 24px; border-radius: 8px; border: 1px solid #cbd5e1;">${resetCode}</span>
        </div>
        <p style="font-size: 13px; color: #64748b;">This code will expire in 60 minutes. If you did not make this request, your account credentials remain safe and no action is needed.</p>
        <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 24px;">LIFORA Security Team</p>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject,
      html,
      text: `Your LIFORA password reset code is: ${resetCode}. Valid for 60 minutes.`,
    });
  },

  // 6. Hospital Staff Invitation
  async sendStaffInvitation({ staffEmail, staffName, hospitalName, roleLabel, temporaryPassword }) {
    const subject = `[LIFORA] Staff Access Invitation - ${hospitalName}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <div style="background-color: #C1123F; color: white; padding: 12px 20px; border-radius: 6px; text-align: center;">
          <h2 style="margin: 0;">Hospital Portal Staff Invitation</h2>
        </div>
        <p style="margin-top: 20px;">Dear <strong>${staffName}</strong>,</p>
        <p>You have been assigned as <strong>${roleLabel}</strong> for <strong>${hospitalName}</strong> on the LIFORA Blood Donation & Requisition Network.</p>
        <div style="background: #f8fafc; border-left: 4px solid #C1123F; padding: 14px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0 0 6px 0;"><strong>Portal Login:</strong> <a href="http://localhost:5173/login">http://localhost:5173/login</a></p>
          <p style="margin: 0 0 6px 0;"><strong>Username:</strong> ${staffEmail}</p>
          <p style="margin: 0;"><strong>Temporary Password:</strong> ${temporaryPassword || 'hospital123'}</p>
        </div>
        <p style="font-size: 13px; color: #64748b;">Please log in and update your security credentials upon first entry.</p>
        <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 24px;">LIFORA Institutional Health Portal</p>
      </div>
    `;

    return this.sendEmail({
      to: staffEmail,
      subject,
      html,
      text: `Dear ${staffName}, you have been invited to ${hospitalName} on LIFORA as ${roleLabel}. Log in with ${staffEmail} and password: ${temporaryPassword || 'hospital123'}.`,
    });
  },
};
