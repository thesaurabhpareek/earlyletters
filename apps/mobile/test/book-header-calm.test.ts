/// <reference types="node" />
/**
 * [BL-938] [NS-22] The Book header stays calm: no gear, and More for this book holds Quiet and Hide (R3, R6, R7).
 * Source-pinned where the page is React Native (book.tsx), logic-tested where it is pure (book-menu.logic.ts). The
 * rendered order and 44 pt targets are in test/component/book-header-calm.test.tsx. Fictional family Asha only.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { en } from '@scribe/content';
import { bookMenuHint, bookMenuRows, hideConfirm, saveFailedLine, toggleQuiet } from '@/components/book/book-menu.logic';

const SRC = join(__dirname, '..', 'src');
const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\{\s*\}/g, '{}').replace(/(^|[^:])\/\/.*$/gm, '$1');
const code = (rel: string) => strip(readFileSync(join(SRC, rel), 'utf8'));
const book = code('app/(tabs)/book.tsx');
const menu = code('components/book/book-menu.tsx');

describe('[BL-938] [NS-22-R3] quiet and hide in 2 taps', () => {
  it('the Book has no gear and pushes no Settings page, in the band or the bar', () => {
    expect(book).not.toMatch(/GearSix/);
    expect(book).not.toMatch(/['"]\/settings['"]/);
    expect(code('components/book/cover-band.tsx')).not.toMatch(/GearSix|settings/);
  });

  it('the end control opens the menu, in the band and in the inline bar', () => {
    expect(book).toMatch(/const more = \{ label: copy\.book\.menu\.label, hint: bookMenuHint\(children\.length\), onPress: \(\) => setMenuOpen\(true\) \};/);
    expect(book).toMatch(/<CoverBand[\s\S]*?more=\{more\}/);
    const bar = book.slice(book.indexOf('const topBar'), book.indexOf('return (\n    <View className="flex-1 bg-background"'));
    expect(bar).toMatch(/label=\{more\.label\}[^>]*onPress=\{more\.onPress\}[^>]*testID="book\.bar\.more"/);
    expect(bar).not.toMatch(/settings/);
    // The hint reaches VoiceOver through the IconButton (react-native-web drops it, so the pin is here).
    expect(code('components/book/cover-band.tsx')).toMatch(/label=\{more\.label\} accessibilityHint=\{more\.hint\}[^>]*testID="book\.more"/);
  });

  it('the menu is mounted outside the empty-book branch, so an empty book can be quieted or hidden too', () => {
    const branch = book.indexOf('{chapters.length === 0 ? (');
    const keyed = book.indexOf('</Animated.View>', book.indexOf('<MonthsSheet')); // the end of the keyed view around both branches
    expect(branch).toBeGreaterThan(-1);
    expect(book.indexOf('<BookMenu')).toBeGreaterThan(keyed);
    expect(book.match(/<BookMenu\b/g)).toHaveLength(1);
    expect(book).toMatch(/<BookMenu open=\{menuOpen\} child=\{active\} books=\{children\.length\} onClose=\{closeMenu\} \/>/);
  });

  it('one tap opens the menu, and its rows act on one more: Quiet with one book, Quiet then Hide with two', () => {
    expect(bookMenuRows({ quiet: false, books: 1 })).toEqual([{ id: 'quiet', label: 'Quiet this book' }]);
    expect(bookMenuRows({ quiet: false, books: 2 })).toEqual([
      { id: 'quiet', label: 'Quiet this book' },
      { id: 'hide', label: 'Hide this book' },
    ]);
    expect(menu).toMatch(/onPress=\{\(\) => act\(row\.id\)\}/);
    expect(menu).toMatch(/<Sheet open=\{open\} onClose=\{onClose\} title=\{copy\.book\.menu\.label\}/);
  });

  it('the hint promises Hide only when the menu holds it', () => {
    expect(bookMenuHint(1)).toBeUndefined();
    expect(bookMenuHint(2)).toBe(en.book.menu.labelA11y);
  });

  it('Hide asks Me\'s own confirm, and a tap on Hide this book hides this book', () => {
    expect(hideConfirm('Asha')).toEqual({
      title: 'Hide this book',
      body: en.children.settings.hideBody.replaceAll('{child}', 'Asha'),
      cancel: en.common.cancelButton,
      confirm: 'Hide this book',
    });
    expect(menu).toMatch(/Alert\.alert\(c\.title, c\.body, \[/);
    expect(menu).toMatch(/hideChild\(child\.id\);/);
  });

  it('the menu acts once per opening, closes before it acts, and closes when the app goes inactive', () => {
    expect(menu).toMatch(/const act = \(id: 'quiet' \| 'hide'\) => \{\s*if \(acted\.current\) return;\s*acted\.current = true;\s*onClose\(\);/);
    expect(menu).toMatch(/if \(open\) acted\.current = false;/);
    expect(menu).toMatch(/AppState\.addEventListener\('change', \(s\) => \{\s*if \(s !== 'active'\) onClose\(\);/);
  });
});

describe('[BL-938] [NS-22-R7] unquiet offered', () => {
  it('a quieted book offers Turn Quiet off in place of Quiet this book, and no other wording changes', () => {
    const quiet = bookMenuRows({ quiet: true, books: 2 });
    const loud = bookMenuRows({ quiet: false, books: 2 });
    expect(quiet[0]).toEqual({ id: 'quiet', label: en.children.quiet.offLabel });
    expect(quiet.slice(1)).toEqual(loud.slice(1));
    expect(bookMenuRows({ quiet: true, books: 1 })).toEqual([{ id: 'quiet', label: 'Turn Quiet off' }]);
  });

  it('turning Quiet on or off writes the opposite of the current state and says so in the built line', () => {
    const calls: [string, boolean][] = [];
    const set = (id: string, q: boolean) => void calls.push([id, q]);
    expect(toggleQuiet({ id: 'asha', name: 'Asha', quiet: false, set })).toEqual({ ok: true, message: "Asha's book is quiet for you." });
    expect(toggleQuiet({ id: 'asha', name: 'Asha', quiet: true, set })).toEqual({ ok: true, message: "Quiet is off for Asha's book." });
    expect(calls).toEqual([['asha', true], ['asha', false]]);
  });

  it('a failed write keeps the old state and says so in one line', () => {
    const r = toggleQuiet({ id: 'asha', name: 'Asha', quiet: false, set: () => { throw new Error('disk'); } });
    expect(r).toEqual({ ok: false, message: "That did not save, so Asha's book is as it was." });
    expect(saveFailedLine('Asha')).toBe(r.message);
  });

  it('the help line stays held back (BL-985): the menu does not mention it', () => {
    expect(`${menu}\n${code('components/book/book-menu.logic.ts')}`).not.toMatch(/quiet\.help\b/);
  });
});

describe('[BL-938] [NS-22-R6] settings still reachable', () => {
  it('Me is a tab and the /settings route still exists, so a deep link opens it', () => {
    expect(existsSync(join(SRC, 'app/(tabs)/you.tsx'))).toBe(true);
    expect(existsSync(join(SRC, 'app/settings/index.tsx'))).toBe(true);
    expect(code('app/(tabs)/_layout.tsx')).toMatch(/'you'/);
  });
});
