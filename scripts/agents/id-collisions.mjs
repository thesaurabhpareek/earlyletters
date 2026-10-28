#!/usr/bin/env node
// Lists the numbered ids that open PRs add (decision D-ids, ADR numbers,
// supabase/APPLY.md file numbers and backlog BL-ids) and reports any id that
// two open PRs both add, or that an open PR adds although develop already has it.
// Parallel threads picked these numbers by hand and collided: D-089 onward
// (#108, #122, #128), ADR 0023 (#139, #146, #150), APPLY.md File 26 (#306, #311).
//
//   node scripts/agents/id-collisions.mjs                 -> live: develop plus open PRs (GitHub REST)
//   node scripts/agents/id-collisions.mjs --json          -> the same, as JSON
//   node scripts/agents/id-collisions.mjs --ref <ref>     -> compare against <ref> instead of origin/develop
//   node scripts/agents/id-collisions.mjs --all-bases     -> also PRs into main or other branches (noisy)
//   node scripts/agents/id-collisions.mjs --fixture <f>   -> offline, from a JSON file (see id-collisions.fixture.json)
// Exit code: 0 no collisions, 1 collisions found, 2 usage or fetch error.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

export const KINDS = ["D", "ADR", "APPLY", "BL"];

// Which file a kind of id is defined in, and the line shapes that define one.
// A mention elsewhere (for example "see D-104") is a reference, not a definition.
const isBacklog = (p) => p === "docs/BACKLOG.md" || (p.startsWith("docs/backlog/") && p.endsWith(".md"));
const RULES = {
  D: { file: (p) => p === "docs/DECISIONS.md", res: [/^\| *D-(\d{3}) *\|/, /^#{2,4} +D-(\d{3})\b/] },
  // Table row "| 26 | `2026...sql` |" and heading "## File 26:". Old timestamp
  // headings ("## File 20261004000000_x.sql") are not numbers in this sense.
  APPLY: { file: (p) => p === "supabase/APPLY.md", res: [/^\| *(\d{1,3}) *\| *`\d{14}_[^`]*\.sql`/, /^#{2,4} +File (\d{1,3})\b(?!_)/] },
  BL: { file: isBacklog, res: [/^#{2,4} +BL-(\d{3,4})\b/, /^\| *BL-(\d{3,4}) *\|/] },
};

const pad = (kind, n) => (kind === "ADR" ? String(n).padStart(4, "0") : kind === "APPLY" ? String(n) : `${kind}-${String(n).padStart(3, "0")}`);

/** Ids of `kind` defined by the given lines of file `path`. */
export function definedIds(kind, path, lines) {
  const rule = RULES[kind];
  const out = new Set();
  if (!rule || !rule.file(path)) return out;
  for (const line of lines) {
    for (const re of rule.res) {
      const m = re.exec(line);
      if (m) out.add(Number(m[1]));
    }
  }
  return out;
}

const adrNumber = (filename) => {
  const m = /^docs\/adr\/(\d{4})-[^/]+\.md$/.exec(filename ?? "");
  return m ? Number(m[1]) : null;
};

/**
 * Ids a PR adds, from its REST "files" list ({filename, status, patch, previous_filename}).
 * An id counts as added when an added line defines it and no removed line in the
 * same file did (so editing an existing decision row is not "adding" it).
 */
export function addedIds(files) {
  const ids = Object.fromEntries(KINDS.map((k) => [k, new Set()]));
  const unchecked = [];
  for (const f of files ?? []) {
    const n = adrNumber(f.filename);
    if (n !== null && f.status !== "removed" && (f.status === "added" || f.status === "copied" || (f.status === "renamed" && adrNumber(f.previous_filename) !== n))) {
      ids.ADR.add(n);
    }
    const kinds = ["D", "APPLY", "BL"].filter((k) => RULES[k].file(f.filename));
    if (!kinds.length) continue;
    if (typeof f.patch !== "string") {
      unchecked.push(f.filename);
      continue;
    }
    const lines = f.patch.split("\n");
    const plus = lines.filter((l) => l.startsWith("+") && !l.startsWith("+++")).map((l) => l.slice(1));
    const minus = lines.filter((l) => l.startsWith("-") && !l.startsWith("---")).map((l) => l.slice(1));
    for (const k of kinds) {
      const gone = definedIds(k, f.filename, minus);
      for (const id of definedIds(k, f.filename, plus)) if (!gone.has(id)) ids[k].add(id);
    }
  }
  return { ids, unchecked };
}

/** Ids already on develop. `files` maps repo path to full text; `adrFiles` lists docs/adr file names. */
export function developIds(files, adrFiles = []) {
  const ids = Object.fromEntries(KINDS.map((k) => [k, new Set()]));
  for (const [path, text] of Object.entries(files ?? {})) {
    for (const k of ["D", "APPLY", "BL"]) for (const id of definedIds(k, path, String(text).split("\n"))) ids[k].add(id);
  }
  for (const f of adrFiles) {
    const n = adrNumber(f.startsWith("docs/adr/") ? f : `docs/adr/${f}`);
    if (n !== null) ids.ADR.add(n);
  }
  return ids;
}

/**
 * prs: [{number, title, files, parent?}]. Returns {added, collisions, unchecked}.
 * A collision is {kind, id, prs: [numbers], onDevelop: bool}: either two or more
 * open PRs add the id, or one does and develop already has it.
 */
export function findCollisions({ develop, prs }) {
  const added = [];
  const unchecked = [];
  const byId = new Map();
  const list = [...(prs ?? [])].sort((a, b) => a.number - b.number);
  const scanned = new Map(list.map((pr) => [pr.number, addedIds(pr.files)]));
  const byNumber = new Map(list.map((pr) => [pr.number, pr]));
  // A stacked PR (one with `parent`) is compared with develop, so its diff also holds
  // what its parent PRs add. Ids an ancestor adds belong to the ancestor alone.
  const fromAncestor = (pr, k, id) => {
    const seen = new Set();
    for (let up = byNumber.get(pr.parent); up && !seen.has(up.number); up = byNumber.get(up.parent)) {
      seen.add(up.number);
      if (scanned.get(up.number).ids[k].has(id)) return true;
    }
    return false;
  };
  for (const pr of list) {
    const r = scanned.get(pr.number);
    for (const f of r.unchecked) unchecked.push({ pr: pr.number, file: f });
    const flat = [];
    for (const k of KINDS) {
      for (const id of [...r.ids[k]].sort((a, b) => a - b)) {
        if (fromAncestor(pr, k, id)) continue;
        flat.push(`${k === "ADR" ? "ADR " : k === "APPLY" ? "File " : ""}${pad(k, id)}`);
        const key = `${k}:${id}`;
        if (!byId.has(key)) byId.set(key, { kind: k, n: id, prs: [] });
        byId.get(key).prs.push(pr.number);
      }
    }
    if (flat.length) added.push({ pr: pr.number, title: pr.title ?? "", ids: flat });
  }
  const collisions = [];
  for (const { kind, n, prs: who } of byId.values()) {
    const onDevelop = develop[kind].has(n);
    if (who.length > 1 || onDevelop) collisions.push({ kind, id: pad(kind, n), prs: who.sort((a, b) => a - b), onDevelop });
  }
  collisions.sort((a, b) => KINDS.indexOf(a.kind) - KINDS.indexOf(b.kind) || a.id.localeCompare(b.id));
  return { added, collisions, unchecked };
}

/**
 * The open PRs whose ids can land on develop: PRs into `base`, plus PRs stacked
 * on the head branch of one of those. PRs into main (website releases) or into a
 * branch with no open PR to develop are left out: their diff is against another
 * base, so it can list ids develop already has.
 */
export function selectPrs(prs, base = "develop") {
  const heads = new Set([base]);
  const chosen = new Set();
  for (let grew = true; grew; ) {
    grew = false;
    for (const pr of prs) {
      if (!chosen.has(pr) && heads.has(pr.base?.ref)) {
        chosen.add(pr);
        if (pr.head?.ref) heads.add(pr.head.ref);
        grew = true;
      }
    }
  }
  return prs.filter((pr) => chosen.has(pr));
}

/** True when `path` is where D, APPLY or BL ids are defined (next-id counts only these). */
export const definesIds = (path) => ["D", "APPLY", "BL"].some((k) => RULES[k].file(path));

/** Next free APPLY.md file number, from develop's APPLY.md text and lines open PRs add to it. */
export function nextApplyFile(texts) {
  let max = 0;
  for (const t of texts) for (const id of definedIds("APPLY", "supabase/APPLY.md", String(t).split("\n"))) max = Math.max(max, id);
  return String(max + 1);
}

export function report({ added, collisions, unchecked }) {
  const out = [];
  const label = { D: "decision", ADR: "ADR", APPLY: "APPLY.md File", BL: "backlog" };
  if (!collisions.length) out.push("No id collisions between open PRs or with develop.");
  for (const c of collisions) {
    const who = c.prs.map((n) => `#${n}`).join(", ");
    const parts = [];
    if (c.prs.length > 1) parts.push(`added by ${who}`);
    if (c.onDevelop) parts.push(c.prs.length > 1 ? "and already on develop" : `added by ${who} but already on develop`);
    out.push(`COLLISION ${label[c.kind]} ${c.id}: ${parts.join(" ")}. Renumber all but the first to merge (next free: node scripts/agents/next-id.mjs).`);
  }
  for (const u of unchecked) out.push(`unchecked: #${u.pr} ${u.file} (GitHub sent no patch, usually because the diff is too large)`);
  if (added.length) out.push("", "Ids added by open PRs:");
  for (const a of added) out.push(`  #${a.pr} ${a.ids.join(" ")}`);
  return out.join("\n");
}

// ---------- live inputs ----------

function git(root, args) {
  try {
    return execFileSync("git", ["-C", root, ...args], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, stdio: ["ignore", "pipe", "ignore"] });
  } catch {
    return null;
  }
}

/** Develop's files at `ref`; falls back to the working tree when the ref is missing. */
export function loadDevelop(root, ref) {
  const files = {};
  let adrFiles = [];
  const listed = git(root, ["ls-tree", "-r", "--name-only", ref, "--", "docs/DECISIONS.md", "docs/BACKLOG.md", "docs/backlog", "supabase/APPLY.md", "docs/adr"]);
  if (listed !== null) {
    for (const p of listed.split("\n").filter(Boolean)) {
      if (p.startsWith("docs/adr/")) adrFiles.push(p);
      else if (p.endsWith(".md")) files[p] = git(root, ["show", `${ref}:${p}`]) ?? "";
    }
    return { files, adrFiles, source: ref };
  }
  const read = (p) => (existsSync(join(root, p)) ? readFileSync(join(root, p), "utf8") : null);
  for (const p of ["docs/DECISIONS.md", "docs/BACKLOG.md", "supabase/APPLY.md"]) {
    const t = read(p);
    if (t !== null) files[p] = t;
  }
  const bdir = join(root, "docs", "backlog");
  if (existsSync(bdir)) for (const f of readdirSync(bdir, { recursive: true })) if (String(f).endsWith(".md")) files[`docs/backlog/${f}`] = read(`docs/backlog/${f}`);
  const adir = join(root, "docs", "adr");
  if (existsSync(adir)) adrFiles = readdirSync(adir).map((f) => `docs/adr/${f}`);
  return { files, adrFiles, source: "working tree" };
}

async function main(argv) {
  const arg = (name) => {
    const i = argv.indexOf(name);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const json = argv.includes("--json");
  let develop;
  let prs;
  const fixture = arg("--fixture");
  if (argv.includes("--fixture") && !fixture) throw new Error("--fixture needs a file");
  if (fixture) {
    const fx = JSON.parse(readFileSync(fixture, "utf8"));
    develop = developIds(fx.develop?.files, fx.develop?.adrFiles);
    prs = argv.includes("--all-bases") || !(fx.prs ?? []).some((p) => p.base) ? fx.prs ?? [] : selectPrs(fx.prs);
  } else {
    const { ROOT, loadRoster, repoSlug, gh, ghAll } = await import("./lib.mjs");
    const repo = repoSlug(loadRoster());
    const d = loadDevelop(ROOT, arg("--ref") ?? "origin/develop");
    develop = developIds(d.files, d.adrFiles);
    const open = ghAll(`/repos/${repo}/pulls?state=open`);
    const parentOf = (pr) => open.find((o) => o.head?.ref === pr.base?.ref && o.number !== pr.number)?.number;
    prs = (argv.includes("--all-bases") ? open : selectPrs(open)).map((pr) => ({
      number: pr.number,
      title: pr.title,
      parent: pr.base.ref === "develop" ? undefined : parentOf(pr),
      // A stacked PR's own diff is against a branch that may be far behind develop
      // (#167 lists 1,094 files), so compare its head with develop instead.
      files:
        pr.base.ref === "develop"
          ? ghAll(`/repos/${repo}/pulls/${pr.number}/files`)
          : gh(`/repos/${repo}/compare/develop...${pr.head.sha}`)?.files ?? [],
    }));
  }
  const result = findCollisions({ develop, prs });
  console.log(json ? JSON.stringify(result, null, 2) : report(result));
  return result.collisions.length ? 1 : 0;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main(process.argv.slice(2)).then(
    (code) => process.exit(code),
    (err) => {
      console.error(err.message);
      process.exit(2);
    },
  );
}
