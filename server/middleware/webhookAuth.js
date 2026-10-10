/**
 * Webhook Signature Verification Middleware
 * Validates cryptographic HMAC-SHA256 signatures on incoming webhook payloads
 * using timing-safe comparisons to prevent forgery and timing attacks.
 */

const crypto = require('crypto');

/**
 * Verifies HMAC SHA-256 signature
 * @param {string|Buffer} rawBody - Raw unparsed webhook payload string or buffer
 * @param {string} signature - Received signature header (hex or base64)
 * @param {string} secret - Secret key shared with the webhook provider
 * @returns {boolean} True if signature is valid
 */
function verifyWebhookSignature(rawBody, signature, secret) {
  if (!rawBody || !signature || !secret) return false;
  try {
    const cleanSignature = signature.replace(/^sha256=/i, '').trim();
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(rawBody);
    const expectedSignature = hmac.digest('hex');

    const sigBuf = Buffer.from(cleanSignature, 'hex');
    const expectedBuf = Buffer.from(expectedSignature, 'hex');

    if (sigBuf.length !== expectedBuf.length) return false;
    return crypto.timingSafeEqual(sigBuf, expectedBuf);
  } catch (err) {
    return false;
  }
}

/**
 * Express middleware factory to protect webhook endpoints
 * @param {string} secretEnvVar - Name of environment variable holding webhook secret
 * @param {string} headerName - Header containing the signature (default: 'x-webhook-signature')
 */
function requireWebhookSignature(secretEnvVar = 'WEBHOOK_SECRET', headerName = 'x-webhook-signature') {
  return (req, res, next) => {
    const secret = process.env[secretEnvVar];
    if (!secret) {
      console.warn(`[webhookAuth] Warning: ${secretEnvVar} not configured on server`);
      return res.status(500).json({ error: 'Webhook secret is not configured' });
    }

    const signature = req.headers[headerName.toLowerCase()];
    if (!signature) {
      return res.status(401).json({ error: 'Missing webhook signature header' });
    }

    const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    const isValid = verifyWebhookSignature(rawBody, signature, secret);

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid webhook signature' });
    }

    next();
  };
}

module.exports = {
  verifyWebhookSignature,
  requireWebhookSignature,
};
