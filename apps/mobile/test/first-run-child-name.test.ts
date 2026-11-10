/// <reference types="node" />
/**
 * NX-31-R3 and R28 (phone side): the first book may have no name; the date is required. Fictional Asha family only.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { firstRunBookNames, firstRunChildBlock } from '../src/components/onboarding/child-step.logic';
import { addChildBlock } from '../src/components/child/add-child-form.logic';
import { children } from '../src/lib/db/repos';
import { copy, fill } from '../src/lib/copy';
import { fixture, type Fixture } from './helpers/store-fixture';
import { ashaSnapshot } from './helpers/asha-export';
import { bookHtml, planExport } from '../src/lib/export/build.logic';
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
    expect(fill(copy.book.title, { child: '' })).toBe("your child's book");
    expect(fill(copy.onboarding.welcome.body, { child: '' })).not.toContain('{child}');
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
    expect(html).toContain('your child');
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
