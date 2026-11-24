/// <reference types="node" />
/**
 * BL-1961 (BL-444 slice 3b; F11-REQ-011, DATA-REQ-016): the Delete confirmation for a left book's letter. Data steward
 * ruling on BL-1960: an `in_book` letter says it also leaves the book the other parent reads and carries
 * `familyCopy.leave.cantTakeBack`; a private letter never names that book. Failure each test guards: a private letter
 * that frightens the person with a co-parent's book it was never in, an in-book letter that hides where else it goes,
 * and a screen line that promises keeping, safety or freshness a left book does not have.
 * Fictional Asha family only.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { familyCopy, leftBookCopy, leftBookDeleteCopy } from '@scribe/content';
import { describe, expect, it } from 'vitest';
import { leftBookDeleteBody } from '../src/components/settings/left-books.logic';

const src = (p: string) => readFileSync(join(__dirname, '..', 'src', p), 'utf8');
const BANNED = /\b(kept|keep|keeps|stay|stays|stayed|only you|safe|safely)\b|on this phone/i;

describe('[BL-1961] a left book letter in the book: the delete says where else it goes', () => {
  const body = leftBookDeleteBody({ inBook: true }, 'Papa');
  it('says it also leaves the book the other parent reads, by their name', () => {
    expect(body).toContain("It leaves the book Papa reads too.");
  });
  it('carries the existing cantTakeBack line, filled with the same name', () => {
    expect(body.endsWith(familyCopy.leave.cantTakeBack.replace('{coParent}', 'Papa'))).toBe(true);
  });
  it('reads "your co-parent" when no sign-off is known', () => {
    expect(leftBookDeleteBody({ inBook: true })).toContain('the book your co-parent reads too');
    expect(leftBookDeleteBody({ inBook: true }, '  ')).toContain("your co-parent's phone");
  });
});

describe('[BL-1961] a private left book letter: nothing about the other parent', () => {
  const body = leftBookDeleteBody({ inBook: false }, 'Papa');
  it('does not name the other parent, their book or their phone, and has no cantTakeBack line', () => {
    expect(body).toBe(leftBookDeleteCopy.bodyPrivate);
    expect(body).not.toMatch(/Papa|co-parent|reads|book|phone|export/i);
  });
});

describe('[BL-1961] the words promise no keeping, safety or freshness, and gender no child', () => {
  const lines = [leftBookDeleteBody({ inBook: true }, 'Papa'), leftBookDeleteBody({ inBook: false }), ...Object.values(leftBookCopy)];
  it('no "kept", "stays", "only you", "on this phone" or "safe" in the delete or the left book page', () => {
    for (const l of lines) expect(l).not.toMatch(BANNED);
  });
  it('no freshness, export or undo promise, no em or en dash, curly quote or ellipsis', () => {
    for (const l of lines) {
      expect(l).not.toMatch(/\b(latest|up to date|synced|restore it|undo)\b/i);
      expect(l).not.toMatch(/[–—‘’“”…]/);
    }
  });
  it('no line says the letter can come back', () => {
    expect(leftBookDeleteCopy.bodyInBook).toMatch(/can't be restored/);
    expect(leftBookDeleteCopy.bodyPrivate).toMatch(/can't be restored/);
  });
});

describe('[BL-1961, BL-1959] the letter page deletes a left book letter through its own door, with no Undo', () => {
  const page = src('app/letter/[id].tsx');
  it('a read only letter calls deleteLeftBookLetter and returns before the Undo toast', () => {
    expect(page).toMatch(/if \(readOnly\) \{\s*if \(!deleteLeftBookLetter\(gone\.id\)\)[\s\S]*?toast\.show\(\{ message: copy\.settings\.delete\.entryToast \}\);\s*return back\(\);/);
  });
  it('the confirmation body comes from leftBookDeleteBody for a read only letter, and the Delete row is only for the author', () => {
    expect(page).toMatch(/body=\{readOnly \? leftBookDeleteBody\(entry\) : copy\.settings\.delete\.entryBody\}/);
    expect(page).toMatch(/\{readOnly && own && \(/);
  });
});
