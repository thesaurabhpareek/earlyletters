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
  });

  it('the kill path shows only its line, with no way in', () => {
    const kill = between(sheet, '!auth.configured ?', ') : (');
    expect(kill).toContain('<ErrorLine message={s.notConfigured} />');
    expect(kill).not.toMatch(/Button/);
  });

  it('a provider tap disables the others and keeps a sign-out still closing from racing a new sign-in', () => {
    expect(sheet).toMatch(/const blocked = busy !== null \|\| auth\.state\.status === 'signingOut'/);
    expect(sheet.match(/disabled=\{blocked\}/g)!.length).toBeGreaterThanOrEqual(4);
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

  it('"Keep on this phone" is the same size and width as "Agree and sync" (a no as easy as a yes, LEGAL-REQ-006)', () => {
    const agree = /<Button size="lg" fullWidth loading=\{busy\?\.accepted === true\}[^>]*label=\{sc\.agreeButton\}/;
    const decline = /<Button size="lg" fullWidth variant="outline" loading=\{busy\?\.accepted === false\}[^>]*label=\{sc\.declineButton\}/;
    expect(sensitive).toMatch(agree);
    expect(sensitive).toMatch(decline);
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

describe('[S56] Account', () => {
  it('sign out is not styled as destructive, on the row or in its confirm', () => {
    const signOut = between(account, 'const signOut = () => {', '};');
    expect(signOut).not.toMatch(/destructive/);
    expect(account).toMatch(/<ListRow title=\{a\.signOut\} onPress=\{signOut\}/);
    expect(between(account, '<ListRow title={a.signOut}', '/>')).not.toMatch(/variant/);
  });

  it('while the outbox drains, the Sign out row says so with a small spinner, and VoiceOver hears it once', () => {
    expect(account).toMatch(/const waitingToSignOut = s\.status === 'signingOut' && s\.waitingForUploads/);
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

  it('signed in: the way in with its mark, headline and the address in footnote', () => {
    expect(account).toMatch(/<ProviderMark provider=\{provider\} size=\{28\} \/>/);
    expect(account).toMatch(/variant="headline" asHeading>\s*\{a\.signedInWith\[provider\]\}/);
    expect(account).toMatch(/variant="footnote" tone="muted" selectable>\s*\{auth\.account\.email\}/);
  });
});
