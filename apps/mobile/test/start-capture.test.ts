/// <reference types="node" />
/**
 * startCapture, the one capture entry (design spec 06 step 0; PRD 01 section 3). The plan per source is pure and run
 * here; the function that runs it (lib/capture/start-capture.ts) touches the router and the store, so its shape is read
 * as source text: the same order Home used before the consolidation, so a person sees no change.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CAPTURE_DOORWAYS, CAPTURE_ROUTES, CAPTURE_SOURCES, isCaptureDoorway, isCaptureSource, planCapture } from '../src/lib/capture/start-capture.logic';

/** Source without comments. */
const code = (t: string) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
const entry = code(readFileSync(join(__dirname, '..', 'src', 'lib', 'capture', 'start-capture.ts'), 'utf8'));
const prompt = { key: 'first_smile', libraryVersion: 3 };

describe('planCapture: what each source does, exactly as Home did before', () => {
  it('Speak opens Listen armed, Type opens Write, both carrying the prompt as route params', () => {
    expect(planCapture({ source: 'speak', prompt })).toEqual({ kind: 'route', pathname: '/listen', mode: 'spoken', armListen: true, params: { promptKey: 'first_smile', promptLibraryVersion: '3' } });
    expect(planCapture({ source: 'type', prompt })).toEqual({ kind: 'route', pathname: '/write', mode: 'typed', armListen: false, params: { promptKey: 'first_smile', promptLibraryVersion: '3' } });
    // Without a prompt the params are empty, never undefined keys.
    expect(planCapture({ source: 'speak' })).toMatchObject({ kind: 'route', pathname: '/listen', params: {} });
  });

  it('Not much today is a quiet-day mark, not a screen', () => {
    expect(planCapture({ source: 'notMuchToday' })).toEqual({ kind: 'quietDay' });
  });

  it('photo and the four doorways are reserved: planning them starts nothing', () => {
    for (const source of ['photo', ...CAPTURE_DOORWAYS] as const) expect(planCapture({ source })).toEqual({ kind: 'reserved', source });
  });

  it('the list is closed: the Home controls and the doorway names the PRD gives, in one order', () => {
    expect([...CAPTURE_SOURCES]).toEqual(['speak', 'type', 'notMuchToday', 'photo', 'widget', 'controlCenterControl', 'actionButton', 'siri']);
    expect([...CAPTURE_ROUTES]).toEqual(['/listen', '/write']);
    for (const s of CAPTURE_SOURCES) expect(isCaptureSource(s)).toBe(true);
    for (const s of ['tonight', 'photoFirst', 'dayCard', '', 1, null]) expect(isCaptureSource(s)).toBe(false);
    expect(CAPTURE_DOORWAYS.map(isCaptureDoorway)).toEqual([true, true, true, true]);
    expect(isCaptureDoorway('speak')).toBe(false);
  });
});

describe('startCapture runs the plan in the order Home did (source)', () => {
  it('a route: the opt-in event with the screen as its catalog source, the arming tap, then the push', () => {
    const route = entry.slice(entry.indexOf("case 'route':"), entry.indexOf("case 'quietDay':"));
    expect(route).toMatch(/trackCaptureStarted\(\{\s*mode: plan\.mode,\s*source: 'tonight',\s*promptKind: promptKindOf\(req\.prompt\?\.key\),\s*childIndex: childIndexOf\(getActiveChildId\(\)\),\s*role: 'parent',\s*\}\);/);
    expect(route.indexOf('trackCaptureStarted(')).toBeLessThan(route.indexOf('armListenStart()'));
    expect(route).toMatch(/if \(plan\.armListen\) armListenStart\(\);/);
    expect(route.indexOf('armListenStart()')).toBeLessThan(route.indexOf('router.push('));
    expect(route).toContain('router.push({ pathname: plan.pathname, params: plan.params });');
  });

  it('a quiet day: one mark a day with no words (D-084), kept only when none exists', () => {
    const quiet = entry.slice(entry.indexOf("case 'quietDay':"), entry.indexOf("case 'reserved':"));
    expect(quiet).toContain('const existing = markOn(listEntries(), day);');
    expect(quiet).toContain('const mark = existing ?? newQuietMark({ id: uuidv7(), occurredOn: day, capturedAt: new Date().toISOString() });');
    expect(quiet).toContain('if (!existing) saveEntry(mark);');
    // No words field is ever set: the mark is a date and nothing else.
    expect(quiet).not.toMatch(/typedText|finalText|rawTranscript|text:/);
  });

  it('a reserved source returns the plan and touches nothing', () => {
    const reserved = entry.slice(entry.indexOf("case 'reserved':"));
    expect(reserved).toMatch(/case 'reserved':\s*return plan;/);
    expect(reserved).not.toMatch(/router\.|saveEntry|track/);
  });
});
