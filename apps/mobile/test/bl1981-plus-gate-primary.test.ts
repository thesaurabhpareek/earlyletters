/**
 * [BL-1981] (refines BL-418, DESIGN_LANGUAGE bottom-action rule): each Plus gate has one primary action at 56 pt,
 * full width, pinned in a footer built from the PINNED_ACTION tokens, and no content-width primary mid-screen. The
 * Keep sheet's heading starts at the left edge and its wrap is balanced. Layout only: no word changed. Source scans,
 * like bl418-keep-close-headings.test.ts and plus-confirmed.test.ts.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { tokens } from '@scribe/design-tokens';
import { PINNED_ACTION } from '../src/components/ui/pinned-action.logic';

const SRC = join(__dirname, '..', 'src');
const code = (rel: string) =>
  readFileSync(join(SRC, rel), 'utf8').replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

describe('[BL-1981] the purchase-confirmed screen pins one 56 pt, full-width primary', () => {
  const f = code('app/plus/confirmed.tsx');
  it('Done is the lg (56 pt) full-width primary in the pinned bar, outside the scroll', () => {
    expect(f).toMatch(/<Button size="lg" fullWidth label=\{c\.done\} onPress=\{done\} testID="plusConfirmed\.done" \/>/);
    expect(f.indexOf('plusConfirmed.done"')).toBeGreaterThan(f.indexOf('</ScrollView>'));
    expect(code('components/ui/button.tsx')).toMatch(/lg: tokens\.target\.primary/);
    expect(PINNED_ACTION.minHeight).toBe(tokens.target.primary);
  });
  it('the bar is made of the PINNED_ACTION tokens, not literal padding classes', () => {
    expect(f).toMatch(/paddingHorizontal: PINNED_ACTION\.gutter, paddingTop: PINNED_ACTION\.top, paddingBottom: PINNED_ACTION\.bottom/);
    expect(f).not.toMatch(/className="px-5 pb-3 pt-2"/);
  });
  it('the content-width buttons above it are not primaries', () => {
    expect(f).not.toMatch(/<Button (?![^>]*variant=)[^>]*saveCopy/);
    expect(f).toMatch(/variant="secondary" label=\{c\.saveCopy\}/);
  });
});

describe('[BL-1981] the Keep sheet has one primary and a balanced, start-aligned heading', () => {
  const g = code('components/child/plus-gate.tsx');
  it('See Plus is the lg full-width primary; Keep it here for now is the primary only when See Plus is not offered', () => {
    expect(g).toMatch(/<Button key="seePlus" size="lg" fullWidth label=\{k\.seePlus\}/);
    expect(g).toMatch(/size=\{view\.canOpenStore \? 'md' : 'lg'\} variant=\{view\.canOpenStore \? 'quiet' : 'primary'\} fullWidth/);
  });
  it('the title is a start-aligned title1 heading rendered through the last-two-words join', () => {
    expect(g).toContain("import { joinLastTwoWords } from '@/components/onboarding/finale-title.logic';");
    expect(g).toMatch(/<Text key="title" ref=\{title\} variant="title1" asHeading>\s*\{joinLastTwoWords\(fill\(k\.title, \{ child: childName \}\)\)\}/);
    expect(g).not.toMatch(/key="title"[^>]*text-center/);
  });
});
