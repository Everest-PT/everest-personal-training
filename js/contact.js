/* Everest PT - Contact form.
   Preselects enquiry type from ?type=, shows the organisation field when
   relevant, tags the submission with its segment so it can be routed in the
   inbox, and submits to the endpoint in js/form-config.js. If that is ever
   unset it falls back to opening a pre-filled email, so the form is never a
   dead end. */
(function () {
  'use strict';

  /* Endpoint and key live in js/form-config.js, which the finder and the
     EMPOWER form share, so there is one place to change provider.
     Segment tags and the first-move lines live in js/lead.js. */
  var CFG = window.EVEREST_FORM || {};
  var FORM_ENDPOINT = CFG.endpoint || '';
  var ACCESS_KEY = CFG.accessKey || '';       /* Web3Forms only */
  var FALLBACK_EMAIL = CFG.fallbackEmail || 'jared@everest-pt.com';

  /* What we tell them we will do next, by enquiry type. Deliberately about
     substance rather than timing: a promise of "within an hour" on the page
     is a promise, and the inbox target in js/lead.js is not visible here. */
  var CONFIRM = {
    individual: 'Thanks. We will come back to you with a first step you can action this week.',
    performance: 'Thanks. We will come back to you about what you are training for and how we would assess it.',
    organisation: 'Thanks. We will come back to you to arrange a short scoping call.',
    referral: 'Thanks. We will come back to you to confirm scope and what you need reported back.',
    partnership: 'Thanks. We will come back to you about what a first step together could look like.'
  };

  var form = document.getElementById('contact-form');
  if (!form) return;

  var typeSel = document.getElementById('type');
  var orgField = document.getElementById('org-field');
  var status = document.getElementById('form-status');

  function syncOrg() {
    var t = typeSel.value;
    var show = (t === 'organisation' || t === 'partnership');
    orgField.hidden = !show;
  }

  var params = new URLSearchParams(location.search);
  var preset = params.get('type');
  if (preset) {
    var ok = Array.prototype.some.call(typeSel.options, function (o) { return o.value === preset; });
    if (ok) typeSel.value = preset;
  }
  syncOrg();
  typeSel.addEventListener('change', syncOrg);

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    /* Filled in means a bot. Say nothing useful and do not send. */
    var hp = form.querySelector('[name="website"]');
    if (hp && hp.value) {
      /* The same confirmation a person would get, so the bot learns nothing
         from the difference. */
      form.reset(); syncOrg();
      status.textContent = CONFIRM[typeSel.value] || 'Thanks. We will be in touch soon.';
      return;
    }

    if (!form.checkValidity()) { form.reportValidity(); return; }
    var data = {
      type: typeSel.value,
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      organisation: form.organisation ? form.organisation.value.trim() : '',
      message: form.message.value.trim()
    };

    if (FORM_ENDPOINT) {
      status.textContent = 'Sending...';
      var payload = {
        name: data.name, email: data.email, type: data.type,
        organisation: data.organisation, message: data.message,
        /* So a reply in the inbox goes to the enquirer, not to the form
           service. Web3Forms reads replyto, Formspree reads _replyto. */
        from_name: 'Everest website',
        replyto: data.email,
        _replyto: data.email
      };
      /* Subject tag, first move and where they came from. */
      if (window.EverestLead) {
        window.EverestLead.decorate(payload, {
          segment: data.type,
          headline: 'Website enquiry from ' + data.name +
            (data.organisation ? ' - ' + data.organisation : ''),
          form: 'Contact page'
        });
      } else {
        payload.subject = 'Website enquiry (' + data.type + ') from ' + data.name;
      }
      if (ACCESS_KEY) payload.access_key = ACCESS_KEY;   /* Web3Forms */
      fetch(FORM_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      }).then(function (r) {
        if (r.ok) {
          var msg = CONFIRM[data.type] || 'Thanks. We will be in touch soon.';
          form.reset(); syncOrg(); status.textContent = msg;
        }
        else throw new Error('bad response');
      }).catch(function () {
        status.textContent = 'Something went wrong. Please email us at ' + FALLBACK_EMAIL + '.';
      });
    } else {
      var tag = window.EverestLead ? window.EverestLead.get(data.type).tag : 'PT';
      var subject = '[' + tag + '] Website enquiry from ' + data.name;
      var body = 'Name: ' + data.name + '\nEmail: ' + data.email +
        (data.organisation ? '\nOrganisation: ' + data.organisation : '') +
        '\nType: ' + data.type + '\n\n' + data.message;
      window.location.href = 'mailto:' + FALLBACK_EMAIL +
        '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
      status.textContent = 'Opening your email app. If nothing happens, email us at ' + FALLBACK_EMAIL + '.';
    }
  });
})();
