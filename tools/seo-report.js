#!/usr/bin/env node
/* Weekly SEO and AEO audit of the live site.

   Run by .github/workflows/seo-report.yml every Monday, and on demand from the
   Actions tab. It fetches the deployed site - not the repo - because what
   matters is what a crawler actually receives after the build has run.

   Usage:
     node tools/seo-report.js                     audits the production URL
     SITE_AUDIT_URL=https://... node tools/seo-report.js

   Exit code 1 if anything in ERRORS is found, so the workflow goes red and
   GitHub emails whoever owns the repo. Warnings do not fail the run. */
'use strict';

const BASE = (process.env.SITE_AUDIT_URL || 'https://everest-personal-training-sooty.vercel.app').replace(/\/+$/, '');

const errors = [];
const warnings = [];
const notes = [];
const err = (page, msg) => errors.push({ page, msg });
const warn = (page, msg) => warnings.push({ page, msg });

/* One flaky URL must not take the whole report down, and "fetch failed" with
   no URL is useless at 6am on a Monday. Retry once, then say which URL. */
async function get(url, attempt = 0) {
  try {
    const res = await fetch(url, { redirect: 'follow', headers: { 'user-agent': 'Everest-SEO-Audit' } });
    return { status: res.status, url: res.url, body: await res.text(), headers: res.headers };
  } catch (e) {
    if (attempt === 0) {
      await new Promise(r => setTimeout(r, 1500));
      return get(url, 1);
    }
    throw new Error(`could not fetch ${url}: ${e.message}${e.cause ? ' (' + (e.cause.code || e.cause.message) + ')' : ''}`);
  }
}

const tag = (html, re) => { const m = html.match(re); return m ? m[1].trim() : null; };
const decode = s => (s || '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'");

async function auditPage(path) {
  const url = BASE + path;
  const r = await get(url);
  if (r.status !== 200) { err(path, `returned HTTP ${r.status}`); return null; }
  const h = r.body;

  const title = decode(tag(h, /<title>([\s\S]*?)<\/title>/i) || '');
  const desc = decode(tag(h, /<meta\s+name="description"\s+content="([\s\S]*?)"/i) || '');
  const canonical = tag(h, /<link\s+rel="canonical"\s+href="([^"]*)"/i);
  const robots = tag(h, /<meta\s+name="robots"\s+content="([^"]*)"/i);
  const ogImage = tag(h, /<meta\s+property="og:image"\s+content="([^"]*)"/i);
  const ogUrl = tag(h, /<meta\s+property="og:url"\s+content="([^"]*)"/i);
  const h1s = (h.match(/<h1[\s>]/gi) || []).length;
  const ld = [...h.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)];
  const text = h.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ');
  const words = (text.match(/\b[\w'-]+\b/g) || []).length;

  if (!title) err(path, 'no <title>');
  else if (title.length > 62) warn(path, `title is ${title.length} chars, Google truncates near 60`);
  if (!desc) err(path, 'no meta description');
  else if (desc.length > 160 || desc.length < 70) warn(path, `meta description is ${desc.length} chars, aim for 70-160`);

  if (!canonical) err(path, 'no canonical');
  else if (!/^https?:\/\//i.test(canonical)) err(path, `canonical is relative (${canonical})`);
  else if (canonical.replace(/\/$/, '') !== url.replace(/\/$/, '')) warn(path, `canonical points elsewhere: ${canonical}`);

  if (ogImage && !/^https?:\/\//i.test(ogImage)) err(path, 'og:image is relative, so link previews will not render it');
  if (!ogUrl) warn(path, 'no og:url');
  if (h1s === 0) err(path, 'no <h1>');
  else if (h1s > 1) warn(path, `${h1s} <h1> elements`);

  if (!ld.length) warn(path, 'no JSON-LD structured data');
  for (const m of ld) {
    try { JSON.parse(m[1]); } catch (e) { err(path, 'JSON-LD does not parse: ' + e.message); }
  }

  if (words < 120) warn(path, `only ${words} words of visible text`);

  // The whole point of the self-hosting work: nothing third-party should load.
  const thirdParty = [...h.matchAll(/(?:src|href)="(https?:\/\/[^"]+)"/gi)]
    .map(m => m[1])
    .filter(u => !u.startsWith(BASE))
    .filter(u => !/schema\.org|\.w3\.org|privacy\.org\.nz|google\.com\/maps|trainerize\.me|busybumbles|eightysix\.digital/.test(u));
  if (thirdParty.length) warn(path, `loads ${thirdParty.length} third-party asset(s): ${[...new Set(thirdParty)].slice(0, 3).join(', ')}`);

  const imgsNoAlt = (h.match(/<img(?![^>]*\balt=)[^>]*>/gi) || []).length;
  if (imgsNoAlt) err(path, `${imgsNoAlt} <img> without an alt attribute`);

  return { path, title, desc, canonical, robots, words, ld: ld.length };
}

(async () => {
  console.log(`# SEO and AEO audit\n\n**Site:** ${BASE}  \n**Run:** ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC\n`);

  /* ---- robots.txt and indexing state ---- */
  const robotsTxt = await get(BASE + '/robots.txt');
  const blocked = /Disallow:\s*\/\s*$/m.test(robotsTxt.body);
  notes.push(blocked
    ? 'robots.txt still blocks all crawlers. Correct before launch, wrong after: set SITE_URL on the Vercel production environment to flip it.'
    : 'robots.txt allows crawling.');
  if (!blocked && !/Sitemap:/i.test(robotsTxt.body)) err('/robots.txt', 'allows crawling but names no sitemap');

  /* ---- sitemap ---- */
  const sm = await get(BASE + '/sitemap.xml');
  const locs = [...sm.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
  if (!locs.length) err('/sitemap.xml', 'no URLs');
  const blogInSitemap = locs.filter(u => /\/blog\/.+/.test(u)).length;
  notes.push(`sitemap lists ${locs.length} URLs, ${blogInSitemap} of them blog posts.`);
  for (const l of locs) if (!l.startsWith(BASE)) err('/sitemap.xml', `URL points at another host: ${l}`);

  /* ---- llms.txt, the answer-engine file ---- */
  const llms = await get(BASE + '/llms.txt');
  if (llms.status !== 200) err('/llms.txt', `returned HTTP ${llms.status}`);
  else {
    if (!/## Pages/.test(llms.body)) err('/llms.txt', 'has no Pages section');
    if (blogInSitemap && !/## Articles/.test(llms.body)) warn('/llms.txt', 'lists no Articles while the blog has posts');
    notes.push(`llms.txt is ${(llms.body.length / 1024).toFixed(1)} KB.`);
  }

  /* ---- a 404 must actually be a 404 ---- */
  const missing = await fetch(BASE + '/this-url-should-not-exist-audit/', { redirect: 'follow' });
  const missingBody = await missing.text();
  if (missing.status !== 404) err('/404', `an unknown URL returned HTTP ${missing.status}, not 404 (soft 404)`);
  if (!/got away on us/.test(missingBody)) warn('/404', 'unknown URLs do not serve the branded 404 page');

  /* ---- every page in the sitemap ---- */
  const results = [];
  for (const loc of locs) {
    const path = (() => { try { return new URL(loc).pathname; } catch (e) { return loc.replace(BASE, '') || '/'; } })();
    try {
      results.push(await auditPage(path));
    } catch (e) {
      err(path, e.message);          // record it and keep auditing the rest
      results.push(null);
    }
    await new Promise(r => setTimeout(r, 120));   // be polite to the host
  }
  const ok = results.filter(Boolean);

  /* ---- blog freshness: a stale blog reads as an abandoned site ---- */
  const posts = ok.filter(r => r.path.startsWith('/blog/') && r.path !== '/blog/');
  const dates = [...sm.body.matchAll(/<loc>[^<]*\/blog\/[^<]+<\/loc>\s*<lastmod>([^<]+)<\/lastmod>/g)].map(m => m[1]).sort();
  if (dates.length) {
    const newest = dates[dates.length - 1];
    const days = Math.round((Date.now() - Date.parse(newest)) / 86400000);
    notes.push(`newest blog post is dated ${newest} (${days} days ago).`);
    if (days > 90) warn('/blog/', `nothing published for ${days} days`);
  }

  /* ---- report ---- */
  console.log(`**Pages audited:** ${ok.length}  \n**Errors:** ${errors.length}  \n**Warnings:** ${warnings.length}\n`);
  console.log('## Notes\n');
  for (const n of notes) console.log(`- ${n}`);

  if (errors.length) {
    console.log('\n## Errors\n');
    for (const e of errors) console.log(`- **${e.page}** — ${e.msg}`);
  }
  if (warnings.length) {
    console.log('\n## Warnings\n');
    for (const w of warnings) console.log(`- **${w.page}** — ${w.msg}`);
  }

  console.log('\n## Pages\n');
  console.log('| Page | Title | Title len | Desc len | Words | JSON-LD |');
  console.log('|---|---|---:|---:|---:|---:|');
  for (const r of ok) {
    console.log(`| ${r.path} | ${r.title.slice(0, 40).replace(/\|/g, '')} | ${r.title.length} | ${r.desc.length} | ${r.words} | ${r.ld} |`);
  }

  if (errors.length) {
    console.error(`\nAudit failed with ${errors.length} error(s).`);
    process.exit(1);
  }
})().catch(e => { console.error('Audit could not run: ' + e.message); process.exit(1); });
