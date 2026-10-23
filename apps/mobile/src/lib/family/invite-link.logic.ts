/**
 * Co-parent invite links (PRD A F7, B F5; TDD 04 3.4). Pure, tested in
 * test/invite-link.test.ts.
 *
 * Format: `https://earlyletters.com/j#t=<token>` (origin from packages/brand;
 * PRD V2 F11). The token sits in the fragment, which a browser never sends to
 * a server, so a link opened without the app (a laptop, a mail app's own
 * browser) does not put the token in the website's request logs. The earlier
 * `/i/<token>` form put it in the path; no build ever shipped with it, and it
 * is no longer written or accepted.
 * The token is the raw value `create_child_invite` returns once; the server
 * keeps only its SHA-256. Today it is 64 hex characters (two v4 UUIDs);
 * base64url tokens of 32 to 128 characters are accepted so a later server
 * change (32 random bytes, TDD 04 3.4.1) needs no app release.
 *
 * Tokens are bearer secrets: they travel only in https links and pasted text,
 * are written to the Keychain before any screen shows (A-REQ-028), never go
 * into route params, logs or analytics, and are never accepted from the
 * custom scheme (TDD 04 3.1.6: any app can claim a custom scheme).
 */
import { originHost, splitUrl } from '../auth/url.logic';

export const INVITE_PATH = '/j';
const TOKEN = /^[A-Za-z0-9_-]{32,128}$/;

export function isInviteToken(s: string): boolean {
  return TOKEN.test(s);
}

/** The link the inviter shares. */
export function inviteUrl(token: string, origin: string): string {
  if (!isInviteToken(token)) throw new Error('invite_token_invalid');
  return `${origin.replace(/\/+$/, '')}${INVITE_PATH}#t=${token}`;
}

/** Hosts an invite link may use: the brand origin and its www alias (people retype links). */
function inviteHosts(origin: string): Set<string> {
  const host = originHost(origin);
  return new Set([host, `www.${host}`]);
}

/**
 * Token from a system link (universal link). https on the brand host only,
 * path exactly /j (one trailing slash tolerated), token in the fragment as
 * `t`. The query is never read: a token there would have reached a server,
 * so `/j?t=<token>` alone is refused, and `/j?t=<a>#t=<b>` gives `<b>`.
 * Anything else: null.
 */
export function parseInviteUrl(url: string, origin: string): string | null {
  const u = splitUrl(url);
  if (!u || u.scheme !== 'https' || !inviteHosts(origin).has(u.host)) return null;
  if (u.path.replace(/\/$/, '') !== INVITE_PATH) return null;
  const token = u.fragment.t ?? '';
  return isInviteToken(token) ? token : null;
}

/** What prose puts right after a link ("here: <link>." or "(<link>)"), typographic quotes too. Never part of a token. */
const AFTER_LINK = new Set(['.', ',', ';', ':', '!', '?', "'", '"', ')', ']', '}', '>', '\u2019', '\u201D']);

function withoutTrailingProse(s: string): string {
  let end = s.length;
  while (end > 0 && AFTER_LINK.has(s[end - 1])) end -= 1;
  return s.slice(0, end);
}

/**
 * Token from whatever the person pasted into "I was invited": the bare link,
 * a whole message with the link inside it, or the token alone. Each link on
 * the brand host runs to the next space and, without the punctuation prose
 * puts after it, is read by parseInviteUrl itself, so pasting a link gives
 * the token parseInviteUrl gives for it: a query on /j is never read, and the
 * token comes only from the fragment. The first link that holds wins. Returns
 * null when nothing usable is there.
 */
export function parseInviteInput(text: string, origin: string): string | null {
  const t = text.trim();
  if (!t) return null;
  if (isInviteToken(t)) return t;
  // Where a link on the brand host starts: the host check parseInviteUrl makes, done first so other links are skipped.
  const host = originHost(origin).replace(/\./g, '\\.');
  const brandLink = new RegExp(`https://(?:www\\.)?${host}(?=[/:?#]|$)`, 'gi');
  for (const word of t.split(/\s+/)) {
    for (const m of word.matchAll(brandLink)) {
      const token = parseInviteUrl(withoutTrailingProse(word.slice(m.index ?? 0)), origin);
      if (token) return token;
    }
  }
  return null;
}

/** Pending invite tokens older than this are dropped (family invites last 14 days, co-parent 7; K-18). */
export const PENDING_INVITE_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;

export interface PendingInvite {
  token: string;
  /** Epoch ms when the link reached this phone. */
  receivedAt: number;
}

export function encodePendingInvite(p: PendingInvite): string {
  return JSON.stringify({ t: p.token, at: p.receivedAt });
}

/** Reads what pending-invite.ts stored; null if damaged, not a token, or too old. */
export function decodePendingInvite(raw: string | null, now: number): PendingInvite | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as { t?: unknown; at?: unknown };
    if (typeof v.t !== 'string' || typeof v.at !== 'number' || !isInviteToken(v.t)) return null;
    if (now - v.at > PENDING_INVITE_MAX_AGE_MS || v.at - now > 60_000) return null;
    return { token: v.t, receivedAt: v.at };
  } catch {
    return null;
  }
}

/** Compare-and-clear for the stored invite: clear when it is this token, or when it is damaged. */
export function shouldClearPendingInvite(raw: string | null, token: string): boolean {
  if (!raw) return false;
  try {
    const v = JSON.parse(raw) as { t?: unknown };
    return typeof v.t !== 'string' || v.t === token;
  } catch {
    return true;
  }
}
