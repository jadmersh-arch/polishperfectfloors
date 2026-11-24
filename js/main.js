/* Polish Perfect Floors — vanilla JS, no dependencies */
(function () {
  'use strict';
  var doc = document, root = doc.documentElement;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };

  /* ---------- Header: scrolled state + mobile menu ---------- */
  var top = $('.site-header');
  function onScrollHeader() { if (top) top.classList.toggle('scrolled', window.scrollY > 40); }
  onScrollHeader();
  window.addEventListener('scroll', onScrollHeader, { passive: true });

  var toggle = $('.nav-toggle'), nav = $('#nav');
  function setNav(open) {
    root.classList.toggle('nav-open', open);
    if (toggle) { toggle.setAttribute('aria-expanded', open ? 'true' : 'false'); toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu'); }
  }
  if (toggle && nav) {
    toggle.addEventListener('click', function () { setNav(!root.classList.contains('nav-open')); });
    $$('a', nav).forEach(function (a) { a.addEventListener('click', function () { setNav(false); }); });
    doc.addEventListener('keydown', function (e) { if (e.key === 'Escape') setNav(false); });
    window.addEventListener('resize', function () { if (window.innerWidth > 860) setNav(false); });
  }

  /* ---------- Trust badges: accessible expandable cards (one open at a time) ---------- */
  var tbtns = $$('.trust-btn');
  tbtns.forEach(function (b) {
    b.addEventListener('click', function () {
      var open = b.getAttribute('aria-expanded') === 'true';
      tbtns.forEach(function (x) { x.setAttribute('aria-expanded', 'false'); x.closest('.trust-card').classList.remove('open'); });
      if (!open) { b.setAttribute('aria-expanded', 'true'); b.closest('.trust-card').classList.add('open'); }
    });
  });

  /* ---------- Reveal on scroll ---------- */
  var revealEls = $$('.reveal');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else { revealEls.forEach(function (el) { el.classList.add('in'); }); }

  /* ---------- Subtle parallax ---------- */
  var par = $$('[data-parallax]');
  if (par.length && !reduce) {
    var ticking = false;
    var run = function () {
      var vh = window.innerHeight;
      par.forEach(function (el) {
        var host = el.parentElement.getBoundingClientRect();
        if (host.bottom < -100 || host.top > vh + 100) return;
        var speed = parseFloat(el.getAttribute('data-parallax')) || 0.15;
        var shift = (host.top + host.height / 2 - vh / 2) * -speed;
        el.style.transform = 'translate3d(0,' + shift.toFixed(1) + 'px,0)';
      });
      ticking = false;
    };
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(run); } }, { passive: true });
    window.addEventListener('resize', run);
    run();
  }

  /* ---------- Gold dust in hero (canvas, paused when off-screen / reduced motion) ---------- */
  var cv = $('#dust');
  if (cv && cv.getContext && !reduce) {
    var ctx = cv.getContext('2d'), W, H, dots = [], raf, vis = true;
    var N = window.innerWidth < 700 ? 22 : 46;
    var size = function () {
      var r = cv.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 2);
      W = cv.width = r.width * d; H = cv.height = r.height * d;
    };
    size(); window.addEventListener('resize', size);
    for (var i = 0; i < N; i++) dots.push({ x: Math.random(), y: Math.random(), r: Math.random() * 1.8 + .4, s: Math.random() * .00012 + .00003, a: Math.random() * .6 + .2, p: Math.random() * 6 });
    var t0 = 0;
    var draw = function (t) {
      if (!vis) { raf = 0; return; }
      ctx.clearRect(0, 0, W, H);
      dots.forEach(function (d) {
        d.y -= d.s * 16; d.x += Math.sin(t / 2600 + d.p) * .0002;
        if (d.y < -0.02) { d.y = 1.02; d.x = Math.random(); }
        var tw = .5 + .5 * Math.sin(t / 700 + d.p);
        ctx.beginPath(); ctx.arc(d.x * W, d.y * H, d.r * (W / 1200 + .6), 0, 6.283);
        ctx.fillStyle = 'rgba(252,190,100,' + (d.a * tw).toFixed(3) + ')';
        ctx.shadowColor = 'rgba(252,190,100,.9)'; ctx.shadowBlur = 8; ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (e) { vis = e[0].isIntersecting; if (vis && !raf) raf = requestAnimationFrame(draw); }).observe(cv);
    }
    raf = requestAnimationFrame(draw);
  }

  /* ---------- Before / After sliders ---------- */
  function initBA(ba) {
    var range = $('.ba-range', ba);
    if (!range || ba.__ba) return;
    ba.__ba = true;
    var set = function (v) { ba.style.setProperty('--pos', v + '%'); range.setAttribute('aria-valuetext', Math.round(v) + '% before'); };
    range.addEventListener('input', function () { ba.__touched = true; set(range.value); });
    range.addEventListener('keydown', function (e) { ba.__touched = true; });
    range.addEventListener('pointerdown', function () { ba.__touched = true; });
    set(range.value);
    // one-time demo sweep when the big slider first scrolls into view
    if (ba.hasAttribute('data-demo') && !reduce && 'IntersectionObserver' in window) {
      var o = new IntersectionObserver(function (en) {
        if (!en[0].isIntersecting) return; o.disconnect();
        var start = null, dur = 3600;
        var keys = [50, 18, 82, 50];
        var step = function (ts) {
          if (ba.__touched) return;
          if (!start) start = ts;
          var p = Math.min((ts - start) / dur, 1), seg = p * (keys.length - 1), i = Math.min(Math.floor(seg), keys.length - 2), f = seg - i;
          f = f < .5 ? 2 * f * f : 1 - Math.pow(-2 * f + 2, 2) / 2;
          var v = keys[i] + (keys[i + 1] - keys[i]) * f;
          range.value = v; set(v);
          if (p < 1) requestAnimationFrame(step);
        };
        setTimeout(function () { requestAnimationFrame(step); }, 500);
      }, { threshold: 0.55 });
      o.observe(ba);
    }
  }
  $$('.ba').forEach(initBA);

  /* ---------- Gallery filters ---------- */
  var fbtns = $$('.filter-btn');
  if (fbtns.length) {
    fbtns.forEach(function (b) {
      b.addEventListener('click', function () {
        var f = b.getAttribute('data-filter');
        fbtns.forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        $$('.g-item').forEach(function (it) {
          var show = f === 'all' || (it.getAttribute('data-cat') || '').split(' ').indexOf(f) > -1;
          it.hidden = !show;
        });
      });
    });
  }

  /* ---------- Lightbox ---------- */
  var lb = $('#lightbox');
  if (lb && typeof lb.showModal === 'function') {
    var body = $('.lb-body', lb), cap = $('.lb-cap', lb), cur = -1, list = [], lastFocus;
    var items = function () { return $$('.g-item:not([hidden])').map(function (it) { return it; }); };
    var render = function () {
      var it = list[cur]; if (!it) return;
      body.innerHTML = '';
      var title = it.getAttribute('data-title') || '';
      if (it.classList.contains('pair')) {
        var clone = $('.ba', it).cloneNode(true);
        $$('.ba-expand', clone).forEach(function (x) { x.remove(); });
        clone.__ba = false; var r = $('.ba-range', clone); r.value = 50; clone.style.setProperty('--pos', '50%');
        $$('img', clone).forEach(function (im) { im.loading = 'eager'; });
        body.appendChild(clone); initBA(clone);
      } else {
        var src = $('img', it), im = new Image(); im.src = src.getAttribute('data-full') || src.currentSrc || src.src; im.alt = src.alt; body.appendChild(im);
      }
      cap.textContent = title + '  ·  ' + (cur + 1) + ' / ' + list.length;
    };
    var open = function (it) {
      list = items(); cur = list.indexOf(it); if (cur < 0) return;
      lastFocus = doc.activeElement; render(); lb.showModal();
    };
    var go = function (d) { cur = (cur + d + list.length) % list.length; render(); };
    doc.addEventListener('click', function (e) {
      var p = e.target.closest('.g-photo'); if (p) { open(p.closest('.g-item')); return; }
      var x = e.target.closest('.ba-expand'); if (x) { open(x.closest('.g-item')); }
    });
    var sx = null, sy = 0;
    body.addEventListener('touchstart', function (e) { if (e.target.closest('.ba')) { sx = null; return; } sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
    body.addEventListener('touchend', function (e) {
      if (sx === null) return;
      var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy; sx = null;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) go(dx < 0 ? 1 : -1);
    }, { passive: true });
    $('.lb-close', lb).addEventListener('click', function () { lb.close(); });
    $('.lb-nav.prev', lb).addEventListener('click', function () { go(-1); });
    $('.lb-nav.next', lb).addEventListener('click', function () { go(1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) lb.close(); });
    lb.addEventListener('keydown', function (e) {
      if (e.target.classList && e.target.classList.contains('ba-range')) return; // keep arrows for the slider
      if (e.key === 'ArrowLeft') go(-1); if (e.key === 'ArrowRight') go(1);
    });
    lb.addEventListener('close', function () { body.innerHTML = ''; if (lastFocus) lastFocus.focus(); });
  } else { $$('.ba-expand').forEach(function (b) { b.hidden = true; }); }

  /* ---------- Count-up (About page) ---------- */
  var cu = $('[data-count]');
  if (cu) {
    var target = parseInt(cu.getAttribute('data-count'), 10), suf = cu.getAttribute('data-suffix') || '';
    if (reduce || !('IntersectionObserver' in window)) { cu.textContent = target + suf; }
    else {
      cu.textContent = '0' + suf;
      var co = new IntersectionObserver(function (en) {
        if (!en[0].isIntersecting) return; co.disconnect();
        var s = null, d = 1800;
        var tick = function (ts) { if (!s) s = ts; var p = Math.min((ts - s) / d, 1), e = 1 - Math.pow(1 - p, 3); cu.textContent = Math.round(target * e) + suf; if (p < 1) requestAnimationFrame(tick); };
        requestAnimationFrame(tick);
      }, { threshold: 0.6 });
      co.observe(cu);
    }
  }

  /* ---------- Estimate form ----------
     Default: opens the visitor's email app (mailto) with the details filled in.
     To use Formspree instead: put your endpoint in the form's data-endpoint
     attribute in contact.html, e.g. data-endpoint="https://formspree.io/f/xxxxxxx"  */
  var form = $('#estimateForm');
  if (form) {
    var status = $('#formStatus'), EMAIL = 'info@polishperfectfloors.ca';
    var msgs = { name: 'Please tell us your name.', phone: 'Please add a phone number so we can reach you.' };
    $$('.field', form).forEach(function (f) {
      var inp = $('input,textarea,select', f); if (!inp || !inp.required) return;
      var err = doc.createElement('p'); err.className = 'err'; err.id = inp.id + '-err'; err.textContent = msgs[inp.name] || 'This field is required.';
      f.appendChild(err); inp.setAttribute('aria-describedby', err.id);
      var chk = function () { var bad = !inp.value.trim(); f.classList.toggle('invalid', bad); inp.setAttribute('aria-invalid', bad ? 'true' : 'false'); return !bad; };
      inp.addEventListener('blur', function () { if (inp.value || f.classList.contains('invalid')) chk(); });
      inp.addEventListener('input', function () { if (f.classList.contains('invalid')) chk(); });
      f.__chk = chk;
    });
    var setStatus = function (cls, html) { status.className = 'form-status' + (cls ? ' ' + cls : ''); status.innerHTML = html; };
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var firstBad = null;
      $$('.field', form).forEach(function (f) { if (f.__chk && !f.__chk() && !firstBad) firstBad = $('input,textarea', f); });
      if (firstBad) { firstBad.focus(); setStatus('bad', 'Please check the highlighted fields.'); return; }
      var d = new FormData(form), g = function (k) { return (d.get(k) || '').toString().trim(); };
      if (g('_gotcha')) return;
      var endpoint = (form.getAttribute('data-endpoint') || '').trim();
      if (endpoint) {
        setStatus('', 'Sending…');
        fetch(endpoint, { method: 'POST', body: d, headers: { Accept: 'application/json' } })
          .then(function (r) { if (!r.ok) throw 0; form.reset(); setStatus('ok', 'Thank you. Your request was sent and we will be in touch shortly.'); })
          .catch(function () { setStatus('bad', 'Sorry, that did not send. Please call <a href="tel:+14377076004">437-707-6004</a> or email ' + EMAIL + '.'); });
        return;
      }
      var lines = [
        'Name: ' + g('name'), 'Phone: ' + g('phone'), 'Email: ' + g('email'),
        'Service: ' + g('service'), 'Project location: ' + g('location'),
        '', 'Details:', g('message')
      ];
      var href = 'mailto:' + EMAIL + '?subject=' + encodeURIComponent('Free Estimate Request - ' + g('name')) + '&body=' + encodeURIComponent(lines.join('\n'));
      setStatus('ok', 'Opening your email app with the details filled in. If nothing opens, please email ' + EMAIL + '.');
      window.location.href = href;
    });
  }


  /* ---------- Home service info modals ---------- */
  var svcModal = $('#svc-modal');
  if (svcModal && typeof svcModal.showModal === 'function') {
    var svcTitle = $('#svc-modal-title', svcModal);
    var svcBody = $('#svc-modal-body', svcModal);
    var svcClose = $('.svc-modal-close', svcModal);
    var svcLast = null;
    var svcCopy = {
      sanding: {
        title: 'Sanding',
        html: '<p>Foot traffic, furniture, pets and sun wear floors down. Sanding begins with careful prep, then the worn finish, scratches and scuffs are taken back to fresh timber.</p><ol><li>Careful prep before any sanding starts</li><li>Worn finish, scratches and scuffs are removed</li><li>The surface is left smooth, even and uniform</li></ol><p>The natural character of the timber comes back, and the floor is ready for stain or a new clear coat.</p>'
      },
      refinishing: {
        title: 'Refinishing',
        html: '<p>Once the surface is ready, the floor is refinished so the beauty of the timber can come back.</p><p>A new finish is applied over freshly prepared timber. This is used on hardwood and engineered wood, for new timber floors and for the restoration of existing ones.</p><p>The result is a renewed surface with a fresh finish in place of the worn one.</p>'
      },
      staining: {
        title: 'Staining',
        html: '<p>Colour sets the mood. We help you choose a stain colour to suit your home, then we stain the floor.</p><p>Stain is applied to hardwood and engineered wood so the grain keeps its depth and character.</p><p>The finished colour sits in the timber, ready to be protected with a clear coat.</p>'
      },
      'clear-coat': {
        title: 'Clear Coat',
        html: '<p>Clear coat protects the colour. It is applied with care as the final step, sealing and protecting the work.</p><p>Finishes are chosen for depth and clarity, allowing the natural beauty of the timber to remain visible beneath a protective coat.</p><p>Where needed, we can also apply an anti-slip coating to provide additional grip and improve floor safety.</p><p>The finished floor has a smooth, even, protective finish that preserves the colour and enhances the beauty of the timber.</p>'
      }
    };
    var openSvc = function (key, btn) {
      var c = svcCopy[key]; if (!c) return;
      svcTitle.textContent = c.title;
      svcBody.innerHTML = c.html;
      svcLast = btn || doc.activeElement;
      doc.body.classList.add('svc-modal-open');
      if (!svcModal.open) svcModal.showModal();
      if (svcClose) svcClose.focus();
    };
    var closeSvc = function () { if (svcModal.open) svcModal.close(); };
    svcModal.addEventListener('close', function () {
      doc.body.classList.remove('svc-modal-open');
      if (svcLast && typeof svcLast.focus === 'function') svcLast.focus();
    });
    if (svcClose) svcClose.addEventListener('click', closeSvc);
    svcModal.addEventListener('click', function (e) {
      if (e.target === svcModal) closeSvc();
    });
    $$('.svc-card').forEach(function (btn) {
      btn.addEventListener('click', function () { openSvc(btn.getAttribute('data-svc'), btn); });
    });
  }

})();
