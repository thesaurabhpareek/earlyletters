/**
 * Trust and safety gates (BL-2104): FR-POL-02, FR-POL-03 and FR-POL-04 in docs/product/prd/functions/support.md.
 *
 * - FR-POL-02: the abuse-material macro in docs/support/macros.md is an acknowledgement only and asks for nothing.
 * - FR-POL-03: a build switch that lets one person's content reach another through our servers may not be on in a store
 *   build unless its card has a complete row in docs/ops/runbooks/report-set.md. Every EXPO_PUBLIC_* key in eas.json must
 *   be classified below, so a new switch cannot slip past the gate unread.
 * - FR-POL-04: the two-parent book (NS-25) does not open in a store build until docs/ops/runbooks/safety-removal.md is
 *   APPROVED and its access tool exists in supabase/migrations.
 *
 * "Store build" means what the app code means by it: the profile whose EXPO_PUBLIC_APP_ENV is `production`
 * (apps/mobile/src/lib/billing/alpha.ts isAlphaBuild: "Only `production` is the store"). The FR-POL-03 and FR-POL-04 gates
 * apply to every build that can reach someone outside the internal TestFlight group Family (CR-234): the store build, and
 * any store-distributed profile whose submit groups are not exactly ["Family"] (the pin of BL-2027, CR-184). That file and build-env.ts are not
 * imported here because build-env.ts names React Native's `__DEV__`, which this package's typecheck does not know; a test
 * below reads isAlphaBuild's source so the two cannot drift. Each gate is a pure function, and each has a planted case that
 * shows it fails.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import { INVITE_ENTRIES, inviteDestination } from '../../../apps/mobile/src/lib/family/entry.logic';
import { parseServerFeatures } from '../../../apps/mobile/src/lib/capabilities';
import { ASKS_FOR_MATERIAL, bodyText, parseMacros, parseSends, readMacrosFile } from './support/macros-file';

const ROOT = fileURLToPath(new URL('../../../', import.meta.url));
const EAS_JSON = `${ROOT}apps/mobile/eas.json`;
const RUNBOOKS = `${ROOT}docs/ops/runbooks/`;
const MIGRATIONS = `${ROOT}supabase/migrations/`;

type Env = Record<string, string>;
type Profile = { name: string; env: Env; distribution?: string; groups?: unknown };

/**
 * Every EXPO_PUBLIC_* key, classified. `hosts` names the card when the switch, on, lets one person's content reach
 * another person through our servers or a hosted page (FR-POL-03). A new key fails the test until it is added here
 * with a reason, read against support.md FR-POL-03.
 */
const SWITCHES: Record<string, { hosts: string | null; why: string }> = {
  EXPO_PUBLIC_DOCS_BASE_URL: { hosts: null, why: 'where the app reads our own documents; no person content' },
  EXPO_PUBLIC_APP_ENV: { hosts: null, why: 'which build this is' },
  EXPO_PUBLIC_E2E: { hosts: null, why: 'a simulator test build, never uploaded' },
  EXPO_PUBLIC_SERVER_FEATURES: {
    hosts: null,
    why: 'sync of a person\'s own letters; the two-parent book it also opens in alpha is held by the FR-POL-04 gate below',
  },
  EXPO_PUBLIC_BACKUP: { hosts: null, why: 'an encrypted backup of a person\'s own recordings, read only by them' },
  EXPO_PUBLIC_STATUS_REPORT: { hosts: null, why: 'subscription status only' },
  EXPO_PUBLIC_ANALYTICS: { hosts: null, why: 'opt-in counts, no content' },
  EXPO_PUBLIC_ACCOUNT_DELETION: { hosts: null, why: 'deletes a person\'s own account' },
  EXPO_PUBLIC_SERVER_ERASE: { hosts: null, why: 'erases a person\'s own letter on the server' },
  EXPO_PUBLIC_ENGLISH_ONLY: { hosts: null, why: 'languages the build hears' },
  EXPO_PUBLIC_SPOKEN_LANGUAGES: { hosts: null, why: 'languages the build hears' },
  EXPO_PUBLIC_PHOTOS: { hosts: null, why: 'pictures stay on the phone; media on our servers is FR-POL-14 and needs its own row here first' },
};

type EasJson = {
  build: Record<string, { env?: Env; extends?: string; distribution?: string }>;
  submit?: Record<string, { ios?: { groups?: unknown } }>;
};

/** Profiles from an eas.json object: env and distribution follow `extends` to any depth. */
export function profilesFrom(eas: EasJson): Profile[] {
  const envOf = (name: string): Env => {
    const p = eas.build[name];
    return { ...(p.extends ? envOf(p.extends) : {}), ...(p.env ?? {}) };
  };
  const distributionOf = (name: string): string | undefined => {
    const p = eas.build[name];
    return p.distribution ?? (p.extends ? distributionOf(p.extends) : undefined);
  };
  return Object.keys(eas.build).map((name) => ({
    name,
    env: envOf(name),
    distribution: distributionOf(name),
    groups: eas.submit?.[name]?.ios?.groups,
  }));
}

function readProfiles(): Profile[] {
  return profilesFrom(JSON.parse(readFileSync(EAS_JSON, 'utf8')) as EasJson);
}

function isStoreBuild(p: Profile): boolean {
  return (p.env.EXPO_PUBLIC_APP_ENV ?? '').trim() === 'production';
}

/**
 * CR-234: can this build reach someone outside the internal Family group? EAS distributes to the store unless a profile
 * says `internal`, so only an exact `internal` is exempt; any other value, a typo included, counts as store. A store-distributed profile stays inside only while its submit groups are exactly ["Family"]; the
 * App Store build always reaches outside. A manual change in App Store Connect is not visible here (FOUNDER_QUEUE row).
 */
export function reachesOutside(p: Profile): boolean {
  if (p.distribution === 'internal') return false;
  if (isStoreBuild(p)) return true;
  return JSON.stringify(p.groups) !== JSON.stringify(['Family']);
}

/** Is a switch on? Every switch so far is an `on` flag, read the way capabilities.ts reads one. */
function on(value: string | undefined): boolean {
  return parseServerFeatures(value);
}

/** A hosting switch fails closed: anything but empty, off, 0 or false counts as on, so a `1` or `true` flag cannot slip past. */
export function hostingSwitchOn(value: string | undefined): boolean {
  return !/^(|off|0|false)$/i.test((value ?? '').trim());
}

/** The report-set table header (CCO-33): Apple 1.2 asks for a filter method, so the last column names one. */
export const REPORT_SET_HEADER =
  '| Card | Report path and response time (internal, not published) | Block or remove path | Published contact | Filter method (or why none applies) |';

/** A report-set row is complete when it names the card and fills all four cells (no TBD). */
export function reportSetCards(md: string): Set<string> {
  const cards = new Set<string>();
  for (const line of md.split('\n')) {
    if (!line.startsWith('|') || /^\|\s*-/.test(line) || /^\|\s*Card\s*\|/.test(line)) continue;
    const cells = line.split('|').slice(1, -1).map((c) => c.trim());
    if (cells.length === 5 && cells.every((c) => c !== '' && !/^(tbd|todo|n\/a)$/i.test(c))) cards.add(cells[0]);
  }
  return cards;
}

/** FR-POL-03: what fails, empty when every hosting switch that is on in a store build has its report set. */
export function reportSetFindings(profiles: Profile[], switches: typeof SWITCHES, reportSet: Set<string>): string[] {
  const out: string[] = [];
  for (const p of profiles) {
    for (const key of Object.keys(p.env).filter((k) => k.startsWith('EXPO_PUBLIC_'))) {
      const s = switches[key];
      if (!s) {
        out.push(`${p.name}: ${key} is not classified in trust-and-safety-gate.test.ts SWITCHES (does it host content? FR-POL-03)`);
        continue;
      }
      if (s.hosts && reachesOutside(p) && hostingSwitchOn(p.env[key]) && !reportSet.has(s.hosts)) {
        out.push(`${p.name}: ${key} is on and ${s.hosts} has no complete row in docs/ops/runbooks/report-set.md (FR-POL-03)`);
      }
    }
  }
  return out;
}

type SafetyState = { runbookApproved: boolean; tool: string | null; toolBuilt: boolean };

/** FR-POL-04: reads the runbook's Status and Tool lines and looks for the tool in the migrations. */
export function safetyState(runbook: string | null, migrations: string[]): SafetyState {
  if (runbook === null) return { runbookApproved: false, tool: null, toolBuilt: false };
  const runbookApproved = /^Status: APPROVED\b/m.test(runbook);
  const tool = /^Tool: `(?:public\.)?([a-z_][a-z0-9_]*)`/m.exec(runbook)?.[1] ?? null;
  const create = tool ? new RegExp(`create\\s+(or\\s+replace\\s+)?function\\s+(public\\.)?${tool}\\s*\\(`, 'i') : null;
  return { runbookApproved, tool, toolBuilt: create !== null && migrations.some((sql) => create.test(sql)) };
}

/**
 * FR-POL-04: what fails, empty when no store build opens the invite flow from any entry, or both conditions hold.
 * The app decides each entry on its own (`app/invite/index.tsx` asks for `invite_join`, `family.tsx` for `family_tab`, the
 * link watcher for `invite_link`, and so on), so every entry in INVITE_ENTRIES is checked, not one.
 */
export function safetyRemovalFindings(profiles: Profile[], destination: typeof inviteDestination, state: SafetyState): string[] {
  const out: string[] = [];
  for (const p of profiles.filter(reachesOutside)) {
    const servers = on(p.env.EXPO_PUBLIC_SERVER_FEATURES);
    // The app's own rule (isAlphaBuild: env !== 'production'), so a TestFlight profile sent outside Family is read as alpha.
    const alpha = !isStoreBuild(p);
    const opening = INVITE_ENTRIES.filter((e) => destination(e, servers, alpha) === 'flow');
    if (opening.length === 0) continue;
    const from = opening.join(', ');
    if (!state.runbookApproved) out.push(`${p.name}: the two-parent book opens from ${from}, and safety-removal.md is not APPROVED (FR-POL-04)`);
    if (!state.toolBuilt) out.push(`${p.name}: the two-parent book opens from ${from}, and the access tool is not in supabase/migrations (FR-POL-04, BL-2103)`);
  }
  return out;
}

let profiles: Profile[];
let reportSetMd: string;
let runbook: string | null;
let migrations: string[];

beforeAll(() => {
  profiles = readProfiles();
  reportSetMd = readFileSync(`${RUNBOOKS}report-set.md`, 'utf8');
  runbook = existsSync(`${RUNBOOKS}safety-removal.md`) ? readFileSync(`${RUNBOOKS}safety-removal.md`, 'utf8') : null;
  migrations = readdirSync(MIGRATIONS).filter((f) => f.endsWith('.sql')).map((f) => readFileSync(`${MIGRATIONS}${f}`, 'utf8'));
});

describe('[FR-POL-02] a report of apparent child sexual abuse material gets an acknowledgement only', () => {
  const KEY = 'policy.abuseMaterialReport';
  const asks = (body: string) => ASKS_FOR_MATERIAL.filter((re) => re.test(bodyText(body)));

  it('[FR-POL-02] the macro exists, goes only to the person who reported, and asks for no attachment, picture or link', () => {
    const md = readMacrosFile();
    const m = parseMacros(md).get(KEY);
    expect(m, `docs/support/macros.md has no ${KEY}`).toBeDefined();
    expect(asks(m!.body)).toEqual([]);
    expect(bodyText(m!.body)).not.toMatch(/\?/);
    const rows = parseSends(md).filter((s) => /abuse material/i.test(s.situation));
    expect(rows.map((s) => s.key)).toEqual([KEY]);
    expect(rows.map((s) => s.recipient)).toEqual(['The person who reported']);
    // No timing or follow-up promise to the reporter: the first action is internal, not a published time (FR-BKO-13).
    expect(bodyText(m!.body)).not.toMatch(/\b(today|tonight|tomorrow|within|hours?|days?|soon|let you know|keep you|update you|police|authorities)\b/i);
    // CLO-46: "with the right person" could read as passed to the authorities, or as a promise that we act.
    expect(bodyText(m!.body)).not.toMatch(/right person|passed (it )?on|handed (it )?over/i);
  });

  it('[FR-POL-02] says never to open, forward or delete an attachment, to leave the message where it arrived, and that the exec team gets the kind and date the same day', () => {
    const m = parseMacros(readMacrosFile()).get(KEY)!;
    expect(m.notes.Never).toMatch(/open/);
    expect(m.notes.Never).toMatch(/forward/);
    expect(m.notes.Never).toMatch(/quote/);
    expect(m.notes.Never).toMatch(/delete/);
    expect(m.notes.Never).toMatch(/\bmove\b/);
    expect(m.notes.Never).toMatch(/Leave the message where it arrived/);
    expect(m.notes.Never).toMatch(/no Claude session or connector reads it/);
    expect(m.notes['Same day']).toMatch(/only after a licensed lawyer advises/);
    expect(m.notes['Same day']).toMatch(/exec team/);
    expect(m.notes['Same day']).toMatch(/kind and the date only/);
    expect(m.notes['Before it']).toMatch(/M6/);
  });

  it('[FR-POL-02] the check fails on planted replies that ask for the material, a picture of it or where it is', () => {
    for (const planted of [
      'Please forward us a screenshot so we can look.',
      'If you still have the images, email them to us.',
      'You can paste the address of the page in your reply.',
      'Could you show us the video?',
      'Post the link here and we will look.',
      'Please forward the email to us.',
      'Send us what you saw.',
      'Reply with the details so we can act.',
      'Tell us where you saw it.',
      'Please provide the link.',
      'Please give us the URL.',
      'Let us know where you saw it.',
      'Please send it to us.',
      'Please forward it to us.',
      'Please tell us more about what you saw.',
      'Keep a copy of it for us.',
      'Please tell us which book it was in.',
    ]) {
      expect(asks(`Hi,\n\nThanks. ${planted}\n`), planted).not.toEqual([]);
    }
  });
});

describe('[FR-POL-03] content that reaches another person needs its report set before a store build turns it on', () => {
  it('[FR-POL-03] every EXPO_PUBLIC switch in eas.json is classified, and no hosting switch is on without its report set', () => {
    expect(reportSetFindings(profiles, SWITCHES, reportSetCards(reportSetMd))).toEqual([]);
  });

  it('[FR-POL-03] fails on a planted sharing switch that is on in the store build with no report set', () => {
    const planted: typeof SWITCHES = { ...SWITCHES, EXPO_PUBLIC_SHARE_HOSTED: { hosts: 'NS-05 Level 2', why: 'planted' } };
    const store = profiles.find(isStoreBuild)!;
    const withFlag = profiles.map((p) => (p === store ? { ...p, env: { ...p.env, EXPO_PUBLIC_SHARE_HOSTED: 'on' } } : p));
    expect(reportSetFindings(withFlag, planted, reportSetCards(reportSetMd))).toEqual([
      `${store.name}: EXPO_PUBLIC_SHARE_HOSTED is on and NS-05 Level 2 has no complete row in docs/ops/runbooks/report-set.md (FR-POL-03)`,
    ]);
    const complete = `${reportSetMd}| NS-05 Level 2 | Report row, 2 working days | Remove the page | hello@ | No filter, counsel read |\n`;
    expect(reportSetFindings(withFlag, planted, reportSetCards(complete))).toEqual([]);
    const tbd = `${reportSetMd}| NS-05 Level 2 | TBD | Remove the page | hello@ | No filter |\n`;
    expect(reportSetFindings(withFlag, planted, reportSetCards(tbd))).not.toEqual([]);
  });

  it('[FR-POL-03] a hosting switch on in a TestFlight profile sent beyond Family needs its report set (CR-234)', () => {
    const planted: typeof SWITCHES = { ...SWITCHES, EXPO_PUBLIC_SHARE_HOSTED: { hosts: 'NS-05 Level 2', why: 'planted' } };
    const preview = profiles.find((p) => p.name === 'preview')!;
    const flagged = { ...preview, distribution: 'store', env: { ...preview.env, EXPO_PUBLIC_SHARE_HOSTED: 'on' } };
    expect(reportSetFindings([{ ...flagged, groups: ['Family'] }], planted, reportSetCards(reportSetMd))).toEqual([]);
    expect(reportSetFindings([{ ...flagged, groups: ['Family', 'Friends'] }], planted, reportSetCards(reportSetMd))).toEqual([
      'preview: EXPO_PUBLIC_SHARE_HOSTED is on and NS-05 Level 2 has no complete row in docs/ops/runbooks/report-set.md (FR-POL-03)',
    ]);
  });

  it('[FR-POL-03] a hosting switch fails closed: `1` or `true` counts as on', () => {
    expect(['on', 'ON', '1', 'true', 'yes'].every(hostingSwitchOn)).toBe(true);
    expect(['', ' ', 'off', '0', 'false', undefined].some(hostingSwitchOn)).toBe(false);
  });

  it('[FR-POL-03] fails on a new switch nobody classified', () => {
    const store = profiles.find(isStoreBuild)!;
    const withNew = [{ ...store, env: { ...store.env, EXPO_PUBLIC_SOMETHING_NEW: 'on' } }];
    expect(reportSetFindings(withNew, SWITCHES, reportSetCards(reportSetMd))[0]).toMatch(/EXPO_PUBLIC_SOMETHING_NEW is not classified/);
  });

  it('[FR-POL-03] the table asks for a filter method, not only a decision (CCO-33)', () => {
    expect(reportSetMd.split('\n')).toContain(REPORT_SET_HEADER);
  });

  it('[FR-POL-03] distribution follows extends, and only an exact `internal` is exempt (CR-234)', () => {
    const ps = profilesFrom({
      build: {
        dev: { distribution: 'internal' },
        devChild: { extends: 'dev' },
        tf: { env: { EXPO_PUBLIC_APP_ENV: 'preview' } },
        tfChild: { extends: 'tf' },
        tfGrandchild: { extends: 'tfChild' },
        typo: { distribution: 'Store' },
      },
      submit: {
        devChild: { ios: { groups: ['Friends'] } },
        tfChild: { ios: { groups: ['Friends'] } },
        tfGrandchild: { ios: { groups: ['Friends'] } },
        typo: { ios: { groups: ['Friends'] } },
        tf: { ios: { groups: ['Family'] } },
      },
    });
    expect(ps.find((p) => p.name === 'devChild')!.distribution).toBe('internal');
    expect(ps.filter(reachesOutside).map((p) => p.name)).toEqual(['tfChild', 'tfGrandchild', 'typo']);
  });

  it('[FR-POL-03] only the App Store build reaches outside Family today, and the app decides the store build the same way', () => {
    expect(profiles.filter(isStoreBuild).map((p) => p.name)).toEqual(['production']);
    expect(profiles.filter(reachesOutside).map((p) => p.name)).toEqual(['production']);
    const alpha = readFileSync(`${ROOT}apps/mobile/src/lib/billing/alpha.ts`, 'utf8');
    expect(alpha).toMatch(/export function isAlphaBuild\(env: AppEnv\): boolean \{\s*return env !== 'production';\s*\}/);
  });
});

describe('[FR-POL-04] the two-parent book stays out of store builds until the safety-removal runbook and its tool exist', () => {
  it('[FR-POL-04] safety-removal.md exists as a draft for the exec-team counsel read', () => {
    expect(runbook).not.toBeNull();
    expect(runbook!).toMatch(/^Status: (DRAFT|APPROVED)\b/m);
    expect(runbook!).toMatch(/D-172/);
    expect(runbook!).toMatch(/^Tool: /m);
  });

  it('[FR-POL-04] no store build opens the invite flow while the runbook or the tool is missing', () => {
    expect(safetyRemovalFindings(profiles, inviteDestination, safetyState(runbook, migrations))).toEqual([]);
  });

  it('[FR-POL-04] fails when a store build would open the invite flow today', () => {
    const opens: typeof inviteDestination = () => 'flow';
    const findings = safetyRemovalFindings(profiles, opens, safetyState(runbook, migrations));
    expect(findings.some((f) => /not APPROVED/.test(f))).toBe(true);
    expect(findings.some((f) => /access tool/.test(f))).toBe(true);
  });

  // These planted cases set the store build's servers on, so they still test the gate if production's switch is off.
  const serversOn = (ps: Profile[]): Profile[] =>
    ps.map((p) => (isStoreBuild(p) ? { ...p, env: { ...p.env, EXPO_PUBLIC_SERVER_FEATURES: 'on' } } : p));

  it('[FR-POL-04] fails when only one entry opens in the store build, whichever entry it is', () => {
    const state = safetyState(runbook, migrations);
    for (const entry of INVITE_ENTRIES) {
      const oneOpens: typeof inviteDestination = (e, s, a) => (e === entry && s ? 'flow' : inviteDestination(e, s, a));
      const findings = safetyRemovalFindings(serversOn(profiles), oneOpens, state);
      expect(findings.length, entry).toBeGreaterThan(0);
      expect(findings[0], entry).toContain(`opens from ${entry}`);
    }
  });

  it('[FR-POL-04] passes the store build its server switch, so a rule that opens only with servers on is caught', () => {
    const serversOnly: typeof inviteDestination = (_e, s) => (s ? 'flow' : 'coming_soon');
    expect(safetyRemovalFindings(serversOn(profiles), serversOnly, safetyState(runbook, migrations))).not.toEqual([]);
    const store = profiles.find(isStoreBuild)!;
    const serversOff = [{ ...store, env: { ...store.env, EXPO_PUBLIC_SERVER_FEATURES: 'off' } }];
    expect(safetyRemovalFindings(serversOff, serversOnly, safetyState(runbook, migrations))).toEqual([]);
  });

  it('[FR-POL-04] a TestFlight profile with servers on fails once it is sent beyond Family (CR-234)', () => {
    const preview = profiles.find((p) => p.name === 'preview')!;
    const state = safetyState(runbook, migrations);
    const inside = [{ ...preview, distribution: 'store', env: { ...preview.env, EXPO_PUBLIC_SERVER_FEATURES: 'on' }, groups: ['Family'] }];
    expect(safetyRemovalFindings(inside, inviteDestination, state)).toEqual([]);
    for (const groups of [['Family', 'Friends'], ['Friends'], undefined]) {
      const outside = [{ ...inside[0], groups }];
      const findings = safetyRemovalFindings(outside, inviteDestination, state);
      expect(findings.length, JSON.stringify(groups)).toBeGreaterThan(0);
      expect(findings[0]).toMatch(/^preview: the two-parent book opens from /);
    }
    const internal = [{ ...inside[0], groups: ['Friends'], distribution: 'internal' }];
    expect(safetyRemovalFindings(internal, inviteDestination, state)).toEqual([]);
  });

  it('[FR-POL-04] passes only when the runbook is APPROVED and its named tool is created in a migration', () => {
    const opens: typeof inviteDestination = () => 'flow';
    const approved = 'Status: APPROVED\nTool: `public.ops_limit_book_access`\n';
    const sql = 'create or replace function public.ops_limit_book_access(p_book uuid) returns void language sql as $$ select 1 $$;';
    expect(safetyRemovalFindings(profiles, opens, safetyState(approved, [sql]))).toEqual([]);
    expect(safetyRemovalFindings(profiles, opens, safetyState(approved, []))).not.toEqual([]);
    expect(safetyRemovalFindings(profiles, opens, safetyState(approved.replace('APPROVED', 'DRAFT'), [sql]))).not.toEqual([]);
  });
});
