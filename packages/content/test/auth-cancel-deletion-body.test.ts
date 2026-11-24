/**
 * BL-494 point 1: the sign-in sheet's body when it is opened from the signed-out deletion screen. PROPOSED words: they
 * are about account deletion, so the exec team reads them (D-172) before a build with sign-in on. Pinned word for word
 * so a change fails here first. No child is named or gendered; nothing says what a person must do or what is lost.
 */
import { describe, expect, it } from 'vitest';
import { authCopy } from '../src/features/auth.en';

describe('sheet.bodies.cancel_deletion', () => {
  const line = authCopy.sheet.bodies.cancel_deletion;
  it('is the words, word for word', () => {
    expect(line).toBe('Sign in the same way as last time. Then you can cancel the deletion.');
  });
  it('is two short sentences, keeps the same-way-as-last-time promise of the sign_in body, and names no child', () => {
    expect(line.split('. ')).toHaveLength(2);
    expect(line).toContain('the same way as last time');
    expect(line).not.toMatch(/\{child\}|\b(he|she|his|her)\b/i);
  });
});
