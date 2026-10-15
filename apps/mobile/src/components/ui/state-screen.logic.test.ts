/**
 * The one pattern for loading, empty, error and not-found states (QA journey critique "_journey":
 * six treatments). The rules live in state-screen.logic.ts; state-screen.tsx draws them.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { STATE_SPEC, actionLayout, stateA11y, type StateKind } from './state-screen.logic';

/** line-art.tsx draws with react-native-svg, which Node cannot load: read the names from its source. */
const ART_NAMES = [...readFileSync(join(__dirname, 'line-art.tsx'), 'utf8').matchAll(/^  (\w+): \{\n    d: /gm)].map((m) => m[1]);

const KINDS: StateKind[] = ['empty', 'error', 'notFound', 'loading'];
const go = { label: 'Go', onPress: () => {} };
const other = { label: 'Other', onPress: () => {} };

describe('state spec', () => {
  it('every kind uses a drawing that exists', () => {
    expect(ART_NAMES.length).toBeGreaterThanOrEqual(5);
    for (const k of KINDS) expect(ART_NAMES).toContain(STATE_SPEC[k].art);
  });
  it('loading is busy and announced politely; it never carries a primary action', () => {
    expect(STATE_SPEC.loading).toMatchObject({ busy: true, live: 'polite', allowsPrimary: false });
    expect(stateA11y('loading')).toEqual({ accessibilityLiveRegion: 'polite', accessibilityState: { busy: true } });
  });
  it('error is announced politely, never assertively, and is not busy (a calm card, not an alarm)', () => {
    expect(stateA11y('error')).toEqual({ accessibilityLiveRegion: 'polite' });
    for (const k of KINDS) expect(JSON.stringify(stateA11y(k))).not.toContain('assertive');
  });
  it('empty and not-found are static: no announcement, no busy state', () => {
    expect(stateA11y('empty')).toEqual({});
    expect(stateA11y('notFound')).toEqual({});
  });
});

describe('actionLayout: one primary, the rest quiet', () => {
  it('a primary stays primary and other options are quiet', () => {
    expect(actionLayout('error', go, [other])).toEqual({ primary: go, quiet: [other] });
  });
  it('without a primary, the first option is promoted and the rest stay quiet', () => {
    expect(actionLayout('empty', undefined, [go, other])).toEqual({ primary: go, quiet: [other] });
  });
  it('no actions: nothing is drawn', () => {
    for (const k of KINDS) expect(actionLayout(k)).toEqual({ primary: null, quiet: [] });
  });
  it('loading may offer a way out, but only quietly', () => {
    expect(actionLayout('loading', go)).toEqual({ primary: null, quiet: [go] });
    expect(actionLayout('loading', go, [other])).toEqual({ primary: null, quiet: [go, other] });
  });
  it('there is never more than one primary', () => {
    for (const k of KINDS) expect(actionLayout(k, go, [other, other]).primary === null || actionLayout(k, go, [other, other]).primary === go).toBe(true);
  });
});
