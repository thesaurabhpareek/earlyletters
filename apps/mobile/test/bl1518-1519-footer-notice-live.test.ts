/**
 * [BL-1518] The Export not-encrypted notice is in the pinned footer, with the Share button, so a small screen sees it
 * without scrolling. [BL-1519] End of book: a named live region holds the moon and the line; the buttons stay outside.
 * Source scans, like test/a11y-ax5.test.ts. The VoiceOver check is a device step (not run here).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = join(__dirname, '..', 'src');
const code = (rel: string) => readFileSync(join(SRC, rel), 'utf8').replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

describe('[BL-1518] Export: the notice sits in the footer with Share', () => {
  const f = code('app/settings/export.tsx');
  const footer = f.slice(f.indexOf('const primary ='), f.indexOf('return (\n    <PinnedActionLayout'));
  const body = f.slice(f.indexOf('<PinnedActionLayout'));
  it('the notice is rendered inside the primary (the footer), before the Share button', () => {
    expect(footer).toMatch(/testID="export\.privacyNotice"[\s\S]*\{s\.privacyNotice\}[\s\S]*\{s\.shareButton\}/);
  });
  it('the notice is rendered once, and not in the scrolling content', () => {
    expect(f.match(/s\.privacyNotice/g)).toHaveLength(1);
    expect(body).not.toMatch(/s\.privacyNotice/);
  });
  it('the integrity note stays in the content', () => {
    expect(body).toMatch(/s\.integrityNote/);
  });
});

describe('[BL-1519] End of book: the live region is named and does not wrap the buttons', () => {
  const f = code('app/read-together.tsx');
  const end = f.slice(f.indexOf('function EndOfBook'));
  it('names the live region and puts the moon and the line in it', () => {
    expect(end).toMatch(/<View accessibilityLiveRegion="polite" className="gap-8" testID="readTogether\.end\.live">\s*<LineArt name="moon"[\s\S]*?\{rt\.endOfBook\}[\s\S]*?<\/View>/);
  });
  it('the buttons are not inside it', () => {
    const live = end.match(/<View accessibilityLiveRegion="polite"[\s\S]*?<\/View>\s*<\/PinnedActionLayout>/)![0];
    expect(live).not.toMatch(/<Button/);
  });
});
