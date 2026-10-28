/// <reference types="node" />
/**
 * Settings home, If you are struggling and Licenses (EXPERIENCE_PASS_2026-10 S40, package P6). Screens do not load in
 * Node, so their structure is pinned in their source: the early-version note only under About, word for word; the
 * short privacy line once; no accordion inside the list; the support lines one tap away and unchanged; the licence
 * notices loaded only when their page opens.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { authCopy, en, licences } from '@scribe/content';
import { accountSubtitle } from '../src/components/settings/settings-home.logic';

const SRC = join(__dirname, '..', 'src');
const read = (rel: string) => readFileSync(join(SRC, rel), 'utf8');
const code = (rel: string) => read(rel).replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : /\.tsx?$/.test(n) && !/\.test\.tsx?$/.test(n) ? [p] : [];
  });

const home = code('app/settings/index.tsx');

describe('[S40] Settings home', () => {
  it('the early-version note appears only under About, with its registered words unchanged (D-060, K-13)', () => {
    // Registered text (in-app-disclosures.md section 1); experience-pass.test.ts pins the words themselves.
    expect(en.settings.about.beta.label).toBe('Early version');
    expect(en.settings.about.beta.body).toBe('{app} is an early version, and it can make mistakes. Some things may change. Export a copy of your letters now and then.');
    const about = home.indexOf('copy.settings.about.title');
    expect(about).toBeGreaterThan(-1);
    const uses = [...home.matchAll(/copy\.settings\.about\.beta\.(\w+)/g)];
    expect(uses.map((m) => m[1])).toEqual(['label', 'body']);
    for (const m of uses) expect(m.index!).toBeGreaterThan(about);
    // Unstyled: no tinted card, no accent caps label.
    expect(home).not.toMatch(/rounded-lg bg-secondary|tone="accent" caps/);
    // No other screen shows it.
    const others = walk(SRC)
      .map((f) => relative(SRC, f))
      .filter((f) => f !== join('app', 'settings', 'index.tsx') && /about\.beta\.(label|body)/.test(code(f)));
    expect(others).toEqual([]);
  });

  it('says the short privacy line once, as the Your data footer, and drops the page footer', () => {
    expect(home.match(/copy\.trust\.short/g)).toHaveLength(1);
    expect(home).toMatch(/<ListSection title=\{h\.sections\.data\} footer=\{copy\.trust\.short\}>/);
    expect(home).not.toMatch(/neverRewrite/);
  });

  it('opens nothing in place: If you are struggling and Licenses are rows that push their own pages', () => {
    expect(home).not.toMatch(/Disclosure|expanded|CaretDown|CaretUp/);
    expect(home).toMatch(/<ListRow title=\{copy\.struggling\.title\} trailing="chevron" accessibilityHint=\{h\.strugglingA11yHint\} onPress=\{go\(ROUTES\.struggling\)\}/);
    expect(home).toMatch(/<ListRow title=\{h\.licencesLabel\} trailing="chevron" onPress=\{go\(ROUTES\.licenses\)\}/);
    expect(home).toMatch(/struggling: '\/settings\/struggling'/);
    expect(home).toMatch(/licenses: '\/settings\/licenses'/);
    // The settings stack titles both pages from content.
    const layout = code('app/settings/_layout.tsx');
    expect(layout).toMatch(/<Stack\.Screen name="struggling" options=\{\{ title: copy\.struggling\.title \}\} \/>/);
    expect(layout).toMatch(/<Stack\.Screen name="licenses" options=\{\{ title: licences\.title \}\} \/>/);
    expect(en.settingsHome.licencesLabel).toBe('Licenses');
  });

  it('Account names the way the person signs in, once signed in (S40; P8a\'s request on #310)', () => {
    for (const status of ['signedOut', 'restoring', 'signingIn', 'awaitingCode'] as const) {
      expect(accountSubtitle({ status, provider: 'apple' }), status).toBe(en.settingsHome.accountHelp);
    }
    for (const status of ['checkingConsent', 'needsConsent', 'ready', 'signingOut'] as const) {
      expect(accountSubtitle({ status, provider: 'apple' }), status).toBe('Signed in with Apple');
    }
    expect(accountSubtitle({ status: 'ready', provider: 'google' })).toBe(authCopy.account.signedInWith.google);
    expect(accountSubtitle({ status: 'ready', provider: 'email' })).toBe(authCopy.account.signedInWith.email);
    expect(accountSubtitle({ status: 'ready', provider: null })).toBe(authCopy.account.signedInWith.other);
    expect(home).toMatch(/accountSubtitle\(\{ status: auth\.state\.status, provider: auth\.account\.provider \}\)/);
    expect(home).toMatch(/<ListRow title=\{h\.accountLabel\} subtitle=\{account\}/);
  });

  it('keeps the P8 seams: Account, Back up my recordings and Delete account, each behind its capability', () => {
    expect(home).toMatch(/\{capabilities\.signIn \? <ListRow title=\{h\.accountLabel\}/);
    expect(home).toMatch(/\{backupInBuild\(\) \? <ListRow title=\{backupCopy\.title\}/);
    expect(home).toMatch(/\{capabilities\.signIn \? \(\s*<ListSection>\s*<ListRow title=\{h\.deleteAccountLabel\}/);
  });
});

describe('[S40] If you are struggling', () => {
  const page = code('app/settings/struggling.tsx');

  it('is one tap from Settings home and shows the line, the three resources and the 911 line, unchanged', () => {
    expect(en.struggling.resources).toHaveLength(3);
    expect(page).toMatch(/\{s\.body\}/);
    expect(page).toMatch(/s\.resources\.map\(\(r\) => \(\s*<ListRow key=\{r\.tel\} title=\{r\.name\} subtitle=\{r\.how\}/);
    expect(page).toMatch(/Linking\.openURL\(`tel:\$\{r\.tel\}`\)/);
    expect(page).toMatch(/\{s\.emergency\}/);
    expect(en.struggling.emergency).toBe('If you or your baby are in danger right now, call 911.');
  });

  it('has no drawing, no lamp, no motion, and records nothing', () => {
    expect(page).not.toMatch(/LineArt|Lamp|Animated|entering|track\(|haptic/);
  });
});

describe('[S40] Licenses', () => {
  const page = code('app/settings/licenses.tsx');

  it('loads the notices only when the page opens, never at cold start (lib/licences.ts)', () => {
    expect(page).not.toMatch(/^import (?!type )[^;]*from '@\/lib\/licences'/m);
    expect(page).toMatch(/import type \* as Licences from '@\/lib\/licences'/);
    expect(page).toMatch(/require\('@\/lib\/licences'\)/);
    // Nothing else in the app imports the notices.
    const importers = walk(SRC)
      .map((f) => relative(SRC, f))
      .filter((f) => /^import (?!type )[^;]*from '@\/lib\/licences'|require\('@\/lib\/licences'\)/m.test(code(f)) && f !== join('app', 'settings', 'licenses.tsx'));
    expect(importers).toEqual([]);
  });

  it('shows the hand-kept credits, the pack attributions word for word, and every notice in a virtualised list', () => {
    expect(page).toMatch(/lib\.handKeptSections\.map/);
    expect(page).toMatch(/licences\.packs\.map/);
    expect(page).toMatch(/lib\.notices\.licences\.map/);
    expect(page).toMatch(/<SectionList\b/);
    expect(page).toMatch(/lib\.noticeText\(e\)/);
    expect(licences.libraries).toBe('React Native, Expo and the other libraries in this app are open source. Each one is listed below with its license.');
  });
});
