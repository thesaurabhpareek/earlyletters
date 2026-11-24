/**
 * [BL-418] slice 3 (rulings E3 and E4): the Keep sheet has a visible Close in its header, and the BL-418 screens
 * start-align their headings and sentences (pictures stay centred). Source scans, like test/a11y-ax5.test.ts.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = join(__dirname, '..', 'src');
const code = (rel: string) =>
  readFileSync(join(SRC, rel), 'utf8').replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

describe('[BL-418][E3] the Keep sheet has a visible way out in its header', () => {
  const gate = code('components/child/plus-gate.tsx');
  it('draws the shared ModalHeader (the word Close, 44 pt) above the scroll, wired to onDismiss', () => {
    expect(gate).toMatch(/import \{ ModalHeader \} from '@\/components\/ui\/screen-header';/);
    expect(gate).toMatch(/\{onDismiss \? <ModalHeader onClose=\{onDismiss\} \/> : null\}\s*<ScrollView ref=\{scroll\}/);
  });
  it('adds no word of its own: the label is the shared Close', () => {
    expect(gate).not.toMatch(/closeLabel=/);
  });
});

describe('[BL-418][E4] headings and sentences start-align; pictures stay centred', () => {
  it('End of book: the heading is not centred, the moon stays centred', () => {
    const f = code('app/read-together.tsx');
    expect(f).toMatch(/<Text variant="title1" asHeading>\s*\{rt\.endOfBook\}/);
    expect(f).toMatch(/<LineArt name="moon"[^>]*alignSelf: 'center'/);
  });
  it('Book empty: the cover is centred, the heading and body start-align', () => {
    const f = code('app/(tabs)/book.tsx');
    expect(f).toMatch(/<EmptyState align="start" title=\{joinLastTwoWords\(copy\.book\.empty\.bookTitle\)\}/);
    expect(f).toMatch(/contentContainerClassName="gap-8 px-5"/);
    expect(f).toMatch(/<View className="items-center">\s*<BookCover/);
  });
  it('Export: the waiting sentence starts, the cover stays centred', () => {
    const f = code('app/settings/export.tsx');
    expect(f).toMatch(/<Text variant="subhead" testID="export\.empty">/);
    expect(f).toMatch(/<View className="items-center pt-2" testID="export\.cover">/);
  });
});
