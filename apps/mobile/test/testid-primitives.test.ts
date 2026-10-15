/**
 * G-29: the shared UI primitives forward an E2E `testID`
 * (apps/mobile/e2e/TESTID_REQUESTS.md section 1), so screens can add ids
 * without wrapping. The Maestro flows select only by these ids, never by
 * words from packages/content. testIDs become accessibilityIdentifier on
 * iOS, which VoiceOver never reads. Source-level checks: these components
 * need React Native, which the Node test run does not load.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const UI = join(__dirname, '..', 'src', 'components', 'ui');
const read = (file: string) => readFileSync(join(UI, file), 'utf8');

/** The source of one exported function, up to the next top-level export or function. */
function fn(src: string, name: string): string {
  const start = src.search(new RegExp(`(export )?function ${name}\\b`));
  expect(start, name).toBeGreaterThan(-1);
  const rest = src.slice(start + 1);
  const next = rest.search(/\n(export )?(function|const|type) /);
  return next === -1 ? rest : rest.slice(0, next);
}

describe('[G-29] primitives forward testID', () => {
  it('ListRow puts it on the pressable and on the static row', () => {
    const body = fn(read('list-row.tsx'), 'ListRow');
    expect(body).toMatch(/testID \}: ListRowProps/);
    expect(body.match(/testID=\{testID\}/g)?.length).toBe(2);
  });

  it('ToggleRow puts it on the switch', () => {
    expect(fn(read('list-row.tsx'), 'ToggleRow')).toMatch(/<Toggle [^>]*testID=\{testID\}/);
  });

  it('ChoiceGroup sets it on the group and derives one per option', () => {
    const src = read('choice-group.tsx');
    const body = fn(src, 'ChoiceGroup');
    expect(body).toMatch(/optionTestID \?\? \(testID && `\$\{testID\}\.\$\{v\}`\)/);
    expect(body).toMatch(/accessibilityRole="radiogroup"[\s\S]*testID=\{testID\}/);
    expect(fn(src, 'SegmentChoice')).toMatch(/testID=\{testID\}/);
    expect(fn(src, 'ListChoice')).toMatch(/testID=\{testID\}/);
  });

  it('Chip sets it on both the tag and the pressable form', () => {
    expect(fn(read('choice-group.tsx'), 'Chip').match(/testID=\{testID\}/g)?.length).toBe(2);
  });

  it('Sheet sets it on the body and closeTestID on its Close button', () => {
    const body = fn(read('sheet.tsx'), 'Sheet');
    expect(body).toMatch(/accessibilityViewIsModal\s+testID=\{testID\}/);
    expect(body).toMatch(/label=\{copy\.common\.closeButton\}[^>]*testID=\{closeTestID\}/);
  });

  it("Toast forwards the action's testID to its button", () => {
    const src = read('toast.tsx');
    expect(src).toMatch(/action\?: \{ label: string; onPress: \(\) => void; testID\?: string \}/);
    expect(src).toMatch(/testID=\{action\.testID\}/);
  });
});
