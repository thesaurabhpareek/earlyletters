/// <reference types="node" />
/**
 * [PER4-018, BL-1953] Each screen that left the live-region baseline speaks the same line its live region shows.
 * iOS VoiceOver ignores accessibilityLiveRegion, so announce() carries it there; Android keeps the live region.
 * The screens need a phone to render, so this reads the source: the announce() argument must be the text the
 * live region renders, it must run from an effect keyed on that text (spoken when it appears or changes, not on
 * every render), and the live region must still be there for TalkBack. Whether VoiceOver says it is a device check.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (rel: string) => readFileSync(join(__dirname, '..', rel), 'utf8');

/** [file, announced expression, effect dependency] */
const WIRED: [string, string, string][] = [
  ['src/app/family.tsx', 'announce(text)', '[text]'],
  ['src/app/settings/backup.tsx', 'announce(restoreSpoken)', '[restoreSpoken]'],
  ['src/app/settings/backup.tsx', 'announce(t.turnOnFailed)', '[failed]'],
  ['src/app/settings/plus.tsx', 'announce(restoredText)', '[restoredText]'],
  ['src/app/settings/plus.tsx', 'announce(notice)', '[notice]'],
  ['src/app/settings/storage.tsx', 'announce(phaseLine)', '[phaseLine]'],
  ['src/components/child/child-editors.tsx', 'announce(children)', '[children]'],
];

describe('[PER4-018] converted screens announce what their live region shows', () => {
  for (const [file, call, deps] of WIRED) {
    it(`${file}: ${call} runs in an effect keyed on ${deps}`, () => {
      const src = read(file);
      expect(src).toMatch(/import \{[^}]*\bannounce\b[^}]*\} from '@\/lib\/a11y'/);
      const at = src.indexOf(call);
      expect(at, `${call} missing`).toBeGreaterThan(-1);
      const effect = src.lastIndexOf('useEffect(() => {', at);
      expect(effect).toBeGreaterThan(-1);
      expect(src.slice(effect, at)).not.toContain('});'); // the call sits inside that effect
      expect(src.slice(at, at + 120)).toContain(`}, ${deps});`);
      expect(src).toMatch(/accessibilityLiveRegion="polite"/);
    });
  }

  it('storage speaks the phase, not the running byte count', () => {
    const src = read('src/app/settings/storage.tsx');
    expect(src).toContain('progressLine({ ...pack, bytesDone: 0, bytesTotal: 0 })');
  });

  it('backup does not speak the sign-in row, which is a button', () => {
    expect(read('src/app/settings/backup.tsx')).toContain("view?.restore?.kind === 'sign_in_again' ? null : restore");
  });
});
