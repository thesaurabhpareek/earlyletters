/**
 * Sign-in and Account screens (EXPERIENCE_PASS_2026-10 chapter 7, S52 to S56, package P8a). Source tests: the screens are
 * React Native, and Node tests do not render them (the web build in e2e-web/j22-sign-in.flow.ts and a phone do). The
 * logic these screens show is S01's and is tested there (test/auth-machine.test.ts: nothing syncs before the last consent
 * step, a declined sensitive-data consent stays signed in with sync off, sign-out waits for queued letters).
 *
 * What is pinned here is what the screens themselves decide: which words each step shows (and only those), the age
 * step's neutrality, a decline as easy as an accept, "Not now" changing nothing, sign-out not styled as destructive,
 * no shake or red for a wrong code, steps that cross-fade, and nothing personal in analytics.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = join(__dirname, '..', 'src');
/** Source without comments, so a rule is checked against code, not against what a comment says. */
const code = (t: string) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
const read = (...p: string[]) => code(readFileSync(join(SRC, ...p), 'utf8'));
const between = (src: string, from: string, to: string) => {
  const a = src.indexOf(from);
  const b = src.indexOf(to, a + from.length);
  expect(a, from).toBeGreaterThanOrEqual(0);
  expect(b, to).toBeGreaterThan(a);
  return src.slice(a, b);
};

const layout = read('app', '(auth)', '_layout.tsx');
const sheet = read('app', '(auth)', 'sign-in', 'index.tsx');
const email = read('app', '(auth)', 'sign-in', 'email.tsx');
const codeStep = read('app', '(auth)', 'sign-in', 'code.tsx');
const verify = read('app', '(auth)', 'sign-in', 'verify.tsx');
const consent = read('app', '(auth)', 'sign-in', 'consent.tsx');
const account = read('app', 'settings', 'account.tsx');
const ui = read('lib', 'auth', 'ui.tsx');
const SCREENS = { sheet, email, codeStep, verify, consent, account, ui };

describe('[P8a] every word comes from packages/content', () => {
  it('no screen types a user-facing word between JSX tags', () => {
    for (const [name, src] of Object.entries(SCREENS)) {
      // Text after a tag's `>` (not an arrow's `=>`) and before the next tag.
      const typed = [...src.matchAll(/(?<![=-])>\s*([A-Za-z][A-Za-z ,.'?!]{2,})\s*<\/?[A-Za-z]/g)].map((m) => m[1].trim());
      expect(typed, name).toEqual([]);
    }
  });

  it('analytics carry only the entry point: never an address, a name or a code', () => {
    for (const [name, src] of Object.entries(SCREENS)) {
      for (const m of src.matchAll(/track\(([^)]*)\)/g)) expect(m[1], name).toMatch(/^'auth_(?:sheet_shown|deferred)', \{ trigger \}$/);
    }
  });
});

describe('[S52] the sign-in sheet', () => {
  it('shows one title, one body, the providers, the registered privacy line and Not now', () => {
    expect(sheet.match(/<SheetTitle>/g)).toHaveLength(1);
    expect(sheet.match(/<SheetBody\b/g)).toHaveLength(1);
    expect(sheet).toMatch(/<PrivacyLine text=\{s\.privacy\} \/>/);
    expect(sheet).toMatch(/label=\{s\.later\}/);
    for (const p of ['<AppleButton', 'kind="google"', 'kind="email"']) expect(sheet).toContain(p);
  });

  it('"Not now" only notes the deferral and closes: it changes nothing on this phone', () => {
    const notNow = between(sheet, 'label={s.later}', '/>');
    expect(notNow).toMatch(/onPress=\{\(\) => \{\s*track\('auth_deferred', \{ trigger \}\);\s*close\(\);\s*\}\}/);
    // track() stores and sends nothing before analytics consent (packages/analytics client; off in v1.0, D-088,
    // test/analytics-off-v1.test.ts), and close() is navigation. The sheet reaches no local store at all.
    expect(sheet).not.toMatch(/from '@\/lib\/(?:store|db)|setSetting|secureStorage/);
    // close() is useCloseSheet (lib/auth/ui.tsx): it may only navigate. Every call in its body is a navigation call,
    // so a write added there (a setting, the Keychain, the store) fails here.
    const closeSheet = between(ui, 'export function useCloseSheet', 'export function SheetFrame');
    const calls = [...closeSheet.matchAll(/([A-Za-z_$][\w$]*)\s*\(/g)].map((m) => m[1]);
    const NAVIGATION = new Set(['useCloseSheet', 'useNavigation', 'useCallback', 'getParent', 'canGoBack', 'goBack', 'back', 'replace', 'if']);
    expect(calls.filter((c) => !NAVIGATION.has(c))).toEqual([]);
    expect(calls).toEqual(expect.arrayContaining(['getParent', 'goBack']));
    expect(ui).not.toMatch(/from '@\/lib\/(?:store|db)'|from '\.\.\/store'|secure-storage|setSetting/);
  });

  it('the kill path shows only its line, with no way in', () => {
    const kill = between(sheet, '!auth.configured ?', ') : (');
    expect(kill).toContain('<ErrorLine message={s.notConfigured} />');
    expect(kill).not.toMatch(/Button/);
  });

  it('a provider tap disables the others and keeps a sign-out still closing from racing a new sign-in', () => {
    expect(sheet).toMatch(/const blocked = busy !== null \|\| auth\.state\.status === 'signingOut'/);
    expect(sheet.match(/disabled=\{blocked\}/g)!.length).toBeGreaterThanOrEqual(4);
    // A second tap in the same frame starts nothing: the guard is a ref, set before the first await.
    expect(between(sheet, 'const run = async', 'router.replace')).toMatch(/if \(inFlight\.current\) return;\s*inFlight\.current = true;/);
    expect(between(sheet, 'const run = async', 'router.replace')).toMatch(/finally \{\s*inFlight\.current = false;/);
  });

  it('Not now waits while a sign-in runs (a cancelled Apple sheet would otherwise land on a closed sheet)', () => {
    expect(between(sheet, 'label={s.later}', '/>')).toMatch(/disabled=\{busy !== null\}/);
  });

  it('the cover sits beside the title only for a sheet about this book, and is not read twice', () => {
    expect(sheet).toMatch(/const ABOUT_THIS_BOOK: readonly SignInTrigger\[\] = \['first_letter', 'settings', 'invite_create'\]/);
    expect(sheet).toMatch(/<BookCover name=\{cover\} size="sm" animate=\{false\} \/>/);
    expect(sheet).not.toMatch(/<BookCover[^>]*accessibilityLabel/);
  });

  it('adds no haptic of its own for an account (MOTION 6)', () => {
    expect(sheet).not.toMatch(/haptic\(/);
  });
});

describe('[S52] [5.8 row 10] the sheet frame and its steps', () => {
  it('code, the opened link and account setup cross-fade in place over fadeMs; email pushes', () => {
    expect(layout).toMatch(/const STEP = \{ animation: 'fade', animationDuration: tokens\.motion\.fadeMs \}/);
    for (const step of ['code', 'verify', 'consent']) expect(layout).toContain(`<Stack.Screen name="sign-in/${step}" options={STEP} />`);
    expect(layout).toContain('<Stack.Screen name="sign-in/email" />');
    expect(consent).toMatch(/FadeIn\.duration\(tokens\.motion\.fadeMs\)/);
  });

  it('the title is title2 and takes VoiceOver focus; the body is body; trust copy is never below subhead', () => {
    expect(between(ui, 'export function SheetTitle', 'export function SheetBody')).toMatch(/useFocusOnMount\(ref[\s\S]*variant="title2" asHeading/);
    expect(between(ui, 'export function SheetBody', 'export function ErrorLine')).toContain('variant="body"');
    expect(between(ui, 'export function ErrorLine', 'export function Busy')).toContain('variant="subhead"');
    expect(between(ui, 'export function PrivacyLine', 'export function AppleButton')).toMatch(/LockSimpleIcon size=\{16\}[\s\S]*variant="subhead" tone="muted"/);
  });

  it('an error is words and a caution icon, announced politely, faded in; never a shake, never red text', () => {
    const line = between(ui, 'export function ErrorLine', 'export function Busy');
    expect(line).toMatch(/announce\(message\)/);
    expect(line).toMatch(/accessibilityLiveRegion="polite"/);
    expect(line).toMatch(/WarningCircleIcon size=\{20\} color=\{c\.caution\}/);
    expect(line).toMatch(/entering=\{LINE_IN\}/);
    expect(ui).toMatch(/const LINE_IN = FadeIn\.duration\(tokens\.motion\.swapMs\)/);
    expect(line).not.toMatch(/tone="(?:caution|destructive)"|translateX|withSequence|haptic/);
  });

  it('a busy provider button says busy to VoiceOver through Button\'s own loading, and is not "dimmed"', () => {
    const provider = between(ui, 'export function ProviderButton', 'export function QuietButton');
    expect(provider).toMatch(/disabled=\{busy \? false : disabled\}/);
    expect(provider).toMatch(/loading=\{busy\}/);
    expect(provider).not.toMatch(/accessibilityState=/);
  });

  it('the error line is never red and never moves: no red class or colour, no Vibration, no shake', () => {
    const line = between(ui, 'export function ErrorLine', 'export function Busy');
    expect(line).not.toMatch(/destructive|recording|c\.destructive|c\.recording|text-red|bg-red/);
    for (const [name, src] of Object.entries({ ui, codeStep, email, consent })) expect(src, name).not.toMatch(/Vibration|translateX|withSequence|withRepeat/);
  });

  it('provider buttons are all 56 pt, so no way in looks smaller (A-REQ-016)', () => {
    expect(ui).toMatch(/button: tokens\.target\.primary/);
    expect(between(ui, 'export function AppleButton', 'function GoogleMark')).toMatch(/height: SHEET\.button/);
    expect(between(ui, 'export function ProviderButton', 'export function QuietButton')).toMatch(/size="lg"[\s\S]*minHeight: SHEET\.button/);
  });

  it('at accessibility sizes the foot scrolls with the content instead of covering it', () => {
    const frame = between(ui, 'export function SheetFrame', 'export function SheetTitle');
    expect(frame).toMatch(/const inlineFooter = useIsAccessibilitySize\(\)/);
    expect(frame).toMatch(/\{inlineFooter \? foot : null\}\s*<\/ScrollView>\s*\{inlineFooter \? null : foot\}/);
  });

  it('quiet buttons are the shared 44 pt quiet Button', () => {
    expect(between(ui, 'export function QuietButton', 'export function LinkText')).toMatch(/<Button variant="quiet" size="sm"/);
  });
});

describe('[S53] Continue with email', () => {
  it('offers AutoFill: the email keyboard, textContentType and autoComplete, focused on arrival', () => {
    for (const p of ['keyboardType="email-address"', 'textContentType="emailAddress"', 'autoComplete="email"', 'autoFocus']) expect(email).toContain(p);
  });

  it('says the address looks wrong only on submit, and clears it as soon as the person types', () => {
    expect(email.match(/setError\('invalid_email'\)/g)).toHaveLength(1);
    expect(between(email, 'const send = async', 'setBusy(true)')).toContain("setError('invalid_email')");
    expect(email).toMatch(/onChangeText=\{\(v\) => \{\s*setEmail\(v\);\s*if \(error\) setError\(null\);/);
  });

  it('sends one email per tap: busy and a synchronous ref guard, released in finally', () => {
    const send = between(email, 'const send = async', 'if (r.ok)');
    expect(send).toMatch(/if \(busy \|\| inFlight\.current\) return;/);
    expect(send).toMatch(/inFlight\.current = true;[\s\S]*finally \{\s*inFlight\.current = false;/);
    expect(email).toMatch(/loading=\{busy\}/);
  });

  it('"Send link" is outlined until the text looks like an address', () => {
    expect(email).toMatch(/variant=\{ready \? 'primary' : 'outline'\}/);
    expect(email).toMatch(/const ready = looksLikeEmail\(value\)/);
  });
});

describe('[S54] Check your email', () => {
  it('puts the address the email went to on screen', () => {
    expect(codeStep).toMatch(/authCopy\.code\.sentToEmail\.split\('\{email\}'\)/);
    expect(codeStep).toMatch(/<SentTo email=\{known\} \/>/);
    expect(codeStep).not.toMatch(/k\.sentTo\b/);
  });

  it('submits a full-length code with no tap, and keeps Continue for VoiceOver and Switch Control', () => {
    expect(codeStep).toMatch(/if \(digits\.length === EMAIL_CODE_LENGTH && digits !== submitted\.current\) void verify\(digits\)/);
    expect(codeStep).toMatch(/textContentType="oneTimeCode"/);
    expect(codeStep).toMatch(/fontVariant: \['tabular-nums'\]/);
    expect(between(codeStep, 'footer={', '}>')).toMatch(/label=\{busy \? authCopy\.sheet\.busy : k\.verify\}/);
  });

  it('asks once per code: a ref guard covers the auto-submit and Continue in the same frame; Continue holds the busy state', () => {
    const verifyFn = between(codeStep, 'const verify = async', 'if (r.ok)');
    expect(verifyFn).toMatch(/if \(busy \|\| inFlight\.current \|\|/);
    expect(verifyFn).toMatch(/inFlight\.current = true;[\s\S]*finally \{\s*inFlight\.current = false;/);
    expect(between(codeStep, 'const resend = async', 'if (r.ok)')).toMatch(/if \(inFlight\.current\) return;/);
    expect(between(codeStep, 'footer={', '}>')).toMatch(/loading=\{busy\}/);
  });

  it('a wrong code clears and refocuses the field; it never shakes, flashes red or buzzes', () => {
    const fail = between(codeStep, "} else if (r.error !== 'cancelled') {", '};');
    expect(fail).toMatch(/setCode\(''\)/);
    expect(fail).toMatch(/field\.current\?\.focus\(\)/);
    expect(codeStep).not.toMatch(/haptic|translateX|withSequence|withRepeat|destructive|c\.recording|c\.caution/);
  });

  it('"Trouble signing in?" opens its help line in place', () => {
    expect(codeStep).toMatch(/label=\{copy\.auth\.troubleButton\} onPress=\{\(\) => setHelpOpen\(\(v\) => !v\)\}/);
    expect(codeStep).toMatch(/\{copy\.auth\.noEmailHelp\}/);
  });

  it('[P8a critics S1, lens A2] the pause is read from the wrong-code list, says the ways in that still work, and keeps a new email', () => {
    // S01's rule, read from the same in-memory list at each render, never from the error state, so it shows from the
    // fifth wrong code and holds whatever the error line says.
    expect(codeStep).toMatch(/const pause = codeEntryPause\(wrongCodeTimes\(address\), Date\.now\(\)\);\s*const paused = pause\.paused;/);
    expect(codeStep.match(/\bpaused =/g), 'one place decides the pause').toHaveLength(1);
    // That read is Date.now() at each render, so the React Compiler must leave the component as written.
    expect(codeStep).toMatch(/export default function CodeStep\(\) \{\s*'use no memo';/);
    // One line in one live region: the pause, then the ways in that still work (VoiceOver hears both).
    expect(codeStep).toMatch(/const message = paused \? `\$\{authErrorMessage\('code_paused'\)\} \$\{k\.pausedOtherWays\}` : authErrorMessage\(error\);/);
    expect(codeStep.match(/<ErrorLine /g), 'one error line').toHaveLength(1);
    expect(codeStep).not.toMatch(/k\.pausedOtherWay\b/);
    // "Send a new email" stays offered while paused (its link signs in, F02-U14), with its own minute's wait, and the send
    // neither reads nor touches the pause.
    // On a line of its own: a child of the button group, not inside any condition.
    expect(codeStep).toMatch(/^\s*<QuietButton label=\{k\.resend\} onPress=\{\(\) => void resend\(\)\} disabled=\{busy \|\| !canResend\} \/>$/m);
    expect(codeStep).toMatch(/\{!canResend && \(\s*<Text variant="footnote" tone="muted" className="text-center">\s*\{k\.resendWait\}/);
    expect(between(codeStep, 'const resend = async', 'const message')).not.toMatch(/paused|pause\.|WrongCode/);
    // "A new email is on its way." shows while paused too: the new email's link works then.
    expect(codeStep).toMatch(/\{note && \(!message \|\| paused\) \? \(/);
    // While paused, typing waits and Continue cannot ask.
    expect(codeStep).toMatch(/editable=\{!busy && !paused\}/);
    expect(between(codeStep, 'footer={', '}>')).toMatch(/disabled=\{code\.length !== EMAIL_CODE_LENGTH \|\| !looksLikeEmail\(address\) \|\| paused\}/);
    // The screen neither adds to the list nor clears it.
    expect(codeStep).not.toMatch(/clearWrongCodes|noteWrongCode/);
  });

  it('[P8a lens B1] the pause lifts on its own: one render at its end, re-armed if it fires early, and the stale line goes', () => {
    expect(codeStep).toMatch(
      /useEffect\(\(\) => \{\s*if \(pause\.until === null\) return;\s*const t = setTimeout\(\(\) => setNow\(Date\.now\(\)\), Math\.max\(0, pause\.until - Date\.now\(\)\) \+ 50\);\s*return \(\) => clearTimeout\(t\);\s*\}, \[pause\.until, now\]\);/,
    );
    expect(codeStep).toMatch(/useEffect\(\(\) => \{\s*if \(!paused && error === 'code_paused'\) setError\(null\);\s*\}, \[paused, error\]\);/);
  });

  it('[P8a lens B2] S01\'s side: only a wrong code adds to the list and only a code sign-in clears it, per address; a link never reads it', () => {
    const provider = read('lib', 'auth', 'session-provider.tsx');
    const pending = read('lib', 'auth', 'pending.ts');
    expect(between(provider, 'async sendEmailLink(email)', 'async verifyEmailCode(')).not.toMatch(/WrongCode|codeEntryPause/);
    const byCode = between(provider, 'async verifyEmailCode(', 'async verifyEmailLink(');
    expect(byCode).toMatch(/const pause = codeEntryPause\(wrongCodeTimes\(email\), Date\.now\(\)\);\s*if \(pause\.paused\) \{/);
    expect(byCode).toMatch(/const userId = await verifyCode\(sb, email, code\);\s*clearWrongCodes\(email\);/);
    expect(byCode).toMatch(/if \(error === 'wrong_code'\) noteWrongCode\(email, Date\.now\(\)\);/);
    expect(provider.match(/clearWrongCodes\(/g), 'cleared only by a code sign-in').toHaveLength(1);
    // F02-U14: the link in an email never reads the pause, which is why the code step can point at it.
    expect(between(provider, 'async verifyEmailLink(', 'async recordConsent(')).not.toMatch(/codeEntryPause|wrongCodeTimes|code_paused/);
    // One list per address, trimmed and lower-cased: the same address typed again meets the same pause.
    expect(pending).toMatch(/return wrongCodes\.get\(email\.trim\(\)\.toLowerCase\(\)\) \?\? \[\];/);
    expect(pending).toMatch(/const k = email\.trim\(\)\.toLowerCase\(\);\s*wrongCodes\.set\(k, /);
    // No screen, the email step included, adds to the list or clears it.
    for (const [name, src] of Object.entries(SCREENS)) expect(src, name).not.toMatch(/clearWrongCodes|noteWrongCode/);
  });

  it('[P8a critics S2, lens A1 and A3] Not now sits top right, in reach with the number pad up; the safe line only with a book here', () => {
    // Not now is the frame's header button (outside the scroll, above the keyboard), held while a code is being asked,
    // and closes the sheet with S52's rule: nothing else, so the wrong-code list stays as it was.
    expect(codeStep).toMatch(/<SheetFrame\s+closeLabel=\{authCopy\.sheet\.later\}\s+closeDisabled=\{busy\}\s+footer=\{/);
    expect(codeStep).not.toMatch(/label=\{authCopy\.sheet\.later\}|useCloseSheet/);
    const frame = between(ui, 'export function SheetFrame(', 'export function');
    expect(frame).toMatch(/\{closeLabel \? \(\s*<ModalHeader onClose=\{close\} closeLabel=\{closeLabel\} closeDisabled=\{closeDisabled\}/);
    expect(frame.indexOf('<ModalHeader'), 'the header is outside the keyboard-avoiding scroll').toBeLessThan(frame.indexOf('<KeyboardAvoidingView'));
    // "Your letters are safe on this phone." only while waiting, and only when this phone holds a book (the sheet's own
    // has-a-book signal): a fresh install has no letters here.
    expect(codeStep).toMatch(/const \{ active \} = useChildren\(\);/);
    expect(codeStep).toMatch(/\{message \? \(\s*<ErrorLine message=\{message\} \/>\s*\) : active \? \(\s*<Text variant="subhead" tone="muted">\s*\{k\.lettersSafe\}\s*<\/Text>\s*\) : null\}/);
  });

  it('opening the link shows "Signing you in" with the small spinner and nothing read twice', () => {
    expect(verify).toMatch(/<SheetTitle>\{refused \? v\.refusedTitle : v\.title\}<\/SheetTitle>/);
    expect(verify).toMatch(/accessibilityElementsHidden[^>]*>\s*<ActivityIndicator/);
  });
});

describe('[S55] before your book syncs', () => {
  const terms = between(consent, 'function TermsStep', 'function AgeStep');
  const age = between(consent, 'function AgeStep', 'function SensitiveStep');
  const sensitive = between(consent, 'function SensitiveStep', 'const styles');

  it('the age step shows only the question, Yes, No and Continue, with nothing preselected (LEGAL-REQ-002)', () => {
    expect(age).toMatch(/useState<boolean \| null>\(null\)/);
    expect(age).toMatch(/<SheetTitle>\{a\.body\}<\/SheetTitle>/);
    expect(age).toMatch(/<AgeAnswers adult=\{adult\} onChoose=\{setAdult\} label=\{a\.body\} yes=\{a\.yes\} no=\{a\.no\} \/>/);
    expect(age).toMatch(/label=\{copy\.common\.continueButton\}/);
    expect(age).toMatch(/disabled=\{adult === null\}/);
    // Nothing else: no body line, no help, no Not now, no link.
    expect(age).not.toMatch(/<SheetBody|<Text\b|QuietButton|ListRow|a\.help|a\.title/);
    expect(consent).toMatch(/import \{ AgeAnswers \} from '@\/components\/gate\/age-gate-screen'/);
  });

  it('"Keep on this phone" is the same size and width as "Agree and sync" at every text size (a no as easy as a yes, LEGAL-REQ-006)', () => {
    const agree = between(sensitive, '<Button', 'label={sc.agreeButton}');
    const decline = between(sensitive, 'label={sc.agreeButton}', 'label={sc.declineButton}');
    for (const b of [agree, decline]) {
      expect(b).toMatch(/size="lg"\s+fullWidth/);
      // One shared minHeight: if one answer wraps at an accessibility size, the other grows with it.
      expect(b).toMatch(/style=\{pair\}/);
      expect(b).toMatch(/onLayout=\{\(e\) => measure\(e\.nativeEvent\.layout\.height\)\}/);
    }
    expect(sensitive).toMatch(/const pair = \{ minHeight: tallest \}/);
    expect(sensitive).toMatch(/<SensitiveAnswers key=\{scale\}/);
    // While one answer is recorded, the other waits.
    expect(agree).toMatch(/disabled=\{busy\?\.accepted === false\}/);
    expect(decline).toMatch(/disabled=\{busy\?\.accepted === true\}/);
  });

  it('records one answer per tap: Agree then Keep in the same frame records nothing twice', () => {
    for (const fn of ['const answer: Answer = async', 'const answerTurnOn: Answer = async']) {
      const body = between(consent, fn, '};');
      expect(body, fn).toMatch(/if \(inFlight\.current\) return;/);
    }
    expect(between(consent, 'const answer: Answer = async', '};')).toMatch(/inFlight\.current = true;[\s\S]*finally \{\s*inFlight\.current = false;/);
    expect(terms).toMatch(/loading=\{busy\}\s+label=\{t\.agree\}/);
  });

  it('"Keep on this phone" from Agree and sync sets the guard before it closes: Keep then Agree in one frame records no accept', () => {
    const turnOn = between(consent, 'const answerTurnOn: Answer = async', '  };');
    const keep = between(turnOn, 'if (!accepted) {', 'return;');
    expect(keep).toMatch(/inFlight\.current = true;\s*close\(\);/);
    // The accept path is after the Keep branch and behind the same guard.
    expect(turnOn.indexOf('if (inFlight.current) return;')).toBeLessThan(turnOn.indexOf('if (!accepted) {'));
    expect(turnOn.indexOf('if (!accepted) {')).toBeLessThan(turnOn.indexOf('await auth.turnOnSync()'));
  });

  it('Agree from "Agree and sync" sets the guard before its await and releases it in finally, so a failed Agree can be tried again', () => {
    const turnOn = between(consent, 'const answerTurnOn: Answer = async', '  };');
    expect(turnOn).toMatch(/inFlight\.current = true;\s*setBusy[\s\S]*await auth\.turnOnSync\(\)[\s\S]*finally \{\s*inFlight\.current = false;/);
  });

  it('"Agree and sync" after a decline shows the sensitive-data step with its words, then records (LEGAL-REQ-006)', () => {
    expect(consent).toMatch(/const turningOn = params\.step === 'sensitive' && s\.status === 'ready' && s\.sync === 'off'/);
    expect(between(consent, 'if (turningOn) {', 'if (s.status !== \'needsConsent\')')).toMatch(/<SensitiveStep child=\{child\} busy=\{busy\} error=\{turnOnError\} answer=\{answerTurnOn\} \/>/);
    const turnOn = between(consent, 'const answerTurnOn: Answer = async', '  };');
    expect(turnOn).toMatch(/if \(!accepted\) \{\s*inFlight\.current = true;\s*close\(\);\s*return;\s*\}/);
    expect(turnOn).toMatch(/await auth\.turnOnSync\(\)/);
    // Account and the invite sheets send the person here; neither records consent itself.
    for (const [name, src] of Object.entries({ account, gate: between(ui, 'export function AccountGate', '\n}\n') })) {
      expect(src, name).not.toMatch(/turnOnSync/);
      expect(src, name).toMatch(/router\.push\(\{ pathname: '\/sign-in\/consent', params: \{ step: 'sensitive' \} \}\)/);
    }
  });

  it('a step that replaces another fades once; the first step takes only the route\'s fade', () => {
    expect(between(consent, 'function StepFade', 'type Answer')).toMatch(/entering=\{changed \? STEP_IN : undefined\}/);
  });

  it('shows every registered sentence of each step (no consent sentence dropped)', () => {
    for (const k of ['title', 'body', 'use', 'declineHelp', 'changeLater', 'agreeButton', 'declineButton']) expect(sensitive, k).toContain(`sc.${k}`);
    for (const k of ['title', 'body', 'agreeLine', 'termsLink', 'privacyLink', 'healthLink', 'agree', 'notNow']) expect(terms, k).toContain(`t.${k}`);
  });

  it('the agree line sits right above the button it describes', () => {
    const foot = between(terms, 'footer={', '}>');
    expect(foot.indexOf('{t.agreeLine}')).toBeLessThan(foot.indexOf('label={t.agree}'));
  });

  it('records answers only through the provider: the screen never starts sync itself', () => {
    expect(consent).not.toMatch(/lib\/sync|startSync|syncAllowed/);
    expect(consent).toMatch(/await auth\.recordConsent\(step, accepted\)/);
  });
});

describe('[P8a critics S4] the account gate in the invite, join and leave sheets', () => {
  const gate = between(ui, 'export function AccountGate', '\n}\n');

  it('says why in the sheet\'s own words: inviting, or joining and leaving', () => {
    expect(gate).toMatch(
      /const reason = claiming \? authCopy\.claim\.waiting : trigger === 'invite_create' \? familyCopy\.card\.finishSetup : familyCopy\.errors\.consent_needed;/,
    );
    expect(gate).toMatch(/<SheetBody muted>\{reason\}<\/SheetBody>/);
    // Account's row value stays on Account; the gate never says "Not set up yet".
    expect(gate).not.toMatch(/sync\.waiting/);
    expect(account).toMatch(/trailing=\{a\.sync\[view\.sync\]\}/);
  });

  it('after a decline, nothing above "Agree and sync": counsel\'s decline line is not shown as a status', () => {
    expect(gate).not.toMatch(/declineHelp/);
    const declined = between(gate, 'if (!offline) {', 'return (\n    <View className="gap-4">\n      <SheetBody muted>{authCopy.errors.network}');
    expect(declined).not.toMatch(/<SheetBody|<Text\b/);
    expect(declined).toMatch(/label=\{sc\.agreeButton\}/);
  });
});

describe('[S56] Account', () => {
  it('sign out is not styled as destructive, on the row or in its confirm', () => {
    const signOut = between(account, 'const signOut = () => {', '};');
    expect(signOut).not.toMatch(/destructive/);
    expect(account).toMatch(/<ListRow title=\{a\.signOut\} onPress=\{signOut\}/);
    expect(between(account, '<ListRow title={a.signOut}', '/>')).not.toMatch(/variant/);
  });

  it('while the outbox drains, the Sign out row says so with a small spinner, and VoiceOver hears it once', () => {
    // When it is waiting is account-view.logic.ts (test/account-view.test.ts); the page shows what it says.
    expect(account).toMatch(/const view = accountView\(s, auth\.claimPending\)/);
    expect(account).toMatch(/const waitingToSignOut = view\.signOut === 'waiting'/);
    expect(account).toMatch(/\{waitingToSignOut \? \(/);
    expect(account).toMatch(/<ListRow title=\{a\.signOutWaiting\} leading=\{<ActivityIndicator/);
    expect(account).toMatch(/if \(waitingToSignOut\) announce\(a\.signOutWaiting\)/);
  });

  it("signed out: the cover, the title, S52's body with the child's name, and Sign in", () => {
    const out = between(account, 'if (!auth.signedIn) {', 'const provider');
    expect(out).toMatch(/<BookCover name=\{active\.name\} size="sm"/);
    expect(out).toMatch(/\{a\.signedOutTitle\}/);
    expect(out).toMatch(/fill\(a\.signedOutBody, \{ child: active\?\.name \?\? authCopy\.consent\.childFallback \}\)/);
    expect(out).toMatch(/errors\.session_expired/);
  });

  it('[BL-451] "Stay signed in" sits under the waiting row only when the account view offers it, and only cancels the wait', () => {
    expect(account).toMatch(/\{view\.staySignedIn \? \(\s*<ListRow title=\{a\.staySignedIn\} onPress=\{\(\) => auth\.cancelSignOutWait\(\)\} \/>/);
    // The waiting row and Sign out never show together.
    expect(account).toMatch(/\{waitingToSignOut \? null : <ListRow title=\{a\.signOut\}/);
  });

  it('[BL-451] a wait that ended before the letters were sent is said once on the signed-out page', () => {
    expect(account).toMatch(/if \(waitEndedEarly\(previous\.current, s\)\) setEndedEarly\(true\);/);
    expect(account).toMatch(/previous\.current = s;/);
    const out = between(account, 'if (!auth.signedIn) {', 'const provider');
    expect(out).toMatch(/\{endedEarly \? \(\s*<Text variant="body" testID="account\.signOutEarly">\s*\{a\.signOutEarly\}/);
    expect(account).toMatch(/if \(endedEarly && !auth\.signedIn\) announce\(a\.signOutEarly\)/);
    // Signing in again clears it.
    expect(account).toMatch(/if \(auth\.signedIn && s\.status !== 'signingOut'\) setEndedEarly\(false\);/);
  });

  it('nothing fades in on a visit; only signing out on this page fades to signed out (MOTION principle 2)', () => {
    expect(account.match(/entering=/g)).toHaveLength(1);
    expect(account).toMatch(/entering=\{signedOutHere \? PAGE_IN : undefined\}/);
    expect(account).toMatch(/const signedOutHere = wasSignedIn\.current && !auth\.signedIn/);
  });

  it('signed in: the way in with its mark, headline and the address in footnote', () => {
    expect(account).toMatch(/<ProviderMark provider=\{provider\} size=\{28\} \/>/);
    expect(account).toMatch(/variant="headline" asHeading>\s*\{a\.signedInWith\[provider\]\}/);
    expect(account).toMatch(/variant="footnote" tone="muted" selectable>\s*\{auth\.account\.email\}/);
  });
});
