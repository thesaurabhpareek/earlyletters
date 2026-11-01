/**
 * The app bundle carries only what a screen uses. The licensed photo library (1.8 MB of JPEGs no screen
 * referenced) and the sound synthesizer moved from apps/mobile/assets to docs/brand/archive on 15 Oct 2026.
 * This keeps them out: no source, config or native module file may reference assets/photos or
 * assets/sounds, and neither folder may come back under apps/mobile/assets without a screen that uses it
 * (then delete the matching case here and record the file in the app).
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = path.resolve(__dirname, '..');
/** Generated or third-party trees, never part of the bundle's sources. */
const SKIP_DIRS = new Set(['node_modules', '.expo', '.results', '.web-dist', '.web-dist-seed', 'ios', 'android', '__golden__']);
/** Files Metro, Expo config or a native module could load an asset from. */
const SOURCE = /\.(ts|tsx|js|jsx|mjs|cjs|json|swift|kt|m|mm|plist|podspec|gradle)$/;

function walk(dir: string, out: string[] = []): string[] {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (SOURCE.test(e.name)) out.push(p);
  }
  return out;
}

const ARCHIVED = ['assets/photos', 'assets/sounds'] as const;

describe('app bundle assets: nothing ships that no screen uses', () => {
  const files = walk(ROOT).filter((f) => path.resolve(f) !== path.resolve(__filename));

  it('scans the sources, the Expo config and the native modules', () => {
    expect(files.some((f) => f.endsWith('app.config.ts'))).toBe(true);
    expect(files.some((f) => f.includes(`${path.sep}src${path.sep}`))).toBe(true);
    expect(files.some((f) => f.includes(`${path.sep}modules${path.sep}`))).toBe(true);
  });

  for (const folder of ARCHIVED) {
    it(`references no file under ${folder} (archived in docs/brand/archive)`, () => {
      const hits = files.filter((f) => fs.readFileSync(f, 'utf8').includes(folder)).map((f) => path.relative(ROOT, f));
      expect(hits).toEqual([]);
    });

    it(`has no ${folder} folder for Metro or EAS to pick up`, () => {
      expect(fs.existsSync(path.join(ROOT, folder))).toBe(false);
    });
  }

  it('every image file under assets/ is one app.config.ts names (icon, splash, favicon)', () => {
    const config = fs.readFileSync(path.join(ROOT, 'app.config.ts'), 'utf8');
    const images = walk(path.join(ROOT, 'assets'), []).concat(
      fs
        .readdirSync(path.join(ROOT, 'assets'), { recursive: true, withFileTypes: true })
        .filter((e) => e.isFile() && /\.(png|jpe?g|gif|webp|wav|m4a|mp3)$/i.test(e.name))
        .map((e) => path.join(e.parentPath, e.name)),
    );
    const unreferenced = images
      .map((f) => path.relative(ROOT, f).split(path.sep).join('/'))
      .filter((rel) => !config.includes(`./${rel}`));
    expect(unreferenced).toEqual([]);
  });
});
