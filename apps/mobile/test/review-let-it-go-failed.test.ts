/// <reference types="node" />
/**
 * BL-926 (NS-09-R4a, R4b): "Let it go" confirmed, but the phone would not remove the file. Review used to ignore what
 * letItGo returns and walk away, so a failed removal was silent. Now Review stays, says the existing line once (muted,
 * wrapping at any text size) and tells VoiceOver once. Node cannot load React Native, so the screen is read as source,
 * as in review-put-back-note.test.ts; the rule it leans on (false when the file stays) runs for real. Asha only.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { deleteIfPresent, letItGo } from '../src/lib/capture/let-it-go.logic';

const screen = readFileSync(join(__dirname, '..', 'src', 'app', 'review.tsx'), 'utf8');
const at = screen.indexOf('const letGo = () =>');
const handler = screen.slice(at, screen.indexOf('// Mini player', at));
const lineAt = screen.indexOf('testID="review.letGoPending"');
const line = screen.slice(screen.lastIndexOf('<Text', lineAt), screen.indexOf('</Text>', lineAt));

describe('[BL-926] a failed Let it go is not silent', () => {
  it('letItGo is false when the file will not delete, and the row stays marked', () => {
    const calls: string[] = [];
    const ok = letItGo('d1', 'file:///asha.m4a', {
      beginDiscard: () => true,
      deleteFile: () => {
        throw new Error('io');
      },
      finishDiscard: () => {
        calls.push('finish');
        return true;
      },
    });
    expect(ok).toBe(false);
    expect(calls).toEqual([]);
    expect(deleteIfPresent({ exists: false, delete: () => undefined })).toBeUndefined();
  });

  it('the confirm reads the result, and only leaves Review when the recording is gone', () => {
    expect(handler).toMatch(/const (?:gone|removed) = letItGo\(/);
    expect(handler).toMatch(/if \(!(?:gone|removed)\) \{\s*setLetGoPending\(true\);\s*return;\s*\}/);
    expect(handler.indexOf('router.back()')).toBeGreaterThan(handler.indexOf('setLetGoPending(true)'));
  });

  it('shows the existing review.letGoPending line, muted, with the app name filled, never clipped', () => {
    expect(screen).toMatch(/\{letGoPending && \(/);
    expect(line).toContain('tone="muted"');
    expect(line).toMatch(/fill\(r\.letGoPending, \{ app: brand\.name \}\)/);
    expect(line).not.toMatch(/numberOfLines|ellipsizeMode|adjustsFontSizeToFit|maxFontSizeMultiplier/);
  });

  it('tells VoiceOver once per recording on this visit', () => {
    expect(screen).toMatch(/useEffect\(\(\) => \{\s*if \(!letGoPending \|\| letGoTold\.current === draft\?\.id\) return;\s*letGoTold\.current = draft\?\.id \?\? null;\s*announce\(fill\(r\.letGoPending, \{ app: brand\.name \}\)\);/);
  });
});
