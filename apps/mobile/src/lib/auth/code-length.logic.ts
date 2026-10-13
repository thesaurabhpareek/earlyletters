/**
 * Email code length (security review M4, gap G-05). Pure, tested in
 * test/auth-email-link.test.ts.
 *
 * The project setting is 8 digits (AUTH_SETUP 4.4). The build reads the same
 * number from EXPO_PUBLIC_EMAIL_OTP_LENGTH (6 to 10, default 8). The code
 * screen submits on its own at that length, and also offers Continue for any
 * code of 6 to 10 digits, so a dashboard and a build that disagree for a while
 * never lock anyone out.
 */
export const DEFAULT_EMAIL_CODE_LENGTH = 8;
export const MIN_EMAIL_CODE_LENGTH = 6;
export const MAX_EMAIL_CODE_LENGTH = 10;

export function emailCodeLength(raw: string | undefined): number {
  const n = Number(raw);
  return Number.isInteger(n) && n >= MIN_EMAIL_CODE_LENGTH && n <= MAX_EMAIL_CODE_LENGTH ? n : DEFAULT_EMAIL_CODE_LENGTH;
}

/** 'auto': send now. 'manual': a full-looking code of another allowed length, offer Continue. 'wait': keep typing. */
export function codeReadiness(digits: string, expected: number): 'auto' | 'manual' | 'wait' {
  if (!/^[0-9]*$/.test(digits)) return 'wait';
  if (digits.length === expected) return 'auto';
  if (digits.length >= MIN_EMAIL_CODE_LENGTH && digits.length <= MAX_EMAIL_CODE_LENGTH) return 'manual';
  return 'wait';
}
