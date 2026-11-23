/**
 * BL-495 point 1: drawing the recovery screen never opens the store (an open runs the update steps again).
 * Reading the saved appearance on that screen uses getSettingIfOpen, which only reads an open connection.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

const opens = vi.hoisted(() => ({ n: 0 }));
vi.mock('expo-crypto', () => ({ getRandomBytes: (n: number) => new Uint8Array(n).fill(7) }));
vi.mock('../src/lib/db/repos/open-native', async () => {
  const { nodeDb: make } = await import('./helpers/node-db');
  return {
    openNativeDb: () => {
      opens.n += 1;
      const { db, close } = make();
      return { db, close };
    },
  };
});

import { closeStore, getSettingIfOpen, openStore, setSetting } from '../src/lib/store';

afterEach(() => {
  closeStore();
  opens.n = 0;
});

describe('getSettingIfOpen', () => {
  it('returns null and makes no open attempt while the store is closed', () => {
    expect(getSettingIfOpen('appearance')).toBeNull();
    expect(getSettingIfOpen('appearance')).toBeNull();
    expect(opens.n).toBe(0);
  });

  it('reads the saved value once the store is open', () => {
    expect(openStore().ok).toBe(true);
    setSetting('appearance', 'dark');
    expect(getSettingIfOpen('appearance')).toBe('dark');
    expect(opens.n).toBe(1);
  });
});

describe('PlainScreen reads the appearance without the store', () => {
  const src = readFileSync(join(__dirname, '..', 'src/components/resilience/plain-screen.tsx'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  it('imports getSettingIfOpen, not getSetting', () => {
    expect(src).toMatch(/import \{ getSettingIfOpen \} from '@\/lib\/store'/);
    expect(src).not.toMatch(/\bgetSetting\(/);
  });
});
