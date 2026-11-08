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
import { authCopy, billingCopy, en, licences } from '@scribe/content';
import { accountSubtitle, headerCard, planRowFor } from '../src/components/settings/settings-home.logic';
import { EMPTY_PLAN } from '../src/lib/billing/plan.logic';

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
    // Licenses moved to the Legal page with the Terms and the Privacy Policy (settings-ia.md 3, the regroup).
    expect(home).toMatch(/<ListRow title=\{h\.legalLabel\} trailing="chevron" onPress=\{go\(ROUTES\.legal\)\}/);
    expect(home).toMatch(/struggling: '\/settings\/struggling'/);
    expect(home).toMatch(/legal: '\/settings\/legal'/);
    const legal = code('app/settings/legal.tsx');
    expect(legal).toMatch(/title=\{h\.licencesLabel\} trailing="chevron" onPress=\{\(\) => router\.push\('\/settings\/licenses' as Href\)\}/);
    // The same two documents, the same link role and the same website pages as the Help rows they replace.
    expect(legal).toMatch(/<ListRow accessibilityRole="link" title=\{h\.termsLabel\} trailing="chevron" onPress=\{open\(brand\.web\.terms\)\}/);
    expect(legal).toMatch(/<ListRow accessibilityRole="link" title=\{h\.privacyPolicyLabel\} trailing="chevron" onPress=\{open\(brand\.web\.privacy\)\}/);
    expect(home).not.toMatch(/brand\.web\.(terms|privacy)/);
    // The settings stack titles both pages from content.
    const layout = code('app/settings/_layout.tsx');
    expect(layout).toMatch(/<Stack\.Screen name="struggling" options=\{\{ title: copy\.struggling\.title \}\} \/>/);
    expect(layout).toMatch(/<Stack\.Screen name="licenses" options=\{\{ title: licences\.title \}\} \/>/);
    expect(layout).toMatch(/<Stack\.Screen name="legal" options=\{\{ title: copy\.settingsHome\.legalLabel \}\} \/>/);
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
    // The header card carries the sign-in line on home (the regroup); accountSubtitle stays for Account itself.
    expect(home).toMatch(/headerCard\(\{\s*signIn: capabilities\.signIn,\s*status: auth\.state\.status,\s*provider: auth\.account\.provider,/);
  });

  it('keeps the P8 seams: Account (the header card), Back up my recordings and Delete account, each behind its capability', () => {
    expect(home).toMatch(/onPress=\{go\(card\.route === 'account' \? ROUTES\.account : ROUTES\.plan\)\}/);
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

describe('[CCO-9, CDesO-1] Settings home regroup (settings-ia.md 3; SETTINGS_AND_ACCOUNT.md 6)', () => {
  const NOW = '2026-11-08T12:00:00.000Z';
  const offPlan = EMPTY_PLAN;
  const free = planRowFor(offPlan, NOW, false);
  const alpha = planRowFor(offPlan, NOW, true);
  const base = { signIn: false, status: 'signedOut' as const, provider: null, signsAs: 'Mama', plan: free };

  it('without sign-in the header card is the Plan row: name, On this phone, the Plan row value and line, opens Plan', () => {
    expect(free).toEqual({ subtitle: en.settingsHome.planHelp, value: 'Free' });
    expect(headerCard(base)).toEqual({ title: 'Mama', subtitle: 'On this phone', value: 'Free', hint: 'Opens Plan.', route: 'plan', footer: en.settingsHome.planHelp, planRow: false });
    expect(headerCard({ ...base, plan: { subtitle: undefined, value: 'Plus, shared' } })).toMatchObject({ value: 'Plus, shared', footer: undefined });
    // No name yet: the card is the Plan row by its own name (CCO-9, "Settings, Plan").
    for (const signsAs of ['', '   ', null, undefined]) expect(headerCard({ ...base, signsAs }).title).toBe(en.settingsHome.planLabel);
  });

  it('in alpha the card shows no plan status and the alpha note sits under it (#552)', () => {
    expect(headerCard({ ...base, plan: alpha })).toMatchObject({ value: undefined, footer: billingCopy.alpha.note, route: 'plan' });
  });

  it('with sign-in the card opens Account and the Plan row, unchanged, sits right under it (CCO-9)', () => {
    const signedIn = headerCard({ ...base, signIn: true, status: 'ready', provider: 'apple' });
    expect(signedIn).toEqual({ title: 'Mama', subtitle: authCopy.account.signedInWith.apple, value: undefined, hint: 'Opens Account.', route: 'account', footer: undefined, planRow: true });
    expect(headerCard({ ...base, signIn: true }).subtitle).toBe(authCopy.account.signedOutTitle);
    expect(headerCard({ ...base, signIn: true, signsAs: '' }).title).toBe(en.settingsHome.accountLabel);
    expect(home).toMatch(/\{card\.planRow \? \(\s*<ListRow title=\{h\.planLabel\} subtitle=\{planRowView\.subtitle\} value=\{planRowView\.value\} trailing="chevron" onPress=\{go\(ROUTES\.plan\)\} testID="settings\.plan" \/>/);
    expect(home).toMatch(/plan: planRowView,/);
    expect(home).toMatch(/plan: '\/settings\/plus'/);
    // Plan is one tap from home in both builds: the card opens Plan, or the Plan row does.
    expect(home.match(/ROUTES\.plan\b/g)?.length).toBe(2);
  });

  it('draws the five groups in order, then About, with every row develop has', () => {
    const order = ['settings.headerCard', 'copy.children.settings.sectionTitle', 'h.sections.writing', 'h.sections.letters', 'h.sections.privacy', 'h.sections.help', 'copy.settings.about.title'];
    const at = order.map((k) => home.indexOf(k));
    for (const [i, n] of at.entries()) expect(n, order[i]).toBeGreaterThan(-1);
    expect([...at].sort((a, b) => a - b)).toEqual(at);
    expect(en.children.settings.sectionTitle).toBe('Children');
    expect(en.settingsHome.sections).toMatchObject({ writing: 'Writing', letters: 'Your letters', privacy: 'Privacy and security', help: 'Help and legal', about: 'About' });
    expect(home).not.toMatch(/h\.sections\.data\b|h\.sections\.account\b/);
    const between = (a: string, b: string) => home.slice(home.indexOf(a), home.indexOf(b));
    const writing = between('h.sections.writing', 'h.sections.letters');
    for (const r of ['h.languageLabel', 'h.yourWords', 'h.remindersLabel', 'h.appearanceLabel']) expect(writing, r).toContain(r);
    const letters = between('h.sections.letters', 'h.sections.privacy');
    for (const r of ['h.whereLive', 'h.exportLabel', 'copy.settings.delete.recentlyDeleted', 'backupCopy.title', 'h.storageLabel']) expect(letters, r).toContain(r);
    const privacy = between('h.sections.privacy', 'h.sections.help');
    expect(privacy.indexOf('appLockCopy.settingsHome.appLock')).toBeGreaterThan(-1);
    expect(privacy.indexOf('appLockCopy.settingsHome.appLock')).toBeLessThan(privacy.indexOf('h.privacyLabel'));
    const help = home.slice(home.indexOf('h.sections.help'), home.indexOf('copy.settings.about.title'));
    for (const r of ['h.helpLabel', 'copy.struggling.title', 'h.legalLabel']) expect(help, r).toContain(r);
  });
});

describe('[S40] If you are struggling', () => {
  const page = code('app/settings/struggling.tsx');

  it('is one tap from Settings home and shows the line, the three resources and the 911 line, unchanged', () => {
    expect(en.struggling.resources).toHaveLength(3);
    expect(page).toMatch(/\{s\.body\}/);
    expect(page).toMatch(/s\.resources\.map\(\(r\) => \(\s*<ListRow key=\{r\.tel\} title=\{r\.name\} subtitle=\{r\.how\}/);
    // The call goes through help-links.logic.ts (tel:${r.tel}, with the copy fallback: RT-SET-02, F20-REQ-005).
    expect(page).toMatch(/onPress=\{\(\) => link\.open\(callTarget\(r\)\)\}/);
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
