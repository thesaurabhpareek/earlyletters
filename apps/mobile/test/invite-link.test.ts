/// <reference types="node" />
import { createHash, randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { brand } from '@scribe/brand';
import { familyCopy } from '@scribe/content';
import {
  PENDING_INVITE_MAX_AGE_MS,
  shouldClearPendingInvite,
  decodePendingInvite,
  encodePendingInvite,
  inviteUrl,
  isInviteToken,
  parseInviteInput,
  parseInviteUrl,
} from '../src/lib/family/invite-link.logic';
import { errorDetail, FINAL_INVITE_ERRORS, inviteErrorKind, isMissingFunction, trackedInviteReason, type InviteErrorKind } from '../src/lib/family/invite-errors.logic';
import { byteaArg, newInviteDraft } from '../src/lib/family/invite-draft.logic';
import { readInvitePreview, UNKNOWN_PREVIEW } from '../src/lib/family/invite-preview.logic';
import { joinPlan, type JoinInputs } from '../src/lib/family/join-flow.logic';
import { decodeSeen, encodeSeen, familyTabState, leftSince, seenCoParentsKey } from '../src/lib/family/members.logic';

const ORIGIN = brand.web.origin; // https://earlyletters.com
// What create_child_invite returns today: two v4 UUIDs without dashes, 64 hex characters.
const TOKEN = '3f2a9c1e5b7d4e8fa1c2d3e4f5a6b7c89d0e1f2a3b4c5d6e7f8091a2b3c4d5e6';

describe('invite links (PRD A F7, B F5; PRD V2 F11 /j#t=)', () => {
  it('builds the shared link on the brand origin, the token in the fragment', () => {
    expect(inviteUrl(TOKEN, ORIGIN)).toBe(`https://earlyletters.com/j#t=${TOKEN}`);
    expect(inviteUrl(TOKEN, `${ORIGIN}/`)).toBe(`https://earlyletters.com/j#t=${TOKEN}`);
    expect(() => inviteUrl('short', ORIGIN)).toThrow('invite_token_invalid');
  });

  it('never puts the token where a server sees it (path or query)', () => {
    const u = inviteUrl(TOKEN, ORIGIN);
    expect(u.slice(0, u.indexOf('#'))).not.toContain(TOKEN);
  });

  it('round-trips: the link it builds is the link it reads', () => {
    expect(parseInviteUrl(inviteUrl(TOKEN, ORIGIN), ORIGIN)).toBe(TOKEN);
  });

  it('accepts a trailing slash, the www host, a stray query and other fragment parameters', () => {
    expect(parseInviteUrl(`https://earlyletters.com/j/#t=${TOKEN}`, ORIGIN)).toBe(TOKEN);
    expect(parseInviteUrl(`https://www.earlyletters.com/j#t=${TOKEN}`, ORIGIN)).toBe(TOKEN);
    expect(parseInviteUrl(`https://earlyletters.com/j?utm_source=x#t=${TOKEN}&y=1`, ORIGIN)).toBe(TOKEN);
    expect(parseInviteUrl(`HTTPS://EarlyLetters.com/j#t=${TOKEN}`, ORIGIN)).toBe(TOKEN);
  });

  it('accepts future base64url tokens (32 random bytes)', () => {
    const b64 = 'q8Zr0_Yc-3Jk9LmN2pQ4sT6vW8xZ1aB3cD5eF7gH9iJ';
    expect(isInviteToken(b64)).toBe(true);
    expect(parseInviteUrl(`https://earlyletters.com/j#t=${b64}`, ORIGIN)).toBe(b64);
  });

  it('[TDD 04 3.1.6] refuses anything that is not an https link on the brand host', () => {
    expect(parseInviteUrl(`http://earlyletters.com/j#t=${TOKEN}`, ORIGIN)).toBeNull();
    expect(parseInviteUrl(`scribe://j#t=${TOKEN}`, ORIGIN)).toBeNull();
    expect(parseInviteUrl(`https://earlyletters.app/j#t=${TOKEN}`, ORIGIN)).toBeNull();
    expect(parseInviteUrl(`https://evil.example/j#t=${TOKEN}`, ORIGIN)).toBeNull();
    expect(parseInviteUrl(`https://earlyletters.com.evil.example/j#t=${TOKEN}`, ORIGIN)).toBeNull();
    expect(parseInviteUrl(`https://earlyletters.com@evil.example/j#t=${TOKEN}`, ORIGIN)).toBeNull();
    expect(parseInviteUrl(`https://evil.example@earlyletters.com/j#t=${TOKEN}`, ORIGIN)).toBeNull();
  });

  it('refuses a token in the path or the query, and the old /i/<token> form', () => {
    expect(parseInviteUrl(`https://earlyletters.com/i/${TOKEN}`, ORIGIN)).toBeNull();
    expect(parseInviteUrl(`https://earlyletters.com/j/${TOKEN}`, ORIGIN)).toBeNull();
    expect(parseInviteUrl(`https://earlyletters.com/j?t=${TOKEN}`, ORIGIN)).toBeNull();
  });

  it('refuses malformed paths and tokens', () => {
    expect(parseInviteUrl('https://earlyletters.com/j', ORIGIN)).toBeNull();
    expect(parseInviteUrl('https://earlyletters.com/j#t=', ORIGIN)).toBeNull();
    expect(parseInviteUrl('https://earlyletters.com/j#t=abc', ORIGIN)).toBeNull();
    expect(parseInviteUrl(`https://earlyletters.com/j/extra#t=${TOKEN}`, ORIGIN)).toBeNull();
    expect(parseInviteUrl(`https://earlyletters.com/invite#t=${TOKEN}`, ORIGIN)).toBeNull();
    expect(parseInviteUrl(`https://earlyletters.com/j#t=${TOKEN}%00`, ORIGIN)).toBeNull();
    expect(parseInviteUrl('not a url', ORIGIN)).toBeNull();
  });

  it('refuses /J, an encoded /j, a double slash and a second #, from the system or pasted', () => {
    for (const url of [
      `https://earlyletters.com/J#t=${TOKEN}`,
      `https://earlyletters.com/%6A#t=${TOKEN}`,
      `https://earlyletters.com/%6a#t=${TOKEN}`,
      `https://earlyletters.com//j#t=${TOKEN}`,
      `https://earlyletters.com/j#t=${TOKEN}#x`,
      `https://earlyletters.com/j#x#t=${TOKEN}`,
    ]) {
      expect(parseInviteUrl(url, ORIGIN), url).toBeNull();
      expect(parseInviteInput(url, ORIGIN), url).toBeNull();
    }
  });

  it('never reads the query: /j?t=<a>#t=<b> gives <b>, and /j?t=<a> alone is refused', () => {
    const OTHER = 'b'.repeat(64);
    expect(parseInviteUrl(`https://earlyletters.com/j?t=${TOKEN}#t=${TOKEN}`, ORIGIN)).toBe(TOKEN);
    expect(parseInviteUrl(`https://earlyletters.com/j?t=${OTHER}#t=${TOKEN}`, ORIGIN)).toBe(TOKEN);
    expect(parseInviteInput(`https://earlyletters.com/j?t=${OTHER}#t=${TOKEN}`, ORIGIN)).toBe(TOKEN);
    expect(parseInviteUrl(`https://earlyletters.com/j?t=${TOKEN}`, ORIGIN)).toBeNull();
    expect(parseInviteInput(`https://earlyletters.com/j?t=${TOKEN}`, ORIGIN)).toBeNull();
  });
});

describe('"I was invited": pasted text (A-REQ-029)', () => {
  it('finds the link inside a whole forwarded message', () => {
    const msg = `Hi, it's Papa. I started a book of letters for Asha. Join me here: https://earlyletters.com/j#t=${TOKEN} see you soon`;
    expect(parseInviteInput(msg, ORIGIN)).toBe(TOKEN);
  });

  it('accepts the bare link, the token alone and surrounding spaces', () => {
    expect(parseInviteInput(`  https://earlyletters.com/j#t=${TOKEN}  `, ORIGIN)).toBe(TOKEN);
    expect(parseInviteInput(`\n${TOKEN}\n`, ORIGIN)).toBe(TOKEN);
  });

  it('skips lookalike links and takes the first real one', () => {
    const msg = `https://earlyletters.app/j#t=${TOKEN.replace('3f', 'aa')} or https://earlyletters.com/j#t=${TOKEN}.`;
    expect(parseInviteInput(msg, ORIGIN)).toBe(TOKEN);
  });

  it('accepts every form parseInviteUrl accepts: a query on /j, other fragment parameters, www, any case', () => {
    for (const url of [
      `https://earlyletters.com/j?x=1#t=${TOKEN}`,
      `https://earlyletters.com/j?utm=x#t=${TOKEN}`,
      `https://earlyletters.com/j#y=1&t=${TOKEN}`,
      `https://earlyletters.com/j/?utm_source=x&y=2#y=1&t=${TOKEN}&z=3`,
      `https://www.earlyletters.com/j#t=${TOKEN}`,
      `HTTPS://EarlyLetters.com/j#t=${TOKEN}`,
    ]) {
      expect(parseInviteUrl(url, ORIGIN), url).toBe(TOKEN);
      expect(parseInviteInput(url, ORIGIN), url).toBe(TOKEN);
      expect(parseInviteInput(`Join me here: ${url} see you`, ORIGIN), url).toBe(TOKEN);
      expect(parseInviteInput(`(${url}).`, ORIGIN), url).toBe(TOKEN);
    }
  });

  it('agrees with parseInviteUrl on every link, accepted or refused', () => {
    const OTHER = 'b'.repeat(64);
    const links = [
      `https://earlyletters.com/j#t=${TOKEN}`,
      `https://earlyletters.com/j/#t=${TOKEN}&y=1`,
      `https://earlyletters.com/j#t=${OTHER}&t=${TOKEN}`,
      `https://earlyletters.com/j#%74=${TOKEN}`,
      `https://earlyletters.com:443/j#t=${TOKEN}`,
      `https://earlyletters.com/j?t=${TOKEN}`,
      `https://earlyletters.com/j/${TOKEN}`,
      `https://earlyletters.com/i/${TOKEN}`,
      `https://earlyletters.com/i#t=${TOKEN}`,
      `https://earlyletters.com/j#T=${TOKEN}`,
      `https://earlyletters.com/j#t=`,
      `https://earlyletters.com/j#t=${TOKEN}+`,
      `https://earlyletters.com/j/x#t=${TOKEN}`,
      `https://earlyletters.com.evil.example/j#t=${TOKEN}`,
      `https://evil.example@earlyletters.com/j#t=${TOKEN}`,
      `https://earlyletters.com@evil.example/j#t=${TOKEN}`,
      `https://earlyletters.app/j#t=${TOKEN}`,
    ];
    for (const url of links) expect(parseInviteInput(url, ORIGIN), url).toBe(parseInviteUrl(url, ORIGIN));
  });

  it('returns null when nothing usable is there', () => {
    expect(parseInviteInput('', ORIGIN)).toBeNull();
    expect(parseInviteInput('hello', ORIGIN)).toBeNull();
    expect(parseInviteInput(`scribe://j#t=${TOKEN}`, ORIGIN)).toBeNull();
    expect(parseInviteInput(`https://earlyletters.com/i/${TOKEN}`, ORIGIN)).toBeNull();
  });
});

describe('pending invite in the Keychain (A-REQ-028)', () => {
  const now = Date.parse('2026-10-03T09:00:00.000Z');

  it('round-trips and survives an app kill (it is just the stored string)', () => {
    const raw = encodePendingInvite({ token: TOKEN, receivedAt: now });
    expect(decodePendingInvite(raw, now + 60_000)).toEqual({ token: TOKEN, receivedAt: now });
  });

  it('drops damaged, foreign or stale values', () => {
    expect(decodePendingInvite(null, now)).toBeNull();
    expect(decodePendingInvite('{not json', now)).toBeNull();
    expect(decodePendingInvite(JSON.stringify({ t: 'short', at: now }), now)).toBeNull();
    const raw = encodePendingInvite({ token: TOKEN, receivedAt: now });
    expect(decodePendingInvite(raw, now + PENDING_INVITE_MAX_AGE_MS + 1)).toBeNull();
  });
});

describe('invite errors (supabase/APPLY.md SCINV, SCPAR, SCRAT)', () => {
  const pg = (code: string, message: string) => ({ code, message, details: null, hint: null });

  it('tells apart the SCINV reasons from the server message', () => {
    expect(inviteErrorKind(pg('SCINV', 'invite expired'))).toBe('expired');
    expect(inviteErrorKind(pg('SCINV', 'invite already used'))).toBe('used');
    expect(inviteErrorKind(pg('SCINV', 'invite revoked'))).toBe('revoked');
    expect(inviteErrorKind(pg('SCINV', 'already a member of this book'))).toBe('already_member');
    expect(inviteErrorKind(pg('SCINV', 'invite not found'))).toBe('not_found');
  });

  it('maps parent-only, rate limit, consent and deleted book', () => {
    expect(inviteErrorKind(pg('SCPAR', 'only a parent can invite'))).toBe('not_parent');
    expect(inviteErrorKind(pg('SCRAT', 'too many invites today'))).toBe('rate_limited');
    expect(inviteErrorKind(pg('SCCON', 'consent required before content is stored'))).toBe('consent_needed');
    expect(inviteErrorKind(pg('SCDEL', 'book is deleted'))).toBe('book_deleted');
    expect(inviteErrorKind(pg('P0002', 'invite not found'))).toBe('not_found');
  });

  it('maps signed-out and network failures', () => {
    expect(inviteErrorKind(pg('28000', 'not authenticated'))).toBe('signed_out');
    expect(inviteErrorKind(pg('PGRST301', 'JWT expired'))).toBe('signed_out');
    expect(inviteErrorKind({ code: '', message: 'TypeError: Network request failed' })).toBe('network');
    expect(inviteErrorKind(new Error('boom'))).toBe('unknown');
  });
});

describe('invite errors from the v1 gate server (S02 details) and the two-parent cap', () => {
  const pg = (code: string, message: string, details: string | null = null) => ({ code, message, details, hint: null });

  it('[F11-REQ-026] SCCAP is "book full", whatever the message, and is final (never retried)', () => {
    expect(inviteErrorKind(pg('SCCAP', 'this book already has the most parents allowed', '2'))).toBe('book_full');
    expect(inviteErrorKind(pg('SCCAP', ''))).toBe('book_full');
    expect(FINAL_INVITE_ERRORS).toContain('book_full');
    expect(familyCopy.errors.book_full).toBe('This book already has two parents. Ask the person who invited you.');
    expect(familyCopy.create.full).toBe("{child}'s book has two parents.");
  });

  it('[F11-REQ-026] reads the SCINV detail before the message, and never needs the message when a detail is sent', () => {
    expect(inviteErrorKind(pg('SCINV', 'whatever the server says', 'expired'))).toBe('expired');
    expect(inviteErrorKind(pg('SCINV', 'x', 'used'))).toBe('used');
    expect(inviteErrorKind(pg('SCINV', 'x', 'already_member'))).toBe('already_member');
    expect(inviteErrorKind(pg('SCINV', 'family invites are not available in this version', 'role_disabled'))).toBe('unknown');
    expect(inviteErrorKind(pg('SCINV', 'this code is in use; make a new one', 'code_taken'))).toBe('retry_new_invite');
    expect(inviteErrorKind(pg('SCINV', 'this token is in use; make a new one', 'token_taken'))).toBe('retry_new_invite');
    expect(inviteErrorKind(pg('SCCID', 'invite id already in use'))).toBe('retry_new_invite');
    // develop's server sends no detail: the fixed phrases still work, an unknown one is "not found".
    expect(inviteErrorKind(pg('SCINV', 'the invite made by this request is closed; make a new one'))).toBe('retry_new_invite');
    expect(inviteErrorKind(pg('SCINV', 'something new', 'a_detail_we_do_not_know'))).toBe('not_found');
    expect(errorDetail(pg('SCINV', 'x', 'used'))).toBe('used');
    expect(errorDetail({ code: 'SCINV' })).toBeNull();
  });

  it('a detail that names an Object built-in (toString, constructor) is no kind: the message decides, as with no detail', () => {
    for (const d of ['toString', 'constructor', '__proto__', 'hasOwnProperty', 'valueOf']) {
      expect(inviteErrorKind(pg('SCINV', 'invite not found', d)), d).toBe('not_found');
      expect(inviteErrorKind(pg('SCINV', 'invite expired', d)), d).toBe('expired');
      expect(typeof inviteErrorKind(pg('SCINV', 'x', d)), d).toBe('string');
    }
  });

  it('[DATA-REQ-016] the last parent, a refused direct path, and the family-share consent', () => {
    expect(inviteErrorKind(pg('SCLPG', 'last parent'))).toBe('last_parent');
    expect(inviteErrorKind(pg('42501', 'permission denied for table child_members'))).toBe('not_allowed');
    expect(inviteErrorKind(pg('SCCON', 'consent required before sharing a book', 'family-share'))).toBe('consent_needed');
  });

  it('a server older than the app (no such function) is told apart from a refusal', () => {
    expect(isMissingFunction({ code: 'PGRST202', message: 'Could not find the function' })).toBe(true);
    expect(isMissingFunction({ code: '42883' })).toBe(true);
    expect(isMissingFunction({ code: 'SCINV' })).toBe(false);
    expect(isMissingFunction(null)).toBe(false);
  });

  it('every error kind has a line on screen, and analytics gets only reasons its catalogue knows', () => {
    const kinds: InviteErrorKind[] = ['expired', 'used', 'revoked', 'already_member', 'not_found', 'not_parent', 'book_full', 'last_parent', 'not_allowed', 'retry_new_invite', 'rate_limited', 'consent_needed', 'book_deleted', 'signed_out', 'network', 'unknown'];
    for (const k of kinds) expect(familyCopy.errors[k], k).toMatch(/\S/);
    expect(trackedInviteReason('book_full')).toBe('unknown');
    expect(trackedInviteReason('expired')).toBe('expired');
  });
});

describe('the invite a phone makes (F11 D5, F11-REQ-002, G-07)', () => {
  const deps = {
    randomBytes: (n: number) => new Uint8Array(randomBytes(n)),
    sha256Hex: async (t: string) => createHash('sha256').update(t, 'utf8').digest('hex'),
    newId: () => '0199e4a2-7b3c-7d10-8a1b-2c3d4e5f6a7b',
  };

  it('[F11-REQ-002] a 43-character token, its SHA-256 over the UTF-8 text, and a device id', async () => {
    const d = await newInviteDraft(deps);
    expect(d.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(d.tokenHash).toBe(createHash('sha256').update(d.token, 'utf8').digest('hex'));
    expect(d.id).toBe('0199e4a2-7b3c-7d10-8a1b-2c3d4e5f6a7b');
    // The link the app builds from it is read back by the same parser (no app release for longer tokens).
    expect(parseInviteUrl(inviteUrl(d.token, ORIGIN), ORIGIN)).toBe(d.token);
  });

  it('[B-NFR-002] only the hash is ever an RPC argument, as PostgREST bytea text', async () => {
    const d = await newInviteDraft(deps);
    expect(byteaArg(d.tokenHash)).toBe(`\\x${d.tokenHash}`);
    expect(byteaArg(d.tokenHash)).not.toContain(d.token);
    expect(() => byteaArg('XYZ')).toThrow('invite_hash_invalid');
  });

  it('uppercase hex from a platform is accepted; anything that is not a SHA-256 is refused', async () => {
    const upper = await newInviteDraft({ ...deps, sha256Hex: async (t) => createHash('sha256').update(t).digest('hex').toUpperCase() });
    expect(upper.tokenHash).toMatch(/^[0-9a-f]{64}$/);
    await expect(newInviteDraft({ ...deps, sha256Hex: async () => 'abc' })).rejects.toThrow('invite_hash_invalid');
  });
});

describe('what an invite says before joining (BL-322, security review H2)', () => {
  it('[BL-322] keeps only the inviter sign-off, the role and "already joined"; never a child name or id', () => {
    const p = readInvitePreview({ inviter: '  Mama ', role: 'parent', child: 'Asha', child_id: '1', expires_at: 'x' });
    expect(p).toEqual({ inviter: 'Mama', role: 'parent', joined: false, known: true });
    expect(JSON.stringify(p)).not.toMatch(/Asha|child|expires/);
  });

  it('reads defensively: arrays, nulls, long or odd names, and the joined flag', () => {
    expect(readInvitePreview([{ inviter: null, role: 'parent', joined: true }])).toEqual({ inviter: null, role: 'parent', joined: true, known: true });
    expect(readInvitePreview({ inviter: 'x'.repeat(80) }).inviter).toHaveLength(30);
    expect(readInvitePreview({ inviter: 'Mama\n\nPapa' }).inviter).toBe('Mama Papa');
    expect(readInvitePreview({ inviter: '   ' }).inviter).toBeNull();
    expect(readInvitePreview({ inviter: 42, role: 'owner' })).toEqual({ inviter: null, role: 'parent', joined: false, known: true });
    expect(readInvitePreview({ role: 'contributor' }).role).toBe('contributor');
    expect(readInvitePreview(null)).toEqual({ inviter: null, role: 'parent', joined: false, known: true });
    expect(UNKNOWN_PREVIEW).toEqual({ inviter: null, role: 'parent', joined: false, known: false });
  });
});

describe('the join sheet asks before it joins (BL-322, F11-REQ-006)', () => {
  const base: JoinInputs = {
    loaded: true, token: TOKEN, signedIn: true, canSync: true, preview: null, busy: null, wantsJoin: false, joinedChildId: null, error: null,
  };
  const preview = readInvitePreview({ inviter: 'Mama', role: 'parent' });

  it('[BL-322] before sign-in: a generic landing, and no call to the server at all', () => {
    for (const canSync of [false, true]) {
      expect(joinPlan({ ...base, signedIn: false, canSync })).toEqual({ view: 'signIn', next: 'none' });
    }
  });

  it('[BL-322] signed in: it looks first (peek), once', () => {
    expect(joinPlan(base)).toEqual({ view: 'peeking', next: 'peek' });
    expect(joinPlan({ ...base, busy: 'peek' })).toEqual({ view: 'peeking', next: 'none' });
    expect(joinPlan({ ...base, canSync: false })).toEqual({ view: 'peeking', next: 'peek' }); // peek needs no consent
  });

  it('[BL-322] it never joins until the person taps Join, in any state', () => {
    const states: Partial<JoinInputs>[] = [];
    for (const signedIn of [false, true]) for (const canSync of [false, true]) for (const p of [null, preview]) for (const busy of [null, 'peek'] as const) {
      states.push({ signedIn, canSync, preview: p, busy });
    }
    for (const st of states) expect(joinPlan({ ...base, ...st, wantsJoin: false }).next, JSON.stringify(st)).not.toBe('accept');
    expect(joinPlan({ ...base, preview })).toEqual({ view: 'ask', next: 'none' });
  });

  it('[F11-REQ-006] after Join: consent and sync first, then accept, once', () => {
    expect(joinPlan({ ...base, preview, wantsJoin: true, canSync: false })).toEqual({ view: 'account', next: 'none' });
    expect(joinPlan({ ...base, preview, wantsJoin: true })).toEqual({ view: 'joining', next: 'accept' });
    expect(joinPlan({ ...base, preview, wantsJoin: true, busy: 'accept' })).toEqual({ view: 'joining', next: 'none' });
  });

  it('an invite this person already accepted (a second phone) just returns the book', () => {
    const joined = readInvitePreview({ inviter: 'Mama', role: 'parent', joined: true });
    expect(joinPlan({ ...base, preview: joined })).toEqual({ view: 'joining', next: 'accept' });
  });

  it('errors, the joined state and a missing token each have their own view', () => {
    expect(joinPlan({ ...base, loaded: false })).toEqual({ view: 'loading', next: 'none' });
    expect(joinPlan({ ...base, token: null })).toEqual({ view: 'paste', next: 'none' });
    expect(joinPlan({ ...base, preview, wantsJoin: true, error: 'book_full' })).toEqual({ view: 'failed', next: 'none' });
    expect(joinPlan({ ...base, preview, joinedChildId: 'c1' })).toEqual({ view: 'joined', next: 'none' });
  });

  it('[BL-322] the screen changes the open book only in "Open the book", and accepts only through the plan', () => {
    const screen = readFileSync(join(__dirname, '..', 'src', 'app', 'invite', 'index.tsx'), 'utf8');
    expect(screen.match(/setActiveChildId\(/g)).toHaveLength(1);
    expect(screen).toMatch(/const open = \(\) => \{[\s\S]*?setActiveChildId\(childId\)/);
    expect(screen.match(/acceptInvite\(/g)).toHaveLength(1);
    expect(screen).toMatch(/plan\.next === 'peek' \? peek\(token\) : accept\(token\)/);
  });
});

describe('the Family tab with a co-parent (F11 6.2 A and D)', () => {
  const papa = { id: 'p', signsAs: 'Papa', role: 'parent' as const };

  it('[F11-REQ-001] one parent: the invite card shows while no invite is open', () => {
    expect(familyTabState({ role: 'parent', members: [], openInvites: 0 })).toMatchObject({ parents: 1, showInviteCard: true, full: false, canLeave: false });
    expect(familyTabState({ role: 'parent', members: [], openInvites: 1 }).showInviteCard).toBe(false);
    // A book only on this phone (no account yet): inviting starts sign-in; there is nothing to leave.
    expect(familyTabState({ members: [], openInvites: 0 })).toMatchObject({ showInviteCard: true, canLeave: false });
  });

  it('[F11-REQ-004] two parents: no invite card, the book is full, and leaving is offered', () => {
    expect(familyTabState({ role: 'parent', members: [papa], openInvites: 0 })).toMatchObject({ parents: 2, showInviteCard: false, full: true, canLeave: true });
  });

  it('[F11-REQ-003] a family-contributor membership (dormant) is offered nothing', () => {
    expect(familyTabState({ role: 'contributor', members: [papa], openInvites: 0 })).toMatchObject({ showInviteCard: false, canLeave: false });
    // A contributor in the member list is not a co-parent.
    expect(familyTabState({ role: 'parent', members: [{ id: 'n', signsAs: 'Nani', role: 'contributor' }], openInvites: 0 }).coParents).toEqual([]);
  });

  it('[F11-REQ-023] the remaining parent sees one note when the co-parent leaves, and never again', () => {
    const seen = decodeSeen(encodeSeen([papa]));
    expect(seen).toEqual([{ id: 'p', signsAs: 'Papa' }]);
    expect(leftSince(seen, [], true)).toEqual([{ id: 'p', signsAs: 'Papa' }]);
    // The screen then stores the current list, so the next look finds nothing.
    expect(leftSince(decodeSeen(encodeSeen([])), [], true)).toEqual([]);
    expect(leftSince(seen, [papa], true)).toEqual([]);
  });

  it('[F11-REQ-023] never announces a departure for a book the server does not list for this person (onServer false)', () => {
    expect(leftSince([{ id: 'p', signsAs: 'Papa' }], [], false)).toEqual([]);
    expect(decodeSeen('{oops')).toEqual([]);
    expect(decodeSeen(JSON.stringify([{ id: 1 }, { id: 'x', signsAs: 'X' }]))).toEqual([{ id: 'x', signsAs: 'X' }]);
    expect(seenCoParentsKey('c1')).toBe('family.seenCoParents.c1');
  });
});

describe('review fixes (PR #184)', () => {
  const screen = (p: string) => readFileSync(join(__dirname, '..', 'src', 'app', ...p.split('/')), 'utf8');

  it('[BL-322] what an invite said, and a tap on Join, belong to the account that saw them', () => {
    // A sign-out, then another account on this phone: it peeks again and must tap Join itself.
    const src = screen('invite/index.tsx');
    expect(src).toMatch(/const userId = authUserId\(auth\.state\);\s*useEffect\(\(\) => \{\s*started\.current = null;\s*setPreview\(null\);\s*setWantsJoin\(false\);\s*\}, \[userId\]\);/);
    // And the plan, with no preview and no tap, never accepts.
    const base: JoinInputs = { loaded: true, token: TOKEN, signedIn: true, canSync: true, preview: null, busy: null, wantsJoin: false, joinedChildId: null, error: null };
    expect(joinPlan(base)).toEqual({ view: 'peeking', next: 'peek' });
  });

  it('[A-REQ-028] the join sheet clears only the invite it used; a newer link that arrived meanwhile is kept', () => {
    const stored = (t: string) => encodePendingInvite({ token: t, receivedAt: 1 });
    const other = 'q8Zr0_Yc-3Jk9LmN2pQ4sT6vW8xZ1aB3cD5eF7gH9iJ';
    expect(shouldClearPendingInvite(stored(TOKEN), TOKEN)).toBe(true);
    expect(shouldClearPendingInvite(stored(other), TOKEN)).toBe(false);
    expect(shouldClearPendingInvite(null, TOKEN)).toBe(false);
    expect(shouldClearPendingInvite('{damaged', TOKEN)).toBe(true);
    expect(screen('invite/index.tsx')).not.toMatch(/clearPendingInvite\(\)/);
  });

  it('[F11-U10] the inviter sees "{child}\'s book has two parents.", never the invitee\'s line', () => {
    expect(screen('(tabs)/family.tsx')).toMatch(/error === 'book_full' \? f\.create\.full : f\.errors\[error\]/);
    expect(screen('invite/new.tsx')).toMatch(/error === 'book_full' \|\|/);
  });

  it('a non-parent invite is final: no "Try again" loop', () => {
    expect(screen('invite/index.tsx')).toMatch(/p\.role !== 'parent'[\s\S]{0,240}setError\('not_found'\)/);
    expect(FINAL_INVITE_ERRORS).toContain('not_found');
  });

  it('[F11-REQ-011] the leave sheet promises only what this build does (S03 and S13 list left books later)', () => {
    expect(familyCopy.leave.takeOutHelp).toBe('Your letters leave the book and stay yours.');
    expect(familyCopy.leave.done).not.toMatch(/read|export|on this phone/i);
  });
});
