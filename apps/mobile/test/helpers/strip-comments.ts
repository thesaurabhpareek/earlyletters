/**
 * Source-scan tests read a file as text and look for wiring in it. A line that
 * was commented out must not satisfy them, so they match against this output.
 * Removes `//` line comments and block comments; leaves string and template
 * literals alone, so a `//` inside a quoted path survives. Newlines are kept so
 * offsets stay close to the original.
 */
export function stripComments(source: string): string {
  let out = '';
  let i = 0;
  while (i < source.length) {
    const c = source[i];
    const next = source[i + 1];
    if (c === '"' || c === "'" || c === '`') {
      let j = i + 1;
      while (j < source.length && source[j] !== c) j += source[j] === '\\' ? 2 : 1;
      out += source.slice(i, j + 1);
      i = j + 1;
    } else if (c === '/' && next === '/') {
      while (i < source.length && source[i] !== '\n') i += 1;
    } else if (c === '/' && next === '*') {
      const end = source.indexOf('*/', i + 2);
      const stop = end === -1 ? source.length : end + 2;
      out += source.slice(i, stop).replace(/[^\n]/g, '');
      i = stop;
    } else {
      out += c;
      i += 1;
    }
  }
  return out;
}
