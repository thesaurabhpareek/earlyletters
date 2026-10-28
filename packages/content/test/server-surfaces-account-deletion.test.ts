/**
 * Experience pass, October 2026, package P8c-lite: Delete account (S64 in docs/design/EXPERIENCE_PASS_2026-10.md,
 * section 4 chapter 7, and section 6 "P8"). S61 to S63 (backup, restore, erase across phones) are not in this pass.
 *
 * Over the one copy file, `accountDeletionCopy` (src/features/account-deletion.en.ts):
 *  - every CHG of S64, word for word, except `what.intro`, which is held for counsel (chapter 7 and section 7, C8):
 *    it keeps today's words, and S64's words wait beside it as `what.introProposed` until counsel clears them;
 *  - the KEEP words the spec's Visual quotes;
 *  - failures say that nothing has changed (offline says it first);
 *  - no "we" or "our" outside the held intro (deletion disclosure, C8) and `what.deletedFamily` (KEEP; never shown
 *    in v1.0: family contributors come in v1.1, D-055);
 *  - no "photos" outside the held intro; no receipt and no "we sent";
 *  - buttons of 22 characters or fewer; only the placeholders this file may use;
 *  - no "only you", "only your family's keys" or "end-to-end"; "stays on this phone" only on the kill path;
 *  - US spellings.
 * The page that shows these words is pinned in apps/mobile/test/delete-account.test.ts.
 */
import { describe, expect, it } from 'vitest';
import { brand } from '@scribe/brand';
import { accountDeletionCopy, accountEmails } from '../src';

type Leaf = { path: string; text: string };

function leaves(value: unknown, path: string): Leaf[] {
  if (typeof value === 'string') return [{ path, text: value }];
  if (Array.isArray(value)) return value.flatMap((v, i) => leaves(v, `${path}[${i}]`));
  if (value && typeof value === 'object') return Object.entries(value).flatMap(([k, v]) => leaves(v, path ? `${path}.${k}` : k));
  return [];
}

/** The value at a path under accountDeletionCopy, such as "errors.offline". */
function at(path: string): unknown {
  return path.split('.').reduce<unknown>((node, key) => (node && typeof node === 'object' ? (node as Record<string, unknown>)[key] : undefined), accountDeletionCopy);
}

const ALL = leaves(accountDeletionCopy, '');

const ASHA: Record<string, string> = { child: 'Asha', coParent: 'Papa', count: '12', date: 'November 27, 2026' };
const fill = (text: string) => text.replace(/\{(\w+)\}/g, (m, k: string) => ASHA[k] ?? m);

/** S64's CHG rows that ship now, as the spec writes them. */
const CHANGED: Record<string, string> = {
  'what.copies': 'A copy you exported stays wherever you saved it.',
  'exportFirst.body': 'Export everything, free: the book as a PDF, your letters as text and your recordings.',
  'scheduled.emailNote': 'A confirmation is on its way to your email.',
  notConfigured: 'Accounts are not available right now. Everything stays on this phone, and deleting the app removes it.',
  'errors.offline': 'Nothing has changed. Deleting an account needs a connection.',
  'errors.failed': 'That did not work this time. Nothing has changed.',
};

/** Held for counsel (C8): today's words stay on the key the page reads; S64's words wait beside them. */
const HELD = {
  key: 'what.intro',
  today: 'Deleting your account removes your letters, recordings, photos and books from our servers. You have 30 days to change your mind.',
  proposedKey: 'what.introProposed',
  proposed: 'Deleting your account removes your letters, recordings, books and recording backup from our servers. You have 30 days to change your mind.',
};

/** KEEP words the S64 Visual and acceptance name. */
const QUOTED: Record<string, string> = {
  title: 'Delete account',
  'what.heading': 'What happens',
  'exportFirst.heading': 'Keep a copy first',
  'exportFirst.button': 'Export everything',
  continueButton: 'Continue',
  'confirm.typeLabel': 'Type delete to confirm',
  'confirm.typeWord': 'delete',
  'confirm.button': 'Delete account',
  'confirm.back': 'Keep my account',
  'scheduled.cancelButton': 'Cancel deletion',
  'scheduled.doneButton': 'Sign out of this phone',
  'scheduled.cancelled': 'Deletion cancelled. Your letters and books are back, just as they were.',
};

const BUTTONS = [
  'exportFirst.button',
  'subscription.button',
  'continueButton',
  'confirm.button',
  'confirm.back',
  'scheduled.cancelButton',
  'scheduled.doneButton',
  'signedOut.button',
];

const DISCLOSURE = new Set([HELD.key, HELD.proposedKey]);
/** KEEP, never shown in v1.0 (logic.ts adds it only for a book with family contributors, v1.1). */
const NOT_IN_V1 = new Set(['what.deletedFamily']);
const KILL_PATH = new Set(['notConfigured']);

describe('[P8c S64] accountDeletionCopy changes, word for word', () => {
  it('has every CHG that ships now as the spec writes it', () => {
    for (const [key, words] of Object.entries(CHANGED)) expect(at(key), key).toBe(words);
  });

  it('holds what.intro for counsel (C8): today\'s words on the key the page reads, S64\'s words beside it', () => {
    expect(at(HELD.key)).toBe(HELD.today);
    expect(at(HELD.proposedKey)).toBe(HELD.proposed);
    // The proposal is the whole of S64's change: photos out, the recording backup named, nothing else moved.
    expect(HELD.proposed).not.toMatch(/\bphotos?\b/i);
    expect(HELD.proposed).toMatch(/\brecording backup\b/);
    expect(HELD.proposed.split('. ')[1]).toBe(HELD.today.split('. ')[1]);
  });

  it('keeps the words the Visual and the acceptance boxes quote', () => {
    for (const [key, words] of Object.entries(QUOTED)) expect(at(key), key).toBe(words);
  });

  it('says in every failure that nothing has changed, and first when offline', () => {
    for (const [key, text] of Object.entries(accountDeletionCopy.errors)) expect(text, key).toContain('Nothing has changed.');
    expect(accountDeletionCopy.errors.offline.startsWith('Nothing has changed.')).toBe(true);
    // No blame on the person: the line says what the request needs, never "you are offline".
    expect(ALL.filter((l) => /\byou are offline\b|\bplease try again\b/i.test(l.text)).map((l) => l.path)).toEqual([]);
  });
});

describe('[P8c S64] rules over accountDeletionCopy', () => {
  it('says "we" or "our" only in the held deletion disclosure and the v1.1 family note (principle 2)', () => {
    const bad = ALL.filter((l) => !DISCLOSURE.has(l.path) && !NOT_IN_V1.has(l.path) && /\b(?:we|our|us)\b/i.test(l.text));
    expect(bad.map((l) => `${l.path}: ${l.text}`)).toEqual([]);
  });

  it('never mentions photos outside the held intro, and never promises a receipt', () => {
    expect(ALL.filter((l) => l.path !== HELD.key && /\bphotos?\b/i.test(l.text)).map((l) => l.path)).toEqual([]);
    expect(ALL.filter((l) => /\breceipt\b|\bwe sent\b/i.test(l.text)).map((l) => l.path)).toEqual([]);
  });

  it('keeps every button label to 22 characters, as written and with the Asha fixtures', () => {
    for (const key of BUTTONS) {
      const label = at(key);
      expect(typeof label, key).toBe('string');
      expect((label as string).length, key).toBeLessThanOrEqual(22);
      expect(fill(label as string).length, key).toBeLessThanOrEqual(22);
    }
  });

  it('uses only the placeholders this file may use', () => {
    const allowed = new Set(['child', 'coParent', 'count', 'date']);
    const used = ALL.flatMap((l) => [...l.text.matchAll(/\{(\w+)\}/g)].map((m) => ({ path: l.path, name: m[1] })));
    expect(used.filter((u) => !allowed.has(u.name)).map((u) => `${u.path}: {${u.name}}`)).toEqual([]);
    expect(fill(accountDeletionCopy.confirm.body)).not.toMatch(/[{}]/);
  });

  it('makes no "only you", "only your family\'s keys" or "end-to-end" claim', () => {
    expect(ALL.filter((l) => /\bonly you\b|\bonly your family'?s keys\b|\bend[- ]to[- ]end\b/i.test(l.text)).map((l) => l.path)).toEqual([]);
  });

  it('says "stays on this phone" only on the kill path (option B, D-100)', () => {
    expect(ALL.filter((l) => !KILL_PATH.has(l.path) && /\bstays? on (?:this|your|the) phone\b/i.test(l.text)).map((l) => `${l.path}: ${l.text}`)).toEqual([]);
  });

  it('spells for the US storefront and names the app only through brand', () => {
    const UK = [/\blicences?\b/i, /\bmobile data\b/i, /\bfull stops?\b/i, /\bstraight away\b/i, /\bmummy\b/i, /\bcolour/i, /\bfavourite/i, /\borganis/i, /\brecognis/i];
    expect(ALL.filter((l) => UK.some((re) => re.test(l.text))).map((l) => `${l.path}: ${l.text}`)).toEqual([]);
    expect(ALL.filter((l) => l.text.includes(brand.name)).map((l) => l.path)).toEqual([]);
  });
});

/**
 * The emails around an account deletion say only what the app and the server do today (#358 review, lens A M1):
 * no export after the request (DATA-REQ-053 is open), no notice to the co-parent (nothing sends coparent-left or
 * shows the coParentLeft card yet, BL-361), and the app's real place for Delete account.
 */
describe('[P8c S64] the deletion emails match the app', () => {
  const scheduled = accountEmails['account-deletion-scheduled'];
  const text = (e: { subject: string; preheader: string; body: readonly string[]; safety?: string }) => [e.subject, e.preheader, ...e.body, e.safety ?? ''].join('\n');

  it('the request receipt offers no export and says how to cancel, where Delete account is', () => {
    expect(text(scheduled)).not.toMatch(/\bexport|\bsave a copy\b|\bkeep a copy\b/i);
    expect(scheduled.body).toContain('Until then, you can sign in and cancel the request in Settings, Delete account.');
    expect(scheduled.preheader).toBe('On {deletionDate}. Until then you can change your mind.');
  });

  it('the request receipt never says the co-parent was told', () => {
    expect(text(scheduled)).not.toMatch(/let them know|told them|we (?:have )?(?:emailed|notified|told)/i);
    expect(scheduled.body).toContain('If you share a book with a co-parent, your letters and recordings have left it, so they can no longer read them. The book stays with them.');
  });

  it('no account email puts Delete account inside Your data', () => {
    const all = Object.values(accountEmails).map((e) => text(e as Parameters<typeof text>[0])).join('\n');
    expect(all).not.toMatch(/Your data,? (?:then )?Delete account|delete your account[^.]*in Settings, Your data/i);
    expect(accountEmails['deletion-request-received'].body).toContain('If you can open the app, you can also do this yourself: Settings, Delete account.');
    expect(accountEmails['policy-update'].body).toContain('You can export everything at any time in Settings, Your data, and delete your account in Settings, Delete account.');
  });
});
