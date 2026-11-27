/// <reference types="node" />
/**
 * [BL-372, D-084] Write opens on an empty page. The old "Dear {child}," ghost put a greeting the person never wrote
 * in front of their letter; D-084 removed it. The hint in the field is the registered placeholder, which greets no
 * one and names no child, and the field starts from the person's own draft or nothing. Fictional family Asha only.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { en } from '@scribe/content';

const write = readFileSync(join(__dirname, '..', 'src', 'app', 'write.tsx'), 'utf8');

describe('[BL-372, D-084] no "Dear {child}," ghost in Write', () => {
  it('the field hint is the registered placeholder, and it is not a greeting', () => {
    expect(write).toContain('placeholder={copy.tonight.typing.placeholder}');
    const hint = en.tonight.typing.placeholder;
    expect(hint).not.toMatch(/\bdear\b/i);
    expect(hint).not.toContain('{child}');
    expect(hint).not.toMatch(/,\s*$/);
  });

  it('the page starts from the person\'s own draft or empty, never from a written opening', () => {
    expect(write).toContain("useState(existing?.typedText ?? '')");
    // What seeds the field is its defaultValue, and it is the draft held above, with nothing added in front.
    expect(write).toMatch(/defaultValue=\{\s*initialText\s*\}/);
    expect(write.match(/defaultValue=/g)).toHaveLength(1);
    expect(write).not.toMatch(/\bDear\b/);
    expect(write).not.toMatch(/placeholder=\{?['"`]/);
  });

  it('the field is uncontrolled: no value prop can put words in it that the person did not type (D-057)', () => {
    // Review A note 2 on #2184: a controlled `value=` greeting beside `defaultValue` passed the pins above.
    const code = write.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
    const start = code.indexOf('<TextField');
    expect(start).toBeGreaterThan(-1);
    expect(code.indexOf('<TextField', start + 1)).toBe(-1); // one field on the page
    const field = code.slice(start, code.indexOf('/>', start) + 2);
    expect(field).toContain('defaultValue={initialText}');
    expect(field).not.toMatch(/\svalue=/);
  });
});
