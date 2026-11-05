/* БФ «Стабілізейшен Суппорт Сервісез» — анімації головної сторінки */
(function () {
  'use strict';
  var root = document.documentElement;
  var mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  var reduce = !!(mq && mq.matches);
  root.classList.add('js');

  /* 1. Логотип «перелітає» з першого екрана в бейдж у лівому верхньому куті.
        Переліт запускається, коли сторінку прокрутили на ~60 px, і відтворюється
        як самостійна CSS-анімація (не прив'язана до кожного кадру прокрутки) —
        тому на телефонах він плавний, без ривків. */
  function heroLogo() {
    var hero = document.getElementById('hero');
    var spacer = document.querySelector('.hero-logo-static img');
    var slot = document.querySelector('.badge-logo');
    var fly = document.querySelector('.fly-logo');
    var home = document.querySelector('.badge-home');
    var badge = document.querySelector('.badge');
    if (!hero || !spacer || !slot || !fly || !home || !badge) return;

    var THRESHOLD = 60, DUR = 560;
    var EASE = 'cubic-bezier(.65,0,.35,1)';
    var state = 'hero', heroTop = 0, ticking = false, token = 0;

    function measureTop() { heroTop = hero.getBoundingClientRect().top + window.pageYOffset; }
    function rectTransform(r) {
      var h0 = spacer.offsetHeight || 1;
      return 'translate3d(' + r.left.toFixed(1) + 'px,' + r.top.toFixed(1) + 'px,0) scale(' + (r.height / h0).toFixed(4) + ')';
    }
    function showHome(on) {
      home.style.transition = 'opacity .25s ease';
      home.style.opacity = on ? '1' : '0';
      home.style.visibility = on ? 'visible' : 'hidden';
      badge.style.transition = 'box-shadow .3s ease';
      badge.style.boxShadow = on ? '0 6px 24px rgba(2,21,56,.25)' : '0 6px 24px rgba(2,21,56,0)';
    }
    function flyTo(toBadge) {
      var my = ++token;
      var from = toBadge ? spacer.getBoundingClientRect() : slot.getBoundingClientRect();
      var to = toBadge ? slot.getBoundingClientRect() : spacer.getBoundingClientRect();
      if (!toBadge) showHome(false);
      if (reduce) {
        spacer.style.opacity = toBadge ? '0' : '1';
        if (toBadge) showHome(true);
        return;
      }
      fly.style.transition = 'none';
      fly.style.transform = rectTransform(from);
      fly.style.opacity = '1';
      fly.style.visibility = 'visible';
      fly.style.display = 'block';
      spacer.style.opacity = '0';
      fly.getBoundingClientRect(); /* фіксуємо стартову позицію */
      requestAnimationFrame(function () {
        if (my !== token) return;
        fly.style.transition = 'transform ' + DUR + 'ms ' + EASE;
        fly.style.transform = rectTransform(to);
        setTimeout(function () {
          if (my !== token) return;
          if (toBadge) { showHome(true); fly.style.visibility = 'hidden'; }
          else { spacer.style.opacity = '1'; fly.style.visibility = 'hidden'; }
        }, DUR + 20);
      });
    }
    function check() {
      ticking = false;
      var s = window.pageYOffset - heroTop;
      var next = s > THRESHOLD ? 'badge' : 'hero';
      if (next !== state) { state = next; flyTo(next === 'badge'); }
    }
    function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(check); } }

    fly.style.willChange = 'transform';
    fly.style.visibility = 'hidden';
    fly.style.display = 'block';
    measureTop();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', function () { measureTop(); onScroll(); });
    window.addEventListener('load', function () { measureTop(); onScroll(); });
    /* якщо сторінку відкрили вже прокрученою — одразу показуємо бейдж */
    if (window.pageYOffset - heroTop > THRESHOLD) { state = 'badge'; spacer.style.opacity = '0'; showHome(true); }
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
