/**
 * The website says only what is true today (F21 6.6, F21-REQ-015, -016, -030; R4 PT-04).
 * Facts: Plus is $4.99 a month with a 1-month free trial, or $49.99 a year with a 2-month free trial
 * (D-082). The first two letters are free; Plus gates only keeping new letters after that. Read together
 * and every child's book are free. Family at v1.0 is one co-parent. No recording backup claim until it is
 * built and its wording is approved. No "beta".
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import * as siteModule from '../src/content/site';
import { site } from '../src/content/site';

const WEB_ROOT = fileURLToPath(new URL('..', import.meta.url));

function strings(value: unknown, path: string): { path: string; text: string }[] {
  if (typeof value === 'string') return [{ path, text: value }];
  if (Array.isArray(value)) return value.flatMap((v, i) => strings(v, `${path}[${i}]`));
  if (value && typeof value === 'object') return Object.entries(value).flatMap(([k, v]) => strings(v, `${path}.${k}`));
  return [];
}

const ALL = Object.entries(siteModule).flatMap(([name, value]) => strings(value, name));
const offenders = (re: RegExp) => ALL.filter((l) => re.test(l.text)).map((l) => `${l.path}: ${l.text}`);

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? sourceFiles(join(dir, e.name)) : /\.(ts|tsx)$/.test(e.name) ? [join(dir, e.name)] : [],
  );
}

describe('public claims', () => {
  it('shows the decided Plus prices and trials', () => {
    expect(site.scenes.s10.support).toContain('$4.99 a month with a 1-month free trial, or $49.99 a year with a 2-month free trial');
  });

  it('has no other price anywhere in apps/web/src', () => {
    const bad: string[] = [];
    for (const f of sourceFiles(join(WEB_ROOT, 'src'))) {
      for (const m of readFileSync(f, 'utf8').matchAll(/\$\d+(\.\d{2})?/g)) {
        if (m[0] !== '$4.99' && m[0] !== '$49.99') bad.push(`${f}: ${m[0]}`);
      }
    }
    expect(bad).toEqual([]);
  });

  it('makes no backup claim', () => {
    expect(offenders(/\bback(s|ed)?[- ]?up\b|\bbackups?\b/i)).toEqual([]);
  });

  it('puts no limit on Read together and gates no child book behind Plus', () => {
    expect(offenders(/free sessions|after the free|every child'?s book|books? for more children/i)).toEqual([]);
  });

  it('promises writing with one co-parent, not the whole family', () => {
    expect(offenders(/whole family|people you invite|anyone you invite/i)).toEqual([]);
  });

  it('never says beta', () => {
    expect(offenders(/\bbeta\b/i)).toEqual([]);
  });

  it('does not say letters stay on the phone, or that transcription has another mode', () => {
    expect(offenders(/stay(s)? on (your|this) phone|private on your phone|by default and/i)).toEqual([]);
  });

  it('uses the fictional child Asha in the sample letter', () => {
    expect(siteModule.sampleLetter.to).toBe('Asha');
  });
});
