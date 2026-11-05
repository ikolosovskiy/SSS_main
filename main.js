/* БФ «Стабілізейшен Суппорт Сервісез» — анімації головної сторінки */
(function () {
  'use strict';
  var root = document.documentElement;
  var mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  var reduce = !!(mq && mq.matches);
  root.classList.add('js');

  /* 1. Логотип «перелітає» з першого екрана в бейдж у лівому верхньому куті.
        Позиції вимірюються лише при завантаженні/зміні розміру екрана,
        а під час прокрутки змінюється тільки transform (GPU) — плавно і на телефонах. */
  function heroLogo() {
    var hero = document.getElementById('hero');
    var spacer = document.querySelector('.hero-logo-static img');
    var slot = document.querySelector('.badge-logo');
    var fly = document.querySelector('.fly-logo');
    var home = document.querySelector('.badge-home');
    var badge = document.querySelector('.badge');
    var wrap = document.querySelector('.hero-wrap');
    if (!hero || !spacer || !slot || !fly || !home || !badge) return;

    var m = {}, raf = 0, lastPb = -1;
    var ease = function (x) { return 1 - Math.pow(1 - x, 3); };

    function measure() {
      var sy = window.pageYOffset;
      var a = spacer.getBoundingClientRect(), b = slot.getBoundingClientRect(), h = hero.getBoundingClientRect();
      m.ax = a.left; m.ay = a.top + sy; m.h0 = spacer.offsetHeight || a.height || 1;
      m.bx = b.left; m.by = b.top; m.bh = b.height || 26;
      m.heroTop = h.top + sy; m.heroH = h.height;
    }

    function setBadge(pb) {
      if (pb === lastPb) return;
      lastPb = pb;
      home.style.opacity = String(pb);
      home.style.visibility = pb > 0 ? 'visible' : 'hidden';
      badge.style.boxShadow = '0 6px 24px rgba(2,21,56,' + (pb * 0.25).toFixed(3) + ')';
    }

    if (reduce) {
      /* Без анімації: великий логотип стоїть на фото, бейдж з логотипом з'являється після першого екрана */
      var onScrollStatic = function () {
        var s = window.pageYOffset - (m.heroTop || 0);
        setBadge(s > 220 ? 1 : 0);
      };
      measure();
      window.addEventListener('scroll', onScrollStatic, { passive: true });
      window.addEventListener('resize', function () { measure(); onScrollStatic(); });
      onScrollStatic();
      return;
    }

    fly.style.display = 'block';
    spacer.style.opacity = '0';

    function apply() {
      raf = 0;
      var sy = window.pageYOffset;
      var s = Math.max(0, sy - m.heroTop);
      var p = ease(Math.min(1, s / 240));
      var ayScreen = m.ay - sy;
      var x = m.ax + (m.bx - m.ax) * p;
      var y = ayScreen + (m.by - ayScreen) * p;
      var sc = 1 + (m.bh / m.h0 - 1) * p;
      var pb = Math.max(0, Math.min(1, (p - 0.9) / 0.1));
      fly.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0) scale(' + sc.toFixed(4) + ')';
      fly.style.opacity = String(1 - pb);
      fly.style.visibility = pb > 0.99 ? 'hidden' : 'visible';
      setBadge(Math.round(pb * 100) / 100);
      if (wrap && s < m.heroH + 200) wrap.style.transform = 'translate3d(0,' + (s * 0.3).toFixed(1) + 'px,0)';
    }
    function schedule() { if (!raf) raf = requestAnimationFrame(apply); }
    function remeasure() { measure(); schedule(); }

    measure();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', remeasure);
    window.addEventListener('orientationchange', remeasure);
    window.addEventListener('load', remeasure);
    spacer.addEventListener('load', remeasure);
    slot.addEventListener('load', remeasure);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(remeasure);
    apply();
  }

  /* 2. Лічильник великих цифр */
  function counters() {
    var list = document.getElementById('stats-list');
    var items = document.querySelectorAll('[data-count]');
    if (!list || !items.length || reduce || !('IntersectionObserver' in window)) return;
    var fmt = function (v) { return String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); };
    items.forEach(function (el) { el.textContent = fmt(0); });
    var io = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) return;
      io.disconnect();
      var t0 = performance.now(), dur = 1800;
      (function step(now) {
        var x = Math.min(1, (now - t0) / dur), k = 1 - Math.pow(1 - x, 3);
        items.forEach(function (el) { el.textContent = fmt(Number(el.getAttribute('data-count')) * k); });
        if (x < 1) requestAnimationFrame(step);
      })(t0);
    }, { threshold: 0.25 });
    io.observe(list);
  }

  /* 3. «Що ми робимо?» — рядки вилітають збоку */
  function directions() {
    var rows = document.querySelectorAll('.dir-row');
    if (!rows.length) return;
    if (reduce || !('IntersectionObserver' in window)) { rows.forEach(function (r) { r.classList.add('on'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('on'); io.unobserve(en.target); }
      });
    }, { threshold: 0.2, rootMargin: '0px 0px -6% 0px' });
    rows.forEach(function (r) { io.observe(r); });
  }

  /* 4. Повноекранне меню */
  function menu() {
    var m = document.getElementById('site-menu');
    if (!m) return;
    var left = m.querySelector('.menu-left'), right = m.querySelector('.menu-right');
    var openers = document.querySelectorAll('[data-menu-open]');
    var closers = m.querySelectorAll('[data-menu-close]');
    var lastFocus = null, isOpen = false;
    function set(open) {
      isOpen = open;
      m.style.visibility = open ? 'visible' : 'hidden';
      m.style.pointerEvents = open ? 'auto' : 'none';
      left.style.transform = open ? 'none' : 'translateX(-105%)';
      right.style.opacity = open ? '1' : '0';
      openers.forEach(function (b) { b.setAttribute('aria-expanded', open ? 'true' : 'false'); });
      root.style.overflow = open ? 'hidden' : '';
      document.body.style.overflow = open ? 'hidden' : '';
      if (open) {
        lastFocus = document.activeElement;
        var first = m.querySelector('a, button, input');
        if (first) setTimeout(function () { first.focus({ preventScroll: true }); }, 60);
      } else if (lastFocus) {
        lastFocus.focus({ preventScroll: true });
      }
    }
    openers.forEach(function (b) { b.addEventListener('click', function () { set(true); }); });
    closers.forEach(function (b) { b.addEventListener('click', function () { set(false); }); });
    m.querySelectorAll('a[href^="#"]').forEach(function (a) { a.addEventListener('click', function () { set(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && isOpen) set(false); });
  }

  function init() { heroLogo(); counters(); directions(); menu(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
