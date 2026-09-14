/* What's happening at Everest — the homepage community wall.

   Content lives in data/whats-happening.json. This file turns it into cards,
   and it runs in two places so the markup is only written once:

   - tools/generate.js requires it at build time and writes the cards straight
     into index.html, so crawlers that do not run JavaScript still see them;
   - the browser loads it on the homepage. If the cards are already there it
     only refreshes each status tag for today's date. On an unbuilt local
     checkout the wall is empty, so it fetches the JSON and renders instead.

   Status is decided by date in New Zealand time, which is what keeps the wall
   from going stale: "Starts 21.09.2026" becomes "Underway" on the 21st without
   anyone editing a file or waiting for a rebuild. */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.EverestWhatsHappening = api;
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var THEMES = { empower: true, performance: true, upcoming: true };

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  /* Today as YYYY-MM-DD in Auckland, so a visitor in another timezone sees
     the same status Jared does. ISO dates compare correctly as strings. */
  function nzToday() {
    try {
      var parts = new Intl.DateTimeFormat('en-NZ', {
        timeZone: 'Pacific/Auckland', year: 'numeric', month: '2-digit', day: '2-digit'
      }).formatToParts(new Date());
      var get = function (t) {
        for (var i = 0; i < parts.length; i++) if (parts[i].type === t) return parts[i].value;
        return '';
      };
      return get('year') + '-' + get('month') + '-' + get('day');
    } catch (e) {
      return new Date().toISOString().slice(0, 10);
    }
  }

  function phase(item, today) {
    if (item.hideAfter && today > item.hideAfter) return 'hidden';
    if (item.endDate && today > item.endDate) return 'done';
    if (item.startDate && today >= item.startDate) return 'live';
    return 'upcoming';
  }

  function statusFor(item, today) {
    var p = phase(item, today || nzToday());
    var label = p === 'done' ? (item.doneStatus || 'Completed')
      : p === 'live' ? (item.liveStatus || 'Underway')
      : (item.status || '');
    return { phase: p, label: label };
  }

  function attr(name, value) {
    return value ? ' ' + name + '="' + esc(value) + '"' : '';
  }

  /* The featured image when there is one. Without one, the performance theme
     draws a stepped ascent — a stair climb, echoing the hero's trail — rather
     than reaching for a stock photo or an icon. */
  function visual(item) {
    if (item.imageSrc) {
      return '<div class="wh-visual"><img src="' + esc(item.imageSrc) + '" alt="' + esc(item.imageAlt) + '"' +
        attr('width', item.imageWidth) + attr('height', item.imageHeight) +
        ' loading="lazy" decoding="async" /></div>';
    }
    if (item.theme === 'performance') {
      return '<svg class="wh-ascent" viewBox="0 0 240 100" preserveAspectRatio="xMinYMax meet" aria-hidden="true" focusable="false">' +
        '<path class="wh-ascent-line" pathLength="1" d="M3 94H41V78H79V62H117V46H155V30H193V14H229" />' +
        '<circle class="wh-ascent-summit" cx="233" cy="14" r="4.5" /></svg>';
    }
    return '';
  }

  function meta(item) {
    var rows = [['For', item.audience], ['Partner', item.partner], ['Where', item.location]]
      .filter(function (r) { return r[1]; });
    if (!rows.length) return '';
    return '<dl class="wh-meta">' + rows.map(function (r) {
      return '<div><dt>' + r[0] + '</dt><dd>' + esc(r[1]) + '</dd></div>';
    }).join('') + '</dl>';
  }

  function communityUpdateCard(item, today) {
    var s = statusFor(item, today);
    var theme = THEMES[item.theme] ? item.theme : 'upcoming';
    var titleId = 'wh-t-' + String(item.id || item.title).toLowerCase().replace(/[^a-z0-9]+/g, '-');

    return '<article class="wh-card wh-theme-' + theme + (item.featured ? ' is-featured' : '') + '"' +
        ' aria-labelledby="' + titleId + '"' +
        attr('data-wh-start', item.startDate) + attr('data-wh-end', item.endDate) +
        attr('data-wh-hide', item.hideAfter) + attr('data-wh-status', item.status) +
        attr('data-wh-live', item.liveStatus) + attr('data-wh-done', item.doneStatus) + '>' +
      visual(item) +
      '<div class="wh-body">' +
        (item.featured ? '<p class="wh-flag">' + esc(item.featuredLabel || 'Featured') + '</p>' : '') +
        '<p class="wh-cat">' + esc(item.category) + '</p>' +
        '<h3 class="wh-title" id="' + titleId + '">' + esc(item.title) + '</h3>' +
        '<ul class="wh-tags">' +
          '<li class="wh-status is-' + s.phase + '">' + esc(s.label) + '</li>' +
          (item.dateLabel ? '<li class="wh-date">' + esc(item.dateLabel) + '</li>' : '') +
        '</ul>' +
        '<p class="wh-desc">' + esc(item.description) + '</p>' +
        meta(item) +
        (item.ctaHref && item.ctaLabel
          ? '<a class="wh-cta" href="' + esc(item.ctaHref) + '">' + esc(item.ctaLabel) +
            ' <i class="ti ti-arrow-right" aria-hidden="true"></i></a>'
          : '') +
      '</div>' +
    '</article>';
  }

  function visibleItems(data, today) {
    var items = data && Array.isArray(data.items) ? data.items : [];
    return items
      .map(function (item, i) { return { item: item, i: i }; })
      .filter(function (x) { return x.item && x.item.title && phase(x.item, today) !== 'hidden'; })
      .sort(function (a, b) { return (b.item.featured ? 1 : 0) - (a.item.featured ? 1 : 0) || a.i - b.i; })
      .map(function (x) { return x.item; });
  }

  /* The count class lets the grid choose its layout (one card, a pair, or a
     featured card with a stack beside it) without anyone touching the CSS. */
  function countClass(n) { return 'wh-grid--n' + Math.min(n, 3); }

  function whatsHappeningWall(data, today) {
    today = today || nzToday();
    var items = visibleItems(data, today);
    return {
      count: items.length,
      html: items.length
        ? '<div class="wh-grid ' + countClass(items.length) + '">' +
            items.map(function (item) { return communityUpdateCard(item, today); }).join('') +
          '</div>'
        : ''
    };
  }

  /* Pre-rendered cards carry their date rules as data attributes, so the
     browser can move a status on without fetching anything. */
  function refresh(grid, today) {
    var shown = 0;
    Array.prototype.forEach.call(grid.querySelectorAll('.wh-card'), function (card) {
      var s = statusFor({
        startDate: card.getAttribute('data-wh-start'),
        endDate: card.getAttribute('data-wh-end'),
        hideAfter: card.getAttribute('data-wh-hide'),
        status: card.getAttribute('data-wh-status'),
        liveStatus: card.getAttribute('data-wh-live'),
        doneStatus: card.getAttribute('data-wh-done')
      }, today);
      card.hidden = s.phase === 'hidden';
      if (card.hidden) return;
      shown++;
      var tag = card.querySelector('.wh-status');
      if (tag) { tag.textContent = s.label; tag.className = 'wh-status is-' + s.phase; }
    });
    grid.className = grid.className.replace(/\bwh-grid--n\d\b/, countClass(shown));
    return shown;
  }

  function mount() {
    var wall = document.getElementById('wh-wall');
    if (!wall) return;
    var section = wall.closest('section') || wall;
    var today = nzToday();
    var grid = wall.querySelector('.wh-grid');

    if (grid) {
      if (!refresh(grid, today)) section.hidden = true;
      return;
    }
    fetch(wall.getAttribute('data-src') || '/data/whats-happening.json', { cache: 'no-cache' })
      .then(function (r) {
        if (!r.ok) throw new Error('Failed to load what\'s happening');
        return r.json();
      })
      .then(function (data) {
        var out = whatsHappeningWall(data, today);
        if (!out.count) { section.hidden = true; return; }
        var start = wall.innerHTML.indexOf('<!-- wh:end -->');
        wall.innerHTML = start === -1 ? out.html : '<!-- wh:start -->' + out.html + '<!-- wh:end -->';
      })
      .catch(function (e) { console.error(e); section.hidden = true; });
  }

  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
    else mount();
  }

  return {
    nzToday: nzToday,
    statusFor: statusFor,
    communityUpdateCard: communityUpdateCard,
    whatsHappeningWall: whatsHappeningWall
  };
}));
