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
const at = screen.indexOf('const letGo = () => {\n    if (!draft) return;');
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

  it('the confirm reads the result inside a try, and any throw counts as not removed', () => {
    const iCall = handler.indexOf('gone = letItGo(');
    expect(handler).toMatch(/let gone = false;\s*try \{\s*gone = letItGo\(id, uri, /);
    expect(handler).toMatch(/\} catch \{\s*gone = false;/);
    expect(handler).toMatch(/if \(!gone\) \{\s*setLetGoPending\(true\);\s*return;\s*\}\s*setLetGoPending\(false\);/);
    // result read, then the failure return, then (and only then) the way out
    const iFail = handler.indexOf('if (!gone)');
    const iLeave = handler.indexOf('router.back()');
    expect(iCall).toBeGreaterThan(-1);
    expect(iCall).toBeLessThan(iFail);
    expect(iFail).toBeLessThan(iLeave);
    expect(handler.indexOf('router.replace')).toBeGreaterThan(iFail);
  });

  it('a throw from the begin or finish step is not silent either (same rule, run for real)', () => {
    for (const which of ['beginDiscard', 'finishDiscard'] as const) {
      const steps = {
        beginDiscard: () => {
          if (which === 'beginDiscard') throw new Error('db');
          return true;
        },
        deleteFile: () => undefined,
        finishDiscard: () => {
          if (which === 'finishDiscard') throw new Error('db');
          return true;
        },
      };
      expect(() => letItGo('d1', 'file:///asha.m4a', steps)).toThrow();
    }
  });

  it('the line and the told-once guard reset when the recording changes', () => {
    expect(screen).toMatch(/useEffect\(\(\) => \{\s*setLetGoPending\(false\);\s*letGoTold\.current = null;\s*\}, \[draft\?\.id\]\);/);
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
