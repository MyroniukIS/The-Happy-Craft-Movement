// Netlify Function handler to receive contact form POST and send email via Nodemailer
// Expects environment variables set in Netlify UI:
// SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
// TARGET_EMAIL (recipient), SENDER_EMAIL, SENDER_NAME, ALLOWED_ORIGIN (optional)

const nodemailer = require("nodemailer");

exports.handler = async function (event, context) {
  try {
    // Only allow POST
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        headers: { Allow: "POST" },
        body: JSON.stringify({ error: "Method Not Allowed" }),
      };
    }

    const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "*";

    // parse body (Netlify passes raw body)
    let body = {};
    try {
      body = JSON.parse(event.body || "{}");
    } catch (e) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid JSON" }),
      };
    }

    const sanitize = (s) => (s || "").toString().trim();
    const firstName = sanitize(body.firstName);
    const lastName = sanitize(body.lastName);
    const email = sanitize(body.email);
    const phone = sanitize(body.phone);
    const message = sanitize(body.message);
    const honeypot = sanitize(body.website);

    // Honeypot check
    if (honeypot) {
      console.warn("Honeypot triggered — rejecting request.");
      // respond with 200 to avoid giving spammer signals, but do not send mail
      return {
        statusCode: 200,
        headers: { "Access-Control-Allow-Origin": ALLOWED_ORIGIN },
        body: JSON.stringify({ ok: true }),
      };
    }

    if (!firstName) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          field: "firstName",
          error: "First name is required.",
        }),
      };
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          field: "email",
          error: "A valid email is required.",
        }),
      };
    }
    if (!message) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          field: "message",
          error: "Message is required.",
        }),
      };
    }

    // check SMTP env
    const SMTP_HOST = process.env.SMTP_HOST;
    const SMTP_PORT = process.env.SMTP_PORT;
    const SMTP_USER = process.env.SMTP_USER;
    const SMTP_PASS = process.env.SMTP_PASS;
    const TARGET_EMAIL = process.env.TARGET_EMAIL || "knopkakyrs@gmail.com";

    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
      console.error("SMTP not configured");
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "Mail service not configured on server.",
        }),
      };
    }

    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: String(SMTP_PORT) === "465",
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });

    const SENDER_EMAIL = process.env.SENDER_EMAIL || "no-reply@example.com";
    const SENDER_NAME = process.env.SENDER_NAME || "The Happy Craft Movement";

    // Sanitize user input for HTML output to prevent XSS in email clients
    const escapeHtml = (unsafe) =>
      unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

    const mailOptions = {
      from: `${SENDER_NAME} <${SENDER_EMAIL}>`,
      replyTo: email,
      to: TARGET_EMAIL,
      subject: `Website message from ${escapeHtml(firstName)} ${escapeHtml(
        lastName || ""
      )}`,
      text: `You received a message from your website 
The Happy Craft Movement:\n\nName: ${firstName} ${lastName}\nEmail: ${email}\nPhone: ${phone}\n\nMessage:\n${message}`,
      html: `<p>You received a message from your website:</p>
             <ul>
               <li><strong>Name:</strong> ${escapeHtml(firstName)} ${escapeHtml(
        lastName
      )}</li>
               <li><strong>Email:</strong> ${escapeHtml(email)}</li>
               <li><strong>Phone:</strong> ${escapeHtml(phone)}</li>
             </ul>
             <p><strong>Message:</strong></p>
             <pre style="font-family:inherit; font-size:inherit; white-space:pre-wrap; word-wrap:break-word;">${escapeHtml(
               message
             )}</pre>`,
    };

    const info = await transporter.sendMail(mailOptions);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
      },
      body: JSON.stringify({ ok: true, messageId: info.messageId }),
    };
  } catch (err) {
    console.error("Error in Netlify function send-email:", err);
    const debug =
      process.env.DEBUG_MAIL === "true" ||
      process.env.NODE_ENV !== "production";
    const body = { error: "Failed to send message." };
    if (debug)
      body.detail = err && err.message ? String(err.message) : String(err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    };
  }
};
