/* One place to connect the site's forms.

   Both the contact form and the programme finder's "email me my match" step
   post here. Until an endpoint is set they fall back to opening the visitor's
   own mail app, which works but loses a meaningful share of people, so this is
   worth five minutes before launch.

   To connect Web3Forms (no account needed, just verify the email):
     endpoint:  https://api.web3forms.com/submit
     accessKey: the key they email you

   To connect Formspree:
     endpoint:  https://formspree.io/f/xxxxxxx
     accessKey: leave empty

   Whichever you choose, add it to the privacy policy under "Who else sees it",
   because that provider processes the message. See docs/legal-review.md. */
window.EVEREST_FORM = {
  endpoint: '',
  accessKey: '',
  fallbackEmail: 'jared@everest-pt.com'
};
