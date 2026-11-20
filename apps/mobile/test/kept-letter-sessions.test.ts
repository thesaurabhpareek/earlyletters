/// <reference types="node" />
/**
 * NX-31-R14 and R29 (counter only): a session counts when it ends with a kept letter. The session is the existing ask
 * session (cold start, or back after ASK_SESSION_GAP_MS). The lock offer and the sequencer order are not built here.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createKeptSessionCounter, KEPT_SESSIONS_KEY, type SettingsPort } from '../src/lib/asks/kept-sessions';
import { ASK_SESSION_GAP_MS, sessionAfterForeground } from '../src/lib/asks/next-ask.logic';
import * as settings from '../src/lib/db/repos/settings';
import { fixture, type Fixture } from './helpers/store-fixture';

const memory = (): SettingsPort & { map: Map<string, string> } => {
  const map = new Map<string, string>();
  return { map, get: (k) => map.get(k) ?? null, set: (k, v) => void map.set(k, v) };
};
const MIN = 60 * 1000;

describe('[NX-31-R14] a session counts only when it ends with a kept letter', () => {
  it('[NX-31-R14] a session counts only when it ends with a kept letter', () => {
    const port = memory();
    const counter = createKeptSessionCounter(port);
    expect(counter.keptLetterSessions()).toBe(0);

    // Session 1: cold start at t0, a letter kept.
    let session = 1_000;
    expect(counter.noteLetterKept(session)).toBe(1);
    // Back after 10 minutes: the same session, a second letter adds nothing.
    session = sessionAfterForeground(session, 2_000, 2_000 + 10 * MIN);
    expect(counter.noteLetterKept(session)).toBe(1);

    // Back after 30 minutes: a new session, but nothing is kept in it (the counter is never called): not counted.
    session = sessionAfterForeground(session, 100_000_000, 100_000_000 + ASK_SESSION_GAP_MS);
    expect(counter.keptLetterSessions()).toBe(1);

    // Another 31 minutes away: a third session, one letter kept: the second counted session.
    session = sessionAfterForeground(session, 200_000_000, 200_000_000 + 31 * MIN);
    expect(counter.noteLetterKept(session)).toBe(2);
    expect(counter.noteLetterKept(session)).toBe(2);

    // A cold start later: the third counted session.
    expect(counter.noteLetterKept(300_000_000)).toBe(3);
    expect(counter.keptLetterSessions()).toBe(3);
  });

  it('[NX-31-R14] a session in which nothing was kept is not counted, and an empty phone counts 0', () => {
    const counter = createKeptSessionCounter(memory());
    sessionAfterForeground(1, 5, 5 + ASK_SESSION_GAP_MS); // sessions pass, no letter kept
    expect(counter.keptLetterSessions()).toBe(0);
  });

  it('[NX-31-R14] the count survives a restart and ignores a value that is not a number', () => {
    const port = memory();
    createKeptSessionCounter(port).noteLetterKept(1_000);
    expect(createKeptSessionCounter(port).keptLetterSessions()).toBe(1);
    port.map.set(KEPT_SESSIONS_KEY, 'oops');
    expect(createKeptSessionCounter(port).keptLetterSessions()).toBe(0);
    expect(createKeptSessionCounter(port).noteLetterKept(2_000)).toBe(1);
  });
});

describe('[NX-31-R14] the count is kept in the device settings, on the phone', () => {
  let f: Fixture;
  beforeEach(() => {
    f = fixture();
  });
  afterEach(() => f.close());

  it('[NX-31-R14] reads and writes the settings table, and a second counter on the same table agrees', () => {
    const port: SettingsPort = { get: (k) => settings.getSetting(f.ctx, k), set: (k, v) => settings.setSetting(f.ctx, k, v) };
    createKeptSessionCounter(port).noteLetterKept(10);
    createKeptSessionCounter(port).noteLetterKept(20);
    expect(settings.getSetting(f.ctx, KEPT_SESSIONS_KEY)).toBe('2');
    expect(createKeptSessionCounter(port).keptLetterSessions()).toBe(2);
  });
});

describe('[NX-31-R14] nothing leaves the phone', () => {
  const src = (p: string) => readFileSync(join(__dirname, '..', 'src', 'lib', 'asks', p), 'utf8');
  it('[NX-31-R14] the counter imports no analytics, network or logging, and every kept letter reaches it through askAfterSave', () => {
    const counter = src('kept-sessions.ts');
    expect(counter).not.toMatch(/^import /m);
    expect(counter).not.toMatch(/track\(|fetch\(|console\./);
    const index = src('index.ts');
    expect(index).toMatch(/keptSessions\.noteLetterKept\(session\)/);
    expect(index).toMatch(/export function keptLetterSessions\(\): number/);
    expect(index).not.toMatch(/track\(['"]\w*kept/i);
  });
});
