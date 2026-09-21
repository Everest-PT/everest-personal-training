# Legal pages: what to confirm before launch

`/legal/` was placeholder text until 21 September 2026. It is now a real draft,
written from what the site and the business actually do rather than from a
template. **It has not been reviewed by a lawyer, and it should be before the
site is public.** This file lists every point where the draft asserts something
that needs confirming, so that review is a checklist rather than a hunt.

## Facts the draft asserts, verified in the code

These were checked, not assumed:

- The site sets **no cookies**, runs no analytics, no advertising tags, no
  tracking pixels, no session recording, and uses no `localStorage`.
- Since the fonts and icons were self-hosted, **no third-party request is made
  on any page**. Loading a page tells nobody but our own host.
- The contact form collects name, email, enquiry type, organisation, message.
- The EMPOWER form collects name, email, phone, location, role, organisation,
  interest and message — all adult contact details. No child data is collected
  through the website.
- Payments run through Trainerize, so card details never reach us.

## Needs Jared's confirmation

| # | Point | Where |
|---|---|---|
| 1 | **Legal entity.** The page says "Everest Personal Training" as a trading name. If there is a registered company, terms of purchase should name it and give the NZBN. | Intro, Terms |
| 2 | **GST.** Prices are shown as plain dollar figures. If Everest is GST-registered, consumer prices must be stated GST-inclusive, and the page should say so. | Terms |
| 3 | **Cancellation.** The draft says: cancel any time, access runs to the end of the paid week, no fee, no minimum term. Confirm this matches how the Trainerize plans are actually configured. | Terms |
| 4 | **24 hours' notice** for moving or cancelling a one-to-one session, and that a late cancellation "may be treated as used". Is that the real policy? | Terms |
| 5 | **Concession cards.** The draft says they are for the buyer only and sets no expiry. Confirm both. | Terms |
| 6 | **Refunds.** The draft relies on Consumer Guarantees Act rights and promises nothing beyond them. Decide whether there is also a goodwill or change-of-mind position. | Terms |
| 7 | **Retention periods.** The draft says client records are kept "for a period afterwards". A specific period is stronger — commonly seven years to match tax records. | Privacy |
| 8 | **Privacy officer.** The Privacy Act 2020 requires every agency to have one. The draft points people at Jared's email; naming the role explicitly is better. | Privacy |
| 9 | ~~**Form provider.**~~ **Done, 22 September 2026.** Both forms are connected to Web3Forms, and the privacy policy names it under "Who else sees it" with a link to their privacy policy. Still worth the lawyer confirming the wording is sufficient disclosure. | Privacy |
| 10 | **Overseas storage.** Trainerize and Vercel are overseas. Privacy Act principle 12 expects comparable safeguards where information leaves New Zealand. Worth the lawyer's attention. | Privacy |
| 11 | **Safeguarding policy.** The privacy and consent sections reference youth safeguarding obligations. Confirm a written policy exists that they can point to. | Privacy, Consent |

## Related claims elsewhere on the site

- `/contact/` says "we already coach clients on three continents". `/about/`
  says "well beyond New Zealand". Both are checkable claims; make sure they are
  accurate and consistent.
- The Google rating ("5.0 from 26 Google reviews") is published on the homepage,
  `/contact/` and `/personal-training/`. Review counts move. `data/testimonials.json`
  records that it was verified on 4 August 2026 — re-check it periodically, since
  a published rating that no longer matches the profile is a false claim.

## Note

This draft was written by Claude, working from the site's code and Jared's
instructions. It is a starting point for a lawyer, not a substitute for one.
