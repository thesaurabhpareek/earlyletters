/**
 * Build 12 (servers on): the account, sign-in and deletion words say only what that build does.
 *
 * The profile this file judges against, in one place: sign-in and sync are ON; the Family tab, invites and every
 * co-parent surface are HIDDEN (BL-604, D-126, PRs #665 and #720); recording backup is OFF (EXPO_PUBLIC_BACKUP off);
 * speech and recordings stay on the phone that made them; letters sync to the account only after the sensitive-data
 * agreement. So on the sign-in, Account, Privacy, Where your letters live and Delete account surfaces:
 *
 *  - no line names a co-parent, an invite, "the same book", or a family that can read or write;
 *  - no line says anything is backed up, or names our recovery key or encrypted backup as a thing the build has;
 *  - no line says "Your letters are safe": it promises a protection the build does not give (no backup: a phone that
 *    is lost takes its recordings with it), and an error on a new phone is read on a phone that holds no letters.
 *    VOICE.md says what to write instead: what happened and where the words are, or "Nothing has changed".
 *
 * `HELD_FOR_COUNSEL` lists the lines that still say one of these, because they are registered disclosure text
 * (docs/legal/in-app-disclosures.md; REGISTERED in experience-pass.test.ts and server-surfaces-auth.test.ts) that only
 * counsel may change. The list may shrink and never grows (its cap is today's count). `ONLY_WITH_A_CO_PARENT` lists
 * lines the app shows only when a book already has a second parent, which this build cannot make.
 *
 * If a lane switches co-parent or backup on in a production profile, it removes the rows that become true in the same
 * pull request. Fix the copy, never this test.
 */
import { describe, expect, it } from 'vitest';
import { accountDeletionCopy, authCopy, en } from '../src';
import { leaves } from './support/copy-surfaces';

type Rule = { id: 'coParent' | 'backup' | 'safe'; claim: RegExp; truths?: readonly RegExp[] };

const RULES: readonly Rule[] = [
  {
    id: 'coParent',
    claim: /\bco-?parents?\b|\bother parent\b|\bsame book\b|\binvit(?:e|ed|es|ing|ations?)\b|\bfamily (?:you|members|sharing)\b|\bcan write in\b|\bshare it with\b/i,
  },
  {
    id: 'backup',
    claim: /\bbacked up\b|\bbacks? up\b|\bbacking up\b|\brecovery key\b|\bencrypted backup\b|\brecording backup\b|\bbackups?\b/i,
    // The person's own iPhone backup is true in every build, and the Erase page says exports and phone backups are not changed.
    truths: [/\biPhone backup\b/gi, /\biCloud Backup\b/gi, /\byour iPhone's own backup\b/gi, /\bbackups of this phone\b/gi],
  },
  { id: 'safe', claim: /\b(?:are|is) safe\b|\bkeeps? your (?:book|letters) safe\b/i },
];

/** Titles of rows that say, in the line beside them, that the thing is not in this build. */
const SAID_TO_BE_ABSENT = new Set(['en.whereLive.backupTitle']); // "Encrypted backup" beside "Not in this version"

const global = (re: RegExp) => new RegExp(re.source, re.flags.includes('g') ? re.flags : `${re.flags}g`);

export function claimsOf(rule: Rule, text: string): string[] {
  const rest = (rule.truths ?? []).reduce((t, truth) => t.replace(global(truth), ' '), text);
  return [...rest.matchAll(global(rule.claim))].map((m) => m[0].toLowerCase());
}

/** The surfaces a person sees in Build 12 that talk about accounts, sync, sharing, backup and deletion. */
const SURFACES: readonly (readonly [string, unknown])[] = [
  ['features.auth', authCopy],
  ['features.accountDeletion', accountDeletionCopy],
  ['en.settings.privacy', en.settings.privacy],
  ['en.settings.delete', en.settings.delete],
  ['en.whereLive', en.whereLive],
  ['en.sensitiveConsent', en.sensitiveConsent],
  ['en.trust.signIn', en.trust.signIn],
];

const ALL = SURFACES.flatMap(([root, value]) => leaves(value, root));

/**
 * Registered text (counsel's): still says a co-parent, an invite or "safe". Each row is a request to counsel in the
 * pull request that adds this file. `claim` is what the rule matches today.
 */
const HELD_FOR_COUNSEL: readonly { key: string; rule: Rule['id']; claim: string }[] = [
  { key: 'features.auth.sheet.privacy', rule: 'coParent', claim: 'invite' },
  { key: 'features.auth.sheet.why', rule: 'safe', claim: 'keeps your book safe' },
  { key: 'features.auth.consent.terms.body', rule: 'coParent', claim: 'family you' },
  { key: 'features.auth.consent.terms.body', rule: 'coParent', claim: 'invite' },
  { key: 'en.trust.signIn.privacy', rule: 'coParent', claim: 'invite' },
  { key: 'en.trust.signIn.why', rule: 'safe', claim: 'keeps your book safe' },
  { key: 'en.sensitiveConsent.body', rule: 'coParent', claim: 'share it with' },
  { key: 'en.sensitiveConsent.body', rule: 'coParent', claim: 'family you' },
];
const HELD_CAP = 8;

/** Shown only when a book already has a second parent or family writer, which Build 12 cannot create. */
const ONLY_WITH_A_CO_PARENT = new Set([
  'features.accountDeletion.what.staysNone',
  'features.accountDeletion.what.staysOne',
  'features.accountDeletion.what.staysMany',
  'features.accountDeletion.what.deletedFamily',
  'features.accountDeletion.what.contributor',
  'features.accountDeletion.what.coParentFallback',
  'features.accountDeletion.scheduled.body',
  'en.settings.delete.bookBodyCoParent',
]);

type Claim = { key: string; rule: Rule['id']; claim: string };
const id = (c: Claim) => `${c.key} [${c.rule}] "${c.claim}"`;

const found: Claim[] = ALL.flatMap(({ path, text }) =>
  RULES.flatMap((r) => ((r.id === 'coParent' && ONLY_WITH_A_CO_PARENT.has(path)) || SAID_TO_BE_ABSENT.has(path) ? [] : claimsOf(r, text).map((claim) => ({ key: path, rule: r.id, claim })))),
);

function beyond(a: readonly Claim[], b: readonly Claim[]): string[] {
  const left = new Map<string, number>();
  for (const c of b) left.set(id(c), (left.get(id(c)) ?? 0) + 1);
  return a.flatMap((c) => {
    const n = left.get(id(c)) ?? 0;
    if (n > 0) {
      left.set(id(c), n - 1);
      return [];
    }
    return [id(c)];
  });
}

describe('Build 12 account, sign-in and deletion copy claims only what the build does', () => {
  it('reads real surfaces', () => {
    expect(ALL.length).toBeGreaterThan(200);
    for (const key of ONLY_WITH_A_CO_PARENT) expect(ALL.some((l) => l.path === key), `${key} no longer exists: remove it from ONLY_WITH_A_CO_PARENT`).toBe(true);
  });

  it('makes no claim of a co-parent, an invite, a backup or "safe" beyond the lines held for counsel', () => {
    expect(beyond(found, HELD_FOR_COUNSEL), 'untrue in Build 12: fix the copy, do not add a row').toEqual([]);
  });

  it('lists only claims that still exist, so the counsel list shrinks', () => {
    expect(beyond(HELD_FOR_COUNSEL, found), 'these are fixed (or the key moved): remove them from HELD_FOR_COUNSEL').toEqual([]);
    expect(HELD_FOR_COUNSEL.length).toBeLessThanOrEqual(HELD_CAP);
  });

  it('the Delete account intro names no recording, photo or backup on our servers', () => {
    const intro = accountDeletionCopy.what.intro;
    expect(intro).toBe('Deleting your account removes your letters and books from our servers. You have 30 days to change your mind.');
    expect(intro).not.toMatch(/recording|photo|backup/i);
    expect('introProposed' in accountDeletionCopy.what, 'the proposed line named a recording backup, which Build 12 does not have').toBe(false);
  });

  it('the sign-in sheet promises the words of a letter on a new phone, never the recording or a second writer', () => {
    const { sheet, account } = authCopy;
    expect(sheet.titles.first_letter).toBe("Keep {child}'s words on any phone");
    for (const body of [sheet.bodies.first_letter, sheet.bodies.settings, account.signedOutBody]) {
      expect(body).toBe('The words of your letters come with you to a new phone. Recordings are kept on the phone that made them.');
    }
    for (const line of [sheet.titles.invite, sheet.titles.invite_create, sheet.bodies.invite, sheet.bodies.invite_create]) {
      expect(line, line).not.toMatch(/book|parent|each|both|together/i);
    }
  });

  it('the error lines say what happened, never that the letters are safe', () => {
    const lines = [...leaves(authCopy.errors, 'errors'), ...leaves(authCopy.sheet.notConfigured, 'notConfigured'), { path: 'code.lettersSafe', text: authCopy.code.lettersSafe }];
    for (const l of lines) expect(l.text, l.path).not.toMatch(/\bsafe\b|\bsharing\b/i);
    // lettersSafe is drawn only where a book exists (the code screen checks useChildren().active). An error line is read
    // on a fresh install or a restored phone too, so none may say the letters are on this phone.
    expect(authCopy.code.lettersSafe).toBe('Your letters are still on this phone.');
    for (const l of leaves(authCopy.errors, 'errors')) expect(l.text, l.path).not.toMatch(/\bletters?\b.*\bon this phone\b|\bon this phone\b.*\bletters?\b/i);
    expect(authCopy.errors.network).toBe('Nothing has changed. Sign in once you are back online.');
    expect(authCopy.errors.session_expired).toBe('Nothing has changed. Sign in again to carry on.');
  });

  it('no line says a recording is on, sent to or removed from our servers: Build 12 keeps recordings on the phone', () => {
    const onServers = (text: string) => /\brecordings?\b[^.]*\b(?:servers?|our side|the cloud)\b/i.test(text);
    expect(onServers('Every letter and recording will be removed from this phone and from our servers.')).toBe(true);
    expect(onServers('Every letter will be removed from this phone and from our servers. Every recording will be removed from this phone.')).toBe(false);
    for (const l of ALL) expect(onServers(l.text), `${l.path} claims a recording on our servers`).toBe(false);
    expect(en.settings.delete.bookBody).toBe("Every letter in {child}'s book will be removed from this phone and from our servers. Every recording will be removed from this phone.");
  });

  it('Account and Privacy name sync, not sharing, and keptSynced names no co-parent', () => {
    expect(authCopy.account.syncLabel).toBe('Sync across your phones');
    expect(en.settings.privacy.sensitiveLabel).toBe('Sync across your phones');
    expect(en.settings.privacy.keptSynced).toBe('Your letters are kept on this phone and on our servers, so they reach your other devices. Your recordings are kept on this phone.');
    expect(en.settings.delete.bookBody).not.toMatch(/family/i);
  });

  it('the rules catch what they are meant to', () => {
    const hit = (text: string) => RULES.filter((r) => claimsOf(r, text).length > 0).map((r) => r.id);
    expect(hit("Your letters are safe on this phone.")).toEqual(['safe']);
    expect(hit('Invite your co-parent.')).toEqual(['coParent']);
    expect(hit('Recordings are backed up.')).toEqual(['backup']);
    expect(hit("Includes your recordings, if iCloud Backup is on.")).toEqual([]);
    expect(hit('Exports you already saved, and backups of this phone such as iCloud Backup, are not changed.')).toEqual([]);
    expect(hit('Nothing has changed. Try again.')).toEqual([]);
  });
});
