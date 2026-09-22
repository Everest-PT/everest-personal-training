# Swapping Trainerize for the Everest portal

**A shareable version of this is published for the portal team at**
<https://claude.ai/code/artifact/773c94d8-5d8f-4900-85dd-1b624a7bcd93>.
Keep the two in step.

Written 22 September 2026, when Jared said a client portal is being built to
replace Trainerize and the website should sell the programme and hand the new
client straight to it.

The good news first: the website is already shaped for this. Checkout
destinations live in one data file, not scattered through the markup, so the
handoff is a small, known change. The parts that need care are the legal page
and the attribution handoff — and one of those is much easier to get right
while the portal is still being built than afterwards.

## Everything on this site that knows about Trainerize

Five places. That is the whole surface.

| Where | What it says | On swap |
|---|---|---|
| `data/programs.json` | `checkoutUrl` on EVEREST365 and EVEREST365 Premium point at `trainerize.me/profile/everestpt/?planGUID=…` | Replace with portal URLs. Four more programmes have **no** checkout URL at all — see `funnel.md` |
| `legal/index.html` | Privacy: "Programming, check-ins and subscription billing run through Trainerize… your account and payment details are held by Trainerize and their payment provider, not by us. We never see or store your full card details." | **Must change in the same release.** See the warning below |
| `legal/index.html` | Terms: weekly programmes "run through Trainerize. They continue until you cancel." | Rewrite for the portal's actual billing behaviour |
| `docs/legal-review.md` | Asserts card details never reach Everest, and lists Trainerize as an overseas processor | Update both assertions |
| `tools/seo-report.js` | Allows `trainerize.me` as an expected outbound domain, so the weekly audit does not flag it | Add the portal's domain, or the audit will warn every week |

## The warning worth reading twice

Today Trainerize holds the card details and the health questionnaires, and the
privacy policy says so plainly: *we never see or store your full card details.*

If the new portal takes payments directly, **that sentence stops being true**,
and with it a good deal of the risk position behind it changes:

- Card data brings PCI DSS obligations. The usual way to keep them small is to
  never touch the card — use a hosted checkout or payment element from Stripe,
  Windcave or similar, so card details go from the client's browser to the
  payment provider and never through Everest's servers. If the portal is built
  this way, most of the current wording survives with the provider's name
  changed.
- Health and readiness questionnaires, injury history and body composition
  results become data **Everest holds**, not data a vendor holds. Under the
  Privacy Act 2020 that raises the stakes on storage, access control, breach
  notification and retention — the things a ministry or ACC contract will ask
  about directly.
- The privacy policy and terms have to change in the same release that the
  portal goes live. A policy describing a vendor you no longer use is worse
  than no policy, because it is a written statement that is false.

None of this is a reason not to build the portal. It is a reason to decide the
payment architecture early, because it is the difference between a paragraph
change and a compliance programme.

## What the website needs the portal to accept

Cheap to build in now, expensive to retrofit. Three things:

**1. A deep link per programme.** The site should be able to send someone
straight into signup for the exact programme they chose, not to a portal front
door where they have to find it again. Something like:

```
https://portal.everest-pt.com/join/everest365
```

Use the slugs already in `data/programs.json` — `everest365`,
`everest365-premium`, `starter-strength`, `build-hypertrophy`, `run-strong`,
`strength-and-stretch` — and the swap is one line per programme.

**2. Pass the campaign parameters through.** This is the one that quietly
matters. The site knows which post, email or poster brought a visitor, and that
knowledge dies the moment they leave for the portal unless the portal keeps it.

The portal should accept `utm_source`, `utm_medium`, `utm_campaign` and
`utm_content` on the join URL, store them against the account, and show them on
the client record. Then "which channel produced paying clients" becomes a
question with an answer — not "which channel produced enquiries", which is all
the website can ever tell you on its own.

The site can append them automatically once the portal accepts them. That is a
small change here and a decision there.

**3. Tell the site the signup completed.** A `?joined=1` on a thank-you
redirect back to the site, or a webhook, is enough to count completed signups
rather than clicks. Without it the funnel ends at `checkout_click` and everything
after that is invisible.

## What does not change

- The programme catalogue, pricing, finder and matching logic all read from
  `data/programs.json` and care only that `checkoutUrl` is a URL.
- Segment routing, attribution and the forms are untouched — they run before
  the handoff.
- The proof block, the schema markup and the SEO work are unaffected.

## Sequence when the portal is ready

1. Confirm the payment architecture, and rewrite the privacy policy and terms
   to match **before** anything points at the portal.
2. Add the portal domain to `tools/seo-report.js`.
3. Replace the two `checkoutUrl` values, and fill in the four that are empty.
4. Append the campaign parameters to outbound checkout links, once the portal
   accepts them.
5. Run `node tools/seo-report.js` and check nothing warns.
6. Buy something, end to end, with a real card, before announcing it.
