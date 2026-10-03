/**
 * Email copy rules. Runs over every src/emails/*.en.ts file that exists, so
 * copy added by any lane is checked the same way. Character, fear and
 * no-machine-writing rules mirror rules.test.ts and VOICE.md.
 * If a test here fails, fix the copy, not the test.
 */
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { EmailCopy } from '../src/emails/types';

type Leaf = { path: string; text: string };

function leaves(value: unknown, path = ''): Leaf[] {
  if (typeof value === 'string') return [{ path, text: value }];
  if (Array.isArray(value)) return value.flatMap((v, i) => leaves(v, `${path}[${i}]`));
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([k, v]) => leaves(v, path ? `${path}.${k}` : k));
  }
  return [];
}

const DIR = join(__dirname, '..', 'src', 'emails');
const FILES = readdirSync(DIR).filter((f) => f.endsWith('.en.ts')).sort();
const MODULES = await Promise.all(
  FILES.map(async (file) => ({ file, mod: (await import(join(DIR, file))) as Record<string, unknown> })),
);

/** Every string exported by every email copy file (chrome, legal and catalog groups alike). */
const ALL: Leaf[] = MODULES.flatMap(({ file, mod }) => leaves(mod, file));

const isEmailCopy = (v: unknown): v is EmailCopy =>
  !!v && typeof v === 'object' && typeof (v as EmailCopy).subject === 'string' && typeof (v as EmailCopy).preheader === 'string';

/** Every EmailCopy record, from any export named `<group>Emails`. */
const EMAILS: { file: string; key: string; email: EmailCopy }[] = MODULES.flatMap(({ file, mod }) =>
  Object.entries(mod)
    .filter(([name]) => /Emails$/.test(name))
    .flatMap(([name, group]) =>
      Object.entries(group as Record<string, unknown>)
        .filter(([, v]) => isEmailCopy(v))
        .map(([key, v]) => ({ file: `${file}:${name}`, key, email: v as EmailCopy })),
    ),
);

const offenders = (items: Leaf[], re: RegExp) => items.filter((l) => re.test(l.text)).map((l) => `${l.path}: ${l.text}`);

describe('email files', () => {
  it('finds the auth copy', () => {
    expect(FILES).toContain('auth.en.ts');
    expect(EMAILS.length).toBeGreaterThan(0);
  });

  it('includes every required auth email', () => {
    const ids = new Set(EMAILS.map((e) => e.email.id));
    for (const id of [
      'account-create-attempt',
      'verify-email',
      'sign-in-link',
      'welcome',
      'sign-in-trouble',
      'apple-account-linked',
      'new-device-sign-in',
      'email-changed-old-address',
      'email-changed-new-address',
      'reauthenticate-code',
    ]) {
      expect(ids.has(id), id).toBe(true);
    }
  });
});

describe('characters', () => {
  it('has no em dashes, en dashes, curly quotes or ellipsis characters', () => {
    expect(offenders(ALL, /[—–‘’“”…]/)).toEqual([]);
  });

  it('has no emoji', () => {
    expect(offenders(ALL, /\p{Extended_Pictographic}/u)).toEqual([]);
  });

  it('uses no exclamation marks in auth or account email', () => {
    const secure = EMAILS.filter((e) => e.email.category === 'auth' || e.email.category === 'account');
    expect(secure.flatMap((e) => offenders(leaves(e.email, `${e.file}.${e.key}`), /!/))).toEqual([]);
  });

  it('uses at most 3 exclamation marks across all email copy', () => {
    const count = ALL.reduce((n, l) => n + (l.text.match(/!/g)?.length ?? 0), 0);
    expect(count).toBeLessThanOrEqual(3);
  });
});

describe('voice', () => {
  it('never uses fear, guilt or loss-aversion language', () => {
    const FEAR = /\b(too late|don'?t miss|you haven'?t|you forgot|streaks?|lost forever|regrets?|never get back|die|dies|died|dying|death|dead|passed away|when you'?re gone|if you'?re gone)\b/i;
    expect(offenders(ALL, FEAR)).toEqual([]);
  });

  it('never implies the app writes for you', () => {
    const AI = /\b(AI|A\.I\.|artificial intelligence|smart|magic(al)?|generat(e|es|ed|ing)|polish(ed|es|ing)?|perfect(ed|s)?|enhanc(e|ed|es|ing))\b/;
    expect(offenders(ALL, AI)).toEqual([]);
  });

  it('never says "magic link"', () => {
    expect(offenders(ALL, /magic/i)).toEqual([]);
  });

  it('only mentions rewriting to promise it never happens', () => {
    const bad = ALL.filter(
      (l) =>
        /\brewrit/i.test(l.text) &&
        !l.text.trim().endsWith('?') &&
        !/\b(never|not|don'?t|won'?t|no)\b[^.]{0,40}\brewrit/i.test(l.text),
    );
    expect(bad.map((l) => `${l.path}: ${l.text}`)).toEqual([]);
  });

  it('never genders the child', () => {
    expect(offenders(ALL, /\b(she|he|her|him|his|hers)\b/i)).toEqual([]);
  });

  it('never streaks, points or badges', () => {
    expect(offenders(ALL, /\b(points?|badges?|in a row|days since)\b/i)).toEqual([]);
  });

  it('never asks for a password', () => {
    // Mentions are allowed only to say we will never ask for one, or that there is none.
    const bad = ALL.filter(
      (l) => /\bpassword/i.test(l.text) && !/\b(never|not|no)\b[^.]{0,60}\bpassword|\bpassword\b[^.]{0,30}\bthere is not\b/i.test(l.text),
    );
    expect(bad.map((l) => `${l.path}: ${l.text}`)).toEqual([]);
  });

  it('uses only well-formed {camelCase} placeholders', () => {
    const bad = ALL.filter((l) => /[{}]/.test(l.text.replace(/\{[a-z][A-Za-z0-9]*\}/g, '')));
    expect(bad.map((l) => `${l.path}: ${l.text}`)).toEqual([]);
  });
});

describe('EmailCopy shape', () => {
  it('has unique kebab-case ids that match their keys', () => {
    const ids = EMAILS.map((e) => e.email.id);
    expect(ids.filter((id, i) => ids.indexOf(id) !== i)).toEqual([]);
    for (const { key, email } of EMAILS) {
      expect(email.id, email.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(key, email.id).toBe(email.id);
    }
  });

  it('keeps subjects at 45 characters or less, sentence case, no brand prefix', () => {
    for (const { email } of EMAILS) {
      const s = email.subject;
      expect(s.length, `${email.id}: ${s}`).toBeLessThanOrEqual(45);
      expect(s, email.id).toMatch(/^[A-Z{]/);
      expect(s, email.id).not.toMatch(/^Early Letters\b/);
      expect(s, email.id).not.toMatch(/!/);
      // No shouting: no all-caps word of three or more letters.
      expect(s.match(/\b[A-Z]{3,}\b/g) ?? [], email.id).toEqual([]);
    }
  });

  it('keeps preheaders between 40 and 90 characters and never repeats the subject', () => {
    for (const { email } of EMAILS) {
      const p = email.preheader;
      expect(p.length, `${email.id}: ${p}`).toBeGreaterThanOrEqual(40);
      expect(p.length, `${email.id}: ${p}`).toBeLessThanOrEqual(90);
      expect(p.toLowerCase().startsWith(email.subject.toLowerCase()), email.id).toBe(false);
    }
  });

  it('has a heading and at least one body paragraph', () => {
    for (const { email } of EMAILS) {
      expect(email.heading.trim().length, email.id).toBeGreaterThan(0);
      expect(email.body.length, email.id).toBeGreaterThan(0);
    }
  });

  it('keeps buttons short and their url a single placeholder', () => {
    for (const { email } of EMAILS) {
      if (!email.cta) continue;
      expect(email.cta.label.length, email.id).toBeLessThanOrEqual(22);
      expect(email.cta.urlVar, email.id).toMatch(/^\{[a-z][A-Za-z0-9]*\}$/);
    }
  });

  it('gives every button a link fallback, and every code a single placeholder', () => {
    for (const { email } of EMAILS) {
      if (email.cta) expect(email.fallback, email.id).toBeTruthy();
      if (email.code) expect(email.code.codeVar, email.id).toMatch(/^\{[a-z][A-Za-z0-9]*\}$/);
    }
  });
});

describe('auth and account security', () => {
  const secure = EMAILS.filter((e) => e.email.category === 'auth' || e.email.category === 'account');

  it('is always transactional', () => {
    for (const { email } of secure) expect(email.kind, email.id).toBe('transactional');
  });

  it('every auth email carries a safety line', () => {
    for (const { email } of secure.filter((e) => e.email.category === 'auth')) {
      expect(email.safety, email.id).toBeTruthy();
    }
  });

  it('states expiry wherever there is a link or a code', () => {
    for (const { email } of secure) {
      const hasOneTime = !!email.code || /Url\}$/.test(email.cta?.urlVar ?? '') && email.cta?.urlVar !== '{appUrl}';
      if (!hasOneTime) continue;
      expect([...email.body, email.preheader].join(' '), email.id).toMatch(/\{expiresIn\}/);
    }
  });

  it('says we never ask for codes by phone or chat wherever there is a code', () => {
    for (const { email } of secure.filter((e) => e.email.code)) {
      expect(email.safety ?? '', email.id).toMatch(/never ask for (this|a) code by phone, text or chat/);
    }
  });
});
