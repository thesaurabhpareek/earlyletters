/**
 * BL-1165, card NS-43 R13 (and the render half of R8 and R11): the real first-run route (app/onboarding.tsx) rendered
 * to static markup on the BL-278 harness, at AX5, on the first-book steps. The pure rules and the sync behaviour are in
 * test/ns-43-first-book-states.test.ts.
 *
 * What this proves: at the accessibility-5 text size every field, choice and reason on "Who is this book for?" and "What
 * does {child} call you?" is in the screen, whole, with no line limit, in reading order (on the first: Back, the
 * heading, the name field, born or expecting, the date, Add another child, the signed-in note and Use another account,
 * the reason, Continue; on the second: the heading, the field, the examples, the help, the reason, Continue), each with
 * its accessible name; the reason is a polite live region and a waiting Continue is marked disabled. What it does NOT prove: VoiceOver's own focus moves and announcements, stacking (className does
 * not reach this markup), the iOS date button (react-native-web draws the web date input), or scrolling on an SE 3.
 * Those are the device pass of R13, which stays a device row.
 *
 * Stood in: the route's account question (its screen answer is set per test), the auth session, the store (a saved
 * draft opens the step under test, as a relaunch does), and the decorative or native parts (the lamp, the cover, which
 * is hidden from VoiceOver on these steps, the language sheet, the speech card, icons). The steps, their fields, the
 * date field, the choice group and every word are the app's own. Fictional family "Asha" only.
 */
import * as React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { harness } from './harness';

const h = vi.hoisted(() => ({
  screen: 'steps' as string,
  draft: null as string | null,
  englishOnly: true,
}));

vi.mock('expo-router', () => ({
  router: { replace: () => undefined, push: () => undefined },
  usePathname: () => '/onboarding',
  useIsFocused: () => true,
}));
vi.mock('phosphor-react-native/src/icons/LockSimple', () => ({ LockSimpleIcon: () => null }));
vi.mock('phosphor-react-native/src/icons/Microphone', () => ({ MicrophoneIcon: () => null }));
vi.mock('phosphor-react-native/src/icons/Plus', () => ({ PlusIcon: () => null }));
vi.mock('phosphor-react-native/src/icons/X', () => ({ XIcon: () => null }));
vi.mock('phosphor-react-native/src/icons/CaretLeft', () => ({ CaretLeftIcon: () => null }));
vi.mock('@react-native-community/datetimepicker', () => ({ default: () => null }));
vi.mock('react-native-safe-area-context', async () => {
  const { View } = await import('react-native-web');
  return { SafeAreaView: View, useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) };
});

// Decorative or native: the lamp, the cover (no accessibilityLabel on these steps, so VoiceOver never reads it), the
// language sheet (closed), the speech card and the welcome art (other steps).
// The harness's a11y stand-in (setup.tsx), plus the focus hook the steps call: focus moves are VoiceOver's, on the device.
vi.mock('@/lib/a11y', async () => {
  const { tokens } = await import('@scribe/design-tokens');
  const logic = await import('@/lib/a11y.logic');
  return {
    announce: (m: string) => void harness.announced.push(m),
    useTheme: () => ({ c: tokens.light, scheme: 'light', highContrast: false, reduceTransparency: false }),
    useScheme: () => 'light',
    useFontScale: () => harness.fontScale,
    useIsLargeText: () => logic.isLargeText(harness.fontScale),
    useIsAccessibilitySize: () => logic.isAccessibilitySize(harness.fontScale),
    useFocusOnMount: () => undefined,
    useScreenReader: () => true,
  };
});
vi.mock('@/components/ui/lamp', () => ({ Lamp: () => null }));
vi.mock('@/components/ui/sheet', () => ({ Sheet: () => null })); // the date sheet, closed until a tap
vi.mock('@/components/ui/separator', () => ({ Separator: () => null }));
vi.mock('@/components/ui/safe-area-view', async () => ({ SafeAreaView: (await import('react-native-web')).View }));
vi.mock('@/components/book/book-cover', () => ({ BookCover: () => null }));
vi.mock('@/components/language/language-picker', () => ({ LanguagePicker: () => null }));
vi.mock('@/components/speech/speech-consent-card', () => ({ SpeechConsentCard: () => null }));
vi.mock('@/components/onboarding/promise-sample', () => ({ PromiseSample: () => null }));
vi.mock('@/components/onboarding/welcome-lockup', () => ({ WelcomeLockup: () => null }));
vi.mock('@/components/onboarding/welcome-sign-in', () => ({ WelcomeSignIn: () => null }));
vi.mock('@/components/onboarding/outage-screen', () => ({ OutageScreen: () => null }));
vi.mock('@/components/onboarding/new-phone-screens', async () => {
  const { Text } = await import('react-native-web');
  const at = (name: string) => () => React.createElement(Text, null, `held:${name}`);
  return { OpeningBookScreen: at('opening'), SlowBookScreen: at('slow'), OfflineBookScreen: at('offlineBook'), HeldScreen: at('finishSetup'), NoBookHereScreen: at('noBookHere') };
});
vi.mock('@/components/settings/open-deletion', () => ({ CheckingScreen: () => null, OpenDeletionScreen: () => null }));
vi.mock('@/lib/account-deletion', () => ({ useFirstRunGate: () => ({ screen: 'none', request: null }) }));

// The route's answer is set per test (its own rules are the node test's); `steps` is the account having said it is new.
vi.mock('@/lib/first-run/use-first-run-route', () => ({
  useFirstRunRoute: () => ({
    screen: h.screen, step: 'unchanged', outage: null, localStartOffered: false, retryOnReconnect: false, mayBeginBook: true, offerSignIn: false, arrivedFromAccount: false,
    localStartChosen: false, online: true, restoring: false, accountHasBook: false,
    chooseLocalStart: () => undefined, tryAgain: () => undefined, markPastWelcome: () => undefined, restartFromWelcome: () => undefined, retryOpening: () => undefined, startBook: () => undefined,
  }),
}));
// The store build (servers on, D-157): signed in, so the steps open account first, as they do for every new account.
vi.mock('@/lib/auth/session-provider', () => ({
  useAuth: () => ({ state: { status: 'ready', userId: 'user-asha-parent', sync: 'on' }, configured: true, account: { maskedEmail: 'a***@example.com', provider: 'apple' }, signOut: async () => 'done', lastMethod: 'apple', signInWithApple: async () => undefined }),
}));
vi.mock('@/lib/auth/apple', () => ({ appleSignInAvailable: async () => false }));
vi.mock('@/lib/capabilities', () => ({
  capabilities: { coParent: false, signIn: false },
  serverFeaturesEnabled: () => true,
  englishOnlyEnabled: () => h.englishOnly,
  spokenLanguagesListed: () => null,
}));
vi.mock('@/lib/store', () => ({
  addChildren: () => [],
  getActiveChildId: () => null,
  getSetting: (k: string) => (k === 'firstRun.draft' ? h.draft : null),
  setSetting: () => undefined,
  deleteSetting: () => undefined,
  listChildren: () => [],
  listDeletedBooks: () => [],
  setActiveChildId: () => undefined,
  subscribe: () => () => undefined,
  subscribeTo: () => () => undefined,
  todayISO: () => '2026-11-27',
}));
vi.mock('@/lib/first-run/draft', () => ({ clearFirstRunDraft: () => undefined }));
vi.mock('@/lib/analytics/track', () => ({ track: () => undefined, ordinalOf: () => 1 }));
vi.mock('@/lib/language/packs', () => ({ ensureTextRules: async () => undefined }));
vi.mock('@/lib/language/spoken-language', () => ({ useSpokenLanguage: () => ({ primary: { code: 'en' }, setPrimary: () => undefined }) }));
vi.mock('@/lib/models/author-language', () => ({ authorSpeechLanguage: () => 'en' }));
vi.mock('@/components/family/join-wait', () => ({ useWelcomeJoinWait: () => ({ begin: true, line: null, retry: false, retrying: false, onRetry: () => undefined }) }));
vi.mock('@/lib/motion', () => {
  const chain: any = new Proxy(() => chain, { get: () => chain });
  return { useMotion: () => ({ reduced: true, enter: () => undefined, leave: () => undefined }), useReducedMotion: () => true, STANDARD_EASING: chain, springConfig: () => ({}) };
});
vi.mock('@/lib/backup/gate', () => ({ backupInBuild: () => false }));
vi.mock('@/lib/first-run/backup-line-flag', () => ({ backupLineEnabled: () => false }));
vi.mock('@/lib/auth/revocation-wait-line', () => ({ RevocationWaitLine: () => null }));

import { copy, fill, pendingCopy } from '@/lib/copy';
import { CHILD_NAME_MAX, SIGNS_AS_MAX } from '@scribe/core';
import { authCopy } from '@/lib/auth/copy';
import { signedInLine } from '@/lib/first-run/account-books.logic';
import { renderMarkup } from '../helpers/render-markup';

const AX5 = 3.12; // the Dynamic Type accessibility-5 scale the design tokens use (as test/component/ax5-truncation-labels)
const NO_LINE_LIMIT = /r-textOverflow|r-whiteSpace|r-WebkitLineClamp|line-clamp|-webkit-box|numberOfLines/;
const o = copy.onboarding;

const draft = (over: Partial<{ step: string; names: string[]; expecting: boolean; birthday: string | null; dueDate: string | null; signsAs: string }>) =>
  JSON.stringify({ step: 'child', names: [''], expecting: false, birthday: null, dueDate: null, signsAs: '', ...over });

async function render(): Promise<string> {
  let mod: any;
  mod = await import('@/app/onboarding');
  const Onboarding = mod.default;
  return renderMarkup(<Onboarding />);
}

/** HTML-escaped as react-dom writes text and attributes. */
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');

const reEsc = (s: string) => esc(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** The markup offsets of each needle, which must exist and come in this order. */
function inOrder(html: string, needles: string[]): void {
  let from = -1;
  for (const n of needles) {
    const at = html.indexOf(n, from + 1);
    expect(at, `"${n}" after offset ${from}`).toBeGreaterThan(from);
    from = at;
  }
}

beforeEach(() => {
  harness.fontScale = AX5;
  harness.announced.length = 0;
  h.screen = 'steps';
  h.englishOnly = true;
  h.draft = null;
});

describe('[NS-43-R13] the first book at AX5 and with VoiceOver', () => {
  it('[NS-43-R13] "Who is this book for?": Back, heading, name, born or expecting, the date, the signed-in note and Use another account, the reason, Continue, in that order, whole', async () => {
    h.draft = draft({ step: 'child' });
    const html = await render();
    const reason = fill(o.child.needBirthday, { child: o.childFallback });
    // The signed-in note as the stood-in session draws it (a***@example.com), from the real words and masking.
    const note = signedInLine({ maskedEmail: 'a***@example.com', provider: 'apple' }, { signedInAs: o.child.signedInAs, signedInAsLabel: o.child.signedInAsLabel, spokenAddress: o.child.spokenAddress, spokenAddressNoFirst: o.child.spokenAddressNoFirst, apple: authCopy.account.signedInWith.apple });
    expect(note).not.toBeNull();
    inOrder(html, [
      `aria-label="${esc(copy.common.backButton)}"`,
      `>${esc(o.child.title)}<`,
      `>${esc(o.child.nameOptionalLabel)}<`,
      `placeholder="${esc(o.child.namePlaceholder)}"`,
      `aria-label="${esc(o.child.nameOptionalLabel)}"`,
      `>${esc(o.child.nameOptionalHelp)}<`,
      `aria-label="${esc(o.child.bornQuestion)}"`,
      `aria-label="${esc(o.child.bornLabel)}"`,
      `aria-label="${esc(o.child.expectingLabel)}"`,
      `>${esc(o.child.birthdayLabel)}<`,
      `>${esc(o.child.bornToday)}<`,
      `aria-label="${esc(o.child.birthdayLabel)}"`,
      `>${esc(o.child.addAnotherButton)}<`,
      // Use another account starts the sign-in again, so the note and its button sit after the fields, before the reason.
      `>${esc(note!.text)}<`,
      `aria-label="${esc(o.child.useAnother)}"`,
      `>${esc(reason)}<`,
      `>${esc(o.child.cta)}<`,
    ]);
    expect(html).not.toMatch(NO_LINE_LIMIT);
  });

  it('[NS-43-R13] the heading is a level-1 heading, born or expecting is a named radio group that reads its state, and the waiting Continue is disabled', async () => {
    h.draft = draft({ step: 'child' });
    const html = await render();
    expect(html).toMatch(new RegExp(`<h1[^>]*aria-level="1"[^>]*>${reEsc(o.child.title)}<`));
    expect(html).toMatch(/role="heading"/);
    expect(html).toContain('role="radiogroup"');
    expect(html).toMatch(new RegExp(`aria-label="${reEsc(o.child.bornQuestion)}" role="radiogroup"`));
    expect(html).toMatch(new RegExp(`aria-label="${reEsc(o.child.bornLabel)}" role="radio"`));
    expect(html).toMatch(new RegExp(`aria-label="${reEsc(o.child.expectingLabel)}" role="radio"`));
    // react-native-web drops accessibilityState, so the markup cannot show which choice is checked. The state VoiceOver
    // reads is pinned where it is set: the step passes its choice as the group's value, and each radio says checked.
    const { readFileSync } = await import('node:fs');
    const route = readFileSync(new URL('../../src/app/onboarding.tsx', import.meta.url), 'utf8');
    expect(route).toMatch(/label=\{o\.child\.bornQuestion\}\s+value=\{expecting \? 'expecting' : 'born'\}/);
    const group = readFileSync(new URL('../../src/components/ui/choice-group.tsx', import.meta.url), 'utf8');
    expect(group.match(/accessibilityRole="radio"\s+accessibilityState=\{\{ checked \}\}/g)?.length).toBeGreaterThanOrEqual(1);
    const cta = html.slice(html.lastIndexOf('<', html.indexOf(`>${esc(o.child.cta)}<`)) - 600, html.indexOf(`>${esc(o.child.cta)}<`));
    expect(cta).toContain('aria-disabled="true"');
    // VoiceOver reads the dimmed Continue with the reason as its hint (react-native-web drops the hint from the markup).
    expect(route).toMatch(/<Button size="lg" fullWidth disabled=\{disabled\} label=\{cta\} accessibilityHint=\{block \?\? undefined\}/);
  });

  it('[NS-43-R13] the reason Continue waits on is a polite live region, whole at AX5', async () => {
    h.draft = draft({ step: 'child' });
    const html = await render();
    const reason = esc(fill(o.child.needBirthday, { child: o.childFallback }));
    const at = html.indexOf(`>${reason}<`);
    const before = html.slice(Math.max(0, at - 400), at);
    expect(before).toContain('aria-live="polite"');
  });

  it('[NS-43-R13] expecting: the due date, its help and its own reason, in order, whole', async () => {
    h.draft = draft({ step: 'child', expecting: true });
    const html = await render();
    inOrder(html, [
      `>${esc(o.child.title)}<`,
      `aria-label="${esc(o.child.bornQuestion)}"`,
      `>${esc(pendingCopy.onboarding.dueDateLabel)}<`,
      `aria-label="${esc(pendingCopy.onboarding.dueDateLabel)}"`,
      `>${esc(o.child.expectingHelp)}<`,
      `>${esc(fill(o.child.needDueDate, { child: o.childFallback }))}<`,
      `>${esc(o.child.cta)}<`,
    ]);
    expect(html).not.toContain(`>${esc(o.child.bornToday)}<`);
    expect(html).not.toMatch(NO_LINE_LIMIT);
  });

  it('[NS-43-R13] twins: each name field in order, the second removable by name, the reason for the empty one', async () => {
    h.draft = draft({ step: 'child', names: ['Asha', ''], birthday: '2026-03-01' });
    const html = await render();
    inOrder(html, [
      `>${esc(o.child.title)}<`,
      'value="Asha"',
      `>${esc(o.child.nameLabelMore)}<`,
      `aria-label="${esc(fill(pendingCopy.onboarding.removeChild, { child: `${o.child.nameLabel} 2` }))}"`,
      `aria-label="${esc(o.child.bornQuestion)}"`,
      `>${esc(o.child.needNameMany)}<`,
      `>${esc(o.child.cta)}<`,
    ]);
  });

  it('[NS-43-R13] a long name is kept whole at AX5, with its limit line under the field', async () => {
    const long = 'Asha '.repeat(12).trim().slice(0, CHILD_NAME_MAX);
    h.draft = draft({ step: 'child', names: [long], birthday: '2026-03-01' });
    const html = await render();
    expect(html).toContain(`value="${esc(long)}"`);
    inOrder(html, [`value="${esc(long)}"`, `>${esc(fill(o.child.nameLimit, { n: CHILD_NAME_MAX }))}<`, `>${esc(o.child.cta)}<`]);
    expect(html).not.toMatch(NO_LINE_LIMIT);
  });

  it('[NS-43-R13] "What does {child} call you?": heading, the field named by the question, the examples as a named group, the help, the reason, Continue', async () => {
    h.draft = draft({ step: 'signsAs', names: ['Asha'], birthday: '2026-03-01' });
    const html = await render();
    const title = esc(fill(o.signsAs.title, { child: 'Asha' }));
    inOrder(html, [
      `>${title}<`,
      `aria-label="${title}"`,
      `>${esc(o.signsAs.examplesLabel)}<`,
      `aria-label="${esc(o.signsAs.examplesLabel)}"`,
      ...o.signsAs.examples.map((ex: string) => `>${esc(ex)}<`),
      `>${esc(o.signsAs.notYetHelp)}<`,
      `>${esc(fill(o.signsAs.needSignsAs, { child: 'Asha' }))}<`,
      `>${esc(o.signsAs.cta)}<`,
    ]);
    expect(html).not.toMatch(NO_LINE_LIMIT);
  });

  it('[NS-43-R13] a signature at its limit is kept whole at AX5 with its helper, and Continue is live', async () => {
    const at = 'Mama Asha '.repeat(4).slice(0, SIGNS_AS_MAX);
    h.draft = draft({ step: 'signsAs', names: ['Asha'], birthday: '2026-03-01', signsAs: at });
    const html = await render();
    inOrder(html, [`value="${esc(at)}"`, `>${esc(fill(copy.childrenExtra.edit.signsAsLimit, { n: SIGNS_AS_MAX }))}<`, `>${esc(o.signsAs.cta)}<`]);
    expect(html).not.toContain(esc(fill(o.signsAs.needSignsAs, { child: 'Asha' })));
    expect(html).not.toMatch(NO_LINE_LIMIT);
  });
});

describe('[NS-43-R11] no language teaser in first run (rendered)', () => {
  it('[NS-43-R11] an English-only build draws no language row on "What does {child} call you?"', async () => {
    h.draft = draft({ step: 'signsAs', names: ['Asha'], birthday: '2026-03-01' });
    const html = await render();
    expect(html).not.toContain(esc(copy.settingsHome.languageLabel));
  });

  it('[NS-43-R11] control: a build that hears more than English draws the row, so the test above can fail', async () => {
    h.englishOnly = false;
    h.draft = draft({ step: 'signsAs', names: ['Asha'], birthday: '2026-03-01' });
    const html = await render();
    expect(html).toContain(esc(copy.settingsHome.languageLabel));
  });
});

describe('[NS-43-R8] no child step for a returning account (rendered)', () => {
  for (const screen of ['opening', 'slow', 'offlineBook', 'finishSetup', 'noBookHere', 'blank']) {
    it(`[NS-43-R8] the route on "${screen}" draws no first-book step, even with a saved draft on the child step`, async () => {
      h.screen = screen;
      h.draft = draft({ step: 'child', names: ['Asha'] });
      const html = await render();
      expect(html).not.toContain(esc(o.child.title));
      expect(html).not.toContain(esc(o.child.bornQuestion));
      expect(html).not.toContain(`>${esc(o.child.cta)}<`);
      if (screen !== 'blank') expect(html).toContain(`held:${screen}`);
    });
  }

  it('[NS-43-R8] control: on "steps" the same draft draws the child step', async () => {
    h.draft = draft({ step: 'child', names: ['Asha'] });
    expect(await render()).toContain(esc(o.child.title));
  });
});
