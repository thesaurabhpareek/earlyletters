/**
 * Helplines (struggling-page.md section 2; CCO-11; F20-REQ-003). Each line names the official page it was read from
 * and the day; a line past 90 days fails here, so support re-reads every source before a release (FT-36). Only a
 * line whose source says so is called free. The digits dialled are the digits shown.
 */
import { describe, expect, it } from 'vitest';
import { HELPLINE_DIRECTORY, HELPLINES, helplinesFor } from '../src';

const MAX_AGE_DAYS = 90;
const DAY = 86_400_000;
const ageDays = (iso: string) => (Date.now() - Date.parse(`${iso}T00:00:00Z`)) / DAY;
const digits = (s: string) => s.replace(/\D/g, '');

const lines = HELPLINES.flatMap((r) => r.lines.map((l) => ({ region: r.region, ...l })));
const dated = [
  ...lines.map((l) => ({ what: l.id, sourceUrl: l.sourceUrl, verifiedOn: l.verifiedOn })),
  ...HELPLINES.map((r) => ({ what: `${r.region}.emergency`, sourceUrl: r.emergency.sourceUrl, verifiedOn: r.emergency.verifiedOn })),
  { what: 'directory', sourceUrl: HELPLINE_DIRECTORY.sourceUrl, verifiedOn: HELPLINE_DIRECTORY.verifiedOn },
];

describe('[CCO-11] every line has a source and was read in the last 90 days', () => {
  it.each(dated)('$what', ({ sourceUrl, verifiedOn }) => {
    expect(sourceUrl).toMatch(/^https:\/\/[^\s]+$/);
    expect(verifiedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(Number.isNaN(Date.parse(verifiedOn))).toBe(false);
    const age = ageDays(verifiedOn);
    expect(age, `${verifiedOn} is ${Math.floor(age)} days old: re-read the source and update verifiedOn`).toBeLessThanOrEqual(MAX_AGE_DAYS);
    expect(age, 'verifiedOn is in the future').toBeGreaterThan(-1);
  });
});

describe('the lines', () => {
  it('has the seven regions in the spec, once each, each with an emergency number and at least one line', () => {
    expect(HELPLINES.map((r) => r.region)).toEqual(['US', 'CA', 'GB', 'IE', 'AU', 'NZ', 'IN']);
    for (const r of HELPLINES) {
      expect(r.emergency.tel).toMatch(/^\d{3}$/);
      expect(r.emergency.shown).toContain(r.emergency.tel);
      expect(r.lines.length).toBeGreaterThan(0);
      expect(r.country.length).toBeGreaterThan(0);
    }
  });

  it('ids are unique', () => {
    expect(new Set(lines.map((l) => l.id)).size).toBe(lines.length);
  });

  it.each(lines)('$id: dials digits only, shows the same digits, and its words show the number', (l) => {
    expect(l.tel || l.sms).toBeTruthy();
    for (const [n, shown] of [
      [l.tel, l.telShown],
      [l.sms, l.smsShown],
    ] as const) {
      if (!n) {
        expect(shown).toBeUndefined();
        continue;
      }
      expect(n).toMatch(/^\d{3,11}$/);
      expect(shown).toBeDefined();
      expect(digits(shown!)).toBe(n);
      expect(l.how).toContain(shown!);
    }
  });

  it.each(lines)('$id: says "free" only when its source says it is free', (l) => {
    expect(/\bfree\b/i.test(l.how)).toBe(l.free);
  });

  it('the US keeps its three lines, with 911 first', () => {
    const us = helplinesFor('US')!;
    expect(us.emergency.tel).toBe('911');
    expect(us.lines.map((l) => l.name)).toEqual(['National Maternal Mental Health Hotline', '988 Lifeline', 'Postpartum Support International']);
  });

  it('finds a region in any case, and nothing for one we hold no lines for', () => {
    expect(helplinesFor('gb')?.region).toBe('GB');
    expect(helplinesFor('DE')).toBeNull();
    expect(helplinesFor(null)).toBeNull();
    expect(helplinesFor('')).toBeNull();
  });
});
