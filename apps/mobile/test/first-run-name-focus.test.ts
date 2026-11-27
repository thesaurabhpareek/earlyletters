/// <reference types="node" />
/**
 * BL-2011, EXPERIENCE_PASS S05: a tap on the waiting Continue moves focus to what is missing. With servers off the date
 * block arrives with the first letter of the name (handoff.logic.ts dateBlockShown), so before a name is typed there is no
 * date control to focus and the name is what is missing. The nudge used to call the date control's ref while it was not
 * drawn, so nothing took focus (J01's name-step check). The screen is React Native, which Node cannot draw, so the wiring
 * is pinned in the source, as the other first-run tests do; J01 proves it on the web build. Fictional family Asha.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { dateBlockShown } from '../src/lib/first-run/handoff.logic';

const read = (rel: string) => readFileSync(join(__dirname, '..', 'src', rel), 'utf8');
/** Comments are not code. */
const code = (rel: string) => read(rel).replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

const onboarding = code('app/onboarding.tsx');
const nudge = onboarding.slice(onboarding.indexOf('const nudge = () => {'), onboarding.indexOf('const pinned ='));
const focusFirstName = onboarding.slice(onboarding.indexOf('const focusFirstName = () => {'), onboarding.indexOf('const nudge = () => {'));
const dateField = code('components/child/date-field.tsx');

describe('[BL-2011] S05: the waiting Continue moves focus to the name while the date block is not drawn', () => {
  it('servers off with no name typed, the date block is not drawn, so the date control has nothing to take focus', () => {
    expect(dateBlockShown({ dateShown: false, accountFirst: false })).toBe(false);
  });

  it('the nudge focuses the date control only when it is drawn (its ref is set), and the first name otherwise', () => {
    expect(nudge).toMatch(/else if \(dateField\.current\) dateField\.current\.focus\(\);\s*else focusFirstName\(\);/);
    // The ref is set only while the block is drawn: the DateField sits inside the dateBlockShown branch.
    expect(onboarding).toMatch(/\{dateBlockShown\(\{ dateShown, accountFirst \}\) \? \([\s\S]*?<DateField\s+ref=\{dateField\}[\s\S]*?\) : null\}/);
    // The old bare fall-through to the date ref is gone.
    expect(nudge).not.toMatch(/\n\s*else dateField\.current\?\.focus\(\);/);
    // Twins or more: an empty name still wins over the date, before either branch.
    expect(nudge.indexOf('if (missing >= 0) nameFields.current[missing]?.focus();')).toBeGreaterThan(-1);
    expect(nudge.indexOf('if (missing >= 0)')).toBeLessThan(nudge.indexOf('else focusFirstName();'));
  });

  it('the first name takes focus the way the date control does: keyboard focus on the web, VoiceOver focus on a phone', () => {
    // The date control's own split (date-field.tsx focus), which this matches.
    expect(dateField).toMatch(/focus: \(\) => \{\s*if \(Platform\.OS === 'web'\) \{\s*input\.current\?\.focus\?\.\(\);\s*return;\s*\}\s*focusControl\(\);/);
    expect(focusFirstName).toContain('nameFields.current[0]');
    expect(focusFirstName).toMatch(/if \(Platform\.OS === 'web'\) \{\s*field\.focus\(\);\s*return;\s*\}/);
    // On a phone: an accessibility focus event, never TextInput.focus(), so no keyboard rises under VoiceOver's focus.
    expect(focusFirstName).toMatch(/AccessibilityInfo\.sendAccessibilityEvent\([^;]*'focus'\)/);
    expect(focusFirstName.match(/field\.focus\(\)/g)).toHaveLength(1);
  });
});
