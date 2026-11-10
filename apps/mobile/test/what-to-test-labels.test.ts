/**
 * The build 1 "What to Test" text (packages/content release/testflight.en.ts) names two labels that live in the app, not in
 * `en`: the Book's "Months" button and Settings' "App lock" row. If either is renamed, the text a tester reads would send
 * them looking for a label that is gone, and the content package's own test cannot see it. If this fails, fix the text
 * (or the label, with the content agent), not the test. Fictional family "Asha" only; no family details here.
 */
import { describe, expect, it } from 'vitest';
import { testflightCopy } from '@scribe/content';
import { bookCopy } from '@/components/book/copy';
import { appLockCopy } from '@/lib/app-lock/copy';

describe('[CMO 9 Nov] the build 1 What to Test text names the labels the app has', () => {
  const { build1 } = testflightCopy.whatToTest;

  it('quotes the Book\'s Months button as the app labels it', () => {
    expect(build1).toContain(`the "${bookCopy.monthsButton}" button`);
  });

  it('names the App lock row as Settings labels it', () => {
    expect(build1).toContain(`${appLockCopy.settingsHome.appLock} under`);
    expect(build1).toMatch(new RegExp(`Settings, [^.]*, ${appLockCopy.settingsHome.appLock}\\.`));
  });
});
