Netlify deployment for The Happy Craft Movement — contact form

Overview
--------
This repo contains a static front-end and a serverless Netlify Function to handle contact form submissions and send email using Nodemailer.

What I added
------------
- `netlify/functions/send-email.js` — serverless function that accepts POST JSON and sends mail via SMTP (nodemailer).
- `index.html` can use a relative endpoint `/.netlify/functions/send-email` for the contact form.

Environment variables (set these in Netlify UI > Site settings > Build & deploy > Environment)
--------------------------------------------------------------------------------------------
- SMTP_HOST — your SMTP host (e.g., smtp.mailtrap.io or smtp.sendgrid.net)
- SMTP_PORT — SMTP port (e.g., 587 or 465)
- SMTP_USER — SMTP username
- SMTP_PASS — SMTP password
- TARGET_EMAIL — recipient address for incoming messages (default: knopkakyrs@gmail.com)
- SENDER_EMAIL — stable From: address (e.g., no-reply@yourdomain.com)
- SENDER_NAME — display name for From (e.g., The Happy Craft Movement)
- ALLOWED_ORIGIN — optional CORS origin (set to your website URL or `*` for testing)
- DEBUG_MAIL — set to `true` or `false` to control debug output in responses (optional)

Deploy steps (quick)
--------------------
1. Commit and push your changes to GitHub (branch `main` or your preferred branch).
2. Create an account on Netlify and "New site from Git" → connect your GitHub repo.
3. Netlify will detect a static site. No build command is necessary if your site is fully static. If you have a build step, configure it.
4. In Netlify site settings, add the environment variables listed above.
5. After deploy, your contact form should POST to `/.netlify/functions/send-email` (if your front-end is also on Netlify). If your front-end is hosted elsewhere, set the form `data-endpoint` to the absolute URL of the function.

Notes & recommendations
-----------------------
- Netlify Functions run serverlessly and have execution limits. For low traffic (a few hundred or thousand requests/month) the free tier usually suffices — check Netlify's current limits in their docs.
- For better email deliverability in production, consider using a transactional email provider (SendGrid, Mailgun, Postmark) via their API rather than raw SMTP.
- Rate-limiting at the function level is unreliable (serverless instances are stateless). Keep honeypot + reCAPTCHA, and/or use Cloudflare/Netlify Edge rules to limit abusive traffic.
- After deploy, test the form and check Mailtrap or your SMTP provider inbox.

If you'd like, I can:
- Convert the function to use a provider API (SendGrid) for faster, more reliable delivery.
- Add reCAPTCHA/Turnstile to the form to reduce spam even further.
- Walk you through the Netlify UI steps and environment configuration.
