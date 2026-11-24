/// <reference types="node" />
/**
 * BL-2174 (J26, CR-208): on web `expo-file-system` throws the moment a path is touched, which blanked Settings, Spoken
 * language and Settings, Storage. These tests stub it with a throwing module and `Platform.OS = 'web'`, so the old code
 * (which reads `Paths.document`) fails and the new code (an in-memory stand-in) passes. The iPhone path is pinned too.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({ os: 'web', created: 0 }));

vi.mock('react-native', () => ({
  Platform: {
    get OS() {
      return state.os;
    },
  },
}));
vi.mock('expo-file-system', () => {
  const boom = () => {
    throw new Error('this.validatePath is not a function');
  };
  return {
    Paths: new Proxy({}, { get: () => (state.os === 'web' ? boom() : 'file:///container/Documents') }),
    Directory: class {
      uri = 'file:///container/Library/Application Support/packs';
      constructor() {
        if (state.os === 'web') boom();
      }
      create() {
        state.created += 1;
      }
    },
    File: class {
      constructor() {
        boom();
      }
    },
    FileMode: {},
  };
});
vi.mock('../../../../modules/scribe-files', () => ({ ScribeFiles: null }));
vi.mock('../expo-adapter', () => ({
  expoNetwork: { connection: async () => 'unknown' },
  expoPackHttp: {},
  ExpoPackFs: class {
    constructor(readonly root: string) {}
  },
}));
vi.mock('../../store', () => ({ getSetting: () => null, setSetting: () => undefined }));
vi.mock('../../remote', () => ({
  APP_VERSION: '1.0.0',
  getPackManifest: () => null,
  getRemoteConfig: () => ({ killSwitches: { packDownloads: false } }),
  onManifestUpdated: () => () => undefined,
  packManifestDoc: { refresh: () => Promise.reject(new Error('no network on web')) },
}));
vi.mock('react', () => ({
  useState: (init: unknown) => [typeof init === 'function' ? (init as () => unknown)() : init, () => undefined],
  useEffect: () => undefined,
}));

beforeEach(() => {
  state.os = 'web';
  state.created = 0;
  vi.resetModules();
});

describe('[BL-2174] packs are web-safe', () => {
  it('appSupportDir on web returns a stand-in, creates no folder and is not backup-excluded', async () => {
    const { appSupportDir } = await import('../app-support');
    const r = appSupportDir('packs');
    expect(typeof r.dir.uri).toBe('string');
    expect(r.backupExcluded).toBe(false);
    expect(state.created).toBe(0);
  });

  it('listInstalled on web is empty and does not throw', async () => {
    const { listInstalled } = await import('../index');
    expect(listInstalled()).toEqual([]);
  });

  it('usePacks on web returns no installed packs and no progress', async () => {
    const { usePacks } = await import('../index');
    expect(usePacks()).toEqual({ installed: [], progress: {} });
  });

  it('ensurePack on web resolves to a plain not-available result and never throws', async () => {
    const { ensurePack } = await import('../index');
    await expect(ensurePack('text-rules.pt')).resolves.toEqual({ ok: false, reason: 'no_manifest' });
  });

  it('startPacks on web does not throw', async () => {
    const { startPacks } = await import('../index');
    expect(() => startPacks()()).not.toThrow();
  });

  it('on iOS the real folder is still created (the iPhone build does not change)', async () => {
    state.os = 'ios';
    const { appSupportDir } = await import('../app-support');
    appSupportDir('packs');
    expect(state.created).toBe(1);
  });
});
