/* ============================================================
   SIGBA Presentación - main.js
   Navegación, QR, Sidebar, Animaciones
   ============================================================ */

(function () {
  'use strict';

  /* ── STATE ──────────────────────────────────────────────── */
  let currentSlide = 0;
  const slides = document.querySelectorAll('.slide');
  const navItems = document.querySelectorAll('.nav-item');
  const totalSlides = slides.length;

  /* ── SLIDE NAVIGATION ───────────────────────────────────── */
  function goToSlide(index, fromNav = false) {
    if (index < 0 || index >= totalSlides) return;

    // Remove active from current
    slides[currentSlide].classList.remove('active');
    navItems[currentSlide]?.classList.remove('active');

    currentSlide = index;

    // Add active to new
    slides[currentSlide].classList.add('active');
    navItems[currentSlide]?.classList.add('active');

    // Scroll nav item into view
    navItems[currentSlide]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    // Update UI
    updateCounter();
    updateProgressBar();
    updateNavButtons();

    // Scroll to top of content
    document.getElementById('slides-area').scrollIntoView({ behavior: 'smooth', block: 'start' });

    // Close sidebar on mobile when navigating
    if (fromNav && window.innerWidth < 900) {
      closeSidebar();
    }
  }

  function updateCounter() {
    const el = document.getElementById('slide-counter');
    if (el) el.textContent = `${currentSlide + 1} / ${totalSlides}`;
  }

  function updateProgressBar() {
    const fill = document.getElementById('progress-fill');
    if (fill) {
      const pct = ((currentSlide + 1) / totalSlides) * 100;
      fill.style.width = pct + '%';
    }
  }

  function updateNavButtons() {
    const prev = document.getElementById('btn-prev');
    const next = document.getElementById('btn-next');
    if (prev) prev.disabled = currentSlide === 0;
    if (next) next.disabled = currentSlide === totalSlides - 1;
  }

  /* ── NAV ITEM CLICKS ────────────────────────────────────── */
  navItems.forEach((item, i) => {
    item.addEventListener('click', () => goToSlide(i, true));
  });

  /* ── TOC ITEM CLICKS ────────────────────────────────────── */
  document.querySelectorAll('.toc-item[data-slide]').forEach(item => {
    item.addEventListener('click', () => {
      const target = parseInt(item.dataset.slide);
      goToSlide(target);
    });
  });

  /* ── PREV / NEXT BUTTONS ────────────────────────────────── */
  document.getElementById('btn-prev')?.addEventListener('click', () => goToSlide(currentSlide - 1));
  document.getElementById('btn-next')?.addEventListener('click', () => goToSlide(currentSlide + 1));

  /* ── KEYBOARD ───────────────────────────────────────────── */
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'PageDown') {
      e.preventDefault(); goToSlide(currentSlide + 1);
    }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp') {
      e.preventDefault(); goToSlide(currentSlide - 1);
    }
    if (e.key === 'Home') goToSlide(0);
    if (e.key === 'End') goToSlide(totalSlides - 1);
    if (e.key === 'Escape') closeModal();
  });

  /* ── SIDEBAR TOGGLE ─────────────────────────────────────── */
  function openSidebar() {
    document.getElementById('sidebar').classList.add('open');
  }
  function closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
  }

  document.getElementById('menu-toggle')?.addEventListener('click', () => {
    const sb = document.getElementById('sidebar');
    sb.classList.contains('open') ? closeSidebar() : openSidebar();
  });

  /* Close sidebar on overlay click (mobile) */
  document.addEventListener('click', (e) => {
    const sb = document.getElementById('sidebar');
    const toggle = document.getElementById('menu-toggle');
    if (window.innerWidth < 900 && sb.classList.contains('open')) {
      if (!sb.contains(e.target) && e.target !== toggle) {
        closeSidebar();
      }
    }
  });

  /* ── QR CODE ────────────────────────────────────────────── */
  function openModal() {
    document.getElementById('qr-modal').classList.add('open');
    initQR();
  }

  function closeModal() {
    document.getElementById('qr-modal').classList.remove('open');
  }

  document.getElementById('btn-qr')?.addEventListener('click', openModal);
  document.getElementById('btn-close-modal')?.addEventListener('click', closeModal);
  document.getElementById('qr-modal')?.addEventListener('click', (e) => {
    if (e.target === document.getElementById('qr-modal')) closeModal();
  });

  /* Generate QR from a given URL string */
  function generateQR(url) {
    const container = document.getElementById('qr-container');
    if (!container) return;

    if (!url || url.trim() === '') {
      container.innerHTML = '<div class="qr-empty">Ingresa una URL válida ↑</div>';
      return;
    }

    container.innerHTML = '<div class="qr-loading">Generando QR…</div>';

    if (typeof QRious !== 'undefined') {
      container.innerHTML = '<canvas id="qr-canvas"></canvas>';
      try {
        new QRious({
          element: document.getElementById('qr-canvas'),
          value: url,
          size: 174,
          foreground: '#2D8200',
          background: '#FFFFFF',
          level: 'H'
        });
      } catch(e) {
        container.innerHTML = '<div class="qr-empty">Error generando QR</div>';
      }
    } else {
      // Fallback: Google Charts API
      const img = new Image();
      img.src = `https://chart.googleapis.com/chart?chs=174x174&cht=qr&chl=${encodeURIComponent(url)}&chco=2D8200&chf=bg,s,FFFFFF`;
      img.alt = 'QR Code';
      img.style.cssText = 'border-radius:6px;width:174px;height:174px;display:block;';
      img.onerror = () => { container.innerHTML = '<div class="qr-empty">No se pudo generar el QR</div>'; };
      container.innerHTML = '';
      container.appendChild(img);
    }
  }

  /* Detect best URL to prefill */
  function detectURL() {
    const href = window.location.href;
    // If served over http/https, use that
    if (href.startsWith('http://') || href.startsWith('https://')) {
      return href.split('?')[0].split('#')[0];
    }
    // Local file — return empty so user fills in
    return '';
  }

  function setHint(msg, isError) {
    const hint = document.getElementById('qr-url-hint');
    if (!hint) return;
    hint.textContent = msg;
    hint.style.color = isError ? '#D62027' : '#39A900';
  }

  /* Init: prefill URL input and generate QR if possible */
  function initQR() {
    const input = document.getElementById('qr-url-input');
    if (!input) return;

    const detected = detectURL();
    if (detected) {
      input.value = detected;
      setHint('✓ URL detectada automáticamente', false);
      generateQR(detected);
    } else {
      input.value = '';
      setHint('⚠ Archivo local: ingresa la URL de tu servidor', true);
      generateQR('');
    }
  }

  /* Regenerate button */
  document.getElementById('btn-qr-gen')?.addEventListener('click', () => {
    const input = document.getElementById('qr-url-input');
    const url = input ? input.value.trim() : '';
    if (!url) { setHint('⚠ Escribe una URL primero', true); return; }
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      setHint('⚠ La URL debe comenzar con http:// o https://', true);
      return;
    }
    setHint('✓ QR generado correctamente', false);
    generateQR(url);
  });

  /* Also regenerate on Enter key in input */
  document.getElementById('qr-url-input')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('btn-qr-gen')?.click();
  });

  /* ── SWIPE SUPPORT ──────────────────────────────────────── */
  let touchStartX = 0;
  let touchStartY = 0;

  document.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  document.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 60) {
      if (dx < 0) goToSlide(currentSlide + 1);
      else goToSlide(currentSlide - 1);
    }
  }, { passive: true });

  /* ── INIT ───────────────────────────────────────────────── */
  function init() {
    slides[0].classList.add('active');
    navItems[0]?.classList.add('active');
    updateCounter();
    updateProgressBar();
    updateNavButtons();

    // Animate counters on stat blocks
    animateCounters();
  }

  /* ── COUNTER ANIMATION ──────────────────────────────────── */
  function animateCounters() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseInt(el.dataset.target);
          if (!isNaN(target)) {
            countUp(el, target);
          }
          observer.unobserve(el);
        }
      });
    });

    document.querySelectorAll('.stat-num[data-target]').forEach(el => {
      observer.observe(el);
    });
  }

  function countUp(el, target) {
    const duration = 1200;
    const start = performance.now();
    const suffix = el.dataset.suffix || '';

    function frame(time) {
      const elapsed = time - start;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(ease * target) + suffix;
      if (progress < 1) requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
  }

  init();

  /* ── PANEL SLIDESHOW ──────────────────────────────────── */
  (function initPanelSlideshow() {
    const slides = document.querySelectorAll('.panel-slide');
    const dots   = document.querySelectorAll('.ps-dot');
    const labels = document.querySelectorAll('.ps-label');
    if (!slides.length) return;

    const urls = [
      'sigba.sena.edu.co/coordinador',
      'sigba.sena.edu.co/instructor',
      'sigba.sena.edu.co/instructor/ficha/2929061',
      'sigba.sena.edu.co/aprendiz/bitacoras',
    ];

    let current = 0;
    let timer = null;

    function goTo(idx) {
      slides[current].classList.remove('ps-active');
      dots[current]?.classList.remove('ps-dot-active');
      labels[current]?.classList.remove('ps-label-active');

      current = (idx + slides.length) % slides.length;

      slides[current].classList.add('ps-active');
      dots[current]?.classList.add('ps-dot-active');
      labels[current]?.classList.add('ps-label-active');

      const urlEl = document.getElementById('panel-url-label');
      if (urlEl && urls[current]) urlEl.textContent = urls[current];
    }

    function startAuto() {
      clearInterval(timer);
      timer = setInterval(() => goTo(current + 1), 3200);
    }

    dots.forEach((dot, i) => {
      dot.addEventListener('click', () => { goTo(i); startAuto(); });
    });

    labels.forEach((lbl, i) => {
      lbl.addEventListener('click', () => { goTo(i); startAuto(); });
    });

    startAuto();
  })();

})();
/* ══════════════════════════════════════════════════════════
   MEJORAS FINALES
   ══════════════════════════════════════════════════════════ */

/* URL por defecto del proyecto (se puede editar en portada) */
var SIGBA_URL = 'https://p-resentacion-sigba.vercel.app/';

/* ── QR EN PORTADA ─────────────────────────────────────── */
(function () {

  function drawCoverQR(url) {
    var canvas = document.getElementById('cover-qr-canvas');
    if (!canvas) return;
    if (typeof QRious === 'undefined') return;
    try {
      new QRious({
        element: canvas,
        value: url && url.trim() ? url.trim() : SIGBA_URL,
        size: 120,
        foreground: '#1A1A1A',
        background: '#FFFFFF',
        level: 'H'
      });
    } catch (e) { console.warn('QR portada:', e); }
  }

  function init() {
    var input = document.getElementById('cover-qr-url-input');
    var btn   = document.getElementById('btn-cover-qr-gen');
    if (!input) return;

    /* Prefill con URL real si está en servidor, o con la URL del proyecto */
    var href = window.location.href;
    var autoURL = (href.startsWith('http://') || href.startsWith('https://'))
      ? href.split('?')[0].split('#')[0]
      : SIGBA_URL;

    input.value = autoURL;
    drawCoverQR(autoURL);

    if (btn) btn.addEventListener('click', function () { drawCoverQR(input.value); });
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') drawCoverQR(input.value); });

    /* Sincronizar cuando el modal principal genera un QR */
    var modalBtn = document.getElementById('btn-qr-gen');
    if (modalBtn) {
      modalBtn.addEventListener('click', function () {
        var mi = document.getElementById('qr-url-input');
        if (mi && mi.value.trim()) { input.value = mi.value.trim(); drawCoverQR(mi.value.trim()); }
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* También re-generar cuando la librería QRious cargue (puede ser después) */
  window.addEventListener('load', function () { drawCoverQR(document.getElementById('cover-qr-url-input') ? document.getElementById('cover-qr-url-input').value : SIGBA_URL); });

})();

/* ── FULLSCREEN: ocultar sidebar ───────────────────────── */
(function () {

  var _sidebar  = null;
  var _main     = null;
  var _bar      = null;
  var _fsActive = false;

  function getEls() {
    _sidebar = _sidebar || document.getElementById('sidebar');
    _main    = _main    || document.getElementById('main');
    _bar     = _bar     || document.getElementById('progress-bar');
  }

  function hide() {
    getEls();
    if (_fsActive) return;
    _fsActive = true;
    if (_sidebar) { _sidebar.style.cssText += ';transform:translateX(-280px)!important;visibility:hidden!important;'; }
    if (_main)    { _main.style.marginLeft    = '0'; }
    if (_bar)     { _bar.style.left           = '0'; }
  }

  function show() {
    getEls();
    if (!_fsActive) return;
    _fsActive = false;
    if (window.innerWidth < 900) return; /* mobile: already hidden by CSS */
    if (_sidebar) { _sidebar.style.transform = ''; _sidebar.style.visibility = ''; }
    if (_main)    { _main.style.marginLeft   = ''; }
    if (_bar)     { _bar.style.left          = ''; }
  }

  function onFSChange() {
    var fs = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;
    fs ? hide() : show();
  }

  document.addEventListener('fullscreenchange',       onFSChange);
  document.addEventListener('webkitfullscreenchange', onFSChange);
  document.addEventListener('mozfullscreenchange',    onFSChange);
  document.addEventListener('MSFullscreenChange',     onFSChange);

  /*  F11 no dispara fullscreenchange en todos los browsers.
      Detectamos con un pequeño polling de tamaño de ventana. */
  var _prevW = window.innerWidth;
  var _prevH = window.innerHeight;
  setInterval(function () {
    var w = window.innerWidth;
    var h = window.innerHeight;
    /* Si la ventana llenó toda la pantalla = fullscreen */
    var isFS = (w === screen.width && h === screen.height);
    if (isFS && !_fsActive) hide();
    if (!isFS && _fsActive) show();
    _prevW = w; _prevH = h;
  }, 300);

})();