import { describe, expect, it } from 'vitest';
import { statusKey } from './status-key.logic';

describe('Spoken language row E2E state (G-29)', () => {
  it('names each pack state the way the Maestro flows expect', () => {
    expect(statusKey({ state: 'bundled' })).toBe('bundled');
    expect(statusKey({ state: 'installed', bytes: 7000 })).toBe('installed');
    expect(statusKey({ state: 'downloading', bytesDone: 1, bytesTotal: 2 })).toBe('downloading');
    expect(statusKey({ state: 'absent', bytes: null })).toBe('absent');
    expect(statusKey({ state: 'waiting', reason: 'offline', bytes: null })).toBe('waiting-offline');
    expect(statusKey({ state: 'waiting', reason: 'waiting_for_wifi', bytes: 10 })).toBe('waiting-waiting_for_wifi');
    expect(statusKey(undefined)).toBe('unknown');
  });
});
