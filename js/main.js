/* Everest PT - home page interactivity
   Renders the program deck and impact metrics from editable JSON,
   animates counters, and respects reduced-motion. */
(function () {
  'use strict';

  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  var prefersReduced = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Featured product cards (image-led, direct) ---- */
  var DELIVERY = { gym: 'In gym', home: 'At home', mixed: 'App based', online: 'Online' };

  function renderPrograms(data) {
    var grid = document.getElementById('product-grid');
    if (!grid || !data || !data.programs) return;
    var bySlug = {};
    data.programs.forEach(function (p) { bySlug[p.slug] = p; });
    var order = (data.featured && data.featured.length) ? data.featured
      : data.programs.map(function (p) { return p.slug; });

    grid.innerHTML = order.map(function (slug, i) {
      var p = bySlug[slug];
      if (!p || p.status !== 'active') return '';
      var href = p.checkoutUrl || '/programs/';
      var external = /^https?:\/\//.test(href);
      var priced = !!p.billing;
      var priceHtml = priced
        ? '<div class="pprice">' + esc(p.price) + '<small>' + esc(p.billing) + '</small></div>'
        : '<div class="pprice tbd">' + esc(p.price) + '</div>';
      var meta = [cap(p.level), DELIVERY[p.location] || 'Flexible', cap(p.support)]
        .filter(Boolean)
        .map(function (m) { return '<span>' + esc(m) + '</span>'; }).join('');
      return '' +
        '<article class="product">' +
          '<div class="pic pic-brand">' +
            '<img class="pic-logo" src="/assets/img/everest-logo-v4.svg" alt="" aria-hidden="true" ' +
              'width="750" height="750" loading="lazy" />' +
            '<span class="plabel">' + esc(p.label) + '</span>' +
          '</div>' +
          '<div class="pbody">' +
            '<h3>' + esc(p.name) + '</h3>' +
            '<p class="pdesc">' + esc(p.headline) + '</p>' +
            '<div class="pmeta">' + meta + '</div>' +
            '<div class="pfoot">' +
              priceHtml +
              '<a class="btn ' + (priced ? 'btn-deep' : 'btn-outline') + '" href="' + href + '"' +
                (external ? ' target="_blank" rel="noopener"' : '') + '>' +
                esc(p.cta) + ' <i class="ti ' + (external ? 'ti-external-link' : 'ti-arrow-right') + '" aria-hidden="true"></i></a>' +
            '</div>' +
          '</div>' +
        '</article>';
    }).join('');
  }

  function cap(s) { s = String(s || ''); return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }

  /* ---- Impact counters (only verified metrics with display:true) ---- */
  function renderImpact(data) {
    var section = document.getElementById('impact');
    var grid = document.getElementById('impact-grid');
    if (!section || !grid || !data || !data.metrics) return;
    var visible = data.metrics.filter(function (m) { return m.display; });
    if (!visible.length) return; // keep section hidden until figures are verified

    /* The real figure is the default text. If the counter never animates - no
       IntersectionObserver, a script error, a printed page - the visitor sees
       the number rather than a zero under "Real people. Real progress." */
    grid.innerHTML = visible.map(function (m) {
      return '<div class="metric"><div class="num" data-target="' + m.value + '" data-suffix="' +
        (m.suffix || '') + '">' + m.value + (m.suffix || '') + '</div><div class="cap">' +
        esc(m.label) + '</div></div>';
    }).join('');
    section.hidden = false;
    var note = document.getElementById('impact-note');
    if (note && visible.some(function (m) { return m.placeholder; })) note.hidden = false;
    observeCounters(grid);
  }

  function observeCounters(grid) {
    var nums = grid.querySelectorAll('.num');
    if (prefersReduced) {
      nums.forEach(function (n) { n.textContent = n.dataset.target + (n.dataset.suffix || ''); });
      return;
    }
    if (!('IntersectionObserver' in window)) return;  /* leave the real figures in place */
    nums.forEach(function (n) { n.textContent = '0' + (n.dataset.suffix || ''); });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { animate(e.target); io.unobserve(e.target); }
      });
    }, { threshold: 0.4 });
    nums.forEach(function (n) { io.observe(n); });
  }

  function animate(el) {
    var target = parseFloat(el.dataset.target) || 0;
    var suffix = el.dataset.suffix || '';
    var start = null, dur = 1400;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      el.textContent = Math.round(target * p) + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function load(url) {
    return fetch(url, { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error('Failed to load ' + url);
      return r.json();
    });
  }

  /* ---- Testimonials (real reviews only) ----
     Mirrors the impact-metrics rule: the section stays hidden until the data
     file actually holds something. Nothing here invents or pads content, so
     shipping an empty testimonials.json simply shows no section. */
  function renderTestimonials(data) {
    var section = document.getElementById('says');
    var track = document.getElementById('says-track');
    if (!section || !track || !data) return;

    var reviews = (data.reviews || []).filter(function (r) { return r && r.quote; });
    if (!reviews.length) return; // stays hidden

    /* The marquee slides by -50%, so the set is duplicated and each half must
       be wider than the viewport. Repeat short lists so no gap appears. */
    var reps = reviews.length >= 6 ? 1 : Math.ceil(6 / reviews.length);
    var cards = [];
    for (var pass = 0; pass < reps * 2; pass++) {
      reviews.forEach(function (r) {
        var stars = Math.max(0, Math.min(5, parseInt(r.rating, 10) || 5));
        cards.push(
          '<figure class="say-card"' + (pass ? ' aria-hidden="true"' : '') + '>' +
            '<span class="say-stars" aria-label="' + stars + ' out of 5">' +
              new Array(stars + 1).join('★') + '</span>' +
            '<blockquote>' + esc(r.quote) + '</blockquote>' +
            '<figcaption>' + esc(r.name || 'Verified review') +
              (r.source ? ' <span>· ' + esc(r.source) + '</span>' : '') +
            '</figcaption>' +
          '</figure>');
      });
    }
    track.innerHTML = cards.join('');

    var g = data.google || {};
    if (g.display && g.rating && g.profileUrl) {
      var el = document.getElementById('says-rating');
      if (el) {
        el.href = g.profileUrl;
        el.innerHTML = '<span class="stars" aria-hidden="true">★★★★★</span> <strong>' +
          esc(String(g.rating)) + '</strong>' +
          (g.reviewCount ? ' from ' + esc(String(g.reviewCount)) + ' Google reviews' : ' on Google');
        el.hidden = false;
      }
    }
    section.hidden = false;
  }

  load('/data/programs.json').then(renderPrograms).catch(function (e) { console.error(e); });
  load('/data/impact.json').then(renderImpact).catch(function (e) { console.error(e); });
  load('/data/testimonials.json').then(renderTestimonials).catch(function (e) { console.error(e); });
})();
