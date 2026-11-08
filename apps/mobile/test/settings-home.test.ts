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
    // The body only: the "Early version" heading is not part of the registered note and is not shown, so About says
    // "early" once (founder, 8 Nov 2026; CLO-5).
    expect(uses.map((m) => m[1])).toEqual(['body']);
    for (const m of uses) expect(m.index!).toBeGreaterThan(about);
    // Unstyled: no tinted card, no accent caps label.
    expect(home).not.toMatch(/rounded-lg bg-secondary|tone="accent" caps/);
    // No other screen shows it.
    const others = walk(SRC)
      .map((f) => relative(SRC, f))
      .filter((f) => f !== join('app', 'settings', 'index.tsx') && /about\.beta\.(label|body)/.test(code(f)));
    expect(others).toEqual([]);
  });

  it('leaves the short privacy line to Settings, Privacy, where it is said once as the last line (design.md 2.11)', () => {
    expect(home).not.toMatch(/copy\.trust\.short/);
    const privacy = code('app/settings/privacy.tsx');
    expect(privacy.match(/copy\.trust\.short/g)).toHaveLength(1);
    expect(privacy).toMatch(/<ListSection title=\{p\.documentsTitle\} footer=\{copy\.trust\.short\}>/);
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
    expect(home).toMatch(/\{capabilities\.accountDeletion && auth\.signedIn \? \(\s*<ListSection>\s*<ListRow title=\{h\.deleteAccountLabel\}/);
  });

  it('shows Delete account only while signed in, and only in a build with the Delete account switch on (#358 review; founder, 30 Oct 2026)', () => {
    // The row's own condition, read from the screen and run for each case, so a change to it fails here.
    const m = home.match(/\{([^{}?]+)\?\s*\(\s*<ListSection>\s*<ListRow title=\{h\.deleteAccountLabel\}/);
    expect(m, 'the Delete account row and its condition').not.toBeNull();
    const shown = new Function('capabilities', 'auth', `return Boolean(${m![1]});`) as (c: { accountDeletion: boolean }, a: { signedIn: boolean }) => boolean;
    expect(shown({ accountDeletion: true }, { signedIn: true })).toBe(true); // switched on, signed in: the row
    expect(shown({ accountDeletion: true }, { signedIn: false })).toBe(false); // signed out: no row
    expect(shown({ accountDeletion: false }, { signedIn: true })).toBe(false); // switch off (the alpha default), even signed in: no row
    expect(shown({ accountDeletion: false }, { signedIn: false })).toBe(false);
    // `auth` is the session the screen already reads for the Account row.
    expect(home).toMatch(/const auth = useAuth\(\);/);
    // The row reads the capability itself, which includes the server switch (test/account-deletion-switch.test.ts runs it against the real one).
    expect(m![1]).toMatch(/capabilities\.accountDeletion/);
  });
});

describe('[S40] If you are struggling', () => {
  const page = code('app/settings/struggling.tsx');
  const elsewhere = code('app/settings/struggling-elsewhere.tsx');

  it('is one tap from Settings home: the line, the emergency line first, this region\'s lines, other countries, the privacy line', () => {
    const order = ['{s.body}', 's.emergencyTitle', 'local.lines.map', 's.otherCountries', '{s.privacy}'].map((k) => page.indexOf(k));
    for (const i of order) expect(i).toBeGreaterThan(-1);
    expect([...order].sort((x, y) => x - y)).toEqual(order);
    // The lines come from packages/content helplines.ts by the phone's region; calls and texts go through
    // help-links.logic.ts with the copy fallback (RT-SET-02, F20-REQ-005).
    expect(page).toMatch(/const local = localLines\(usePhoneRegion\(\)\)/);
    expect(page).toMatch(/onPress=\{\(\) => link\.open\(emergency\.target!\)\}/);
    // The baby is named, as the earlier line did (nomenclature audit R-F).
    expect(en.struggling.emergencyTitle).toBe('Are you or your baby in danger right now?');
  });

  it('a region we hold no lines for gets the directory and the general emergency words, never a guessed number', () => {
    expect(page).toMatch(/\{showDirectory\(local\) \? \(\s*<ListRow\s+title=\{s\.directory\}/);
    expect(page).toMatch(/\{local && local\.lines\.length > 0 \? \(/);
    expect(page).toMatch(/WebBrowser\.openBrowserAsync\(HELPLINE_DIRECTORY\.url\)/);
    expect(page).toMatch(/\{emergency\.label\}/);
  });

  it('Lines in other countries is its own page with every region and the directory', () => {
    expect(page).toMatch(/router\.push\(ELSEWHERE_ROUTE as Href\)/);
    expect(page).toMatch(/const ELSEWHERE_ROUTE = '\/settings\/struggling-elsewhere'/);
    expect(elsewhere).toMatch(/otherCountries\(\)\.map/);
    expect(elsewhere).toMatch(/HELPLINE_DIRECTORY\.url/);
    const layout = code('app/settings/_layout.tsx');
    expect(layout).toMatch(/<Stack\.Screen name="struggling-elsewhere" options=\{\{ title: copy\.struggling\.otherCountries \}\} \/>/);
  });

  it('has no drawing, no lamp, no motion, and records nothing', () => {
    for (const c of [page, elsewhere, code('components/settings/helpline-card.tsx'), code('components/settings/phone-region.ts'), code('components/settings/struggling.logic.ts')]) {
      expect(c).not.toMatch(/LineArt|Lamp|Animated|entering|track\(|haptic|console\.|analytics|AsyncStorage|setItem/);
    }
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

  it('groups what ships by theme, each with its title and line, puts the pack attributions word for word after Speech, in a virtualised list', () => {
    expect(page).toMatch(/lib\.notices\.themes\.map/);
    expect(page).toMatch(/licences\.themes\[g\.id\]\.title/);
    expect(page).toMatch(/licences\.themes\[g\.id\]\.line/);
    expect(page).toMatch(/licences\.packs\.map/);
    expect(page).toMatch(/<SectionList\b/);
    expect(page).toMatch(/lib\.noticeText\(e\)/);
    // A row opens to its version, copyright lines and full text.
    expect(page).toMatch(/licences\.version\.replace\('\{version\}'/);
    expect(page).toMatch(/row\.copyright/);
    expect(page).not.toMatch(/handKeptSections|librariesTitle/);
    expect(licences.libraries).toBe('React Native, Expo and the other libraries in this app are open source. Each one is listed below with its license.');
  });
});
