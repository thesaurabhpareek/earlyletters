/// <reference types="node" />
/**
 * The early-version note and the store listing agree (F17-REQ-019, F20-REQ-009; K-13, D-060): About in Settings
 * shows the note, and neither the listing copy (packages/content/src/store.en.ts) nor the EAS Metadata file built from
 * it (apps/mobile/store.config.json) says it, or any word that means the same (App Review 2.2).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { storeListing } from '../../../packages/content/src/store.en';
import { copy } from '../src/lib/copy';

const APP = join(__dirname, '..');

/** The same words as the content rules' K-13 store test (packages/content/test/rules.test.ts). */
const BETA_LIKE = /\b(beta|early version|early access|preview|pre-?release|demo|test (?:version|build)|trial version|work in progress)\b/i;

/** Every string in a value, with its path. */
function leaves(value: unknown, path: string): { path: string; text: string }[] {
  if (typeof value === 'string') return [{ path, text: value }];
  if (Array.isArray(value)) return value.flatMap((v, i) => leaves(v, `${path}[${i}]`));
  if (value && typeof value === 'object') return Object.entries(value).flatMap(([k, v]) => leaves(v, `${path}.${k}`));
  return [];
}

const note = copy.settings.about.beta;
const listing = leaves(storeListing, 'storeListing');
const metadata = leaves(JSON.parse(readFileSync(join(APP, 'store.config.json'), 'utf8')), 'store.config.json');

describe('About shows the early-version note (F17-REQ-019, F20-REQ-009)', () => {
  it('the note says it is an early version that can make mistakes', () => {
    expect(note.label.trim().length).toBeGreaterThan(0);
    expect(note.body).toMatch(/\bearly version\b/i);
    expect(note.body).toMatch(/\bmistakes?\b/i);
  });

  it('Settings draws the label and the body inside About, after the version row', () => {
    const src = readFileSync(join(APP, 'src/app/settings/index.tsx'), 'utf8');
    const about = src.indexOf('<ListSection title={copy.settings.about.title}>');
    expect(about).toBeGreaterThan(-1);
    const after = src.slice(about);
    const block = after.slice(after.indexOf('testID="settings.about.beta"'), after.indexOf('</View>'));
    expect(after.indexOf('h.versionLabel')).toBeLessThan(after.indexOf('testID="settings.about.beta"'));
    expect(block).toContain('{copy.settings.about.beta.label}');
    expect(block).toContain('{copy.settings.about.beta.body}');
    // Unconditional: the note stays until the founder ends the beta, so no switch hides it.
    const between = after.slice(after.indexOf('</ListSection>'), after.indexOf('testID="settings.about.beta"'));
    expect(between.replace(/\{\/\*[\s\S]*?\*\/\}/g, '')).not.toMatch(/&&|\?|\{[^}]*\(/);
  });
});

describe('the store listing never carries the note (F20-REQ-009, App Review 2.2)', () => {
  it('has the copy and the metadata to check', () => {
    expect(listing.length).toBeGreaterThan(5);
    expect(metadata.length).toBeGreaterThan(5);
  });

  it.each([
    ['packages/content/src/store.en.ts', listing],
    ['apps/mobile/store.config.json', metadata],
  ])('%s has no beta-like word', (_file, texts) => {
    expect(texts.filter((t) => BETA_LIKE.test(t.text)).map((t) => t.path)).toEqual([]);
  });

  it.each([
    ['packages/content/src/store.en.ts', listing],
    ['apps/mobile/store.config.json', metadata],
  ])('%s does not quote the note, label or body', (_file, texts) => {
    const all = texts.map((t) => t.text.toLowerCase()).join('\n');
    expect(all).not.toContain(note.label.toLowerCase());
    expect(all).not.toContain(note.body.toLowerCase());
    // Any sentence of the body, so a pasted half is caught too.
    for (const sentence of note.body.split(/(?<=\.)\s+/).filter((s) => s.length > 15)) expect(all).not.toContain(sentence.toLowerCase());
  });
});
