import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CRASH_REPORTING, PROP, REGISTRY } from '../src';

const src = readFileSync(resolve(__dirname, '../../content/src/strings.en.ts'), 'utf8');
const start = src.indexOf('  analyticsConsent: {');
const block = src.slice(start, src.indexOf('\n  },', start));
const commentStart = src.lastIndexOf('// Product analytics consent', start);
const header = src.slice(commentStart, start);
const strings = [...block.matchAll(/^\s+([a-zA-Z]+): "((?:[^"\\]|\\.)*)",$/gm)].map((m) => ({ key: m[1], text: m[2] }));

describe('consent sheet copy (FOUNDER-WORDING)', () => {
  it('is marked for founder approval and carries the five keys', () => {
    expect(header).toContain('FOUNDER-WORDING');
    expect(strings.map((s) => s.key)).toEqual(['title', 'body', 'detail', 'turnOff', 'yesButton', 'noButton']);
  });

  it('follows the content rules: ASCII only, no dashes, curly quotes, ellipsis or emoji', () => {
    for (const { key, text } of strings) {
      expect(text, key).toMatch(/^[\x20-\x7e]+$/);
      expect(text, key).not.toMatch(/[–—‘’“”…]/);
      expect(text, key).not.toMatch(/\p{Extended_Pictographic}/u);
    }
  });

  it('does not claim crash sharing while crash capture is off', () => {
    expect(CRASH_REPORTING.enabled).toBe(false);
    for (const { key, text } of strings) expect(text.toLowerCase(), key).not.toMatch(/crash|error report|bug report/);
  });

  it('does not list a phone model, and promises only what the code sends', () => {
    const all = strings.map((s) => s.text).join(' ');
    expect(all.toLowerCase()).not.toMatch(/phone model|device model|model of your/);
    expect(all).toContain('iPhone software version');
    expect(all).toContain('app version');
    // The never list the sheet states is the never list the registry honours.
    for (const word of ['words', 'recordings', 'photos', "{child}'s name or birthday", 'where you are', "family's religion or background"]) expect(all).toContain(word);
    for (const prop of Object.values(PROP)) expect(prop).not.toMatch(/religion|region|background|birth|dob|device_model|phone_model|location/);
    for (const r of Object.values(REGISTRY)) expect(Object.keys(r.props).join(' ')).not.toMatch(/religion|region|background|birth|dob|device_model|phone_model|location/);
  });

  it('says nothing is sent before the yes, and what turning it off does', () => {
    const t = Object.fromEntries(strings.map((s) => [s.key, s.text]));
    expect(t.detail).toMatch(/Nothing is sent unless you tap Share/);
    expect(t.turnOff).toMatch(/Settings, Privacy/);
    expect(t.turnOff).toMatch(/12 months/);
    expect(t.yesButton).not.toBe(t.noButton);
  });
});
