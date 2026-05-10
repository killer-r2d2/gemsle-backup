// Bootstrap script: reads data/{pages,menu,canonical}.json (one-time extracts
// from the legacy WebSite-X5 site) and emits Markdown files into content/
// with YAML frontmatter for Nuxt Content. After the first run, content/ is the
// canonical source of truth — re-run only when re-importing legacy data.
import fs from 'node:fs';
import path from 'node:path';
import TurndownService from 'turndown';

const ROOT = import.meta.dirname;
const APP = path.resolve(ROOT, '..');
const DATA = path.join(APP, 'data');
const CONTENT = path.join(APP, 'content');
fs.rmSync(CONTENT, { recursive: true, force: true });
fs.mkdirSync(CONTENT, { recursive: true });

const pages = JSON.parse(fs.readFileSync(path.join(DATA, 'pages.json'), 'utf8'));
const menu = JSON.parse(fs.readFileSync(path.join(DATA, 'menu.json'), 'utf8'));
const canonical = new Set(
  JSON.parse(fs.readFileSync(path.join(DATA, 'canonical.json'), 'utf8'))
    .map((u) => u.replace(/\.html$/, ''))
);

// Build slug → trail of menu labels (e.g. ["Motorrad-Reisen", "München Bangkok 2025", "Berichte"])
function flatten(items, trail = []) {
  const out = [];
  for (const it of items) {
    const t = [...trail, it.label];
    if (it.href) out.push({ href: it.href, trail: t });
    if (it.children?.length) out.push(...flatten(it.children, t));
  }
  return out;
}
const flat = flatten(menu);
const trailBy = new Map();
const orderBy = new Map();
flat.forEach((f, i) => {
  const slug = f.href.replace(/\.html$/, '');
  if (!trailBy.has(slug)) {
    trailBy.set(slug, f.trail);
    orderBy.set(slug, i);
  }
});

const turndown = new TurndownService({
  headingStyle: 'atx',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
  emDelimiter: '_',
  hr: '---'
});
turndown.remove(['script', 'style']);
// Drop X5 wrapper attributes — they're already stripped from text blocks but keep guard
turndown.addRule('keepLineBreaks', {
  filter: 'br',
  replacement: () => '  \n'
});

function htmlToMd(html) {
  if (!html) return '';
  return turndown
    .turndown(html)
    .replace(/ /g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function yaml(value) {
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    return '\n' + value.map((v) => `  - ${yamlInline(v)}`).join('\n');
  }
  return yamlInline(value);
}
function yamlInline(v) {
  if (v === null || v === undefined) return '';
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (typeof v === 'object') {
    return '{ ' + Object.entries(v).map(([k, vv]) => `${k}: ${yamlInline(vv)}`).join(', ') + ' }';
  }
  // String — quote if it contains special chars
  const s = String(v);
  if (/[:#\-?@&*!|>'"%`\[\]{},]/.test(s) || /^\s|\s$/.test(s) || s === '') {
    return JSON.stringify(s);
  }
  return s;
}

function frontmatter(obj) {
  const lines = ['---'];
  for (const [k, v] of Object.entries(obj)) {
    if (v === null || v === undefined || (Array.isArray(v) && !v.length)) continue;
    lines.push(`${k}:${Array.isArray(v) || (typeof v === 'object' && !Array.isArray(v)) ? '' : ' '}${yaml(v)}`);
  }
  lines.push('---', '');
  return lines.join('\n');
}

let written = 0;
const summary = { canonical: 0, orphan: 0, withGallery: 0, totalImages: 0 };

// Sanitize legacy X5 slugs ("woche-1-23.04.---27.04.") into URL-friendly form
// ("woche-1-23-04-27-04"). The original is kept in `legacy_slug` so we can
// register redirects later when this app replaces gemsle.ch.
function sanitizeSlug(s) {
  let out = s
    .toLowerCase()
    .replace(/\./g, '-')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return out || s;
}

const slugMap = new Map(); // legacy → new
for (const p of pages) {
  let s = sanitizeSlug(p.slug);
  // Disambiguate accidental collisions
  if (slugMap.has(s) && [...slugMap.values()].includes(s)) {
    let n = 2;
    while ([...slugMap.values()].includes(`${s}-${n}`)) n++;
    s = `${s}-${n}`;
  }
  slugMap.set(p.slug, s);
}

for (const p of pages) {
  const trail = trailBy.get(p.slug) || [];
  const section = trail[0] || null;
  const trip = trail.length > 1 ? trail[1] : null;
  const order = orderBy.get(p.slug) ?? 9999;
  const isCanonical = canonical.has(p.slug);
  const newSlug = slugMap.get(p.slug);

  const md = p.textBlocks.map(htmlToMd).filter(Boolean).join('\n\n');

  const fm = {
    title: p.title || p.slug,
    description: p.description || '',
    slug: newSlug,
    legacy_slug: p.slug,
    canonical: isCanonical,
    section,
    trip,
    breadcrumb: trail,
    order,
    gallery: p.images,
    entries: p.entries
  };

  const filename = `${newSlug}.md`;
  const out = frontmatter(fm) + md + '\n';
  fs.writeFileSync(path.join(CONTENT, filename), out);

  written++;
  if (isCanonical) summary.canonical++; else summary.orphan++;
  if (p.images.length) summary.withGallery++;
  summary.totalImages += p.images.length;
}

// Rewrite menu hrefs to point at the sanitized slugs
function rewriteMenu(items) {
  return items.map((it) => {
    const out = { ...it };
    if (it.href) {
      const legacy = it.href.replace(/\.html$/, '');
      const newSlug = slugMap.get(legacy);
      if (newSlug) out.href = `${newSlug}.html`;
    }
    if (it.children?.length) out.children = rewriteMenu(it.children);
    return out;
  });
}
const rewrittenMenu = rewriteMenu(menu);

// Also write menu.json into a place we can statically import from components.
const ASSETS = path.join(APP, 'app', 'assets');
fs.mkdirSync(ASSETS, { recursive: true });
fs.writeFileSync(path.join(ASSETS, 'menu.json'), JSON.stringify(rewrittenMenu, null, 2));
fs.writeFileSync(path.join(ASSETS, 'slug-map.json'), JSON.stringify(Object.fromEntries(slugMap), null, 2));

console.log(`Wrote ${written} markdown files to content/`);
console.log(`  canonical: ${summary.canonical}`);
console.log(`  orphan:    ${summary.orphan}`);
console.log(`  with gallery: ${summary.withGallery}`);
console.log(`  total images referenced: ${summary.totalImages}`);
