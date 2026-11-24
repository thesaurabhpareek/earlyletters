#!/usr/bin/env node
// Copy tells lint for customer-facing strings. Read-only except the baseline.
// Rules and reasons: packages/content/WRITING-GUIDE.md section 6.
//
//   node scripts/content/copy-tells.mjs            list findings by file and rule
//   --check                                         exit 1 if any (file, rule) count grew or is new
//   --update-baseline                               write the baseline; refuses growth once it exists
//   --verbose                                       print every matching string with file:line
//
// Baseline: packages/content/copy-tells-baseline.txt, lines "path<TAB>rule<TAB>count". It may only shrink.
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import ts from "typescript";

// COPY_TELLS_ROOT points the scan at another tree (the tests use a temp one).
const ROOT = resolve(process.env.COPY_TELLS_ROOT || fileURLToPath(new URL("../..", import.meta.url)));
export const BASELINE = "packages/content/copy-tells-baseline.txt";
const COPY_FILE = /(^|\/)(copy|[^/]+[.-]copy)\.ts$/;

export const RULES = [
  ["uncontracted", /\b(did not|could not|do not|does not|cannot|can not|will not|is not|are not|have not|would not|should not|we will|you will|we are|you are)\b/i],
  // "Just X" as an opener or an instruction is the tell. Time and degree uses ("just now", "just as it is") are plain English.
  ["softener", /(^|[.!?] )just\b(?! (now|as|before|yet|then|after|for|signed|happened|in case)\b)|\b(you|to|and|then) just\b(?! (now|as|before|yet|then|after|for|signed|happened|in case)\b)|\b(simply|easily|quickly|effortlessly)\b/i],
  ["oops-voice", /\b(oops|uh-oh|whoops|successfully|unable to|invalid|encountered an? (error|issue))\b/i],
  ["please-open", /^please\b/i],
  ["corporate-word", /\b(ensure|utili[sz]e|leverage|seamless|robust|empower|facilitate|journey|cherish|precious|treasure[ds]?)\b/i],
  ["self-narrating", /^(here is|here are|this email is|this message is)\b/i],
  ["vague-reassurance", /\b(safe|safely|don't worry|do not worry|rest assured)\b/i],
  ["slogan-kept", /(^|, )kept\.?$/i],
  ["stage-managed", /\b(one note|then apple|then ios|then your iphone|and then apple)\b/i],
  ["triplet", /\bno \w+, no \w+(,| and) no \w+/i],
];

function walk(dir, out) {
  for (const n of readdirSync(dir)) {
    if (n === "node_modules" || n === "generated" || n.startsWith(".")) continue;
    const p = join(dir, n);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(n) && !/\.test\./.test(n)) out.push(p);
  }
}

export function stringsIn(path, source) {
  const sf = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, path.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const out = [];
  const add = (node, t) => {
    t = t.replace(/\s+/g, " ").trim();
    if (t.length < 3 || !/[A-Za-z]{3}/.test(t)) return;
    out.push({ line: sf.getLineAndCharacterOfPosition(node.getStart()).line + 1, text: t });
  };
  (function visit(n) {
    if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) {
      const p = n.parent;
      const skip = ts.isImportDeclaration(p) || ts.isExportDeclaration(p) || ts.isLiteralTypeNode(p) || ts.isCaseClause(p) || (ts.isPropertyAssignment(p) && p.name === n);
      if (!skip) add(n, n.text);
    } else if (ts.isTemplateExpression(n)) add(n, n.getText().slice(1, -1));
    ts.forEachChild(n, visit);
  })(sf);
  return out;
}

export function scan(root = ROOT) {
  const files = [];
  walk(join(root, "packages/content/src"), files);
  const app = [];
  walk(join(root, "apps/mobile/src"), app);
  files.push(...app.filter((p) => COPY_FILE.test(p)));
  const found = [];
  for (const f of files) {
    const rel = relative(root, f);
    // Prompt ids, URLs and other non-prose literals never reach a customer as a sentence.
    for (const s of stringsIn(f, readFileSync(f, "utf8"))) {
      if (/^(https?:\/\/|[a-z]+(\.[a-z0-9-]+)+$)/i.test(s.text)) continue;
      for (const [rule, re] of RULES) if (re.test(s.text)) found.push({ file: rel, rule, line: s.line, text: s.text });
    }
  }
  return found;
}

export function tally(found) {
  const m = new Map();
  for (const f of found) m.set(`${f.file}\t${f.rule}`, (m.get(`${f.file}\t${f.rule}`) || 0) + 1);
  return m;
}

export function readBaseline(path) {
  const m = new Map();
  if (!existsSync(path)) return m;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const [f, r, c] = line.split("\t");
    if (f && r && c) m.set(`${f}\t${r}`, Number(c));
  }
  return m;
}

export function compare(now, base) {
  const grew = [];
  for (const [k, v] of now) if (v > (base.get(k) ?? 0)) grew.push([k, base.get(k) ?? 0, v]);
  return grew;
}

// Reads the baseline as committed at a git ref. Null when there is no git or no file at that ref.
export function committedBaseline(root, ref) {
  try {
    const text = execFileSync("git", ["-C", root, "show", `${ref}:${BASELINE}`], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    const m = new Map();
    for (const line of text.split("\n")) {
      const [f, r, c] = line.split("\t");
      if (f && r && c) m.set(`${f}\t${r}`, Number(c));
    }
    return m;
  } catch {
    return null;
  }
}

export const total = (m) => [...m.values()].reduce((a, b) => a + b, 0);

// The baseline file may only shrink against what is committed: no entry up, no new entry, total not above.
export function baselineGrowth(file, committed) {
  if (!committed) return [];
  const grew = compare(file, committed);
  if (total(file) > total(committed) && !grew.length) grew.push(["total\t", total(committed), total(file)]);
  return grew;
}

function main() {
  const args = process.argv.slice(2);
  const found = scan();
  const now = tally(found);
  const basePath = join(ROOT, BASELINE);
  const base = readBaseline(basePath);
  // The baseline itself may not be raised by hand: compare it with HEAD, and with COPY_TELLS_BASE_REF (CI sets origin/develop) when given.
  const refs = ["HEAD", process.env.COPY_TELLS_BASE_REF].filter(Boolean);
  for (const ref of refs) {
    const grewFile = baselineGrowth(base, committedBaseline(ROOT, ref));
    if (grewFile.length && (args.includes("--check") || args.includes("--update-baseline"))) {
      console.error(`The baseline file is higher than the one committed at ${ref} (it may only shrink):\n` + grewFile.map(([k, a, b]) => `  ${k.replace("\t", "  ")} ${a} -> ${b}`).join("\n"));
      process.exit(1);
    }
  }
  if (args.includes("--update-baseline")) {
    if (existsSync(basePath)) {
      const grew = compare(now, base);
      if (grew.length) {
        console.error("Refusing to grow the baseline:\n" + grew.map(([k, a, b]) => `  ${k.replace("\t", "  ")} ${a} -> ${b}`).join("\n"));
        process.exit(1);
      }
    }
    const lines = [...now.entries()].sort().map(([k, v]) => `${k}\t${v}`);
    writeFileSync(basePath, lines.join("\n") + "\n");
    console.log(`Baseline written: ${lines.length} entries, ${found.length} findings.`);
    return;
  }
  if (args.includes("--verbose")) for (const f of found) console.log(`${f.file}:${f.line}\t${f.rule}\t${f.text}`);
  else {
    const byRule = new Map();
    for (const f of found) byRule.set(f.rule, (byRule.get(f.rule) || 0) + 1);
    for (const [r, c] of [...byRule].sort((a, b) => b[1] - a[1])) console.log(`${String(c).padStart(5)}  ${r}`);
    console.log(`${String(found.length).padStart(5)}  total`);
  }
  if (args.includes("--check")) {
    const grew = compare(now, base);
    if (grew.length) {
      console.error("Copy tells grew or are new (fix the line, do not raise the baseline):\n" + grew.map(([k, a, b]) => `  ${k.replace("\t", "  ")} ${a} -> ${b}`).join("\n"));
      process.exit(1);
    }
    const cur = found.length, was = [...base.values()].reduce((a, b) => a + b, 0);
    console.log(cur < was ? `Under baseline: ${cur} now, ${was} recorded. Run --update-baseline to lock the gain.` : "At baseline.");
  }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
