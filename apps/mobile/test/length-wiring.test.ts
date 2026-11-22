// BL-957: the fields use the one helper (packages/core/src/length.ts). The helper has its own property test in
// packages/core; these tests catch a field that goes back to .slice() or .length (UTF-16 units) or its own segmenter.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { SIGNS_AS_MAX } from '@scribe/core';
import { readPendingInvites } from '../src/lib/family/invite-list.logic';
import { signOff } from '../src/lib/family/invites';
import { normalizePhotoPlace, normalizePhotoText } from '../src/lib/photos/text';

const SRC = join(fileURLToPath(new URL('.', import.meta.url)), '..', 'src');
const FAMILY = '\u{1F469}‍\u{1F467}'; // woman ZWJ girl: one character, three code points
const DEVANAGARI = 'क्षत्रिय'; // 3 characters, 8 code points

describe('[BL-957] From name (synced: the server counts code points, 30)', () => {
  it('never cuts a ZWJ family in two at the limit', () => {
    const typed = 'x'.repeat(SIGNS_AS_MAX - 2) + FAMILY; // 28 + 3 code points = 31
    expect(signOff(typed)).toBe('x'.repeat(SIGNS_AS_MAX - 2));
    expect(signOff('x'.repeat(SIGNS_AS_MAX - 3) + FAMILY)).toBe('x'.repeat(SIGNS_AS_MAX - 3) + FAMILY);
  });
  it('never sends more than 30 code points, so the server never refuses it', () => {
    for (const typed of [DEVANAGARI.repeat(10), 'x'.repeat(29) + '\u{1F600}\u{1F600}', FAMILY.repeat(12)]) {
      const kept = signOff(typed)!;
      expect(Array.from(kept).length).toBeLessThanOrEqual(30);
      expect(typed.startsWith(kept)).toBe(true);
    }
  });
  it('the pending list reads a sign-off the same way', () => {
    const data = { books: [{ id: 'c1', invites: [{ id: 'i1', role: 'parent', status: 'open', created_at: '2026-01-01T00:00:00Z', expires_at: '2099-01-01T00:00:00Z', signs_as: 'x'.repeat(28) + FAMILY }] }] };
    expect(readPendingInvites(data, 'c1')[0].signsAs).toBe('x'.repeat(28));
  });
});

describe('[BL-957] photo words and place (local only: 140 and 60 characters a person sees)', () => {
  it('keeps 140 and 60 Devanagari characters though they are far more code points, and cuts the next', () => {
    const words = 'क्ष'.repeat(140);
    expect(normalizePhotoText(words)).toBe(words);
    expect(normalizePhotoText(words + 'क')).toBe(words);
    expect(normalizePhotoPlace('त्रि'.repeat(60) + 'त')).toBe('त्रि'.repeat(60));
  });
  it('does not split a family at the cut', () => {
    expect(normalizePhotoPlace('x'.repeat(59) + FAMILY + FAMILY)).toBe('x'.repeat(59) + FAMILY);
  });
});

describe('[BL-957] no field goes back to UTF-16 units', () => {
  const read = (...p: string[]) => readFileSync(join(SRC, ...p), 'utf8');
  it('the invite fields and sign-off readers use the helper and no native maxLength', () => {
    for (const f of [['app', 'invite', 'index.tsx'], ['app', 'invite', 'new.tsx']]) {
      const s = read(...f);
      expect(s, f.join('/')).toMatch(/clampGraphemes/);
      expect(s, f.join('/')).not.toMatch(/maxLength=\{SIGNS_AS_MAX\}|\.slice\(0, SIGNS_AS_MAX\)/);
    }
    for (const f of [['lib', 'family', 'invites.ts'], ['lib', 'family', 'invite-list.logic.ts']]) expect(read(...f), f.join('/')).not.toMatch(/signs\w*[^;\n]*\.slice\(0, ?30\)|\.trim\(\)\.slice\(0, ?30\)/);
  });
  it('the photo text has no segmenter of its own', () => {
    const s = read('lib', 'photos', 'text.ts');
    expect(s).toMatch(/clampGraphemes/);
    expect(s).not.toMatch(/Segmenter|CLUSTER/);
  });
});
