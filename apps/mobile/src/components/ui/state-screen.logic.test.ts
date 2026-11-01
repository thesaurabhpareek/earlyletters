/**
 * The one pattern for loading, empty, error and not-found states (QA journey critique "_journey":
 * six treatments). The rules live in state-screen.logic.ts; state-screen.tsx draws them.
 */
import { describe, expect, it } from 'vitest';
import { LINE_ART_NAMES as ART_NAMES } from './line-art.data';
import { tokens } from '@scribe/design-tokens';
import { STATE_LAYOUT, STATE_SPEC, actionLayout, stateA11y, stateVisual, type StateKind } from './state-screen.logic';

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

describe('one layout for every whole-screen state (EXPERIENCE_PASS S13, S23, S37, S49)', () => {
  it('a centred block with 20 pt gutters, the title in title2 and the sentence in body', () => {
    expect(STATE_LAYOUT.gutter).toBe(20);
    expect(STATE_LAYOUT.gutter).toBe(tokens.space[5]);
    expect(STATE_LAYOUT.align).toBe('center');
    expect(STATE_LAYOUT.title).toBe('title2');
    expect(STATE_LAYOUT.body).toBe('body');
  });

  it('the glyph slot is a 72 pt soft circle holding a 40 pt Light glyph', () => {
    expect(STATE_LAYOUT.glyph).toEqual({ circle: 72, size: 40, weight: 'light' });
    expect(STATE_LAYOUT.glyph.circle).toBeGreaterThanOrEqual(tokens.target.min);
  });

  it("the screen's own drawing wins, then a glyph, then a line drawing (the kind's default when none is named)", () => {
    expect(stateVisual('error', { drawing: {}, glyph: {}, art: 'page' }).slot).toBe('drawing');
    expect(stateVisual('error', { glyph: {}, art: 'page' }).slot).toBe('glyph');
    expect(stateVisual('notFound', { art: 'window' })).toMatchObject({ slot: 'art', art: 'window' });
    for (const k of KINDS) expect(stateVisual(k).art).toBe(STATE_SPEC[k].art);
  });

  it('in the hard moments nothing moves: only a loading drawing breathes, and no state draws its line on', () => {
    for (const k of KINDS) {
      expect(stateVisual(k).drawsOn, k).toBe(false);
      expect(stateVisual(k).breathes, k).toBe(k === 'loading');
      expect(stateVisual(k, { glyph: {} }).breathes, k).toBe(false);
    }
  });

  it('every drawing a state can name exists, including the ported window and moon', () => {
    for (const name of ['window', 'moon', 'page', 'envelope'] as const) expect(ART_NAMES).toContain(name);
  });
});
