/* One place to connect the site's forms.

   Both the contact form and the programme finder's "email me my match" step
   post here. Connected to Web3Forms on 22 September 2026 and tested end to
   end; before that, both fell back to opening the visitor's own mail app.

   The access key is public by design. It ships in client-side JavaScript, as
   any browser-submitted form key must, and all it can do is deliver a message
   to the verified address — it grants no account access and is not a secret,
   so it belongs in the repository rather than in an environment variable.
   The guard against abuse is the honeypot on both forms, not hiding the key.

   To change provider: Web3Forms wants the submit URL plus an access key,
   Formspree wants its own endpoint and no key. Whichever is in use must be
   named in the privacy policy under "Who else sees it", because that provider
   processes the message. See docs/legal-review.md. */
window.EVEREST_FORM = {
  endpoint: 'https://api.web3forms.com/submit',
  accessKey: '770c7067-ec65-4914-b6bf-281894d22298',
  fallbackEmail: 'jared@everest-pt.com'
};
