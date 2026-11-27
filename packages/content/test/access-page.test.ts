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
const LEGAL = [join(REPO, 'docs', 'legal'), join(REPO, 'apps', 'web', 'content', 'legal')];

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
const ONLY_FOUNDER = /only the founder has (?:that |this )?access|access to our systems is limited to the founder/i;

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
/**
 * Only the version in force of each policy: a published version is immutable and stays in the repo once a newer one
 * replaces it (docs/legal/POLICY_VERSIONING.md), so for `name-1.2.3.md` or `1.2.3.md` files only the highest
 * version in each folder is read. Files without a version are always read.
 */
export function inForce(files: string[]): string[] {
  const best = new Map<string, { file: string; v: number[] }>();
  const plain: string[] = [];
  for (const file of files) {
    const m = file.match(/^(.*?)(\d+)\.(\d+)\.(\d+)\.md$/);
    if (!m) {
      plain.push(file);
      continue;
    }
    const v = [Number(m[2]), Number(m[3]), Number(m[4])];
    const seen = best.get(m[1]);
    const order = seen ? v[0] - seen.v[0] || v[1] - seen.v[1] || v[2] - seen.v[2] : 1;
    if (order > 0) best.set(m[1], { file, v });
  }
  return [...plain, ...[...best.values()].map((b) => b.file)].sort();
}

const policies = inForce(LEGAL.flatMap(markdownFiles)).map((f) => ({ file: f.slice(REPO.length + 1), text: readFileSync(f, 'utf8') }));

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
    const published = policies.filter((p) => p.file.startsWith('apps/web/content/legal/') && ONLY_FOUNDER.test(p.text));
    expect(published.length, 'the published site policy is read too').toBeGreaterThan(0);
    expect(productionRoles(page)).toEqual(['founder']);
    expect(accessConflicts(page, policies)).toEqual([]);
  });

  it('[FR-BKO-01] reads only the version in force of a versioned policy', () => {
    expect(inForce(['a/privacy/0.9.0.md', 'a/privacy/1.0.0.md', 'a/terms/0.10.0.md', 'a/terms/0.9.9.md', 'b/x-0.9.0.md', 'b/x-0.10.0.md', 'c/plain.md'])).toEqual([
      'a/privacy/1.0.0.md',
      'a/terms/0.10.0.md',
      'b/x-0.10.0.md',
      'c/plain.md',
    ]);
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
      expect.stringMatching(/privacy-policy\.md.* says only the founder has access, and ACCESS\.md lists: support lead/),
    ]);
    // Once the policy sentence has changed, a second role is allowed.
    const every = new RegExp(ONLY_FOUNDER.source, 'gi');
    const change = (p: { file: string; text: string }) => ({ ...p, text: p.text.replace(every, 'the founder and one named person have access') });
    expect(accessConflicts(planted, policies.map(change))).toEqual([]);
    // Changing only docs/legal is not enough while the published site policy still promises founder-only access.
    const draftOnly = policies.map((p) => (p.file.startsWith('docs/legal/') ? change(p) : p));
    expect(accessConflicts(planted, draftOnly)).toEqual([expect.stringMatching(/apps\/web\/content\/legal\/privacy\/0\.9\.0\.md says only the founder/)]);
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
