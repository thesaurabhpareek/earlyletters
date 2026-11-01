/**
 * SET-06 (comms validation, 31 Oct 2026): an English-only build does not ask the spoken-language question in setup.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { showOnboardingLanguageRow } from '../src/components/onboarding/language-row.logic';

describe('[SET-06] onboarding language row', () => {
  it('is hidden in an English-only build and shown otherwise', () => {
    expect(showOnboardingLanguageRow(true)).toBe(false);
    expect(showOnboardingLanguageRow(false)).toBe(true);
  });

  it('onboarding renders the row only through that rule', () => {
    const src = readFileSync(join(__dirname, '..', 'src', 'app', 'onboarding.tsx'), 'utf8');
    expect(src).toMatch(/\{showOnboardingLanguageRow\(capabilities\.englishOnly\) && \(\s*<View className="gap-4">\s*<Separator \/>\s*<ListSection>\s*<ListRow\s+title=\{copy\.settingsHome\.languageLabel\}/);
  });
});
