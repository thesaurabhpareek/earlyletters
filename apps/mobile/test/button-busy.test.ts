/**
 * A busy Button reaches VoiceOver as busy, not as dimmed (COMPONENTS 2.1; EXPERIENCE_PASS S52: "a provider tap puts
 * that button in its busy state"; #310 review B3). Button hands Pressable what components/ui/button.logic.ts says;
 * Pressable then merges its own `disabled` prop over accessibilityState (RN 0.86.3). This test applies that same merge,
 * pinned to React Native's source, so the final state is the one VoiceOver gets.
 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { pressableState } from '../src/components/ui/button.logic';

const require = createRequire(import.meta.url);
const PRESSABLE = readFileSync(require.resolve('react-native/Libraries/Components/Pressable/Pressable.js'), 'utf8');

/** Pressable.js 0.86.3, lines 227 to 236: its own `disabled` prop wins over accessibilityState.disabled when set. */
function pressableMerge(disabled: boolean | null | undefined, accessibilityState: Record<string, unknown>) {
  return disabled != null ? { ...accessibilityState, disabled } : accessibilityState;
}

const final = (disabled: boolean | undefined, loading: boolean | undefined) => {
  const s = pressableState(disabled, loading);
  return pressableMerge(s.disabled, s.accessibilityState);
};

describe('[S52] [COMPONENTS 2.1] a busy button is busy, not disabled, for VoiceOver', () => {
  it('the merge this test applies is the one React Native ships', () => {
    expect(PRESSABLE).toMatch(/disabled != null \? \{\.\.\._accessibilityState, disabled\} : _accessibilityState/);
  });

  it('loading: the final state is busy, and not disabled', () => {
    const s = final(undefined, true);
    expect(s.busy).toBe(true);
    expect(s.disabled).not.toBe(true);
    // And it ignores presses while busy, without telling VoiceOver it is dimmed.
    expect(pressableState(undefined, true).pressable).toBe(false);
  });

  it('a busy button that was also disabled by its caller still keeps the busy word', () => {
    expect(pressableState(false, true)).toMatchObject({ disabled: false, pressable: false });
    expect(final(false, true)).toMatchObject({ busy: true, disabled: false });
  });

  it('disabled: dimmed, not busy, and not pressable', () => {
    expect(final(true, false)).toMatchObject({ disabled: true, busy: false });
    expect(pressableState(true, false).pressable).toBe(false);
  });

  it('ready: pressable, neither dimmed nor busy', () => {
    expect(final(false, false)).toMatchObject({ disabled: false, busy: false });
    expect(pressableState(false, false).pressable).toBe(true);
  });

  it('Button passes only the real disabled to Pressable and guards the press itself', () => {
    const src = readFileSync(join(__dirname, '..', 'src', 'components', 'ui', 'button.tsx'), 'utf8');
    const button = src.slice(src.indexOf('function Button('), src.indexOf('export type IconButtonProps'));
    expect(button).toMatch(/const state = pressableState\(disabled, loading, accessibilityState\)/);
    expect(button).toMatch(/disabled=\{state\.disabled\}/);
    expect(button).toMatch(/accessibilityState=\{state\.accessibilityState\}/);
    expect(button).toMatch(/onPress=\{\(e\) => \{\s*if \(!inactive\) onPress\?\.\(e\);\s*\}\}/);
    expect(button).not.toMatch(/disabled=\{inactive\}/);
  });
});
