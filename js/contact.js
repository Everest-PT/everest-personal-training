/* Everest PT - Contact form.
   Preselects enquiry type from ?type=, shows the organisation field when relevant,
   and submits to a configured form endpoint. Until an endpoint is set it falls back
   to opening a pre-filled email, so the form is never a dead end. */
(function () {
  'use strict';

  /* Where submissions go.
     This site is static — there is no server here to send mail, so delivery
     needs a form backend. Paste the endpoint below and submissions start
     arriving at jared@everest-pt.com automatically, with no other change:

       Web3Forms  https://web3forms.com   (no account, just verify the email;
                  gives an access key — endpoint is https://api.web3forms.com/submit
                  and the key goes in ACCESS_KEY below)
       Formspree  https://formspree.io    (free tier, endpoint looks like
                  https://formspree.io/f/xxxxxxx)

     Until one is set the form falls back to opening the visitor's email app,
     which many people abandon — so this is worth doing before launch. */
  /* Set these in js/form-config.js, which the finder's email step shares, so
     there is one place to paste the endpoint rather than two. */
  var CFG = window.EVEREST_FORM || {};
  var FORM_ENDPOINT = CFG.endpoint || '';
  var ACCESS_KEY = CFG.accessKey || '';       /* Web3Forms only */
  var FALLBACK_EMAIL = CFG.fallbackEmail || 'jared@everest-pt.com';

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
        subject: 'Website enquiry (' + data.type + ') from ' + data.name
      };
      if (ACCESS_KEY) payload.access_key = ACCESS_KEY;   /* Web3Forms */
      fetch(FORM_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      }).then(function (r) {
        if (r.ok) { form.reset(); syncOrg(); status.textContent = 'Thanks. We will be in touch soon.'; }
        else throw new Error('bad response');
      }).catch(function () {
        status.textContent = 'Something went wrong. Please email us at ' + FALLBACK_EMAIL + '.';
      });
    } else {
      var subject = 'Website enquiry (' + data.type + ') from ' + data.name;
      var body = 'Name: ' + data.name + '\nEmail: ' + data.email +
        (data.organisation ? '\nOrganisation: ' + data.organisation : '') +
        '\nType: ' + data.type + '\n\n' + data.message;
      window.location.href = 'mailto:' + FALLBACK_EMAIL +
        '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
      status.textContent = 'Opening your email app. If nothing happens, email us at ' + FALLBACK_EMAIL + '.';
    }
  });
})();
