#!/usr/bin/env node
// Prototype gate for the docs-links lane: lists relative Markdown links in
// docs/**/*.md whose target file does not exist. Read only. No network.
//   node linkcheck.mjs <repo root> [--json]
import { readFileSync, existsSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join, resolve, relative } from "node:path";

export function linksIn(text) {
  const out = [];
  // Skip fenced code blocks so examples are not counted.
  let fenced = false;
  text.split("\n").forEach((line, i) => {
    if (/^\s*```/.test(line)) { fenced = !fenced; return; }
    if (fenced) return;
    for (const m of line.matchAll(/(?<!!)\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)) {
      const href = m[1];
      if (/^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith("#") || href.startsWith("<")) continue;
      out.push({ line: i + 1, href });
    }
  });
  return out;
}

export function broken(root, files) {
  const res = [];
  for (const f of files) {
    const text = readFileSync(join(root, f), "utf8");
    for (const { line, href } of linksIn(text)) {
      const path = decodeURIComponent(href.split("#")[0]);
      if (!path) continue;
      const target = path.startsWith("/") ? join(root, path) : resolve(dirname(join(root, f)), path);
      if (!existsSync(target)) res.push({ file: f, line, href });
    }
  }
  return res;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const root = resolve(process.argv[2] ?? ".");
  const files = execFileSync("git", ["-C", root, "ls-files", "docs/**/*.md", "docs/*.md"], { encoding: "utf8" }).split("\n").filter(Boolean);
  const b = broken(root, files);
  if (process.argv.includes("--json")) console.log(JSON.stringify(b, null, 2));
  else { for (const x of b) console.log(`${x.file}:${x.line} ${x.href}`); console.log(`${b.length} broken relative links in ${files.length} files`); }
  process.exit(b.length ? 1 : 0);
}
