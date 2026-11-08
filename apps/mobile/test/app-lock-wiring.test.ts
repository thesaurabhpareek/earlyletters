/// <reference types="node" />
/**
 * App lock wiring (F1; CPO-2, CISO-1; security.md section 2; LEGAL-REQ-007): the parts a screen or a build carries
 * that Node cannot run, pinned in their source, plus the Face ID purpose string as the evaluated config writes it and
 * the preflight's permission allowlist. The rules themselves are in app-lock-machine.test.ts.
 */
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { getConfig } from 'expo/config';
import { brand } from '../../../packages/brand/index';
import { permissions } from '../../../packages/content/src/permissions.en';
import { permissionCopy } from '../src/lib/permission-copy';
import { ALLOWED_PERMISSION_NAMES, extraPermissions, plistUsageProblems, purposeStringProblem, REQUIRED_PLIST_USAGE } from '../scripts/preflight-lib.mjs';

const APP = resolve(__dirname, '..');
const src = (rel: string) => readFileSync(join(APP, rel), 'utf8');
/** Source without comments, so a pin never passes on a comment that names the thing. */
const code = (rel: string) => src(rel).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');

describe('PrivacyCover: drawn at once, so the app switcher snapshot never shows the book', () => {
  const cover = code('src/components/app-lock/privacy-cover.tsx');

  it('has no entrance animation (no fade, no Reanimated, no QuotePair, which fades in)', () => {
    expect(cover).not.toMatch(/entering|FadeIn|withTiming|react-native-reanimated|QuotePair\b/);
  });

  it('is opaque page colour over the whole screen, with the mark and only the app name for VoiceOver', () => {
    expect(cover).toMatch(/StyleSheet\.absoluteFill,\s*\{\s*backgroundColor:\s*c\.bg\s*\}/);
    expect(cover).toContain('SYMBOL_PATH');
    expect(cover).toContain('accessibilityLabel={appLockCopy.coverLabel}');
    expect(cover).not.toMatch(/getActiveChild|listChildren|\{child\}|child\.name/);
  });
});

describe('AppLockLayer: over everything, only covering', () => {
  const layer = code('src/components/app-lock/app-lock-layer.tsx');

  it('draws in FullWindowOverlay on iOS, so it covers presented modals (Listen, Review, Write, sheets)', () => {
    expect(layer).toMatch(/import \{ FullWindowOverlay \} from 'react-native-screens'/);
    expect(layer).toMatch(/Platform\.OS === 'ios'\) return <FullWindowOverlay unstable_accessibilityContainerViewIsModal>/);
  });

  it('shows whenever the machine says cover, with no fade in; fades out only after unlocking', () => {
    expect(layer).toContain('coverShown(s)');
    expect(layer).not.toMatch(/entering=/);
    expect(layer).toMatch(/withTiming\(0, \{ duration: tokens\.motion\.fadeMs/);
    // Decided during render (layer.logic.ts, behaviour in app-lock-behaviour.test.ts), never in an effect after a null render.
    expect(layer).toMatch(/const nextLayer = layerStep\(layer, \{ show, locked: s\.locked \}\);/);
    expect(layer).not.toMatch(/setFading|if \(!show && !/);
    // A cover that comes back during the unlock fade is fully opaque again before paint (Review A at e2120225).
    expect(layer).toMatch(/useLayoutEffect\(\(\) => \{\s*if \(up\) resetCoverOpacity\(opacity, cancelAnimation\);\s*\}, \[up, opacity\]\);/);
    expect(layer).toContain('style={[StyleSheet.absoluteFill, style]}');
    // CTO ruling on #640: the fade timer only unmounts; the opacity goes back to 1 in a layout effect once the layer is
    // not mounted (no flash at the end of unlock, and the next cover mounts at 1). The reset on up stays as a guard.
    expect(layer).toContain('const id = setTimeout(() => setLayer(fadeDone), tokens.motion.fadeMs);');
    expect(layer).toMatch(/useLayoutEffect\(\(\) => \{\s*if \(!mounted\) finishCoverFade\(opacity, cancelAnimation\);\s*\}, \[mounted, opacity\]\);/);
    expect(layer).toContain('const mounted = layerMounted(nextLayer);');
    expect(layer).toContain('if (!mounted) return null;');
    const timer = layer.slice(layer.indexOf('setTimeout('), layer.indexOf('tokens.motion.fadeMs);', layer.indexOf('setTimeout(')));
    expect(timer).not.toMatch(/finishCoverFade|resetCoverOpacity|opacity\.value/);
    expect(layer).not.toMatch(/leaving \? style : null/);
  });

  it('asks once on its own per lock, never in a loop', () => {
    expect(layer).toMatch(/if \(!shouldAutoPrompt\(s\)\) return;\s*markPrompted\(\);\s*void unlock\(\);/);
  });

  it('is modal for VoiceOver, with focus on Unlock and its hint', () => {
    expect(layer).toContain('accessibilityViewIsModal');
    expect(layer).toContain('useFocusOnMount(unlockRef)');
    expect(layer).toContain('appLockCopy.unlockHint[method]');
  });

  it('plays no haptic on unlock', () => {
    expect(layer).not.toContain('haptic(');
  });
});

describe('VoiceOver hears each lock message once (Review B, #640)', () => {
  // Toast announces its own message (components/ui/toast.tsx). An announce() beside a toast.show() says it twice.
  const files = ['src/app/settings/app-lock.tsx', 'src/components/app-lock/app-lock-layer.tsx', 'src/components/app-lock/lock-offer.tsx'];

  it('the toast itself announces', () => {
    expect(code('src/components/ui/toast.tsx')).toMatch(/announce\(/);
  });

  for (const f of files) {
    it(`${f} never pairs toast.show() with announce()`, () => {
      const body = code(f);
      expect(body).toContain('toast.show(');
      expect(body).not.toMatch(/\bannounce\(/);
    });
  }
});

describe('Erase everything can reset the lock in memory (#520)', () => {
  it('the controller re-reads the settings as a cold start does', () => {
    const c = code('src/lib/app-lock/controller.ts');
    expect(c).toMatch(/export function reloadAppLock\(\): boolean \{\s*if \(state\.recording \|\| state\.holding\) return false;\s*dispatch\(\{ type: 'launch', enabled: appLockOn\(\), grace: appLockGrace\(\), phase: currentPhase\(\) \}\);/);
    // One fallback for an unknown AppState, the safe one, in both places.
    expect(c).toContain("phaseOf(AppState.currentState) ?? 'inactive'");
    expect(c).not.toMatch(/\?\? 'active'/);
    expect(c.match(/phase: currentPhase\(\)/g)).toHaveLength(2);
  });
});

describe('root layout', () => {
  const layout = code('src/app/_layout.tsx');

  it('starts the lock in the first render, awaiting nothing, and renders the layer last, inside the gate', () => {
    expect(layout).toContain('useState(startAppLock)');
    expect(layout).not.toMatch(/await\s+startAppLock/);
    const stack = layout.indexOf('<Stack screenOptions');
    const lockLayer = layout.indexOf('<AppLockLayer />');
    expect(stack).toBeGreaterThan(0);
    expect(lockLayer).toBeGreaterThan(stack);
    expect(lockLayer).toBeLessThan(layout.indexOf('</SessionProvider>'));
  });
});

describe('controller', () => {
  const controller = code('src/lib/app-lock/controller.ts');

  it('uses the default policy: the device passcode is always the fallback', () => {
    expect(controller).toContain('disableDeviceFallback: false');
    expect(controller).not.toContain('disableDeviceFallback: true');
  });

  it('feeds the machine the live take, so the lock waits for a recording to end', () => {
    expect(controller).toMatch(/onActiveTakeChange\(\(live\) => dispatch\(\{ type: 'take', live \}\)\)/);
    expect(src('src/lib/capture/recorder.ts')).toMatch(/setActiveTake\(draft\.id\)/);
  });

  it('holds the lock while the share sheet is open', () => {
    expect(controller).toMatch(/export async function whileSharing/);
  });
});

describe('Export asks again while the lock is on', () => {
  const exp = code('src/app/settings/export.tsx');

  it('confirms with the device before packing, and holds the lock while sharing', () => {
    const start = exp.indexOf('const start = async');
    const confirm = exp.indexOf('if (!(await confirmForExport())) return;');
    const run = exp.indexOf('await runExport(');
    expect(confirm).toBeGreaterThan(start);
    expect(confirm).toBeLessThan(run);
    expect(exp).toContain('await whileSharing(() => shareExport(result, e.title))');
  });
});

describe('names in notifications are forced off while the lock is on (F17-REQ-015)', () => {
  // The data rule itself (names off in the planned notifications, stored choice kept) is behaviour-tested in
  // app-lock-behaviour.test.ts.
  it('the Reminders switch is disabled with the lock line', () => {
    const page = code('src/app/settings/reminders.tsx');
    expect(page).toContain('disabled={lockOn}');
    expect(page).toContain('appLockCopy.reminders.lockNames');
  });
});

describe('the offer at the end of first run (CPO-2)', () => {
  it('is on "The book is open." step', () => {
    expect(code('src/app/onboarding.tsx')).toMatch(/<LockOffer child=\{child\} \/>/);
  });

  it('has two equal secondary buttons, is hidden without a passcode, and authenticates to turn on', () => {
    const offer = code('src/components/app-lock/lock-offer.tsx');
    expect(offer.match(/variant="secondary" size="lg"/g)).toHaveLength(2);
    expect(offer).not.toMatch(/variant="primary"|variant="quiet"/);
    expect(offer).toContain('if (!ability || !ability.available || answered) return null;');
    expect(offer).toContain('await turnOn()');
  });
});

describe('Settings', () => {
  it('home has an App lock row with On or Off, opening the App lock page', () => {
    const home = code('src/app/settings/index.tsx');
    expect(home).toContain("appLock: '/settings/app-lock'");
    expect(home).toContain('lockOn ? appLockCopy.settingsHome.appLockOn : appLockCopy.settingsHome.appLockOff');
  });

  it('the App lock page authenticates both ways and shows Ask again after only while on', () => {
    const page = code('src/app/settings/app-lock.tsx');
    expect(page).toContain('on ? await turnOn() : await turnOff()');
    expect(page).toMatch(/\{lock\.enabled \? \(\s*<ListSection title=\{appLockCopy\.askAfter\}>/);
    expect(page).toContain('appLockCopy.noPasscode');
    expect(page).toContain('Linking.openSettings()');
  });
});

describe('NSFaceIDUsageDescription (LEGAL-REQ-007; content.md section 3, option 2, pending counsel)', () => {
  const KEY = 'EXPO_PUBLIC_APP_ENV';
  const original = process.env[KEY];
  afterEach(() => {
    if (original === undefined) delete process.env[KEY];
    else process.env[KEY] = original;
  });

  it('the app copy equals packages/content word for word', () => {
    expect(permissionCopy.faceId).toBe('{app} uses Face ID to open your book and confirm it is you.');
    expect(permissionCopy.faceId).toBe(permissions.faceId);
  });

  it('the evaluated config gives the plugin the string with the brand name, in every build', () => {
    for (const env of ['development', 'preview', 'production']) {
      process.env[KEY] = env;
      const exp = getConfig(APP, { skipSDKVersionRequirement: true, isPublicConfig: false }).exp;
      const plugin = (exp.plugins ?? []).find((p) => Array.isArray(p) && p[0] === 'expo-local-authentication') as [string, { faceIDPermission?: string }] | undefined;
      expect(plugin, env).toBeDefined();
      expect(plugin![1].faceIDPermission).toBe(permissions.faceId.replace('{app}', brand.name));
      expect(purposeStringProblem(plugin![1].faceIDPermission)).toBeNull();
    }
  });

  it('expo-local-authentication is a dependency at the SDK 57 line', () => {
    const pkg = JSON.parse(src('package.json')) as { dependencies: Record<string, string> };
    expect(pkg.dependencies['expo-local-authentication']).toMatch(/^~57\./);
  });
});

describe('preflight permission allowlist (LEGAL-REQ-007): the microphone, notifications and Face ID, nothing else', () => {
  it('allows exactly those names in the config', () => {
    expect([...ALLOWED_PERMISSION_NAMES].sort()).toEqual(
      ['NSFaceIDUsageDescription', 'NSMicrophoneUsageDescription', 'faceIDPermission', 'microphonePermission', 'notificationPermission', 'notificationsPermission'].sort(),
    );
    expect(extraPermissions(JSON.stringify([{}, [['expo-audio', { microphonePermission: 'x' }], ['expo-local-authentication', { faceIDPermission: 'y' }]]]))).toEqual([]);
    expect(extraPermissions('{"cameraPermission":"x","NSLocationWhenInUseUsageDescription":"y"}')).toEqual(['cameraPermission', 'NSLocationWhenInUseUsageDescription']);
  });

  it('requires exactly the microphone and Face ID usage strings in the generated Info.plist', () => {
    expect([...REQUIRED_PLIST_USAGE]).toEqual(['NSFaceIDUsageDescription', 'NSMicrophoneUsageDescription']);
    expect(plistUsageProblems(['NSMicrophoneUsageDescription', 'NSFaceIDUsageDescription'])).toEqual({ missing: [], extra: [] });
    expect(plistUsageProblems(['NSMicrophoneUsageDescription'])).toEqual({ missing: ['NSFaceIDUsageDescription'], extra: [] });
    expect(plistUsageProblems(['NSMicrophoneUsageDescription', 'NSFaceIDUsageDescription', 'NSCameraUsageDescription'])).toEqual({ missing: [], extra: ['NSCameraUsageDescription'] });
  });

  it('refuses the library default and placeholders as a purpose string', () => {
    expect(purposeStringProblem('Allow $(PRODUCT_NAME) to use Face ID')).not.toBeNull();
    expect(purposeStringProblem('{app} uses Face ID to open your book and confirm it is you.')).not.toBeNull();
    expect(purposeStringProblem('')).not.toBeNull();
  });

  it('the TestFlight preflight uses the allowlist for the config and the generated plist', () => {
    const pre = src('scripts/preflight-testflight.mjs');
    expect(pre).toContain('extraPermissions(asked)');
    expect(pre).toContain('plistUsageProblems(usage)');
    expect(pre).toContain("pluginOptions('expo-local-authentication').faceIDPermission");
    expect(pre).not.toMatch(/usage\.length === 1 && usage\[0\] === 'NSMicrophoneUsageDescription'/);
  });
});
