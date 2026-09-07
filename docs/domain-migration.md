# Migrating everestpersonaltraining.com

> **Status: not configured.** The redirect rules described below were added to
> `vercel.json` and then removed at Jared's request. Nothing in this document
> is live. It is kept as reference for whenever the migration does happen, and
> because the findings at the bottom are true either way.

The old WordPress site is the only real ranking history Everest has. Switching
it off without redirects throws that away and the new pages start from zero.
Redirect it properly and the new site inherits it.

## The old site, in full

Read from its Yoast sitemaps on 16 August 2026. Ten pages, no blog posts, and
an empty product sitemap despite WooCommerce being installed.

| Old URL | Redirects to | Why |
|---|---|---|
| `/` | `/personal-training/` | Old site was entirely the PT business |
| `/about-us/` | `/about/` | Direct equivalent |
| `/contact-us/` | `/contact/` | Direct equivalent |
| `/services/` | `/personal-training/` | Closest match to what it sold |
| `/packages/` | `/programs/` | The catalogue |
| `/shop/` | `/programs/` | WooCommerce storefront |
| `/basket/` | `/programs/` | Cart, nothing to preserve |
| `/checkout/` | `/programs/` | Checkout now runs through Trainerize |
| `/my-account/` | `/contact/` | Account holders will have questions; send them to a human |
| `/partners/` | `/organisations/` | Closest match |

None of these are currently configured. Every row except `/` can be added to
`redirects` in `vercel.json` as a plain path rule: those paths do not exist on
the new site, so the rules are inert on this domain and correct on the old one.

## What still needs doing, and why it is not in this repo

`/` cannot be redirected from a config file here. A rule for `/` would match
the new homepage as well, and Vercel needs an absolute destination to move a
request between hosts. Both are domain-level concerns.

**Steps, in order:**

1. **Decide the production domain.** Everything below depends on it, and the
   `SITE_URL` environment variable needs it too — the blog generator currently
   falls back to the `.vercel.app` preview URL, which means canonicals, RSS
   links and schema `@id`s are all pointing at a preview.

2. **Point `everestpersonaltraining.com` DNS at Vercel** and add it to this
   project.

3. **Set the domain to redirect** in Vercel's domain settings: choose
   "Redirect to" and select the production domain, with "Preserve path"
   enabled. That issues a 308 for every request, and the path rules in
   `vercel.json` then run against the destination.

4. **Keep the old domain registered and pointed for at least twelve months.**
   Redirect equity transfers over months, not days, and any backlink still
   aimed at the old domain dies the moment it stops resolving.

5. **Verify both domains in Google Search Console** and submit a change of
   address from the old property to the new one. This is the signal Google
   actually acts on; the redirects alone are slower.

6. **Re-crawl and check.** Every row in the table above should return a single
   301 or 308 straight to its destination. Redirect chains leak authority, so
   there should be no intermediate hops.

## One thing to check before switching off

WooCommerce was installed on the old site. If anyone holds an account, an
active subscription or store credit there, `/my-account/` disappearing will
strand them. Confirm the store is empty, or contact those customers, before
the DNS moves.

---

# Taking control of the domain

Added 7 September 2026, after Shrike Marketing (Byron Locke) gave notice that
he is closing all hosting accounts.

## What the registry actually says

Checked against Verisign RDAP on 7 September 2026 — not from the host's email.

| Field | Value |
|---|---|
| Registrar of record | **Tucows Domains Inc.** (Xneelo is a reseller on top) |
| Registered | 6 October 2021 |
| **Expires** | **6 October 2026** |
| Status | `clientTransferProhibited`, `clientUpdateProhibited` — **locked** |
| Nameservers | ns1/ns2.dns-h.com, ns1/ns2.host-h.net (Xneelo) |

The host's email says the domain renews on 2 September 2026. That is wrong.
The registry says 6 October 2026, which matches the attached PDF. Work to the
6 October date.

The site and mail were still live on 7 September 2026 (HTTP 200 from Apache at
41.204.202.43, MX still pointed at Xneelo) even though the notice set a
shutdown date of 15 July 2026. That is goodwill, not a guarantee.

## Current DNS zone

Captured 7 September 2026 via 8.8.8.8. Every record below must exist at the
new DNS provider *before* the nameservers are changed, or the site and email
go dark at the moment of the switch.

```
@      A     41.204.202.43            TTL 7200
www    A     41.204.202.43
mail   A     41.204.202.43
smtp   CNAME mail.everestpersonaltraining.com
@      MX    mail.everestpersonaltraining.com
@      TXT   v=spf1 mx a include:spf.host-h.net ?all
@      TXT   google-site-verification=KLpA2sQqXV1rOe8hyptU5q6UbY_jpci3yPSaB73aukw
```

No AAAA, no DMARC, no autodiscover, no webmail host.

That `google-site-verification` record means a Search Console property already
exists on this domain, verified by someone. If it is Byron's, a change of
address cannot be submitted from it. Verify a property under Jared's own
Google account as soon as DNS is controllable.

## Mail settings, from the credentials PDF

Nothing secret in the file — no password. Setup values only:

```
User        jared@everestpersonaltraining.com
Incoming    mail.everestpersonaltraining.com   IMAP 993 / POP 995
Outgoing    smtp.everestpersonaltraining.com   SMTP 465 (auth required)
SSL/TLS     on
```

This mailbox dies with the hosting account.

## Order of operations

1. **Download the backup today.** `public_html.zip` from the OneDrive link and
   the SQL dump. Both live on the host's personal storage and vanish when he
   is finished with the account.
2. **Settle the account.** He will not approve a transfer until it is paid.
3. **Move the WHOIS registrant email off this domain.** Ask for it to be set
   to a mailbox that is not hosted on `everestpersonaltraining.com` — the
   transfer approval email is sent there, and depending on a mailbox that dies
   with the hosting is how domains get lost.
4. **Ask for the unlock and the EPP/auth code**, in writing, in the same
   message as (3).
5. **Start the transfer at a registrar under Jared's own control.** A transfer
   adds a year to the expiry, so doing it now also handles the 6 October
   renewal. Do not leave it past mid-September: registrars refuse transfers
   close to expiry.
6. **Recreate the zone above at the new DNS provider, pointed at the existing
   Xneelo IP,** before changing nameservers. Nothing about the old site
   changes; it just stops depending on Xneelo's DNS.
7. Then, and only then, the migration steps in the section above.

## Why the transfer itself carries no SEO risk

Google does not read WHOIS for ranking, and does not care who the registrar
is. Rankings are lost to downtime, to URLs changing without redirects, and to
content disappearing — not to a change of registrar. Keep the site answering
on the same URLs throughout and the transfer is invisible to search.
