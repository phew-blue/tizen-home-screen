// Recolour vendored brand marks (assets/marks) to each brand's foreground colour -> ui/img/tiles/<key>.svg.
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const { BRANDS } = createRequire(import.meta.url)('../ui/js/brands.js');
const root = new URL('../', import.meta.url);

// Drop existing fill colours (keeping fill="none"), then set fg on the root <svg>.
export function recolor(svgText, fg) {
  const stripped = svgText
    .replace(/\sfill=(["'])(?!none\1)[^"']*\1/gi, '')
    .replace(/currentColor/g, fg);
  return stripped.replace(/<svg\b/, `<svg fill="${fg}"`).trim() + '\n';
}

export function build() {
  const outDir = new URL('ui/img/tiles/', root);
  mkdirSync(outDir, { recursive: true });
  const written = [];
  for (const key of Object.keys(BRANDS).sort()) {
    const b = BRANDS[key];
    if (!b.mark) { continue; }
    const src = readFileSync(new URL(`assets/marks/${b.mark}.svg`, root), 'utf8');
    writeFileSync(new URL(`${key}.svg`, outDir), recolor(src, b.fg));
    written.push(key);
  }
  return written;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log(`built ${build().length} tile marks`);
}
