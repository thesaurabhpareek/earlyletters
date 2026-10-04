/**
 * Co-parent invite links (PRD A F7, B F5; TDD 04 3.4). Pure, tested in
 * test/invite-link.test.ts.
 *
 * Format: `https://earlyletters.com/i/<token>` (origin from packages/brand).
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

export const INVITE_PATH_PREFIX = '/i/';
const TOKEN = /^[A-Za-z0-9_-]{32,128}$/;

export function isInviteToken(s: string): boolean {
  return TOKEN.test(s);
}

/** The link the inviter shares. */
export function inviteUrl(token: string, origin: string): string {
  if (!isInviteToken(token)) throw new Error('invite_token_invalid');
  return `${origin.replace(/\/+$/, '')}${INVITE_PATH_PREFIX}${token}`;
}

/** Hosts an invite link may use: the brand origin and its www alias (people retype links). */
function inviteHosts(origin: string): Set<string> {
  const host = originHost(origin);
  return new Set([host, `www.${host}`]);
}

/**
 * Token from a system link (universal link). https on the brand host only,
 * path exactly /i/<token> (one trailing slash tolerated). Anything else: null.
 */
export function parseInviteUrl(url: string, origin: string): string | null {
  const u = splitUrl(url);
  if (!u || u.scheme !== 'https' || !inviteHosts(origin).has(u.host)) return null;
  const m = /^\/i\/([^/]+)\/?$/.exec(u.path);
  if (!m) return null;
  return isInviteToken(m[1]) ? m[1] : null;
}

/**
 * Token from whatever the person pasted into "I was invited": the bare link,
 * a whole message with the link inside it, or the token alone. The first
 * brand invite link wins. Returns null when nothing usable is there.
 */
export function parseInviteInput(text: string, origin: string): string | null {
  const t = text.trim();
  if (!t) return null;
  if (isInviteToken(t)) return t;
  const host = originHost(origin).replace(/\./g, '\\.');
  const re = new RegExp(`https://(?:www\\.)?${host}/i/[A-Za-z0-9_-]+/?`, 'gi');
  for (const m of t.matchAll(re)) {
    const token = parseInviteUrl(m[0], origin);
    if (token) return token;
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
