# Launch checklist

Written 7 September 2026, after a full pre-launch SEO/AEO pass.

The site is technically ready. Everything below that is still open needs a
decision, a credential or a permission from Jared — none of it can be written
in code.

## The one switch

Indexing is driven by a single condition in `tools/generate.js`:

```
indexable = VERCEL_ENV === 'production' && SITE_URL is set
```

`VERCEL_ENV` is set by Vercel automatically. So **setting `SITE_URL` on the
Production environment is the launch switch.** It simultaneously:

- flips `robots.txt` from `Disallow: /` to `Allow: /`
- flips every page's `<meta name="robots">` to `index, follow`
- points canonicals, `og:url`, `og:image`, sitemap and RSS at the real domain
- writes the correct `Sitemap:` line into `robots.txt`

This was deliberately made one switch. It used to be five separate places —
`vercel.json`, `robots.txt`, eleven page templates and two blog templates —
which is five chances to launch a site that is still telling Google to go away.

Set it to the production domain **with no trailing slash**, e.g.
`https://www.everest-pt.com`. Set it on **Production only**, not Preview, or
preview deployments become indexable duplicates.

Four things move together on launch day, so do them in one sitting:

1. Set `SITE_URL` on Vercel Production.
2. Attach the domain in Vercel.
3. **Rebuild any tagged links** already in use - the Instagram bio, the email
   signature, any printed poster. They carry the old address and keep working
   only as long as it redirects. `lead-routing.md` holds the list.
4. **Update the website URL on the Web3Forms form** (dashboard → the form →
   website URL), which currently reads
   `https://everest-personal-training-sooty.vercel.app`. The access key works
   from any origin, so forms keep working either way, but leaving a stale URL
   there makes the dashboard misleading and forecloses turning on domain
   restriction later.

To sanity-check before flipping, run a production build locally:

```bash
SEO_INDEX=1 SITE_URL=https://www.everest-pt.com node tools/generate.js
```

## Hosting

Moved to Everest's own accounts on 21 September 2026, after the repository was
transferred off the eightysix-digital organisation and the previous Vercel
hosting stopped building it.

| | |
|---|---|
| Repository | `Everest-PT/everest-personal-training` — note **Everest-PT is a personal GitHub account, not an organisation**, so app settings live under `/settings/installations`, not `/organizations/...` |
| Vercel project | `everest-personal-training`, connected to that repo, so a push to `main` deploys |
| Production URL | **https://everest-personal-training-sooty.vercel.app** — the clean alias. Two others exist (`-everest-personal-training`, `-git-main-...`). Per-deployment URLs sit behind Vercel Authentication and show a login page rather than the site, so always check this one |
| Deploy hook | Created ("Daily rebuild", branch `main`) and stored as the `VERCEL_DEPLOY_HOOK` repo secret, which is what the scheduled rebuild workflow fires |
| Framework | Pinned to "Other" via `"framework": null` in `vercel.json`. Vercel otherwise detects this repo as Python because of `requirements.txt` and fails the build looking for a Python entrypoint |
| Previews | Behind Vercel Authentication, so preview URLs only open for someone signed in to the Vercel account |

The old `everest-personal-training.vercel.app` address belonged to the previous
host's project and is no longer updated. It is still the fallback `SITE_URL` in
`tools/generate.js`, which is harmless while the site is noindexed but is
another reason to set `SITE_URL` properly at launch.

## Blocking launch

| # | Item | Why it blocks |
|---|---|---|
| 1 | **Decide the production domain** | Everything above depends on it. See `domain-migration.md` — the old domain holds five years of ranking history and the new one holds none. |
| 2 | **Attach the domain in Vercel** | Until then the site only exists at the preview URL. |
| 3 | **Set `SITE_URL`** | The launch switch. |
| ~~4~~ | ~~**Form endpoint**~~ **Done, 22 September 2026.** Both forms post to Web3Forms, set once in `js/form-config.js`. Tested end to end: the contact form and the finder each returned `success: true` and delivered to jared@everest-pt.com. Web3Forms is named in the privacy policy. The website URL held on the Web3Forms form still points at the preview alias — see the launch-day list under **The one switch** above. |
| 5 | **Written permission from Busy Bumbles, Moral Compass and Plus Fitness Rolleston** | They are named on `/organisations/`. Fine while noindexed; not fine once public without their say-so. |
| 6 | **Legal review of `/legal/`** | The privacy policy, terms of purchase, health disclaimer, cookie statement and consent sections are now a real draft rather than placeholder text, written from what the site and business actually do. A lawyer should read it before the site is public. Every assumption it makes is listed in `legal-review.md`, along with eleven points needing Jared's confirmation — legal entity and NZBN, GST treatment, cancellation and refund terms, and retention periods among them. |

## Should do before launch, not blocking

- **Remaining 4 checkout links** — Starter Strength, Build/Hypertrophy, Run Strong, Strength & Stretch. Empty `checkoutUrl` in `data/programs.json` means those cards have no way to buy. **Hold until the new portal is ready** — see `portal-migration.md` — unless launch comes first, in which case point them at Trainerize rather than leaving a price with no way to pay.
- **Social profile URLs** — feed them into `sameAs` in the JSON-LD (`tools/generate.js`, `businessGraph()`). This is how Google ties the site to the profiles.
- **Balmanno and The Steam Tent store URLs** — still `TODO` in `about/index.html`.
- **HIIT For Hope figures** from the MBIE post-event report.
- **Team details and photos** for `/team/`.
- **Jared's headshot and qualifications** for `/about/`. The page still shows
  a placeholder photo and lists no credentials. A note saying so used to be
  printed on the live page, where visitors could read it; that note has been
  removed, so this checklist is now the only record of the task. For a trade
  anyone can enter, credentials are a trust anchor: REPs registration, first
  aid and insurance are the ones an individual client looks for, and
  /organisations/ already promises them "on request".
- **EightySix Digital footer credit — no action required.** The repository sits
  under the `eightysix-digital` GitHub organisation, so the "designed and built
  by EightySix Digital" credit in `js/layout.js` is legitimate. An earlier
  version of this checklist wrongly listed it as a launch blocker. One optional
  tweak, and EightySix Digital's call: the credit links from every page to a
  web-design keyword page, and Google's link spam policy names links spread
  across site footers and templates as an example, so a `rel="nofollow"` on
  that link is the conservative choice.

## What's happening wall (homepage)

Cards live in `data/whats-happening.json`; the `note` at the top of that file
explains every field. Outstanding before launch:

- **EMPOWER sign-up poster** from Rebecca at Busy Bumbles. The partnership badge
  is standing in (`imageSrc`). Swap it when the poster arrives, under a new
  filename.
- **EMPOWER sign-up URL.** The card's button points at `/empower/#register`.
  That form now works and delivers to the inbox, so the card is no longer a
  dead end. If a separate sign-up link exists once the poster arrives, replace
  `ctaHref` with it. Do not guess it.
- **Permission from Lemonwood Grove School** to be named on the homepage.
- **Built For The Climb event names** as they should appear publicly, and an
  `endDate` once the preparation block has one.
- **The data file is public** at `/data/whats-happening.json`. Only confirmed
  initiatives, and partners who have agreed to be named, go in it. Unconfirmed
  programs stay out until they are agreed.

## Lead routing and link tagging

The seven Gmail labels were created on 22 September 2026 and the matching
filters are in `gmail-filters.xml`, ready to import in one go - see
`lead-routing.md`, which also has the segment map and the link tagging
conventions, with a ready-made tagged link for each channel.

All three forms - contact, programme finder and EMPOWER register - now deliver,
carry a segment tag, and record which link brought the person.

## Analytics and the weekly audit

**Analytics needs one click from Jared.** The script is on every page, but it
only starts reporting once Web Analytics is enabled in the Vercel project
(project → Analytics → Enable). Until then the script 404s harmlessly and no
data is collected.

It is Vercel Web Analytics, chosen because it is cookieless and served from our
own domain, so the site still makes no third-party request and still needs no
consent banner. `/legal/` describes it accurately — if the analytics tool ever
changes, that page changes in the same commit.

**What it will and will not tell you.** It reports pages, referrers, countries
and device types in aggregate. It cannot tell you who an individual visitor is,
and no lawful tool can, for someone who has not identified themselves. Knowing
who is interested comes from three places instead:

1. the enquiry form, once its endpoint is connected;
2. UTM tags on links in emails and posts, which survive into analytics and tell
   you which campaign produced an enquiry;
3. company-level reverse-IP identification, which names visiting organisations
   rather than people. Considered and deferred — revisit when B2B traffic
   justifies the cost and the privacy disclosure.

**The weekly audit** runs from `.github/workflows/seo-report.yml` at 19:00 UTC
each Sunday, which is Monday morning in New Zealand, and can be run on demand
from the Actions tab. It audits the deployed site rather than the repo, because
the build rewrites canonicals, robots tags, the sitemap and llms.txt at deploy
time.

It checks indexability, canonicals, Open Graph tags, titles and descriptions,
structured data, word counts, missing alt text, third-party requests, sitemap
and llms.txt health, whether a 404 really returns 404, and how long it has been
since a blog post. The report lands in the run summary; errors fail the run so
GitHub emails you, warnings do not.

Run it yourself any time:

```bash
node tools/seo-report.js
```

## Getting Google ratings

Star ratings next to a business in Google search come from a **Google Business
Profile**, not from the website. No amount of markup produces them, and
`aggregateRating` in a page's own schema is explicitly ignored by Google when a
business rates itself — it is a manual-action risk, not a shortcut.

The sequence that actually works:

1. **Create and verify a Google Business Profile** for Everest Personal
   Training. Verification is usually by postcard or video and takes 1–2 weeks,
   so start it the day the domain is settled — it is the long pole.
2. **Make the NAP identical everywhere** — name, address, phone. The site says
   Christchurch, Canterbury, NZ and `+64 22 139 8969`. The profile must match
   character for character, including the trading name.
3. **Decide service-area vs storefront.** If clients come to a fixed address,
   list it. If Jared travels to them and works out of Plus Fitness Rolleston,
   it is a service-area business and the address stays hidden. Getting this
   wrong is a common suspension reason.
4. **Ask real clients for reviews**, with a direct review link, shortly after a
   result they can feel. Never incentivise, never bulk-request, never post them
   yourself — Google filters obvious bursts and the Fair Trading Act applies.
5. **Reply to every review.** Response rate is a visible trust signal.

Only once real reviews exist on the profile can testimonials on the site quote
them. Until then `data/testimonials.json` stays as it is.

## Search Console, day one

1. Verify the production domain as a **Domain property** (DNS TXT), which
   covers every subdomain and protocol.
2. Submit `https://<domain>/sitemap.xml`.
3. If the old domain is being redirected, verify it too and submit a **Change
   of Address**. That is the signal Google acts on; redirects alone are slower.
4. Note there is already a `google-site-verification` TXT on
   everestpersonaltraining.com belonging to someone else. See
   `domain-migration.md`.

## What the build now does automatically

`tools/build_blog.py` runs first, then `tools/generate.js`, which:

- writes `sitemap.xml` — **including the blog**, which was previously excluded
  entirely, and using real commit/publication dates rather than build time
- writes `llms.txt` with pages and articles, for answer engines
- writes `robots.txt` for the environment
- rewrites every page head: robots, absolute canonical, `og:url`, absolute
  `og:image`
- injects the Organization/LocalBusiness + WebSite + BreadcrumbList JSON-LD
  into the **static HTML**. It used to be injected by `layout.js` at runtime;
  Google renders JS eventually, but Bing and the answer-engine crawlers
  (GPTBot, ClaudeBot, PerplexityBot) largely do not, so schema behind JS is
  invisible to exactly the systems AEO is meant to reach.
- seeds the footer placeholder with a real link list, for the same reason —
  the nav is JS-injected, so without this a non-JS crawler saw pages with no
  links out of them and no way to discover the site.

The page rewrite runs on Vercel only (`SEO_REWRITE=1` to force it locally), so
a local build never leaves absolute preview URLs staged for commit.
