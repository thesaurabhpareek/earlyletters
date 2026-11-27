/**
 * [NS-53-G01][NS-53-R102][NS-53-R232] The Moments tab and its sheets are covered in the app switcher with App lock off,
 * and never by two covers (BL-2136, PR 6b; component spec 04-privacy-cover-moments.md, PC-T1, PC-T2, PC-T3, PC-T6,
 * PC-T8).
 *
 * - PC-T1: `shouldCoverMoments` against its full 18-row truth table (route class by app state by lock setting).
 * - G01 by the root cover: for every row where the Moments rule asks for a cover, the real machine's `coverShown` is
 *   true, so the one `PrivacyCover` the root layout mounts already covers it (BL-1407). If that ever stops being true,
 *   this test fails and the scoped gate of the spec has to be built.
 * - PC-T3: the real AppLockLayer, rendered with Moments focused, draws exactly one cover going inactive and going to
 *   background with the lock off, and exactly one going to background with the lock on; no file in src but the lock
 *   layer mounts `PrivacyCover`, and no file but the root layout mounts `AppLockLayer`, which it does once.
 * - PC-T6: the drawn cover holds no text and one spoken label, the app name, in the light and dark themes, each with
 *   and without Increase Contrast.
 * - PC-T8: the rule's source is ASCII and holds only a closed list of words and strings, one `(` (its own parameter
 *   list) and no `/` outside comments and strings, so no call can be added without this test changing.
 *
 * Not proved here: the pixels iOS captures for the switcher, and whether the cover hides Apple's picker view; those
 * are the device rows D-15 (the tab body, gap G-12 in docs/security/MEDIA_THREAT_MODEL.md), D-20 and DM-09 (the
 * picker) and G7 (PC-T9). Focus return after the cover lifts (part of G01) is not tested here. The fictional family is
 * "Asha".
 */
import { createElement as h, type ReactNode } from 'react';
import { createRequire } from 'node:module';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
// react-dom ships no types here and no dependency is added for them: a typed require keeps tsc clean.
const { renderToStaticMarkup } = createRequire(import.meta.url)('react-dom/server') as { renderToStaticMarkup: (e: unknown) => string };
import { describe, expect, it, vi } from 'vitest';

const env = vi.hoisted(() => ({
  settings: new Map<string, string>(),
  appState: null as null | ((s: string) => void),
  theme: { scheme: 'light' as 'light' | 'dark', highContrast: false },
}));

type P = { children?: ReactNode; testID?: string; style?: unknown; accessibilityLabel?: string } & Record<string, unknown>;
/**
 * Props whose name holds label, hint, value, text, description, action, name or title (so `aria-label`,
 * `accessibilityHint`, `accessibilityValue`, `aria-valuetext` and `accessibilityActions` among them) reach the markup
 * as attributes whose names end in `label`: every string or number inside them, at any depth (an action's `name` and
 * `label` included), becomes one attribute, so PC-T6 can read them. The mark's own `accessibilityLabel` stays
 * `data-label`. Props with other names (style, colours, path data) are not read. A plain `animatedProps` object (which
 * Reanimated copies onto the native view) is merged into the props first, so a label passed that way is read too.
 */
const SPOKEN = /label|hint|value|text|description|action|name|title/i;
const leaves = (v: unknown): string[] =>
  typeof v === 'string' ? [v] : typeof v === 'number' ? [String(v)] : v && typeof v === 'object' ? Object.values(v).flatMap(leaves) : [];
const spoken = (p: P): Record<string, string> => {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(p)) {
    if (k === 'accessibilityLabel' || !SPOKEN.test(k)) continue;
    leaves(v).forEach((text, i) => {
      if (text) out[`data-${k.toLowerCase()}-${i}-label`] = text;
    });
  }
  return out;
};
const tag = (name: string) => (props: P) => {
  const extra = props.animatedProps && typeof props.animatedProps === 'object' ? (props.animatedProps as P) : {};
  const p: P = { ...props, ...extra };
  return h('div', { 'data-kind': name, 'data-testid': p.testID, 'data-label': p.accessibilityLabel, ...spoken(p) }, p.children);
};

vi.mock('../src/lib/store', () => ({
  getSetting: (k: string) => env.settings.get(k) ?? null,
  setSetting: (k: string, v: string) => void env.settings.set(k, v),
}));
vi.mock('../src/lib/capture/recorder', () => ({ onActiveTakeChange: () => {} }));
vi.mock('react-native', () => ({
  Platform: { OS: 'ios' },
  StyleSheet: { create: <T,>(s: T) => s, absoluteFill: {} },
  View: tag('view'),
  AppState: {
    currentState: 'active',
    addEventListener: (_: string, l: (s: string) => void) => {
      env.appState = l;
      return { remove: () => {} };
    },
  },
}));
vi.mock('react-native-reanimated', () => ({
  default: { View: tag('animated') },
  cancelAnimation: () => {},
  ReduceMotion: { Never: 'never' },
  useAnimatedStyle: (f: () => object) => f(),
  useSharedValue: (v: number) => ({ value: v }),
  withTiming: (v: number) => v,
}));
vi.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) }));
vi.mock('react-native-screens', () => ({ FullWindowOverlay: tag('overlay') }));
vi.mock('react-native-svg', () => ({ default: tag('svg'), Path: tag('path') }));
vi.mock('expo-local-authentication', () => ({
  SecurityLevel: { NONE: 0, SECRET: 1, BIOMETRIC_STRONG: 3 },
  getEnrolledLevelAsync: async () => 3,
  supportedAuthenticationTypesAsync: async () => [2],
  hasHardwareAsync: async () => true,
  authenticateAsync: async () => ({ success: true }),
}));
vi.mock('@/components/ui/button', () => ({ Button: tag('button') }));
vi.mock('@/components/ui/toast', () => ({ useToast: () => ({ show: () => {} }) }));
vi.mock('@/lib/a11y', () => ({
  useFocusOnMount: () => {},
  useTheme: () => ({
    // A different palette for each scheme and Increase Contrast setting, as the real paletteFor(scheme, highContrast).
    c: {
      'light/false': { bg: '#fff', text: '#000' },
      'light/true': { bg: '#fefefe', text: '#010101' },
      'dark/false': { bg: '#000', text: '#fff' },
      'dark/true': { bg: '#020202', text: '#fdfdfd' },
    }[`${env.theme.scheme}/${env.theme.highContrast}`],
    scheme: env.theme.scheme,
    highContrast: env.theme.highContrast,
    reduceTransparency: false,
  }),
}));

const { shouldCoverMoments, MOMENTS_ROUTE_CLASSES, APP_PHASES } = await import('../src/lib/moments/cover');
type Route = (typeof MOMENTS_ROUTE_CLASSES)[number];
type Phase = (typeof APP_PHASES)[number];
const { reduce, coverShown, INITIAL, DEFAULT_GRACE } = await import('../src/lib/app-lock/machine');

/**
 * PC-T1, written out row by row (not computed from the rule it checks). Columns: focused route class, app state, App
 * lock on, cover the Moments rule needs.
 */
const TRUTH_TABLE: readonly (readonly [Route, Phase, boolean, boolean])[] = [
  ['moments', 'active', false, false],
  ['moments', 'inactive', false, true],
  ['moments', 'background', false, true],
  ['moments', 'active', true, false],
  ['moments', 'inactive', true, false], // the lock layer governs: the Moments rule mounts nothing of its own
  ['moments', 'background', true, false],
  ['other', 'active', false, false],
  ['other', 'inactive', false, false], // Home, Book and Me: no new promise from Moments (DC-5)
  ['other', 'background', false, false],
  ['other', 'active', true, false],
  ['other', 'inactive', true, false],
  ['other', 'background', true, false],
  ['none', 'active', false, false],
  ['none', 'inactive', false, false],
  ['none', 'background', false, false],
  ['none', 'active', true, false],
  ['none', 'inactive', true, false],
  ['none', 'background', true, false],
];

/** The real lock machine, driven as the controller drives it: launch, unlock if the lock is on, then the app state. */
function lockStateFor(lockOn: boolean, phase: Phase) {
  let s = reduce(INITIAL, { type: 'launch', enabled: lockOn, grace: DEFAULT_GRACE, phase: 'active' });
  if (lockOn) s = reduce(s, { type: 'unlocked' });
  return reduce(s, { type: 'appState', phase, at: 1_000 });
}

describe('[NS-53-G01] PC-T1: shouldCoverMoments, the full 18-row truth table', () => {
  it('covers every route class by app state by lock setting, once each', () => {
    expect(TRUTH_TABLE).toHaveLength(MOMENTS_ROUTE_CLASSES.length * APP_PHASES.length * 2);
    const seen = new Set(TRUTH_TABLE.map(([r, p, l]) => `${r}/${p}/${l}`));
    expect(seen.size).toBe(18);
  });

  for (const [route, phase, lockOn, want] of TRUTH_TABLE) {
    it(`${route}, ${phase}, App lock ${lockOn ? 'on' : 'off'}: ${want ? 'cover' : 'no cover from Moments'}`, () => {
      expect(shouldCoverMoments(route, phase, lockOn)).toBe(want);
    });
  }
});

describe('[NS-53-G01][NS-53-R232] every row the Moments rule covers is already covered by the root cover (BL-1407)', () => {
  for (const [route, phase, lockOn, want] of TRUTH_TABLE) {
    it(`${route}, ${phase}, App lock ${lockOn ? 'on' : 'off'}: the root cover is ${phase === 'active' ? 'down' : 'up'}`, () => {
      const s = lockStateFor(lockOn, phase);
      expect(s.enabled).toBe(lockOn);
      // A Moments cover is never needed where the root cover is down.
      if (want) expect(coverShown(s)).toBe(true);
      // And the root cover is up on every route whenever the app is not in front, lock on or off (R102), and down in
      // front once unlocked: the root layer is the one cover in every row.
      expect(coverShown(s)).toBe(phase !== 'active');
    });
  }
});

describe('[NS-53-G01] a cold launch that is not in front is covered too, lock off or on', () => {
  for (const lockOn of [false, true]) {
    for (const phase of ['inactive', 'background'] as const) {
      it(`launch while ${phase}, App lock ${lockOn ? 'on' : 'off'}: the root cover is up`, () => {
        const s = reduce(INITIAL, { type: 'launch', enabled: lockOn, grace: DEFAULT_GRACE, phase });
        expect(s.phase).toBe(phase);
        expect(coverShown(s)).toBe(true);
      });
    }
  }
});

describe('[NS-53-G01] PC-T3, PC-T6: one cover, never two, with Moments focused', () => {
  const COVER = /data-testid="appLock\.cover"/g;

  it('the real AppLockLayer draws exactly one cover going inactive and to background with App lock off, and to background with it on', async () => {
    const { writeAppLock } = await import('../src/lib/app-lock/prefs');
    const controller = await import('../src/lib/app-lock/controller');
    const { appLockCopy } = await import('../src/lib/app-lock/copy');
    const { AppLockLayer } = await import('../src/components/app-lock/app-lock-layer');
    const draw = () => renderToStaticMarkup(h(AppLockLayer));

    writeAppLock({ enabled: false });
    controller.startAppLock();
    expect(env.appState).not.toBeNull();
    expect(controller.getAppLockState().enabled).toBe(false);

    // Lock off, Moments focused (the rule asks for a cover): one cover, from the root layer.
    expect(shouldCoverMoments('moments', 'inactive', false)).toBe(true);
    env.appState!('inactive');
    let html = draw();
    expect(html.match(COVER)).toHaveLength(1);
    expect(html).toContain('data-kind="overlay"'); // drawn above presented sheets, as a Moments sheet is
    expect(html.replace(/<[^>]*>/g, '')).toBe(''); // PC-T6: no text, no day, place or name
    expect(html).not.toContain('Asha');
    expect(/data-testid="appLock\.cover\.mark"[^>]*data-label="([^"]*)"/.exec(html)?.[1]).toBe(appLockCopy.coverLabel);
    // PC-T6, the VoiceOver half: every label, hint, value, action, name or title prop on the drawn cover (as the mock
    // above reads them) says the app name, once, and nothing else (no day, place or name).
    expect([...html.matchAll(/\b[\w-]*label="([^"]*)"/gi)].map((m) => m[1])).toEqual([appLockCopy.coverLabel]);
    // The same in the dark theme and with Increase Contrast, in each scheme: one cover, no text, the app name alone.
    const eachTheme = (phase: string) => {
      for (const scheme of ['light', 'dark'] as const) {
        for (const highContrast of [false, true]) {
          env.theme = { scheme, highContrast };
          const themed = draw();
          expect(themed.match(COVER), `${phase}, ${scheme}, high contrast ${highContrast}`).toHaveLength(1);
          expect(themed.replace(/<[^>]*>/g, '')).toBe('');
          expect(themed).not.toContain('Asha');
          expect([...themed.matchAll(/\b[\w-]*label="([^"]*)"/gi)].map((m) => m[1])).toEqual([appLockCopy.coverLabel]);
        }
      }
      env.theme = { scheme: 'light', highContrast: false };
    };
    eachTheme('inactive');
    env.appState!('active');
    expect(draw()).not.toMatch(COVER);

    // Lock off, going to background (the moment iOS takes the switcher snapshot): one cover, from the root layer.
    expect(shouldCoverMoments('moments', 'background', false)).toBe(true);
    env.appState!('background');
    expect(draw().match(COVER)).toHaveLength(1);
    eachTheme('background'); // the moment iOS takes the snapshot: the same checks in every theme
    env.appState!('active');
    expect(draw()).not.toMatch(COVER);

    // Lock on, Moments focused (the lock layer governs): still exactly one cover.
    await controller.turnOn();
    expect(controller.getAppLockState().enabled).toBe(true);
    expect(shouldCoverMoments('moments', 'background', true)).toBe(false);
    env.appState!('background');
    html = draw();
    expect(html.match(COVER)).toHaveLength(1);
  });

  it('no file in src but the lock layer mounts PrivacyCover, so nothing can add a second cover over Moments', () => {
    const root = resolve(__dirname, '../src');
    const walk = (d: string): string[] =>
      readdirSync(d).flatMap((f) => {
        const p = join(d, f);
        return statSync(p).isDirectory() ? walk(p) : /\.tsx?$/.test(f) ? [p] : [];
      });
    const files = walk(root);
    expect(files.length).toBeGreaterThan(100);
    const mounting = files
      .filter((f) => /<PrivacyCover\b|privacy-cover['"]/.test(readFileSync(f, 'utf8')))
      .map((f) => relative(root, f))
      .filter((f) => f !== join('components', 'app-lock', 'privacy-cover.tsx')); // the cover itself, by exact path only
    expect(mounting).toEqual(['components/app-lock/app-lock-layer.tsx']);
  });
});

describe('[NS-53-G01] PC-T3: the root layout mounts the lock layer once, and nothing else mounts it', () => {
  it('apps/mobile/src/app/_layout.tsx renders <AppLockLayer /> exactly once, and no other file in src renders it', () => {
    const root = resolve(__dirname, '../src');
    const walk = (d: string): string[] =>
      readdirSync(d).flatMap((f) => {
        const p = join(d, f);
        return statSync(p).isDirectory() ? walk(p) : /\.tsx?$/.test(f) ? [p] : [];
      });
    const mounting = walk(root)
      .filter((f) => /<AppLockLayer\b|\(\s*AppLockLayer\b|\bapp-lock-layer['"]/.test(readFileSync(f, 'utf8')))
      .map((f) => relative(root, f));
    expect(mounting).toEqual([join('app', '_layout.tsx')]);
    const src = readFileSync(resolve(root, 'app/_layout.tsx'), 'utf8');
    expect(src.match(/<AppLockLayer\b/g)).toHaveLength(1);
  });
});

describe('[NS-53-G01] PC-T8 and the boundary with App lock', () => {
  it('the rule is pure: no React, no AppState, no analytics, no log', () => {
    const src = readFileSync(resolve(__dirname, '../src/lib/moments/cover.ts'), 'utf8');
    const importLines = src.split('\n').filter((l) => /^\s*(?:import|export)\b[^=]*\bfrom\b|^\s*import\s*['"(]/.test(l));
    expect(importLines).toEqual(["import type { AppPhase } from '../app-lock/machine';"]); // one type-only import, no side-effect import
    // Comments are removed by a pass that steps over string literals, so `//` or `/*` inside a string cannot hide the
    // code after it from the checks below.
    let code = '';
    for (let i = 0; i < src.length; ) {
      const q = src[i];
      if (src.startsWith('//', i)) {
        while (i < src.length && src[i] !== '\n') i++;
      } else if (src.startsWith('/*', i)) {
        const end = src.indexOf('*/', i + 2);
        i = end < 0 ? src.length : end + 2;
        code += ' ';
      } else if (q === "'" || q === '"' || q === '`') {
        let j = i + 1;
        while (j < src.length && src[j] !== q && src[j] !== '\n') j += src[j] === '\\' ? 2 : 1;
        code += src.slice(i, j + 1);
        i = j + 1;
      } else {
        code += q;
        i++;
      }
    }
    expect(code).not.toMatch(/\bfetch\s*\(|\bAppState\b|\bReact\b/);
    expect(src).not.toMatch(/console\.|track\(|analytics\.|logger/);
    expect(src).not.toMatch(/\bimport\s*\(|\brequire\s*\(|setSetting|getSetting/); // no dynamic import or store call either
    // A closed list of every word and string the code may hold (comments removed), so a multi-line import, `fetch?.(`,
    // `XMLHttpRequest`, `navigator.sendBeacon` or `console['log']` cannot get in without this list changing in the
    // same PR. No template literal, backslash escape, regex literal or non-ASCII character either (checked above). The code holds one `(`, the function's own parameter
    // list, so no call can be added even with words already on the list, and `from` once, so a second module
    // reference over several lines fails too.
    expect(code).not.toMatch(/[`\\]/);
    expect(src).not.toMatch(/[^\x00-\x7F]/); // ASCII only, so no word escapes the word reader below
    // No `/` outside comments and strings: no regex literal (whose `//` the comment pass would read as a comment) and
    // no division, so the comment pass and the language read the same code.
    expect(code.replace(/'[^'\n]*'|"[^"\n]*"/g, ' ')).not.toMatch(/\//);
    const strings = [...code.matchAll(/'([^'\n]*)'|"([^"\n]*)"/g)].map((m) => m[1] ?? m[2]);
    expect([...new Set(strings)].sort()).toEqual(['../app-lock/machine', 'active', 'background', 'inactive', 'moments', 'none', 'other']);
    const words = code.replace(/'[^'\n]*'|"[^"\n]*"/g, ' ').match(/[A-Za-z_$][\w$]*/g) ?? [];
    expect([...new Set(words)].sort()).toEqual(
      [
        'APP_PHASES', 'AppPhase', 'MOMENTS_ROUTE_CLASSES', 'MomentsRouteClass', 'appState', 'boolean', 'const', 'export',
        'from', 'function', 'import', 'lockEnabled', 'readonly', 'return', 'route', 'shouldCoverMoments', 'type',
      ].sort(),
    );
    expect(words.filter((w) => w === 'import')).toHaveLength(1);
    expect(words.filter((w) => w === 'from')).toHaveLength(1);
    expect(code.match(/\(/g)).toHaveLength(1);
    expect(code).toMatch(/\bfunction shouldCoverMoments\(/);
  });

  it('App lock never reads the Moments rule (machine, controller and layer do not import it)', () => {
    for (const f of ['../src/lib/app-lock/machine.ts', '../src/lib/app-lock/controller.ts', '../src/components/app-lock/app-lock-layer.tsx']) {
      expect(readFileSync(resolve(__dirname, f), 'utf8'), f).not.toMatch(/moments\/cover|shouldCoverMoments/);
    }
  });
});
