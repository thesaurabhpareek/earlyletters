/**
 * Strings for the consent sheet and Settings > Privacy that are not yet in
 * packages/content. The content agent moves them into strings.en.ts
 * (suggested keys in the comments). Content rules apply here too: the rules
 * test scans this file.
 */
export const consentCopy = {
  // settings.privacy.analyticsSection
  analyticsSection: 'Usage',
  // settings.privacy.sensitiveSection
  sensitiveSection: 'Your letters',
  // The "What we never do" list (neverTitle, never[]) retired 8 Nov 2026 (CPrivO-5): Settings, Privacy opens with
  // `trust.promise` word for word, and the list's third line named photos, which v1.0 does not have (M13 rule 4).
  // settings.privacy.childFallback: fills {child} in sensitiveHelp when no book exists yet.
  childFallback: 'your child',
} as const;
