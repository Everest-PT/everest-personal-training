/* Everest PT - EMPOWER register-interest form.

   This form collected nine fields and then did nothing with them: the markup
   carried onsubmit="return false" while the endpoint was unconnected, so every
   parent, school and club who filled it in was silently dropped. It now posts
   to the same endpoint as the other two forms.

   A funding or partnership enquiry routes with the partnership enquiries
   rather than with the parents, because it is a different conversation, but
   the subject line keeps the EMPOWER context. See js/lead.js. */
(function () {
  'use strict';

  /* What happens next, not when. Parents are deciding on detail. */
  var CONFIRMED = 'Thanks. We will come back to you with the dates for the next cohort and what it involves.';

  var CFG = window.EVEREST_FORM || {};
  var FALLBACK_EMAIL = CFG.fallbackEmail || 'jared@everest-pt.com';

  var form = document.getElementById('empower-form');
  if (!form) return;

  var status = document.getElementById('emp-status');

  /* The visible label rather than the value, because "My child joining
     EMPOWER" reads better in a subject line than "child-joining". */
  function interestLabel(sel) {
    var o = sel.options[sel.selectedIndex];
    return o ? o.textContent.trim() : '';
  }

  function checked(name) {
    var el = form.querySelector('input[name="' + name + '"]:checked');
    return el ? el.value : '';
  }

  function done(msg) {
    if (status) status.textContent = msg;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    /* Filled in means a bot. Confirm as normal and send nothing. */
    var hp = form.querySelector('[name="website"]');
    if (hp && hp.value) { form.reset(); done(CONFIRMED); return; }

    var name = (form.name.value || '').trim();
    var email = (form.email.value || '').trim();
    if (!name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      done('Please add your name and an email we can reach you on.');
      return;
    }

    var interest = form.interest;
    var data = {
      name: name,
      email: email,
      phone: (form.phone.value || '').trim(),
      location: (form.location.value || '').trim(),
      role: checked('role'),
      organisation: (form.organisation.value || '').trim(),
      interest: interestLabel(interest),
      message: (form.message.value || '').trim()
    };

    var body = [
      'EMPOWER register of interest',
      '',
      'Name: ' + data.name,
      'Email: ' + data.email,
      'Phone: ' + (data.phone || '-'),
      'Location: ' + (data.location || '-'),
      'They are a: ' + (data.role || '-'),
      'Organisation: ' + (data.organisation || '-'),
      'Interested in: ' + data.interest,
      '',
      data.message || '(no message)'
    ].join('\n');

    var payload = {
      name: data.name, email: data.email, phone: data.phone,
      location: data.location, role: data.role,
      organisation: data.organisation, interest: data.interest,
      message: body,
      from_name: 'Everest website', replyto: data.email, _replyto: data.email
    };
    if (CFG.accessKey) payload.access_key = CFG.accessKey;

    var segment = window.EverestLead ? window.EverestLead.fromInterest(interest.value) : 'empower';
    /* The tag already says EMPOWER, so the headline does not repeat it -
       except where this routes to the partnership pile, which needs to say
       which part of the business it came from. */
    var headline = (segment === 'empower' ? '' : 'EMPOWER: ') +
      data.interest + ' - ' + data.name +
      (data.organisation ? ' (' + data.organisation + ')' : '');

    if (window.EverestLead) {
      window.EverestLead.decorate(payload, {
        segment: segment,
        headline: headline,
        form: 'EMPOWER register'
      });
    } else {
      payload.subject = '[EMPOWER] ' + headline;
    }

    if (window.EverestTrack) window.EverestTrack('empower_submitted', { interest: interest.value });

    if (CFG.endpoint) {
      done('Sending...');
      fetch(CFG.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      }).then(function (r) {
        if (!r.ok) throw new Error('bad response');
        form.reset();
        done(CONFIRMED);
      }).catch(function () {
        done('Something went wrong. Please email us at ' + FALLBACK_EMAIL + '.');
      });
    } else {
      window.location.href = 'mailto:' + FALLBACK_EMAIL +
        '?subject=' + encodeURIComponent(payload.subject) +
        '&body=' + encodeURIComponent(body);
      done('Opening your email app. If nothing happens, email us at ' + FALLBACK_EMAIL + '.');
    }
  });
})();
