/** The moments engine in this folder is pure (NS-53-R27, R36): no clock, no random source, no platform import. */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const DIR = join(__dirname, '..', '..', 'src', 'moments');

describe('[NS-53-R27] occasions, holidays, registry and slots are pure', () => {
  it.each(['occasions.ts', 'holidays.ts', 'registry.ts', 'slots.ts', 'plan.ts'])('%s reads no clock, random, Intl, platform or storage', (f) => {
    const src = readFileSync(join(DIR, f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    expect(src).not.toMatch(/Date\.now|new Date\(\s*\)|Math\.random|Intl\.|performance\.now|toLocale/);
    expect(src).not.toMatch(/from\s+['"](react|react-native|expo|node:|fs|path)/);
    expect(src).not.toMatch(/\b(fetch|localStorage|process\.env)\b/);
    expect(readFileSync(join(DIR, f), 'utf8')).not.toMatch(/[^\x00-\x7F]/);
  });
});
