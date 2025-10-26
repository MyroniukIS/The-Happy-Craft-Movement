// Simple Express server to accept form POST and send email using nodemailer
// Usage: create a .env with SMTP config and TARGET_EMAIL (defaults to knopkakyrs@gmail.com)
// npm install express nodemailer cors dotenv

const express = require('express');
const nodemailer = require('nodemailer');
// security middlewares
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Security headers (Helmet)
app.use(helmet());

// CORS: allow explicit origin via ALLOWED_ORIGIN env var (set to your site URL in production)
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';
app.use(cors({ origin: ALLOWED_ORIGIN }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiter for the send endpoint: default 10 requests per minute per IP
const sendLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: Number(process.env.RATE_LIMIT_MAX) || 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

// apply limiter only to the POST send route
app.use('/api/send', sendLimiter);

const PORT = process.env.PORT || 3000;
const TARGET_EMAIL = process.env.TARGET_EMAIL || 'knopkakyrs@gmail.com';

// Validate environment SMTP settings presence
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;

if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
  console.warn('\nWarning: SMTP credentials not fully configured.\nPlease set SMTP_HOST, SMTP_PORT, SMTP_USER and SMTP_PASS in .env to enable sending.\nRequests will return 500 until configured.\n');
}

function sanitizeText(s) {
  return String(s || '').trim();
}

function isValidEmail(email) {
  // basic email regex adapted for international addresses
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function digitsCount(phone) {
  return (phone.match(/\d/g) || []).length;
}

app.post('/api/send', async (req, res) => {
  try {
    const firstName = sanitizeText(req.body.firstName);
    const lastName = sanitizeText(req.body.lastName);
    const email = sanitizeText(req.body.email);
    const phone = sanitizeText(req.body.phone);
    // honeypot field (bots often fill fields named like "website")
    const honeypot = sanitizeText(req.body.website);
    const message = sanitizeText(req.body.message);

    // If honeypot is filled, treat as bot/spam and reject
    if (honeypot) {
      console.warn('Honeypot triggered — rejecting request.');
      return res.status(400).json({ error: 'Bad request.' });
    }

    // Basic validation (server-side)
    if (!firstName) return res.status(400).json({ field: 'firstName', error: 'First name is required.' });
    if (!email || !isValidEmail(email)) return res.status(400).json({ field: 'email', error: 'A valid email is required.' });
    if (!message) return res.status(400).json({ field: 'message', error: 'Message is required.' });
    if (phone && (digitsCount(phone) < 7 || digitsCount(phone) > 18)) return res.status(400).json({ field: 'phone', error: 'Enter a valid phone number.' });

    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
      return res.status(500).json({ error: 'Mail service not configured on server. Please set SMTP env variables.' });
    }

    // create transporter
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: String(SMTP_PORT) === '465', // true for 465, false for other ports
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    // Configure sender and reply-to so replies go to the visitor while mail is sent from a stable no-reply address
    const SENDER_EMAIL = process.env.SENDER_EMAIL || 'no-reply@example.com';
    const SENDER_NAME = process.env.SENDER_NAME || 'The Happy Craft Movement';

    const mailOptions = {
      // From: site name <no-reply@yourdomain.com> (stable sending identity)
      from: `${SENDER_NAME} <${SENDER_EMAIL}>`,
      // Reply-To: the visitor's email so replies land in their inbox
      replyTo: email,
      to: TARGET_EMAIL,
      subject: `Website message from ${firstName} ${lastName || ''}`,
      text: `You received a message from your website:\n\nName: ${firstName} ${lastName}\nEmail: ${email}\nPhone: ${phone}\n\nMessage:\n${message}`,
      html: `<p>You received a message from your website:</p>
             <p><strong>Name:</strong> ${firstName} ${lastName}</p>
             <p><strong>Email:</strong> ${email}</p>
             <p><strong>Phone:</strong> ${phone}</p>
             <p><strong>Message:</strong><br/>${message.replace(/\n/g, '<br/>')}</p>`,
    };

    const info = await transporter.sendMail(mailOptions);
    return res.json({ ok: true, messageId: info.messageId });
  } catch (err) {
    // Log full error to console for local debugging
    console.error('Error sending email:', err);

    // Prepare safe response for clients. When DEBUG_MAIL=true (local dev), include helpful detail.
    const responseBody = { error: 'Failed to send message.' };
    const debugEnabled = String(process.env.DEBUG_MAIL).toLowerCase() === 'true' || process.env.NODE_ENV !== 'production';
    if (debugEnabled) {
      responseBody.detail = err && err.message ? String(err.message) : String(err);
      if (err && err.code) responseBody.code = err.code;
    }

    return res.status(500).json(responseBody);
  }
});

// Bind explicitly to IPv4 loopback to avoid environments that prefer IPv6 only
const server = app.listen(PORT, '127.0.0.1', () => {
  const addr = server.address();
  console.log(`Send-email server listening on http://${addr.address}:${addr.port}`);
  console.log(`Target recipient: ${TARGET_EMAIL}`);
  console.log(`Process PID: ${process.pid}`);
});

// Simple healthcheck to verify the server is reachable
app.get('/alive', (req, res) => {
  res.json({ ok: true, pid: process.pid, envPort: process.env.PORT || null });
});
