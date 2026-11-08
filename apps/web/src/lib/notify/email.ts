/**
 * Owner: E2 (back-end). Email validation and normalisation for the "tell me when it's ready" form.
 *
 * Deliberately stricter than RFC 5322, because the address ends up in a URL path
 * (the Resend SDK builds /contacts/<email>/segments/<id> without encoding it) and in a mailing list:
 *  - exactly one "@", ASCII local part from a conservative set (no "/", "?", "#", "%", "\", spaces,
 *    quotes, control characters, so no path or header injection);
 *  - the domain may be Unicode (Hindi, Arabic and Chinese domains exist); it is converted to punycode;
 *  - the domain needs at least two labels and an alphabetic (or xn--) top-level label, so "a@b" and
 *    "a@1.2.3.4" are rejected;
 *  - the whole address is lower-cased and trimmed, nothing else is canonicalised (dots and "+tags"
 *    are kept, because they are real on most providers).
 * Addresses with a non-ASCII local part (SMTPUTF8) are rejected: delivery support is unreliable.
 */
import { domainToASCII } from 'node:url';

const LOCAL_ALLOWED = /^[a-z0-9.!$&'*+=^_~-]+$/;
const LABEL = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
const TLD = /^(?:[a-z]{2,63}|xn--[a-z0-9-]{1,59})$/;

export const MAX_EMAIL_LENGTH = 254;

/** Returns the normalised address, or null when it is not acceptable. */
export function normalizeEmail(input: unknown): string | null {
  if (typeof input !== 'string' || input.length > 320) return null;
  const value = input.normalize('NFC').trim();
  if (value.length < 3) return null;

  const at = value.indexOf('@');
  if (at < 1 || at !== value.lastIndexOf('@')) return null;

  const local = value.slice(0, at).toLowerCase();
  if (local.length > 64 || !LOCAL_ALLOWED.test(local)) return null;
  if (local.startsWith('.') || local.endsWith('.') || local.includes('..')) return null;

  const domainInput = value.slice(at + 1).toLowerCase();
  if (domainInput.length === 0 || domainInput.endsWith('.')) return null;
  const domain = domainToASCII(domainInput);
  if (!domain) return null;

  const labels = domain.split('.');
  if (labels.length < 2 || !labels.every((label) => LABEL.test(label))) return null;
  if (!TLD.test(labels[labels.length - 1])) return null;

  const address = `${local}@${domain}`;
  return address.length <= MAX_EMAIL_LENGTH ? address : null;
}
