/// <reference types="node" />
/**
 * NX-31-R3 and R28 (phone side): the first book may have no name; the date is required. Fictional Asha family only.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { firstRunBookNames, firstRunChildBlock } from '../src/components/onboarding/child-step.logic';
import { addChildBlock } from '../src/components/child/add-child-form.logic';
import { children } from '../src/lib/db/repos';
import { copy, fill } from '../src/lib/copy';
import { letterDateline } from '../src/lib/dates';
import { tonightDateline } from '../src/components/tonight/draft-card.logic';
import { hiddenBooksPage } from '../src/components/settings/hidden-books.logic';
import { familyCopy } from '../src/lib/family/copy';
import { inviteShareText } from '../src/lib/family/share-text';
import { fixture, type Fixture } from './helpers/store-fixture';
import { ashaSnapshot } from './helpers/asha-export';
import { bookHtml, planExport } from '../src/lib/export/build.logic';
import { bookImpacts, impactLines } from '../src/lib/account-deletion/logic';
import { book as bookWords } from '@scribe/content';
import { DEFAULT_PREFS, planReminders, type PlannerChild } from '../src/lib/reminders/planner';
import { zonedToEpoch } from '../src/lib/reminders/tz';

const today = '2026-10-04';
const born = { expecting: false, birthday: '2026-03-01', dueDate: null, today };

describe('[NX-31-R3] first run, name optional, date required', () => {
  it('[NX-31-R3] an empty name with a date creates the book and shows the fallback', () => {
    expect(firstRunChildBlock({ names: [''], ...born })).toBeNull();
    expect(firstRunBookNames([''])).toEqual(['']);
    expect(firstRunBookNames(['  '])).toEqual(['']);
    // every place that shows the name shows "your child"; the stored name stays empty
    expect(fill(copy.onboarding.welcome.body, { child: '' })).toContain('your child');
    // NX-36 S14 and S16 (and the name-absent audit): the Book title of a nameless book is "Your child's book" with a
    // capital, through fill(). Develop pinned the lowercase form while fill() did not capitalise; the capital is back.
    expect(fill(copy.book.title, { child: '' })).toBe("Your child's book");
    expect(fill(copy.onboarding.welcome.body, { child: '' })).not.toContain('{child}');
  });

  it('[NX-31-R3] the fallback starts with a capital when it opens a string, and a typed name is left as typed', () => {
    expect(fill("{child}'s book stays with your co-parent.", { child: ' ' })).toBe("Your child's book stays with your co-parent.");
    expect(fill('Anything to tell {child} today?', { child: '' })).toBe('Anything to tell your child today?');
    expect(fill("{child}'s book is back.", { child: 'asha' })).toBe("asha's book is back.");
    expect(fill('A letter for {child}', { child: '' })).toBe('A letter for your child');
    expect(fill(copy.notifications.birthday.title, { child: '' })).toBe('Happy birthday to your child');
  });

  it('[NX-31-R3] a template that opens with the words your child is not capitalised', () => {
    expect(fill('your child is welcome here, {child}.', { child: '' })).toBe('your child is welcome here, your child.');
    expect(fill('your child, {child}', { child: 'Asha' })).toBe('your child, Asha');
  });

  it('[NX-31-R3] a typed name that is literally "your child" is left exactly as typed', () => {
    expect(fill("{child}'s book", { child: 'your child' })).toBe("your child's book");
    expect(fill('A letter for {child}', { child: 'your child' })).toBe('A letter for your child');
  });

  it('[NX-31-R3] a name and no date: Continue waits and the reason line shows', () => {
    const reason = firstRunChildBlock({ names: ['Asha'], expecting: false, birthday: null, dueDate: null, today });
    expect(reason).toContain('Asha');
    expect(firstRunChildBlock({ names: [''], expecting: false, birthday: null, dueDate: null, today })).toContain('your child');
    expect(firstRunChildBlock({ names: [''], expecting: true, birthday: null, dueDate: null, today })).toBe(copy.onboarding.child.needDueDate);
  });

  it('[NX-31-R3] a typed name is kept as typed, trimmed', () => {
    expect(firstRunBookNames([' Asha '])).toEqual(['Asha']);
  });

  it('[NX-31-R3] twins or more still need each name, so the books can be told apart', () => {
    expect(firstRunChildBlock({ names: ['Asha', ''], ...born })).toBe(copy.onboarding.child.needNameMany);
    expect(firstRunChildBlock({ names: ['Asha', 'Nila'], ...born })).toBeNull();
  });

  it('[NX-31-R28] later books keep their rule: the add-book form still wants a name', () => {
    expect(addChildBlock({ name: '', ...born })).toBe(copy.childrenExtra.nameRequired);
  });
});

describe('[NX-31-R28] the phone stores an empty name as empty', () => {
  let f: Fixture;
  beforeEach(() => {
    f = fixture();
  });
  afterEach(() => f.close());

  it('[NX-31-R28] the phone makes the book with an empty stored name, never the fallback, and a later edit may set or clear it', () => {
    children.insert(f.ctx, 'child-none', { name: '', birthday: '2026-03-01', dueDate: null, signsAs: 'Mama' });
    expect(children.get(f.ctx, 'child-none')?.name).toBe('');
    children.update(f.ctx, 'child-none', { name: 'Asha' });
    expect(children.get(f.ctx, 'child-none')?.name).toBe('Asha');
    children.update(f.ctx, 'child-none', { name: '' });
    expect(children.get(f.ctx, 'child-none')?.name).toBe('');
  });
});

describe('[NX-31-R3] the two places that used to print the raw empty name', () => {
  it('[NX-31-R3] an exported letter to a book with no name says "To: your child", never a blank', () => {
    const snap = ashaSnapshot();
    snap.children = snap.children.map((c) => (c.name === 'Asha' ? { ...c, name: '' } : c));
    const plan = planExport(snap);
    const letters = plan.textFiles.filter((t) => t.path.startsWith('letters/'));
    expect(letters.length).toBeGreaterThan(0);
    const toLines = letters.flatMap((t) => t.text.split('\n').filter((l) => l.startsWith('To:')));
    expect(toLines.length).toBeGreaterThan(0);
    for (const l of toLines) expect(l.trim()).not.toMatch(/^To:\s*$/);
    expect(toLines.some((l) => l.includes('your child'))).toBe(true);
  });

  it('[NX-31-R3] the book pages never print an empty name either', () => {
    const snap = ashaSnapshot();
    const child = { ...snap.children[0], name: '' };
    const html = bookHtml(child, snap.entries.filter((e) => e.childId === child.id), snap.locale);
    expect(html).not.toMatch(/(^|[>\s])'s /);
  });

  it('[NX-31-R3] month notes with names on say "your child", never "\'s first month" or a dangling "and"', () => {
    const LA = 'America/Los_Angeles';
    const blank: PlannerChild = { id: 'child-none', name: '', birthday: '2026-03-08', included: true };
    const dev: PlannerChild = { id: 'child-dev', name: 'Dev', birthday: '2024-05-31', included: true };
    const run = (children: PlannerChild[]) =>
      planReminders({
        now: zonedToEpoch({ y: 2026, m: 10, d: 5, hh: 12, mm: 0 }, LA),
        timeZone: LA,
        children,
        lastSaveAt: null,
        lastForegroundAt: null,
        monthHorizonDays: 60,
        prefs: { ...DEFAULT_PREFS, enabled: true, cadence: 'off', namesOnLockScreen: true },
      });
    const one = run([blank]);
    expect(one.length).toBeGreaterThan(0);
    for (const n of one) {
      expect(`${n.title} ${n.body}`).toContain('your child');
      expect(`${n.title} ${n.body}`).not.toMatch(/(^|\s)'s /);
    }
    const twins = run([blank, { ...dev, birthday: '2026-03-08' }]);
    for (const n of twins) expect(`${n.title} ${n.body}`).toContain('your child and Dev');
  });
});

describe('[NX-31-R3] every visible line with a blank name reads "your child" (the dateline: the stage alone), never a stray separator or a blank', () => {
  // Changed from #701's pin, which wanted "your child · 3 months" here and childLabel in write.tsx. NX-36 S13 says the
  // opposite for the dateline: "Nameless: the stage alone, 7 MONTHS ... omit the name and the dot" (name-audit table:
  // "7 MONTHS (no name, no dot)"). So a blank name gives the stage alone, on Tonight and on Write, from one function.
  it('[NX-31-R3] the Tonight and write datelines, for a blank name, are the stage alone: no dot, no "your child"', () => {
    expect(tonightDateline('', '3 months', 'Sunday')).toEqual({ text: '3 months', a11y: '3 months' });
    expect(tonightDateline('Asha', '3 months', 'Sunday').text).toBe('Asha · 3 months');
    expect(tonightDateline('  ', null, 'Sunday').text).toBe('Sunday');
    const src = readFileSync(join(__dirname, '../src/app/write.tsx'), 'utf8');
    expect(src).not.toMatch(/\$\{child\.name\} · /);
    expect(src).not.toContain('childLabel(');
    expect(src).toContain('writeDateline(child.name, age)');
  });

  it('[NX-31-R3] the letter dateline says "Your child is ...", not " is ..."', () => {
    const line = letterDateline({ name: '', birthday: '2026-03-01' }, '2026-06-05');
    expect(line).toMatch(/\. Your child is /);
    expect(letterDateline({ name: 'Asha', birthday: '2026-03-01' }, '2026-06-05')).toMatch(/\. Asha is /);
  });

  // Changed from #701's pin, which wanted childLabel( in settings/index.tsx. NX-36 S14 wants the Children row title of
  // a nameless book capitalised (its words are "Your child's book"; the row keeps the shorter "Your child", to sit
  // beside rows that read "Asha"), and a lowercase "your child" starts a row badly. The Settings home now uses
  // childRowTitle, which calls childLabel and capitalises it; the child's own page keeps childLabel for the value on
  // its Name row.
  it('[NX-31-R3] the hidden-books list shows "your child" for a book with no name, and the settings rows use the helper', () => {
    const page = hiddenBooksPage([{ id: 'b1', name: '' } as never]);
    expect(page.books[0].name).toBe('your child');
    expect(page.books[0].buttonLabel).toBe(`${copy.children.settings.showButton}, your child`);
    expect(readFileSync(join(__dirname, '../src/app/settings/index.tsx'), 'utf8')).toContain('childRowTitle(');
    expect(readFileSync(join(__dirname, '../src/app/settings/children/[id].tsx'), 'utf8')).toContain('childLabel(');
  });
});

describe('[NX-31-R3] what leaves the phone or lands in a keepsake, for a book with no name', () => {
  it('[NX-31-R3] the invite message and share-sheet title say "our", never "your child"', () => {
    for (const signsAs of [null, 'Mama']) {
      for (const name of ['', '   ']) {
        const { message, title } = inviteShareText(name, signsAs);
        expect(`${message} ${title}`).not.toMatch(/your child|\{|\}/);
        expect(message).toContain('our child');
        expect(title).toBe('Join our book of letters');
      }
    }
    expect(inviteShareText('', 'Mama').message.startsWith('Mama, ')).toBe(true);
    expect(inviteShareText('Asha', null)).toEqual({ message: fill(familyCopy.create.shareMessage, { child: 'Asha' }), title: "Join Asha's book" });
  });

  it('[NX-31-R3] the printed dedication reads "For you, from everyone..." when there is no name', () => {
    const snap = ashaSnapshot();
    const blank = { ...snap.children[0], name: '' };
    const html = bookHtml(blank, snap.entries.filter((e) => e.childId === blank.id), snap.locale);
    expect(html).toContain('For you, from everyone who talked to you this year.');
    expect(html).not.toContain('For your child');
    const named = bookHtml(snap.children[0], snap.entries.filter((e) => e.childId === snap.children[0].id), snap.locale);
    expect(named).toContain(`For ${snap.children[0].name}, from everyone`);
  });
});

const srcOf = (p: string) => readFileSync(join(__dirname, '..', 'src', p), 'utf8');

describe('[NX-31-R3] round two: deletion lines, the exported book, the invite wiring', () => {
  it('[NX-31-R3] account deletion names a book with no name "your child", never a blank, and stores nothing', () => {
    const me = { role: 'parent' as const, is_me: true, signs_as: 'Mumma' };
    const rows = [
      { id: 'b1', name: '', role: 'parent' as const, members: [me, { role: 'parent' as const, is_me: false, signs_as: 'Papa' }] },
      { id: 'b2', name: '', role: 'parent' as const, members: [me] },
      { id: 'b3', name: '  ', role: 'contributor' as const, members: [{ role: 'contributor' as const, is_me: true, signs_as: 'Aunty' }] },
    ];
    const impacts = bookImpacts(rows, () => 2);
    expect(impacts.map((i) => i.child)).toEqual(['', '', '  ']);
    const lines = impactLines(impacts).join('\n');
    // NX-36 S16: these lines open with {child}, so with no name they begin "Your child's book" with a capital, via
    // fill(). Develop pinned them lowercase while fill() did not capitalise; the capital is back.
    expect(lines).toContain("Your child's book stays with Papa");
    expect(lines).toContain("Your child's book will be deleted");
    expect(lines).toContain('Your letters to your child will be removed');
    expect(lines).not.toMatch(/(^|\s)'s |\{|\}/);
  });

  it('[NX-31-R3] the exported book with no name never says "your child" and speaks to the child, in the cover, About page and index', () => {
    const snap = ashaSnapshot();
    const blank = { ...snap.children[0], name: '' };
    const mine = snap.entries.filter((e) => e.childId === blank.id);
    const html = bookHtml(blank, mine, snap.locale);
    const front = html.slice(html.indexOf('<div class="cover">'), html.indexOf('<section class="chapter">'));
    expect(front).not.toContain('your child');
    expect(html).toMatch(/<p class="sub" dir="auto">Letters to you(, Year \d+)?<\/p>/);
    expect(html).toContain(bookWords.aboutThisBook.bodyNoName.slice(0, 60));
    expect(html).not.toContain("'s family");
    const plan = planExport({ ...snap, children: snap.children.map((c) => (c.id === blank.id ? blank : c)) });
    const index = plan.textFiles.find((t) => t.path === 'index.html')!.text;
    expect(index).toContain(`<h2 dir="auto">${bookWords.indexTitleNoName}</h2>`);
    expect(index).not.toMatch(/Letters to your child/);
  });

  it('[NX-31-R3] the no-name book words obey the rules and say the same as the named ones', () => {
    const words = [bookWords.coverSubtitleNoName, bookWords.coverSubtitleAllNoName, bookWords.indexTitleNoName, bookWords.aboutThisBook.bodyNoName];
    for (const w of words) {
      expect(w).not.toMatch(/[\u2013\u2014\u2018\u2019\u201C\u201D\u2026]|\p{Extended_Pictographic}/u);
      expect(w).not.toMatch(/\{child\}|your child/);
    }
    expect(bookWords.aboutThisBook.bodyNoName).toBe(bookWords.aboutThisBook.body.replace("{child}'s family", 'your family'));
  });

  it('[NX-31-R3] a named book prints the old words, and none of the no-name ones', () => {
    const snap = ashaSnapshot();
    const named = snap.children[0];
    const html = bookHtml(named, snap.entries.filter((e) => e.childId === named.id), snap.locale);
    expect(html).toMatch(new RegExp(`<p class="sub" dir="auto">Letters to ${named.name}(, Year \\d+)?</p>`));
    expect(html).toContain(`Every word in this book was spoken or typed by ${named.name}`);
    expect(html).not.toContain('typed by your family');
    for (const w of [bookWords.coverSubtitleAllNoName, bookWords.aboutThisBook.bodyNoName, bookWords.dedicationNoName]) expect(html).not.toContain(w);
    const index = planExport(snap).textFiles.find((t) => t.path === 'index.html')!.text;
    expect(index).toContain(`Letters to ${named.name}</h2>`);
    expect(index).not.toContain(bookWords.indexTitleNoName);
  });

  it('[NX-31-R3] the share sheet gets its words from inviteShareText, not from its own fill', () => {
    const share = srcOf('lib/family/share.ts');
    expect(share).toMatch(/import \{ inviteShareText \} from '\.\/share-text';/);
    expect(share).toMatch(/inviteShareText\(child, signsAs\)/);
    expect(share).not.toMatch(/shareMessage|shareTitle/);
  });
});
