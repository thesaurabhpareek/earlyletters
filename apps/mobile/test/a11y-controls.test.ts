/// <reference types="node" />
/**
 * BL-409 (LEGAL-REQ-051), the "CI fails on an unlabeled icon-only control" half. Like a11y-lint.test.ts this reads
 * source text and loads nothing from React Native, so it runs in the existing unit job and needs no workflow change.
 *
 * Rule C1: a `<Pressable>` / `<TouchableOpacity>` / `<TouchableHighlight>` needs a name: an `accessibilityLabel` or
 *   `aria-label`, a prop spread, visible text inside it, or `accessible={false}` (a clear layer that is not a control).
 * Rule C2: a `<Button>` with an `icon` and no `label` needs an `accessibilityLabel`.
 * The rendered names (roles, order) are exported by the journey run: e2e-web/support/a11y-tree.ts.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = join(__dirname, '..', 'src');
const strip = (t: string) => t.replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

function walk(dir: string, out: string[] = []): string[] {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.tsx$/.test(n) && !/\.test\.tsx$/.test(n)) out.push(p);
  }
  return out;
}

/** End of the opening tag that starts at `at` (the `>` outside braces; `=>` inside a prop does not count). */
function tagEnd(s: string, at: number): number {
  let d = 0;
  for (let i = at; i < s.length; i++) {
    const c = s[i];
    if (c === '{') d++;
    else if (c === '}') d--;
    else if (c === '>' && d === 0 && s[i - 1] !== '=') return i;
  }
  return s.length - 1;
}

const NAMED = /accessibilityLabel|aria-label|\{\.\.\./;
const NOT_A_CONTROL = /accessible=\{\s*false\s*\}/;
const HAS_TEXT = /<(Text|AppText)\b/;

/** Controls in `source` (comments already stripped) that break C1 or C2, as `line:Tag`. */
export function unnamedIn(source: string): string[] {
  const bad: string[] = [];
  for (const m of source.matchAll(/<(Pressable|TouchableOpacity|TouchableHighlight|Button)\b/g)) {
    const end = tagEnd(source, m.index);
    const tag = source.slice(m.index, end + 1);
    const line = source.slice(0, m.index).split('\n').length;
    if (m[1] === 'Button') {
      if (/\bicon=/.test(tag) && !/\blabel=/.test(tag) && !NAMED.test(tag)) bad.push(`${line}:Button`);
      continue;
    }
    if (NAMED.test(tag) || NOT_A_CONTROL.test(tag)) continue;
    const body = tag.endsWith('/>') ? '' : source.slice(end + 1, Math.max(end + 1, source.indexOf(`</${m[1]}>`, end)));
    if (!HAS_TEXT.test(body)) bad.push(`${line}:${m[1]}`);
  }
  return bad;
}

describe('BL-409 icon-only controls are named (self-checks)', () => {
  it('[BL-409] catches an icon-only Pressable and a Button with an icon and no name', () => {
    expect(unnamedIn('<Pressable onPress={go}>\n  <Icon name="x" />\n</Pressable>')).toEqual(['1:Pressable']);
    expect(unnamedIn('<TouchableOpacity onPress={() => go()} />')).toEqual(['1:TouchableOpacity']);
    expect(unnamedIn('<Button icon={Gear} onPress={go} />')).toEqual(['1:Button']);
  });
  it('[BL-409] passes a named control, one with text, a spread, and a clear layer', () => {
    expect(unnamedIn('<Pressable accessibilityLabel="Close" onPress={go}><Icon /></Pressable>')).toEqual([]);
    expect(unnamedIn('<Pressable aria-label="Close" onPress={go}><Icon /></Pressable>')).toEqual([]);
    expect(unnamedIn('<Pressable onPress={go}><Text>Aa</Text></Pressable>')).toEqual([]);
    expect(unnamedIn('<Pressable {...rest} />')).toEqual([]);
    expect(unnamedIn('<Pressable onPress={go} accessible={false} />')).toEqual([]);
    expect(unnamedIn('<Button icon={Gear} accessibilityLabel="Settings" onPress={go} />')).toEqual([]);
    expect(unnamedIn('<Button icon={Gear} label="Settings" onPress={go} />')).toEqual([]);
  });
});

describe('BL-409 icon-only controls are named (the source tree)', () => {
  const files = walk(SRC).map((p) => ({ rel: relative(SRC, p).split('\\').join('/'), text: strip(readFileSync(p, 'utf8')) }));
  it('[BL-409] every control in apps/mobile/src has a name, text, or is not a control', () => {
    expect(files.length).toBeGreaterThan(100);
    const bad = files.flatMap((f) => unnamedIn(f.text).map((b) => `${f.rel}:${b}`));
    expect(bad, 'give the control an accessibilityLabel (the words are PROPOSED content until the founder approves them)').toEqual([]);
  });
});
