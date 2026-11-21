/// <reference types="node" />
/**
 * The toast at the largest text sizes (NS-33-R4; docs/design/specs/NS-33-ACCESSIBILITY-FLOOR-20nov.md 5.1 and 5.4, on #867).
 * At AX5 on an SE 3 the words had a 101 pt column beside Undo (162 pt) and Close (44 pt), so "Letter" (156 pt) and
 * "deleted." (206 pt) split mid-word on the Book after a delete. From AX1 up the words now take the full width and
 * Undo and Close sit under them, at the end. Below AX1 nothing changes. No new words. The behaviour (announced once,
 * no timer while there is an action, swipe, replace) is unchanged and stays tested in test/toast.test.ts.
 *
 * Node cannot load React Native, so the rule runs here and the component's use of it is read from its source, as
 * test/write-footer-large-text.test.ts does. What the toast measures on an SE 3 is the phone's to say (X1).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { FONT_SCALE } from '../src/lib/a11y.logic';
import { toastLayout } from '../src/components/ui/toast.logic';

/** toast.tsx without comments. */
const src = readFileSync(join(__dirname, '..', 'src', 'components', 'ui', 'toast.tsx'), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
  .replace(/(^|[^:])\/\/.*$/gm, '$1');

describe('[NS-33-R4] the toast stacks at accessibility sizes', () => {
  it('the rule: one row below AX1; stacked at AX1, AX3 and AX5', () => {
    for (const [name, scale] of Object.entries(FONT_SCALE)) {
      expect(toastLayout(scale), name).toBe(name.startsWith('ax') ? 'stacked' : 'row');
    }
  });

  it('the toast reads the live font scale through the rule', () => {
    expect(src).toMatch(/const stacked = toastLayout\(useFontScale\(\)\) === 'stacked';/);
  });

  it('stacked, the words are never squeezed beside the buttons, and Undo and Close sit in their own row at the end', () => {
    // The words grow (flex-1) only in the one-row form.
    expect(src).toMatch(/<Text variant="callout" tone="inverse" className=\{stacked \? 'py-1' : 'flex-1 py-1'\}>/);
    // The box is a row only below accessibility sizes.
    expect(src).toMatch(/className=\{stacked \? 'min-h-14 gap-1 [^']*' : 'min-h-14 flex-row items-center gap-2 [^']*'\}/);
    expect(src).toMatch(/\{stacked \? <View className="flex-row flex-wrap items-center justify-end gap-2">\{controls\}<\/View> : controls\}/);
  });

  it('VoiceOver order is the same in both forms: the words, then Undo, then Close', () => {
    const words = src.indexOf('{message}');
    const controlsAt = src.indexOf('{stacked ? <View', words);
    expect(words, 'words').toBeGreaterThan(-1);
    expect(controlsAt, 'controls after the words').toBeGreaterThan(words);
    const controls = src.slice(src.indexOf('const controls = ('), src.indexOf('return (', src.indexOf('const controls = (')));
    expect(controls.indexOf('label={action.label}'), 'Undo').toBeGreaterThan(-1);
    expect(controls.indexOf('icon={XIcon}'), 'Close after Undo').toBeGreaterThan(controls.indexOf('label={action.label}'));
  });
});
