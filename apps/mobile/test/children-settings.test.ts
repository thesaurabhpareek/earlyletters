/// <reference types="node" />
/**
 * Add a child (S47) and a child's book settings (S46), EXPERIENCE_PASS_2026-10 package P6. The rules are pure
 * (components/child/add-child-form.logic.ts, child-settings.logic.ts) and run here; the screens are React Native, so
 * their use of the rules is pinned in their source. That no letter changes when a name, date or signature changes is
 * test/store.child-edit.test.ts. Fixtures: the fictional family Asha only (CLAUDE.md).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { en, familyCopy } from '@scribe/content';
import { addChildBlock, addChildCta, addChildValues, ADD_BUTTON_MAX } from '../src/components/child/add-child-form.logic';
import { bookRow, bornCard, bornCardHiddenKey, bornCardShown, coParentOf, FAMILY_TAB_HREF, hideFooter } from '../src/components/child/child-settings.logic';
import { inviteHref } from '../src/lib/family/entry.logic';

const SRC = join(__dirname, '..', 'src');
const code = (rel: string) =>
  readFileSync(join(SRC, rel), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');

const TODAY = '2026-10-17';
const o = en.onboarding.child;
const x = en.childrenExtra;
const none = { name: '', expecting: false, birthday: null, dueDate: null, today: TODAY };

describe('[S47] Add a child: the first-run rules, with no date chosen for the person', () => {
  it('the birthday and the due date start empty; nothing is added until both the name and a date are right', () => {
    const form = code('components/child/add-child-form.tsx');
    expect(form).toMatch(/const \[birthday, setBirthday\] = React\.useState<string \| null>\(null\)/);
    expect(form).toMatch(/const \[dueDate, setDueDate\] = React\.useState<string \| null>\(null\)/);
    expect(form).not.toMatch(/new Date\(\)/); // no default date anywhere on the form
    expect(form).not.toMatch(/DateTimePicker/); // the shared DateField, which never invents a value
    expect(form).toMatch(/<Chip label=\{o\.bornToday\} onPress=\{\(\) => setBirthday\(today\)\}/);
    expect(addChildValues({ ...none, name: 'Asha' })).toBeNull(); // a seven-month-old is never saved as a newborn by default
  });

  it('says why the primary waits, in words, and names the child only once a name is typed', () => {
    expect(addChildBlock(none)).toBe(x.nameRequired);
    expect(addChildBlock({ ...none, name: '   ' })).toBe(x.nameRequired);
    expect(addChildBlock({ ...none, name: 'Asha' })).toBe("Choose Asha's birthday to continue.");
    expect(addChildBlock({ ...none, name: 'Asha', birthday: '2026-10-20' })).toBe(x.edit.birthdayFuture);
    expect(addChildBlock({ ...none, name: 'Asha', birthday: '2026-03-01' })).toBeNull();
    expect(addChildBlock({ ...none, name: 'Asha', expecting: true })).toBe(o.needDueDate);
    expect(addChildBlock({ ...none, name: 'Asha', expecting: true, dueDate: '2026-10-01' })).toBe(x.edit.dueDateRange);
    expect(addChildBlock({ ...none, name: 'Asha', expecting: true, dueDate: '2026-12-01' })).toBeNull();
  });

  it('never puts a placeholder inside a sentence', () => {
    const lines = [
      addChildBlock(none),
      addChildBlock({ ...none, name: 'Asha' }),
      addChildBlock({ ...none, name: 'Asha', expecting: true }),
      addChildCta(''),
      addChildCta('Asha'),
    ];
    for (const l of lines) expect(l, String(l)).not.toMatch(/\{\w+\}|Their name|your child|\bName\b/);
    // The old helper printed the field label as a name ("We sort letters by Their name's month of age."): gone.
    expect(code('components/child/add-child-form.tsx')).not.toMatch(/birthdayHelp|children\.add\.body|nameHelp/);
  });

  it('the primary reads "Add Asha\'s book", or "Add this book" before a name or when the name makes it long', () => {
    expect(addChildCta('')).toBe(en.children.add.ctaShort);
    expect(addChildCta('Asha')).toBe("Add Asha's book");
    expect(addChildCta('  Asha  ')).toBe("Add Asha's book");
    expect(addChildCta('Alexandrina Rose')).toBe(en.children.add.ctaShort);
    for (const n of ['', 'Asha', 'Nila', 'Alexandrina Rose', 'A'.repeat(60)]) expect(addChildCta(n).length, n).toBeLessThanOrEqual(ADD_BUTTON_MAX);
  });

  it('adds only the date for the chosen state, the name as checked, and no Plus gate', () => {
    expect(addChildValues({ ...none, name: ' Asha ', birthday: '2026-03-01', dueDate: '2026-12-01' })).toEqual({ name: 'Asha', birthday: '2026-03-01', dueDate: null });
    expect(addChildValues({ ...none, name: 'Asha', expecting: true, birthday: '2026-03-01', dueDate: '2026-12-01' })).toEqual({ name: 'Asha', birthday: null, dueDate: '2026-12-01' });
    expect(code('components/child/add-child-form.tsx')).not.toMatch(/PlusGate|keepGate|presentPlusStore|usePlan/);
  });
});

describe('[S46] the due-date card: never presumes a birth, can be hidden', () => {
  it('shows only with no birthday, once the due date has gone by, and not while hidden for that due date', () => {
    const base = { birthday: null, dueDate: '2026-10-01', today: TODAY, hiddenFor: null };
    expect(bornCardShown(base)).toBe(true);
    expect(bornCardShown({ ...base, birthday: '2026-10-02' })).toBe(false);
    expect(bornCardShown({ ...base, dueDate: '2026-11-01' })).toBe(false);
    expect(bornCardShown({ ...base, dueDate: null })).toBe(false);
    expect(bornCardShown({ ...base, hiddenFor: '2026-10-01' })).toBe(false);
    // Hidden for an older due date: a new one brings the card back.
    expect(bornCardShown({ ...base, hiddenFor: '2026-09-20' })).toBe(true);
    expect(bornCardHiddenKey('child-asha')).toBe('child.bornCardHidden.child-asha');
  });

  it('never says the child was born, never celebrates and never counts days', () => {
    const card = bornCard('Asha');
    expect(card).toEqual({ title: "Asha's birthday", body: 'Add it when you are ready.', setButton: 'Set the birthday', hideButton: 'Hide' });
    for (const line of Object.values(card)) {
      expect(line).not.toMatch(/\bborn\b|congrat|welcome|arrived|\d/i);
    }
    const screen = code('app/settings/children/[id].tsx');
    expect(screen).not.toMatch(/born\.offer\b/);
    expect(screen).not.toMatch(/LineArt|confetti|Lamp\b/);
    // "Hide" puts it away; opening the Due date row brings it back.
    expect(screen).toMatch(/const openDate = \(\) => \{[\s\S]*writeHidden\(child\.id, null\)[\s\S]*setEditing\('date'\)/);
    expect(screen).toMatch(/onPress=\{openDate\}/);
  });
});

describe('[S46] Hide this book is not destructive, and says it is only for you with a co-parent', () => {
  it('the row and its confirm are plain, not destructive red (nothing is deleted)', () => {
    const screen = code('app/settings/children/[id].tsx');
    const hide = screen.slice(screen.indexOf('const hide = () =>'), screen.indexOf('return (', screen.indexOf('const hide = () =>')));
    expect(hide).toMatch(/style: 'default'/);
    expect(hide).not.toMatch(/destructive/);
    expect(screen).toMatch(/<ListRow title=\{s\.hideLabel\} onPress=\{hide\}/);
    expect(screen).not.toMatch(/title=\{s\.hideLabel\} variant="destructive"/);
  });

  it('with two parents, the footer adds that hiding is only for you, with the other parent\'s own signature', () => {
    expect(hideFooter('Asha', null)).toBe("Hiding Asha's book quiets every reminder and message about Asha. Nothing is deleted.");
    expect(hideFooter('Asha', 'Papa')).toBe("Hiding Asha's book quiets every reminder and message about Asha. Nothing is deleted. Hiding is only for you. Papa still sees Asha's book as before.");
    expect(coParentOf([])).toBeNull();
    expect(coParentOf([{ role: 'contributor', signsAs: 'Nani' }])).toBeNull();
    expect(coParentOf([{ role: 'parent', signsAs: '  ' }, { role: 'parent', signsAs: 'Papa' }])).toBe('Papa');
    expect(code('app/settings/children/[id].tsx')).toMatch(/footer=\{hideFooter\(name, coParent\)\}/);
  });
});

describe('[S46] Write this book together', () => {
  it('server features off: the coming-soon row as today; on, one parent: the invite; two parents: the Family tab', () => {
    const off = bookRow({ serverFeatures: false, coParent: null, invite: inviteHref('settings_child', false, 'child-asha') });
    expect(off).toEqual({ value: familyCopy.soon.status, footer: familyCopy.soon.settingsRowHelp, href: inviteHref('settings_child', false, 'child-asha') });
    const one = bookRow({ serverFeatures: true, coParent: null, invite: inviteHref('settings_child', true, 'child-asha') });
    expect(one).toEqual({ href: '/invite/new?childId=child-asha' });
    const two = bookRow({ serverFeatures: true, coParent: 'Papa', invite: inviteHref('settings_child', true, 'child-asha') });
    expect(two).toEqual({ value: 'Papa', href: FAMILY_TAB_HREF });
    // The label is the same words P8's bookRow.label will carry; the screen reads it from content.
    expect(familyCopy.soon.settingsRow).toBe('Write this book together');
    expect(code('app/settings/children/[id].tsx')).toMatch(/<ListRow title=\{familyCopy\.soon\.settingsRow\} value=\{row\.value\}/);
  });
});

describe('[S46] the editors use the S46 words', () => {
  it('the limits read "Up to {n} characters." and a new signature says older letters keep theirs', () => {
    const editors = code('components/child/child-editors.tsx');
    expect(editors).toMatch(/fill\(e\.nameTooLong, \{ n: CHILD_NAME_MAX \}\)/);
    expect(editors).toMatch(/fill\(e\.signsAsTooLong, \{ n: SIGNS_AS_MAX \}\)/);
    expect(editors).toMatch(/: e\.signsAsNewOnly\}/);
    expect(x.edit.nameTooLong).toBe('Up to {n} characters.');
    expect(x.edit.signsAsNewOnly).toBe('Letters already written keep their signature.');
  });
});
