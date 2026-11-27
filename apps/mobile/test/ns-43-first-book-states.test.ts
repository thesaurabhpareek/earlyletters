/// <reference types="node" />
/**
 * BL-1165, card NS-43 (docs/product/prd/19-from-download-to-first-letter.md): the first book's states that are not its
 * fields. R8 a returning account whose book may be on its way never meets the first-book screens; R11 an English-only
 * build shows no language row and no "other languages are coming" line; R14 a first-run book the server refuses stays
 * on the phone, deletes nothing and puts no error on Home. R13 (AX5 and VoiceOver) is the render test in
 * test/component/ns-43-first-book-states.test.tsx, because only that project renders React Native; its device pass stays
 * a device row. Fictional family "Asha" only.
 *
 * The real modules run here: the first-run gate and its screen choice, the copy the first-run screens read, the phone
 * database with the app's migrations, and the sync engine against a scripted server. Only natives are stood in.
 */
import { randomBytes } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import * as content from '@scribe/content';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nodeDb } from './helpers/node-db';
import { stripComments } from './helpers/strip-comments';

vi.mock('expo-crypto', () => ({ getRandomBytes: (n: number) => new Uint8Array(randomBytes(n)) }));
vi.mock('../src/lib/db/repos/open-native', () => ({
  openNativeDb: () => {
    throw new Error('native open must not be used in tests');
  },
}));

const SRC = join(__dirname, '..', 'src');
const read = (p: string) => readFileSync(join(SRC, p), 'utf8');

// ---------------------------------------------------------------------------------------------------------------------
// R8
// ---------------------------------------------------------------------------------------------------------------------

describe('[NS-43-R8] no child step for a returning account', async () => {
  const { firstRunGate, gateInputsFromAuth, heldNewPhoneView } = await import('../src/lib/first-run/gate.logic');
  const { openingView } = await import('../src/lib/first-run/new-phone.logic');
  const { firstRunScreen } = await import('../src/lib/first-run/welcome.logic');
  type AuthState = import('../src/lib/auth/machine.logic').AuthState;
  type OpeningView = import('../src/lib/first-run/new-phone.logic').OpeningView;
  type AccountKind = import('../src/lib/first-run/account-books.logic').AccountKind;

  const ME = 'user-asha-parent';
  /**
   * The route's own composition (use-first-run-route.ts): the account's answer while a ready, sync-on session asks it,
   * else the held view, else `new`; then the gate, then the screen. Asked as a person who has typed nothing yet.
   */
  const screenFor = (state: AuthState, opts: { online: boolean; hasLocalBook: boolean; asked?: OpeningView }) => {
    const held = opts.hasLocalBook ? undefined : heldNewPhoneView(state, opts.online);
    const inputs = gateInputsFromAuth({ serverFeatures: true, authState: state, hasLocalBook: opts.hasLocalBook, online: opts.online, newPhone: opts.asked ?? held ?? 'new', phoneOwner: null });
    const r = firstRunGate(inputs);
    return { step: r.step, arrived: r.arrivedFromAccount, screen: firstRunScreen({ step: r.step, outage: r.outage, restoring: false, pastWelcome: false }) };
  };
  /**
   * Never the child step. `steps` is also the screen for `openTonight` (a book is on the phone: the route leaves for Tonight,
   * and an arrival from the account shows "Opening your book" first), which is not this card's screens.
   */
  const neverChildStep = (r: ReturnType<typeof screenFor>, why: string) => {
    expect(r.step, why).not.toBe('childStep');
    if (r.screen === 'steps') expect(r.step, why).toBe('openTonight');
  };

  it('[NS-43-R8] a ready, sync-on account that holds a book, or has not said, is never the child step, whatever the clock or connection', () => {
    const ready: AuthState = { status: 'ready', userId: ME, sync: 'on' };
    const kinds: (AccountKind | null)[] = ['hasBook', 'returningNoBook', 'unknown', null];
    for (const kind of kinds)
      for (const online of [true, false])
        for (const hasLocalBook of [false, true])
          for (const elapsedMs of [0, 4_000, 10_000, 60_000])
            for (const syncPhase of ['idle', 'syncing', 'auth', 'offline'] as const) {
              const asked = openingView({ kind, hasLocalBook, online, syncPhase, lastSyncedAt: null, lastSyncedAtAtStart: null, elapsedMs });
              neverChildStep(screenFor(ready, { online, hasLocalBook, asked }), JSON.stringify({ kind, online, hasLocalBook, elapsedMs, syncPhase, asked }));
            }
  });

  it('[NS-43-R8] a session that cannot ask its account yet is held, never the child step: consent being read or owed, the gate unread, a sign-out finishing', () => {
    const states: AuthState[] = [
      { status: 'checkingConsent', userId: ME, method: 'apple' },
      { status: 'needsConsent', userId: ME, method: 'apple', steps: ['terms'] },
      { status: 'needsConsent', userId: ME, method: 'email', steps: ['sensitive'] },
      { status: 'ready', userId: ME, sync: 'unknown' },
      { status: 'signingOut', userId: ME, reason: 'user', waitingForUploads: false, sync: 'on' },
      { status: 'signingOut', userId: ME, reason: 'user', waitingForUploads: true, sync: 'unknown' },
    ];
    for (const s of states)
      for (const online of [true, false]) {
        const r = screenFor(s, { online, hasLocalBook: false });
        expect(r.screen, `${s.status} online=${online}`).not.toBe('steps');
        neverChildStep(r, `${s.status} online=${online}`);
      }
  });

  it('[NS-43-R8] another account on a phone that holds this owner\'s book draws nothing, never the child step', () => {
    const inputs = gateInputsFromAuth({ serverFeatures: true, authState: { status: 'ready', userId: 'user-other', sync: 'on' }, hasLocalBook: true, newPhone: 'new', phoneOwner: ME });
    const r = firstRunGate(inputs);
    expect(firstRunScreen({ step: r.step, outage: r.outage, restoring: false, pastWelcome: true })).toBe('blank');
  });

  it('[NS-43-R8] only the account saying it is new opens the child step (the matrix above can fail)', () => {
    const ready: AuthState = { status: 'ready', userId: ME, sync: 'on' };
    expect(screenFor(ready, { online: true, hasLocalBook: false, asked: openingView({ kind: 'new', hasLocalBook: false, online: true, syncPhase: 'idle', lastSyncedAt: null, lastSyncedAtAtStart: null, elapsedMs: 0 }) })).toMatchObject({ step: 'childStep', screen: 'steps' });
    // Mutant: a route that skipped the account question (newPhone always 'new') would show the child step to a session
    // whose book may be on its way. This is the failure the first two tests exist to catch.
    expect(screenFor({ status: 'checkingConsent', userId: ME, method: 'apple' }, { online: true, hasLocalBook: false, asked: 'new' })).toMatchObject({ step: 'childStep', screen: 'steps' });
  });

  it('[NS-43-R8] the route draws the steps only on the gate\'s screen answer: every held screen returns before FirstRunSteps', () => {
    const route = stripComments(read('app/onboarding.tsx'));
    const fn = route.slice(route.indexOf('function FirstRun()'));
    const steps = fn.indexOf('<FirstRunSteps');
    for (const screen of ["route.screen === 'opening'", "route.screen === 'slow'", "route.screen === 'offlineBook'", "route.screen === 'finishSetup'", "route.screen === 'noBookHere'", "route.screen === 'blank'"]) {
      const at = fn.indexOf(screen);
      expect(at, screen).toBeGreaterThan(-1);
      expect(at, screen).toBeLessThan(steps);
    }
    // The route takes its screen from the hook that asks the account; nothing else in this file decides it.
    expect(fn).toMatch(/const route = useFirstRunRoute\(\);/);
  });
});

// ---------------------------------------------------------------------------------------------------------------------
// R11
// ---------------------------------------------------------------------------------------------------------------------

/**
 * A language teaser (NS-17-R1, K-E01, CG2): a promise that more languages, or anything else, are coming. Matched on the
 * words a parent would read, case-insensitive. "As soon as" (a letter's words follow as soon as the phone is ready) is
 * not a promise of a feature, so `soon` alone is matched only when it is not followed by "as".
 */
const TEASER = /coming soon|coming later|\bsoon\b(?! as\b)|later update|later version|future (update|version)|(other|more) languages|languages (are|will be) (coming|on the way)/i;

/**
 * The first-run surfaces: the route and its steps, the screens it draws, the cards those steps hold, and the `.logic.ts`
 * beside each (where a screen's words are chosen), plus the two first-run logic files that pick lines for those screens.
 */
function firstRunFiles(): string[] {
  const listed = (dir: string, keep: RegExp) => readdirSync(join(SRC, dir)).filter((f) => keep.test(f)).map((f) => `${dir}/${f}`);
  const screens = ['app/onboarding.tsx', ...listed('components/onboarding', /\.tsx$/), ...listed('components/child', /^(date-field.*|cover-heading)\.tsx$/), 'components/speech/speech-consent-card.tsx'];
  const beside = screens.map((f) => f.replace(/\.tsx$/, '.logic.ts')).filter((f) => existsSync(join(SRC, f)));
  return [...screens, ...beside, 'lib/first-run/welcome.logic.ts', 'lib/first-run/new-phone.logic.ts'];
}

/**
 * The only block a first-run surface may hold behind a language rule: the language row, drawn only when the build hears
 * more than English (SET-06, language-row.logic.ts). Its words are scanned by the multi-language build, not this one.
 */
function withoutLanguageRow(src: string): string {
  const open = '{showOnboardingLanguageRow(';
  const at = src.indexOf(open);
  if (at < 0) return src;
  let depth = 0;
  for (let i = at; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}' && --depth === 0) return src.slice(0, at) + src.slice(i + 1);
  }
  throw new Error('unbalanced language row block');
}

type Roots = Record<string, unknown>;

/** Every string under a value (a string, an array, an object of either). */
function stringsUnder(v: unknown, out: string[] = []): string[] {
  if (typeof v === 'string') out.push(v);
  else if (Array.isArray(v)) for (const x of v) stringsUnder(x, out);
  else if (v && typeof v === 'object') for (const x of Object.values(v)) stringsUnder(x, out);
  return out;
}

/**
 * The words a source file can put on screen: each copy reference it makes (`copy.a.b`, `authCopy.c`, and a local alias
 * such as `const o = copy.onboarding` used as `o.child.title`), resolved against the real content as far as it names
 * keys. An alias's own declaration is not a reference (it would pull in every key of the section).
 */
function referencedWords(src: string, roots: Roots): { ref: string; text: string }[] {
  const code = stripComments(src);
  const aliases = new Map<string, string>();
  // `import { copy as appCopy } from '@/lib/copy'`: the renamed import reads as its root.
  for (const m of code.matchAll(/import\s*\{([^}]*)\}\s*from/g))
    for (const part of m[1].split(',')) {
      const [name, as] = part.trim().split(/\s+as\s+/);
      if (as && name in roots) aliases.set(as, name);
    }
  const declared = /\bconst\s+([A-Za-z_]\w*)\s*=\s*((?:[a-z]\w*Copy|copy)(?:\.\w+)*)\s*;/g;
  for (const m of code.matchAll(declared)) aliases.set(m[1], m[2]);
  const body = code.replace(declared, '');
  const names = [...Object.keys(roots), ...aliases.keys()].sort((a, b) => b.length - a.length);
  const ref = new RegExp(`(?<![\\w.])(${names.join('|')})((?:\\.\\w+)+)`, 'g');
  const out: { ref: string; text: string }[] = [];
  for (const m of body.matchAll(ref)) {
    const full = aliases.has(m[1]) ? `${aliases.get(m[1])}${m[2]}` : `${m[1]}${m[2]}`;
    const [root, ...path] = full.split('.');
    let v: unknown = roots[root];
    for (const k of path) {
      if (!v || typeof v !== 'object' || !(k in (v as object))) break;
      v = (v as Record<string, unknown>)[k];
    }
    if (v === roots[root]) continue; // a root named in passing (a type, a spread) is not a line on screen
    for (const text of stringsUnder(v)) out.push({ ref: full, text });
  }
  return out;
}

/** The lines a first-run surface shows that promise something to come, as `ref: text`. */
function teasersOnFirstRun(sources: Record<string, string>, roots: Roots): string[] {
  const hits: string[] = [];
  for (const [file, src] of Object.entries(sources))
    for (const w of referencedWords(withoutLanguageRow(src), roots)) if (TEASER.test(w.text)) hits.push(`${file} ${w.ref}: ${w.text}`);
  return hits;
}

describe('[NS-43-R11] no language teaser in first run', async () => {
  const { copy, pendingCopy } = await import('../src/lib/copy');
  const { packsCopy } = await import('../src/lib/packs/copy');
  const roots: Roots = { copy, pendingCopy };
  for (const [k, v] of Object.entries(content)) if (/^[a-z]\w*Copy$/.test(k)) roots[k] = v;
  roots.packsCopy = packsCopy; // the app's copy of it, with the public name filled in
  const sources = Object.fromEntries(firstRunFiles().map((f) => [f, read(f)]));

  it('[NS-43-R11] no line a first-run screen shows says that other languages, or anything else, are coming', () => {
    expect(teasersOnFirstRun(sources, roots)).toEqual([]);
  });

  it('[NS-43-R11] the scan reads real words: the first-book screens resolve their title, reasons and signature lines', () => {
    const words = referencedWords(read('app/onboarding.tsx'), roots).map((w) => w.text);
    const o = copy.onboarding;
    for (const line of [o.child.title, o.child.bornQuestion, o.child.birthdayLabel, o.signsAs.title, o.signsAs.notYetHelp, o.finish.body]) expect(words).toContain(line);
    expect(Object.keys(sources).length).toBeGreaterThanOrEqual(6);
  });

  it('[NS-43-R11] mutant: a planted coming-soon key on the child step is caught', () => {
    const planted = { ...roots, copy: { ...copy, onboarding: { ...copy.onboarding, child: { ...copy.onboarding.child, languagesSoon: 'Other languages are coming soon.' } } } };
    const src = read('app/onboarding.tsx').replace('{o.child.expectingHelp}', '{o.child.expectingHelp}{o.child.languagesSoon}');
    expect(src).toContain('o.child.languagesSoon');
    const hits = teasersOnFirstRun({ 'app/onboarding.tsx': src }, planted);
    expect(hits).toContain('app/onboarding.tsx copy.onboarding.child.languagesSoon: Other languages are coming soon.');
    // And the same key without the new reference: the step hands its whole `o.child` section to the name field's words
    // (childNameFieldWords), so a planted key there is on the screen's reach and is caught even before anyone renders it.
    expect(teasersOnFirstRun({ 'app/onboarding.tsx': read('app/onboarding.tsx') }, planted)).toContain('app/onboarding.tsx copy.onboarding.child: Other languages are coming soon.');
  });

  it('[NS-43-R11] mutant: the English-only line or a later-update promise outside the language row is caught', () => {
    const englishOnly = (content.languageCopy as { picker: { englishOnly: string } }).picker.englishOnly;
    const later = `${englishOnly} More languages in a later update.`;
    const planted = { ...roots, languageCopy: { ...content.languageCopy, picker: { ...content.languageCopy.picker, englishOnly: later } } };
    const src = read('app/onboarding.tsx').replace('{o.signsAs.notYetHelp}', '{o.signsAs.notYetHelp}{languageCopy.picker.englishOnly}');
    expect(teasersOnFirstRun({ 'app/onboarding.tsx': src }, planted)).toContain(`app/onboarding.tsx languageCopy.picker.englishOnly: ${later}`);
    expect(teasersOnFirstRun({ 'app/onboarding.tsx': read('app/onboarding.tsx') }, planted)).toEqual([]);
  });

  it('[NS-43-R11] an English-only build hides the language row, and the row is the one language block on the first-book steps', async () => {
    const { heardLanguages, hearsOnlyEnglish } = await import('../src/lib/language/heard-languages');
    const { showOnboardingLanguageRow } = await import('../src/components/onboarding/language-row.logic');
    // EXPO_PUBLIC_ENGLISH_ONLY=on, whatever the language list says; and a list of English alone.
    for (const listed of [null, ['es', 'hi'], ['en']]) expect(showOnboardingLanguageRow(hearsOnlyEnglish(heardLanguages(true, listed)))).toBe(false);
    expect(showOnboardingLanguageRow(hearsOnlyEnglish(heardLanguages(false, ['en'])))).toBe(false);
    expect(showOnboardingLanguageRow(hearsOnlyEnglish(heardLanguages(false, ['es'])))).toBe(true);
    const route = stripComments(read('app/onboarding.tsx'));
    const outside = withoutLanguageRow(route);
    // With the row's block taken out, nothing on the steps names a language or opens the picker's row.
    expect(outside).not.toMatch(/settingsHome\.languageLabel|picker\.rowHint|setLanguageOpen\(true\)|languageInfo\(/);
    expect(outside).not.toMatch(/languageCopy\.picker\.englishOnly/);
    expect(route.match(/showOnboardingLanguageRow\(/g)).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------------------------------------------------
// R14
// ---------------------------------------------------------------------------------------------------------------------

describe('[NS-43-R14] a refused book is never deleted', () => {
  type Store = typeof import('../src/lib/store');
  type SqlDb = import('../src/lib/db/sql').SqlDb;
  type PushOp = import('../src/lib/sync/types').PushOp;
  type RpcResult = import('../src/lib/sync/types').RpcResult;
  const ME = '11111111-1111-1111-1111-111111111111';
  const NOW = Date.parse('2026-11-20T09:00:00.000Z');
  let n = 0;
  const id7 = () => `0199a000-0000-7000-8000-${String(++n).padStart(12, '0')}`;
  let store: Store;
  let BOOK_DELETED_PREFIX: string;

  beforeEach(async () => {
    vi.resetModules();
    store = (await import('../src/lib/store')) as Store;
    ({ BOOK_DELETED_PREFIX } = await import('../src/lib/db/repos/wipe'));
    const { db } = nodeDb();
    expect(store.openStore({ open: () => ({ db, close: () => {} }), now: () => new Date(NOW).toISOString(), newId: id7 }).ok).toBe(true);
  });

  /** A server that refuses the book's first send with `code` and accepts everything else; pulls bring nothing. */
  const refusing = (code: string, extra: Record<string, unknown> = {}) => {
    const calls: PushOp[][] = [];
    const rpc = (fn: string, args: Record<string, unknown> = {}): Promise<RpcResult> => {
      if (fn === 'sync_push') {
        const ops = args.p_ops as PushOp[];
        calls.push(ops);
        const results = ops.map((o) => (o.type === 'book.first_run' || o.type === 'book.create' ? { op: o.op, ok: false, code, ...extra } : { op: o.op, ok: true }));
        return Promise.resolve({ data: { paused: false, stopped: false, results }, error: null, status: 200 });
      }
      return Promise.resolve({ data: { reset: false, epoch: 1, epoch_started_at: new Date(NOW).toISOString(), books: [], gone: [], more: false }, error: null, status: 200 });
    };
    return { calls, rpc };
  };

  const syncOnce = async (db: SqlDb, server: ReturnType<typeof refusing>) => {
    const { createSyncEngine } = await import('../src/lib/sync/engine');
    await createSyncEngine({ db, supabase: { rpc: server.rpc }, userId: ME, newId: id7, now: () => NOW, random: () => 1, setTimer: () => 0, clearTimer: () => {}, isActive: () => false }).sync();
  };

  const letter = (db: SqlDb, child: string, text: string) => {
    const id = id7();
    db.run(
      `INSERT INTO entries (id, kind, occurred_on, captured_at, capture_mode, edit_level, engine_version, raw_transcript, machine_edits,
         final_text, in_book, updated_at, child_id, author_id) VALUES (?, 'letter', '2026-11-19', ?, 'typed', 'verbatim', 2, ?, '[]', ?, 1, ?, ?, ?)`,
      id, new Date(NOW).toISOString(), text, text, new Date(NOW).toISOString(), child, ME,
    );
    return id;
  };

  const snapshot = (db: SqlDb) => ({
    books: db.all('SELECT id, name, birthday, due_date, hidden_at FROM children ORDER BY id'),
    letters: db.all('SELECT id, child_id, raw_transcript, final_text, deleted_at FROM entries ORDER BY id'),
    // A book is deleted on this phone by a settings marker (repos/wipe.ts BOOK_DELETED_PREFIX), not by a column.
    deletedMarks: db.all("SELECT key FROM settings WHERE key LIKE ? ORDER BY key", `${BOOK_DELETED_PREFIX}%`),
  });

  // A local first run, then sign-in: takeOwnership sends the first-run books as one book.first_run op.
  for (const [code, extra] of [['22023', {}], ['SCDEL', { gone: true }], ['SCCID', {}]] as const) {
    it(`[NS-43-R14] the first-run books refused with ${code} stay on the phone with their letters, still listed, nothing deleted`, async () => {
      const made = store.addChildren([
        { name: 'Asha', birthday: '2026-03-01', dueDate: null, signsAs: 'Mama' },
        { name: 'Asha B', birthday: '2026-03-01', dueDate: null, signsAs: 'Mama' },
      ]);
      const db = store.localSqlDb();
      letter(db, made[0].id, 'Asha laughed at the rain.');
      const before = snapshot(db);
      const { takeOwnership } = await import('../src/lib/sync/ownership');
      takeOwnership(db, ME, { now: new Date(NOW).toISOString(), newId: id7 });
      const server = refusing(code, extra);
      await syncOnce(db, server);
      expect(server.calls.flat().some((o) => o.type === 'book.first_run')).toBe(true);
      expect(snapshot(db)).toEqual(before);
      expect(store.listChildren().map((c) => c.id)).toEqual(made.map((c) => c.id));
      expect(store.getActiveChildId()).toBe(made[0].id);
      // Set aside, not dropped: the op is kept where export and support can read it, and the books say they were refused.
      expect(db.all<{ type: string; code: string }>('SELECT type, code FROM rejected_writes').map((r) => `${r.type}:${r.code}`)).toEqual([`book.first_run:${code}`]);
      expect(db.all<{ server_state: string }>('SELECT server_state FROM children ORDER BY id').map((r) => r.server_state)).toEqual(['refused', 'refused']);
    });
  }

  it('[NS-43-R14] a book made in first run after sign-in, refused with 22023, stays on the phone and is still the active book', async () => {
    const db = store.localSqlDb();
    const { takeOwnership } = await import('../src/lib/sync/ownership');
    takeOwnership(db, ME, { now: new Date(NOW).toISOString(), newId: id7 }); // signed in on an empty phone, then the steps
    const [asha] = store.addChildren([{ name: 'Asha', birthday: '2026-03-01', dueDate: null, signsAs: 'Mama' }]);
    letter(db, asha.id, 'Asha found the big puddle.');
    const before = snapshot(db);
    const server = refusing('22023');
    await syncOnce(db, server);
    expect(server.calls.flat().some((o) => o.type === 'book.create' && o.id === asha.id)).toBe(true);
    expect(snapshot(db)).toEqual(before);
    expect(store.listChildren().map((c) => c.id)).toEqual([asha.id]);
    expect(store.getActiveChildId()).toBe(asha.id);
    // Syncing again (the next launch) still deletes nothing.
    await syncOnce(db, refusing('22023'));
    expect(snapshot(db)).toEqual(before);
  });

  it('[NS-43-R14] Home says nothing about a refused book: it reads neither the refused writes, the sync status nor a book\'s server state', () => {
    const home = stripComments(read('app/(tabs)/index.tsx'));
    expect(home).not.toMatch(/from '@\/lib\/sync(\/[\w-]+)?'/);
    expect(home).not.toMatch(/rejected_writes|rejectedUnseen|server_?[sS]tate|'refused'|SyncStatus|syncCopy/);
    // The same holds for every Tonight component Home draws.
    const tonight = readdirSync(join(SRC, 'components', 'tonight')).filter((f) => /\.tsx?$/.test(f) && !f.endsWith('.test.ts'));
    expect(tonight.length).toBeGreaterThan(0);
    for (const f of tonight) {
      const src = stripComments(read(`components/tonight/${f}`));
      expect(src, f).not.toMatch(/rejected_writes|rejectedUnseen|server_?[sS]tate|'refused'/);
    }
  });

  it('[NS-43-R14] the books list hides only left and deleted books, so a refused one is still Home\'s book', () => {
    const repo = stripComments(read('lib/db/repos/children.ts'));
    expect(repo).toMatch(/const LISTED = `c\.server_state NOT IN \('left', 'deleted'\) AND /);
  });
});
