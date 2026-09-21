/* Everest PT - Programs page: catalogue rendering, filtering, and program finder. */
(function () {
  'use strict';

  var DATA = null;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  var DELIVERY = { gym: 'In gym', home: 'At home', mixed: 'App based', online: 'Online' };
  function cap(s) { s = String(s || ''); return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }

  /* How a product is charged, derived from its price and billing fields so
     data/programs.json stays simple to edit:
       plan     - a dollar price billed on a repeating period (/week, /month)
       service  - a dollar price paid once, or charged per hour
       proposal - anything without a dollar price ("By proposal", "Price TBC")
     Cards are grouped by this so weekly subscriptions and one-off services are
     never mixed in the same grid. */
  function groupOf(p) {
    if (!/^\$/.test(String(p.price || ''))) return 'proposal';
    return /^\/(week|fortnight|month)$/.test(String(p.billing || '')) ? 'plan' : 'service';
  }

  var GROUPS = [
    { key: 'plan', title: 'Weekly programmes', note: 'Ongoing training, billed weekly.' },
    { key: 'service', title: 'One-off services', note: 'Paid as you go, no subscription.' },
    { key: 'proposal', title: 'By proposal', note: 'Scoped and quoted around your situation.' }
  ];

  /* The four business units, in the order they appear in the nav. This is the
     primary grouping on the full catalogue: what someone is shopping for is a
     bigger distinction than how it happens to be billed, and charge type
     still groups within each unit below. */
  var CATEGORIES = [
    { key: 'personal-training', title: 'Everest Personal Training',
      note: 'App programmes, personalised coaching and 1-on-1 sessions.', href: '/personal-training/' },
    { key: 'elite', title: 'Everest Elite',
      note: 'Performance coaching for athletes and executives.', href: '/elite/' },
    { key: 'organisations', title: 'Everest Organisations',
      note: 'Workforce programmes and preventative performance.', href: '/organisations/' },
    { key: 'empower', title: 'EMPOWER',
      note: 'Youth development through movement.', href: '/empower/' }
  ];

  function cardHTML(p, i) {
    var href = p.checkoutUrl || '/contact/';
    var external = /^https?:\/\//.test(href);
    var priced = !!p.billing;
    var priceHtml = priced
      ? '<div class="pprice">' + esc(p.price) + '<small>' + esc(p.billing) + '</small></div>'
      : '<div class="pprice tbd">' + esc(p.price) + '</div>';
    var meta = [cap(p.goal), cap(p.level), DELIVERY[p.location] || 'Flexible', cap(p.support)]
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
          '<div class="pfoot">' + priceHtml +
            '<a class="btn ' + (priced ? 'btn-deep' : 'btn-outline') + '" href="' + href + '"' +
              (external ? ' target="_blank" rel="noopener"' : '') + '>' + esc(p.cta) +
              ' <i class="ti ti-' + (external ? 'external-link' : 'arrow-right') + '" aria-hidden="true"></i></a>' +
          '</div>' +
        '</div>' +
      '</article>';
  }

  function activePrograms() {
    return DATA.programs.filter(function (p) { return p.status === 'active'; });
  }

  /* charge-type grid for one unit's products */
  function chargeGroupsHTML(list, headingLevel) {
    var h = headingLevel || 'h3';
    return GROUPS.map(function (g) {
      var items = list.filter(function (p) { return groupOf(p) === g.key; });
      if (!items.length) return '';
      return '<section class="cat-group">' +
        '<div class="cat-head"><' + h + '>' + g.title + '</' + h + '><p>' + g.note + '</p></div>' +
        '<div class="product-grid">' + items.map(cardHTML).join('') + '</div>' +
        '</section>';
    }).join('');
  }

  function render() {
    var grid = document.getElementById('catalogue');
    var empty = document.getElementById('catalogue-empty');
    if (!grid) return;

    /* A page can scope the catalogue to its own unit with
       data-category="elite" on #catalogue, and gets just that unit's
       products with no category headings. Without the attribute — the full
       /programs/ catalogue — everything renders, grouped by unit. */
    var scope = grid.getAttribute('data-category') || '';

    var f = {
      goal: val('f-goal'), level: val('f-level'),
      support: val('f-support'), audience: val('f-audience'),
      category: scope || val('f-category')
    };
    var list = activePrograms().filter(function (p) {
      return (!f.goal || p.goal === f.goal) &&
        (!f.level || p.level === f.level) &&
        (!f.support || p.support === f.support) &&
        (!f.audience || p.audience === f.audience) &&
        (!f.category || p.category === f.category);
    });

    if (f.category) {
      grid.innerHTML = chargeGroupsHTML(list, 'h3');
    } else {
      grid.innerHTML = CATEGORIES.map(function (c) {
        var items = list.filter(function (p) { return p.category === c.key; });
        if (!items.length) return '';
        return '<section class="cat-unit">' +
          '<div class="unit-head">' +
            '<h3>' + c.title + '</h3>' +
            '<p>' + c.note + ' <a href="' + c.href + '">More about ' + c.title +
              ' <i class="ti ti-arrow-right" aria-hidden="true"></i></a></p>' +
          '</div>' +
          chargeGroupsHTML(items, 'h4') +
          '</section>';
      }).join('');
    }
    if (empty) empty.style.display = list.length ? 'none' : 'block';
  }

  function val(id) { var e = document.getElementById(id); return e ? e.value : ''; }

  /* ---- Program finder: interactive step wizard ---- */
  var answers = {};
  var fsteps = [], fcurr = 0;
  var prefersReduced = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function wireFinder() {
    var finder = document.getElementById('finder');
    if (!finder) return;
    fsteps = [].slice.call(finder.querySelectorAll('.fstep'));
    fsteps.forEach(function (step) {
      var key = step.getAttribute('data-key');
      step.querySelectorAll('.fopt').forEach(function (btn) {
        btn.addEventListener('click', function () {
          step.querySelectorAll('.fopt').forEach(function (b) { b.classList.remove('selected'); });
          btn.classList.add('selected');
          answers[key] = btn.getAttribute('data-value');
          window.setTimeout(function () {
            if (fcurr < fsteps.length - 1) goToStep(fcurr + 1);
            else finishFinder();
          }, 240);
        });
      });
    });
    var back = document.getElementById('finder-back');
    if (back) back.addEventListener('click', function () { if (fcurr > 0) goToStep(fcurr - 1); });
    var restart = document.getElementById('finder-restart');
    if (restart) restart.addEventListener('click', resetFinder);
    updateFinder();
  }

  function goToStep(i) {
    var res = document.getElementById('finder-result');
    if (res) res.classList.remove('show');
    var stage = document.getElementById('finder-stage');
    if (stage) stage.hidden = false;
    if (fsteps[fcurr]) fsteps[fcurr].classList.remove('is-active');
    fcurr = i;
    if (fsteps[fcurr]) fsteps[fcurr].classList.add('is-active');
    updateFinder();
  }

  function updateFinder() {
    var bar = document.getElementById('finder-bar');
    var count = document.getElementById('finder-count');
    var back = document.getElementById('finder-back');
    if (bar) bar.style.width = (((fcurr + 1) / fsteps.length) * 100) + '%';
    if (count) count.textContent = 'Question ' + (fcurr + 1) + ' of ' + fsteps.length;
    if (back) back.hidden = fcurr === 0;
  }

  function score(p) {
    var s = 0;
    if (answers.goal && p.goal === answers.goal) s += 3;
    if (answers.level && p.level === answers.level) s += 2;
    if (answers.support && p.support === answers.support) s += 3;
    if (answers.audience && p.audience === answers.audience) s += 4;
    return s;
  }

  function finishFinder() {
    var best = null, bestScore = -1;
    activePrograms().forEach(function (p) {
      var sc = score(p);
      if (sc > bestScore) { bestScore = sc; best = p; }
    });
    if (!best) return;

    var stage = document.getElementById('finder-stage');
    if (stage) stage.hidden = true;
    var bar = document.getElementById('finder-bar'); if (bar) bar.style.width = '100%';
    var count = document.getElementById('finder-count'); if (count) count.textContent = 'Your match';
    var back = document.getElementById('finder-back'); if (back) back.hidden = true;

    document.getElementById('finder-result-name').textContent = best.name;
    document.getElementById('finder-result-desc').textContent = best.headline;
    var why = document.getElementById('finder-result-why');
    if (why) {
      var reasons = [];
      if (answers.goal) reasons.push('Matches your goal: ' + cap(answers.goal));
      if (answers.level) reasons.push(cap(answers.level) + ' level programming');
      if (answers.support) reasons.push(cap(answers.support) + ' support');
      if (answers.audience) reasons.push('Built for: ' + cap(answers.audience));
      why.innerHTML = reasons.map(function (r) {
        return '<li><i class="ti ti-check" aria-hidden="true"></i>' + esc(r) + '</li>';
      }).join('');
    }
    var cta = document.getElementById('finder-result-cta');
    var href = best.checkoutUrl || '/contact/';
    cta.setAttribute('href', href);
    if (/^https?:\/\//.test(href)) { cta.setAttribute('target', '_blank'); cta.setAttribute('rel', 'noopener'); }
    cta.innerHTML = esc(best.cta) + ' <i class="ti ti-arrow-right" aria-hidden="true"></i>';

    track('finder_result', { programme: best.slug || '' });
    setupCapture(best, answers);

    var box = document.getElementById('finder-result');
    box.classList.add('show');
    box.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'nearest' });
  }

  /* Vercel Web Analytics custom events. Programme slug only: never a name, an
     email or anything else that could identify the person who filled it in. */
  function track(name, data) {
    if (typeof window.va === 'function') {
      try { window.va('event', { name: name, data: data || {} }); } catch (e) {}
    }
  }

  var captured = null;

  function setupCapture(best, answers) {
    var form = document.getElementById('finder-capture');
    if (!form) return;
    captured = { programme: best.name, slug: best.slug || '', answers: answers };
    form.hidden = false;
    if (form.getAttribute('data-bound')) return;
    form.setAttribute('data-bound', '1');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var status = document.getElementById('rc-status');

      /* Filled in means a bot. Confirm as normal and send nothing. */
      var hp = form.querySelector('[name="website"]');
      if (hp && hp.value) {
        form.innerHTML = '<p class="rc-done"><i class="ti ti-check" aria-hidden="true"></i> Sent.</p>';
        return;
      }

      var name = (document.getElementById('rc-name').value || '').trim();
      var email = (document.getElementById('rc-email').value || '').trim();
      if (!name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        status.textContent = 'Please add your first name and an email we can reach you on.';
        return;
      }

      var cfg = window.EVEREST_FORM || {};
      var a = captured.answers || {};
      var body = [
        'Programme finder result',
        '',
        'Name: ' + name,
        'Email: ' + email,
        'Best fit: ' + captured.programme,
        'Goal: ' + (a.goal || '-'),
        'Level: ' + (a.level || '-'),
        'Support: ' + (a.support || '-'),
        'Audience: ' + (a.audience || '-')
      ].join('\n');
      var payload = {
        name: name, email: email, programme: captured.programme,
        goal: a.goal || '', level: a.level || '', support: a.support || '',
        audience: a.audience || '', message: body,
        from_name: 'Everest website', replyto: email, _replyto: email
      };
      /* The finder never asks what kind of enquiry this is, but it already
         asked who the training is for, which routes it just as well. */
      if (window.EverestLead) {
        window.EverestLead.decorate(payload, {
          segment: window.EverestLead.fromAudience(a.audience),
          headline: 'Finder result for ' + name + ' (' + captured.programme + ')',
          form: 'Programme finder'
        });
      } else {
        payload.subject = 'Finder result for ' + name + ' (' + captured.programme + ')';
      }
      if (cfg.accessKey) payload.access_key = cfg.accessKey;

      track('finder_email_submitted', { programme: captured.slug });

      function done(msg) {
        form.innerHTML = '<p class="rc-done"><i class="ti ti-check" aria-hidden="true"></i> ' + esc(msg) + '</p>';
      }

      if (cfg.endpoint) {
        status.textContent = 'Sending...';
        fetch(cfg.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(payload)
        }).then(function (r) {
          if (!r.ok) throw new Error('bad response');
          done('Sent. We will email your match and the first thing to do, usually the same day.');
        }).catch(function () {
          status.textContent = 'Something went wrong. Email us at ' + (cfg.fallbackEmail || 'jared@everest-pt.com') + '.';
        });
      } else {
        /* No endpoint connected yet: hand it to the visitor's mail app so the
           enquiry is not simply lost. Connect js/form-config.js to fix this. */
        window.location.href = 'mailto:' + (cfg.fallbackEmail || 'jared@everest-pt.com') +
          '?subject=' + encodeURIComponent(payload.subject) +
          '&body=' + encodeURIComponent(body);
        done('Opening your email app. If nothing happens, email us at ' + (cfg.fallbackEmail || 'jared@everest-pt.com') + '.');
      }
    });
  }

  function resetFinder() {
    answers = {};
    fsteps.forEach(function (s) {
      s.querySelectorAll('.fopt').forEach(function (b) { b.classList.remove('selected'); });
    });
    var box = document.getElementById('finder-result'); if (box) box.classList.remove('show');
    var stage = document.getElementById('finder-stage'); if (stage) stage.hidden = false;
    goToStep(0);
  }

  /* ---- init ---- */
  fetch('/data/programs.json', { cache: 'no-cache' })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      DATA = data;
      render();
      ['f-category', 'f-goal', 'f-level', 'f-support', 'f-audience'].forEach(function (id) {
        var e = document.getElementById(id);
        if (e) e.addEventListener('change', render);
      });
      var reset = document.getElementById('reset-filters');
      if (reset) reset.addEventListener('click', function () {
        ['f-category', 'f-goal', 'f-level', 'f-support', 'f-audience'].forEach(function (id) {
          var e = document.getElementById(id); if (e) e.value = '';
        });
        render();
      });
      wireFinder();
    })
    .catch(function (e) { console.error(e); });
})();
