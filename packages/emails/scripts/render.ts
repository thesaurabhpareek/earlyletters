/**
 * Render every template to out/<name>.html and out/<name>.txt, plus the
 * gallery at out/index.html (375px light and forced-dark frames).
 *
 *   npm run build -w @scribe/emails                 # src/templates only
 *   npx tsx scripts/render.ts --fixtures            # also test/fixtures
 */
import { FIXTURES_DIR, OUT_DIR, TEMPLATES_DIR, buildAll, rel } from './lib';

const dirs = [TEMPLATES_DIR, ...(process.argv.includes('--fixtures') ? [FIXTURES_DIR] : [])];
const rendered = await buildAll({ dirs, outDir: OUT_DIR });

if (rendered.length === 0) {
  console.warn(`No templates found in ${dirs.map(rel).join(', ')}. Each needs a default export and PreviewProps.`);
}
for (const r of rendered) {
  console.log(`${r.name.padEnd(28)} ${(Buffer.byteLength(r.html) / 1024).toFixed(1).padStart(6)} KB  ${rel(r.file)}`);
}
console.log(`\n${rendered.length} email(s). Gallery: ${rel(OUT_DIR)}/index.html`);
