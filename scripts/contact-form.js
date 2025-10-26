// Client-side form validation and submit for contact form
// Default endpoint: http://localhost:3000/api/send
// If deploying to a hosted endpoint, set data-endpoint attribute on the form: <form id="contact-form" data-endpoint="https://api.example.com/api/send">...

(function () {
  const DEFAULT_ENDPOINT = 'http://localhost:3000/api/send';

  function $(sel, ctx = document) {
    return ctx.querySelector(sel);
  }

  function $all(sel, ctx = document) {
    return Array.from(ctx.querySelectorAll(sel));
  }

  function findErrorEl(name) {
    return document.querySelector(`.field-error[data-for="${name}"]`);
  }

  function setError(name, msg) {
    const el = findErrorEl(name);
    if (el) el.textContent = msg;
    // add input visual state
    const fieldEl = document.getElementById(name);
    if (fieldEl) fieldEl.classList.add('input-error');
  }

  function clearErrors() {
    $all('.field-error').forEach((el) => (el.textContent = ''));
    const status = $('#form-status');
    if (status) status.textContent = '';
    // remove any previous success class so message returns to normal
    if (status) status.classList.remove('form-status--success');
    // remove input visual state from any fields
    $all('#contact-form input, #contact-form textarea').forEach((f) => f.classList.remove('input-error'));
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function digitsCount(s) {
    return (String(s).match(/\d/g) || []).length;
  }

  document.addEventListener('DOMContentLoaded', function () {
    const form = $('#contact-form');
    if (!form) return;

  // Determine endpoint and mode. If data-endpoint is provided, use JSON POST there.
  // If form is configured for Netlify (data-netlify="true"), submit as form-encoded to the current site so Netlify captures it.
    const hasCustomEndpoint = Boolean(form.dataset.endpoint);
    const isNetlifyForm = form.hasAttribute('data-netlify') || form.dataset.netlify === 'true';
    // For Netlify Forms, POST to site root ('/') is most reliable for capture (some setups use /index.html)
    const endpoint = hasCustomEndpoint
      ? form.dataset.endpoint
      : (isNetlifyForm ? (form.action || '/') : DEFAULT_ENDPOINT);
    const firstName = $('#firstName');
    const lastName = $('#lastName');
    const email = $('#email');
    const phone = $('#phone');
  const honeypot = $('#website');
    const message = $('#message');
    const submitBtn = $('#submitBtn');
    const statusEl = $('#form-status');

    function validate() {
      let ok = true;
      clearErrors();

      if (!firstName.value.trim()) {
        setError('firstName', 'First name is required');
        ok = false;
      }

      if (!email.value.trim() || !isValidEmail(email.value.trim())) {
        setError('email', 'Please enter a valid email');
        ok = false;
      }

      // Phone validation: allow only digits, spaces, parentheses and leading +
      const phoneRaw = phone.value.trim();
      if (phoneRaw) {
        const allowed = /^[0-9+() ]*$/; // no hyphens or other symbols allowed
        if (!allowed.test(phoneRaw)) {
          setError('phone', 'Phone may contain only digits, spaces, parentheses and an optional leading +');
          ok = false;
        } else {
          const d = digitsCount(phoneRaw);
          // E.164 max is 15 digits; allow 7-15 for practical international/local numbers
          if (d < 7 || d > 15) {
            setError('phone', 'Please enter a valid phone number (7–15 digits)');
            ok = false;
          }
        }
      }

      if (!message.value.trim() || message.value.trim().length < 5) {
        setError('message', 'Please enter a short message (at least 5 characters)');
        ok = false;
      }

      return ok;
    }

    form.addEventListener('submit', async function (ev) {
      ev.preventDefault();
      // If honeypot has a value, treat as bot — silently succeed (do not send)
      if (honeypot && honeypot.value.trim()) {
        // optional: log to console for local debugging
        console.warn('Honeypot field filled; treating submission as spam.');
        statusEl.textContent = 'Message sent — thank you!';
        form.reset();
        firstName.focus();
        return;
      }

      if (!validate()) return;

      submitBtn.disabled = true;
      const prevText = submitBtn.textContent;
      submitBtn.textContent = 'Sending...';
      statusEl.textContent = '';

      const payload = {
        firstName: firstName.value.trim(),
        lastName: lastName.value.trim(),
        email: email.value.trim(),
        phone: phone.value.trim(),
        website: honeypot ? honeypot.value.trim() : '',
        message: message.value.trim(),
      };

      try {
          let res;
          if (isNetlifyForm && !hasCustomEndpoint) {
            // Netlify Forms: send application/x-www-form-urlencoded including form-name
            const formName = form.getAttribute('name') || (document.querySelector('input[name="form-name"]') || {}).value || 'contact-form';
            const formPayload = new URLSearchParams();
            formPayload.append('form-name', formName);
            // append all fields
            Object.keys(payload).forEach((k) => formPayload.append(k, payload[k] || ''));

            res = await fetch(endpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json'
              },
              body: formPayload.toString(),
            });
          } else {
            // Default: JSON POST to custom endpoint or local default
            res = await fetch(endpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
              },
              body: JSON.stringify(payload),
            });
          }

        if (res.ok) {
          // Netlify Forms often returns HTML (redirect page) rather than JSON.
          // Try to parse JSON, but fall back to text so we don't throw a syntax error.
          let successBody;
          try {
            successBody = await res.json();
          } catch (err) {
            try {
              successBody = await res.text();
            } catch (e) {
              successBody = {};
            }
          }
          console.log('Form submission success response:', successBody);
          statusEl.textContent = 'Message sent — thank you!';
          statusEl.classList.add('form-status--success');
          form.reset();
          // focus the first field for convenience
          firstName.focus();
        } else if (res.status === 400) {
          const body = await res.json();
          if (body && body.field) {
            setError(body.field, body.error || 'Invalid input');
            const fieldEl = document.getElementById(body.field);
            if (fieldEl) fieldEl.focus();
          } else {
            statusEl.textContent = 'Please check the form and try again.';
          }
        } else {
          // Try to read response body (JSON or text) for better diagnostics
          let body = {};
          try {
            body = await res.json();
          } catch (e) {
            try {
              const txt = await res.text();
              body = { error: txt };
            } catch (e2) {
              body = { error: 'Unknown error' };
            }
          }
          console.error('Form submission failed:', res.status, body);
          statusEl.textContent = body.error || 'Failed to send message. Please try later.';
        }
      } catch (err) {
        console.error('Network error sending contact form', err);
        statusEl.textContent = 'Network error. Please check your connection and try again.';
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = prevText;
      }
    });
  });
})();
