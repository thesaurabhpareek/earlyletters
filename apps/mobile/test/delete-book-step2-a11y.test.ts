/// <reference types="node" />
/**
 * Delete this book, step 2 (the typed word) for VoiceOver (design-systems audit 9 Nov 2026, row 5; S1-133 (a)).
 * Continue swapped step 1 for step 2 under the same page title and the same heading text. Nothing moved focus, so
 * VoiceOver stayed on a button that was gone, and the dimmed "Delete the book" said nothing about what turns it on.
 *
 *   - when step 2 appears, accessibility focus moves to its title (useFocusOnMount, as account deletion's step 2 does);
 *   - until the typed word matches, the dimmed confirm carries a hint saying what turns it on: the line the field
 *     above it already shows ("Type delete to confirm"), so no new word; once it matches there is no hint.
 *
 * The hint rule is pure (components/settings/wipe.logic.ts confirmHint) and runs here. The screen is React Native, so its
 * use of the rule, the hook and its place above the early return are pinned in its source. That a phone really moves
 * focus and reads the title is S1-133 (a), on a device. Fictional family Asha.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { en } from '@scribe/content';
import { confirmHint, typedWordMatches } from '../src/components/settings/wipe.logic';

const SRC = join(__dirname, '..', 'src');
const code = (rel: string) => readFileSync(join(SRC, rel), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

const d = en.settings.delete;

describe('[S1-133 (a)] the disabled confirm says what turns it on', () => {
  it('until the typed word matches, the hint is the existing "Type delete to confirm"; once it matches there is none', () => {
    expect(confirmHint(false, d.bookTypeToConfirmLabel)).toBe('Type delete to confirm');
    expect(confirmHint(true, d.bookTypeToConfirmLabel)).toBeUndefined();
  });

  it('it follows the same rule as the button: ready exactly when the word is typed (any case, spaces ignored)', () => {
    for (const [typed, ready] of [['', false], ['delet', false], ['Asha', false], ['delete', true], [' Delete ', true]] as const) {
      expect(confirmHint(typedWordMatches(typed, d.bookTypeWord), d.bookTypeToConfirmLabel) === undefined, typed).toBe(ready);
    }
  });

  it('adds no new word: the hint is a string the screen already shows, and it names the word to type', () => {
    expect(d.bookTypeToConfirmLabel.toLowerCase()).toContain(d.bookTypeWord);
  });
});

describe('[S1-133 (a)] Delete this book, step 2: the screen uses them (source pins)', () => {
  const screen = code('app/settings/children/delete-book.tsx');

  it('moves focus to the step 2 title when step 2 appears, with the same hook account deletion uses', () => {
    expect(screen).toMatch(/import \{ useFocusOnMount, useTheme \} from '@\/lib\/a11y';/);
    expect(screen).toMatch(/const confirmTitle = useRef<RNText>\(null\);/);
    expect(screen).toMatch(/useFocusOnMount\(confirmTitle, step === 'confirm', step\);/);
    // The title it points at is step 2's heading: the one inside the confirm ScrollView, drawn as a heading.
    const confirmStep = screen.slice(screen.indexOf('key="confirm"'), screen.indexOf('key="review"'));
    expect(confirmStep).toMatch(/<Text ref=\{confirmTitle\} variant="title2" asHeading>\s*\{d\.bookTitle\}/);
    // Step 1 does not take focus.
    expect(screen.slice(screen.indexOf('key="review"'))).not.toMatch(/ref=\{confirmTitle\}/);
    // The same pattern as account deletion's step 2.
    expect(code('app/settings/delete-account.tsx')).toMatch(/useFocusOnMount\(confirmHeading, step === 'confirm', step\);/);
  });

  it('calls the hook above the early return, so the order of hooks never changes when a child is missing', () => {
    const hook = screen.indexOf('useFocusOnMount(confirmTitle');
    const early = screen.indexOf('if (!child || !localDeletionAllowed()) return null;');
    expect(hook).toBeGreaterThan(-1);
    expect(early).toBeGreaterThan(-1);
    expect(hook).toBeLessThan(early);
  });

  it('gives the disabled confirm the hint, from the existing string, and keeps its label, disabled state and press', () => {
    // Read inside the confirm button's own element, so the hint cannot pass on another button (Keep, Export, Continue).
    const confirmButton = screen.slice(0, screen.indexOf('testID="deleteBook.confirm"')).split('<Button').pop() ?? '';
    expect(confirmButton).toMatch(/accessibilityHint=\{confirmHint\(ready, d\.bookTypeToConfirmLabel\)\}/);
    expect(confirmButton).toMatch(/disabled=\{!ready\}/);
    expect(confirmButton).toMatch(/accessibilityLabel=\{d\.bookConfirm\}/);
    expect(confirmButton).toMatch(/onPress=\{confirm\}/);
    // Still no autoFocus on the field: it would take focus from the title.
    expect(screen).not.toMatch(/autoFocus/);
  });

  it('adds no copy to the screen and no announcement: the title is read because focus lands on it', () => {
    expect(screen).not.toMatch(/announce|announceForAccessibility/);
  });
});
