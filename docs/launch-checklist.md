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

To sanity-check before flipping, run a production build locally:

```bash
SEO_INDEX=1 SITE_URL=https://www.everest-pt.com node tools/generate.js
```

## Blocking launch

| # | Item | Why it blocks |
|---|---|---|
| 1 | **Decide the production domain** | Everything above depends on it. See `domain-migration.md` — the old domain holds five years of ranking history and the new one holds none. |
| 2 | **Attach the domain in Vercel** | Until then the site only exists at the preview URL. |
| 3 | **Set `SITE_URL`** | The launch switch. |
| 4 | **Contact form endpoint** | `js/contact.js` has an empty `FORM_ENDPOINT`, so the form falls back to opening the visitor's mail app. A meaningful share of people abandon at that point. Web3Forms or Formspree, five minutes. |
| 5 | **Written permission from Busy Bumbles, Moral Compass and Plus Fitness Rolleston** | They are named on `/organisations/`. Fine while noindexed; not fine once public without their say-so. |
| 6 | **The EightySix Digital footer credit** | `js/layout.js` says "Another website designed and built by EightySix Digital" and links out from every page. That is not who built this site. If it is a leftover, remove it. If it is a deliberate arrangement, keep it but add `rel="nofollow"`. |

## Should do before launch, not blocking

- **Remaining 4 checkout links** — Starter Strength, Build/Hypertrophy, Run Strong, Strength & Stretch. Empty `checkoutUrl` in `data/programs.json` means those cards have no way to buy.
- **Social profile URLs** — feed them into `sameAs` in the JSON-LD (`tools/generate.js`, `businessGraph()`). This is how Google ties the site to the profiles.
- **`VERCEL_DEPLOY_HOOK`** repo secret — scheduled rebuilds fail without it.
- **Balmanno and The Steam Tent store URLs** — still `TODO` in `about/index.html`.
- **HIIT For Hope figures** from the MBIE post-event report.
- **Team details and photos** for `/team/`.

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
