/**
 * Helplines on "If you are struggling", by the phone's own region (struggling-page.md section 2; CCO-11; F20-REQ-003).
 *
 * Every line carries the official pages its words were read from (`sources`, each with the day it was read and,
 * where the page states one, its own date) and the day the line was checked (`verifiedOn`). test/helplines.test.ts
 * fails when a line has no source, a reading is older than HELPLINE_MAX_AGE_DAYS (the day is `helplinesDueOn()`),
 * a line claims a check newer than its sources, or a dated source is too old to show the line is current. Support
 * re-reads each source every release and the founder signs off (FT-36).
 * A line or claim we could not read on its own official page is not here (CCO-11: unread lines are held). Only a
 * line whose source says it is free has `free: true`, and only those say "free".
 *
 * The region is read on the phone (its region setting), never sent or stored, and needs no permission. A phone set
 * to any other region gets the emergency line in general words and the Find A Helpline directory (ThroughLine).
 *
 * `tel` and `sms` are the digits to dial; `telShown` and `smsShown` are the same digits as people read them there,
 * and the `how` line shows them word for word.
 */

export type HelplineRegion = 'US' | 'CA' | 'GB' | 'AU' | 'NZ' | 'IN';

/**
 * One official page a line's words rest on. `readOn` is the day we read it. `datedOn` is the page's own date when it
 * states one (a press release, a "last updated"); a page with no date of its own is evidence only of the day it was
 * read. A dated page older than the freshness window cannot back a line's claim that it is current
 * (helplines.test.ts), which is why a three-year-old press release alone cannot carry a line.
 */
export type HelplineSource = { url: string; readOn: string; datedOn?: string; supports: string };

/** How long a reading stays good (CCO-11): a line is re-read within this many days, or the test fails. */
export const HELPLINE_MAX_AGE_DAYS = 90;

export type Helpline = {
  id: string;
  name: string;
  /** One line under the name: how to reach it, its hours and, only where the source says so, that it is free. */
  how: string;
  tel?: string;
  telShown?: string;
  sms?: string;
  smsShown?: string;
  free: boolean;
  /** The official pages its words rest on; every claim in `how` is backed by one of them. */
  sources: readonly HelplineSource[];
  /** YYYY-MM-DD, the day the line was last checked against all its sources. */
  verifiedOn: string;
};

export type RegionHelplines = {
  region: HelplineRegion;
  /** The country as a heading on "Lines in other countries". */
  country: string;
  emergency: { tel: string; shown: string; sources: readonly HelplineSource[]; verifiedOn: string };
  lines: readonly Helpline[];
};

const ON = '2026-11-08';

export const HELPLINES: readonly RegionHelplines[] = [
  {
    region: 'US',
    country: 'United States',
    emergency: { tel: '911', shown: '911', sources: [{ url: 'https://www.911.gov/', readOn: ON, supports: 'Call 911 in an emergency' }], verifiedOn: ON },
    lines: [
      {
        id: 'us.nmmh',
        name: 'National Maternal Mental Health Hotline',
        how: 'Call or text 1-833-852-6262. Free and confidential. Any time, in English or Spanish.',
        tel: '18338526262',
        telShown: '1-833-852-6262',
        sms: '18338526262',
        smsShown: '1-833-852-6262',
        free: true,
        sources: [{ url: 'https://mchb.hrsa.gov/national-maternal-mental-health-hotline', readOn: ON, supports: 'Call or text 1-833-852-6262; free, confidential, 24/7, English and Spanish' }],
        verifiedOn: ON,
      },
      {
        id: 'us.988',
        name: '988 Lifeline',
        how: 'Call or text 988. Free and confidential. Any time. Press 2 for Spanish.',
        tel: '988',
        telShown: '988',
        sms: '988',
        smsShown: '988',
        free: true,
        sources: [{ url: 'https://988lifeline.org/', readOn: ON, supports: 'Call or text 988; available 24/7/365; free and confidential' }, { url: 'https://988lifeline.org/get-help/', readOn: ON, supports: 'Dial 988 and then press 2 for Spanish' }],
        verifiedOn: ON,
      },
      {
        id: 'us.psi',
        name: 'Postpartum Support International',
        how: 'Call or text 1-800-944-4773. Leave a message and a trained volunteer gets back to you by phone or text. For help right now, use a line above.',
        tel: '18009444773',
        telShown: '1-800-944-4773',
        sms: '18009444773',
        smsShown: '1-800-944-4773',
        free: false,
        sources: [{ url: 'https://postpartum.net/get-help/', readOn: ON, datedOn: '2026-09-22', supports: 'Call or text 1-800-944-4773; leave a message and a volunteer returns your call or text; not a crisis line' }],
        verifiedOn: ON,
      },
    ],
  },
  {
    region: 'CA',
    country: 'Canada',
    emergency: { tel: '911', shown: '911', sources: [{ url: 'https://988.ca/', readOn: ON, supports: 'Call or text 9-8-8, 24 hours a day, every day of the year; call 9-1-1 if your safety is at risk' }], verifiedOn: ON },
    lines: [
      {
        id: 'ca.988',
        name: '9-8-8: Suicide Crisis Helpline',
        how: 'Call or text 988, any time, day or night.',
        tel: '988',
        telShown: '988',
        sms: '988',
        smsShown: '988',
        free: false,
        sources: [{ url: 'https://988.ca/', readOn: ON, supports: 'Call or text 9-8-8, 24 hours a day, every day of the year; call 9-1-1 if your safety is at risk' }],
        verifiedOn: ON,
      },
    ],
  },
  {
    region: 'GB',
    country: 'United Kingdom',
    emergency: { tel: '999', shown: '999', sources: [{ url: 'https://www.nhs.uk/nhs-services/mental-health-services/where-to-get-urgent-help-for-mental-health/', readOn: ON, datedOn: '2026-10-23', supports: 'Call 999 or go to A&E' }], verifiedOn: ON },
    lines: [
      {
        id: 'gb.samaritans',
        name: 'Samaritans',
        how: 'Call 116 123. Free, any time, day or night.',
        tel: '116123',
        telShown: '116 123',
        free: true,
        sources: [{ url: 'https://www.samaritans.org/', readOn: ON, supports: 'Call 116 123 for free, 24 hours a day, 365 days a year' }],
        verifiedOn: ON,
      },
    ],
  },
  // Ireland is held (CCO-11). Its three claims (112 or 999, Samaritans 116 123, Text About It) rest only on the HSE
  // page, which says "Page last reviewed: 28/05/2025", 164 days before it was read on 8 Nov 2026: past the 90-day
  // window. Text About It's own site says "Text TALK to 50808" in its body but "Hello" in its description and gives
  // HELLO only for another number, so the keyword could not be confirmed either. A phone set to Ireland gets the
  // general emergency words and Find A Helpline. It returns with a page reviewed inside the window.
  {
    region: 'AU',
    country: 'Australia',
    emergency: { tel: '000', shown: '000', sources: [{ url: 'https://www.lifeline.org.au/crisis-support/', readOn: ON, supports: 'Triple Zero (000); call 13 11 14, text 0477 13 11 14, 24/7; free and confidential calls' }], verifiedOn: ON },
    lines: [
      {
        id: 'au.lifeline',
        name: 'Lifeline',
        how: 'Call 13 11 14 or text 0477 13 11 14. Free and confidential to call. Any time.',
        tel: '131114',
        telShown: '13 11 14',
        sms: '0477131114',
        smsShown: '0477 13 11 14',
        free: true,
        sources: [{ url: 'https://www.lifeline.org.au/crisis-support/', readOn: ON, supports: 'Triple Zero (000); call 13 11 14, text 0477 13 11 14, 24/7; free and confidential calls' }],
        verifiedOn: ON,
      },
      {
        id: 'au.panda',
        name: 'PANDA National Helpline',
        how: 'Call 1300 726 306, 7 days a week, for expecting and new families. Not a crisis line: for help right now, call Lifeline.',
        tel: '1300726306',
        telShown: '1300 726 306',
        free: false,
        sources: [{ url: 'https://panda.org.au/', readOn: ON, supports: '1300 726 306, open 7 days a week; not a crisis service; expecting and new families' }],
        verifiedOn: ON,
      },
    ],
  },
  {
    region: 'NZ',
    country: 'New Zealand',
    emergency: { tel: '111', shown: '111', sources: [{ url: 'https://1737.org.nz/', readOn: ON, supports: 'Call or text 1737, free, 24/7, trained counsellors; call 111 in immediate danger' }], verifiedOn: ON },
    lines: [
      {
        id: 'nz.1737',
        name: '1737',
        how: 'Call or text 1737. Free, any time, with trained counsellors.',
        tel: '1737',
        telShown: '1737',
        sms: '1737',
        smsShown: '1737',
        free: true,
        sources: [{ url: 'https://1737.org.nz/', readOn: ON, supports: 'Call or text 1737, free, 24/7, trained counsellors; call 111 in immediate danger' }],
        verifiedOn: ON,
      },
    ],
  },
  {
    region: 'IN',
    country: 'India',
    emergency: { tel: '112', shown: '112', sources: [{ url: 'https://112.gov.in/', readOn: ON, supports: '112, the Pan-India single emergency number' }], verifiedOn: ON },
    // Tele-MANAS (14416) is held (CCO-11): no official page dated 2025 or 2026 could be read on 8 Nov 2026. The
    // portal (telemanas.mohfw.gov.in) refuses automated reads, and the newest official text found was a PIB release
    // of 24 Apr 2023. It comes back with a current official source. Until then India has 112 and the directory.
    lines: [],
  },
];

/** Every other region: the Find A Helpline directory (ThroughLine), whose listed helplines verify their own entries. */
export const HELPLINE_DIRECTORY: { url: string; sources: readonly HelplineSource[]; verifiedOn: string } = {
  url: 'https://findahelpline.com/',
  sources: [{ url: 'https://findahelpline.com/', readOn: ON, supports: 'Free, anonymous and confidential helplines; partners verify their information directly' }],
  verifiedOn: ON,
};

/** Every source on this page: the lines, the emergency numbers and the directory. */
export function allHelplineSources(): { what: string; verifiedOn: string; source: HelplineSource }[] {
  return [
    ...HELPLINES.flatMap((r) => [
      ...r.emergency.sources.map((source) => ({ what: `${r.region}.emergency`, verifiedOn: r.emergency.verifiedOn, source })),
      ...r.lines.flatMap((l) => l.sources.map((source) => ({ what: l.id, verifiedOn: l.verifiedOn, source }))),
    ]),
    ...HELPLINE_DIRECTORY.sources.map((source) => ({ what: 'directory', verifiedOn: HELPLINE_DIRECTORY.verifiedOn, source })),
  ];
}

/**
 * The freshness rule (CCO-11), pure so a test can run it on real data and on fixtures. Returns what is wrong, empty
 * when all is well, for `today` (YYYY-MM-DD):
 *  - the line's own `verifiedOn` is not a date, is in the future, or is older than HELPLINE_MAX_AGE_DAYS;
 *  - a source's `readOn` is not a date, is in the future, is older than the window, or is before the claim's
 *    `verifiedOn` (a claim cannot be newer than the reading it rests on);
 *  - a source with its own date (`datedOn`) is later than it was read, or is older than the window measured from
 *    `readOn`: a page nobody has reviewed in 90 days cannot show a line is current, however recently it was read.
 * Measured against `readOn`, never against `verifiedOn`, so an old `verifiedOn` cannot hide a stale page.
 */
export type SourceCheck = { what: string; verifiedOn: string; source: HelplineSource };
export function helplineProblems(items: readonly SourceCheck[], today: string): string[] {
  const ISO = /^\d{4}-\d{2}-\d{2}$/;
  const day = (iso: string) => Date.parse(`${iso}T00:00:00Z`);
  const age = (from: string, to: string) => (day(to) - day(from)) / 86_400_000;
  const out: string[] = [];
  for (const { what, verifiedOn, source: s } of items) {
    const dates = [['verifiedOn', verifiedOn], ['readOn', s.readOn], ...(s.datedOn ? [['datedOn', s.datedOn]] : [])] as const;
    const bad = dates.filter(([, d]) => !ISO.test(d) || Number.isNaN(day(d)));
    for (const [k, d] of bad) out.push(`${what}: ${k} "${d}" is not a YYYY-MM-DD date`);
    if (bad.length) continue;
    if (!/^https:\/\/\S+$/.test(s.url)) out.push(`${what}: source "${s.url}" is not an https URL`);
    if (age(verifiedOn, today) < 0) out.push(`${what}: verifiedOn ${verifiedOn} is in the future`);
    else if (age(verifiedOn, today) > HELPLINE_MAX_AGE_DAYS) out.push(`${what}: verifiedOn ${verifiedOn} is more than ${HELPLINE_MAX_AGE_DAYS} days old`);
    if (age(s.readOn, today) < 0) out.push(`${what}: ${s.url} readOn ${s.readOn} is in the future`);
    else if (age(s.readOn, today) > HELPLINE_MAX_AGE_DAYS) out.push(`${what}: ${s.url} was read on ${s.readOn}, more than ${HELPLINE_MAX_AGE_DAYS} days ago`);
    if (age(verifiedOn, s.readOn) < 0) out.push(`${what}: ${s.url} was read on ${s.readOn}, before the claim of ${verifiedOn}`);
    if (s.datedOn) {
      if (age(s.datedOn, s.readOn) < 0) out.push(`${what}: ${s.url} is dated ${s.datedOn}, after it was read`);
      else if (age(s.datedOn, s.readOn) > HELPLINE_MAX_AGE_DAYS) out.push(`${what}: ${s.url} is dated ${s.datedOn}, more than ${HELPLINE_MAX_AGE_DAYS} days before it was read`);
    }
  }
  return out;
}

/**
 * The day by which every source must be read again (YYYY-MM-DD): the oldest reading plus HELPLINE_MAX_AGE_DAYS.
 * Computed from the data, so the release calendar and the test agree; helplines.test.ts fails after it.
 */
export function helplinesDueOn(): string {
  const oldest = Math.min(...allHelplineSources().map((s) => Date.parse(`${s.source.readOn}T00:00:00Z`)));
  return new Date(oldest + HELPLINE_MAX_AGE_DAYS * 86_400_000).toISOString().slice(0, 10);
}

/** The lines for a region, or null when the region is not one we have read lines for. */
export function helplinesFor(region: string | null | undefined): RegionHelplines | null {
  if (!region) return null;
  const r = region.toUpperCase();
  return HELPLINES.find((h) => h.region === r) ?? null;
}
