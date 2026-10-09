require('dotenv').config();
const nodemailer = require('nodemailer');
const dns = require('dns');

if (dns.setDefaultResultOrder) {
  try {
    dns.setDefaultResultOrder('ipv4first');
  } catch (_) {}
}

let cachedTransporter = null;

const getTransporter = () => {
  if (cachedTransporter) return cachedTransporter;

  const user = process.env.SMTP_USER || 'patelsiddharth264@gmail.com';
  const pass = (process.env.SMTP_PASS || 'xlwaaldphudfydoj').replace(/\s+/g, '');
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT || 465);
  const secure = process.env.SMTP_SECURE !== 'false' && port === 465;

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure,
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  return cachedTransporter;
};

const FROM_HEADER = () => process.env.SMTP_FROM || `"Genius Enterprises" <${process.env.SMTP_USER || 'patelsiddharth264@gmail.com'}>`;

/**
 * Send OTP verification email
 */
async function sendOtpEmail({ to, otp, userName = 'Valued User' }) {
  const transporter = getTransporter();
  const recipient = to || process.env.ADMIN_NOTIFICATION_EMAIL || 'patelsiddharth264@gmail.com';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f6f9; margin: 0; padding: 24px; color: #1e293b; }
    .container { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; }
    .header { background: linear-gradient(135deg, #0B1C3B 0%, #14305C 100%); padding: 28px 24px; text-align: center; }
    .header h1 { margin: 0; color: #ffffff; font-size: 22px; letter-spacing: 1px; font-weight: 700; }
    .header p { margin: 4px 0 0 0; color: #94a3b8; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; }
    .content { padding: 32px 28px; }
    .greeting { font-size: 16px; font-weight: 600; color: #0f172a; margin-bottom: 12px; }
    .text { font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 20px 0; }
    .otp-box { background: #f8fafc; border: 2px dashed #D12020; border-radius: 10px; padding: 18px; text-align: center; margin: 24px 0; }
    .otp-label { font-size: 11px; text-transform: uppercase; color: #64748b; letter-spacing: 1.5px; font-weight: 600; margin-bottom: 6px; }
    .otp-code { font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #D12020; font-family: 'Courier New', monospace; }
    .notice { font-size: 12px; color: #64748b; background: #fff7ed; border-left: 3px solid #f97316; padding: 10px 14px; border-radius: 4px; margin: 20px 0 0 0; }
    .footer { background: #f1f5f9; padding: 18px 24px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>GENIUS ENTERPRISES</h1>
      <p>Wealth Management &amp; Advisory</p>
    </div>
    <div class="content">
      <div class="greeting">Hello ${userName},</div>
      <p class="text">
        You requested a Two-Factor Authentication (2FA) verification code to access your Genius Enterprises portal account.
      </p>
      <div class="otp-box">
        <div class="otp-label">Your One-Time Password (OTP)</div>
        <div class="otp-code">${otp}</div>
      </div>
      <p class="text" style="font-size: 13px;">
        This code is valid for <strong>5 minutes</strong>. For security reasons, never share this code or your account password with anyone.
      </p>
      <div class="notice">
        If you did not initiate this login request, please contact our support team immediately at <a href="mailto:geniusenterprises189837@gmail.com" style="color: #D12020;">geniusenterprises189837@gmail.com</a>.
      </div>
    </div>
    <div class="footer">
      © ${new Date().getFullYear()} Genius Enterprises. All rights reserved.<br/>
      SEBI Registered Financial Advisory &amp; Wealth Portal
    </div>
  </div>
</body>
</html>
  `;

  return transporter.sendMail({
    from: FROM_HEADER(),
    to: recipient,
    subject: `[Genius Enterprises] Your Verification OTP: ${otp}`,
    text: `Your Genius Enterprises verification OTP is ${otp}. Valid for 5 minutes. Do not share with anyone.`,
    html,
  });
}

/**
 * Send Platform Notice email
 */
async function sendNoticeEmail({ to, title, body, kind = 'notice', audience = 'all' }) {
  const transporter = getTransporter();
  const recipient = to || process.env.ADMIN_NOTIFICATION_EMAIL || 'patelsiddharth264@gmail.com';

  const isAd = kind === 'ad';
  const tagColor = isAd ? '#10b981' : '#3b82f6';
  const tagLabel = isAd ? 'PROMOTION / ANNOUNCEMENT' : 'IMPORTANT NOTICE';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f6f9; margin: 0; padding: 24px; color: #1e293b; }
    .container { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; }
    .header { background: linear-gradient(135deg, #0B1C3B 0%, #14305C 100%); padding: 24px; text-align: center; }
    .header h1 { margin: 0; color: #ffffff; font-size: 20px; letter-spacing: 1px; font-weight: 700; }
    .header p { margin: 4px 0 0 0; color: #94a3b8; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; }
    .content { padding: 28px; }
    .badge { display: inline-block; background: ${tagColor}15; color: ${tagColor}; border: 1px solid ${tagColor}40; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; letter-spacing: 1px; margin-bottom: 12px; }
    .notice-title { font-size: 18px; font-weight: 700; color: #0f172a; margin: 0 0 14px 0; line-height: 1.4; }
    .notice-body { font-size: 14px; line-height: 1.7; color: #475569; background: #f8fafc; padding: 16px; border-radius: 8px; border-left: 4px solid #0B1C3B; white-space: pre-wrap; }
    .meta { margin-top: 20px; font-size: 12px; color: #94a3b8; display: flex; justify-content: space-between; }
    .footer { background: #f1f5f9; padding: 16px 24px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>GENIUS ENTERPRISES</h1>
      <p>Official Portal Broadcast</p>
    </div>
    <div class="content">
      <div class="badge">${tagLabel} (${audience.toUpperCase()})</div>
      <h2 class="notice-title">${title}</h2>
      <div class="notice-body">${body}</div>
      <div class="meta">
        <span>Target: ${audience.toUpperCase()}</span>
        <span>${new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
      </div>
    </div>
    <div class="footer">
      © ${new Date().getFullYear()} Genius Enterprises • Notification Dispatcher
    </div>
  </div>
</body>
</html>
  `;

  return transporter.sendMail({
    from: FROM_HEADER(),
    to: recipient,
    subject: `[Genius Enterprises] ${title}`,
    text: `${title}\n\n${body}\n\nAudience: ${audience}`,
    html,
  });
}

/**
 * Verify SMTP connection test
 */
async function verifySmtp() {
  try {
    const transporter = getTransporter();
    await transporter.verify();
    console.log('[mailer] Gmail SMTP connection verified successfully.');
    return { success: true };
  } catch (err) {
    console.error('[mailer] SMTP verification error:', err.message);
    return { success: false, error: err.message };
  }
}

module.exports = {
  sendOtpEmail,
  sendNoticeEmail,
  verifySmtp,
};
