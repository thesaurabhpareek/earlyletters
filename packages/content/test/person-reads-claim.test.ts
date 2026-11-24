/**
 * BL-1355: the email footer promise as a claims row (FR-MSG-12), and the "sign-in mail stopped" runbook (FR-MSG-15).
 * Requirement rows: docs/product/prd/functions/messaging-and-entry-points.md.
 *
 * FR-MSG-12. The footer line "A person reads every one." (src/emails/chrome.en.ts) must be a row in the claims
 * inventory with an owner, a mailbox read at least every working day, and a reply target. The row lives in
 * docs/reviews/2026-10-claims-inventory.md, section 3g, because docs/legal/** (where CLAIMS-1.0.md lives) is not
 * edited by builders. The reply target must be the one docs/emails/CATALOG.md section 9 states, so the two cannot
 * drift apart. The auto-reply check is deliberately narrow: it scans the repository's own sources that can put words
 * in an email (packages/content/src, supabase/functions, supabase/templates) for wording that would tell a person no
 * one reads their reply. It cannot see an auto-responder switched on in the hosted mailbox; the row says so.
 *
 * FR-MSG-15. The runbook docs/ops/runbooks/sign-in-mail-stopped.md exists and names the three outages and the three
 * things that keep working. This proves the page exists and covers them, not that any step in it has been run.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { authCopy } from '../src';
import { emailChrome } from '../src/emails/chrome.en';

const REPO = join(__dirname, '..', '..', '..');
const read = (rel: string) => readFileSync(join(REPO, rel), 'utf8');

const INVENTORY = 'docs/reviews/2026-10-claims-inventory.md';
const CATALOG = 'docs/emails/CATALOG.md';
const RUNBOOK = 'docs/ops/runbooks/sign-in-mail-stopped.md';
const CLAIM = 'A person reads every one.';

/** The header cells and the row cells of the first table row in `markdown` whose cells include `needle`. */
function rowWith(markdown: string, needle: string): Record<string, string> | null {
  const lines = markdown.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].startsWith('|') || !lines[i].includes(needle)) continue;
    // Walk up to the header: the line above the |---| separator of this table.
    let sep = i - 1;
    while (sep > 0 && !/^\|\s*-{3}/.test(lines[sep])) sep--;
    const cells = (line: string) => line.split('|').slice(1, -1).map((c) => c.trim());
    const header = cells(lines[sep - 1]);
    const row = cells(lines[i]);
    return Object.fromEntries(header.map((h, k) => [h, row[k] ?? '']));
  }
  return null;
}

/** The roster's agent handles, so an owner is a real lane and not a placeholder. */
function rosterHandles(): string[] {
  const roster = JSON.parse(read('agents/roster.json')) as { agents: { handle: string }[] };
  return roster.agents.map((a) => a.handle);
}

/** Every file under `rel` with one of `exts`, skipping node_modules and test folders and files. */
function sourceFiles(rel: string, exts: RegExp): string[] {
  const root = join(REPO, rel);
  if (!existsSync(root)) return [];
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) {
        if (name === 'node_modules' || name === 'test' || name === 'tests') continue;
        walk(full);
      } else if (exts.test(name) && !/\.test\.[a-z]+$/.test(name)) {
        out.push(full);
      }
    }
  };
  walk(root);
  return out;
}

/**
 * Wording that would contradict "a person reads every one": a no-reply sender, a request not to reply, a mailbox
 * nobody reads, or an automated answer. Matched case-insensitively against each line.
 */
const CONTRADICTS_CLAIM = [
  /\bno-?reply@/i,
  /\bdo not reply\b/i,
  /\bdon['’]t reply\b/i,
  /\bnot monitored\b/i,
  /\bunmonitored\b/i,
  /\b(?:no one|nobody) reads\b/i,
  /\bautomat(?:ed|ic) (?:reply|response|answer|message)\b/i,
  /\bauto-?(?:reply|replies|responder)\b/i,
];

function contradictingLines(text: string): string[] {
  return text.split('\n').filter((line) => CONTRADICTS_CLAIM.some((re) => re.test(line)));
}

describe('[FR-MSG-12] "A person reads every one" is a claims row with an owner, a mailbox cadence and a reply target', () => {
  it('[FR-MSG-12] the footer still makes the claim the inventory row quotes', () => {
    expect(emailChrome.footer.transactional.some((l) => l.includes(CLAIM))).toBe(true);
    const row = rowWith(read(INVENTORY), CLAIM);
    expect(row, `no row in ${INVENTORY} quotes "${CLAIM}"`).not.toBeNull();
    expect(row!.Claim).toContain(CLAIM);
  });

  it('[FR-MSG-12] the row names an owner lane, the mailbox read every working day, and the catalog reply target', () => {
    const row = rowWith(read(INVENTORY), CLAIM)!;
    // Owner: at least one agent handle from the roster, in backticks.
    const owners = [...(row.Owner ?? '').matchAll(/`([a-z-]+)`/g)].map((m) => m[1]);
    expect(owners.some((h) => rosterHandles().includes(h)), `owner cell: ${row.Owner}`).toBe(true);
    // Mailbox and cadence: the support address and "at least every working day".
    const mailbox = row['Mailbox and cadence'] ?? '';
    expect(mailbox).toMatch(/hello@earlyletters\.com/);
    expect(mailbox).toMatch(/at least every working day/i);
    // Reply target: the same "within N working days" the catalog's section 9 states, and where it will be stated.
    const target = row['Reply target'] ?? '';
    const catalogTarget = /replies (within \d+ working days)/.exec(read(CATALOG))?.[1];
    expect(catalogTarget, 'CATALOG.md no longer states a reply target').toBeDefined();
    expect(target).toContain(catalogTarget!);
    expect(target).toMatch(/help centre/i);
    expect(target).toMatch(/FR-SUP-04/);
    // Auto-reply: the cell exists and says there is none at v1.0.
    expect(row['Auto-reply'] ?? '').toMatch(/^None at v1\.0/);
  });

  it('[FR-MSG-12] no source that writes email words carries an auto-reply or no-reply line that contradicts it', () => {
    const files = [
      ...sourceFiles('packages/content/src', /\.tsx?$/),
      ...sourceFiles('supabase/functions', /\.tsx?$/),
      ...sourceFiles('supabase/templates', /\.(html|txt|json)$/),
    ];
    // Guard against scanning nothing: the footer source and an auth template must be in the set.
    expect(files.some((f) => f.endsWith(join('emails', 'chrome.en.ts')))).toBe(true);
    expect(files.some((f) => f.endsWith('magic_link.html'))).toBe(true);
    const found = files.flatMap((f) => contradictingLines(readFileSync(f, 'utf8')).map((l) => `${f.slice(REPO.length + 1)}: ${l.trim()}`));
    expect(found).toEqual([]);
  });

  it('[FR-MSG-12] the auto-reply matcher catches a planted contradiction and passes the footer line', () => {
    expect(contradictingLines('Thanks for writing. This is an automated reply; this mailbox is not monitored.')).toHaveLength(1);
    expect(contradictingLines('From: Early Letters <no-reply@earlyletters.com>')).toHaveLength(1);
    expect(contradictingLines('Please do not reply to this email.')).toHaveLength(1);
    expect(contradictingLines('Questions? Reply to this email. A person reads every one.')).toEqual([]);
    expect(contradictingLines("Didn't sign up? Reply to this email and we'll fix it.")).toEqual([]);
  });
});

describe('[FR-MSG-15] a "sign-in mail stopped" runbook exists', () => {
  const runbook = () => read(RUNBOOK);

  it('[FR-MSG-15] the runbook exists under docs/ops/runbooks', () => {
    expect(existsSync(join(REPO, RUNBOOK))).toBe(true);
  });

  it('[FR-MSG-15] it names the three outages: the website, the mail service and the email cap', () => {
    const text = runbook();
    expect(text).toMatch(/earlyletters\.com.{0,40}\bdown\b|website is down/i);
    expect(text).toMatch(/Resend/);
    expect(text).toMatch(/mail service.{0,20}down|Resend is down/i);
    expect(text).toMatch(/cap is hit|cap hit/i);
  });

  it('[FR-MSG-15] it names the three things that still work and that first run needs no website page', () => {
    const text = runbook();
    expect(text).toMatch(/Sign in with Apple/);
    expect(text).toMatch(/code already sent/i);
    expect(text).toMatch(/Everything on the phone/i);
    expect(text).toMatch(/no first-run path needs a page on the website/i);
  });

  it('[FR-MSG-15] it keeps agents out of the vendor consoles and points to existing copy keys only', () => {
    const text = runbook();
    expect(text).toMatch(/Agents never open the Resend, Supabase, Vercel or Porkbun consoles/);
    expect(text).toMatch(/BL-2108/);
    // The copy keys it points to are named in it, and exist in the content package (it writes no words of its own).
    for (const key of ['errors.email_wait', 'errors.unknown', 'code.noMailHelp', 'code.resendWait', 'code.pausedOtherWays', 'outage.*']) {
      expect(text).toContain(`authCopy.${key}`);
    }
    expect(typeof authCopy.errors.email_wait).toBe('string');
    expect(typeof authCopy.errors.unknown).toBe('string');
    expect(typeof authCopy.code.noMailHelp).toBe('string');
    expect(typeof authCopy.code.resendWait).toBe('string');
    expect(typeof authCopy.code.pausedOtherWays).toBe('string');
    expect(typeof authCopy.outage.title).toBe('string');
  });
});
