#!/usr/bin/env node
/* Build-time SEO/AEO pass. Runs after tools/build_blog.py (see vercel.json),
   so it can see the generated blog as well as the hand-written pages.

   It does five things:
     1. sitemap.xml   - every page, including the blog
     2. llms.txt      - the same set, for answer engines
     3. robots.txt    - allow or disallow, decided by environment
     4. per-page head - absolute canonical, og:url, robots, JSON-LD
     5. crawlable nav - real links inside the JS-injected footer placeholder

   Indexing is driven by one signal so it cannot be half-flipped: the site is
   indexable only on a Vercel *production* deployment that has SITE_URL set.
   Previews, local builds and a production build with no SITE_URL all stay
   noindex, because indexing a preview domain creates the duplicate that a
   migration is trying to avoid. SEO_INDEX=1/0 forces it either way. */
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const SITE_URL = (process.env.SITE_URL || 'https://everest-personal-training.vercel.app').replace(/\/+$/, '');
const SITE_NAME = 'Everest Personal Training';

const force = process.env.SEO_INDEX;
const INDEXABLE = force === '1' ? true
  : force === '0' ? false
  : (process.env.VERCEL_ENV === 'production' && !!process.env.SITE_URL);

const SKIP_DIRS = new Set(['.git', '.claude', '.github', 'node_modules', 'assets', 'css', 'js', 'data', 'tools', 'templates', 'content', 'docs', '.pydeps']);

/* ---------- page discovery ---------- */

function findPages(dir, depth) {
  let pages = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name) || entry.name.startsWith('.')) continue;
      if (depth < 3) pages = pages.concat(findPages(path.join(dir, entry.name), depth + 1));
    } else if (entry.name === 'index.html') {
      pages.push(path.join(dir, entry.name));
    }
  }
  return pages;
}

const decode = s => (s || '')
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>').replace(/&quot;/g, '"').trim();

/* Prefer the date the file was last committed over its mtime. On Vercel every
   file is checked out at build time, so mtime would stamp today on all of
   them - a sitemap that claims the whole site changed daily is a sitemap
   Google learns to ignore. If git is unavailable the field is dropped rather
   than guessed. */
function gitDate(file) {
  try {
    const out = execFileSync('git', ['log', '-1', '--format=%cs', '--', file], {
      cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore']
    }).trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(out) ? out : null;
  } catch (e) { return null; }
}

function meta(file) {
  const html = fs.readFileSync(file, 'utf8');
  const titleM = html.match(/<title>([\s\S]*?)<\/title>/i);
  const descM = html.match(/<meta\s+name="description"\s+content="([\s\S]*?)"/i);
  const rel = path.relative(ROOT, file).replace(/index\.html$/, '').replace(/\\/g, '/');
  const urlPath = '/' + rel;
  // Blog posts carry a real publication date in their BlogPosting schema.
  const pub = html.match(/"dateModified"\s*:\s*"(\d{4}-\d{2}-\d{2})/) ||
              html.match(/"datePublished"\s*:\s*"(\d{4}-\d{2}-\d{2})/);
  return {
    file,
    path: urlPath === '/' ? '/' : urlPath,
    url: SITE_URL + (urlPath === '/' ? '/' : urlPath),
    title: decode(titleM ? titleM[1] : SITE_NAME),
    description: decode(descM ? descM[1] : ''),
    lastmod: pub ? pub[1] : gitDate(file)
  };
}

function priority(p) {
  if (p === '/') return '1.0';
  if (['/personal-training/', '/programs/', '/elite/', '/empower/', '/organisations/'].includes(p)) return '0.9';
  if (['/impact/', '/about/', '/contact/', '/blog/'].includes(p)) return '0.8';
  if (p.startsWith('/blog/')) return '0.7';
  return '0.6';
}

const order = ['/', '/personal-training/', '/programs/', '/elite/', '/empower/', '/organisations/', '/impact/', '/about/', '/team/', '/contact/', '/blog/', '/legal/'];
const all = findPages(ROOT, 0).map(meta);

/* Tag pages are thin slices of posts that are already listed. They stay
   crawlable through links but out of the sitemap, where they would only
   dilute it. */
const pages = all
  .filter(p => !p.path.startsWith('/blog/tag/'))
  .sort((a, b) => {
    const ia = order.indexOf(a.path), ib = order.indexOf(b.path);
    if (ia !== -1 || ib !== -1) return (ia === -1 ? 98 : ia) - (ib === -1 ? 98 : ib);
    return a.path.localeCompare(b.path);
  });

const posts = pages.filter(p => p.path.startsWith('/blog/') && p.path !== '/blog/');

/* ---------- sitemap.xml ---------- */

const sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  pages.map(p =>
    '  <url>\n' +
    `    <loc>${p.url}</loc>\n` +
    (p.lastmod ? `    <lastmod>${p.lastmod}</lastmod>\n` : '') +
    `    <priority>${priority(p.path)}</priority>\n` +
    '  </url>'
  ).join('\n') + '\n</urlset>\n';
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), sitemap);

/* ---------- llms.txt ---------- */

const core = pages.filter(p => !p.path.startsWith('/blog/') || p.path === '/blog/');
const llms = `# ${SITE_NAME}\n\n` +
  `> Personal training, fitness and human performance coaching in Christchurch and across Canterbury, New Zealand. ` +
  `Online, in-person and hybrid coaching for everyday people, athletes, young people and organisations, including app-based programs, ` +
  `personalised coaching, youth development (EMPOWER), performance (Everest Elite) and corporate/workforce wellness.\n\n` +
  `## Pages\n\n` +
  core.map(p => `- [${p.title}](${p.url})${p.description ? ': ' + p.description : ''}`).join('\n') +
  (posts.length ? `\n\n## Articles\n\n` + posts.map(p => `- [${p.title}](${p.url})${p.description ? ': ' + p.description : ''}`).join('\n') : '') +
  `\n\n## Contact\n\n- Email: jared@everest-pt.com\n- Phone: +64 22 139 8969\n- Location: Christchurch, Canterbury, New Zealand\n`;
fs.writeFileSync(path.join(ROOT, 'llms.txt'), llms);

/* ---------- robots.txt ---------- */

const robots = INDEXABLE
  ? `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`
  : `# Not a production deployment - blocking crawlers so a preview URL never\n` +
    `# gets indexed as a duplicate of the live site.\nUser-agent: *\nDisallow: /\n`;
fs.writeFileSync(path.join(ROOT, 'robots.txt'), robots);

/* ---------- per-page head rewrite ---------- */

const ROBOTS_META = INDEXABLE
  ? '<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />'
  : '<meta name="robots" content="noindex, nofollow" />';

/* Emitted into the static HTML rather than injected by layout.js. Google
   renders JavaScript eventually; Bing and the answer-engine crawlers
   (GPTBot, ClaudeBot, PerplexityBot) largely do not, so JS-injected schema is
   invisible to exactly the systems this is meant to feed. */
function businessGraph() {
  return {
    '@type': ['Organization', 'LocalBusiness'],
    '@id': SITE_URL + '/#business',
    'name': SITE_NAME,
    'slogan': 'Movement recognised and funded as frontline prevention - for the body and the mind.',
    'description': 'Everest builds everyday capability through structured movement, and measures it honestly, so what works can be proven, repeated and scaled. Personal training, coaching and human performance programmes in Christchurch and across Canterbury, New Zealand, with online coaching worldwide, for individuals, athletes, young people and organisations.',
    'url': SITE_URL + '/',
    'logo': SITE_URL + '/assets/img/everest-logo-v4.svg',
    'image': SITE_URL + '/assets/img/og-default.jpg',
    'email': 'jared@everest-pt.com',
    'telephone': '+64221398969',
    'areaServed': [
      { '@type': 'City', 'name': 'Christchurch' },
      { '@type': 'AdministrativeArea', 'name': 'Canterbury' },
      { '@type': 'Country', 'name': 'New Zealand' },
      { '@type': 'Place', 'name': 'Worldwide (online coaching)' }
    ],
    'address': { '@type': 'PostalAddress', 'addressLocality': 'Christchurch', 'addressRegion': 'Canterbury', 'addressCountry': 'NZ' }
  };
}

function breadcrumb(p) {
  const parts = p.split('/').filter(Boolean);
  if (!parts.length) return null;
  const items = [{ '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': SITE_URL + '/' }];
  let acc = '';
  parts.forEach((seg, i) => {
    acc += '/' + seg;
    items.push({
      '@type': 'ListItem', 'position': i + 2,
      'name': seg.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      'item': SITE_URL + acc + '/'
    });
  });
  return { '@type': 'BreadcrumbList', 'itemListElement': items };
}

function siteSchema(p) {
  const graph = [businessGraph(), {
    '@type': 'WebSite', '@id': SITE_URL + '/#website',
    'url': SITE_URL + '/', 'name': SITE_NAME,
    'publisher': { '@id': SITE_URL + '/#business' }
  }];
  const bc = breadcrumb(p);
  if (bc) graph.push(bc);
  return '<script type="application/ld+json" data-everest-schema>' +
    JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }) + '</script>';
}

/* The header and footer are injected by layout.js, which means a crawler that
   does not run JavaScript sees a page with no links out of it. Seeding the
   footer placeholder with the real links gives those crawlers the link graph;
   layout.js replaces the whole element, so a visitor never sees both. */
const CRAWL_NAV = '<nav class="pre-nav" aria-label="Site">' +
  [['/', 'Home'], ['/personal-training/', 'Personal Training'], ['/programs/', 'Programs &amp; pricing'],
   ['/elite/', 'Everest Elite'], ['/organisations/', 'Organisations'], ['/empower/', 'EMPOWER'],
   ['/about/', 'About'], ['/impact/', 'Impact'], ['/team/', 'Team'], ['/blog/', 'Blog'],
   ['/contact/', 'Contact'], ['/legal/', 'Legal']]
    .map(([h, l]) => `<a href="${h}">${l}</a>`).join('') +
  '</nav>';

/* The rewrite edits the page files in place. That is correct on Vercel, where
   the checkout is thrown away after the build, and wrong on a developer's
   machine, where it would leave absolute preview URLs staged for commit. So
   it only runs on Vercel unless explicitly asked for. */
const REWRITE = process.env.SEO_REWRITE === '1' || !!process.env.VERCEL;

let rewritten = 0;
for (const p of (REWRITE ? all : [])) {
  let html = fs.readFileSync(p.file, 'utf8');
  const before = html;

  // robots
  if (/<meta\s+name="robots"[^>]*>/i.test(html)) {
    html = html.replace(/<meta\s+name="robots"[^>]*>/i, ROBOTS_META);
  } else {
    html = html.replace(/<\/head>/i, '  ' + ROBOTS_META + '\n</head>');
  }

  // Absolute canonical, always rebuilt from the page's own path rather than
  // patched from whatever is in the file. Patching leaves a stale absolute
  // URL in place forever, which is exactly the wrong behaviour the first time
  // the production domain changes.
  const canon = `<link rel="canonical" href="${p.url}" />`;
  if (/<link\s+rel="canonical"[^>]*>/i.test(html)) {
    html = html.replace(/<link\s+rel="canonical"[^>]*>/i, canon);
  } else {
    html = html.replace(/<\/head>/i, '  ' + canon + '\n</head>');
  }

  // og:url, matching the canonical
  const og = `<meta property="og:url" content="${p.url}" />`;
  if (/<meta\s+property="og:url"[^>]*>/i.test(html)) {
    html = html.replace(/<meta\s+property="og:url"[^>]*>/i, og);
  } else if (/<meta\s+property="og:title"/i.test(html)) {
    html = html.replace(/(<meta\s+property="og:title"[^>]*>)/i, og + '\n  $1');
  }

  // og:image must be absolute - Facebook, LinkedIn and Slack all refuse to
  // resolve a relative one, so a relative path means no preview card at all.
  html = html.replace(/(<meta\s+property="og:image"\s+content=")(\/[^"]*)(")/i,
    (m, a, src, c) => a + SITE_URL + src + c);

  // site-wide JSON-LD, static. Blog pages carry their own graph from
  // build_blog.py, so they only get the business/website block if absent.
  if (!/data-everest-schema/.test(html) && !/"@type"\s*:\s*"BlogPosting"/.test(html)) {
    html = html.replace(/<\/head>/i, '  ' + siteSchema(p.path) + '\n</head>');
  }

  // crawlable footer links
  html = html.replace(/<div id="site-footer">\s*<\/div>/i, '<div id="site-footer">' + CRAWL_NAV + '</div>');

  if (html !== before) { fs.writeFileSync(p.file, html); rewritten++; }
}

console.log(
  `SEO pass: ${pages.length} urls in sitemap (${posts.length} blog posts), ` +
  `${rewritten} pages rewritten (rewrite=${REWRITE}), indexable=${INDEXABLE}, site=${SITE_URL}`
);
