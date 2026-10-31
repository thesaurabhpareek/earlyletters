/// <reference types="node" />
/** SET-04 and SET-05 (docs/reviews/2026-10-31/setup.md): the child step's words come from packages/content. */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { en } from '@scribe/content';

const onboarding = readFileSync(join(__dirname, '..', 'src', 'app', 'onboarding.tsx'), 'utf8');

describe('[SET-04] "Birthday" is said once, above the date', () => {
  it('the choice asks its own question, and its first option is "Born"', () => {
    expect(onboarding).toMatch(/<ChoiceGroup\s+label=\{o\.child\.bornQuestion\}/);
    expect(onboarding).toMatch(/\{ value: 'born', label: o\.child\.bornLabel \}/);
    expect(onboarding).not.toMatch(/\{ value: 'born', label: o\.child\.birthdayLabel \}/);
    expect(en.onboarding.child.bornLabel).toBe('Born');
    expect(en.onboarding.child.bornQuestion.length).toBeGreaterThan(0);
  });
});

describe('[SET-05] no English typed in the screen', () => {
  it('"your child" comes from onboarding.childFallback', () => {
    expect(onboarding).not.toMatch(/'your child'/);
    expect(onboarding.match(/o\.childFallback/g)?.length).toBeGreaterThanOrEqual(4);
    expect(en.onboarding.childFallback).toBe('your child');
  });
});
