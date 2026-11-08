/**
 * Helplines (struggling-page.md section 2; CCO-11; F20-REQ-003). Each line names the official page it was read from
 * and the day; a line past 90 days fails here, so support re-reads every source before a release (FT-36). Only a
 * line whose source says so is called free. The digits dialled are the digits shown.
 */
import { describe, expect, it } from 'vitest';
import { allHelplineSources, en, HELPLINE_DIRECTORY, HELPLINE_MAX_AGE_DAYS, HELPLINES, helplinesDueOn, helplinesFor } from '../src';

const DAY = 86_400_000;
const at = (iso: string) => Date.parse(`${iso}T00:00:00Z`);
const ISO = /^\d{4}-\d{2}-\d{2}$/;
const digits = (s: string) => s.replace(/\D/g, '');

const lines = HELPLINES.flatMap((r) => r.lines.map((l) => ({ region: r.region, ...l })));
const sources = allHelplineSources();
const claims = [
  ...lines.map((l) => ({ what: l.id, verifiedOn: l.verifiedOn, sources: l.sources })),
  ...HELPLINES.map((r) => ({ what: `${r.region}.emergency`, verifiedOn: r.emergency.verifiedOn, sources: r.emergency.sources })),
  { what: 'directory', verifiedOn: HELPLINE_DIRECTORY.verifiedOn, sources: HELPLINE_DIRECTORY.sources },
];

describe('[CCO-11] every claim rests on official pages read recently enough to show it is current', () => {
  it.each(claims)('$what: has at least one source, and claims no check newer than its sources', ({ verifiedOn, sources: own }) => {
    expect(verifiedOn).toMatch(ISO);
    expect(own.length).toBeGreaterThan(0);
    for (const s of own) {
      expect(s.url).toMatch(/^https:\/\/[^\s]+$/);
      expect(s.readOn).toMatch(ISO);
      expect(s.supports.length).toBeGreaterThan(0);
      // A line cannot claim it was checked after the day one of its sources was last read.
      expect(at(s.readOn), `${s.url} was read on ${s.readOn}, before the claim of ${verifiedOn}`).toBeGreaterThanOrEqual(at(verifiedOn));
    }
  });

  it.each(sources)('$what: $source.url is no older than the claim it backs', ({ verifiedOn, source }) => {
    // The reading itself is within the window, and never in the future.
    expect(at(source.readOn)).toBeLessThanOrEqual(Date.now() + DAY);
    expect((Date.now() - at(source.readOn)) / DAY, `${source.url} was read on ${source.readOn}: read it again by ${helplinesDueOn()}`).toBeLessThanOrEqual(HELPLINE_MAX_AGE_DAYS);
    // A page that carries its own date (a press release, a "last updated") is only as current as that date: one
    // older than the window cannot show the line is current, however recently it was read.
    if (source.datedOn) {
      expect(source.datedOn).toMatch(ISO);
      expect(at(source.datedOn)).toBeLessThanOrEqual(at(source.readOn));
      expect((at(verifiedOn) - at(source.datedOn)) / DAY, `${source.url} is dated ${source.datedOn}, too old to back a claim of ${verifiedOn}`).toBeLessThanOrEqual(HELPLINE_MAX_AGE_DAYS);
    }
  });

  it('the re-read day comes from the data: the oldest reading plus the window', () => {
    const oldest = Math.min(...sources.map((s) => at(s.source.readOn)));
    expect(helplinesDueOn()).toBe(new Date(oldest + HELPLINE_MAX_AGE_DAYS * DAY).toISOString().slice(0, 10));
    expect(at(helplinesDueOn())).toBeGreaterThanOrEqual(Date.now() - DAY);
  });

  it('a dated source too old for its claim fails the rule (the check bites)', () => {
    const tooOld = { verifiedOn: '2026-11-08', datedOn: '2023-04-24' };
    expect((at(tooOld.verifiedOn) - at(tooOld.datedOn)) / DAY).toBeGreaterThan(HELPLINE_MAX_AGE_DAYS);
  });
});

describe('the lines', () => {
  it('has the seven regions in the spec, once each, each with an emergency number', () => {
    expect(HELPLINES.map((r) => r.region)).toEqual(['US', 'CA', 'GB', 'IE', 'AU', 'NZ', 'IN']);
    for (const r of HELPLINES) {
      expect(r.emergency.tel).toMatch(/^\d{3}$/);
      expect(r.emergency.shown).toContain(r.emergency.tel);
      expect(r.country.length).toBeGreaterThan(0);
    }
    // Every region but India has lines; India's Tele-MANAS is held until a current official page can be read (CCO-11).
    expect(HELPLINES.filter((r) => r.lines.length === 0).map((r) => r.region)).toEqual(['IN']);
    expect(lines.some((l) => /tele-?manas|14416/i.test(`${l.name} ${l.how} ${l.tel}`))).toBe(false);
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

describe('[FT-36] the words on the page, exactly (founder-owned; a change here needs the founder\'s sign-off)', () => {
  it('struggling.* is exactly these strings, no more and no fewer', () => {
    expect(en.struggling).toEqual({
      title: 'If you are struggling',
      body: 'The early months ask a lot of anyone. If you want to talk to someone, these lines are there.',
      emergencyTitle: 'Are you or your baby in danger right now?',
      emergencyCall: 'Call {n}',
      emergencyLocal: 'Call your local emergency number.',
      call: 'Call',
      text: 'Text',
      callA11y: 'Call {name}',
      textA11y: 'Text {name}',
      directory: 'Find a free helpline near you',
      directoryBody: 'A directory of verified lines in many countries.',
      otherCountries: 'Lines in other countries',
      otherCountriesBody: 'If you are travelling, or your phone is set to somewhere you are not.',
      emergencyIn: 'Emergency: {n}',
      privacy: 'Nothing on this page is recorded or sent.',
    });
  });

  it('every line\'s name and words are exactly these', () => {
    expect(Object.fromEntries(lines.map((l) => [l.id, [l.name, l.how]]))).toEqual({
      'us.nmmh': ['National Maternal Mental Health Hotline', 'Call or text 1-833-852-6262. Free and confidential. Any time, in English or Spanish.'],
      'us.988': ['988 Lifeline', 'Call or text 988. Free and confidential. Any time. Press 2 for Spanish.'],
      'us.psi': ['Postpartum Support International', 'Call or text 1-800-944-4773. Leave a message and a trained volunteer gets back to you by phone or text. For help right now, use a line above.'],
      'ca.988': ['9-8-8: Suicide Crisis Helpline', 'Call or text 988, any time, day or night.'],
      'gb.samaritans': ['Samaritans', 'Call 116 123. Free, any time, day or night.'],
      'ie.samaritans': ['Samaritans', 'Call 116 123. Free and confidential, any time.'],
      'ie.textaboutit': ['Text About It', 'Text HELLO to 50808. Free, any time.'],
      'au.lifeline': ['Lifeline', 'Call 13 11 14 or text 0477 13 11 14. Free and confidential to call. Any time.'],
      'au.panda': ['PANDA National Helpline', 'Call 1300 726 306, 7 days a week, for expecting and new families. Not a crisis line: for help right now, call Lifeline.'],
      'nz.1737': ['1737', 'Call or text 1737. Free, any time, with trained counsellors.'],
    });
    expect(Object.fromEntries(HELPLINES.map((r) => [r.region, r.emergency.shown]))).toEqual({ US: '911', CA: '911', GB: '999', IE: '112 or 999', AU: '000', NZ: '111', IN: '112' });
  });
});
