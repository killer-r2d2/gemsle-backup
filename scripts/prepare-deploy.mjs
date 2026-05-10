// Splits .output/public/ into two staging folders for Docker layer reuse:
//   .deploy/heavy/  → gallery + thumbs (rarely change)
//   .deploy/site/   → everything else (HTML, JS, fonts, payloads)
import fs from 'node:fs';
import path from 'node:path';

const ROOT = import.meta.dirname;
const APP = path.resolve(ROOT, '..');
const SRC = path.join(APP, '.output', 'public');
const HEAVY = path.join(APP, '.deploy', 'heavy');
const SITE = path.join(APP, '.deploy', 'site');

fs.rmSync(path.join(APP, '.deploy'), { recursive: true, force: true });
fs.mkdirSync(HEAVY, { recursive: true });
fs.mkdirSync(SITE, { recursive: true });

const HEAVY_DIRS = new Set(['gallery', 'thumbs']);

// Hardlink the gallery/thumbs into .deploy/heavy (instant, no extra disk).
function linkDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const f of fs.readdirSync(src)) {
    const s = path.join(src, f);
    const d = path.join(dest, f);
    const stat = fs.statSync(s);
    if (stat.isDirectory()) {
      linkDir(s, d);
    } else {
      try { fs.linkSync(s, d); } catch { fs.copyFileSync(s, d); }
    }
  }
}

for (const dir of HEAVY_DIRS) {
  const s = path.join(SRC, dir);
  if (fs.existsSync(s)) linkDir(s, path.join(HEAVY, dir));
}

// Copy everything else into .deploy/site/
function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const f of fs.readdirSync(src)) {
    if (HEAVY_DIRS.has(f) && src === SRC) continue;
    const s = path.join(src, f);
    const d = path.join(dest, f);
    const stat = fs.statSync(s);
    if (stat.isDirectory()) {
      copyDir(s, d);
    } else {
      try { fs.linkSync(s, d); } catch { fs.copyFileSync(s, d); }
    }
  }
}
copyDir(SRC, SITE);

// Stats
function size(p) {
  let n = 0;
  for (const f of fs.readdirSync(p)) {
    const s = path.join(p, f);
    const st = fs.statSync(s);
    n += st.isDirectory() ? size(s) : st.size;
  }
  return n;
}
const fmt = (b) => (b / 1024 / 1024).toFixed(1) + ' MB';
console.log(`heavy: ${fmt(size(HEAVY))}`);
console.log(`site:  ${fmt(size(SITE))}`);
