/* Everest PT - shared layout (header, footer, sticky CTA, mobile nav).
   Single source of truth injected into every page so markup stays DRY. */
(function () {
  'use strict';

  /* ---- Attribution ----------------------------------------------------
     Which link brought this visit. It lives here rather than in its own file
     because layout.js is the one script every page loads, including blog
     posts, and attribution has to be captured wherever someone lands, not
     only on the pages that hold a form.

     Kept in sessionStorage: it dies when the tab closes, it never follows
     anyone between visits, and it is sent nowhere unless the visitor chooses
     to submit a form. That keeps the privacy page's "no cookies, no profile"
     claim true while still answering the only question worth asking - which
     post, email or poster produced this enquiry.

     Only the referring host is kept, not the full referring URL, so a search
     tells us "google" rather than what somebody typed to find us. */
  var ATTR_KEY = 'everest:attr';

  function referringHost() {
    if (!document.referrer) return '';
    try {
      var h = new URL(document.referrer).hostname;
      return h === location.hostname ? '' : h.replace(/^www\./, '');
    } catch (e) { return ''; }
  }

  function captureAttribution() {
    var stored = null;
    try { stored = JSON.parse(sessionStorage.getItem(ATTR_KEY) || 'null'); } catch (e) { stored = null; }
    /* First page of the session wins. A visitor who arrives from Instagram,
       reads three articles and then enquires came from Instagram, not from
       the article they happened to be on. */
    if (stored) return stored;

    var p = new URLSearchParams(location.search);
    var rec = {
      source: p.get('utm_source') || '',
      medium: p.get('utm_medium') || '',
      campaign: p.get('utm_campaign') || '',
      content: p.get('utm_content') || '',
      landing: location.pathname,
      referrer: referringHost(),
      at: new Date().toISOString()
    };
    try { sessionStorage.setItem(ATTR_KEY, JSON.stringify(rec)); } catch (e) { /* private mode */ }
    return rec;
  }

  var attribution = captureAttribution();

  window.EverestAttribution = {
    get: function () { return attribution; },
    /* One readable line for the enquiry email. */
    summary: function () {
      var a = attribution;
      if (a.source) {
        var bits = [a.source, a.medium, a.campaign].filter(Boolean).join(' / ');
        return a.content ? bits + ' (' + a.content + ')' : bits;
      }
      if (a.referrer) return 'Referred by ' + a.referrer;
      return 'Direct or untagged';
    }
  };

  /* ---- Funnel events ---------------------------------------------------
     A funnel you cannot see is a funnel you cannot fix. These mark the
     steps between landing and buying, so the drop-off shows up as a number
     rather than a feeling: how many start the finder, how many finish it,
     how many hand over an email, how many click through to pay.

     Every event carries the channel that brought the visit, so the same
     funnel can be read per channel - Instagram traffic that never reaches a
     result is a different problem from Instagram traffic that reaches one
     and stops.

     Never send anything about a person: no name, no email, no message. A
     programme slug and a segment are about the offer, not the visitor, and
     that is the line the privacy page draws. */
  window.EverestTrack = function (name, data) {
    if (typeof window.va !== 'function') return;   /* analytics not enabled */
    var payload = data || {};
    payload.source = attribution.source || (attribution.referrer ? 'referral' : 'direct');
    try { window.va('event', { name: name, data: payload }); } catch (e) {}
  };

  /* Clicks worth counting that are the same on every page. */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a');
    if (!a) return;
    var href = a.getAttribute('href') || '';
    if (href.indexOf('tel:') === 0) window.EverestTrack('phone_click');
    else if (a.closest('.sticky-cta')) window.EverestTrack('sticky_cta_click');
  });

  /* Everest Group is the parent brand and the nav is its four business units,
     in that order, with everything about the company itself collapsed behind
     a fifth item. Seven flat top-level links had stopped reading as a
     structure — a visitor could not tell which of them were things to buy and
     which were things to read about us.

     An item with `children` renders as a submenu. `href` on the parent is
     what decides the current-section highlight; the trigger itself does not
     navigate. */
  var NAV = [
    { label: 'Everest Personal Training', short: 'Personal Training', href: '/personal-training/', children: [
      { label: 'Personal Training', href: '/personal-training/', desc: 'App programmes, personalised coaching and 1-on-1 sessions' },
      { label: 'Programmes &amp; pricing', href: '/programs/', desc: 'The full catalogue, with the 60-second finder' }
    ] },
    { label: 'Everest Elite', short: 'Elite', href: '/elite/', children: [
      { label: 'Everest Athlete', href: '/elite/#athlete', desc: 'Sport-specific strength and conditioning for athletes and squads' },
      { label: 'Everest Executive', href: '/elite/#executive', desc: 'Performance coaching for executives and high performers' }
    ] },
    { label: 'Organisations', href: '/organisations/' },
    { label: 'EMPOWER', href: '/empower/' },
    { label: 'Company', href: '/about/', children: [
      { label: 'About', href: '/about/', desc: 'Our mission, our vision and the Everest story' },
      { label: 'Impact', href: '/impact/', desc: 'The evidence behind what we claim' },
      { label: 'Team', href: '/team/', desc: 'The people who deliver it' },
      { label: 'Blog', href: '/blog/', desc: 'Recipes, training guides and educational pieces' }
    ] }
  ];

  /* Social profiles. Deliberately empty: the footer used to show Instagram,
     Facebook and LinkedIn icons all pointing at "#", so clicking one did
     nothing on every page of the site. An icon that goes nowhere is worse than
     no icon.

     Add a url and that icon appears; leave it blank and it stays hidden. When
     you add one, mirror it into sameAs in businessGraph() in
     tools/generate.js, which is how Google ties a profile to the business. */
  var SOCIAL = [
    { label: 'Instagram', icon: 'brand-instagram', url: '' },
    { label: 'Facebook', icon: 'brand-facebook', url: '' },
    { label: 'LinkedIn', icon: 'brand-linkedin', url: '' }
  ];

  function socialHTML() {
    var live = SOCIAL.filter(function (s) { return s.url; });
    if (!live.length) return '';
    return '<div class="footer-social">' + live.map(function (s) {
      return '<a href="' + s.url + '" aria-label="' + s.label + '" target="_blank" rel="noopener">' +
        '<i class="ti ti-' + s.icon + '" aria-hidden="true"></i></a>';
    }).join('') + '</div>';
  }

  var path = location.pathname.replace(/index\.html$/, '');
  if (path.length > 1) path = path.replace(/\/?$/, '/');

  /* Two different questions, and conflating them broke the Elite group.
     isActive asks "are we anywhere in this section", which is what decides
     whether a submenu shows as the current one — so it ignores any #anchor.
     isCurrentPage asks "is this link the page we are on", which is what
     aria-current means; an anchor into a section is never that, or both
     Elite children would announce themselves as the current page at once. */
  function isActive(href) {
    var clean = href.split('#')[0];
    if (clean === '/') return path === '/';
    return path.indexOf(clean) === 0;
  }

  function isCurrentPage(href) {
    return href.indexOf('#') === -1 && isActive(href);
  }

  function headerHTML() {
    var links = NAV.map(function (n, i) {
      if (!n.children) {
        return '<a href="' + n.href + '"' +
          (isCurrentPage(n.href) ? ' aria-current="page"' : '') +
          '>' + n.label + '</a>';
      }
      /* Grouped item. The trigger is a button rather than a link: it opens a
         menu, it does not navigate, and announcing it as a link would be a
         lie to anyone using a screen reader. Every child is reachable from
         the menu, so nothing is lost by not linking the parent. */
      var open = isActive(n.href) || n.children.some(function (c) { return isActive(c.href); });
      var id = 'navsub-' + i;
      var kids = n.children.map(function (c) {
        return '<a href="' + c.href + '"' + (isCurrentPage(c.href) ? ' aria-current="page"' : '') + '>' +
          '<span class="ns-label">' + c.label + '</span>' +
          (c.desc ? '<span class="ns-desc">' + c.desc + '</span>' : '') +
          '</a>';
      }).join('');
      return '<div class="nav-group' + (open ? ' is-current' : '') + '">' +
          '<button type="button" class="nav-trigger" aria-expanded="false" aria-controls="' + id + '">' +
            (n.short || n.label) +
            '<i class="ti ti-chevron-down" aria-hidden="true"></i>' +
          '</button>' +
          /* The trigger is hidden in the mobile dropdown, where submenus are
             always open. Without this the five groups collapse into ten
             unlabelled links. Decorative only — the links below it carry the
             meaning, so it stays out of the accessibility tree. */
          '<span class="nav-group-label" aria-hidden="true">' + (n.short || n.label) + '</span>' +
          '<div class="nav-sub" id="' + id + '">' + kids + '</div>' +
        '</div>';
    }).join('');
    return '' +
      '<header class="site-header">' +
        '<a class="logo" href="/"><img class="logo-mark" src="/assets/img/everest-logo-v4.svg" alt="" aria-hidden="true" width="750" height="750" /><span>EVEREST</span></a>' +
        '<nav class="nav" aria-label="Primary">' + links +
          '<a class="nav-cta" href="/contact/">Book a call</a>' +
        '</nav>' +
        '<div class="header-cta">' +
          '<a class="btn btn-accent header-call" href="/contact/">Book a call</a>' +
          '<button class="nav-toggle" aria-label="Toggle menu" aria-expanded="false"><i class="ti ti-menu-2" aria-hidden="true"></i></button>' +
        '</div>' +
      '</header>';
  }

  function footerHTML() {
    var year = new Date().getFullYear();
    return '' +
      '<footer class="site-footer">' +
        '<div class="wrap footer-top">' +
          '<div class="footer-brand">' +
            '<a class="logo" href="/"><img class="logo-mark" src="/assets/img/everest-logo-v4.svg" alt="" aria-hidden="true" width="750" height="750" /><span>EVEREST</span></a>' +
            '<p>Structured training, expert coaching and human performance solutions for everyday people, athletes, young people and organisations.</p>' +
            socialHTML() +
          '</div>' +
          '<div class="footer-cols">' +
            '<div class="footer-col">' +
              '<h3>Train</h3>' +
              '<a href="/personal-training/">Personal Training</a>' +
              '<a href="/programs/">Programmes &amp; pricing</a>' +
              '<a href="/elite/">Everest Elite</a>' +
              '<a href="/empower/">EMPOWER</a>' +
            '</div>' +
            '<div class="footer-col">' +
              '<h3>Organisations</h3>' +
              '<a href="/organisations/">Workforce wellness</a>' +
              '<a href="/organisations/#preventative">Preventative performance</a>' +
              '<a href="/contact/?type=organisation">Book a strategy call</a>' +
              '<a href="/impact/">Impact &amp; evidence</a>' +
            '</div>' +
            '<div class="footer-col">' +
              '<h3>Company</h3>' +
              '<a href="/about/">About</a>' +
              '<a href="/team/">Team</a>' +
              '<a href="/blog/">Blog</a>' +
              '<a href="/contact/">Contact</a>' +
            '</div>' +
            '<div class="footer-col">' +
              '<h3>Get in touch</h3>' +
              '<a href="mailto:jared@everest-pt.com">jared@everest-pt.com</a>' +
              '<a href="tel:+64221398969">022 139 8969</a>' +
              '<span class="footer-meta">Christchurch, New Zealand</span>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="wrap footer-bottom">' +
          '<span>&copy; ' + year + ' Everest Personal Training. All rights reserved.</span>' +
          '<nav class="footer-legal" aria-label="Legal">' +
            '<a href="/legal/#privacy">Privacy</a>' +
            '<a href="/legal/#terms">Terms</a>' +
            '<a href="/legal/#disclaimer">Health disclaimer</a>' +
          '</nav>' +
        '</div>' +
        '<div class="wrap footer-note">' +
          '<p>Everest provides fitness coaching and human performance services. This is not clinical healthcare. We work alongside health professionals and refer where appropriate.</p>' +
          '<span class="footer-credit">Another website designed and built by <a href="https://eightysix.digital/web-design/web-design-christchurch/" target="_blank" rel="noopener">EightySix Digital</a></span>' +
        '</div>' +
      '</footer>';
  }

  function mount(id, html) {
    var el = document.getElementById(id);
    if (el) el.outerHTML = html;
  }

  mount('site-header', headerHTML());
  mount('site-footer', footerHTML());

  var stickyHost = document.getElementById('sticky-cta');
  if (stickyHost) {
    stickyHost.outerHTML = '<div class="sticky-cta"><a class="btn btn-deep" href="/contact/">Book a call</a></div>';
  }

  /* structured data: LocalBusiness + WebSite (every page) + BreadcrumbList */
  function injectSchema() {
    /* tools/generate.js writes this graph into the static HTML at build time,
       because the crawlers that matter most to answer engines do not run JS.
       This runtime copy is the fallback for an unbuilt local checkout. */
    if (document.querySelector('script[data-everest-schema]')) return;
    var origin = location.origin;
    var graph = [
      {
        "@type": ["Organization", "LocalBusiness"],
        "@id": origin + "/#business",
        "name": "Everest Personal Training",
        // Mission first, then what we actually sell. Search engines and AI
        // assistants read this description verbatim, so it is the one place
        // the mission has to survive being quoted out of context.
        "slogan": "Movement recognised and funded as frontline prevention — for the body and the mind.",
        "description": "Everest builds everyday capability through structured movement, and measures it honestly, so what works can be proven, repeated and scaled. Personal training, coaching and human performance programmes in Christchurch and across Canterbury, New Zealand, with online coaching worldwide, for individuals, athletes, young people and organisations.",
        "url": origin + "/",
        "email": "jared@everest-pt.com",
        // in-person is Canterbury; online delivery is not geographically bound
        // and there are already clients on other continents
        "areaServed": [
          { "@type": "City", "name": "Christchurch" },
          { "@type": "AdministrativeArea", "name": "Canterbury" },
          { "@type": "Country", "name": "New Zealand" },
          { "@type": "Place", "name": "Worldwide (online coaching)" }
        ],
        "address": { "@type": "PostalAddress", "addressLocality": "Christchurch", "addressRegion": "Canterbury", "addressCountry": "NZ" }
      },
      {
        "@type": "WebSite",
        "@id": origin + "/#website",
        "url": origin + "/",
        "name": "Everest Personal Training",
        "publisher": { "@id": origin + "/#business" }
      }
    ];

    var parts = location.pathname.split('/').filter(Boolean);
    if (parts.length) {
      var items = [{ "@type": "ListItem", "position": 1, "name": "Home", "item": origin + "/" }];
      var acc = '';
      parts.forEach(function (seg, i) {
        acc += '/' + seg;
        var name = seg.replace(/-/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); });
        items.push({ "@type": "ListItem", "position": i + 2, "name": name, "item": origin + acc + '/' });
      });
      graph.push({ "@type": "BreadcrumbList", "itemListElement": items });
    }

    var s = document.createElement('script');
    s.type = 'application/ld+json';
    s.textContent = JSON.stringify({ "@context": "https://schema.org", "@graph": graph });
    document.head.appendChild(s);
  }
  injectSchema();

  /* scroll reveal (site-wide) */
  var reveals = document.querySelectorAll('.reveal');
  if (reveals.length) {
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !('IntersectionObserver' in window)) {
      reveals.forEach(function (r) { r.classList.add('is-visible'); });
    } else {
      var ro = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add('is-visible'); ro.unobserve(e.target); }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
      reveals.forEach(function (r) { ro.observe(r); });
    }
  }

  /* FAQ accordion: close others when one opens (site-wide) */
  var faqs = document.querySelectorAll('.faq-item');
  faqs.forEach(function (item) {
    item.addEventListener('toggle', function () {
      if (item.open) faqs.forEach(function (o) { if (o !== item) o.open = false; });
    });
  });

  /* Keep the ascent route in true proportion.
     The ascent SVG uses preserveAspectRatio="none" so the route always spans
     the full hero. That stretches its contents unevenly: harmless for a dot,
     very visible on a kettlebell, and on a phone it squashes the whole route to
     about 0.28 of its width, so the line ends up half a pixel wide and the camp
     markers become slivers.

     On desktop the climber is counter-scaled horizontally, as before. Below
     700px the route is instead redrawn in real screen pixels: the viewBox is set
     to the SVG's actual size and every point is rescaled into it, so strokes,
     markers and the kettlebell keep their true shape at any phone size. The
     original geometry is kept on each element and restored on the way back up. */
  var MOBILE = window.matchMedia ? window.matchMedia('(max-width: 700px)') : { matches: false };

  function parseRoute(d) {
    var nums = d.match(/-?\d+(?:\.\d+)?/g) || [];
    var pts = [];
    for (var n = 0; n + 1 < nums.length; n += 2) pts.push([+nums[n], +nums[n + 1]]);
    return pts;
  }
  function routeToPath(pts, kx, ky) {
    return 'M' + pts.map(function (p) { return (p[0] * kx).toFixed(1) + ',' + (p[1] * ky).toFixed(1); }).join(' L');
  }

  function fitClimber() {
    var svgs = document.querySelectorAll('.ascent svg');
    for (var i = 0; i < svgs.length; i++) {
      var svg = svgs[i];
      var box = svg.getBoundingClientRect();
      if (!box.width || !box.height) continue;

      var paths = svg.querySelectorAll('.trail, .trail-climb');
      var dots = svg.querySelectorAll('.node, .summit');
      var climber = svg.querySelector('.climber');
      var g = svg.querySelector('.climber-scale');

      /* remember the desktop geometry the first time through */
      if (!svg.hasAttribute('data-vb')) {
        svg.setAttribute('data-vb', svg.getAttribute('viewBox') || '0 0 1400 800');
        for (var p = 0; p < paths.length; p++) paths[p].setAttribute('data-d', paths[p].getAttribute('d'));
        for (var c = 0; c < dots.length; c++) {
          dots[c].setAttribute('data-cx', dots[c].getAttribute('cx'));
          dots[c].setAttribute('data-cy', dots[c].getAttribute('cy'));
        }
      }
      var vb = svg.getAttribute('data-vb').split(/\s+/).map(Number);

      if (MOBILE.matches) {
        var W = Math.round(box.width), H = Math.round(box.height);
        var kx = W / vb[2], ky = H / vb[3];
        var first = paths.length ? paths[0].getAttribute('data-d') : null;
        if (!first) continue;
        var pts = parseRoute(first);
        var d = routeToPath(pts, kx, ky);
        svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
        for (var q = 0; q < paths.length; q++) paths[q].setAttribute('d', d);
        for (var e = 0; e < dots.length; e++) {
          dots[e].setAttribute('cx', (+dots[e].getAttribute('data-cx') * kx).toFixed(1));
          dots[e].setAttribute('cy', (+dots[e].getAttribute('data-cy') * ky).toFixed(1));
        }
        if (climber) climber.style.offsetPath = 'path("' + d + '")';
        /* the viewBox now matches the screen, so no counter-scaling is needed;
           the kettlebell is simply drawn a little larger for a small screen */
        if (g) g.setAttribute('transform', 'scale(1.3)');
      } else {
        svg.setAttribute('viewBox', svg.getAttribute('data-vb'));
        for (var r = 0; r < paths.length; r++) paths[r].setAttribute('d', paths[r].getAttribute('data-d'));
        for (var s = 0; s < dots.length; s++) {
          dots[s].setAttribute('cx', dots[s].getAttribute('data-cx'));
          dots[s].setAttribute('cy', dots[s].getAttribute('data-cy'));
        }
        if (climber) climber.style.offsetPath = '';
        var dkx = box.width / vb[2];
        var dky = box.height / vb[3];
        if (g) g.setAttribute('transform', 'scale(' + (dky / dkx).toFixed(4) + ',1)');
      }
    }
  }
  fitClimber();
  window.addEventListener('load', fitClimber);
  var fitTimer;
  window.addEventListener('resize', function () {
    clearTimeout(fitTimer);
    fitTimer = setTimeout(fitClimber, 120);
  });

  /* Cursor glow trail.
     A short comet of teal light that follows the pointer. Purely decorative:
     the real cursor is untouched, so nothing about pointing, clicking or
     accessibility changes — this only adds light behind it.

     Skipped entirely for reduced-motion, and for touch or coarse pointers
     where there is no cursor to trail. The animation loop stops once the
     trail has caught up and restarts on the next movement, so an idle page
     costs nothing. */
  (function cursorTrail() {
    var fine = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!fine || reduce) return;

    var COUNT = 8;
    var wrap = document.createElement('div');
    wrap.className = 'cursor-trail';
    wrap.setAttribute('aria-hidden', 'true');
    /* the trail lives on <body>, outside .empower-scope, so flag the body on
       EMPOWER pages to let the trail pick up the sub-brand colour */
    if (document.querySelector('.empower-scope')) {
      document.body.classList.add('empower-scope-active');
    }

    var dots = [];
    for (var i = 0; i < COUNT; i++) {
      var d = document.createElement('span');
      var t = i / (COUNT - 1);
      d.style.width = d.style.height = (26 - t * 16).toFixed(1) + 'px';
      d.style.opacity = (0.30 * (1 - t) + 0.04).toFixed(3);
      wrap.appendChild(d);
      dots.push({ el: d, x: -100, y: -100 });
    }
    document.body.appendChild(wrap);

    var mx = -100, my = -100, running = false, idle = 0;

    window.addEventListener('mousemove', function (e) {
      mx = e.clientX; my = e.clientY; idle = 0;
      if (!running) { running = true; window.requestAnimationFrame(step); }
    }, { passive: true });

    function step() {
      var px = mx, py = my, moved = false;
      for (var i = 0; i < dots.length; i++) {
        var dot = dots[i];
        var dx = px - dot.x, dy = py - dot.y;
        if (Math.abs(dx) > 0.4 || Math.abs(dy) > 0.4) moved = true;
        /* each dot chases the one ahead of it, easing more the further back
           it sits, which is what gives the trail its taper */
        dot.x += dx * (0.34 - i * 0.02);
        dot.y += dy * (0.34 - i * 0.02);
        dot.el.style.transform =
          'translate3d(' + dot.x.toFixed(1) + 'px,' + dot.y.toFixed(1) + 'px,0) translate(-50%,-50%)';
        px = dot.x; py = dot.y;
      }
      idle = moved ? 0 : idle + 1;
      if (idle > 30) { running = false; return; }   /* settled — stop burning frames */
      window.requestAnimationFrame(step);
    }
  })();

  /* Nav submenus.
     Opens on hover for pointer users and on click/Enter for everyone else,
     so it is usable by keyboard and on touch, where hover does not exist.
     Escape closes and returns focus to the trigger; clicking outside closes. */
  (function navGroups() {
    var groups = document.querySelectorAll('.nav-group');
    if (!groups.length) return;

    function close(group) {
      group.classList.remove('is-open');
      var t = group.querySelector('.nav-trigger');
      if (t) t.setAttribute('aria-expanded', 'false');
    }
    function closeAll(except) {
      Array.prototype.forEach.call(groups, function (g) { if (g !== except) close(g); });
    }

    Array.prototype.forEach.call(groups, function (group) {
      var trigger = group.querySelector('.nav-trigger');
      if (!trigger) return;

      trigger.addEventListener('click', function (e) {
        e.preventDefault();
        var isOpen = group.classList.contains('is-open');
        closeAll(group);
        group.classList.toggle('is-open', !isOpen);
        trigger.setAttribute('aria-expanded', String(!isOpen));
      });

      group.addEventListener('mouseenter', function () {
        if (window.matchMedia('(hover: hover) and (min-width: 921px)').matches) {
          closeAll(group);
          group.classList.add('is-open');
          trigger.setAttribute('aria-expanded', 'true');
        }
      });
      group.addEventListener('mouseleave', function () {
        if (window.matchMedia('(hover: hover) and (min-width: 921px)').matches) close(group);
      });

      group.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && group.classList.contains('is-open')) {
          close(group);
          trigger.focus();
        }
      });
      /* leaving the group by tabbing closes it */
      group.addEventListener('focusout', function (e) {
        if (!group.contains(e.relatedTarget)) close(group);
      });
    });

    document.addEventListener('click', function (e) {
      var inside = false;
      Array.prototype.forEach.call(groups, function (g) { if (g.contains(e.target)) inside = true; });
      if (!inside) closeAll(null);
    });
  })();

  /* mobile nav toggle */
  var header = document.querySelector('.site-header');
  var toggle = header && header.querySelector('.nav-toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var open = header.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.innerHTML = '<i class="ti ti-' + (open ? 'x' : 'menu-2') + '" aria-hidden="true"></i>';
    });
  }
})();
