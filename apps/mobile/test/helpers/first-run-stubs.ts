/**
 * The shared stub kit for the first-run tests (docs/tdd/new-scope/12-first-run-4.md section 16, FP-12). Built once
 * here, reused by the later first-run PRs. Plain objects and small functions: no module is mocked from this file, so
 * a test wires them in with its own `vi.mock` factory. Fictional family "Asha" only (CLAUDE.md); no real name,
 * transcript or audio appears in any fixture.
 */

/** Every network door the first screen could use. A call is recorded, then thrown: "no request was attempted" is `calls.length === 0`. */
export interface NetworkSpy {
  calls: string[];
  /** Put the throwing fetch on globalThis; returns the restore function. */
  install(): () => void;
}

export function throwingFetch(): NetworkSpy {
  const calls: string[] = [];
  return {
    calls,
    install() {
      const g = globalThis as { fetch?: unknown };
      const before = g.fetch;
      g.fetch = (input: unknown) => {
        calls.push(`fetch ${String(input)}`);
        throw new Error('network is not allowed in this test');
      };
      return () => {
        g.fetch = before;
      };
    },
  };
}

/** A Supabase client whose every method records its path and throws. `calls` holds paths such as `auth.getSession`. */
export function recordedSupabase(): { client: unknown; calls: string[] } {
  const calls: string[] = [];
  const make = (path: string): unknown =>
    new Proxy(() => {}, {
      get: (_t, key) => make(path ? `${path}.${String(key)}` : String(key)),
      apply: () => {
        calls.push(path);
        throw new Error(`supabase.${path} is not allowed in this test`);
      },
    });
  return { client: make(''), calls };
}

/** The Keychain (lib/supabase/secure-storage.ts `KeyValueStorage`) in memory. */
export function memoryKeychain(seed: Record<string, string> = {}) {
  const items = new Map(Object.entries(seed));
  return {
    items,
    getItem: async (k: string) => items.get(k) ?? null,
    setItem: async (k: string, v: string) => void items.set(k, v),
    removeItem: async (k: string) => void items.delete(k),
  };
}

/** The settings table (store.getSetting and friends) in memory. */
export function memorySettings(seed: Record<string, string> = {}) {
  const items = new Map(Object.entries(seed));
  return {
    items,
    getSetting: (k: string) => items.get(k) ?? null,
    setSetting: (k: string, v: string) => void items.set(k, v),
    deleteSetting: (k: string) => void items.delete(k),
  };
}

/**
 * Fakes for the two native modules whose real imports fail in the sandbox (8 baseline files). Each records what was
 * asked. Neither ever shows a prompt: `prompts` is the list a test asserts is empty.
 */
export function localAuthenticationFake() {
  const prompts: string[] = [];
  return {
    prompts,
    hasHardwareAsync: async () => true,
    isEnrolledAsync: async () => true,
    supportedAuthenticationTypesAsync: async () => [2],
    authenticateAsync: async () => {
      prompts.push('authenticate');
      return { success: true as const };
    },
  };
}

export function appleAuthenticationFake() {
  const prompts: string[] = [];
  return {
    prompts,
    isAvailableAsync: async () => true,
    signInAsync: async () => {
      prompts.push('apple sign-in');
      throw new Error('apple sign-in is not allowed in this test');
    },
  };
}

/** A fixed clock: 20 Nov 2026, 21:00 UTC. */
export const FIXED_NOW = Date.UTC(2026, 10, 20, 21, 0, 0);
export const fixedClock = () => FIXED_NOW;

/** The two fictional families. Asha A has one book and no session; Asha B has a session and no book. */
export const ASHA_A = { child: 'Asha', born: '2026-03-02', hasLocalBook: true, hasSession: false } as const;
export const ASHA_B = { child: 'Asha', born: '2026-03-02', hasLocalBook: false, hasSession: true } as const;
