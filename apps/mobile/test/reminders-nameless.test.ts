/**
 * A book made without a name (NX-31-R3, #701): the reminder planner and the reminder prime ask must never
 * put an empty name, a stray apostrophe-s or a double space into words a parent reads. Fixtures: the
 * fictional family Asha only (CLAUDE.md).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { en } from '@scribe/content';
import { renderTemplate } from '@scribe/core';
import { childLabel } from '../src/lib/copy';
import { DEFAULT_PREFS, planReminders, type PlannerChild } from '../src/lib/reminders/planner';
import { parseIsoDate, zonedToEpoch } from '../src/lib/reminders/tz';

const LA = 'America/Los_Angeles';
const NOW = zonedToEpoch({ ...parseIsoDate('2026-10-05')!, hh: 12, mm: 0 }, LA);
const FALLBACK = en.onboarding.childFallback;

const plan = (children: PlannerChild[], namesOnLockScreen: boolean) =>
  planReminders({
    now: NOW,
    timeZone: LA,
    children,
    lastSaveAt: null,
    lastForegroundAt: null,
    prefs: { ...DEFAULT_PREFS, enabled: true, namesOnLockScreen },
  });

const words = (children: PlannerChild[], on: boolean) => plan(children, on).map((n) => `${n.title} | ${n.body}`);
// 3 months old on 2026-10-05: the month note is due in the horizon.
const nameless = (name: string): PlannerChild => ({ id: 'child-asha', name, birthday: '2026-03-08', included: true });

describe('[NX-31-R3] the reminder planner with a nameless child', () => {
  for (const name of ['', '   ']) {
    for (const on of [true, false]) {
      it(`[NX-31-R3] name ${JSON.stringify(name)}, names on lock screen ${on}: plans reminders and no empty-name artifacts`, () => {
        const out = words([nameless(name)], on);
        expect(out.length).toBeGreaterThan(0);
        for (const line of out) {
          expect(line).not.toMatch(/\{child\}|undefined|null/);
          expect(line).not.toMatch(/\s{2,}/);
          expect(line).not.toMatch(/(^|\s)'s\b/);
          expect(line).not.toMatch(/^\s*[,.]/);
        }
      });
    }
  }

  it('[NX-31-R3] with names on, a nameless child is never named in an evening nudge: the neutral variant is used', () => {
    const named = plan([nameless('')], true).filter((n) => n.kind !== 'monthAge' && n.kind !== 'birthday');
    expect(named.length).toBeGreaterThan(0);
    for (const n of named) expect(`${n.title} ${n.body}`).not.toContain(FALLBACK);
  });

  it('[NX-31-R3] a month note for a nameless child has no hole where the name would be', () => {
    const month = plan([nameless('')], true).filter((n) => n.kind === 'monthAge');
    expect(month.length).toBeGreaterThan(0);
    for (const n of month) expect(`${n.title} ${n.body}`).not.toMatch(/\s{2,}|\{child\}|\bfor\s*[.,]/);
  });

  it('[NX-31-R3] a named child is unchanged: Asha is still named when names are on', () => {
    const out = words([{ ...nameless('Asha') }], true).join(' ');
    expect(out).toContain('Asha');
  });

  it('[NX-31-R3] two children, one nameless: the month note names both, the nameless one as "your child"', () => {
    const asha: PlannerChild = { id: 'child-asha', name: 'Asha', birthday: '2026-03-08', included: true };
    const other: PlannerChild = { id: 'child-two', name: '', birthday: '2026-03-08', included: true };
    const month = plan([asha, other], true).filter((n) => n.kind === 'monthAge');
    expect(month.length).toBeGreaterThan(0);
    for (const n of month) expect(n.body).toContain(`Asha and ${FALLBACK}`);
  });
});

describe('[NX-31-R3] the reminder prime ask with a nameless child', () => {
  const body = en.onboarding.reminder.body;
  it('[NX-31-R3] childLabel gives "your child" for an empty, blank, null or missing name, and keeps a real name', () => {
    for (const n of ['', '   ', null, undefined]) expect(childLabel(n)).toBe(FALLBACK);
    expect(childLabel('Asha')).toBe('Asha');
  });
  it('[NX-31-R3] the ask body filled with the label has no placeholder left and no double space', () => {
    for (const n of ['', 'Asha']) {
      const text = renderTemplate(body, { child: childLabel(n) });
      expect(text).not.toMatch(/\{child\}|\s{2,}/);
      expect(text).toContain(n || FALLBACK);
    }
  });
  it('[NX-31-R3] the component fills the body through childLabel, not the raw name (source check; there is no renderer)', () => {
    const src = readFileSync(join(__dirname, '..', 'src', 'components', 'asks', 'reminder-prime-ask.tsx'), 'utf8');
    expect(src).toMatch(/renderTemplate\(r\.body,\s*\{\s*child:\s*childLabel\(getActiveChild\(\)\?\.name\)\s*\}\)/);
  });
});
