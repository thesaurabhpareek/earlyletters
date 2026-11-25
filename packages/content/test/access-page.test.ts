/**
 * The access page (BL-1330, FR-BKO-01). `docs/ops/ACCESS.md` answers "who can see what": the role by data class
 * matrix, the console list with owner and recovery path, and the sentence that no staff tool shows a family's
 * content. The Privacy Policy promises "Today only the founder has that access" (section 3). The day the page lists
 * a second role with production access, that sentence is false, so the two are read together here and a mismatch
 * fails. The fix is the policy sentence first, with counsel (FR-BKO-18, Q-BKO-3), never this test.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const REPO = join(__dirname, '..', '..', '..');
const ACCESS = join(REPO, 'docs', 'ops', 'ACCESS.md');
const LEGAL = join(REPO, 'docs', 'legal');

const NO_CONTENT_SENTENCE = 'No staff tool shows entry text, audio, pictures or child names.';
const CONSOLES = [
  'Apple Developer and App Store Connect',
  'Supabase',
  'Vercel',
  'Porkbun',
  'Resend',
  'PostHog',
  'GitHub',
  'Expo',
  'Google Cloud',
  'Password manager',
];
const MATRIX_HEADER = /^\| Data \(class\) \| Parent \| Founder \| Agents \(any role\) \| A future second person \| Enforced by tech today \|$/m;
const ONLY_FOUNDER = /only the founder has (?:that |this )?access/i;

/** The roles under "## Who holds production access today", one `- role` line each; null when the section is missing. */
export function productionRoles(page: string): string[] | null {
  const m = page.match(/^## Who holds production access today\n([\s\S]*?)(?=^## |(?![\s\S]))/m);
  if (!m) return null;
  return m[1]
    .split('\n')
    .map((l) => l.match(/^\s*(?:[-*+]|\d+[.)])\s+(.+?)\s*$/)?.[1])
    .filter((r): r is string => Boolean(r))
    .map((r) => r.toLowerCase());
}

/** Problems between the page and the policy texts: empty means they agree. Fails closed on a missing list. */
export function accessConflicts(page: string, policies: { file: string; text: string }[]): string[] {
  const roles = productionRoles(page);
  if (roles === null) return ['ACCESS.md has no "Who holds production access today" list'];
  if (roles.length === 0) return ['ACCESS.md lists no role with production access'];
  const promising = policies.filter((p) => ONLY_FOUNDER.test(p.text)).map((p) => p.file);
  const others = roles.filter((r) => r !== 'founder');
  return promising.length && others.length
    ? [`${promising.join(', ')} says only the founder has access, and ACCESS.md lists: ${others.join(', ')}`]
    : [];
}

function markdownFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return markdownFiles(full);
    return name.endsWith('.md') ? [full] : [];
  });
}

const page = readFileSync(ACCESS, 'utf8');
const policies = markdownFiles(LEGAL).map((f) => ({ file: f.slice(REPO.length + 1), text: readFileSync(f, 'utf8') }));

describe('the access page', () => {
  it('[FR-BKO-01] holds the matrix of data class by role, with the enforced-by-tech column', () => {
    expect(page).toMatch(MATRIX_HEADER);
    for (const cls of ['(L4)', '(L3)', 'Audit log rows', 'The mailbox', 'Secrets, signing keys, service role']) {
      expect(page, cls).toContain(cls);
    }
  });

  it('[FR-BKO-01] lists every console with an owner and a recovery path, and holds no secret value', () => {
    const table = page.match(/^## Consoles\n[\s\S]*?(?=^## )/m)?.[0] ?? '';
    expect(table).toMatch(/^\| Console \| Owner \| What it can reach \| Recovery path \|$/m);
    for (const c of CONSOLES) {
      const row = table.split('\n').find((l) => l.startsWith(`| ${c}`));
      expect(row, c).toBeDefined();
      const cells = row!.split('|').map((x) => x.trim()).filter(Boolean);
      expect(cells, c).toHaveLength(4);
      expect(cells[1], c).toBe('founder');
      expect(cells[3].length, c).toBeGreaterThan(10);
    }
    expect(page).not.toMatch(/\b(?:sb_secret_|sbp_|sk-ant-|sk-or-|ghp_|github_pat_|phx_|re_[A-Za-z0-9]{8}_)/);
    expect(page).not.toMatch(/-----BEGIN/);
  });

  it('[FR-BKO-01] carries the sentence that no staff tool shows entry text, audio, pictures or child names', () => {
    expect(page).toContain(NO_CONTENT_SENTENCE);
  });

  it('[FR-BKO-01] agrees with the Privacy Policy on who holds production access today', () => {
    expect(policies.some((p) => ONLY_FOUNDER.test(p.text)), 'the policy sentence this test guards').toBe(true);
    expect(productionRoles(page)).toEqual(['founder']);
    expect(accessConflicts(page, policies)).toEqual([]);
  });

  it('[FR-BKO-01] counts a second role written with any list marker', () => {
    for (const marker of ['*', '+', '1.', '2)', '  -']) {
      const planted = page.replace(/^- founder$/m, `- founder\n${marker} support lead`);
      expect(productionRoles(planted), marker).toEqual(['founder', 'support lead']);
      expect(accessConflicts(planted, policies).length, marker).toBe(1);
    }
  });

  it('[FR-BKO-01] fails when the page lists a second role while a policy says only the founder has access', () => {
    const planted = page.replace(/^- founder$/m, '- founder\n- support lead');
    expect(accessConflicts(planted, policies)).toEqual([
      expect.stringMatching(/privacy-policy\.md says only the founder has access, and ACCESS\.md lists: support lead/),
    ]);
    // Once the policy sentence has changed, a second role is allowed.
    const changed = policies.map((p) => ({ ...p, text: p.text.replace(ONLY_FOUNDER, 'the founder and one named person have access') }));
    expect(accessConflicts(planted, changed)).toEqual([]);
  });

  it('[FR-BKO-01] fails closed when the production access list is missing or empty', () => {
    const missing = page.replace(/^## Who holds production access today$/m, '## Access');
    expect(accessConflicts(missing, policies)).toEqual(['ACCESS.md has no "Who holds production access today" list']);
    const empty = page.replace(/^- founder$/m, '');
    expect(accessConflicts(empty, policies)).toEqual(['ACCESS.md lists no role with production access']);
  });

  it('[FR-BKO-21] writes the agents-hold-no-production-power rule once, and names the test that enforces it', () => {
    const rule = page.match(/^## Agents hold no production power \(FR-BKO-21\)\n[\s\S]*?(?=^## )/m)?.[0] ?? '';
    for (const name of ['service role key', 'signing keys', 'backup key', 'password manager', 'mail, Supabase or Vercel connector']) {
      expect(rule, name).toContain(name);
    }
    expect(rule).toContain('scripts/ops/test/agent-env.test.ts');
    expect(page.match(/^## Agents hold no production power/gm)).toHaveLength(1);
  });
});
