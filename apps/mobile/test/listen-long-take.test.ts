/// <reference types="node" />
/**
 * BL-432: a take that reaches 30 minutes gets one calm line on Listen. Nothing stops and nothing is cut. The pure rule
 * runs here; the screen's use of it is checked in its source (Node cannot load React Native). The 60-minute memory run
 * on an iPhone SE 3 is a device check (docs/qa/evidence), not something this file can show.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { copy } from '../src/lib/copy';
import { LONG_TAKE_MS, longTakeNotice } from '../src/components/capture/listen.logic';

const MIN = 60_000;

describe('BL-432 the long-take line', () => {
  it('is 30 minutes', () => {
    expect(LONG_TAKE_MS).toBe(30 * MIN);
  });

  it('shows at 30 minutes, while recording or paused', () => {
    expect(longTakeNotice('recording', 30 * MIN)).toBe(true);
    expect(longTakeNotice('paused', 30 * MIN)).toBe(true);
    expect(longTakeNotice('recording', 60 * MIN)).toBe(true);
  });

  it('does not show before 30 minutes', () => {
    expect(longTakeNotice('recording', 30 * MIN - 1)).toBe(false);
    expect(longTakeNotice('recording', 0)).toBe(false);
  });

  it('does not show in any other room, or on a bad clock', () => {
    for (const phase of ['ready', 'asking', 'finishing', 'denied', 'busy', 'full', 'primer'] as const) {
      expect(longTakeNotice(phase, 45 * MIN)).toBe(false);
    }
    expect(longTakeNotice('recording', Number.NaN)).toBe(false);
    expect(longTakeNotice('recording', Number.POSITIVE_INFINITY)).toBe(false);
  });

  it('the line is calm, plain and has no banned characters', () => {
    const line = copy.tonight.states.longTake;
    expect(line.length).toBeGreaterThan(0);
    expect(line).not.toMatch(/[–—…“”‘’]/u);
    expect(line).not.toMatch(/\p{Extended_Pictographic}/u);
    expect(line).not.toMatch(/!|stop|limit|too long|warning|lose|lost|running out/i);
  });

  it('Listen draws it, and never ends the take on its own', () => {
    const src = readFileSync(join(__dirname, '../src/app/listen.tsx'), 'utf8');
    expect(src).toContain('longTakeNotice(phase, status.durationMillis)');
    expect(src).toContain('t.longTake');
    expect(src).not.toMatch(/LONG_TAKE_MS/); // the screen only reads the rule; it holds no cap of its own
  });
});
