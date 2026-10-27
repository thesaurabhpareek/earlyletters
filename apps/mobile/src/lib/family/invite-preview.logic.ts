/**
 * What an invite says before the person agrees to join (BL-322, security review H2; server half
 * `peek_invite` in S02's 20261015010000). Pure, tested in test/invite-link.test.ts.
 *
 * The boundary: before joining, the app may learn only the inviter's sign-off for that book and
 * the role. Never the child's name, an id, a date or anything else, even if a server sent more:
 * this reader keeps those three fields and drops the rest.
 */

export interface InvitePreview {
  /** The inviter's sign-off for that book ("Mama"), trimmed and capped; null when they set none. */
  inviter: string | null;
  role: 'parent' | 'contributor';
  /** True when this person already accepted this invite (a second phone, or a retry). */
  joined: boolean;
  /** False when the server has no peek_invite yet: the screen still asks first, without a name. */
  known: boolean;
}

/** A sign-off is at most 30 characters in the app (invite and settings fields). */
const MAX_INVITER = 30;

/** Reads the peek_invite answer defensively; anything unexpected reads as no name. */
export function readInvitePreview(data: unknown): InvitePreview {
  const row = (Array.isArray(data) ? data[0] : data) as { inviter?: unknown; role?: unknown; joined?: unknown } | null | undefined;
  const raw = typeof row?.inviter === 'string' ? row.inviter.replace(/\s+/g, ' ').trim().slice(0, MAX_INVITER).trim() : '';
  return {
    inviter: raw || null,
    role: row?.role === 'contributor' ? 'contributor' : 'parent',
    joined: row?.joined === true,
    known: true,
  };
}

/** The answer when the server cannot peek yet: ask anyway, name nobody. */
export const UNKNOWN_PREVIEW: InvitePreview = { inviter: null, role: 'parent', joined: false, known: false };
