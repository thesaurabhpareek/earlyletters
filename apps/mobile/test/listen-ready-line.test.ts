/**
 * BL-1954 [PER4-019]: with a screen reader on, the Listen ready line is `listen.ready.hintScreenReader` ("Double tap
 * Start recording and talk."); with it off, the sighted line `listen.ready.hint` is unchanged. Screen reader state is a
 * plain boolean here; the screen passes `useScreenReader()` and the source check proves it does.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { readyLine } from '../src/components/capture/listen.logic';
import { copy } from '../src/lib/copy';

const screen = readFileSync(join(__dirname, '..', 'src', 'app', 'listen.tsx'), 'utf8');

describe('Listen ready line (BL-1954)', () => {
  it('screen reader on: the ready line is the double tap line', () => {
    expect(readyLine(copy.listen.ready, true)).toBe('Double tap Start recording and talk.');
    expect(readyLine(copy.listen.ready, true)).toBe(copy.listen.ready.hintScreenReader);
  });

  it('screen reader off: the sighted line is unchanged', () => {
    expect(readyLine(copy.listen.ready, false)).toBe('Tap the red circle and talk.');
    expect(readyLine(copy.listen.ready, false)).toBe(copy.listen.ready.hint);
  });

  it('the screen chooses by the live screen reader state, and the ready line is not read raw', () => {
    expect(screen).toContain('useScreenReader()');
    expect(screen).toContain('readyLine(p.ready, screenReader)');
    expect(screen).not.toMatch(/\?\s*p\.ready\.hint\s*:/);
  });
});
