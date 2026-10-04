/**
 * Log canary fixtures (LEGAL-REQ-014, DATA-REQ-004, TDD 05 9.5, TDD 06 5.4).
 *
 * The fictional "Asha" family (CLAUDE.md). Tests push these values through
 * every code path that can log or send mail, then scan the output: none of
 * them, and nothing shaped like a UUID, an email address or a JWT, may appear.
 */

export const CANARY = {
  childName: 'Asha',
  letterText: 'Asha laughed at the rain on the kitchen window and held my finger the whole walk home.',
  dictionaryWord: 'Ashamma',
  parentEmail: 'asha.parent@example.invalid',
  coParentEmail: 'asha.coparent@example.invalid',
  profileId: '11111111-1111-4111-8111-111111111111',
  coParentId: '22222222-2222-4222-8222-222222222222',
  childId: '0192e000-0000-7000-8000-00000000a5a5',
  entryId: '0192e000-0000-7000-8000-00000000e001',
  requestId: '3c0ffee0-0000-4000-8000-000000000001',
  analyticsId: '9a9a9a9a-0000-4000-8000-0000000000aa',
  appleRefreshToken: 'r9f2c.0.asha-apple-refresh-token-fixture.Zz8',
  inviteToken: 'asha-invite-token-fixture-7f3a9c',
  sessionJwt: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMTExMTExMS0xMTExLTQxMTEtODExMS0xMTExMTExMTExMTEifQ.c2lnbmF0dXJl',
} as const;

export const CANARY_OBJECT_PATH = `${CANARY.childId}/${CANARY.profileId}/${CANARY.entryId}.jpg`;

const UUID_ANY = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
const EMAIL_ANY = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;
const JWT_ANY = /eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/;

export interface CanaryHit {
  fixture: string;
}

/**
 * Names of the fixtures (and generic shapes) found in `text`. Case-insensitive
 * for the words. `allow` lists generic shapes a given channel may carry (for
 * example an alert email legitimately contains the alert inbox address).
 */
export function findCanaries(text: string, allow: { emails?: string[]; uuids?: string[] } = {}): string[] {
  const hits: string[] = [];
  const lower = text.toLowerCase();
  for (const [name, value] of Object.entries(CANARY)) {
    if (lower.includes(value.toLowerCase())) hits.push(name);
  }
  const allowedEmails = new Set((allow.emails ?? []).map((e) => e.toLowerCase()));
  const allowedUuids = new Set((allow.uuids ?? []).map((u) => u.toLowerCase()));
  for (const m of text.matchAll(new RegExp(EMAIL_ANY, 'g'))) {
    if (!allowedEmails.has(m[0].toLowerCase())) hits.push(`email:${m[0].length}`);
  }
  for (const m of text.matchAll(new RegExp(UUID_ANY, 'gi'))) {
    if (!allowedUuids.has(m[0].toLowerCase())) hits.push('uuid');
  }
  if (JWT_ANY.test(text)) hits.push('jwt');
  return [...new Set(hits)];
}
