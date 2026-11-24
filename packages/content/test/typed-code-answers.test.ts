/**
 * BL-524 (exec ruling CDesO-19): every answer `invite-redeem` can give to a typed family code has words in
 * `familyCopy`, before BL-445's client reads them.
 *
 * No shared type in packages/api or packages/core lists the endpoint's answers: `ApiErrorCode` and `ERROR_DETAILS`
 * (packages/api/src/envelope.ts) are every endpoint's codes, a superset. So the answers are pinned here, each with the
 * line of supabase/functions/invite-redeem/handler.ts that gives it, and a second test reads that file so a new answer
 * there fails here until it has words. Keys are paths under `familyCopy`; the `code.*` keys are the typed-code lines,
 * the rest are the link path's words, true for a code too.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { familyCopy } from '../src';
import { get } from './support/copy-surfaces';

type Answer = {
  /** `ok:<mode>` for a 200, else the envelope's `error.code`, with `/<detail>` when the detail changes the words. */
  answer: string;
  /** Where handler.ts gives it (as of develop 89ccadd1). */
  source: string;
  /** The familyCopy key the client shows for it. */
  key: string;
};

const ANSWERS: readonly Answer[] = [
  // 200: the peek, then the join (handler.ts:181-189, 192).
  { answer: 'ok:peek', source: 'handler.ts:184', key: 'code.askBody' },
  { answer: 'ok:peek/joined', source: 'handler.ts:184', key: 'errors.already_member' },
  { answer: 'ok:accept', source: 'handler.ts:188', key: 'accept.joinedTitle' },
  // A code that opens nothing: wrong, expired, used, cancelled or a book gone all read as not_found on this path.
  { answer: 'invite_unusable/not_found', source: 'handler.ts:172', key: 'code.errors.not_found' },
  { answer: 'invite_unusable/already_member', source: 'handler.ts:172', key: 'errors.already_member' },
  // Limits: this person, phone or address (memo and database), the SCRAT refusal, and the global brake.
  { answer: 'rate_limited', source: 'handler.ts:132,169,177', key: 'code.errors.rate_limited' },
  { answer: 'rate_limited/codes_paused', source: 'handler.ts:166', key: 'code.errors.codes_paused' },
  // The right code, refused (REFUSED_OK, handler.ts:44; classifySqlstate in packages/api/src/envelope.ts).
  { answer: 'parents_full', source: 'handler.ts:179 (SCCAP)', key: 'errors.book_full' },
  { answer: 'consent_required/family-share', source: 'handler.ts:179 (SCCON)', key: 'errors.family_share_consent' },
  { answer: 'consent_required', source: 'handler.ts:179 (SCCON, any other consent)', key: 'errors.consent_needed' },
  { answer: 'deleted', source: 'handler.ts:179 (SCDEL)', key: 'errors.book_deleted' },
  // The invites kill switch (pausedReply in supabase/functions/_shared/http/http.ts:66).
  { answer: 'paused/invites', source: 'handler.ts:101', key: 'errors.paused' },
  // The session: none, or an anonymous one (the link path reads SCANO as signed out too, inviteErrorKindFor).
  { answer: 'unauthorized', source: 'handler.ts:125', key: 'errors.signed_out' },
  { answer: 'anonymous_refused', source: 'handler.ts:126', key: 'errors.signed_out' },
  // The server could not answer: retryable, nothing joined.
  { answer: 'unavailable', source: 'handler.ts:92,112', key: 'errors.unknown' },
  { answer: 'internal', source: 'handler.ts:195', key: 'errors.unknown' },
  // A request the app should never send (the app checks the code's shape first): no words of their own.
  { answer: 'bad_request', source: 'handler.ts:96,115,120', key: 'errors.unknown' },
  { answer: 'not_found', source: 'handler.ts:97', key: 'errors.unknown' },
  { answer: 'payload_too_large', source: 'handler.ts:117', key: 'errors.unknown' },
];

/** The SQLSTATEs handler.ts lets through as `refused`, and the code classifySqlstate gives each (envelope.ts SQLSTATE_RULES). */
const REFUSED_CODES: Record<string, string> = { SCCAP: 'parents_full', SCCON: 'consent_required', SCDEL: 'deleted', SCRAT: 'rate_limited' };

const HANDLER = readFileSync(join(__dirname, '../../../supabase/functions/invite-redeem/handler.ts'), 'utf8');

describe('[BL-524] every typed family code answer has words', () => {
  it('maps each answer once, to a key that holds a line', () => {
    const answers = ANSWERS.map((a) => a.answer);
    expect(new Set(answers).size).toBe(answers.length);
    for (const a of ANSWERS) {
      const text = get(familyCopy, a.key);
      expect(typeof text, `${a.answer} -> ${a.key}`).toBe('string');
      expect((text as string).trim().length, a.key).toBeGreaterThan(0);
    }
  });

  it('uses every typed-code key, so none sits unread', () => {
    const keys = new Set(ANSWERS.map((a) => a.key));
    const codeKeys = ['code.askBody', ...Object.keys(familyCopy.code.errors).map((k) => `code.errors.${k}`)];
    expect(codeKeys.filter((k) => !keys.has(k))).toEqual([]);
  });

  it('covers every answer handler.ts can give, so a new one fails here until it has words', () => {
    const covered = new Set(ANSWERS.map((a) => a.answer.split('/')[0]!));
    const codes = new Set<string>();
    for (const m of HANDLER.matchAll(/\brefuse\('(\w+)'/g)) codes.add(m[1]!);
    for (const m of HANDLER.matchAll(/failReply\(\{\s*code:\s*'(\w+)'/g)) codes.add(m[1]!);
    if (/\bpausedReply\(/.test(HANDLER)) codes.add('paused');
    if (/\bunavailable\(\{/.test(HANDLER)) codes.add('unavailable');
    // The refusals the database may hand back with the right code.
    const refused = /REFUSED_OK\s*=\s*new Set\(\[([^\]]*)\]\)/.exec(HANDLER);
    expect(refused, 'REFUSED_OK in handler.ts').not.toBeNull();
    const states = [...refused![1]!.matchAll(/'([0-9A-Z]{5})'/g)].map((m) => m[1]!);
    expect(states.filter((s) => !(s in REFUSED_CODES)), 'a refusal with no code pinned here').toEqual([]);
    for (const s of states) codes.add(REFUSED_CODES[s]!);
    expect(codes.size).toBeGreaterThan(10);
    expect([...codes].filter((c) => !covered.has(c)).sort()).toEqual([]);
  });

  it('covers every detail handler.ts names, including the global brake', () => {
    const details = new Set<string>();
    for (const m of HANDLER.matchAll(/detail:\s*'([\w-]+)'/g)) details.add(m[1]!);
    for (const m of HANDLER.matchAll(/'(already_member|not_found|family-share)'/g)) details.add(m[1]!);
    for (const m of HANDLER.matchAll(/pausedReply\('(\w+)'/g)) details.add(m[1]!);
    expect(details).toContain('codes_paused');
    const named = new Set(ANSWERS.flatMap((a) => (a.answer.includes('/') ? [a.answer.split('/')[1]!] : [])));
    expect([...details].filter((d) => !named.has(d)).sort()).toEqual([]);
  });

  it('points the global brake to the link, and never counts tries', () => {
    expect(familyCopy.code.errors.codes_paused).toMatch(/\blink\b/);
    for (const k of Object.keys(familyCopy.code.errors) as (keyof typeof familyCopy.code.errors)[]) {
      const line = familyCopy.code.errors[k];
      expect(line, k).not.toMatch(/\d/);
      expect(line, k).not.toMatch(/\b(?:you (?:typed|entered)|too many|attempts?|wrong|incorrect|invalid)\b/i);
    }
  });
});
