/**
 * BL-2243: on the web there is no speech model. Requiring whisper.rn there throws while its module loads
 * (`TurboModuleRegistry.get` is missing), and Metro hands a module-load throw to the global error handler as fatal
 * before the caller's catch runs. In the production web export that handler is installed, so the app showed the
 * recovery screen right after the age gate (first bad commit 5cba8e16, #2038, which let the transcription queue reach
 * `whisperModule()` on the web). The guard answers null on the web without loading whisper.rn. The iPhone path still
 * loads it.
 */
import Module from 'node:module';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({ os: 'web', loads: 0 }));

vi.mock('react-native', () => ({
  Platform: {
    get OS() {
      return state.os;
    },
  },
  AppState: { addEventListener: () => ({ remove: () => {} }) },
}));
// whisper-runtime loads whisper.rn with a lazy `require`, which vi.mock does not reach, so the load is watched at
// Node's module loader. On the web the stand-in throws as the real module does there.
type Loader = (request: string, ...rest: unknown[]) => unknown;
const M = Module as unknown as { _load: Loader };
const realLoad = M._load;
M._load = function (request: string, ...rest: unknown[]) {
  if (request === 'whisper.rn/index') {
    state.loads += 1;
    if (state.os === 'web') throw new TypeError("Cannot read properties of undefined (reading 'get')");
    return { toggleNativeLog: async () => {} };
  }
  // The same lazy path reads TurboModuleRegistry from react-native; answer as a phone with the native side present.
  if (request === 'react-native') return { TurboModuleRegistry: { get: () => ({}) } };
  return realLoad.call(this, request, ...rest);
};
afterAll(() => {
  M._load = realLoad;
});
vi.mock('../paths', () => ({ nativePath: (p: string) => p }));

beforeEach(() => {
  vi.resetModules();
  state.loads = 0;
});

describe('[BL-2243] whisperModule on the web', () => {
  it('answers null on the web and never loads whisper.rn', async () => {
    state.os = 'web';
    const { whisperModule } = await import('../whisper-runtime');
    expect(whisperModule()).toBeNull();
    expect(state.loads).toBe(0);
  });

  it('still loads whisper.rn on iOS', async () => {
    state.os = 'ios';
    const { whisperModule } = await import('../whisper-runtime');
    expect(whisperModule()).not.toBeNull();
    expect(state.loads).toBe(1);
  });
});
