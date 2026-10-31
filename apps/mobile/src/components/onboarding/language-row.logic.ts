/**
 * Whether first-run setup shows the spoken-language row (comms validation SET-06, 31 Oct 2026).
 *
 * In an English-only build (capabilities.englishOnly) the picker can list only English, so the row would add a
 * decision with one answer and a "coming later" promise to setup. It is hidden there. Settings, Language still
 * shows the row and says the same thing, so nothing is lost; the stored language stays the default (English).
 */
export function showOnboardingLanguageRow(englishOnly: boolean): boolean {
  return !englishOnly;
}
