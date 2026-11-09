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

const today = '2026-10-04';
const born = { expecting: false, birthday: '2026-03-01', dueDate: null, today };

describe('[NX-31-R3] first run, name optional, date required', () => {
  it('[NX-31-R3] an empty name with a date creates the book and shows the fallback', () => {
    expect(firstRunChildBlock({ names: [''], ...born })).toBeNull();
    expect(firstRunBookNames([''])).toEqual(['']);
    expect(firstRunBookNames(['  '])).toEqual(['']);
    // every place that shows the name shows "your child"; the stored name stays empty
    expect(fill(copy.onboarding.welcome.body, { child: '' })).toContain('your child');
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
