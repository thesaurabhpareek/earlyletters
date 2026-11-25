/**
 * BL-1355, FR-MSG-14 (docs/product/prd/functions/messaging-and-entry-points.md): in v1 no email goes to an address a
 * parent types for someone else. The co-parent invite is a link the parent shares from their own messages.
 *
 * "Built" here means wired to a send path. The two invite templates, `coparent-invite` and `welcome-coparent`, stay
 * in this package (src/templates, generated/resend.ts) and its tests render them; this file does not touch them. It
 * proves three things:
 *  (a) no sender references either template. Senders are every source file under SENDER_ROOTS (the edge functions,
 *      the app, the website, which already sends mail through Resend in apps/web/src/lib/notify, the server packages
 *      and scripts), excluding test folders and test files and excluding packages/emails itself. The matcher finds a
 *      template three ways: its id as a quoted string ('coparent-invite', "coparent-invite" or `coparent-invite`), which
 *      is how a send names a template (renderForResend('account-deleted', ...), authEmails['new-device-sign-in']); its
 *      module imported by path (.../family/coparent-invite); and its export names, case-sensitive (coparentInvite,
 *      welcomeCoparent, CoparentInviteEmail, WelcomeCoparentEmail). It does not match the app's function
 *      createCoParentInvite (apps/mobile/src/lib/family/invites.ts, capital P), which makes a share link and sends no
 *      email. Planted senders below prove each way fails. An id built from parts at run time (`coparent-${kind}`)
 *      cannot be caught by a static scan; a review has to.
 *  (b) docs/emails/CATALOG.md marks both rows "not built";
 *  (c) the invite sheet's words never say we will email the person invited.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { en } from '../../content/src/strings.en';
import { familyCopy } from '../../content/src/features/family.en';

const REPO = join(__dirname, '..', '..', '..');
const INVITE_TEMPLATE_IDS = ['coparent-invite', 'welcome-coparent'] as const;
const SENDER_ROOTS = ['supabase/functions', 'apps/mobile/src', 'apps/web/src', 'packages/api/src', 'packages/core/src', 'scripts'];

/** Every source file under `rel`, skipping node_modules, test folders and test files. */
function senderFiles(rel: string): string[] {
  const root = join(REPO, rel);
  if (!existsSync(root)) return [];
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) {
        if (name === 'node_modules' || name === 'test' || name === 'tests' || name === '__tests__') continue;
        walk(full);
      } else if (/\.(ts|tsx|mts|cts|js|mjs|cjs)$/.test(name) && !/\.(test|spec)\.[a-z]+$/.test(name)) {
        out.push(full);
      }
    }
  };
  walk(root);
  return out;
}

/** The lines of `source` that name an invite template: quoted id, module path or export name. */
function inviteTemplateReferences(source: string): string[] {
  const id = INVITE_TEMPLATE_IDS.map((t) => t.replace('-', '\\-')).join('|');
  const quoted = new RegExp(`(['"\`])(${id})\\1`);
  const byPath = new RegExp(`/(${id})(\\.[a-z]+)?['"\`]`);
  const byExport = /\b(coparentInvite|welcomeCoparent|CoparentInviteEmail|WelcomeCoparentEmail)\b/;
  return source.split('\n').filter((line) => quoted.test(line) || byPath.test(line) || byExport.test(line));
}

type Leaf = { path: string; text: string };
function leaves(value: unknown, path: string): Leaf[] {
  if (typeof value === 'string') return [{ path, text: value }];
  if (Array.isArray(value)) return value.flatMap((v, i) => leaves(v, `${path}[${i}]`));
  if (value && typeof value === 'object') return Object.entries(value).flatMap(([k, v]) => leaves(v, `${path}.${k}`));
  return [];
}

/** Words that would promise an email to the person invited. */
const PROMISES_INVITE_EMAIL = [
  /\bwe['’]ll email\b/i,
  /\bwe will email\b/i,
  /\bwe email\b/i,
  /\bemail them\b/i,
  /\bwe['’]ll send (?:them|it) (?:an |by )?email\b/i,
  /\bwe will send (?:them|it) (?:an |by )?email\b/i,
];

describe('[FR-MSG-14] no invite email to an address a parent types: both invite templates are not built', () => {
  it('[FR-MSG-14] no sender path references coparent-invite or welcome-coparent as a template id', () => {
    const files = SENDER_ROOTS.flatMap(senderFiles);
    // Guard against scanning nothing: a real sender and the invite code must be in the set.
    expect(files.some((f) => f.endsWith(join('purge-worker', 'emails.ts')))).toBe(true);
    expect(files.some((f) => f.endsWith(join('lib', 'family', 'invites.ts')))).toBe(true);
    expect(files.some((f) => f.endsWith(join('lib', 'notify', 'welcome-email.ts')))).toBe(true);
    const found = files.flatMap((f) => inviteTemplateReferences(readFileSync(f, 'utf8')).map((l) => `${f.slice(REPO.length + 1)}: ${l.trim()}`));
    expect(found).toEqual([]);
  });

  it('[FR-MSG-14] the matcher fails on a planted sender that sends an invite template, and not on the share-link code', () => {
    const planted = [
      "import { renderForResend } from '../../../packages/emails/generated/resend.ts';",
      "export const invite = (v: Values) => renderForResend('coparent-invite', v);",
      'export const welcome = (v: Values) => renderForResend("welcome-coparent", v);',
      'const copy = familyEmails[`coparent-invite`];',
      "import CoparentInviteEmail from '../../../packages/emails/src/templates/family/coparent-invite';",
      "import Welcome from '@scribe/emails/src/templates/lifecycle/welcome-coparent.tsx';",
      'const html = render(templates.family.coparentInvite.default(v));',
    ].join('\n');
    expect(inviteTemplateReferences(planted)).toHaveLength(6);
    // The app's invite code names the function and the RPC, never a template id.
    const shareLink = readFileSync(join(REPO, 'apps/mobile/src/lib/family/invites.ts'), 'utf8');
    expect(shareLink).toContain('createCoParentInvite');
    expect(inviteTemplateReferences(shareLink)).toEqual([]);
  });

  it('[FR-MSG-14] the catalog rows for coparent-invite and welcome-coparent say "not built"', () => {
    const catalog = readFileSync(join(REPO, 'docs/emails/CATALOG.md'), 'utf8').split('\n');
    for (const id of INVITE_TEMPLATE_IDS) {
      const row = catalog.find((l) => l.startsWith(`| \`${id}\` |`));
      expect(row, `no catalog row for ${id}`).toBeDefined();
      expect(row!, `catalog row for ${id}`).toMatch(/not built/i);
      expect(row!).toMatch(/FR-MSG-14/);
    }
    // Decision E-3 says invites are not emailed in v1.
    const e3 = catalog.find((l) => l.startsWith('| E-3 |'));
    expect(e3).toMatch(/Not built in v1 \(FR-MSG-14/);
  });

  it('[FR-MSG-14] the invite sheet never says we will email the person invited', () => {
    // The co-parent invite sheet (familyCopy, src/features/family.en.ts), the first-run invite card
    // (en.onboarding.invite) and the v1.1 family invite words (en.family).
    const surfaces = [...leaves(familyCopy, 'familyCopy'), ...leaves(en.onboarding.invite, 'en.onboarding.invite'), ...leaves(en.family, 'en.family')];
    expect(surfaces.length).toBeGreaterThan(20);
    const promises = surfaces.filter((l) => PROMISES_INVITE_EMAIL.some((re) => re.test(l.text)));
    expect(promises).toEqual([]);
    // The patterns catch the sentence the requirement names.
    expect(PROMISES_INVITE_EMAIL.some((re) => re.test("We'll email them a link to join."))).toBe(true);
    for (const planted of [
      "We'll email them a link to join.",
      'We will email them the invite.',
      'We email your co-parent a link.',
      'Type their address and email them from here.',
      "We'll send them an email with the link.",
      'We will send it by email.',
    ]) {
      const hits = PROMISES_INVITE_EMAIL.filter((re) => re.test(planted));
      expect(hits.length, planted).toBeGreaterThan(0);
    }
    // Each pattern catches at least one planted line, so none can be dropped unnoticed.
    const plantedLines = ["We'll email them.", 'We will email them.', 'We email them.', 'Email them now.', "We'll send them an email.", 'We will send them an email.'];
    expect(PROMISES_INVITE_EMAIL).toHaveLength(plantedLines.length);
    PROMISES_INVITE_EMAIL.forEach((re, i) => expect(re.test(plantedLines[i]), String(re)).toBe(true));
  });
});
