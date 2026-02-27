/* ═══════════════════════════════════════════════════════════
   BioLink Maker — script.js
   ═══════════════════════════════════════════════════════════ */
'use strict';

/* ══════════════════════════════════════════════════════════════
   1. ÉTAT GLOBAL
══════════════════════════════════════════════════════════════ */
let selectedTheme       = 'blue';
let selectedRadius      = 'rounded-xl';
let selectedFont        = 'syne';
let selectedDarkMode    = 1;       // 1 = sombre, 0 = clair (page visiteur)
let selectedAvatarType  = 'lt';
let selectedBorderStyle = 'solid';
let selectedCustomColor = '';      // '' = désactivé, '#xxxxxx' = couleur active
let selectedAnimBg      = 'none';  // fond animé
let linkIdCounter       = 0;
let previewVP           = 'mobile';
let _sortable           = null;
let _autoSaveTimer      = null;
let _toastTimer         = null;

const LS_KEY = 'biolink_autosave_v2';


/* ══════════════════════════════════════════════════════════════
   2. MAPS & CONSTANTES
══════════════════════════════════════════════════════════════ */
const VISITOR_BG = {
  dark : { blue:'vbg-dark-blue',  insta:'vbg-dark-insta',  black:'vbg-dark-black',  green:'vbg-dark-green',  rose:'vbg-dark-rose',  glass:'vbg-dark-glass',  custom:'vbg-dark-custom'  },
  light: { blue:'vbg-light-blue', insta:'vbg-light-insta', black:'vbg-light-black', green:'vbg-light-green', rose:'vbg-light-rose', glass:'vbg-light-glass', custom:'vbg-light-custom' }
};

const PREVIEW_BG = {
  blue:'bg-slate-950', insta:'bg-[#1a0a2e]', black:'bg-black',
  green:'bg-[#052e16]', rose:'bg-[#1f0a10]', glass:'bg-slate-950', custom:'bg-slate-950'
};

const FONT_STACK = {
  syne    : "'Syne', sans-serif",
  inter   : "'Inter', sans-serif",
  playfair: "'Playfair Display', serif",
  mono    : "'JetBrains Mono', monospace"
};

const ICON_KEYWORDS = {
  'instagram':'fa-brands fa-instagram', 'insta':'fa-brands fa-instagram',
  'twitter':'fa-brands fa-x-twitter',   'x.com':'fa-brands fa-x-twitter',
  'tiktok':'fa-brands fa-tiktok',        'youtube':'fa-brands fa-youtube',
  'facebook':'fa-brands fa-facebook-f',  'linkedin':'fa-brands fa-linkedin-in',
  'github':'fa-brands fa-github',        'discord':'fa-brands fa-discord',
  'twitch':'fa-brands fa-twitch',        'spotify':'fa-brands fa-spotify',
  'snapchat':'fa-brands fa-snapchat',    'snap':'fa-brands fa-snapchat',
  'pinterest':'fa-brands fa-pinterest-p','reddit':'fa-brands fa-reddit-alien',
  'telegram':'fa-brands fa-telegram',    'whatsapp':'fa-brands fa-whatsapp',
  'patreon':'fa-brands fa-patreon',      'paypal':'fa-brands fa-paypal',
  'mastodon':'fa-brands fa-mastodon',    'threads':'fa-brands fa-threads',
  'substack':'fa-solid fa-newspaper',    'newsletter':'fa-solid fa-newspaper',
  'podcast':'fa-solid fa-microphone-lines','blog':'fa-solid fa-pen-nib',
  'article':'fa-solid fa-pen-nib',       'musique':'fa-solid fa-music',
  'music':'fa-solid fa-music',           'photo':'fa-solid fa-camera',
  'video':'fa-solid fa-video',           'shop':'fa-solid fa-bag-shopping',
  'boutique':'fa-solid fa-bag-shopping', 'store':'fa-solid fa-store',
  'email':'fa-solid fa-envelope',        'mail':'fa-solid fa-envelope',
  'contact':'fa-solid fa-envelope',      'don':'fa-solid fa-heart',
  'donate':'fa-solid fa-heart',          'tip':'fa-solid fa-heart',
  'portfolio':'fa-solid fa-briefcase',   'cv':'fa-solid fa-file-lines',
  'resume':'fa-solid fa-file-lines',     'site':'fa-solid fa-globe',
  'website':'fa-solid fa-globe',         'lien':'fa-solid fa-link',
  'link':'fa-solid fa-link'
};


/* ══════════════════════════════════════════════════════════════
   3. ROUTAGE — détecte si on est sur la page visiteur (?p=...)
      Les fonctions renderVisitor & renderAvatarIn sont hoistées
      (déclarations de fonctions), donc elles sont disponibles ici.
══════════════════════════════════════════════════════════════ */
(function route() {
  const params  = new URLSearchParams(window.location.search);
  const payload = params.get('p');
  if (!payload) return;

  const visitorApp = document.getElementById('visitor-app');
  const creatorApp = document.getElementById('creator-app');

  try {
    const json = decodeURIComponent(atob(payload));
    const data = JSON.parse(json);
    renderVisitor(data);
  } catch (err) {
    visitorApp.innerHTML = `
      <div class="text-center py-24 px-6 text-slate-400">
        <i class="fa-solid fa-triangle-exclamation text-5xl text-slate-700 mb-5 block"></i>
        <p class="font-display text-xl font-semibold text-slate-300 mb-2">Lien invalide ou corrompu</p>
        <p class="text-sm text-slate-500">L'URL a peut-être été modifiée manuellement.</p>
        <a href="${window.location.pathname}" class="inline-flex items-center gap-2 mt-6 text-indigo-400 text-sm hover:text-indigo-300 transition">
          <i class="fa-solid fa-arrow-left text-xs"></i> Créer ma propre page
        </a>
      </div>`;
    visitorApp.className = 'min-h-screen flex items-center justify-center vbg-dark-blue';
  }

  visitorApp.classList.remove('hidden');
  if (creatorApp) creatorApp.remove();
})();


/* ══════════════════════════════════════════════════════════════
   4. BADGE SYSTÈME (mode sombre/clair de l'OS)
══════════════════════════════════════════════════════════════ */
function updateSystemModeBadge() {
  const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const icon   = document.getElementById('sys-mode-icon');
  const label  = document.getElementById('sys-mode-label');
  if (!icon || !label) return;
  icon.className    = isDark ? 'fa-solid fa-moon text-indigo-400 text-[11px]' : 'fa-solid fa-sun text-amber-400 text-[11px]';
  label.textContent = isDark ? 'Système : Sombre' : 'Système : Clair';
}

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
  const stored = localStorage.getItem('biolink_editor_mode') || 'auto';
  if (stored === 'auto') document.documentElement.classList.toggle('dark', e.matches);
  updateSystemModeBadge();
  updatePreview();
});


/* ══════════════════════════════════════════════════════════════
   4b. TOGGLE MODE ÉDITEUR (Clair / Auto / Sombre)
══════════════════════════════════════════════════════════════ */
function setEditorMode(mode) {
  localStorage.setItem('biolink_editor_mode', mode);
  const isDark = mode === 'dark' || (mode === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', isDark);
  document.querySelectorAll('.editor-mode-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.editorMode === mode);
  });
}

function syncEditorModeButtons() {
  const mode = localStorage.getItem('biolink_editor_mode') || 'auto';
  document.querySelectorAll('.editor-mode-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.editorMode === mode);
  });
}


/* ══════════════════════════════════════════════════════════════
   5. SÉLECTEURS D'OPTIONS
══════════════════════════════════════════════════════════════ */
function selectTheme(btn) {
  document.querySelectorAll('.theme-opt').forEach(b => b.classList.remove('border-indigo-500', 'bg-indigo-500/10'));
  btn.classList.add('border-indigo-500', 'bg-indigo-500/10');
  selectedTheme = btn.dataset.theme;
  selectedCustomColor = '';
  const clearBtn = document.getElementById('custom-color-clear');
  if (clearBtn) clearBtn.classList.add('hidden');
  updatePreview();
}

function selectRadius(btn) {
  document.querySelectorAll('.radius-opt').forEach(b => b.classList.remove('opt-active'));
  btn.classList.add('opt-active');
  selectedRadius = btn.dataset.radius;
  updatePreview();
}

function selectFont(btn) {
  document.querySelectorAll('.font-opt').forEach(b => b.classList.remove('opt-active'));
  btn.classList.add('opt-active');
  selectedFont = btn.dataset.font;
  updatePreview();
}

function selectAvatarType(btn) {
  document.querySelectorAll('.av-type-opt').forEach(b => b.classList.remove('opt-active'));
  btn.classList.add('opt-active');
  selectedAvatarType = btn.dataset.av;
  document.getElementById('avatar-emoji-wrap').classList.toggle('hidden', selectedAvatarType !== 'em');
  document.getElementById('avatar-image-wrap').classList.toggle('hidden', selectedAvatarType !== 'im');
  updatePreview();
}

function selectBorderStyle(btn) {
  document.querySelectorAll('.bstyle-opt').forEach(b => b.classList.remove('opt-active'));
  btn.classList.add('opt-active');
  selectedBorderStyle = btn.dataset.bstyle;
  updatePreview();
}

function selectAnimBg(btn) {
  document.querySelectorAll('.anim-bg-opt').forEach(b => b.classList.remove('opt-active'));
  btn.classList.add('opt-active');
  selectedAnimBg = btn.dataset.bg;
  updatePreview();
}


/* ══════════════════════════════════════════════════════════════
   6. COULEUR PERSONNALISÉE
══════════════════════════════════════════════════════════════ */
function onCustomColorChange() {
  const color = document.getElementById('inp-custom-color').value;
  selectedCustomColor = color;
  document.getElementById('custom-color-preview').style.background = color;
  document.getElementById('custom-color-clear').classList.remove('hidden');
  document.querySelectorAll('.theme-opt').forEach(b => b.classList.remove('border-indigo-500', 'bg-indigo-500/10'));
  injectCustomColorStyle(color);
  updatePreview();
}

function clearCustomColor() {
  selectedCustomColor = '';
  document.getElementById('custom-color-clear').classList.add('hidden');
  const defaultTheme = document.querySelector('.theme-opt[data-theme="blue"]');
  if (defaultTheme) selectTheme(defaultTheme);
  else updatePreview();
}

function injectCustomColorStyle(color) {
  let el = document.getElementById('custom-color-style');
  if (!el) {
    el = document.createElement('style');
    el.id = 'custom-color-style';
    document.head.appendChild(el);
  }
  el.textContent = `
    .theme-custom { background: ${color} !important; color: #fff !important; }
    .theme-custom:hover { filter: brightness(1.12) !important; }
  `;
}


/* ══════════════════════════════════════════════════════════════
   7. TOGGLE MODE PAGE VISITEUR (Sombre / Clair)
══════════════════════════════════════════════════════════════ */
function togglePageMode() {
  selectedDarkMode = selectedDarkMode === 1 ? 0 : 1;
  const icon  = document.getElementById('mode-icon');
  const label = document.getElementById('mode-label');
  if (icon)  icon.className    = selectedDarkMode === 1 ? 'fa-solid fa-moon text-indigo-400 text-[11px]' : 'fa-solid fa-sun text-amber-400 text-[11px]';
  if (label) label.textContent = selectedDarkMode === 1 ? 'Page sombre' : 'Page claire';
  updatePreview();
}


/* ══════════════════════════════════════════════════════════════
   8. GESTION DES LIENS
══════════════════════════════════════════════════════════════ */
function addLink() {
  const container = document.getElementById('links-container');
  const id = ++linkIdCounter;
  const div = document.createElement('div');
  div.className   = 'link-item bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4 relative';
  div.dataset.id   = id;
  div.dataset.type = 'link';
  div.innerHTML = `
    <button type="button" onclick="removeLink(${id})" class="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition">
      <i class="fa-solid fa-xmark text-xs"></i>
    </button>
    <div class="flex items-center gap-2 mb-3">
      <span class="drag-handle" title="Glisser pour réorganiser"><i class="fa-solid fa-grip-vertical text-xs"></i></span>
      <span id="icon-badge-${id}" class="inline-flex items-center gap-1.5 text-xs text-slate-400 bg-slate-200 dark:bg-slate-900 px-2 py-0.5 rounded-full transition-all">
        <i class="fa-solid fa-link text-[10px]"></i> Icône auto
      </span>
    </div>
    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="block text-xs text-slate-400 mb-1">Titre du bouton</label>
        <input type="text" placeholder="ex : Mon Instagram" maxlength="40"
          class="link-title w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
          oninput="onTitleChange(this, ${id})" />
      </div>
      <div>
        <label class="block text-xs text-slate-400 mb-1">URL</label>
        <input type="url" placeholder="https://…"
          class="link-url w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
          oninput="autoSave(); updatePreview();" />
      </div>
    </div>`;
  container.appendChild(div);
  updateLinkCount();
  updatePreview();
  initSortable();
}

function addSeparator() {
  const container = document.getElementById('links-container');
  const id = ++linkIdCounter;
  const div = document.createElement('div');
  div.className   = 'link-item bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800/50 rounded-xl p-4 relative';
  div.dataset.id   = id;
  div.dataset.type = 'sep';
  div.innerHTML = `
    <button type="button" onclick="removeLink(${id})" class="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition">
      <i class="fa-solid fa-xmark text-xs"></i>
    </button>
    <div class="flex items-center gap-2 mb-3">
      <span class="drag-handle" title="Glisser"><i class="fa-solid fa-grip-vertical text-xs"></i></span>
      <i class="fa-solid fa-heading text-violet-400 text-xs"></i>
      <span class="text-xs text-violet-400 font-semibold uppercase tracking-wider">Titre de section</span>
    </div>
    <input type="text" placeholder="ex : Mes Réseaux • Mes Projets" maxlength="50"
      class="link-title w-full bg-white dark:bg-slate-900 border border-violet-200 dark:border-violet-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition"
      oninput="autoSave(); updatePreview();" />`;
  container.appendChild(div);
  updateLinkCount();
  updatePreview();
  initSortable();
}

function removeLink(id) {
  const el = document.querySelector(`[data-id="${id}"]`);
  if (!el) return;
  el.style.transition = 'opacity .18s ease, transform .18s ease';
  el.style.opacity    = '0';
  el.style.transform  = 'translateY(-6px)';
  setTimeout(() => { el.remove(); updateLinkCount(); updatePreview(); }, 190);
}

function onTitleChange(input, id) {
  const icon  = detectIcon(input.value);
  const badge = document.getElementById(`icon-badge-${id}`);
  if (!badge) return;
  const isGeneric = icon === 'fa-solid fa-link';
  badge.innerHTML = `<i class="${icon} text-[10px]"></i> Icône auto`;
  badge.className = isGeneric
    ? 'inline-flex items-center gap-1.5 text-xs text-slate-400 bg-slate-200 dark:bg-slate-900 px-2 py-0.5 rounded-full transition-all'
    : 'inline-flex items-center gap-1.5 text-xs text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full transition-all';
  autoSave();
  updatePreview();
}

function updateLinkCount() {
  const n   = document.querySelectorAll('#links-container [data-id]').length;
  const el  = document.getElementById('link-count');
  if (el) el.textContent = n === 0 ? '0 lien' : `${n} bloc${n > 1 ? 's' : ''}`;
}


/* ══════════════════════════════════════════════════════════════
   9. DÉTECTION AUTOMATIQUE D'ICÔNE
══════════════════════════════════════════════════════════════ */
function detectIcon(title) {
  const lower = (title || '').toLowerCase();
  for (const [kw, cls] of Object.entries(ICON_KEYWORDS)) {
    if (lower.includes(kw)) return cls;
  }
  return 'fa-solid fa-link';
}


/* ══════════════════════════════════════════════════════════════
   10. COLLECTE DES DONNÉES
══════════════════════════════════════════════════════════════ */
function collectData() {
  const n  = document.getElementById('inp-name').value.trim();
  const b  = document.getElementById('inp-bio').value.trim();
  const av = selectedAvatarType;
  let ac = '';
  if (av === 'em') ac = document.getElementById('inp-avatar-emoji').value.trim();
  else if (av === 'im') ac = document.getElementById('inp-avatar-img').value.trim();

  const l = [];
  document.querySelectorAll('#links-container [data-id]').forEach(div => {
    const type = div.dataset.type || 'link';
    const t    = div.querySelector('.link-title')?.value.trim() || '';
    const u    = type === 'link' ? (div.querySelector('.link-url')?.value.trim() || '') : '';
    if (t || u) l.push({ type, t, u });
  });

  return {
    n, b,
    t:  selectedCustomColor ? 'custom' : selectedTheme,
    cc: selectedCustomColor,
    bs: selectedBorderStyle,
    r:  selectedRadius,
    f:  selectedFont,
    m:  selectedDarkMode,
    bg: selectedAnimBg,
    av, ac, l
  };
}


/* ══════════════════════════════════════════════════════════════
   11. GÉNÉRATION DE L'URL DE PARTAGE
══════════════════════════════════════════════════════════════ */
function generateURL() {
  try {
    const data = collectData();
    if (!data.n && data.l.length === 0) {
      const btn = document.getElementById('btn-generate');
      if (btn) { btn.classList.add('animate-bounce'); setTimeout(() => btn.classList.remove('animate-bounce'), 700); }
      showToast('Renseignez au moins un nom ou un lien.', 'err');
      return;
    }

    const encoded = btoa(encodeURIComponent(JSON.stringify(data)));
    const fullURL = `${window.location.origin}${window.location.pathname}?p=${encoded}`;

    // Stockage global pour copyURL()
    window.__lastURL = fullURL;

    const textarea = document.getElementById('url-display');
    textarea.value = fullURL;
    textarea.classList.remove('copy-success');

    const previewBtn = document.getElementById('preview-btn');
    if (previewBtn) previewBtn.href = fullURL;

    const out = document.getElementById('url-output');
    out.classList.remove('hidden');
    out.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    // Auto-sélection du texte
    setTimeout(() => {
      textarea.focus();
      textarea.select();
      textarea.setSelectionRange(0, textarea.value.length);
    }, 100);

  } catch (err) {
    console.error('generateURL error:', err);
    showToast('Erreur lors de la génération.', 'err');
  }
}


/* ══════════════════════════════════════════════════════════════
   12. COPIE DU LIEN — triple méthode
══════════════════════════════════════════════════════════════ */
async function copyURL() {
  const url = window.__lastURL || document.getElementById('url-display')?.value?.trim();
  if (!url) { showToast('Générez d\'abord votre lien !', 'err'); return; }

  const textarea = document.getElementById('url-display');
  const btn      = document.getElementById('copy-btn');
  const icon     = document.getElementById('copy-icon');
  const lbl      = document.getElementById('copy-label');
  let success    = false;

  // M1 — Clipboard API (contexte sécurisé / HTTPS)
  if (navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(url);
      success = true;
    } catch (e) { /* continue */ }
  }

  // M2 — select() + execCommand (HTTP, iOS, anciens navigateurs)
  if (!success) {
    try {
      textarea.value = url;
      textarea.select();
      textarea.setSelectionRange(0, url.length);
      success = document.execCommand('copy');
    } catch (e) { /* continue */ }
  }

  // M3 — Fallback manuel (prompt)
  if (!success) {
    window.prompt('Copiez votre lien (Ctrl+C / ⌘+C) :', url);
    success = true;
  }

  if (success) {
    textarea.classList.add('copy-success');
    if (btn) {
      btn.classList.replace('bg-indigo-600', 'bg-emerald-600');
      btn.classList.replace('hover:bg-indigo-500', 'hover:bg-emerald-500');
    }
    if (icon) icon.className  = 'fa-solid fa-check text-sm';
    if (lbl)  lbl.textContent = 'Copié !';
    showToast('Lien copié dans le presse-papiers !', 'ok');

    setTimeout(() => {
      textarea.classList.remove('copy-success');
      if (btn) {
        btn.classList.replace('bg-emerald-600', 'bg-indigo-600');
        btn.classList.replace('hover:bg-emerald-500', 'hover:bg-indigo-500');
      }
      if (icon) icon.className  = 'fa-regular fa-copy text-sm';
      if (lbl)  lbl.textContent = 'Copier le lien';
    }, 2500);
  }
}


/* ══════════════════════════════════════════════════════════════
   13. QR CODE
══════════════════════════════════════════════════════════════ */
function showQRCode() {
  const url = window.__lastURL;
  if (!url) { showToast('Générez d\'abord votre lien !', 'err'); return; }

  const panel = document.getElementById('qr-panel');
  const wrap  = document.getElementById('qr-canvas-wrap');

  if (!panel.classList.contains('hidden')) {
    panel.classList.add('hidden');
    return;
  }

  wrap.innerHTML = '';
  panel.classList.remove('hidden');

  if (typeof QRCode === 'undefined') {
    wrap.textContent = 'QRCode.js non disponible.';
    return;
  }
  try {
    new QRCode(wrap, {
      text: url, width: 180, height: 180,
      colorDark: '#0f172a', colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.H
    });
  } catch (e) {
    wrap.textContent = 'Erreur lors de la génération du QR Code.';
  }
}

function downloadQR() {
  const img    = document.querySelector('#qr-canvas-wrap img');
  const canvas = document.querySelector('#qr-canvas-wrap canvas');
  const src    = canvas ? canvas.toDataURL() : img ? img.src : null;
  if (!src) return;
  const a = document.createElement('a');
  a.href = src; a.download = 'qrcode-biolink.png'; a.click();
}


/* ══════════════════════════════════════════════════════════════
   14. EXPORT HTML (page visiteur autonome)
══════════════════════════════════════════════════════════════ */
function exportHTML() {
  const url = window.__lastURL;
  if (!url) { showToast('Générez d\'abord votre lien !', 'err'); return; }

  const data     = collectData();
  const theme    = data.cc ? 'custom' : data.t;
  const mode     = data.m === 0 ? 'light' : 'dark';
  const font     = data.f || 'syne';
  const animBg   = data.bg || 'none';

  const bgClass = animBg !== 'none'
    ? `vbg-${animBg}`
    : (VISITOR_BG[mode] || VISITOR_BG.dark)[theme] || 'vbg-dark-blue';

  const fontLinks = {
    syne    : 'family=Syne:wght@400;600;700;800',
    inter   : 'family=Inter:wght@300;400;500;600',
    playfair: 'family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400',
    mono    : 'family=JetBrains+Mono:wght@300;400;500'
  };
  const fontStack = {
    syne    : "'Syne',sans-serif",
    inter   : "'Inter',sans-serif",
    playfair: "'Playfair Display',serif",
    mono    : "'JetBrains Mono',monospace"
  };
  const themeStyles = {
    blue  : 'background:linear-gradient(135deg,#3b82f6,#1d4ed8);color:#fff;',
    insta : 'background:linear-gradient(135deg,#f59e0b,#ec4899,#8b5cf6);color:#fff;',
    black : 'background:#000;color:#fff;border:1px solid #333;',
    green : 'background:linear-gradient(135deg,#10b981,#059669);color:#fff;',
    rose  : 'background:linear-gradient(135deg,#f43f5e,#e11d48);color:#fff;',
    glass : 'background:rgba(255,255,255,.10);color:#fff;border:1px solid rgba(255,255,255,.20);backdrop-filter:blur(10px);',
    custom: data.cc ? `background:${data.cc};color:#fff;` : ''
  };
  const radiusMap = { 'rounded-full': '9999px', 'rounded-none': '0', 'rounded-xl': '.75rem' };
  const btnStyle  = (themeStyles[theme] || themeStyles.blue) + `border-radius:${radiusMap[data.r] || '.75rem'};`;
  const bsStyle   = data.bs === 'outline' ? 'background:transparent!important;border:2px solid currentColor!important;' : data.bs === 'shadow' ? 'box-shadow:0 8px 24px rgba(0,0,0,.35);' : '';

  const meshCSS = animBg !== 'none' ? {
    'mesh-purple': 'background:linear-gradient(-45deg,#0f172a,#4c1d95,#1e1b4b,#0e7490,#0f172a);background-size:400% 400%;animation:meshMove 10s ease infinite;',
    'mesh-sunset': 'background:linear-gradient(-45deg,#1f0a10,#7c2d12,#831843,#1e3a5f,#1f0a10);background-size:400% 400%;animation:meshMove 10s ease infinite;',
    'mesh-forest': 'background:linear-gradient(-45deg,#052e16,#064e3b,#1e3a5f,#14532d,#052e16);background-size:400% 400%;animation:meshMove 10s ease infinite;',
  }[animBg] || '' : '';

  let avatarHTML;
  if (data.av === 'im' && data.ac) {
    avatarHTML = `<img src="${data.ac}" alt="" style="width:5rem;height:5rem;border-radius:9999px;object-fit:cover;margin:0 auto 1rem;display:block;">`;
  } else if (data.av === 'em' && data.ac) {
    avatarHTML = `<div style="width:5rem;height:5rem;border-radius:9999px;background:linear-gradient(135deg,#1e293b,#334155);display:flex;align-items:center;justify-content:center;font-size:2.5rem;margin:0 auto 1rem;">${data.ac}</div>`;
  } else {
    avatarHTML = `<div style="width:5rem;height:5rem;border-radius:9999px;background:linear-gradient(135deg,#6366f1,#8b5cf6);display:flex;align-items:center;justify-content:center;color:#fff;font-size:1.75rem;font-weight:700;margin:0 auto 1rem;">${data.n ? data.n[0].toUpperCase() : '?'}</div>`;
  }

  const textColor     = mode === 'light' ? '#1e293b' : '#fff';
  const subTextColor  = mode === 'light' ? '#64748b' : '#94a3b8';

  const linksHTML = (data.l || []).map(item => {
    if (item.type === 'sep') {
      return `<div style="text-align:center;font-size:.7rem;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.45);font-weight:700;padding:.5rem 0;">${item.t || ''}</div>`;
    }
    if (!item.t && !item.u) return '';
    return `<a href="${item.u || '#'}" target="_blank" rel="noopener noreferrer"
  style="display:flex;align-items:center;justify-content:center;gap:.75rem;width:100%;padding:1rem 1.5rem;font-weight:600;font-size:1rem;text-decoration:none;margin-bottom:.75rem;transition:transform .2s,filter .2s;${btnStyle}${bsStyle}"
  onmouseover="this.style.filter='brightness(1.08)';this.style.transform='translateY(-2px)'"
  onmouseout="this.style.filter='';this.style.transform=''">${item.t || item.u}</a>`;
  }).join('');

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${data.n ? data.n + ' — ' : ''}BioLink</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?${fontLinks[font] || fontLinks.syne}&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
@keyframes meshMove{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
@keyframes fadeSlide{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
body{font-family:${fontStack[font] || fontStack.syne};min-height:100vh;display:flex;align-items:center;justify-content:center;padding:4rem 1rem;${meshCSS}}
.vbg-dark-blue{background:linear-gradient(160deg,#0f172a,#1e3a5f)}
.vbg-dark-insta{background:linear-gradient(160deg,#1a0a2e 0%,#3d1342 50%,#1a2540 100%)}
.vbg-dark-black{background:#000}
.vbg-dark-green{background:linear-gradient(160deg,#052e16,#0f172a)}
.vbg-dark-rose{background:linear-gradient(160deg,#1f0a10,#0f172a)}
.vbg-dark-glass{background:linear-gradient(160deg,#0f172a,#1e293b)}
.vbg-light-blue{background:linear-gradient(160deg,#eff6ff,#dbeafe)}
.vbg-light-insta{background:linear-gradient(160deg,#fdf2f8,#f3e8ff,#dbeafe)}
.vbg-light-black{background:#f8fafc}
.vbg-light-green{background:linear-gradient(160deg,#ecfdf5,#d1fae5)}
.vbg-light-rose{background:linear-gradient(160deg,#fff1f2,#fce7f3)}
.container{width:100%;max-width:26rem;margin:0 auto}
.link-anim{animation:fadeSlide .5s ease forwards;opacity:0}
.watermark{text-align:center;color:rgba(255,255,255,.3);font-size:.7rem;margin-top:3rem}
</style>
</head>
<body class="${bgClass}">
<div class="container">
  <div style="text-align:center;margin-bottom:2rem;">
    ${avatarHTML}
    <h1 style="font-weight:800;font-size:1.5rem;color:${textColor};">${data.n || ''}</h1>
    ${data.b ? `<p style="color:${subTextColor};font-size:.875rem;margin-top:.5rem;max-width:20rem;margin-left:auto;margin-right:auto;line-height:1.5;">${data.b}</p>` : ''}
  </div>
  <div>${linksHTML}</div>
  <p class="watermark">Créé avec <strong style="color:#818cf8">BioLink Maker</strong></p>
</div>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const a    = document.createElement('a');
  a.href     = URL.createObjectURL(blob);
  a.download = (data.n ? data.n.replace(/[^a-z0-9]/gi, '_').toLowerCase() : 'biolink') + '.html';
  a.click();
  URL.revokeObjectURL(a.href);
  showToast('Page HTML exportée !', 'ok');
}


/* ══════════════════════════════════════════════════════════════
   15. TOGGLE PREVIEW VIEWPORT (Mobile / Desktop)
══════════════════════════════════════════════════════════════ */
function setPreviewVP(vp) {
  previewVP = vp;
  document.querySelectorAll('.preview-vp-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.vp === vp);
  });
  const frame = document.getElementById('preview-frame');
  if (!frame) return;
  if (vp === 'desktop') {
    frame.style.width    = '100%';
    frame.style.maxWidth = '100%';
  } else {
    frame.style.width    = '240px';
    frame.style.maxWidth = '240px';
  }
}


/* ══════════════════════════════════════════════════════════════
   16. RENDU DE L'AVATAR
══════════════════════════════════════════════════════════════ */
function renderAvatarIn(container, data) {
  if (!container) return;
  if (data.av === 'im' && data.ac) {
    container.style.background = 'transparent';
    container.innerHTML = '';
    const img   = document.createElement('img');
    img.src     = data.ac;
    img.alt     = 'Avatar';
    img.className = 'w-full h-full object-cover';
    img.onerror = () => { container.textContent = data.n ? data.n[0].toUpperCase() : '?'; container.style.background = ''; };
    container.appendChild(img);
  } else if (data.av === 'em' && data.ac) {
    container.innerHTML = data.ac;
    container.style.background = 'linear-gradient(135deg,#1e293b,#334155)';
  } else {
    container.innerHTML = data.n ? data.n[0].toUpperCase() : '?';
    container.style.background = '';
  }
}


/* ══════════════════════════════════════════════════════════════
   17. MISE À JOUR DE L'APERÇU EN DIRECT
══════════════════════════════════════════════════════════════ */
function updatePreview() {
  autoSave();

  const data      = collectData();
  const screen    = document.getElementById('preview-screen');
  const prevLinks = document.getElementById('prev-links');
  const prevAv    = document.getElementById('prev-avatar');
  if (!screen) return;

  screen.style.fontFamily = FONT_STACK[data.f] || FONT_STACK.syne;

  // Fond de l'aperçu
  if (data.m === 0) {
    screen.className   = 'bg-gradient-to-b from-slate-100 to-slate-200 min-h-[440px] p-4 flex flex-col items-center gap-3 transition-all duration-500 overflow-hidden';
    screen.style.background = '';
  } else if (data.bg && data.bg !== 'none') {
    screen.style.background = '';
    screen.className = `min-h-[440px] p-4 flex flex-col items-center gap-3 transition-all duration-500 overflow-hidden vbg-${data.bg}`;
  } else {
    screen.style.background = '';
    screen.className = `min-h-[440px] p-4 flex flex-col items-center gap-3 transition-all duration-500 overflow-hidden ${PREVIEW_BG[data.t] || 'bg-slate-950'}`;
  }

  renderAvatarIn(prevAv, data);

  const nameEl = document.getElementById('prev-name');
  const bioEl  = document.getElementById('prev-bio');
  if (nameEl) { nameEl.textContent = data.n || 'Votre Nom'; nameEl.style.color = data.m === 0 ? '#1e293b' : '#fff'; nameEl.style.fontFamily = FONT_STACK[data.f] || FONT_STACK.syne; }
  if (bioEl)  { bioEl.textContent  = data.b || 'Votre bio…'; bioEl.style.color  = data.m === 0 ? '#64748b' : '#94a3b8'; }

  prevLinks.innerHTML = '';
  let count = 0;
  data.l.forEach(item => {
    if (count >= 4) return;
    if (item.type === 'sep') {
      const sep = document.createElement('p');
      sep.className   = 'text-center text-[8px] uppercase tracking-widest font-bold py-0.5';
      sep.style.color = data.m === 0 ? '#94a3b8' : 'rgba(255,255,255,.4)';
      sep.textContent = item.t || '—';
      prevLinks.appendChild(sep);
    } else {
      const themeClass  = data.cc ? 'theme-custom' : `theme-${data.t}`;
      const bstyleClass = data.bs === 'outline' ? 'bstyle-outline' : data.bs === 'shadow' ? 'bstyle-shadow' : '';
      const btn = document.createElement('div');
      const icn = detectIcon(item.t);
      btn.className = `w-full ${themeClass} ${bstyleClass} text-[10px] font-semibold py-1.5 px-2.5 truncate transition flex items-center justify-center gap-1.5 ${data.r || 'rounded-xl'}`;
      btn.style.fontFamily = FONT_STACK[data.f] || FONT_STACK.syne;
      if (data.cc) btn.style.background = data.cc;
      btn.innerHTML = `<i class="${icn} text-[9px] opacity-80"></i><span>${item.t || 'Lien sans titre'}</span>`;
      prevLinks.appendChild(btn);
      count++;
    }
  });
  if (data.l.length > 4) {
    const more = document.createElement('p');
    more.className   = 'text-center text-[9px]';
    more.style.color = data.m === 0 ? '#94a3b8' : '#475569';
    more.textContent = `+${data.l.length - 4} autre(s)…`;
    prevLinks.appendChild(more);
  }
}


/* ══════════════════════════════════════════════════════════════
   18. RENDU DE LA PAGE VISITEUR
══════════════════════════════════════════════════════════════ */
function renderVisitor(data) {
  try {
    const vApp   = document.getElementById('visitor-app');
    const theme  = data.t  || 'blue';
    const radius = data.r  || 'rounded-xl';
    const font   = data.f  || 'syne';
    const mode   = data.m === 0 ? 'light' : 'dark';
    const cc     = data.cc || '';
    const bs     = data.bs || 'solid';
    const animBg = data.bg || 'none';

    if (cc) injectCustomColorStyle(cc);

    const bgClass = animBg !== 'none'
      ? `vbg-${animBg}`
      : (VISITOR_BG[mode] || VISITOR_BG.dark)[theme] || 'vbg-dark-blue';

    vApp.className = `min-h-screen flex items-center justify-center py-16 px-4 transition-all duration-500 ${bgClass}`;
    if (mode === 'light') vApp.classList.add('visitor-light');

    document.body.style.fontFamily = FONT_STACK[font] || FONT_STACK.syne;

    renderAvatarIn(document.getElementById('v-avatar'), data);
    document.getElementById('v-name').textContent = data.n || '';
    document.getElementById('v-bio').textContent  = data.b || '';
    document.title = (data.n ? `${data.n} — ` : '') + 'BioLink';

    const linksEl = document.getElementById('v-links');
    linksEl.innerHTML = '';
    let linkIdx = 0;

    (data.l || []).forEach(item => {
      if (item.type === 'sep') {
        const sep = document.createElement('div');
        sep.className = 'visitor-separator';
        sep.style.animationDelay = `${linkIdx * 90}ms`;
        sep.textContent = item.t || '';
        linksEl.appendChild(sep);
      } else {
        if (!item.t && !item.u) return;
        const themeClass  = cc ? 'theme-custom' : `theme-${theme}`;
        const bstyleClass = bs === 'outline' ? 'bstyle-outline' : bs === 'shadow' ? 'bstyle-shadow' : '';
        const icn = detectIcon(item.t);
        const a   = document.createElement('a');
        a.href   = item.u || '#';
        a.target = '_blank';
        a.rel    = 'noopener noreferrer';
        a.style.animationDelay = `${linkIdx * 90}ms`;
        if (cc) a.style.background = cc;
        a.className = `visitor-link flex items-center justify-center gap-3 w-full text-center font-medium text-base py-4 px-6 shadow-lg ${themeClass} ${bstyleClass} hover:scale-[1.02] hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 cursor-pointer ${radius}`;
        a.innerHTML = `<i class="${icn} text-sm opacity-90"></i><span>${item.t || item.u}</span>`;
        linksEl.appendChild(a);
        linkIdx++;
      }
    });
  } catch (err) {
    console.error('renderVisitor error:', err);
  }
}


/* ══════════════════════════════════════════════════════════════
   19. EXPORT / IMPORT JSON
══════════════════════════════════════════════════════════════ */
function exportJSON() {
  const data = collectData();
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const a    = document.createElement('a');
  a.href     = URL.createObjectURL(blob);
  a.download = 'mon-biolink.json';
  a.click();
  URL.revokeObjectURL(a.href);
  showToast('Configuration exportée !', 'ok');
}

function importJSON(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const data = JSON.parse(e.target.result);
      restoreFromData(data);
      showToast('Configuration importée !', 'ok');
    } catch (err) {
      showToast('Fichier JSON invalide.', 'err');
    }
    event.target.value = '';
  };
  reader.readAsText(file);
}


/* ══════════════════════════════════════════════════════════════
   20. RESTAURATION DEPUIS UN OBJET DE DONNÉES
══════════════════════════════════════════════════════════════ */
function restoreFromData(data) {
  if (!data) return;

  const nameEl = document.getElementById('inp-name');
  const bioEl  = document.getElementById('inp-bio');
  if (nameEl && data.n !== undefined) nameEl.value = data.n;
  if (bioEl  && data.b !== undefined) bioEl.value  = data.b;

  // Avatar
  if (data.av) {
    const avBtn = document.querySelector(`.av-type-opt[data-av="${data.av}"]`);
    if (avBtn) selectAvatarType(avBtn);
    const emojiInp = document.getElementById('inp-avatar-emoji');
    const imgInp   = document.getElementById('inp-avatar-img');
    if (data.av === 'em' && data.ac && emojiInp) emojiInp.value = data.ac;
    if (data.av === 'im' && data.ac && imgInp)   imgInp.value   = data.ac;
  }

  // Thème
  if (data.cc) {
    selectedCustomColor = data.cc;
    const colorInput   = document.getElementById('inp-custom-color');
    const colorPreview = document.getElementById('custom-color-preview');
    const colorClear   = document.getElementById('custom-color-clear');
    if (colorInput)   colorInput.value = data.cc;
    if (colorPreview) colorPreview.style.background = data.cc;
    if (colorClear)   colorClear.classList.remove('hidden');
    injectCustomColorStyle(data.cc);
  } else {
    const themeBtn = document.querySelector(`.theme-opt[data-theme="${data.t || 'blue'}"]`);
    if (themeBtn) selectTheme(themeBtn);
  }

  // Arrondi
  if (data.r) {
    const rBtn = document.querySelector(`.radius-opt[data-radius="${data.r}"]`);
    if (rBtn) selectRadius(rBtn);
  }

  // Style bordure
  if (data.bs) {
    const bBtn = document.querySelector(`.bstyle-opt[data-bstyle="${data.bs}"]`);
    if (bBtn) selectBorderStyle(bBtn);
  }

  // Fond animé
  if (data.bg) {
    const bgBtn = document.querySelector(`.anim-bg-opt[data-bg="${data.bg}"]`);
    if (bgBtn) selectAnimBg(bgBtn);
  }

  // Police
  if (data.f) {
    const fBtn = document.querySelector(`.font-opt[data-font="${data.f}"]`);
    if (fBtn) selectFont(fBtn);
  }

  // Mode page visiteur
  if (data.m !== undefined) {
    selectedDarkMode = data.m;
    const icon  = document.getElementById('mode-icon');
    const label = document.getElementById('mode-label');
    if (icon)  icon.className    = selectedDarkMode === 1 ? 'fa-solid fa-moon text-indigo-400 text-[11px]' : 'fa-solid fa-sun text-amber-400 text-[11px]';
    if (label) label.textContent = selectedDarkMode === 1 ? 'Page sombre' : 'Page claire';
  }

  // Liens
  const container = document.getElementById('links-container');
  if (container) { container.innerHTML = ''; linkIdCounter = 0; }
  (data.l || []).forEach(item => {
    if (item.type === 'sep') {
      addSeparator();
      const last = document.querySelector('#links-container [data-id]:last-child .link-title');
      if (last) last.value = item.t || '';
    } else {
      addLink();
      const last = document.querySelector('#links-container [data-id]:last-child');
      if (last) {
        const titleInp = last.querySelector('.link-title');
        const urlInp   = last.querySelector('.link-url');
        if (titleInp) { titleInp.value = item.t || ''; onTitleChange(titleInp, parseInt(last.dataset.id)); }
        if (urlInp)   urlInp.value = item.u || '';
      }
    }
  });

  updatePreview();
}


/* ══════════════════════════════════════════════════════════════
   21. AUTO-SAUVEGARDE (localStorage)
══════════════════════════════════════════════════════════════ */
function autoSave() {
  clearTimeout(_autoSaveTimer);
  _autoSaveTimer = setTimeout(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(collectData()));
    } catch (e) { /* quota dépassé ou mode privé */ }
  }, 600);
}

function restoreFromLocalStorage() {
  try {
    const raw  = localStorage.getItem(LS_KEY);
    if (!raw) return false;
    restoreFromData(JSON.parse(raw));
    return true;
  } catch (e) { return false; }
}


/* ══════════════════════════════════════════════════════════════
   22. NOTIFICATIONS TOAST
══════════════════════════════════════════════════════════════ */
function showToast(msg, type = 'ok') {
  const t = document.getElementById('toast');
  if (!t) return;
  clearTimeout(_toastTimer);
  t.textContent = msg;
  t.className   = `show toast-${type}`;
  _toastTimer   = setTimeout(() => { t.className = ''; }, 2800);
}


/* ══════════════════════════════════════════════════════════════
   23. DRAG & DROP — SortableJS
══════════════════════════════════════════════════════════════ */
function initSortable() {
  const container = document.getElementById('links-container');
  if (!container || typeof Sortable === 'undefined') return;
  if (_sortable) _sortable.destroy();
  _sortable = new Sortable(container, {
    animation  : 180,
    ghostClass : 'sortable-ghost',
    dragClass  : 'sortable-drag',
    handle     : '.drag-handle',
    onEnd()    { autoSave(); updatePreview(); }
  });
}


/* ══════════════════════════════════════════════════════════════
   24. INITIALISATION — DOMContentLoaded
══════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {

  updateSystemModeBadge();
  syncEditorModeButtons();

  // Bindings des champs en direct
  const nameInp = document.getElementById('inp-name');
  const bioInp  = document.getElementById('inp-bio');
  if (nameInp) nameInp.addEventListener('input', updatePreview);
  if (bioInp)  bioInp.addEventListener('input',  updatePreview);

  // Sélections par défaut
  const selectors = [
    ['.theme-opt[data-theme="blue"]',         selectTheme],
    ['.radius-opt[data-radius="rounded-xl"]', selectRadius],
    ['.font-opt[data-font="syne"]',           selectFont],
    ['.av-type-opt[data-av="lt"]',            selectAvatarType],
    ['.bstyle-opt[data-bstyle="solid"]',      selectBorderStyle],
    ['.anim-bg-opt[data-bg="none"]',          selectAnimBg],
  ];
  selectors.forEach(([sel, fn]) => { const el = document.querySelector(sel); if (el) fn(el); });

  // Init Drag & Drop
  initSortable();

  // Restauration localStorage
  const restored = restoreFromLocalStorage();
  if (restored) showToast('Configuration restaurée.', 'ok');

  // Sync icône mode page
  const icon  = document.getElementById('mode-icon');
  const label = document.getElementById('mode-label');
  if (icon)  icon.className    = selectedDarkMode === 1 ? 'fa-solid fa-moon text-indigo-400 text-[11px]' : 'fa-solid fa-sun text-amber-400 text-[11px]';
  if (label) label.textContent = selectedDarkMode === 1 ? 'Page sombre' : 'Page claire';

});
