/**
 * Settings > Delete account (EXPERIENCE_PASS_2026-10 S64, package P8c-lite). The page is React Native, and Node tests
 * do not render it, so this file tests what the page decides (components/settings/delete-account.logic.ts) and pins
 * its source: the layout of each state, the held intro, the typed word, the one `warning`, the toast, and nothing
 * personal in analytics. The deletion itself is S14's and is tested in src/lib/account-deletion/account-deletion.test.ts.
 * The words are pinned in packages/content/test/server-surfaces-account-deletion.test.ts.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { accountDeletionCopy as c } from '@scribe/content';
import { canDelete, failureLine, HELD, whatHappens } from '@/components/settings/delete-account.logic';
import { bookImpacts, impactLines, type SyncBook } from '@/lib/account-deletion/logic';

const SRC = join(__dirname, '..', 'src');
/** Source without comments, so a rule is checked against code, not against what a comment says. */
const code = (t: string) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
const page = code(readFileSync(join(SRC, 'app', 'settings', 'delete-account.tsx'), 'utf8'));
const between = (from: string, to: string) => {
  const a = page.indexOf(from);
  const b = page.indexOf(to, a + from.length);
  expect(a, from).toBeGreaterThanOrEqual(0);
  expect(b, to).toBeGreaterThan(a);
  return page.slice(a, b);
};
/** Each state's JSX, from its condition to the next state's. */
const STATE = {
  signedOut: () => between('if (!d.configured || !d.signedIn)', "if (step === 'loading')"),
  loading: () => between("if (step === 'loading')", "if (step === 'executing')"),
  scheduled: () => between("if (step === 'scheduled'", "if (step === 'confirm')"),
  confirm: () => between("if (step === 'confirm')", 'const list = whatHappens('),
  review: () => page.slice(page.indexOf('const list = whatHappens(')),
};

// The fictional family (CLAUDE.md): Asha's book, shared with Papa, and Asha's book kept alone with family who write.
const me = { role: 'parent' as const, is_me: true, signs_as: 'Mama' };
const shared: SyncBook = { id: 'b1', name: 'Asha', role: 'parent', members: [me, { role: 'parent', is_me: false, signs_as: 'Papa' }] };
const alone: SyncBook = { id: 'b2', name: 'Asha', role: 'parent', members: [me, { role: 'contributor', is_me: false, signs_as: 'Nani' }] };

describe('[S64] step 1: one line per book, then the copies line', () => {
  it('waits for the lines: nothing is listed and Continue is not offered until they arrive', () => {
    expect(whatHappens(null)).toEqual({ known: false, books: [], empty: null, copies: null });
  });

  it('lists each book once, in order, with a family note under its own book and the copies line last', () => {
    const lines = impactLines(bookImpacts([shared, alone], (id) => (id === 'b1' ? 12 : 1)));
    expect(whatHappens(lines)).toEqual({
      known: true,
      books: [
        { line: "Asha's book stays with Papa, with their letters. Your 12 letters leave it.", note: null },
        { line: "Asha's book will be deleted, with your letter in it.", note: c.what.deletedFamily },
      ],
      empty: null,
      copies: c.what.copies,
    });
  });

  it('a book with no family has no note, and a book where the person writes as family is a line of its own', () => {
    const contributor: SyncBook = { id: 'b3', name: 'Asha', role: 'contributor', members: [{ role: 'contributor', is_me: true, signs_as: 'Nani' }] };
    const solo: SyncBook = { id: 'b4', name: 'Asha', role: 'parent', members: [me] };
    const v = whatHappens(impactLines(bookImpacts([solo, contributor], () => 0)));
    expect(v.books).toEqual([
      { line: "Asha's book will be deleted.", note: null },
      { line: 'Your letters to Asha will be removed.', note: null },
    ]);
    expect(v.copies).toBe(c.what.copies);
  });

  it('an account with no books says so, with no list and no copies line', () => {
    expect(whatHappens(impactLines([]))).toEqual({ known: true, books: [], empty: c.what.noBooks, copies: null });
  });

  it('a family note with no book before it is still shown, as a line of its own', () => {
    expect(whatHappens([c.what.deletedFamily, c.what.copies]).books).toEqual([{ line: c.what.deletedFamily, note: null }]);
  });
});

describe('[S64] failures and the typed word', () => {
  it('says nothing when nothing failed, and that nothing has changed when something did', () => {
    expect(failureLine(null)).toBeNull();
    expect(failureLine('offline')).toBe(c.errors.offline);
    expect(failureLine('failed')).toBe(c.errors.failed);
    for (const kind of ['offline', 'failed'] as const) expect(failureLine(kind)).toContain('Nothing has changed.');
  });

  it('enables Delete account only for the typed word, and never while a request is on its way', () => {
    expect(canDelete('delete', false)).toBe(true);
    expect(canDelete('  DELETE ', false)).toBe(true);
    expect(canDelete('delete', true)).toBe(false);
    expect(canDelete('delet', false)).toBe(false);
    expect(canDelete('', false)).toBe(false);
  });
});

describe('[S64] held for counsel (C8)', () => {
  it('the page shows today\'s intro until the one-line switch, and never the proposal before it', () => {
    expect(HELD.intro).toBe(c.what.intro);
    expect(HELD.intro).not.toBe(c.what.introProposed);
    expect(STATE.review()).toContain('{HELD.intro}');
    expect(page).not.toMatch(/c\.what\.intro\b|introProposed/);
  });
});

describe('[S64] the page', () => {
  it('types no user-facing word: every word comes from packages/content', () => {
    const typed = [...page.matchAll(/(?<![=-])>\s*([A-Za-z][A-Za-z ,.'?!]{2,})\s*<\/?[A-Za-z]/g)].map((m) => m[1].trim());
    expect(typed).toEqual([]);
    expect(page).not.toMatch(/label="[^"]*"|message="[^"]*"/);
  });

  it('is a plain Settings page: no lamp and no drawing (5.2)', () => {
    expect(page).not.toMatch(/\bLamp\b|LineArt|line-art|StateScreen/);
  });

  it('step 1: the intro, one BookOpen 20 pt line per book, the copies line, then the cards and Continue', () => {
    const s = STATE.review();
    expect(s).toMatch(/list\.books\.map\(\(b, i\) => \(/);
    expect(s.match(/<BookOpenIcon size=\{20\}/g)).toHaveLength(1);
    const order = ['{c.what.heading}', '{HELD.intro}', 'list.books.map(', '{list.empty}', '{list.copies}', '<FileTextIcon', '{d.subscriptionNotice ?', '{c.continueButton}'];
    const at = order.map((t) => s.indexOf(t));
    expect(at.every((i) => i >= 0), order.join(', ')).toBe(true);
    expect([...at].sort((a, b) => a - b)).toEqual(at);
  });

  it('step 1: "Keep a copy first" is a card with FileText and "Export everything" bordered', () => {
    const card = between('<FileTextIcon', '</Card>');
    expect(card).toContain('{c.exportFirst.heading}');
    expect(card).toContain('{c.exportFirst.body}');
    expect(card).toMatch(/variant="outline"[\s\S]*label=\{c\.exportFirst\.button\}/);
    expect(card).toMatch(/d\.trackStage\('export_offered'\), router\.push\('\/settings\/export'\)/);
  });

  it('step 1: the Plus card, with CreditCard, shows only when Plus will renew', () => {
    const plus = between('{d.subscriptionNotice ? (', ') : null}');
    expect(plus).toContain('<CreditCardIcon');
    expect(plus).toMatch(/variant="outline"[^>]*label=\{c\.subscription\.button\}[^>]*onPress=\{\(\) => void manageSubscription\(\)\}/);
    expect(page.match(/CreditCardIcon size/g)).toHaveLength(1);
  });

  it('step 1: Continue waits until every book\'s outcome is on the page, and a page that could not list them says so', () => {
    expect(STATE.review()).toMatch(/disabled=\{!list\.known\} label=\{c\.continueButton\}/);
    expect(between('{list.known ? null : (', ')}')).toMatch(/<ErrorLine message=\{c\.errors\.failed\} \/>\s*\{tryAgain\}/);
  });

  it('step 2: the heading in title2, the body with the date, the typed field, then Delete account and Keep my account', () => {
    const s = STATE.confirm();
    expect(s).toMatch(/<Text variant="title2" asHeading>\s*\{c\.confirm\.heading\}/);
    expect(s).toContain('fill(c.confirm.body, { date })');
    expect(s).toMatch(/<TextField\s+label=\{c\.confirm\.typeLabel\}/);
    expect(s).toMatch(/autoCapitalize="none"\s+autoCorrect=\{false\}/);
    const order = ['<TextField', '{c.confirm.button}', 'label={c.confirm.back}'];
    const at = order.map((t) => s.indexOf(t));
    expect([...at].sort((a, b) => a - b)).toEqual(at);
    expect(at[0]).toBeGreaterThanOrEqual(0);
  });

  it('step 2: Delete account is filled in the destructive colour only when the word is typed, and is disabled until then', () => {
    const s = STATE.confirm();
    expect(s).toContain('const ready = canDelete(typed, d.busy);');
    const button = between('variant="destructive"', '</Button>');
    expect(button).toContain('disabled={!ready}');
    expect(button).toContain("className={ready ? 'bg-destructive' : 'border border-input'}");
    expect(button).toContain("<Text tone={ready ? 'onDestructive' : 'muted'}>{c.confirm.button}</Text>");
  });

  it('step 2: the final confirm plays warning once, and a request that went through leaves step 2 behind', () => {
    expect(page.match(/haptic\('warning'\)/g)).toHaveLength(1);
    const press = between('variant="destructive"', '</Button>');
    expect(press).toMatch(/haptic\('warning'\);\s*if \(await d\.request\(\)\) keep\(\);/);
    expect(STATE.confirm()).toContain("const keep = () => (setWanted('review'), setTyped(''));");
  });

  it('step 2: Keep my account is quiet and the default: VoiceOver\'s escape takes it', () => {
    const s = STATE.confirm();
    expect(s).toMatch(/<Button variant="quiet" fullWidth disabled=\{d\.busy\} label=\{c\.confirm\.back\} onPress=\{keep\} \/>/);
    expect(s).toContain('onAccessibilityEscape={() => (d.busy ? undefined : keep())}');
  });

  it('scheduled: the date in title2, Cancel deletion bordered, Sign out of this phone, and the export line', () => {
    const s = STATE.scheduled();
    expect(s).toMatch(/<Text variant="subhead" tone="muted">\s*\{c\.scheduled\.heading\}\s*<\/Text>\s*<Text variant="title2">\{date\}<\/Text>/);
    expect(s).toContain('fill(c.scheduled.body, { date })');
    expect(s).toContain('{c.scheduled.emailNote}');
    expect(s).toMatch(/variant="outline"[\s\S]*?label=\{c\.scheduled\.cancelButton\}/);
    expect(s).toMatch(/label=\{c\.scheduled\.doneButton\} onPress=\{\(\) => void d\.signOut\(\)\}/);
    expect(s).toContain('{c.scheduled.exportNote}');
  });

  it('cancelled: a toast says so once the cancel went through, with the success haptic', () => {
    const s = STATE.scheduled();
    expect(s).toMatch(/if \(await d\.cancel\(\)\) \{\s*haptic\('success'\);\s*toast\.show\(\{ message: c\.scheduled\.cancelled \}\);\s*\}/);
    expect(page).not.toMatch(/\bd\.cancelled\b/);
  });

  it('every failure is one ErrorLine (WarningCircle, announced), never red text alone', () => {
    expect(page).toContain('const failure = <ErrorLine message={failureLine(d.error)} />;');
    expect(page).not.toMatch(/text-destructive|tone="destructive"/);
    for (const s of [STATE.scheduled(), STATE.confirm()]) expect(s).toContain('{failure}');
    expect(STATE.loading()).toMatch(/\{d\.error \? \(\s*<>\s*\{failure\}\s*\{tryAgain\}/);
  });

  it('the kill path says only its line; signed out offers Sign in', () => {
    const s = STATE.signedOut();
    expect(s).toContain('{d.configured ? c.signedOut.body : c.notConfigured}');
    expect(s).toMatch(/\{d\.configured \? <Button[^>]*label=\{c\.signedOut\.button\}/);
  });

  it('analytics carry only the stage: started once per visit, and export_offered', () => {
    const tracked = [...page.matchAll(/trackStage\(([^)]*)\)/g)].map((m) => m[1]);
    expect(tracked.sort()).toEqual(["'export_offered'", "'started'"]);
    expect(page).toMatch(/if \(d\.signedIn && first\) d\.trackStage\('started'\);/);
    expect(page).toMatch(/<DeleteAccountPage key=\{attempt\} first=\{attempt === 0\} onRetry=/);
  });
});
