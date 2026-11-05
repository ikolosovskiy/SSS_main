/* БФ «Стабілізейшен Суппорт Сервісез» — анімації головної сторінки */
(function () {
  'use strict';
  var root = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  root.classList.add('js');

  /* 1. Логотип «перелітає» з першого екрана в бейдж у лівому верхньому куті */
  function heroLogo() {
    var hero = document.getElementById('hero');
    var spacer = document.querySelector('.hero-logo-static img');
    var slot = document.querySelector('.badge-logo');
    if (!hero || !spacer || !slot) return;
    if (reduce) {
      root.style.setProperty('--pb', '1');
      root.style.setProperty('--bv', 'visible');
      return;
    }
    var raf = 0;
    var ease = function (x) { return 1 - Math.pow(1 - x, 3); };
    root.style.setProperty('--fd', 'block');
    root.style.setProperty('--sv', '0');
    function apply() {
      raf = 0;
      var s = Math.max(0, -hero.getBoundingClientRect().top);
      var p = ease(Math.min(1, s / 240));
      var a = spacer.getBoundingClientRect(), b = slot.getBoundingClientRect();
      var h0 = spacer.offsetHeight || a.height || 1;
      var pb = Math.max(0, Math.min(1, (p - 0.9) / 0.1));
      root.style.setProperty('--fx', (a.left + (b.left - a.left) * p).toFixed(1));
      root.style.setProperty('--fy', (a.top + (b.top - a.top) * p).toFixed(1));
      root.style.setProperty('--fs', (1 + (b.height / h0 - 1) * p).toFixed(4));
      root.style.setProperty('--pb', pb.toFixed(3));
      root.style.setProperty('--bv', pb > 0 ? 'visible' : 'hidden');
      root.style.setProperty('--sy', String(Math.round(s)));
    }
    function schedule() { if (!raf) raf = requestAnimationFrame(apply); }
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    spacer.addEventListener('load', schedule);
    slot.addEventListener('load', schedule);
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
    }, { threshold: 0.35, rootMargin: '0px 0px -8% 0px' });
    rows.forEach(function (r) { io.observe(r); });
  }

  /* 4. Повноекранне меню */
  function menu() {
    var m = document.getElementById('site-menu');
    if (!m) return;
    var left = m.querySelector('.menu-left'), right = m.querySelector('.menu-right');
    var openers = document.querySelectorAll('[data-menu-open]');
    var closers = m.querySelectorAll('[data-menu-close]');
    var lastFocus = null;
    function set(open) {
      m.style.visibility = open ? 'visible' : 'hidden';
      m.style.pointerEvents = open ? 'auto' : 'none';
      left.style.transform = open ? 'none' : 'translateX(-105%)';
      right.style.opacity = open ? '1' : '0';
      openers.forEach(function (b) { b.setAttribute('aria-expanded', open ? 'true' : 'false'); });
      document.body.style.overflow = open ? 'hidden' : '';
      if (open) {
        lastFocus = document.activeElement;
        var first = m.querySelector('a, button, input');
        if (first) setTimeout(function () { first.focus(); }, 50);
      } else if (lastFocus) {
        lastFocus.focus();
      }
    }
    openers.forEach(function (b) { b.addEventListener('click', function () { set(true); }); });
    closers.forEach(function (b) { b.addEventListener('click', function () { set(false); }); });
    m.querySelectorAll('a[href^="#"]').forEach(function (a) { a.addEventListener('click', function () { set(false); }); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && m.style.visibility === 'visible') set(false);
    });
  }

  function init() { heroLogo(); counters(); directions(); menu(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
