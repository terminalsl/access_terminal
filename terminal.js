/* ===================================================================
   TWIN PINES INCIDENT UNIT — terminal.js
   Handles: access-page boot sequence + auth, dossier-page session gate.
   =================================================================== */

const SESSION_KEY = 'tiu_session';

// SHA-256 hex digests of the two access codes. The plaintext codes are
// never stored here — only their hashes are compared against.
const ACCESS_TABLE = {
  'ea42c00e85a6625844552df3ca05c0c7d31dbba1c2e4ab80652f62f6c0b23e7d': {
    slug: 'commine',
    redirect: 'commine.html',
  },
  '37124509732a58f05a09ec5ebef6b2124a735b7fda2ee972cfc64d151210bc06': {
    slug: 'kismet',
    redirect: 'kismet.html',
  },
};

async function sha256Hex(text) {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/* ----------------------- access page ----------------------- */

function initAccessPage() {
  const bootLog = document.getElementById('bootLog');
  const card = document.getElementById('accessForm');
  const form = document.getElementById('accessForm');
  const input = document.getElementById('accessCode');
  const statusLine = document.getElementById('statusLine');

  const lines = [
    'ESTABLISHING SECURE LINK...',
    'VERIFYING NODE INTEGRITY...',
    'LOADING ENHANCED ASSET REGISTRY...',
    'AWAITING OPERATIVE CREDENTIALS...',
  ];

  let delay = 150;
  lines.forEach((text, i) => {
    const el = document.createElement('div');
    el.className = 'line' + (i < lines.length - 1 ? ' ok' : '');
    el.textContent = text;
    el.style.animationDelay = `${delay}ms`;
    bootLog.appendChild(el);
    delay += 260;
  });

  const cursor = document.createElement('span');
  cursor.className = 'cursor';
  bootLog.appendChild(cursor);

  setTimeout(() => {
    card.classList.add('revealed');
    input.focus();
  }, delay + 200);

  let attempts = 0;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const code = input.value.trim();
    if (!code) return;

    const hash = await sha256Hex(code);
    const match = ACCESS_TABLE[hash];

    if (match) {
      statusLine.textContent = `CREDENTIALS ACCEPTED — ROUTING TO ${match.slug.toUpperCase()} FILE...`;
      statusLine.classList.remove('error');
      sessionStorage.setItem(SESSION_KEY, match.slug);
      setTimeout(() => {
        window.location.href = match.redirect;
      }, 600);
    } else {
      attempts += 1;
      card.classList.remove('shake');
      void card.offsetWidth; // restart animation
      card.classList.add('shake');
      input.value = '';
      input.focus();
      statusLine.classList.add('error');
      statusLine.textContent =
        attempts >= 3
          ? `ACCESS DENIED — ${attempts} FAILED ATTEMPTS LOGGED`
          : 'ACCESS DENIED — CODE NOT RECOGNIZED';
    }
  });
}

/* ----------------------- dossier pages ----------------------- */

function initDossierPage() {
  const required = document.body.dataset.operative;
  const active = sessionStorage.getItem(SESSION_KEY);

  if (active !== required) {
    window.location.href = 'index.html';
    return;
  }

  const terminateBtn = document.getElementById('terminateSession');
  if (terminateBtn) {
    terminateBtn.addEventListener('click', () => {
      sessionStorage.removeItem(SESSION_KEY);
      window.location.href = 'index.html';
    });
  }
}

/* ----------------------- bootstrap ----------------------- */

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('accessForm')) {
    initAccessPage();
  } else if (document.body.dataset.operative) {
    initDossierPage();
  }
});
