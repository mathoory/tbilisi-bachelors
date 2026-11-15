/* Tbilisi 19-23.11.2026 - motion + sound. Vanilla, no dependencies. */
(function () {
  'use strict';
  window.__tbilisi = true;

  /* ---------- the lock ----------
     The page content ships encrypted (AES-GCM; key derived from the group's code with PBKDF2).
     It is decrypted here, in the browser; the code is never sent anywhere. A phone that has
     entered the code once remembers the derived key. A link ending in #code=... unlocks itself. */
  var doc = document.documentElement;
  var vault = document.getElementById('vault');
  if (!vault) { start(); return; }

  function bi0(en, he) { return '<span class="l-en">' + en + '</span><span class="l-he" lang="he">' + he + '</span>'; }
  function fromB64(s) { var bin = atob(s), u = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u; }
  function toB64(buf) { var u = new Uint8Array(buf), s = ''; for (var i = 0; i < u.length; i++) s += String.fromCharCode(u[i]); return btoa(s); }

  var KEYNAME = 'tbilisi:key:' + location.pathname;
  var lock = null, subtle = window.crypto && window.crypto.subtle;
  var salt = fromB64(vault.getAttribute('data-salt')), iv = fromB64(vault.getAttribute('data-iv'));
  var iter = parseInt(vault.getAttribute('data-iter'), 10), sealed = fromB64(vault.textContent.trim());

  function derive(code) {
    return subtle.importKey('raw', new TextEncoder().encode(code.trim().toLowerCase()), 'PBKDF2', false, ['deriveBits'])
      .then(function (k) { return subtle.deriveBits({ name: 'PBKDF2', salt: salt, iterations: iter, hash: 'SHA-256' }, k, 256); });
  }
  function unseal(raw) {
    return subtle.importKey('raw', raw, 'AES-GCM', false, ['decrypt'])
      .then(function (k) { return subtle.decrypt({ name: 'AES-GCM', iv: iv }, k, sealed); })
      .then(function (buf) { return new TextDecoder().decode(buf); });
  }
  function reveal(html, raw) {
    try { localStorage.setItem(KEYNAME, toB64(raw)); } catch (e) {}
    vault.insertAdjacentHTML('afterend', html);
    vault.parentNode.removeChild(vault);
    if (lock && lock.parentNode) lock.parentNode.removeChild(lock);
    doc.classList.remove('gated');
    start();
  }
  function tryCode(code, onFail) {
    derive(code).then(function (raw) { return unseal(raw).then(function (html) { reveal(html, raw); }); }).catch(onFail);
  }
  function showLock() {
    if (lock) return;
    lock = document.createElement('div');
    lock.className = 'gate lock';
    lock.setAttribute('role', 'dialog');
    lock.setAttribute('aria-label', 'Enter the code');
    lock.innerHTML =
      '<div class="gate-in">' +
      '<div class="gate-k">' + bi0('BACHELOR WEEKEND', 'סופ״ש רווקים') + '</div>' +
      '<div class="gate-t">' + bi0('<small>Snir takes</small>Tbilisi', '<small>שניר כובש את</small>טביליסי') + '</div>' +
      '<div class="gate-d">19-23.11.2026</div>' +
      '<form class="lock-f" novalidate>' +
      '<div class="gate-play">' + bi0('ENTER THE CODE', 'הכניסו את הקוד') + '</div>' +
      '<input class="lock-i" type="text" inputmode="text" autocapitalize="none" autocomplete="off" autocorrect="off" spellcheck="false" aria-label="Code" dir="ltr">' +
      '<button class="lock-b" type="submit">' + bi0('ENTER', 'כניסה') + '</button>' +
      '<div class="lock-m" aria-live="polite">' + bi0("IT'S IN THE GROUP CHAT", 'הקוד בקבוצת הווטסאפ') + '</div>' +
      '</form></div>';
    document.body.appendChild(lock);
    doc.classList.add('gated');
    var form = lock.querySelector('form'), input = lock.querySelector('.lock-i');
    var btn = lock.querySelector('.lock-b'), msg = lock.querySelector('.lock-m');
    if (!subtle) { msg.innerHTML = bi0('THIS BROWSER CANNOT OPEN THE PAGE', 'הדפדפן הזה לא יכול לפתוח את העמוד'); btn.disabled = true; return; }
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      if (!input.value.trim() || btn.disabled) return;
      btn.disabled = true;
      msg.innerHTML = bi0('CHECKING...', 'בודק...');
      tryCode(input.value, function () {
        btn.disabled = false;
        msg.innerHTML = bi0('WRONG CODE', 'קוד שגוי');
        lock.classList.add('bad');
        setTimeout(function () { lock.classList.remove('bad'); }, 500);
        input.select();
      });
    });
  }

  var hashCode = (location.hash.match(/[#&]code=([^&]+)/) || [])[1];
  if (hashCode) { try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {} }
  function fresh() {
    if (hashCode && subtle) tryCode(decodeURIComponent(hashCode), showLock); else showLock();
  }
  var saved = null;
  try { saved = localStorage.getItem(KEYNAME); } catch (e) {}
  if (saved && subtle) {
    var rawSaved = fromB64(saved).buffer;
    unseal(rawSaved).then(function (html) { reveal(html, rawSaved); }).catch(function () {
      try { localStorage.removeItem(KEYNAME); } catch (e) {}
      fresh();
    });
  } else fresh();

  /* ---------- everything below runs once the content is on the page ---------- */
  function start() {

  // D.Dan's official SoundCloud profile (verified badge, links to his RA / Instagram / Bandcamp).
  // He headlines the Bassiani night. This is the only place the URL lives.
  var SOUNDCLOUD_URL = 'https://soundcloud.com/ddan-sounds';
  var SOUNDCLOUD_API = 'https://w.soundcloud.com/player/api.js';

  var root = document.documentElement;
  var mo = root.classList.contains('mo');

  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  /* ---------- scroll reveals (staggered) + neon strike-on ---------- */
  // held back until the entrance popup is gone, so nobody misses the first animations
  var started = false;
  function startMotion() {
    if (started || !mo) return;
    started = true;
    var revealIO = new IntersectionObserver(function (entries) {
      var n = 0;
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.style.setProperty('--st', Math.min(n++, 8) * 70 + 'ms');
        en.target.classList.add('in');
        revealIO.unobserve(en.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });
    $$('.rv').forEach(function (el) { revealIO.observe(el); });

    // a sign only strikes on once most of it is on screen, and the skyline only
    // starts drawing once all of it is, so nobody misses the animation
    var lightWhen = function (ratio) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          // once it has scrolled fully out of view it goes dark again,
          // so it strikes on / redraws every time you come back to it
          if (!en.isIntersecting) en.target.classList.remove('on');
          else if (en.intersectionRatio >= ratio) en.target.classList.add('on');
        });
      }, { threshold: [0, ratio] });
      return io;
    };
    var signIO = lightWhen(0.7), skyIO = lightWhen(0.95);
    $$('.neon').forEach(function (el) { (el.classList.contains('sl') ? skyIO : signIO).observe(el); });
  }

  /* ---------- top bar: current section + progress, and slight parallax ---------- */
  var links = $$('.bar nav a');
  var secs = links.map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); });
  var prog = document.querySelector('.prog');
  var pars = mo ? $$('[data-par]') : [];
  var wide = window.matchMedia('(min-width: 1100px)');
  var ticking = false;
  var whereBtn = document.getElementById('where'), whereT = document.querySelector('.where-t');
  var brandEl = document.querySelector('.brand'), brandHTML = brandEl ? brandEl.innerHTML : '', shownCur = -1;

  function frame() {
    ticking = false;
    var vh = window.innerHeight, y = window.pageYOffset;
    var max = document.documentElement.scrollHeight - vh;
    if (prog) prog.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, y / max) : 0) + ')';

    var cur = -1;
    secs.forEach(function (s, i) { if (s && s.getBoundingClientRect().top <= vh * 0.45) cur = i; });
    links.forEach(function (a, i) { a.classList.toggle('cur', i === cur); });
    // phones: the left side of the bar names the section you are in
    if (cur !== shownCur && whereT) {
      shownCur = cur;
      whereT.innerHTML = cur < 0 ? brandHTML : links[cur].innerHTML;
    }

    pars.forEach(function (el) {
      var sign = el.classList.contains('sg');
      if (sign && !wide.matches) { el.style.removeProperty('--py'); return; }
      var box = (sign ? el : el.parentNode).getBoundingClientRect();
      if (box.bottom < -200 || box.top > vh + 200) return;
      var off = (box.top + box.height / 2 - vh / 2) * parseFloat(el.getAttribute('data-par'));
      if (sign) {
        // margin signs drift against the scroll; --py is excluded from the rect on the next read
        var prev = parseFloat(el.style.getPropertyValue('--py')) || 0;
        var base = (box.top - prev + box.height / 2 - vh / 2) * parseFloat(el.getAttribute('data-par'));
        el.style.setProperty('--py', Math.max(-60, Math.min(60, -base * 1.6)).toFixed(1) + 'px');
      } else {
        // titles: a few pixels only, so nothing can ever touch its neighbours
        el.style.transform = 'translate3d(0,' + Math.max(-6, Math.min(6, off)).toFixed(1) + 'px,0)';
      }
    });
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  frame();

  /* ---------- phones: tapping the section name opens the list of sections ---------- */
  var bar = document.querySelector('.bar');
  function menu(open) {
    bar.classList.toggle('open', open);
    whereBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  if (bar && whereBtn) {
    whereBtn.addEventListener('click', function () { menu(!bar.classList.contains('open')); });
    links.forEach(function (a) { a.addEventListener('click', function () { menu(false); }); });
    document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape') menu(false); });
    document.addEventListener('pointerdown', function (ev) { if (!bar.contains(ev.target)) menu(false); });
  }

  /* ---------- language: both languages are in the page, the button flips them ---------- */
  function store(key, val) { try { if (val === null) localStorage.removeItem(key); else localStorage.setItem(key, val); } catch (e) {} }
  function stored(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }
  function bi(en, he) { return '<span class="l-en">' + en + '</span><span class="l-he" lang="he">' + he + '</span>'; }
  function setLang(l) {
    var he = l === 'he';
    root.classList.toggle('he', he);
    root.lang = he ? 'he' : 'en';
    root.dir = he ? 'rtl' : 'ltr';
    store('tbilisi:lang', he ? 'he' : 'en');
    if (bar) bar.classList.remove('hint');
    onScroll();
  }
  // any EN / Hebrew button on the page (top bar and entrance popup)
  document.addEventListener('click', function (ev) {
    var b = ev.target.closest && ev.target.closest('.langs [data-lang]');
    if (b) setLang(b.getAttribute('data-lang'));
  });
  // first visit: a small arrow under the button shows the page can switch language
  function langHint() {
    if (!bar || stored('tbilisi:lang')) return;
    bar.classList.add('hint');
    setTimeout(function () { bar.classList.remove('hint'); }, 9000);
  }

  /* ---------- live weather in Tbilisi, next to the name in the top bar ----------
     Open-Meteo: free, no key, nothing about the visitor is sent. If it fails, nothing shows. */
  var WEATHER_URL = 'https://api.open-meteo.com/v1/forecast?latitude=41.7151&longitude=44.8271&current=temperature_2m,weather_code';
  var wx = document.querySelector('.brand .wx');
  if (wx && window.fetch) {
    fetch(WEATHER_URL).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
      if (!d || !d.current || typeof d.current.temperature_2m !== 'number') return;
      var code = d.current.weather_code, sky = '';
      if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95) sky = ' ' + bi('RAIN', 'גשם');
      else if ((code >= 71 && code <= 77) || code === 85 || code === 86) sky = ' ' + bi('SNOW', 'שלג');
      wx.innerHTML = '<span dir="ltr">' + Math.round(d.current.temperature_2m) + '\u00B0C</span>' + sky;
      wx.hidden = false;
      brandHTML = brandEl.innerHTML;
      if (shownCur < 0 && whereT) whereT.innerHTML = brandHTML;
    }).catch(function () {});
  }

  /* ---------- live countdown: to take-off, then to the next stop on the plan ---------- */
  var count = document.getElementById('count');
  if (count) {
    var takeoff = Date.parse(count.getAttribute('data-takeoff')), stops = [];
    try { stops = JSON.parse(count.getAttribute('data-stops')); } catch (e) {}
    var cLabel = count.querySelector('.count-l'), cUnits = {}, lastLabel = '';
    $$('.cu', count).forEach(function (u) { cUnits[u.getAttribute('data-u')] = u; });
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    var tickCount = function () {
      var now = Date.now(), target = null, label = '';
      if (now < takeoff) { target = takeoff; label = bi('TAKE-OFF IN', 'המראה בעוד'); }
      else {
        for (var i = 0; i < stops.length; i++) {
          var t = Date.parse(stops[i][0]);
          if (t > now) { target = t; label = bi('NEXT: ' + stops[i][1] + ' IN', 'הבא: ' + stops[i][2] + ' בעוד'); break; }
        }
      }
      if (target === null) { count.hidden = true; return; }
      var sec = Math.floor((target - now) / 1000);
      var d = Math.floor(sec / 86400), h = Math.floor(sec % 86400 / 3600), m = Math.floor(sec % 3600 / 60);
      if (label !== lastLabel) { cLabel.innerHTML = label; lastLabel = label; }
      cUnits.d.hidden = d === 0;
      cUnits.d.firstChild.textContent = pad(d);
      cUnits.h.firstChild.textContent = pad(h);
      cUnits.m.firstChild.textContent = pad(m);
      cUnits.s.firstChild.textContent = pad(sec % 60);
      count.hidden = false;
    };
    tickCount();
    setInterval(tickCount, 1000);
  }

  /* ---------- during the trip, the next stop on the plan glows ---------- */
  var timed = $$('.prow[data-t]'), nextRow = null;
  var nextUp = document.getElementById('nextup'), coverEl = document.getElementById('cover');
  function markNext() {
    var now = Date.now(), pick = null;
    // only from the morning of departure until the last stop has passed
    if (timed.length && now >= Date.parse(timed[0].getAttribute('data-t')) - 8 * 3600 * 1000) {
      for (var i = 0; i < timed.length; i++) {
        if (Date.parse(timed[i].getAttribute('data-t')) > now) { pick = timed[i]; break; }
      }
    }
    if (pick === nextRow) return;
    if (nextRow) nextRow.classList.remove('next');
    if (pick) pick.classList.add('next');
    nextRow = pick;
    // ...and the same stop is repeated at the very top of the page, under the countdown
    if (nextUp) {
      nextUp.innerHTML = pick ? '<div class="prow in">' + pick.innerHTML + '</div>' : '';
      nextUp.hidden = !pick;
      if (coverEl) coverEl.classList.toggle('trip', !!pick);
    }
  }
  markNext();
  setInterval(markNext, 20000);

  /* ---------- prep checklist remembers its ticks on this phone ---------- */
  $$('.chk input').forEach(function (box) {
    var key = 'tbilisi:' + box.getAttribute('data-k');
    try { box.checked = localStorage.getItem(key) === '1'; } catch (e) {}
    box.addEventListener('change', function () {
      try { localStorage.setItem(key, box.checked ? '1' : '0'); } catch (e) {}
    });
  });

  /* ---------- sound ----------
     Phone browsers block autoplay with sound, and only a tap on the player itself is
     guaranteed to start it. So the page opens behind an entrance popup that holds the real
     SoundCloud player with an arrow on its play button. Pressing play starts the music and
     opens the page; after that the player is out of sight, the top bar scrolls the track
     name, and the SOUND button pauses / resumes. Where the browser does allow autoplay the
     popup opens by itself. If the embed fails to load, the page simply opens without sound. */
  var btn = document.getElementById('snd');
  var tickIns = $$('.tick-in');
  if (!btn) { root.classList.remove('pre'); startMotion(); return; }
  var label = btn.querySelector('.snd-t');
  // Phones block autoplay with sound, so there we never try it: the visitor presses play.
  // (?noauto in the URL forces the same behaviour on a desktop, for testing.)
  var TOUCH = (window.matchMedia && matchMedia('(pointer: coarse)').matches) || navigator.maxTouchPoints > 0;
  var QUIET = stored('tbilisi:nosound') === '1'; // ticked "don't ask again" earlier
  var NOAUTO = TOUCH || QUIET || /[?&]noauto\b/.test(location.search);
  var state = 'off', widget = null, gate = null, deck = null, ready = false;
  var loadTimer = null, nudgeTimer = null;
  var muted = false, lastPos = -1; // muted: the visitor switched the sound off

  function set(s, text) {
    state = s;
    btn.setAttribute('data-state', s);
    btn.setAttribute('aria-pressed', s === 'on' ? 'true' : 'false');
    label.innerHTML = text;
    if (bar) bar.classList.toggle('playing', s === 'on');
  }
  function openGate() {
    if (!gate) return;
    gate.classList.remove('gone');
    root.classList.add('gated');
  }
  function closeGate() {
    if (gate) gate.classList.add('gone');
    root.classList.remove('gated');
    if (!started) setTimeout(langHint, 1200);
    startMotion();
  }
  function dead() {
    clearTimeout(loadTimer); clearTimeout(nudgeTimer);
    widget = null; ready = false;
    set('dead', bi('NO SOUND', 'אין סאונד'));
    btn.disabled = true;
    closeGate();
  }
  function play() {
    if (!widget || !ready) return;
    try { widget.play(); } catch (e) {}
  }
  // old-school player ticker: the track name scrolls along the top bar
  function ticker() {
    if (!widget || !tickIns.length) return;
    widget.getCurrentSound(function (snd) {
      if (!snd || !snd.title) return;
      var who = (snd.user && snd.user.username) || '';
      var title = snd.title;
      if (who && title.toLowerCase().indexOf(who.toLowerCase()) !== 0) title = who + ' - ' + title;
      var unit = '▶ ' + title + '  +++  ', half = '';
      while (half.length < 110) half += unit;
      tickIns.forEach(function (el) {
        el.textContent = half + half;
        el.style.setProperty('--td', (half.length * 0.26).toFixed(1) + 's');
      });
    });
  }

  function build() {
    set('load', bi('LOADING', 'טוען'));
    gate = document.createElement('div');
    gate.className = 'gate';
    gate.setAttribute('role', 'dialog');
    gate.setAttribute('aria-label', 'Press play to enter with sound');
    gate.innerHTML =
      '<div class="gate-in">' +
      '<div class="langs" role="group" aria-label="Language"><button type="button" data-lang="en">EN</button><button type="button" data-lang="he" lang="he">עברית</button></div>' +
      '<div class="gate-k">' + bi('BACHELOR WEEKEND', 'סופ״ש רווקים') + '</div>' +
      '<div class="gate-t">' + bi('<small>Snir takes</small>Tbilisi', '<small>שניר כובש את</small>טביליסי') + '</div>' +
      '<div class="gate-d">19-23.11.2026</div>' +
      '<div class="gate-play">' + bi('PRESS PLAY', 'לחצו פליי') + '</div>' +
      '<div class="gate-sub">' + bi('TO ENTER WITH SOUND / D.DAN', 'כדי להיכנס עם סאונד / D.DAN') + '</div>' +
      '<div class="deck"><svg class="arrow" aria-hidden="true" viewBox="0 0 48 70" fill="none" stroke-linecap="round" stroke-linejoin="round">' +
      '<path class="tube" d="M24 5 L24 62 M6 42 L24 63 L42 42"/><path class="core" d="M24 5 L24 62 M6 42 L24 63 L42 42"/></svg></div>' +
      '<button type="button" class="gate-skip">' + bi('ENTER WITHOUT SOUND', 'כניסה בלי סאונד') + '</button>' +
      '<label class="gate-never"><input type="checkbox">' + bi("DON'T ASK AGAIN", 'אל תשאלו שוב') + '</label>' +
      '</div>';
    deck = gate.querySelector('.deck');
    var frameEl = document.createElement('iframe');
    frameEl.title = 'D.Dan on SoundCloud';
    frameEl.allow = 'autoplay';
    frameEl.setAttribute('scrolling', 'no');
    frameEl.src = 'https://w.soundcloud.com/player/?url=' + encodeURIComponent(SOUNDCLOUD_URL) +
      '&auto_play=' + (NOAUTO ? 'false' : 'true') +
      '&color=%23ff3da5&hide_related=true&show_comments=false&show_reposts=false&show_teaser=false&show_user=true&visual=false';
    deck.appendChild(frameEl);
    document.body.appendChild(gate);
    root.classList.remove('pre');
    if (QUIET) closeGate(); else root.classList.add('gated');

    gate.querySelector('.gate-skip').addEventListener('click', function () {
      // "don't ask again": next visits open straight into the page, until SOUND is switched on
      if (gate.querySelector('.gate-never input').checked) store('tbilisi:nosound', '1');
      closeGate();
    });
    // a tap anywhere else on the popup also tries to start it (enough on Android and desktop)
    gate.addEventListener('click', function (ev) {
      if (ev.target.closest && ev.target.closest('.gate-skip, .gate-never, .langs')) return;
      play();
    });
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape' && gate && !gate.classList.contains('gone')) closeGate();
    });

    loadTimer = setTimeout(dead, 15000);
    var s = document.createElement('script');
    s.src = SOUNDCLOUD_API;
    s.async = true;
    s.onerror = dead;
    s.onload = function () {
      try {
        var E = window.SC.Widget.Events;
        widget = window.SC.Widget(frameEl);
        widget.bind(E.READY, function () {
          clearTimeout(loadTimer);
          ready = true;
          deck.classList.add('ready');
          set('off', bi('SOUND OFF', 'סאונד כבוי'));
          if (!NOAUTO) play();
        });
        // The player reports "play" even when the browser then blocks the audio, so the
        // popup only opens once the track position is really moving.
        widget.bind(E.PLAY, function () { if (state === 'on') ticker(); });
        widget.bind(E.PLAY_PROGRESS, function (ev) {
          if (!ev) return;
          var pos = ev.currentPosition, moving = lastPos >= 0 && pos > lastPos;
          lastPos = pos;
          // a late progress report can still arrive just after a pause: ignore those
          if (muted || state === 'on' || !moving || !(pos > 300)) return;
          clearTimeout(nudgeTimer);
          set('on', bi('SOUND ON', 'סאונד פועל'));
          ticker();
          closeGate();
        });
        widget.bind(E.PAUSE, function () { if (state === 'on') set('off', bi('SOUND OFF', 'סאונד כבוי')); });
        widget.bind(E.ERROR, function () { if (state !== 'on') dead(); });
      } catch (e) { dead(); }
    };
    document.head.appendChild(s);
  }

  btn.addEventListener('click', function () {
    if (state === 'dead' || state === 'load') return;
    if (state === 'on') {
      // switch off straight away rather than waiting for the player to confirm
      muted = true;
      clearTimeout(nudgeTimer);
      set('off', bi('SOUND OFF', 'סאונד כבוי'));
      try { widget.pause(); } catch (e) {}
      return;
    }
    muted = false;
    lastPos = -1;
    store('tbilisi:nosound', null);
    play();
    // if the browser refused, bring the player back so it can be tapped directly
    clearTimeout(nudgeTimer);
    nudgeTimer = setTimeout(function () { if (state !== 'on') openGate(); }, 2200);
  });

  build();
  }
})();
