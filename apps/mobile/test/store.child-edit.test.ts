/// <reference types="node" />
/**
 * Editing a child's details (Settings > the child's book): name, birthday or due date,
 * signature, and a due date becoming a birthday. Whatever is edited, no letter changes
 * (raw_transcript, captured_at, audio, the signature it was written with) and the
 * child's id stays the same. Fictional Asha family only.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { bornPatch, checkBirthday, checkChildName, checkSignsAs, dueDatePassed, monthOfAgeOn } from '@scribe/core';
import { children, entries } from '../src/lib/db/repos';
import { fixture, letter, rawRow, seedChild, type Fixture } from './helpers/store-fixture';

let f: Fixture;
const defaults = { childId: null, authorSignsAs: null };
const A = '0199a5b0-0000-7000-8000-00000000000a';
const B = '0199a5b0-0000-7000-8000-00000000000b';

beforeEach(() => {
  f = fixture();
  seedChild(f.db);
  seedChild(f.db, 'child-ravi', 'Amma');
  entries.upsert(f.ctx, letter({ id: A, occurredOn: '2026-10-03', capturedAt: '2026-10-03T08:30:00.000Z' }), defaults);
  entries.upsert(f.ctx, letter({ id: B, childId: 'child-ravi', authorSignsAs: 'Amma' }), defaults);
});
afterEach(() => f.close());

const entryRows = () => [rawRow(f.db, A), rawRow(f.db, B)];

describe('editing a child never touches a letter', () => {
  it('a new name, birthday and signature leave every letter column as it was (raw_transcript, captured_at, audio, signature)', () => {
    const before = entryRows();
    children.update(f.ctx, 'child-asha', { name: 'Asha Rose', birthday: '2026-02-20', signsAs: 'Papa' });
    expect(entryRows()).toEqual(before);
    const a = rawRow(f.db, A)!;
    expect(a.raw_transcript).toBe(letter().rawTranscript);
    expect(a.captured_at).toBe('2026-10-03T08:30:00.000Z');
    expect(a.audio_uri).toBe('file:///Documents/recording-1.m4a');
    // the letter keeps the signature it was written with
    expect(a.author_signs_as).toBe('Mama');
  });

  it('keeps the same child id and does not touch another child', () => {
    const other = children.get(f.ctx, 'child-ravi');
    children.update(f.ctx, 'child-asha', { name: 'Asha Rose' });
    expect(children.get(f.ctx, 'child-asha')).toMatchObject({ id: 'child-asha', name: 'Asha Rose', birthday: '2026-03-01' });
    expect(children.get(f.ctx, 'child-ravi')).toEqual(other);
    expect(rawRow(f.db, A)!.child_id).toBe('child-asha');
  });

  it('a letter written after a signature change gets the new signature, older ones keep theirs', () => {
    children.update(f.ctx, 'child-asha', { signsAs: 'Papa' });
    entries.upsert(f.ctx, letter({ id: '0199a5b0-0000-7000-8000-00000000000c', authorSignsAs: undefined }), { childId: 'child-asha', authorSignsAs: 'Papa' });
    expect(rawRow(f.db, A)!.author_signs_as).toBe('Mama');
    expect(rawRow(f.db, '0199a5b0-0000-7000-8000-00000000000c')!.author_signs_as).toBe('Papa');
  });
});

describe('a due date becomes a birthday', () => {
  const today = '2026-10-04';
  beforeEach(() => {
    f.db.run("INSERT INTO children (id, name, birthday, due_date, signs_as, created_at, updated_at) VALUES ('child-nila', 'Nila', NULL, '2026-09-28', 'Mama', ?, ?)", f.ctx.now(), f.ctx.now());
  });

  it('is offered once the due date has gone by, and the update sets the birthday and clears the due date', () => {
    const c = children.get(f.ctx, 'child-nila')!;
    expect(dueDatePassed(c.dueDate, today)).toBe(true);
    const r = bornPatch({ birthday: c.birthday, dueDate: c.dueDate }, '2026-09-30', today);
    expect(r.ok).toBe(true);
    if (r.ok) children.update(f.ctx, 'child-nila', r.patch);
    expect(children.get(f.ctx, 'child-nila')).toMatchObject({ id: 'child-nila', birthday: '2026-09-30', dueDate: null });
  });

  it('letters written before the birthday stay before it; later ones get a month of age', () => {
    expect(monthOfAgeOn('2026-09-30', '2026-09-20')).toBeNull();
    expect(monthOfAgeOn('2026-09-30', '2026-10-03')).toBe(0);
  });
});

describe('the same validation as first run', () => {
  it('trims a name and refuses an empty one', () => {
    expect(checkChildName('  Asha  ')).toMatchObject({ ok: true, value: 'Asha' });
    expect(checkChildName(' ')).toMatchObject({ ok: false, reason: 'empty' });
  });
  it('a birthday cannot be in the future; a signature cannot be empty', () => {
    expect(checkBirthday('2026-10-05', '2026-10-04')).toMatchObject({ ok: false, reason: 'future' });
    expect(checkSignsAs('')).toMatchObject({ ok: false });
  });
});
