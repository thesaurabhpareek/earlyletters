/**
 * Helplines (struggling-page.md section 2; CCO-11; F20-REQ-003). Each line names the official page it was read from
 * and the day; a line past 90 days fails here, so support re-reads every source before a release (FT-36). Only a
 * line whose source says so is called free. The digits dialled are the digits shown.
 */
import { describe, expect, it } from 'vitest';
import { allHelplineSources, en, HELPLINE_DIRECTORY, HELPLINE_MAX_AGE_DAYS, HELPLINES, helplineProblems, helplinesDueOn, helplinesFor, type SourceCheck } from '../src';

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
  const today = new Date().toISOString().slice(0, 10);

  it('the real data passes the rule today (a failure names the line and says which page to read again)', () => {
    expect(helplineProblems(sources, today), `read the pages again by ${helplinesDueOn()}`).toEqual([]);
  });

  it.each(claims)('$what: has at least one source with something it supports', ({ sources: own }) => {
    expect(own.length).toBeGreaterThan(0);
    for (const s of own) expect(s.supports.length).toBeGreaterThan(0);
  });

  it('the re-read day comes from the data: the oldest reading plus the window', () => {
    const oldest = Math.min(...sources.map((s) => at(s.source.readOn)));
    expect(helplinesDueOn()).toBe(new Date(oldest + HELPLINE_MAX_AGE_DAYS * DAY).toISOString().slice(0, 10));
    expect(at(helplinesDueOn())).toBeGreaterThanOrEqual(Date.now() - DAY);
  });

  describe('the rule itself, run on fixtures: it fails where it should and only there', () => {
    const TODAY = '2026-11-08';
    const good = { what: 'x.line', verifiedOn: '2026-11-08', source: { url: 'https://example.org/p', readOn: '2026-11-08', datedOn: '2026-10-23', supports: 'x' } };
    const withSource = (over: Partial<SourceCheck['source']>, verifiedOn = good.verifiedOn): SourceCheck => ({ ...good, verifiedOn, source: { ...good.source, ...over } });

    it('a fresh, dated source passes; so does an undated one read today', () => {
      expect(helplineProblems([good], TODAY)).toEqual([]);
      expect(helplineProblems([withSource({ datedOn: undefined })], TODAY)).toEqual([]);
    });

    it('a page dated years ago fails even when read today (the PIB 2023 case)', () => {
      expect(helplineProblems([withSource({ datedOn: '2023-04-24' })], TODAY)).toEqual([expect.stringContaining('dated 2023-04-24, more than 90 days before it was read')]);
    });

    it('a page last reviewed 164 days before it was read fails (the HSE 2025 case)', () => {
      expect(helplineProblems([withSource({ datedOn: '2025-05-28' })], TODAY)).toHaveLength(1);
    });

    it('a backdated verifiedOn cannot hide a stale page: the old date itself fails, and the page is judged against readOn', () => {
      // Review B's proof: a 2023 page with verifiedOn set back to 2023-05-01 used to pass.
      const sneaky = withSource({ datedOn: '2023-04-24', readOn: '2023-05-01' }, '2023-05-01');
      const problems = helplineProblems([sneaky], TODAY);
      expect(problems.some((p) => p.includes('verifiedOn 2023-05-01 is more than 90 days old'))).toBe(true);
      expect(problems.some((p) => p.includes('was read on 2023-05-01'))).toBe(true);
      // Even if the reading and the claim are both made recent, the page's own date still fails against readOn.
      expect(helplineProblems([withSource({ datedOn: '2023-04-24' }, '2023-05-01')], TODAY)).toContainEqual(expect.stringContaining('dated 2023-04-24, more than 90 days before it was read'));
    });

    it('an old reading, a future date, a claim newer than its reading, a page dated after it was read, and a non-https URL all fail', () => {
      expect(helplineProblems([withSource({ readOn: '2026-07-01', datedOn: undefined }, '2026-07-01')], TODAY)).not.toEqual([]);
      expect(helplineProblems([withSource({ readOn: '2026-11-20', datedOn: undefined }, '2026-11-20')], TODAY)).not.toEqual([]);
      expect(helplineProblems([withSource({ readOn: '2026-11-01', datedOn: undefined })], TODAY)).toEqual([expect.stringContaining('before the claim')]);
      expect(helplineProblems([withSource({ datedOn: '2026-11-09' })], TODAY)).toEqual([expect.stringContaining('after it was read')]);
      expect(helplineProblems([withSource({ url: 'http://example.org' })], TODAY)).toEqual([expect.stringContaining('not an https URL')]);
      expect(helplineProblems([withSource({ datedOn: 'last year' })], TODAY)).toEqual([expect.stringContaining('not a YYYY-MM-DD date')]);
    });
  });

  it('the sources that state their own date record it (PSI, NHS)', () => {
    const dated = Object.fromEntries(sources.filter((s) => s.source.datedOn).map((s) => [s.source.url, s.source.datedOn]));
    expect(dated['https://postpartum.net/get-help/']).toBe('2026-09-22');
    expect(dated['https://www.nhs.uk/nhs-services/mental-health-services/where-to-get-urgent-help-for-mental-health/']).toBe('2026-10-23');
  });
});

describe('the lines', () => {
  it('has the seven regions in the spec, once each, each with an emergency number', () => {
    expect(HELPLINES.map((r) => r.region)).toEqual(['US', 'CA', 'GB', 'AU', 'NZ', 'IN']);
    for (const r of HELPLINES) {
      expect(r.emergency.tel).toMatch(/^\d{3}$/);
      expect(r.emergency.shown).toContain(r.emergency.tel);
      expect(r.country.length).toBeGreaterThan(0);
    }
    // Every region but India has lines; India's Tele-MANAS is held until a current official page can be read (CCO-11).
    expect(HELPLINES.filter((r) => r.lines.length === 0).map((r) => r.region)).toEqual(['IN']);
    expect(lines.some((l) => /tele-?manas|14416/i.test(`${l.name} ${l.how} ${l.tel}`))).toBe(false);
    // Ireland is held (HSE page last reviewed 28/05/2025; the Text About It keyword is unconfirmed): no IE region, no IE line.
    expect(helplinesFor('IE')).toBeNull();
    expect(lines.some((l) => l.id.startsWith('ie.') || /50808/.test(l.how))).toBe(false);
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
      'au.lifeline': ['Lifeline', 'Call 13 11 14 or text 0477 13 11 14. Free and confidential to call. Any time.'],
      'au.panda': ['PANDA National Helpline', 'Call 1300 726 306, 7 days a week, for expecting and new families. Not a crisis line: for help right now, call Lifeline.'],
      'nz.1737': ['1737', 'Call or text 1737. Free, any time, with trained counsellors.'],
    });
    expect(Object.fromEntries(HELPLINES.map((r) => [r.region, r.emergency.shown]))).toEqual({ US: '911', CA: '911', GB: '999', AU: '000', NZ: '111', IN: '112' });
  });
});
