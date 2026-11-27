/**
 * BL-1954 [PER4-019], BL-2241: the Listen ready line. The words on screen are always the sighted line
 * `listen.ready.hint` ("Tap the red circle and talk."), with or without a screen reader, so the line never flips when
 * `useScreenReader()` reads late. With a screen reader on, only the line's accessibilityLabel is
 * `listen.ready.hintScreenReader` ("Double tap Start recording and talk."). Screen reader state is a plain boolean
 * here; the screen passes `useScreenReader()` and the source check proves the wiring.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { readyLine } from '../src/components/capture/listen.logic';
import { copy } from '../src/lib/copy';

const screen = readFileSync(join(__dirname, '..', 'src', 'app', 'listen.tsx'), 'utf8');

describe('Listen ready line (BL-1954, BL-2241)', () => {
  it('BL-2241: the visible text is the same with and without a screen reader', () => {
    const on = readyLine(copy.listen.ready, true);
    const off = readyLine(copy.listen.ready, false);
    expect(on.text).toBe(off.text);
    expect(on.text).toBe('Tap the red circle and talk.');
    expect(on.text).toBe(copy.listen.ready.hint);
    expect(on.text).not.toBe(copy.listen.ready.hintScreenReader);
  });

  it('screen reader on: the label is the double tap line', () => {
    expect(readyLine(copy.listen.ready, true).label).toBe('Double tap Start recording and talk.');
    expect(readyLine(copy.listen.ready, true).label).toBe(copy.listen.ready.hintScreenReader);
  });

  it('screen reader off: the label is the sighted line, never hintScreenReader', () => {
    expect(readyLine(copy.listen.ready, false).label).toBe(copy.listen.ready.hint);
    expect(readyLine(copy.listen.ready, false).label).not.toBe(copy.listen.ready.hintScreenReader);
  });

  it('the screen draws the text as the line and passes the label only to accessibilityLabel', () => {
    expect(screen).toContain('useScreenReader()');
    expect(screen).toContain('readyLine(p.ready, screenReader)');
    // The visible line takes `.text` for the ready moment; the spoken words go through the label path only.
    expect(screen).toMatch(/room\.line === 'readyHint' \? ready\.text :/);
    expect(screen).toMatch(/const lineLabel = room\.line === 'readyHint' \? ready\.label : line;/);
    expect(screen).toMatch(/line: lineLabel,/);
    expect(screen).toMatch(/accessibilityLabel=\{labels\.line \?\? lineLabel/);
    // Never the spoken words as the drawn line, and never the ready strings read raw.
    expect(screen).not.toMatch(/'readyHint' \? ready\.label :\s*room\.line/);
    expect(screen).not.toContain('hintScreenReader');
    expect(screen).not.toMatch(/\?\s*p\.ready\.hint\s*:/);
  });
});
