/**
 * Strings for the consent sheet and Settings > Privacy that are not yet in
 * packages/content. The content agent moves them into strings.en.ts
 * (suggested keys in the comments). Content rules apply here too: the rules
 * test scans this file.
 */
export const consentCopy = {
  // settings.privacy.analyticsSection
  analyticsSection: 'Usage and crash reports',
  // settings.privacy.sensitiveSection
  sensitiveSection: 'Your letters',
  // settings.privacy.neverTitle
  neverTitle: 'What we never do',
  // settings.privacy.never[]
  never: [
    'We never show ads, and your letters are never used for advertising.',
    'We never sell your data.',
    'We never use your words, recordings or photos to train machine learning models.',
  ],
  // settings.privacy.childFallback: fills {child} in sensitiveHelp when no book exists yet.
  childFallback: 'your child',
} as const;
