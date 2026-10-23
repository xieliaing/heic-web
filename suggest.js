/*
 * Suggestion box.
 *
 * Posts the note to /api/suggest on the counter worker, which stores it in KV.
 * The card's markup is localised in each page and carries its own status
 * messages as data attributes (data-sending, data-ok, data-limited,
 * data-failed), so this file holds no copy of its own.
 */
(function () {
  'use strict';

  function wire(form) {
    const status = form.querySelector('[data-suggest-status]');
    const button = form.querySelector('button[type="submit"]');

    function say(key, kind) {
      status.textContent = form.dataset[key] || '';
      status.style.color = kind === 'error' ? '#dc2626' : kind === 'ok' ? '#16a34a' : 'var(--muted)';
      status.hidden = false;
    }

    form.addEventListener('submit', async event => {
      event.preventDefault();
      const text = form.elements.text.value.trim();
      if (!text) return;

      button.disabled = true;
      say('sending', 'pending');
      try {
        const res = await fetch('/api/suggest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text,
            contact: form.elements.contact.value.trim(),
            page: location.pathname,
            lang: document.documentElement.lang || '',
          }),
        });
        if (res.ok) {
          form.reset();
          say('ok', 'ok');
        } else {
          say(res.status === 429 ? 'limited' : 'failed', 'error');
        }
      } catch (_) {
        say('failed', 'error');
      } finally {
        button.disabled = false;
      }
    });
  }

  function start() {
    for (const form of document.querySelectorAll('form[data-suggest]')) wire(form);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
}());
