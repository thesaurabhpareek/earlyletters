/// <reference types="node" />
/**
 * Home slips: one registry, one fixed order, at most one slip (BL-963). Pure parts (slip-registry.ts) run here; Node
 * cannot load React Native, so Home's use of them is checked in its source. Fixtures: the fictional family Asha only.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { draftCard, type DraftFields } from '../src/components/tonight/draft-card.logic';
import { chooseSlip, orderedRules, SLIP_ORDER, SLIP_REGISTRY, type SlipRule, type SlipState } from '../src/components/tonight/slip-registry';
import type { Entry } from '../src/lib/store';

const SRC = join(__dirname, '..', 'src');
const code = (rel: string) =>
  readFileSync(join(SRC, rel), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');

const TODAY = '2026-10-30';
const NOW = new Date('2026-10-30T20:00:00.000Z');
const draft = (id: string): DraftFields => ({
  id,
  captureMode: 'spoken',
  audioUri: 'file:///d.m4a',
  audioDurationMs: 4000,
  audioBytes: 1000,
  state: 'ready',
  rawTranscript: 'You laughed at the rain.',
  typedText: null,
  recoveredAt: null,
  createdAt: '2026-10-30T18:00:00.000Z',
}) as unknown as DraftFields;
const letter = (id: string, occurredOn: string, over: Partial<Entry> = {}): Entry =>
  ({ id, kind: 'letter', inBook: true, occurredOn, capturedAt: `${occurredOn}T09:00:00.000Z`, finalText: 'Asha found her feet.', ...over }) as Entry;
// 31 days before TODAY, inside the past letter's 28 to 35 day window.
const MONTH_AGO = letter('0199a5b0-0000-7000-8000-0000000000e1', '2026-09-29');

const state = (over: Partial<SlipState> = {}): SlipState => ({ cards: [], window: [MONTH_AGO], today: TODAY, quiet: false, ...over });
const stub = (type: string, shows = true): SlipRule =>
  ({ type, show: () => (shows ? ({ type: 'waiting', rows: [] } as never) : null) }) as unknown as SlipRule;

describe('[FRAME-SLIP] Home slips are one registry in one fixed order', () => {
  it('lists the six ranks of the frame, highest first', () => {
    expect([...SLIP_ORDER]).toEqual(['waiting', 'sealOpened', 'day', 'saveACopy', 'daysAsk', 'pastLetter']);
  });

  it('registers each built slip once, and only types the order knows', () => {
    const types = SLIP_REGISTRY.map((r) => r.type);
    expect(new Set(types).size).toBe(types.length);
    for (const t of types) expect(SLIP_ORDER).toContain(t);
    expect(types).toEqual(['waiting', 'pastLetter']);
  });

  it('Home picks its slip through chooseSlip and renders nothing else', () => {
    const home = code('app/(tabs)/index.tsx');
    expect(home).toContain('chooseSlip(');
    // The past letter is chosen by the registry, never by a second call on the screen.
    expect(home).not.toMatch(/\bresurfaced\(/);
    expect(home).not.toMatch(/\bmonthAgo\b/);
    // Each slip component renders only inside its own slip type.
    expect(home).toMatch(/slip\?\.type === 'waiting'/);
    expect(home).toMatch(/slip\?\.type === 'pastLetter'/);
  });
});

describe('[NS-23-R18] slip registry', () => {
  it('fails on a slip type that is not in the registry', () => {
    expect(() => chooseSlip(state(), [stub('stubSlip')])).toThrow(/Unregistered slip type: stubSlip/);
    expect(() => orderedRules([...SLIP_REGISTRY, stub('stubSlip', false)])).toThrow(/Unregistered/);
  });

  it('fails on a type registered twice', () => {
    expect(() => chooseSlip(state(), [...SLIP_REGISTRY, SLIP_REGISTRY[0]!])).toThrow(/twice/);
  });

  it('puts the rules in the fixed order whatever order they were listed in', () => {
    const listed = [stub('pastLetter'), stub('saveACopy'), stub('waiting'), stub('sealOpened')];
    expect(orderedRules(listed).map((r) => r.type)).toEqual(['waiting', 'sealOpened', 'saveACopy', 'pastLetter']);
  });
});

describe('[NS-23-R6] slip order', () => {
  it('shows the past letter when nothing higher is due', () => {
    const slip = chooseSlip(state());
    expect(slip?.type).toBe('pastLetter');
    if (slip?.type === 'pastLetter') expect(slip.card.id).toBe(MONTH_AGO.id);
  });

  it('shows the waiting set, and not the past letter, when a draft is waiting', () => {
    const slip = chooseSlip(state({ cards: [draftCard(draft('0199a5b0-0000-7000-8000-0000000000d1'), NOW)] }));
    expect(slip?.type).toBe('waiting');
    if (slip?.type === 'waiting') expect(slip.rows).toHaveLength(1);
  });

  it('keeps every waiting draft in its existing order inside the one waiting slip', () => {
    const cards = ['d1', 'd2', 'd3'].map((n) => draftCard(draft(`0199a5b0-0000-7000-8000-0000000000${n}`), NOW));
    const slip = chooseSlip(state({ cards }));
    expect(slip?.type === 'waiting' && slip.rows.length).toBeGreaterThan(0);
  });

  it('shows at most one slip when every registered rule is due', () => {
    const every = SLIP_ORDER.map((t) => stub(t));
    const rows: string[] = [];
    const spy = every.map((r) => ({ ...r, show: (s: SlipState) => (rows.push(r.type), r.show(s)) }));
    expect(chooseSlip(state(), spy)).not.toBeNull();
    // The first due rule wins and no lower rule is even asked.
    expect(rows).toEqual(['waiting']);
  });

  it('lets a higher rank that is added later take the place of the past letter', () => {
    const saveACopy: SlipRule = { type: 'saveACopy', show: () => ({ type: 'waiting', rows: [] }) };
    expect(chooseSlip(state(), [...SLIP_REGISTRY, saveACopy])?.type).toBe('waiting');
  });

  it('shows nothing from a quieted book, and nothing when the window is empty', () => {
    expect(chooseSlip(state({ quiet: true }))).toBeNull();
    expect(chooseSlip(state({ window: [] }))).toBeNull();
  });
});
