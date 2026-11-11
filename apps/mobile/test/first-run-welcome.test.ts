/**
 * Account-first slice 2: the Welcome and sign-in (S2), the outage and offline screen (S3), the connectivity source
 * and the hidden "I was invited" door (NX-36 S2, S3; NX-31 R2, R17, R18, R19). Pure rules in Node plus source patterns
 * for the wiring; nothing here runs on a phone. The two titles NX-36 section 12 lists for S2 and S3 are used word for
 * word; the other tests carry the same ids as working labels. NX-31's own R17, R18 and R19 titles are #722's.
 */
import { authCopy, en } from '@scribe/content';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { AuthState } from '../src/lib/auth/machine.logic';
import { firstRunGate, gateInputsFromAuth } from '../src/lib/first-run/gate.logic';
import { isAlphaBuild } from '../src/lib/billing/alpha';
import { visibleCoParentDoors } from '../src/lib/family/entry.logic';
import { failureStillCounts, firstRunScreen, inlineErrorKind, invitedDoorShown, isOnline, welcomeErrorMessage } from '../src/lib/first-run/welcome.logic';

const src = (...p: string[]) => readFileSync(join(__dirname, '..', 'src', ...p), 'utf8');
const welcome = src('components', 'onboarding', 'welcome-sign-in.tsx');
const outage = src('components', 'onboarding', 'outage-screen.tsx');
const onboarding = src('app', 'onboarding.tsx');
const route = src('lib', 'first-run', 'use-first-run-route.ts');
const online = src('lib', 'first-run', 'use-online.ts');

const out: AuthState = { status: 'signedOut' };

describe('[NX-36-S2] Welcome and sign in', () => {
  it('[NX-31-R17] a fresh install with the switch on, no session and no book, lands on the Welcome (signIn)', () => {
    const r = firstRunGate(gateInputsFromAuth({ serverFeatures: true, authState: out, hasLocalBook: false }));
    expect(r.step).toBe('signIn');
  });
  it('[NX-36-S2] Apple and email buttons have equal height; no string on the screen says recordings are kept safe', () => {
    // Equal height: Apple's button and the email Button size="lg" are both tokens.target.primary (56 pt).
    const ui = src('lib', 'auth', 'ui.tsx');
    expect(ui).toMatch(/button: tokens\.target\.primary/);
    expect(ui).toMatch(/style=\{\{ height: SHEET\.button, width: '100%' \}\}/);
    expect(src('components', 'ui', 'button.tsx')).toMatch(/lg: tokens\.target\.primary/);
    expect(welcome).toMatch(/<AppleButton signIn /);
    expect(welcome).toMatch(/<Button size="lg" fullWidth label=\{authCopy\.sheet\.email\}/);
    expect(ui).toMatch(/AppleAuthenticationButtonType\.SIGN_IN/);
    expect(welcome).not.toMatch(/kind="google"|signInWithGoogle|signInWithPasskey/);
    // The words on the screen: none claims a recording is kept safe, backed up or comes with the person.
    const shown = [
      en.onboarding.welcome.title,
      en.onboarding.welcome.subtitle,
      en.onboarding.welcome.body,
      authCopy.sheet.bodies.sign_in_first,
      authCopy.sheet.agreeLine,
      authCopy.sheet.email,
      authCopy.sheet.busy,
      ...Object.values(authCopy.firstRun.errors),
      ...Object.values(authCopy.outage),
      ...Object.values(authCopy.offline),
    ];
    for (const text of shown) expect(text).not.toMatch(/\bsafe\b|back(ed)? ?up|come with you|kept safe/i);
  });
  it('[NX-36-S2] the agreement line, with its two links, sits directly above the buttons', () => {
    expect(welcome).toMatch(/authCopy\.sheet\.agreeLine/);
    expect(welcome).toMatch(/brand\.web\.terms/);
    expect(welcome).toMatch(/brand\.web\.privacy/);
    const iAgree = welcome.indexOf('welcome.agreement');
    const iApple = welcome.indexOf('<AppleButton');
    const iEmail = welcome.indexOf('<Button size="lg"');
    expect(iAgree).toBeGreaterThan(0);
    expect(iAgree).toBeLessThan(iApple);
    expect(iApple).toBeLessThan(iEmail);
  });
  it('[NX-36-S2] the two documents are 44 pt link targets of their own, not links inside a sentence', () => {
    // Button size="sm" is the 44 pt minimum (button.tsx: sm min-h-11), the same targets the age gate uses.
    expect(src('components', 'ui', 'button.tsx')).toMatch(/sm: 'min-h-11/);
    expect(welcome).toMatch(/<Button variant="quiet" size="sm" label=\{termsLink\} role="link" accessibilityRole="link"[^\n]*brand\.web\.terms/);
    expect(welcome).toMatch(/<Button variant="quiet" size="sm" label=\{privacyLink\} role="link" accessibilityRole="link"[^\n]*brand\.web\.privacy/);
    expect(welcome).not.toMatch(/accessibilityRole="link" variant="footnote"|className="underline"/);
    // A page that will not open changes nothing here (the age gate does the same).
    expect(welcome).toMatch(/openBrowserAsync\(url\)\.catch\(\(\) => \{\}\)/);
    // Their names are the existing consent labels, and both are in the sentence the line says.
    const { termsLink, privacyLink } = authCopy.consent.terms;
    expect(authCopy.sheet.agreeLine).toContain(termsLink);
    expect(authCopy.sheet.agreeLine).toContain(privacyLink);
  });
  it('[NX-36-S2] no password, name or phone field, and "I already have a book" is folded into the same two buttons', () => {
    expect(welcome).not.toMatch(/TextField|TextInput|secureTextEntry|textContentType/);
    expect(welcome).not.toMatch(/signInButton|I already have a book/);
  });
  it('[NX-36-S2] it calls the existing sign-in functions and the existing consent sheet, and writes no credential to a log', () => {
    expect(welcome).toMatch(/auth\.signInWithApple/);
    expect(welcome).toMatch(/router\.push\('\/sign-in\/email'\)/);
    expect(welcome).toMatch(/router\.push\('\/sign-in\/consent'\)/);
    expect(welcome).not.toMatch(/console\.|track\(|logError|Sentry/);
  });
  it('[NX-36-S2] the failure that stays on the screen uses the first-run words without "Your letters are safe"; a cancel shows nothing', () => {
    expect(welcomeErrorMessage('provider')).toBe(authCopy.firstRun.errors.provider);
    expect(welcomeErrorMessage('cancelled')).toBeNull();
    expect(welcomeErrorMessage(null)).toBeNull();
    for (const text of Object.values(authCopy.firstRun.errors)) expect(text).not.toMatch(/letters are safe/i);
  });
  it('[NX-36-S2] no first-run word is kept that nothing can reach: a 429 and "not available" go to the outage screen, not under the buttons', () => {
    // Only `provider` stays inline (inlineErrorKind); the gate sends the rest to S3. Words for them would be dead and still need approval.
    expect(Object.keys(authCopy.firstRun.errors)).toEqual(['provider']);
    for (const kind of ['rate_limited', 'email_wait', 'not_available'] as const) {
      expect(inlineErrorKind({ status: 'signedOut', error: kind })).toBeNull();
      expect(welcomeErrorMessage(kind)).not.toBe(authCopy.firstRun.errors.provider);
    }
    expect(src('lib', 'first-run', 'welcome.logic.ts')).not.toMatch(/rateLimited|notAvailable/);
  });
  it('[NX-36-S2] inline errors: wrong_code, invalid_email and provider stay on the screen; a cancel shows nothing', () => {
    for (const error of ['wrong_code', 'invalid_email', 'provider'] as const) expect(inlineErrorKind({ status: 'signedOut', error })).toBe(error);
    expect(inlineErrorKind({ status: 'signedOut', error: 'cancelled' })).toBeNull();
    expect(inlineErrorKind(out)).toBeNull();
    expect(inlineErrorKind({ status: 'signingIn', method: 'apple' })).toBeNull();
  });
  it('[NX-36-S2] a connection or service failure is not an inline error: it goes to the outage screen', () => {
    for (const error of ['network', 'rate_limited', 'email_wait', 'not_available', 'unknown'] as const) {
      expect(inlineErrorKind({ status: 'signedOut', error })).toBeNull();
      expect(firstRunGate(gateInputsFromAuth({ serverFeatures: true, authState: { status: 'signedOut', error }, hasLocalBook: false })).step).toBe('outage');
    }
  });
  it('[NX-36-S2] the screen keeps the as-built lamp and lockup, adds no motion and no analytics event', () => {
    expect(welcome).toMatch(/<Lamp scene="welcome" persistKey="firstRun" \/>/);
    expect(welcome).toMatch(/<WelcomeLockup /);
    expect(welcome).not.toMatch(/Animated\.|entering=|withTiming|withSpring/);
    expect(welcome + outage + route + online).not.toMatch(/\btrack\(/);
  });
  it('[NX-36-S2] accessibility: heading takes focus, the footer is pinned and goes inline in the scroll at AX sizes, the error is a live region', () => {
    expect(welcome).toMatch(/useFocusOnMount\(heading\)/);
    expect(welcome).toMatch(/\{ax \? <View style=\{\{ marginTop: tokens\.space\[6\] \}\}>\{footer\}<\/View> : null\}/);
    expect(welcome).toMatch(/\{ax \? null : <View className="px-5 pb-5 pt-2">\{footer\}<\/View>\}/);
    expect(welcome).toMatch(/<ScrollView contentContainerClassName="flex-grow/);
    expect(src('lib', 'auth', 'ui.tsx')).toMatch(/accessibilityLiveRegion="polite"/);
  });
  it('[NX-36-S2] the Welcome waits (renders nothing) while the session is read, so a signed-in parent never sees it flash', () => {
    expect(onboarding).toMatch(/if \(route\.screen === 'blank'\) return <SafeAreaView className="flex-1 bg-background" \/>;/);
    expect(onboarding).toMatch(/if \(route\.screen === 'welcome'\) return <WelcomeSignIn \/>;/);
  });
});

describe('[NX-36-S3] Outage and offline', () => {
  const failed: AuthState = { status: 'signedOut', error: 'network' };
  it('[NX-31-R19] offline after Yes is the offline variant with the local start offered, and it retries on reconnect', () => {
    const r = firstRunGate({ ...gateInputsFromAuth({ serverFeatures: true, authState: out, hasLocalBook: false, online: false }), localStartFallback: true });
    expect(r).toMatchObject({ step: 'outage', outage: 'offline', localStartOffered: true, retryOnReconnect: true });
  });
  it('[NX-31-R18] a failed sign-in online is the outage variant; the local start follows the compiled constant', () => {
    const base = gateInputsFromAuth({ serverFeatures: true, authState: failed, hasLocalBook: false });
    expect(firstRunGate({ ...base, localStartFallback: true })).toMatchObject({ step: 'outage', outage: 'outage', localStartOffered: true });
    expect(firstRunGate({ ...base, localStartFallback: false })).toMatchObject({ step: 'outage', localStartOffered: false });
  });
  it('[NX-36-S3] the local-start option shows only after Yes, on a failure, with the constant on', () => {
    const states: Array<{ age: 'yes' | 'no' | 'notAsked'; failing: boolean; constant: boolean }> = [];
    for (const age of ['yes', 'no', 'notAsked'] as const) for (const failing of [true, false]) for (const constant of [true, false]) states.push({ age, failing, constant });
    for (const { age, failing, constant } of states) {
      const r = firstRunGate({ serverFeatures: true, ageAnswered: age, hasSession: false, hasLocalBook: false, online: !failing, signInFailed: false, localStartFallback: constant });
      expect(r.localStartOffered, `${age} ${failing} ${constant}`).toBe(age === 'yes' && failing && constant);
    }
    expect(outage).toMatch(/quiet=\{localStartOffered \?/);
  });
  it('[NX-36-S3] the local-start button is 22 characters or fewer and the long sentence is a note', () => {
    expect(authCopy.outage.startLocal.length).toBeLessThanOrEqual(22);
    expect(authCopy.outage.startLocalNote.length).toBeGreaterThan(authCopy.outage.startLocal.length);
    expect(outage).toMatch(/localStartOffered \? `\$\{body\} \$\{t\.startLocalNote\}` : body/);
  });
  it('[NX-36-S3] the sentence a person reads says each thing once: no phrase of four words or more repeats, in either variant, with or without the local start', () => {
    const t = authCopy.outage;
    const shown = [`${t.body} ${t.startLocalNote}`, t.body, `${authCopy.offline.body} ${t.startLocalNote}`, authCopy.offline.body];
    for (const text of shown) {
      const words = text.toLowerCase().replace(/[^a-z ]/g, '').split(/\s+/);
      const seen = new Set<string>();
      for (let i = 0; i + 4 <= words.length; i++) {
        const gram = words.slice(i, i + 4).join(' ');
        expect(seen.has(gram), `"${gram}" repeats in: ${text}`).toBe(false);
        seen.add(gram);
      }
      // "sign in later" and "start the book on this phone" are each said once, by the note.
      expect((text.toLowerCase().match(/sign in later/g) ?? []).length).toBeLessThanOrEqual(1);
      expect((text.toLowerCase().match(/start the book on this phone/g) ?? []).length).toBeLessThanOrEqual(1);
    }
    // Without the button the body does not mention it (the old body offered the local start even when it was off).
    expect(t.body).not.toMatch(/start|phone|sign in later/i);
  });
  it('[NX-36-S3] the offline words say only what the screen does: it does not retry by itself, so the line does not say it', () => {
    expect(authCopy.offline.body).not.toMatch(/by itself|on its own|automatically|\bwe\b/i);
    expect(authCopy.offline.body).toMatch(/Try again/);
    expect(authCopy.outage.body).not.toMatch(/by itself|on its own|automatically|\bwe\b/i);
    // The reconnect path (use-first-run-route.ts) only puts the Welcome back and says "You are back online."; no timer retries sign-in.
    expect(route).not.toMatch(/setInterval|backoff|back-off/i);
    expect(outage).not.toMatch(/by itself/);
  });
  it('[NX-36-S3] Try again is the primary, the local start is quiet and only where offered; no error code or count', () => {
    expect(outage).toMatch(/primary=\{\{ label: t\.retry/);
    expect(outage).toMatch(/quiet=\{localStartOffered \?/);
    expect(outage).toMatch(/kind="error"/);
    expect(outage).not.toMatch(/attempt|retries/i);
    expect(authCopy.outage.backOnline).toBe('You are back online.');
    // Said by the route, on a real reconnect only (test/use-first-run-route.test.ts), not by the screen on every change of step.
    expect(route).toMatch(/announce\(authCopy\.outage\.backOnline\)/);
    expect(onboarding).not.toMatch(/outage\.backOnline/);
  });
  it('[NX-36-S3] on arrival the heading takes focus and the title is announced, for VoiceOver (StateScreen\'s live region is Android-only)', () => {
    expect(outage).toMatch(/useArrival\(block, title, variant\)/);
    expect(outage).toMatch(/<View ref=\{block\} collapsable=\{false\}/);
    expect(src('lib', 'first-run', 'use-arrival.ts')).toMatch(/useFocusOnMount\(focusTarget, true, key\)/);
    expect(src('lib', 'a11y.ts')).toMatch(/Android: no-op/);
  });
  it('[NX-31-R19] the connection returning, or Try again, sets the failure aside; a new failure counts again', () => {
    const a: AuthState = { status: 'signedOut', error: 'network' };
    const b: AuthState = { status: 'signedOut', error: 'network' };
    expect(failureStillCounts(a, null)).toBe(true);
    expect(failureStillCounts(a, a)).toBe(false);
    expect(failureStillCounts(b, a)).toBe(true);
    expect(route).toMatch(/if \(online && !wasOnline\.current\) \{\n\s+setSetAside\(stateRef\.current\);/);
  });
  it('[NX-31-R18] the local start, once chosen, leaves the outage screen for the existing first run', () => {
    const inputs = { ...gateInputsFromAuth({ serverFeatures: true, authState: failed, hasLocalBook: false, localStartChosen: true }), localStartFallback: true };
    expect(firstRunGate(inputs).step).toBe('childStep');
    expect(onboarding).toMatch(/<FirstRunSteps localStartChosen=\{route\.localStartChosen\} onPastWelcome=\{route\.markPastWelcome\} \/>/);
  });
  it('[NX-31-R19] the outage screen is a StateScreen from the standard components, not hand-drawn', () => {
    expect(outage).toMatch(/import \{ StateScreen \} from '@\/components\/ui\/state-screen'/);
  });
});

describe('[NX-31-R19] the connectivity source', () => {
  it('[NX-31-R19] unknown counts as online; only a clear no is offline', () => {
    expect(isOnline(null)).toBe(true);
    expect(isOnline({})).toBe(true);
    expect(isOnline({ isConnected: true, isInternetReachable: undefined })).toBe(true);
    expect(isOnline({ isConnected: false })).toBe(false);
    expect(isOnline({ isConnected: true, isInternetReachable: false })).toBe(false);
  });
  it('[NX-31-R19] gateInputsFromAuth takes the source, and defaults to online when none is passed', () => {
    expect(gateInputsFromAuth({ serverFeatures: true, authState: out, hasLocalBook: false }).online).toBe(true);
    expect(gateInputsFromAuth({ serverFeatures: true, authState: out, hasLocalBook: false, online: false }).online).toBe(false);
  });
  it('[NX-31-R19] expo-network is the source, it starts online and awaits nothing at launch, and the dependency was already there', () => {
    expect(online).toMatch(/from 'expo-network'/);
    expect(online).toMatch(/useState\(true\)/);
    const pkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8')) as { dependencies: Record<string, string> };
    expect(pkg.dependencies['expo-network']).toBe('~57.0.2');
    expect(pkg.dependencies.expo).toMatch(/^~57\./);
  });
});

describe('[NX-31-R17] "I was invited" in the first-run Welcome', () => {
  // The build rule is develop's (CTO ruling B12-5, S1-178): servers on AND an alpha build. The Welcome passes the raw switch.
  it('[NX-31-R17] shown in a servers-on alpha build, hidden in a servers-on store build, hidden with servers off', () => {
    expect(invitedDoorShown({ alpha: true, coParent: true })).toBe(true);
    expect(invitedDoorShown({ alpha: false, coParent: true })).toBe(false);
    expect(invitedDoorShown({ alpha: true, coParent: false })).toBe(false);
    expect(invitedDoorShown({ alpha: false, coParent: false })).toBe(false);
  });
  it('[NX-31-R17] for every build profile it agrees with the old Welcome\'s rule, visibleCoParentDoors', () => {
    for (const env of ['production', 'preview', 'development'] as const) {
      for (const coParent of [true, false]) {
        const alpha = isAlphaBuild(env);
        expect(invitedDoorShown({ alpha, coParent }), `${env} servers:${coParent}`).toBe(visibleCoParentDoors(coParent, alpha).joinButton);
      }
    }
    expect(isAlphaBuild('production')).toBe(false);
    expect(invitedDoorShown({ alpha: isAlphaBuild('production'), coParent: true })).toBe(false);
    expect(invitedDoorShown({ alpha: isAlphaBuild('preview'), coParent: true })).toBe(true);
  });
  it('[NX-31-R17] the screen passes the raw switch, not an answer the rule already gave (that applied it twice and made the door follow nothing)', () => {
    expect(welcome).toMatch(/invitedDoorShown\(\{ alpha: PLUS_ALPHA, coParent: capabilities\.coParent \}\)/);
    expect(welcome).not.toMatch(/visibleCoParentDoors/);
    expect(src('lib', 'first-run', 'welcome.logic.ts')).toMatch(/return visibleCoParentDoors\(input\.coParent, input\.alpha\)\.joinButton;/);
  });
});

describe('[NX-31-R17] first run keeps the person where they are once past the welcome step', () => {
  it('[NX-31-R17] firstRunScreen: the Welcome and the outage screen are for a person who has not got past their welcome step', () => {
    const base = { outage: null, restoring: false, pastWelcome: false } as const;
    expect(firstRunScreen({ ...base, step: 'signIn' })).toBe('welcome');
    expect(firstRunScreen({ ...base, step: 'signIn', restoring: true })).toBe('blank');
    // A signed-in person offline at launch: the session is still being read, so no screen that says sign in is needed.
    expect(firstRunScreen({ ...base, step: 'outage', outage: 'offline', restoring: true })).toBe('blank');
    expect(firstRunScreen({ ...base, step: 'outage', outage: 'outage' })).toBe('outage');
    expect(firstRunScreen({ ...base, step: 'outage', outage: 'offline' })).toBe('outage');
    for (const step of ['unchanged', 'childStep', 'openTonight', 'ageGate', 'stop'] as const) expect(firstRunScreen({ ...base, step })).toBe('steps');
  });
  it('[NX-31-R17] firstRunScreen: past the welcome step it is always the steps, whatever the session, the failure or the connection does', () => {
    for (const step of ['signIn', 'outage', 'childStep', 'openTonight', 'unchanged'] as const) {
      for (const restoring of [true, false]) {
        for (const outage of [null, 'outage', 'offline'] as const) {
          expect(firstRunScreen({ step, outage, restoring, pastWelcome: true }), `${step} ${restoring} ${outage}`).toBe('steps');
        }
      }
    }
  });
  it('[NX-31-R17] the steps report that they are past their welcome step, and the route is told', () => {
    expect(onboarding).toMatch(/if \(step !== 'welcome'\) onPastWelcome\?\.\(\);/);
    expect(onboarding).toMatch(/onPastWelcome=\{route\.markPastWelcome\}/);
  });
});

describe('[NX-36-S2] the servers-off store build is unchanged', () => {
  it('[NX-31-R17] with the switch off the gate answers "unchanged" in every auth state, so the route renders FirstRun as before', () => {
    const states: AuthState[] = [{ status: 'restoring' }, out, { status: 'signedOut', error: 'network' }, { status: 'ready', userId: 'u', sync: 'on' }];
    for (const authState of states) {
      for (const hasLocalBook of [false, true]) {
        expect(firstRunGate(gateInputsFromAuth({ serverFeatures: false, authState, hasLocalBook, online: false })).step).toBe('unchanged');
      }
    }
    expect(onboarding).toMatch(/return <FirstRunSteps localStartChosen=\{route\.localStartChosen\} onPastWelcome=\{route\.markPastWelcome\} \/>;/);
  });
  it('[NX-31-R17] the screens that ship unchanged are still wired as they were', () => {
    for (const k of ['startButton', 'signInButton'] as const) expect(onboarding).toContain(`o.welcome.${k}`);
    expect(onboarding).toMatch(/capabilities\.signIn \? \(/);
    expect(onboarding).toMatch(/router\.push\(\{ pathname: '\/sign-in', params: \{ trigger: 'sign_in' \} \}\)/);
    expect(onboarding).toMatch(/const ORDER: Step\[\] = \['welcome', 'promise', 'child', 'signsAs', 'finish'\];/);
  });
  it('[NX-31-R17] the gate only applies when the build has sign-in settings; a build with none stays fully local', () => {
    expect(route).toMatch(/const active = serverFeaturesEnabled\(\) && auth\.configured;/);
    expect(route).toMatch(/serverFeatures: active,/); // behaviour: test/use-first-run-route.test.ts
  });
});
