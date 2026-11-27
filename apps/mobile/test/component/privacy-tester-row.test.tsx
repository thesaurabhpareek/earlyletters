/**
 * BL-1250 (ER-A15), CPrivO-61 conditions: the real Settings > Privacy screen, rendered for each kind of build. The
 * "Team test phone" switch never renders in the App Store build (APP_ENV production), whatever `extra.buildKind` or the
 * stored setting say, and the screen does not even read the setting there (CCO condition). In a test build it renders
 * only where usage can be sent (CPO condition). Everything the screen reaches outside its own rows is stood in.
 * Fictional family "Asha" only; no child is on this phone.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderMarkup } from '../helpers/render-markup';

const h = vi.hoisted(() => ({
  appEnv: 'production' as 'development' | 'preview' | 'production',
  extraBuildKind: undefined as unknown,
  analytics: true,
  settings: new Map<string, string>(),
  reads: [] as string[],
}));

vi.mock('expo-router', () => ({ router: { push: () => undefined }, Stack: { Screen: () => null }, useFocusEffect: () => undefined }));
vi.mock('expo-web-browser', () => ({ openBrowserAsync: async () => undefined }));
vi.mock('expo-constants', () => ({ default: { get expoConfig() { return { extra: { buildKind: h.extraBuildKind } }; } } }));
vi.mock('@/lib/build-env', async (orig) => {
  const real = await orig<typeof import('@/lib/build-env')>();
  return { ...real, get APP_ENV() { return h.appEnv; } };
});
vi.mock('@/lib/capabilities', () => ({ capabilities: { get analytics() { return h.analytics; }, sync: false, signIn: false } }));
vi.mock('@/lib/store', () => ({
  getActiveChild: () => null,
  getSetting: (k: string) => (h.reads.push(k), h.settings.get(k) ?? null),
  setSetting: (k: string, v: string) => void h.settings.set(k, v),
  deleteSetting: (k: string) => void h.settings.delete(k),
}));
vi.mock('@/lib/analytics', () => ({ grantAnalytics: async () => undefined, withdrawAnalytics: async () => undefined }));
vi.mock('@/lib/analytics/use-analytics-consent', () => ({ useAnalyticsConsent: () => 'unknown' }));
vi.mock('@/lib/analytics/privacy-sources', () => ({ useSensitiveDataStatus: () => ({ status: 'signed_out', open: null }), sensitiveStatusWords: () => '' }));
vi.mock('@/lib/reminders', () => ({ lockScreenNamesOn: () => false }));
vi.mock('@/lib/app-lock/controller', () => ({ useAppLock: () => ({ enabled: false }), readLockAbility: async () => ({ available: false }) }));

const KEY = 'scribe.analytics.internal_tester';
const ROW = 'privacy.internalTester';

async function render(opts: { appEnv: typeof h.appEnv; extra?: unknown; analytics?: boolean; stored?: string }): Promise<string> {
  h.appEnv = opts.appEnv;
  h.extraBuildKind = opts.extra;
  h.analytics = opts.analytics ?? true;
  h.settings.clear();
  h.reads.length = 0;
  if (opts.stored !== undefined) h.settings.set(KEY, opts.stored);
  vi.resetModules();
  const { default: PrivacySettings } = await import('@/app/settings/privacy');
  return renderMarkup(<PrivacySettings />);
}

afterEach(() => vi.resetModules());

describe('[BL-1250] [CPrivO-61] the tester switch on Settings > Privacy', () => {
  it('the App Store build renders no tester row and never reads the setting, even when config and the setting say tester', async () => {
    const html = await render({ appEnv: 'production', extra: 'testflight', stored: 'true' });
    expect(html).toContain('privacy.promise');
    expect(html).not.toContain(ROW);
    expect(html).not.toContain('Team test phone');
    expect(h.reads).not.toContain(KEY);
  });

  it('a TestFlight build that can send usage renders the row, showing the stored switch', async () => {
    const html = await render({ appEnv: 'preview', extra: 'testflight', stored: 'true' });
    expect(html).toContain(ROW);
    expect(html).toContain('Team test phone');
    expect(h.reads).toContain(KEY);
  });

  it('a test build that cannot send usage renders no row (analytics off, as every build is today)', async () => {
    const html = await render({ appEnv: 'preview', extra: 'preview', analytics: false, stored: 'true' });
    expect(html).not.toContain(ROW);
    expect(h.reads).not.toContain(KEY);
  });

  it('a development build that can send usage renders the row', async () => {
    expect(await render({ appEnv: 'development', extra: 'dev' })).toContain(ROW);
  });
});
