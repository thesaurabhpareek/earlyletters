#!/usr/bin/env node
// Tone lint for harness documents. Read-only: it reads Markdown files and prints findings.
// The only file it ever writes is the baseline, and only with --update-baseline.
// No network, no shell, no child processes. Rules: docs/agents/WRITING-STYLE.md.
//
//   node scripts/agents/tone-lint.mjs [paths...]   default path: docs/agents
//   --json              machine-readable output
//   --check             exit 1 on a hard finding missing from the baseline, or a stale baseline entry
//   --baseline <file>   default docs/agents/tone-baseline.txt
//   --update-baseline   write the baseline; refuses to add or grow an entry once the file exists
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, resolve, relative, sep, isAbsolute } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(new URL("../..", import.meta.url)));
export const DEFAULT_PATH = "docs/agents";
export const DEFAULT_BASELINE = "docs/agents/tone-baseline.txt";

const CHAR_RULES = [
  ["em-dash", /—/gu],
  ["en-dash", /–/gu],
  ["curly-quote", /[‘’“”]/gu],
  ["ellipsis", /…/gu],
  ["emoji", /\p{Extended_Pictographic}/gu],
];
const BANNED =
  /\b(leverag\w*|robust\w*|seamless\w*|comprehensive\w*|crucial\w*|delv(?:e|es|ed|ing)|ensur\w*|streamlin\w*|holistic\w*|utiliz\w*|empower\w*|unlock\w*)\b/giu;
const CONTRAST =
  /(?:\bnot\b(?!\s+only\b)|n't\b)[^.!?;:]{1,60}?[,;]\s+(?:but|it is|it's|this is|that is|they are|they're|we are|we're)\b/giu;
const BULLET = /^\s*(?:[-*+]|\d+[.)])\s+/u;

const codepoint = (ch) => "U+" + ch.codePointAt(0).toString(16).toUpperCase().padStart(4, "0");

// Blank out fenced code and inline code, keeping line numbers. Inline code becomes the
// word "code" so that word counts stay close to what a reader sees.
export function stripCode(text) {
  const out = [];
  let fence = null;
  for (const line of text.split(/\r?\n/)) {
    const m = /^\s*(`{3,}|~{3,})/u.exec(line);
    if (fence) {
      if (m && m[1][0] === fence[0] && m[1].length >= fence.length) fence = null;
      out.push({ text: "", code: true });
      continue;
    }
    if (m) {
      fence = m[1];
      out.push({ text: "", code: true });
      continue;
    }
    out.push({ text: line.replace(/(`+)[^`\n]*?\1/gu, "code"), code: false });
  }
  return out;
}

export function hardFindings(lines) {
  const found = [];
  lines.forEach((l, i) => {
    if (l.code) return;
    for (const [rule, re] of CHAR_RULES) {
      for (const m of l.text.matchAll(re)) found.push({ line: i + 1, rule, token: codepoint(m[0]) });
    }
    for (const m of l.text.matchAll(BANNED)) found.push({ line: i + 1, rule: "banned-word", token: m[0].toLowerCase() });
  });
  return found;
}

// Group prose lines into units: a paragraph, or one bullet. Headings, tables and blanks end a unit.
function proseUnits(lines) {
  const units = [];
  let cur = null;
  const flush = () => {
    if (cur) units.push(cur);
    cur = null;
  };
  for (const l of lines) {
    const t = l.text.trim();
    if (l.code || t === "" || /^#{1,6}\s/u.test(t) || t.startsWith("|") || /^[-*_]{3,}$/u.test(t)) {
      flush();
      continue;
    }
    if (BULLET.test(l.text)) {
      flush();
      cur = t.replace(BULLET, "");
    } else {
      cur = cur === null ? t : cur + " " + t;
    }
  }
  flush();
  return units;
}

const ABBREV = /\b(e\.g|i\.e|vs|etc|approx|no)\./giu;

export function softMetrics(lines) {
  const body = lines.filter((l) => !l.code);
  const text = body.map((l) => l.text).join("\n");
  const words = (text.match(/\S+/gu) || []).length;
  const bold = (text.match(/\*\*[^*\n]+?\*\*/gu) || []).length;
  const nonBlank = body.filter((l) => l.text.trim() !== "");
  const bullets = nonBlank.filter((l) => BULLET.test(l.text)).length;
  const units = proseUnits(lines);
  const sentences = units
    .flatMap((u) => u.replace(ABBREV, (s) => s.replaceAll(".", "\u0000")).split(/(?<=[.!?])\s+/u))
    .map((s) => s.trim())
    .filter((s) => /[\p{L}\p{N}]/u.test(s));
  const short = sentences.filter((s) => (s.match(/\S+/gu) || []).length <= 5).length;
  const contrast = units.reduce((n, u) => n + (u.match(CONTRAST) || []).length, 0);
  const round1 = (n) => Math.round(n * 10) / 10;
  return {
    words,
    sentences: sentences.length,
    boldPer1000Words: words ? round1((bold * 1000) / words) : 0,
    bulletLineShare: nonBlank.length ? round1((bullets * 100) / nonBlank.length) : 0,
    shortSentenceShare: sentences.length ? round1((short * 100) / sentences.length) : 0,
    contrastCount: contrast,
  };
}

export function scanText(text) {
  const lines = stripCode(text);
  return { hard: hardFindings(lines), soft: softMetrics(lines) };
}

const toPosix = (p) => p.split(sep).join("/");
const display = (abs) => {
  const rel = relative(ROOT, abs);
  return toPosix(rel.startsWith("..") || isAbsolute(rel) ? abs : rel);
};

// Expand paths into Markdown files. Returns { files: [abs], dirs: [display path] }.
export function collectFiles(paths, cwd = process.cwd()) {
  const files = new Set();
  const dirs = [];
  const walk = (dir) => {
    for (const name of readdirSync(dir).sort()) {
      if (name === "node_modules" || name === ".git") continue;
      const p = join(dir, name);
      const st = statSync(p);
      if (st.isDirectory()) walk(p);
      else if (name.endsWith(".md")) files.add(p);
    }
  };
  for (const raw of paths) {
    const abs = resolve(cwd, raw);
    if (!existsSync(abs)) throw new Error(`no such path: ${raw}`);
    if (statSync(abs).isDirectory()) {
      dirs.push(display(abs));
      walk(abs);
    } else files.add(abs);
  }
  return { files: [...files].sort(), dirs };
}

export function scanFiles(files) {
  return files.map((abs) => ({ file: display(abs), ...scanText(readFileSync(abs, "utf8")) }));
}

// Baseline: one line per file, rule and token, with a count. Comments start with #.
export function aggregate(results) {
  const m = new Map();
  for (const r of results) {
    for (const h of r.hard) {
      const k = `${r.file} ${h.rule} ${h.token}`;
      m.set(k, (m.get(k) || 0) + 1);
    }
  }
  return m;
}

export function parseBaseline(text) {
  const m = new Map();
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const parts = line.split(/\s+/);
    if (parts.length !== 4 || !/^\d+$/.test(parts[3])) throw new Error(`bad baseline line: ${line}`);
    m.set(parts.slice(0, 3).join(" "), Number(parts[3]));
  }
  return m;
}

export function formatBaseline(map) {
  const head = [
    "# Hard tone findings that existed when the check was set up (path, rule, token, count).",
    "# This list only shrinks. Fix a finding, then run: node scripts/agents/tone-lint.mjs --update-baseline",
  ];
  const rows = [...map].sort(([a], [b]) => (a < b ? -1 : 1)).map(([k, n]) => `${k} ${n}`);
  return head.concat(rows).join("\n") + "\n";
}

const inScope = (key, files, dirs) => {
  const file = key.split(" ")[0];
  return files.includes(file) || dirs.some((d) => file.startsWith(d + "/"));
};

// New = more occurrences than the baseline allows. Stale = fewer than the baseline lists.
export function compare(current, baseline, scopeFiles, scopeDirs) {
  const fresh = [];
  const stale = [];
  for (const [k, n] of current) {
    const allowed = baseline.get(k) || 0;
    if (n > allowed) fresh.push({ key: k, found: n, allowed });
  }
  for (const [k, n] of baseline) {
    if (!inScope(k, scopeFiles, scopeDirs)) continue;
    const have = current.get(k) || 0;
    if (have < n) stale.push({ key: k, found: have, listed: n });
  }
  return { fresh, stale };
}

function render(results) {
  const out = [];
  for (const r of results) {
    const s = r.soft;
    out.push(
      `${r.file}  hard=${r.hard.length} words=${s.words} bold/1k=${s.boldPer1000Words} bullets=${s.bulletLineShare}% short=${s.shortSentenceShare}% contrast=${s.contrastCount}`,
    );
    for (const h of r.hard) out.push(`  line ${h.line}: ${h.rule} ${h.token}`);
  }
  return out;
}

export function main(argv, io = {}) {
  const out = io.out || ((s) => process.stdout.write(s + "\n"));
  const err = io.err || ((s) => process.stderr.write(s + "\n"));
  const cwd = io.cwd || process.cwd();
  const opts = { json: false, check: false, update: false, baseline: null };
  const paths = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--json") opts.json = true;
    else if (a === "--check") opts.check = true;
    else if (a === "--update-baseline") opts.update = true;
    else if (a === "--baseline") {
      opts.baseline = argv[++i];
      if (!opts.baseline) {
        err("--baseline needs a file");
        return 2;
      }
    }
    else if (a.startsWith("--")) {
      err(`unknown option ${a}`);
      return 2;
    } else paths.push(a);
  }
  const baselinePath = resolve(cwd, opts.baseline || join(ROOT, DEFAULT_BASELINE));
  let scope;
  try {
    scope = collectFiles(paths.length ? paths : [join(ROOT, DEFAULT_PATH)], cwd);
  } catch (e) {
    err(e.message);
    return 2;
  }
  const results = scanFiles(scope.files);
  const current = aggregate(results);
  const scopeFiles = results.map((r) => r.file);
  let code = 0;
  let verdict = null;

  if (opts.update) {
    const existing = existsSync(baselinePath);
    const old = existing ? parseBaseline(readFileSync(baselinePath, "utf8")) : new Map();
    const { fresh } = compare(current, old, scopeFiles, scope.dirs);
    if (existing && fresh.length) {
      for (const f of fresh) err(`refusing to grow the baseline: ${f.key} (${f.found} found, ${f.allowed} listed)`);
      return 1;
    }
    const next = new Map([...old].filter(([k]) => !inScope(k, scopeFiles, scope.dirs)));
    for (const [k, n] of current) next.set(k, n);
    writeFileSync(baselinePath, formatBaseline(next));
    out(`baseline written: ${next.size} entries`);
    return 0;
  }

  if (opts.check) {
    const baseline = existsSync(baselinePath) ? parseBaseline(readFileSync(baselinePath, "utf8")) : new Map();
    verdict = compare(current, baseline, scopeFiles, scope.dirs);
    if (verdict.fresh.length || verdict.stale.length) code = 1;
  }

  if (opts.json) {
    out(JSON.stringify({ files: results, ...(verdict ? { check: verdict } : {}) }, null, 2));
  } else {
    for (const l of render(results)) out(l);
    if (verdict) {
      for (const f of verdict.fresh) out(`NEW ${f.key} (${f.found} found, ${f.allowed} listed)`);
      for (const s of verdict.stale) out(`STALE ${s.key} (${s.found} found, ${s.listed} listed): run --update-baseline`);
      out(code ? "tone check: FAIL" : "tone check: ok");
    }
  }
  return code;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.stdout.on("error", (e) => {
    if (e.code !== "EPIPE") throw e;
  });
  process.exitCode = main(process.argv.slice(2));
}
