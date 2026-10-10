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

const FROM_HEADER = () => process.env.SMTP_FROM || `"Genius Enterprises Security" <${process.env.SMTP_USER || 'patelsiddharth264@gmail.com'}>`;

/**
 * Send OTP verification email with high priority and anti-spam deliverability headers
 */
async function sendOtpEmail({ to, otp, userName = 'Valued User' }) {
  const transporter = getTransporter();
  const recipient = to || process.env.ADMIN_NOTIFICATION_EMAIL || 'patelsiddharth264@gmail.com';
  const cleanUserName = String(userName || 'Valued User').trim();
  const fromAddress = FROM_HEADER();
  const replyTo = process.env.SMTP_USER || 'patelsiddharth264@gmail.com';

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Genius Enterprises Verification Code</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; -webkit-font-smoothing: antialiased; }
    .container { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
    .header { background: #0B1C3B; padding: 26px 24px; text-align: center; }
    .header h1 { margin: 0; color: #ffffff; font-size: 20px; letter-spacing: 1.5px; font-weight: 800; }
    .header p { margin: 4px 0 0 0; color: #94a3b8; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; font-weight: 600; }
    .content { padding: 32px 28px; }
    .greeting { font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 12px; }
    .text { font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 20px 0; }
    .otp-box { background: #f8fafc; border: 2px dashed #D12020; border-radius: 10px; padding: 20px 16px; text-align: center; margin: 24px 0; }
    .otp-label { font-size: 11px; text-transform: uppercase; color: #64748b; letter-spacing: 1.5px; font-weight: 700; margin-bottom: 8px; }
    .otp-code { font-size: 36px; font-weight: 900; letter-spacing: 10px; color: #D12020; font-family: 'Courier New', Courier, monospace; }
    .validity { font-size: 12px; color: #64748b; margin-top: 8px; font-weight: 600; }
    .notice { font-size: 12px; color: #64748b; background: #f1f5f9; border-left: 3px solid #0B1C3B; padding: 12px 14px; border-radius: 4px; margin: 24px 0 0 0; line-height: 1.5; }
    .footer { background: #f8fafc; padding: 20px 24px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>GENIUS ENTERPRISES</h1>
      <p>Security &amp; Identity Verification</p>
    </div>
    <div class="content">
      <div class="greeting">Hello ${cleanUserName},</div>
      <p class="text">
        We received a request to sign in to your <strong>Genius Enterprises Portal</strong> account. Use the one-time verification code below to complete authentication:
      </p>
      <div class="otp-box">
        <div class="otp-label">One-Time Verification Code</div>
        <div class="otp-code">${otp}</div>
        <div class="validity">Expires in 5 minutes • Single use only</div>
      </div>
      <p class="text" style="font-size: 13px; color: #64748b;">
        <strong>Security Tip:</strong> Genius Enterprises personnel will never ask you for this code. Do not share it with anyone.
      </p>
      <div class="notice">
        If you did not request this verification code, please ignore this email or reach our compliance desk at <a href="mailto:geniusenterprises189837@gmail.com" style="color: #0B1C3B; text-decoration: underline;">geniusenterprises189837@gmail.com</a>.
      </div>
    </div>
    <div class="footer">
      © ${new Date().getFullYear()} Genius Enterprises. All rights reserved.<br/>
      SEBI Registered Financial Advisory &amp; Wealth Management Portal<br/>
      This is an automated priority transactional security dispatch.
    </div>
  </div>
</body>
</html>
  `;

  const textBody = `Genius Enterprises - Identity Verification\n\nHello ${cleanUserName},\n\nYour one-time verification code is:\n\n${otp}\n\nThis code is valid for 5 minutes and can only be used once.\n\nSecurity Tip: Never share this code with anyone. Genius Enterprises will never call or ask for your verification code.\n\nIf you did not initiate this login request, please ignore this email or contact support at geniusenterprises189837@gmail.com.\n\n© ${new Date().getFullYear()} Genius Enterprises. All rights reserved.`;

  // Industry-standard transactional headers that signal priority 2FA delivery to Gmail, Outlook, Apple Mail
  return transporter.sendMail({
    from: fromAddress,
    to: recipient,
    replyTo: replyTo,
    subject: `${otp} is your Genius Enterprises verification code`,
    text: textBody,
    html: html,
    headers: {
      'X-Priority': '1',
      'X-MSMail-Priority': 'High',
      'Importance': 'high',
      'Priority': 'urgent',
      'X-Auto-Response-Suppress': 'OOF, AutoReply',
      'Auto-Submitted': 'auto-generated',
      'X-Entity-Ref-ID': `otp-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    },
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
