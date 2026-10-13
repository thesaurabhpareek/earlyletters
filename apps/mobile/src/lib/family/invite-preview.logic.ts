/**
 * What an invite says before the person agrees to join (security review H2,
 * gap G-02; server half peek_invite, db-fix G-13). Pure, tested in
 * test/invite-link.test.ts.
 */
/** What the invite says before joining. `inviter` is the inviter's sign-off for that book, or null. */
export interface InvitePreview {
  inviter: string | null;
  role: 'parent' | 'contributor';
  /** False when the server has no peek_invite yet: the screen still asks, without a name. */
  known: boolean;
}

/** Reads the peek_invite answer defensively (a name is trimmed and capped; anything odd reads as no name). */
export function readInvitePreview(data: unknown): InvitePreview {
  const row = (Array.isArray(data) ? data[0] : data) as { inviter?: unknown; role?: unknown } | null | undefined;
  const raw = typeof row?.inviter === 'string' ? row.inviter.trim().slice(0, 30) : '';
  const role = row?.role === 'contributor' ? 'contributor' : 'parent';
  return { inviter: raw || null, role, known: true };
}

