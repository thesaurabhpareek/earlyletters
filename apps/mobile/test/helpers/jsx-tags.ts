/**
 * Each `<Name ...>` opening tag in a source, read to its closing `>` outside braces and strings, so a prop whose
 * value is JSX (`accessory={<Icon />}`) or holds `>` does not end the tag early. A name followed by a word character
 * or a dot (`<StateScreenView` when asking for `StateScreen`, `<Foo.Bar`) is a different tag and is not read.
 */
export function openingTags(source: string, name: string): string[] {
  const tags: string[] = [];
  const re = new RegExp(`<${name}(?![\\w.])`, 'g');
  for (let m = re.exec(source); m; m = re.exec(source)) {
    let depth = 0;
    let quote: string | null = null;
    let i = m.index + m[0].length;
    for (; i < source.length; i++) {
      const ch = source[i];
      if (quote) {
        if (ch === quote && source[i - 1] !== '\\') quote = null;
      } else if (ch === '"' || ch === "'" || ch === '`') quote = ch;
      else if (ch === '{') depth++;
      else if (ch === '}') depth--;
      else if (ch === '>' && depth === 0) break;
    }
    tags.push(source.slice(m.index, i + 1));
  }
  return tags;
}
