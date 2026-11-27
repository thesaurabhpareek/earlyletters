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

// List rows stood in so the tester row's value and handler can be read; the other rows only need to render their titles.
const rows = vi.hoisted(() => new Map<string, { value: boolean; onValueChange: (v: boolean) => void }>());
vi.mock('@/components/ui/list-row', () => ({
  ListSection: ({ children }: { children: unknown }) => children,
  ListRow: ({ title, testID }: { title: string; testID?: string }) => `[${testID ?? ''}] ${title}`,
  ToggleRow: (p: { title: string; description?: string; value: boolean; onValueChange: (v: boolean) => void; testID?: string }) => {
    if (p.testID) rows.set(p.testID, { value: p.value, onValueChange: p.onValueChange });
    return `[${p.testID ?? ''}] ${p.title} ${p.description ?? ''} value=${String(p.value)}`;
  },
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
  rows.clear();
  if (opts.stored !== undefined) h.settings.set(KEY, opts.stored);
  vi.resetModules();
  const { default: PrivacySettings } = await import('@/app/settings/privacy');
  return renderMarkup(<PrivacySettings />);
}

afterEach(() => vi.resetModules());

// Each case imports the whole screen afresh (resetModules), which is slow on a loaded runner.
describe('[BL-1250] [CPrivO-61] the tester switch on Settings > Privacy', { timeout: 30_000 }, () => {
  it('the App Store build renders no tester row and never reads the setting, even when config and the setting say tester', async () => {
    const html = await render({ appEnv: 'production', extra: 'testflight', stored: 'true' });
    expect(html).toContain('privacy.promise');
    expect(html).not.toContain(ROW);
    expect(html).not.toContain('Team test phone');
    expect(html).not.toContain('Test builds only');
    expect(h.reads).not.toContain(KEY);
  });

  it('a TestFlight build that can send usage renders the row, showing the stored switch', async () => {
    const html = await render({ appEnv: 'preview', extra: 'testflight', stored: 'true' });
    expect(html).toContain(ROW);
    expect(rows.get(ROW)?.value).toBe(true);
    expect(html).toContain('Team test phone');
    // The public name is filled in from packages/brand; the raw placeholder never shows.
    expect(html).not.toContain('{app}');
    expect(h.reads).toContain(KEY);
  });

  it('a test build that cannot send usage renders no row (analytics off, as every build is today)', async () => {
    const html = await render({ appEnv: 'preview', extra: 'preview', analytics: false, stored: 'true' });
    expect(html).not.toContain(ROW);
    expect(h.reads).not.toContain(KEY);
  });

  it('a development build that can send usage renders the row, off while nothing is stored', async () => {
    expect(await render({ appEnv: 'development', extra: 'dev' })).toContain(ROW);
    expect(rows.get(ROW)?.value).toBe(false);
  });

  it('turning the row on stores exactly "true", and turning it off removes the setting', async () => {
    await render({ appEnv: 'preview', extra: 'testflight' });
    rows.get(ROW)!.onValueChange(true);
    expect(h.settings.get(KEY)).toBe('true');
    rows.get(ROW)!.onValueChange(false);
    expect(h.settings.has(KEY)).toBe(false);
  });
});
