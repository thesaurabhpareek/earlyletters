// Shared helpers for the documentation scripts. Plain Node 22, no dependencies.
import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

/** `---` frontmatter with `key: value` and `key: [a, b]` lines. Returns { data, body }. */
export function frontmatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!m) return { data: {}, body: text };
  const data = {};
  for (const line of m[1].split("\n")) {
    const kv = line.match(/^([a-z_]+):\s*(.*)$/i);
    if (!kv) continue;
    const v = kv[2].trim();
    data[kv[1]] = v.startsWith("[") && v.endsWith("]")
      ? v.slice(1, -1).split(",").map((s) => s.trim().replace(/^["']|["']$/g, "")).filter(Boolean)
      : v.replace(/^["']|["']$/g, "");
  }
  return { data, body: text.slice(m[0].length) };
}

/** Minimal glob: `**` any path, `*` any run inside one segment, `?` one character. */
export function globToRegExp(glob) {
  let re = "";
  for (let i = 0; i < glob.length; i++) {
    const ch = glob[i];
    if (ch === "*" && glob[i + 1] === "*") {
      re += glob[i + 2] === "/" ? "(?:.*/)?" : ".*";
      i += glob[i + 2] === "/" ? 2 : 1;
    } else if (ch === "*") re += "[^/]*";
    else if (ch === "?") re += "[^/]";
    else re += ch.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  }
  return new RegExp(`^${re}$`);
}

export const matchesAny = (file, globs) => (globs ?? []).some((g) => globToRegExp(g).test(file));

export function git(args, root = ROOT) {
  return execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

/** Files changed between a commit and HEAD, or null when the commit is unknown here. */
export function changedSince(sha, root = ROOT) {
  if (!sha || !/^[0-9a-f]{7,40}$/i.test(sha)) return null;
  try {
    git(["cat-file", "-e", `${sha}^{commit}`], root);
  } catch {
    return null;
  }
  const out = git(["diff", "--name-only", `${sha}..HEAD`], root);
  return out ? out.split("\n") : [];
}

export const today = (d = new Date()) => d.toISOString().slice(0, 10);

/** Replace the body of every `<!-- facts:NAME -->` ... `<!-- /facts:NAME -->` block. */
export function fillBlocks(text, render) {
  return text.replace(/(<!-- facts:([a-z-]+) -->\n)([\s\S]*?)(<!-- \/facts:\2 -->)/g, (_, open, name, _old, close) => {
    const body = render(name);
    return body === undefined ? `${open}_unknown facts block "${name}"_\n${close}` : `${open}${body}\n${close}`;
  });
}

export const blockNames = (text) => [...text.matchAll(/<!-- facts:([a-z-]+) -->/g)].map((m) => m[1]);
