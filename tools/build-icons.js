#!/usr/bin/env node
/* Builds css/icons.css from the SVGs in tools/icons-src/.

   The site used to load @tabler/icons-webfont from a CDN: 207 KB of CSS plus a
   491 KB font file, on every page, from a third party, to draw the handful of
   icons this site uses. These are the same icons, inlined as CSS masks, in
   about 33 KB with no third-party request.

   To add an icon:
     1. download the outline SVG, e.g.
        https://cdn.jsdelivr.net/npm/@tabler/icons@3.47.0/icons/outline/<name>.svg
     2. save it into tools/icons-src/ as <name>.svg
     3. run: node tools/build-icons.js
     4. use it in markup exactly as before:
        <i class="ti ti-<name>" aria-hidden="true"></i>

   Icons are decorative here, so they carry aria-hidden and the surrounding
   text does the talking. Keep it that way: a mask has no alt text. */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(__dirname, 'icons-src');
const OUT = path.join(ROOT, 'css', 'icons.css');
const VERSION = '3.47.0';

/* Turn one Tabler outline SVG into a CSS mask data URI.
   - the first path is a transparent 24x24 bounding box: bytes for nothing
   - stroke="currentColor" means nothing inside a mask, which is its own
     document, so it becomes black and the mask takes its alpha from that
   - attributes move to single quotes so the whole thing fits inside url("") */
function toDataUri(svg) {
  const s = svg
    .replace(/<path\s+stroke="none"[^>]*\/>/g, '')
    .replace(/\sclass="[^"]*"/g, '')
    .replace(/stroke="currentColor"/g, "stroke='#000'")
    .replace(/"/g, "'")
    .replace(/\s+/g, ' ')
    .replace(/>\s+</g, '><')
    .trim();
  if (!/^<svg/.test(s) || !/<\/svg>$/.test(s)) throw new Error('unexpected svg shape');
  if (/<script|onload=|xlink:/i.test(s)) throw new Error('svg contains unexpected content');
  return s.replace(/%/g, '%25').replace(/</g, '%3C').replace(/>/g, '%3E').replace(/#/g, '%23');
}

const licence = fs.readFileSync(path.join(SRC, 'LICENSE'), 'utf8').trim();
const names = fs.readdirSync(SRC).filter(f => f.endsWith('.svg')).map(f => f.replace(/\.svg$/, '')).sort();
if (!names.length) throw new Error('no SVGs in tools/icons-src/');

const rules = names.map(n =>
  `.ti-${n} { --ti: url("data:image/svg+xml,${toDataUri(fs.readFileSync(path.join(SRC, n + '.svg'), 'utf8'))}"); background-color: currentColor; }`);

const css = `/* Everest icon set — ${names.length} Tabler icons, inlined as CSS masks.
   GENERATED FILE. Edit tools/icons-src/ and run: node tools/build-icons.js

   Markup is unchanged from the webfont it replaces:
   <i class="ti ti-arrow-right" aria-hidden="true"></i>

   The mask takes its colour from currentColor, so icons inherit text colour,
   and sizing follows font-size because the box is 1em.

   Everything sits inside @supports: a browser without mask-image draws no icon
   rather than a solid square, and the layout is unchanged either way.

   Tabler Icons, version ${VERSION}, used under the MIT Licence:

${licence.split('\n').map(l => '   ' + l).join('\n')}
*/

.ti {
  display: inline-block;
  width: 1em;
  height: 1em;
  vertical-align: -0.125em;
  flex: none;
}

@supports ((-webkit-mask-image: none) or (mask-image: none)) {
  .ti {
    -webkit-mask: var(--ti, none) center / contain no-repeat;
            mask: var(--ti, none) center / contain no-repeat;
  }

${rules.join('\n')}
}
`;

fs.writeFileSync(OUT, css.replace(/\r?\n/g, '\r\n'));
console.log(`css/icons.css: ${names.length} icons, ${Math.round(css.length / 1024)} KB`);
