/**
 * Strings for the consent sheet and Settings > Privacy that are not yet in
 * packages/content. The content agent moves them into strings.en.ts
 * (suggested keys in the comments). Content rules apply here too: the rules
 * test scans this file.
 */
export const consentCopy = {
  // analyticsSection moved to packages/content settings.privacy.analyticsSection (no crash SDK in v1.0, DEBATES Q-012/Q-013)
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
