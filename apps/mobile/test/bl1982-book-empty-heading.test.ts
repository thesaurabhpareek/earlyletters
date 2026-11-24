/**
 * [BL-1982] (refines BL-418, DESIGN_LANGUAGE bottom-action rule and type ramp): the Book empty heading starts at the
 * left edge, in the shared title1 heading style, and its wrap is balanced so the last line is never one word. The
 * words are unchanged (packages/content); only the render joins the last gap. Source scans, like bl418-keep-close-headings.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { joinLastTwoWords } from '../src/components/onboarding/finale-title.logic';
import { copy } from '../src/lib/copy';

const SRC = join(__dirname, '..', 'src');
const code = (rel: string) =>
  readFileSync(join(SRC, rel), 'utf8').replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
const N = String.fromCharCode(0xa0);

describe('[BL-1982] Book empty heading is left-aligned and balanced', () => {
  it('renders the empty heading through the last-two-words join, start-aligned', () => {
    const f = code('app/(tabs)/book.tsx');
    expect(f).toContain("import { joinLastTwoWords } from '@/components/onboarding/finale-title.logic';");
    expect(f).toMatch(/<EmptyState align="start" title=\{joinLastTwoWords\(copy\.book\.empty\.bookTitle\)\}/);
  });
  it('the shared heading style is title1 as a heading and carries no centring when align is start', () => {
    const f = code('components/ui/empty-state.tsx');
    expect(f).toMatch(/<Text variant="title1" asHeading className=\{center \? 'text-center' : undefined\}>/);
  });
  it('the join keeps the last two words of the real heading together and changes no other character', () => {
    const t = copy.book.empty.bookTitle;
    const joined = joinLastTwoWords(t);
    expect(joined).not.toBe(t);
    expect(joined.replace(N, ' ')).toBe(t);
    expect(joined.split(N).length).toBe(2);
  });
});
