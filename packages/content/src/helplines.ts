/**
 * Helplines on "If you are struggling", by the phone's own region (struggling-page.md section 2; CCO-11; F20-REQ-003).
 *
 * Every line carries the official page its words were read from (`sourceUrl`) and the day that was done
 * (`verifiedOn`). test/helplines.test.ts fails when a line has no source or was verified more than 90 days ago, so
 * a stale number cannot ship quietly: support re-reads each source every release and the founder signs off (FT-36).
 * A line or claim we could not read on its own official page is not here (CCO-11: unread lines are held). Only a
 * line whose source says it is free has `free: true`, and only those say "free".
 *
 * The region is read on the phone (its region setting), never sent or stored, and needs no permission. A phone set
 * to any other region gets the emergency line in general words and the Find A Helpline directory (ThroughLine).
 *
 * `tel` and `sms` are the digits to dial; `telShown` and `smsShown` are the same digits as people read them there,
 * and the `how` line shows them word for word.
 */

export type HelplineRegion = 'US' | 'CA' | 'GB' | 'IE' | 'AU' | 'NZ' | 'IN';

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
  sourceUrl: string;
  /** YYYY-MM-DD, the day the official page was read. */
  verifiedOn: string;
};

export type RegionHelplines = {
  region: HelplineRegion;
  /** The country as a heading on "Lines in other countries". */
  country: string;
  emergency: { tel: string; shown: string; sourceUrl: string; verifiedOn: string };
  lines: readonly Helpline[];
};

const ON = '2026-11-08';

export const HELPLINES: readonly RegionHelplines[] = [
  {
    region: 'US',
    country: 'United States',
    emergency: { tel: '911', shown: '911', sourceUrl: 'https://www.911.gov/', verifiedOn: ON },
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
        sourceUrl: 'https://mchb.hrsa.gov/national-maternal-mental-health-hotline',
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
        sourceUrl: 'https://988lifeline.org/get-help/',
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
        sourceUrl: 'https://postpartum.net/get-help/',
        verifiedOn: ON,
      },
    ],
  },
  {
    region: 'CA',
    country: 'Canada',
    emergency: { tel: '911', shown: '911', sourceUrl: 'https://988.ca/', verifiedOn: ON },
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
        sourceUrl: 'https://988.ca/',
        verifiedOn: ON,
      },
    ],
  },
  {
    region: 'GB',
    country: 'United Kingdom',
    emergency: { tel: '999', shown: '999', sourceUrl: 'https://www.nhs.uk/nhs-services/mental-health-services/where-to-get-urgent-help-for-mental-health/', verifiedOn: ON },
    lines: [
      {
        id: 'gb.samaritans',
        name: 'Samaritans',
        how: 'Call 116 123. Free, any time, day or night.',
        tel: '116123',
        telShown: '116 123',
        free: true,
        sourceUrl: 'https://www.samaritans.org/',
        verifiedOn: ON,
      },
    ],
  },
  {
    region: 'IE',
    country: 'Ireland',
    emergency: { tel: '112', shown: '112 or 999', sourceUrl: 'https://www2.hse.ie/mental-health/services-support/get-urgent-help/', verifiedOn: ON },
    lines: [
      {
        id: 'ie.samaritans',
        name: 'Samaritans',
        how: 'Call 116 123. Free and confidential, any time.',
        tel: '116123',
        telShown: '116 123',
        free: true,
        sourceUrl: 'https://www2.hse.ie/mental-health/services-support/get-urgent-help/',
        verifiedOn: ON,
      },
      {
        id: 'ie.textaboutit',
        name: 'Text About It',
        how: 'Text HELLO to 50808. Free, any time.',
        sms: '50808',
        smsShown: '50808',
        free: true,
        sourceUrl: 'https://www2.hse.ie/mental-health/services-support/get-urgent-help/',
        verifiedOn: ON,
      },
    ],
  },
  {
    region: 'AU',
    country: 'Australia',
    emergency: { tel: '000', shown: '000', sourceUrl: 'https://www.lifeline.org.au/crisis-support/', verifiedOn: ON },
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
        sourceUrl: 'https://www.lifeline.org.au/crisis-support/',
        verifiedOn: ON,
      },
      {
        id: 'au.panda',
        name: 'PANDA National Helpline',
        how: 'Call 1300 726 306, 7 days a week, for expecting and new families. Not a crisis line: for help right now, call Lifeline.',
        tel: '1300726306',
        telShown: '1300 726 306',
        free: false,
        sourceUrl: 'https://panda.org.au/',
        verifiedOn: ON,
      },
    ],
  },
  {
    region: 'NZ',
    country: 'New Zealand',
    emergency: { tel: '111', shown: '111', sourceUrl: 'https://1737.org.nz/', verifiedOn: ON },
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
        sourceUrl: 'https://1737.org.nz/',
        verifiedOn: ON,
      },
    ],
  },
  {
    region: 'IN',
    country: 'India',
    emergency: { tel: '112', shown: '112', sourceUrl: 'https://112.gov.in/', verifiedOn: ON },
    lines: [
      {
        id: 'in.telemanas',
        name: 'Tele-MANAS',
        how: 'Call 14416 or 1800-89-14416. Free, any time, in over 20 languages.',
        tel: '14416',
        telShown: '14416',
        free: true,
        sourceUrl: 'https://pib.gov.in/PressReleasePage.aspx?PRID=1919200',
        verifiedOn: ON,
      },
    ],
  },
];

/** Every other region: the Find A Helpline directory (ThroughLine), whose listed helplines verify their own entries. */
export const HELPLINE_DIRECTORY = { url: 'https://findahelpline.com/', sourceUrl: 'https://findahelpline.com/', verifiedOn: ON } as const;

/** The lines for a region, or null when the region is not one we have read lines for. */
export function helplinesFor(region: string | null | undefined): RegionHelplines | null {
  if (!region) return null;
  const r = region.toUpperCase();
  return HELPLINES.find((h) => h.region === r) ?? null;
}
