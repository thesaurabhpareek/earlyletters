/// <reference types="node" />
/**
 * Errors and recovery (EXPERIENCE_PASS S49 to S51, package P6c): the crash and launch-recovery screens
 * (PlainScreen) wear the brand faces from tokens.fontFamily, draw a still page from LINE_ART, use pill
 * buttons, import nothing that can throw before render, and never offer to delete; the 404 is the shared
 * StateScreen with the window drawing and never reads the address. The screens are recorded in
 * apps/mobile/e2e-web (j19, j20).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tokens } from '@scribe/design-tokens';
import { en } from '@scribe/content';
import { describe, expect, it } from 'vitest';
import { LINE_ART, penWidth } from '../src/components/ui/line-art.data';
import { STATE_LAYOUT } from '../src/components/ui/state-screen.logic';
import { PLAIN_ART, PLAIN_LAYOUT, PLAIN_TYPE, plainArt, plainButton } from '../src/components/resilience/plain-screen.styles';

const SRC = join(__dirname, '..', 'src');
const read = (rel: string) => readFileSync(join(SRC, rel), 'utf8');
/** Source without comments, so a doc comment that names a forbidden thing does not count. */
const code = (t: string) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
// Every import form: named, default, namespace, type-only, side-effect, double quotes, across lines (lens B on #355).
const imports = (t: string) => [...t.matchAll(/^import\s+(?:[^;]*?\s+from\s+)?['"]([^'"]+)['"]/gm)].map((m) => m[1]);
const SYSTEM_FACES = /Georgia|Times|Helvetica|San Francisco|-apple-system|'System'/i;

describe('PlainScreen faces (S50, S51)', () => {
  it('the title is Literata Medium and the body, hint and note are Mukta, all from tokens.fontFamily', () => {
    expect(PLAIN_TYPE.title.style.fontFamily).toBe(tokens.fontFamily.serifMedium);
    expect(PLAIN_TYPE.body.style.fontFamily).toBe(tokens.fontFamily.sans);
    expect(PLAIN_TYPE.hint.style.fontFamily).toBe(tokens.fontFamily.sans);
    expect(tokens.fontFamily.serifMedium).toMatch(/^Literata-/);
    expect(tokens.fontFamily.sans).toMatch(/^Mukta-/);
  });

  it('the buttons are Mukta too (Medium, the label face every Button uses)', () => {
    expect(PLAIN_TYPE.button.style.fontFamily).toBe(tokens.fontFamily.sansMedium);
    expect(PLAIN_TYPE.button.style.fontFamily).toBe(tokens.type.label.fontFamily);
    expect(tokens.fontFamily.sansMedium).toMatch(/^Mukta-/);
  });

  it('every face is a bundled face by name with the weight reset, so nothing is synthesised or falls back', () => {
    const faces = Object.values(tokens.fontFamily);
    for (const [name, r] of Object.entries(PLAIN_TYPE)) {
      expect(faces, name).toContain(r.style.fontFamily);
      expect(r.style.fontFamily, name).not.toMatch(SYSTEM_FACES);
      expect(r.style.fontWeight, name).toBe('normal');
      expect(r.style.fontStyle, name).toBe('normal');
    }
  });

  it('the sizes are the shared state ramp: title2 and body, as StateScreen and the 404', () => {
    expect(PLAIN_TYPE.title.style.fontSize).toBe(tokens.type[STATE_LAYOUT.title].fontSize);
    expect(PLAIN_TYPE.body.style.fontSize).toBe(tokens.type[STATE_LAYOUT.body].fontSize);
    expect(PLAIN_TYPE.hint.style.fontSize).toBe(tokens.type.subhead.fontSize);
  });

  it('Dynamic Type: the title keeps its token cap, the body, hint and buttons are uncapped (AX5)', () => {
    expect(PLAIN_TYPE.title.maxScale).toBe(tokens.type.title2.maxScale);
    expect(PLAIN_TYPE.body.maxScale).toBe(0);
    expect(PLAIN_TYPE.hint.maxScale).toBe(0);
    expect(PLAIN_TYPE.button.maxScale).toBe(0);
  });

  it('the screen sets every text style from PLAIN_TYPE and types no face, size or weight of its own', () => {
    const src = code(read('components/resilience/plain-screen.tsx'));
    expect(src).not.toMatch(SYSTEM_FACES);
    expect(src).not.toMatch(/fontFamily:\s*'/);
    expect(src).not.toMatch(/fontWeight|fontSize:\s*\d/);
    const texts = src.match(/<Text\s[^>]*>/g) ?? []; // elements, not the useRef<Text> type
    expect(texts.length).toBeGreaterThanOrEqual(5); // title, body, hint, note, button label
    for (const t of texts) expect(t).toMatch(/PLAIN_TYPE\.\w+\.style|s\.label/);
  });
});

describe('PlainScreen look (S50, S51)', () => {
  it('a still page drawing from LINE_ART, in the scheme colours, with a 1.75 pt pen', () => {
    const art = plainArt();
    expect(PLAIN_ART).toBe('page');
    expect(art.paths).toEqual(LINE_ART.page.strokes.map((s) => s.d));
    expect(art.viewBox).toBe(LINE_ART.page.viewBox.join(' '));
    expect(art.width).toBe(STATE_LAYOUT.artWidth);
    expect(art.strokeWidth).toBeCloseTo(penWidth('page', STATE_LAYOUT.artWidth));
    const src = code(read('components/resilience/plain-screen.tsx'));
    expect(src).toMatch(/from 'react-native-svg'/);
    expect(src).toMatch(/<Path\b/);
    expect(src).toMatch(/<PageDrawing wash=\{c\.accentSoft\} line=\{c\.textMuted\}/);
    // The drawing is the one part allowed to fail: a boundary around it renders nothing instead.
    expect(src).toMatch(/<DrawingBoundary>\s*<PageDrawing/);
    expect(src).toMatch(/static getDerivedStateFromError\(\) \{\s*return \{ failed: true \};/);
    expect(src).toMatch(/return this\.state\.failed \? null : this\.props\.children;/);
  });

  it('the title is a header, and a busy button cannot be pressed twice', () => {
    const src = code(read('components/resilience/plain-screen.tsx'));
    expect(src).toMatch(/<Text ref=\{heading\} accessibilityRole="header"/);
    expect(src).toMatch(/disabled=\{a\.busy\}/);
  });

  it('a note that arrives scrolls into view after layout and is read by VoiceOver, its static words only (lens A on #355)', () => {
    const src = code(read('components/resilience/plain-screen.tsx'));
    const effect = src.slice(src.indexOf('useEffect(() => {\n    if (!note) return;'), src.indexOf('}, [note, noteKey]);'));
    expect(effect.length).toBeGreaterThan(0);
    expect(effect).toMatch(/setTimeout\(\(\) => \{\s*try \{\s*scroll\.current\?\.scrollToEnd\(\{ animated: false \}\);\s*AccessibilityInfo\.announceForAccessibility\(note\);\s*\} catch/);
    expect(effect).toMatch(/return \(\) => clearTimeout\(id\);/);
    expect(src).toMatch(/<ScrollView\s+ref=\{scroll\}/);
    // The note is copy from packages/content (LaunchRecovery passes stillClosed, exportNothing or exportFailed), never an error.
    const launch = code(read('components/resilience/launch-recovery.tsx'));
    expect(launch).toMatch(/const words: Record<RecoveryLine, string \| undefined> = \{ none: undefined, stillClosed: e\.stillClosed, exportNothing: e\.exportNothing, exportFailed: e\.exportFailed \};/);
    expect(launch).toMatch(/note=\{words\[view\.line\]\}/);
  });

  it('pill buttons: the primary is 56 pt and filled, the quiet one 44 pt with no fill', () => {
    const c = tokens.light;
    const p = plainButton('primary', c);
    const q = plainButton('quiet', c);
    expect(p.container.borderRadius).toBe(tokens.radius.pill);
    expect(q.container.borderRadius).toBe(tokens.radius.pill);
    expect(p.container.minHeight).toBe(tokens.target.primary);
    expect(q.container.minHeight).toBe(tokens.target.min);
    expect(p.container.backgroundColor).toBe(c.accent);
    expect(p.label.color).toBe(c.onAccent);
    expect(q.container.backgroundColor).toBe('transparent');
    expect(q.label.color).toBe(c.accent);
    expect(p.container.alignSelf).toBe('stretch');
  });

  it('busy says what is happening in words, never a spinner', () => {
    const c = tokens.dark;
    const q = plainButton('quiet', c, true);
    expect(q.label.color).toBe(c.textMuted);
    const p = plainButton('primary', c, true);
    expect(p.container.backgroundColor).toBe('transparent');
    expect(p.container.borderWidth).toBe(tokens.stroke.control);
    expect(p.container.borderColor).toBe(c.controlBorder);
    const src = read('components/resilience/plain-screen.tsx');
    expect(src).not.toMatch(/ActivityIndicator/);
    // keyed by place, so the export button keeps VoiceOver focus while its words change
    expect(src).toMatch(/key=\{i\}/);
  });

  it('20 pt gutters, as StateScreen', () => {
    expect(PLAIN_LAYOUT.gutter).toBe(20);
    expect(PLAIN_LAYOUT.gutter).toBe(STATE_LAYOUT.gutter);
  });
});

describe('nothing that can throw before render (S50)', () => {
  const ALLOWED = new Set([
    'react',
    'react-native',
    'react-native-safe-area-context', // initialWindowMetrics only: a constant, no provider
    'react-native-svg',
    'expo-splash-screen',
    'expo-system-ui',
    'expo-router', // the boundary's router.replace and its props type; no hooks
    '@scribe/design-tokens',
    '@/components/ui/fonts', // loadFonts: resolves at once on a phone (embedded faces), never throws
    '@/lib/store', // getSetting, wrapped in try
    '@/lib/copy',
    '@/lib/resilience/launch.logic', // pure: RecoveryView, its steps and the tap sequencing (a type-only import of the store)
    '@/lib/resilience/recover-to-tonight',
    '@/lib/resilience/recovery-export',
    '@/components/ui/line-art.data',
    '@/components/ui/state-screen.logic',
    './plain-screen',
    './plain-screen.styles',
  ]);
  const FILES = ['components/resilience/plain-screen.tsx', 'components/resilience/plain-screen.styles.ts', 'components/resilience/error-boundary.tsx', 'components/resilience/launch-recovery.tsx'];

  it('imports only plain modules: no theme provider, no motion, no design-system components', () => {
    for (const f of FILES) {
      for (const m of imports(read(f))) expect(ALLOWED.has(m), `${f} imports ${m}`).toBe(true);
    }
  });

  it('no motion, no theme context, no class names that need a stylesheet runtime', () => {
    for (const f of FILES) {
      const src = code(read(f));
      expect(src, f).not.toMatch(/reanimated|Animated|useTheme|useMotion|ThemeProvider|LayoutAnimation|className=/);
    }
  });

  it('the support modules the allowed list names are themselves plain', () => {
    for (const f of ['components/ui/line-art.data.ts', 'components/ui/state-screen.logic.ts']) {
      for (const m of imports(read(f))) expect(['@scribe/design-tokens', '@/components/ui/line-art.data'], `${f} imports ${m}`).toContain(m);
    }
  });

  it('launch.logic.ts, which the launch screen reads for its view and its taps, imports only a type', () => {
    const src = read('lib/resilience/launch.logic.ts');
    expect(imports(src)).toEqual(['../store']);
    expect(src).toMatch(/^import type \{ OpenStoreResult \} from '\.\.\/store';$/m);
  });

  it('the faces module is plain too, and loading never throws', () => {
    const fonts = read('components/ui/fonts.ts');
    for (const m of imports(fonts)) expect(['expo-font', 'react', '@scribe/design-tokens', '@scribe/design-tokens/fonts'], `fonts.ts imports ${m}`).toContain(m);
    expect(code(fonts)).toMatch(/Font\.loadAsync\(fontAssets\)[\s\S]*\.catch\(/);
    // Launch recovery draws before UIProvider, so the screen registers the faces itself (the web preview needs it)
    expect(code(read('components/resilience/plain-screen.tsx'))).toMatch(/void loadFonts\(\);/);
  });

  it('hides the splash, so the launch recovery screen is never covered by it', () => {
    // RootLayout calls preventAutoHideAsync and hides the splash only inside Root, which recovery never mounts.
    const src = code(read('components/resilience/plain-screen.tsx'));
    expect(src).toMatch(/SplashScreen\.hideAsync\(\)/);
    // In one try, so a native module that throws at once cannot skip the focus timer after it.
    expect(src).toMatch(/try \{\s*void SplashScreen\.hideAsync\(\)\.catch\(\(\) => \{\}\);\s*void loadFonts\(\);\s*\} catch/);
    expect(code(read('app/_layout.tsx'))).toMatch(/if \(launch\.status === 'recovery'\) return <LaunchRecovery/);
  });

  it('never shows or logs the error, its message or a stack', () => {
    for (const f of FILES) {
      const src = code(read(f));
      expect(src, f).not.toMatch(/\berror\b\.(message|stack)|console\.|captureException|track\(/);
    }
    expect(code(read('components/resilience/error-boundary.tsx'))).not.toMatch(/\berror\b/);
  });
});

describe('launch recovery offers no way to delete (S51, D-085)', () => {
  it('two actions only: Try again and Export what is readable', () => {
    const src = code(read('components/resilience/launch-recovery.tsx'));
    const labels = [...src.matchAll(/label: ([^,]+),/g)].map((m) => m[1].trim());
    expect(labels).toEqual(['view.trying ? e.tryingAgainButton : e.tryAgainButton', 'view.exporting ? e.exportingTitle : e.exportButton']);
    expect(src).not.toMatch(/delete|reset|rebuild|erase|wipe|remove|clear|purge/i);
  });

  it('the words are the S51 table with the 30 Oct rulings (S1, S2), and no title ends with a full stop', () => {
    const l = en.errors.launch;
    expect(l.title).toBe('The book could not open');
    expect(l.body).toBe('Export saves a copy of the recordings and book files it can read, exactly as they are.');
    expect(l.hint).toBe('Try again, or restart the phone.');
    expect(l.tryingAgainButton).toBe('Trying again');
    expect(l.stillClosed).toBe('It did not open this time either.');
    expect(l.exportButton).toBe("Export what's readable");
    expect(l.exportButton.length).toBeLessThanOrEqual(22);
    expect(en.errors.crash.title).toBe('This page did not open');
    expect(en.errors.notFoundPage.title).toBe('Nothing at this link');
    for (const t of [l.title, en.errors.crash.title, en.errors.notFoundPage.title]) expect(t).not.toMatch(/\.$/);
    // Nothing a person can tap or is told to do here names deleting, resetting or erasing (D-085).
    for (const s of Object.values(l)) expect(s).not.toMatch(/delete|reset|erase/i);
  });
});

describe('the 404 (S49)', () => {
  const src = code(read('app/+not-found.tsx'));

  it('is the shared StateScreen with the window drawing and one way back to Tonight', () => {
    expect(src).toMatch(/<StateScreen kind="notFound" art="window"/);
    expect(src).toMatch(/primary=\{\{ label: e\.button, onPress: \(\) => router\.replace\(TONIGHT_HREF\) \}\}/);
    expect(LINE_ART.window).toBeDefined();
    // the full-width primary at the bottom and the 20 pt gutters come from StateScreen itself
    const state = read('components/ui/state-screen.tsx');
    expect(state).toMatch(/<Button size="lg" fullWidth label=\{main\.label\}/);
    expect(state).toMatch(/paddingHorizontal: L\.gutter/);
    expect(STATE_LAYOUT.gutter).toBe(20);
  });

  it('never reads, shows or logs the address', () => {
    expect(src).not.toMatch(/usePathname|useLocalSearchParams|useGlobalSearchParams|useSegments|console\.|track\(/);
  });
});
