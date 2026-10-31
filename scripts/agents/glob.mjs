// The one glob matcher for the harness (lib.mjs and pathguard.mjs both use it).
// `**` any path, `**/` zero or more directories, `*` any run inside one segment, `?` one character.
// No imports, so standalone scripts can load it.

/** @param {string} glob  @param {{ignoreCase?: boolean}} [opts] ignoreCase lower-cases the glob; the caller lower-cases the path. */
export function globToRegExp(glob, { ignoreCase = false } = {}) {
  const g = ignoreCase ? glob.toLowerCase() : glob;
  let re = "";
  for (let i = 0; i < g.length; i++) {
    const ch = g[i];
    if (ch === "*" && g[i + 1] === "*") {
      re += g[i + 2] === "/" ? "(?:.*/)?" : ".*";
      i += g[i + 2] === "/" ? 2 : 1;
    } else if (ch === "*") re += "[^/]*";
    else if (ch === "?") re += "[^/]";
    else re += ch.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  }
  return new RegExp(`^${re}$`);
}
