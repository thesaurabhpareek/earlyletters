// BL-424: the promise screen's button is the plain word, like every other first-run step (J01-04).
import { describe, expect, it } from 'vitest';
import { en } from '../src';

describe('BL-424 promise screen button', () => {
  it('reads Continue', () => {
    expect(en.onboarding.promise.cta).toBe('Continue');
  });
  it('matches the other first-run steps', () => {
    expect(en.onboarding.promise.cta).toBe(en.onboarding.child.cta);
  });
});
