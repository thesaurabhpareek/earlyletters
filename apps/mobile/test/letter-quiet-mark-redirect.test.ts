/// <reference types="node" />
/**
 * [BL-372, D-084] A quiet-day mark has no letter page. The page sends a mark back to the Book before it draws
 * anything, because what it would draw signs the entry: a mark is saved as typed with no words, `letterWords` calls
 * that 'words', and `showsSignature` then puts a From line under an entry the app made.
 *
 * The decision lives inline in `app/letter/[id].tsx` (no .logic helper to call, and the page is not rendered in
 * Node), so the second case is a source pin: the redirect line, where it sits, and where it sends. The first case
 * is the behaviour that makes the line necessary. Fictional family Asha only.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { letterWords } from '../src/components/book/letter-words.logic';
import { isQuietMark, newQuietMark, showsSignature } from '../src/components/book/quiet-day.logic';
import type { Entry } from '../src/lib/store';

const page = readFileSync(join(__dirname, '..', 'src', 'app', 'letter', '[id].tsx'), 'utf8');
const code = page.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

const SENTENCE = 'Tuesday. Not much today. Just Asha, and us, and an ordinary day.';
const newMark = newQuietMark({ id: 'q-asha-1', occurredOn: '2026-10-02', capturedAt: '2026-10-02T19:00:00.000Z' });
// An old build's mark: the template sentence is still in the row (raw is immutable), but the kind is the mark.
const oldMark: Entry = { ...newMark, id: 'q-asha-0', rawTranscript: SENTENCE, finalText: SENTENCE };

describe('[BL-372, D-084] the letter page never opens a quiet-day mark', () => {
  it('a mark, old or new, is a quiet mark, and the page body would sign it if it were drawn', () => {
    expect(isQuietMark(newMark)).toBe(true);
    expect(isQuietMark(oldMark)).toBe(true);
    expect(isQuietMark({ kind: 'letter' })).toBe(false);
    // Why the redirect has to come first: past it, the page would put a signature under the mark.
    expect(showsSignature(letterWords(newMark))).toBe(true);
    expect(showsSignature(letterWords(oldMark))).toBe(true);
  });

  it('the page redirects a mark to the Book before NotFound and before it works out the words or the signature (source)', () => {
    const redirect = /if \(entry && isQuietMark\(entry\)\) return <Redirect href="\/book" \/>;/;
    expect(code).toMatch(redirect);
    expect(code.match(/isQuietMark\(/g)).toHaveLength(1);
    expect(code).toMatch(/import \{[^}]*\bRedirect\b[^}]*\} from 'expo-router';/);

    const body = code.slice(code.indexOf('function Letter()'));
    const at = body.search(redirect);
    expect(at).toBeGreaterThan(-1);
    // Nothing returns from the page before the redirect, and the words and signature are worked out only after it.
    expect(body.slice(0, at)).not.toMatch(/\breturn\b/);
    expect(body.indexOf('return <NotFound')).toBeGreaterThan(at);
    expect(body.indexOf('letterWords(entry)')).toBeGreaterThan(at);
    expect(body.indexOf('showsSignature(words)')).toBeGreaterThan(at);
  });
});
