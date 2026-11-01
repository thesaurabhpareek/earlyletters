/**
 * haptics.shared: the one vocabulary and throttle behind haptic() on iOS and Android
 * (COMPONENTS 0.2, MOTION 6, TDD 09 2.10). Ticks are throttled to one per 100 ms;
 * outcomes (success, warning) are never dropped and reset the throttle.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { resetHapticThrottle, shouldPlay, type HapticIntent } from './haptics.shared';

const TICKS: HapticIntent[] = ['tap', 'press', 'soft'];
const OUTCOMES: HapticIntent[] = ['success', 'warning'];

describe('haptics.shared shouldPlay', () => {
  beforeEach(() => resetHapticThrottle());

  it('plays the first tick of each kind', () => {
    for (const intent of TICKS) {
      resetHapticThrottle();
      expect(shouldPlay(intent, 10_000)).toBe(true);
    }
  });

  it('drops a second tick inside 100 ms, whatever its kind', () => {
    expect(shouldPlay('tap', 10_000)).toBe(true);
    expect(shouldPlay('tap', 10_050)).toBe(false);
    expect(shouldPlay('press', 10_099)).toBe(false);
    expect(shouldPlay('soft', 10_099)).toBe(false);
  });

  it('plays a tick again at exactly 100 ms and after', () => {
    expect(shouldPlay('tap', 10_000)).toBe(true);
    expect(shouldPlay('tap', 10_100)).toBe(true);
    expect(shouldPlay('tap', 10_250)).toBe(true);
  });

  it('a dropped tick does not extend the window', () => {
    expect(shouldPlay('tap', 10_000)).toBe(true);
    expect(shouldPlay('tap', 10_060)).toBe(false);
    expect(shouldPlay('tap', 10_100)).toBe(true);
  });

  it('never drops an outcome, even right after a tick (TDD 09 2.10: a tap then success)', () => {
    for (const intent of OUTCOMES) {
      resetHapticThrottle();
      expect(shouldPlay('tap', 10_000)).toBe(true);
      expect(shouldPlay(intent, 10_001)).toBe(true);
      expect(shouldPlay(intent, 10_002)).toBe(true);
    }
  });

  it('an outcome resets the throttle, so a tick right after it is dropped', () => {
    expect(shouldPlay('success', 20_000)).toBe(true);
    expect(shouldPlay('tap', 20_040)).toBe(false);
    expect(shouldPlay('tap', 20_100)).toBe(true);
  });

  it('resetHapticThrottle clears the window', () => {
    expect(shouldPlay('tap', 30_000)).toBe(true);
    resetHapticThrottle();
    expect(shouldPlay('tap', 30_001)).toBe(true);
  });
});
