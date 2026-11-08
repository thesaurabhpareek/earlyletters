import { afterEach, describe, expect, it, vi } from 'vitest';
import { tap } from '../src/lib/haptics';

afterEach(() => vi.unstubAllGlobals());

describe('haptic taps', () => {
  it('does nothing and does not throw where there is no Vibration API', () => {
    vi.stubGlobal('navigator', {});
    expect(() => tap('light')).not.toThrow();
  });

  it('vibrates briefly where it can, and with a pattern for success', () => {
    const vibrate = vi.fn();
    vi.stubGlobal('navigator', { vibrate });
    vi.stubGlobal('window', { matchMedia: () => ({ matches: false }) });
    tap('light');
    tap('success');
    expect(vibrate).toHaveBeenNthCalledWith(1, 8);
    expect(vibrate).toHaveBeenNthCalledWith(2, [10, 40, 16]);
  });

  it('stays still when the visitor prefers reduced motion', () => {
    const vibrate = vi.fn();
    vi.stubGlobal('navigator', { vibrate });
    vi.stubGlobal('window', { matchMedia: () => ({ matches: true }) });
    tap('success');
    expect(vibrate).not.toHaveBeenCalled();
  });

  it('survives a browser that throws', () => {
    vi.stubGlobal('navigator', { vibrate: () => { throw new Error('blocked'); } });
    vi.stubGlobal('window', { matchMedia: () => ({ matches: false }) });
    expect(() => tap('light')).not.toThrow();
  });
});
