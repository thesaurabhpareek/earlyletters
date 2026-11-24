/**
 * BL-553 (NS-40-R9): "nothing is stored on the phone" when a sign-up is refused, proved by behaviour. The real
 * RegionRefusedScreen is rendered and each of its actions is pressed, with spies on every write layer the app owns
 * (the local settings store, the secure store, SQLite). Zero writes, and the DB-IP link goes to db-ip.com.
 * The sign-in code step and the Welcome both draw this one component (test/auth-region-refused.test.ts pins that).
 * Fictional family "Asha" only.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { licences } from '@scribe/content';

const writes = vi.hoisted(() => ({
  setSetting: vi.fn(), deleteSetting: vi.fn(), secureSet: vi.fn(), secureDelete: vi.fn(), sqliteOpen: vi.fn(),
  opened: [] as string[], primary: undefined as unknown, quiet: [] as { label: string; onPress: () => void; testID?: string }[],
}));

vi.mock('@/lib/store', () => ({ setSetting: writes.setSetting, deleteSetting: writes.deleteSetting, getSetting: () => null }));
vi.mock('@/lib/supabase/secure-storage', () => ({ secureStorage: { getItem: async () => null, setItem: writes.secureSet, removeItem: writes.secureDelete } }));
vi.mock('expo-secure-store', () => ({ setItemAsync: writes.secureSet, deleteItemAsync: writes.secureDelete, getItemAsync: async () => null }));
vi.mock('expo-sqlite', () => ({ openDatabaseSync: writes.sqliteOpen }));
vi.mock('expo-web-browser', () => ({ openBrowserAsync: async (url: string) => void writes.opened.push(url) }));
vi.mock('@/lib/first-run/use-arrival', () => ({ useArrival: () => undefined }));
vi.mock('@/components/settings/help-links.logic', () => ({ mailTarget: () => ({ kind: 'mail', url: 'mailto:x', value: 'x' }), openHelpTarget: async () => ({ kind: 'opened' }) }));
vi.mock('@/components/ui/state-screen', () => ({
  StateScreen: (p: { quiet?: typeof writes.quiet; primary?: unknown }) => {
    writes.quiet.splice(0, writes.quiet.length, ...(p.quiet ?? []));
    writes.primary = p.primary;
    return null;
  },
}));

import { renderMarkup } from '../helpers/render-markup';
import { RegionRefusedScreen } from '@/components/onboarding/region-refused-screen';

const anyWrite = () => [writes.setSetting, writes.deleteSetting, writes.secureSet, writes.secureDelete, writes.sqliteOpen].reduce((n, f) => n + f.mock.calls.length, 0);

beforeEach(() => {
  for (const f of [writes.setSetting, writes.deleteSetting, writes.secureSet, writes.secureDelete, writes.sqliteOpen]) f.mockClear();
  writes.opened.length = 0;
  writes.quiet.length = 0;
});

describe('[BL-553] a refused sign-up screen stores nothing, proved by driving it', () => {
  it('[BL-553] rendering it and pressing every action makes zero writes to settings, the secure store, or SQLite', async () => {
    renderMarkup(<RegionRefusedScreen />);
    expect(writes.quiet.map((a) => a.testID)).toEqual(['region.terms', 'region.contact', 'region.attribution']);
    for (const a of writes.quiet) a.onPress();
    await Promise.resolve();
    expect(anyWrite()).toBe(0);
  });

  it('[BL-553] the screen has no retry button and the DB-IP link opens db-ip.com (CC BY 4.0 attribution)', async () => {
    renderMarkup(<RegionRefusedScreen />);
    expect(writes.primary).toBeUndefined();
    const link = writes.quiet.find((a) => a.testID === 'region.attribution');
    expect(link?.label).toBe(licences.geoAttribution.text);
    link?.onPress();
    await Promise.resolve();
    expect(writes.opened).toContain('https://db-ip.com');
  });

  it('[BL-553] mutant: a screen that writes on press is caught by the same spies', () => {
    writes.setSetting('region.refused', 'yes');
    expect(anyWrite()).toBe(1);
  });
});
