// Diff sanity gate (owner: ai-eng-lead). Pure functions over the file list that
// `gh api repos/{o}/{r}/pulls/N/files` returns; no I/O, no wiring into dispatch.mjs.
// Failure it exists for: PR #297 commit 00134a04 emptied
// docs/agents/hardening/scope-and-drift.md (4153 bytes to 0) through a bad script, the
// commit message did not say so, and only the coordinator noticed, by hand.
// Design: docs/agents/hardening/diff-sanity.md.
//   file  = { filename, status, additions, deletions, changes, patch?, previous_filename? }
//   opts  = { baseLines?: { [filename]: number }, shrinkShare?, renameRewriteShare?,
//             renameFallbackChanges?, massDeleteFiles?, allow?: [{ path, reason, flags? }] }
//   flag  = { kind, file, detail }   file is null for mass_delete

import { oneLine } from "./hardening.mjs";

export const DEFAULTS = Object.freeze({
  /** Flag a modified file that lost more than this share of its lines. */
  shrinkShare: 0.5,
  /** Flag a rename that rewrote at least this share of the original lines. */
  renameRewriteShare: 0.5,
  /** Rename with no known base size: flag at this many changed lines or more. */
  renameFallbackChanges: 100,
  /** Flag a PR that deletes more than this many files. */
  massDeleteFiles: 10,
});

/** Flags an allow-list entry may waive when it lists none. Emptied and binary are never waived by default. */
export const DEFAULT_WAIVABLE = Object.freeze(["shrunk", "deleted", "rename_rewrite"]);

const BINARY_EXT = /\.(png|jpe?g|gif|webp|ico|pdf|zip|gz|tgz|mp3|m4a|wav|mp4|mov|ttf|otf|woff2?|sqlite|db|bin|keystore|p12)$/i;

/** Plain `*` and `**` globs, else an exact path. */
function matches(pattern, filename) {
  if (!pattern.includes("*")) return pattern === filename;
  const re = pattern.split("**").map((p) => p.split("*").map((s) => s.replace(/[.+?^${}()|[\]\\]/g, "\\$&")).join("[^/]*")).join(".*");
  return new RegExp(`^${re}$`).test(filename);
}

/** True when the patch says the file has no lines left: a hunk header `+0,0`. Reliable without any base size. */
export function patchEmpties(patch) {
  return typeof patch === "string" && /^@@ -\d+(?:,\d+)? \+0,0 @@/m.test(patch);
}

const num = (v) => (Number.isFinite(v) && v >= 0 ? v : 0);

/** Which flags a reason-bearing allow entry waives for this file. An entry with no reason waives nothing. */
function waived(allow, filename) {
  const out = new Set();
  for (const e of Array.isArray(allow) ? allow : []) {
    if (!e || typeof e.path !== "string" || !String(e.reason ?? "").trim()) continue;
    if (!matches(e.path, filename)) continue;
    for (const k of Array.isArray(e.flags) && e.flags.length ? e.flags : DEFAULT_WAIVABLE) out.add(k);
  }
  return out;
}

/** Flags for one PR's file list. Returns [] for a clean diff. */
export function checkDiff(files, opts = {}) {
  const o = { ...DEFAULTS, ...opts };
  const flags = [];
  let removed = 0;
  for (const f of Array.isArray(files) ? files : []) {
    if (!f || typeof f.filename !== "string") continue;
    const add = num(f.additions), del = num(f.deletions);
    const base = o.baseLines?.[f.previous_filename ?? f.filename] ?? o.baseLines?.[f.filename];
    const baseKnown = Number.isFinite(base) && base > 0;
    const found = [];

    if (f.status === "removed") {
      removed++;
      found.push({ kind: "deleted", detail: baseKnown ? `deleted (${base} lines)` : "deleted" });
    } else if (f.status === "modified" || f.status === "changed" || f.status === "renamed") {
      const after = baseKnown ? base + add - del : null;
      const emptied = patchEmpties(f.patch) || (baseKnown && after <= 0);
      if (emptied) {
        found.push({ kind: "emptied", detail: baseKnown ? `emptied (${base} lines to 0)` : "emptied (patch leaves 0 lines)" });
      } else if (baseKnown && f.status !== "renamed") {
        const lost = 1 - after / base;
        if (lost > o.shrinkShare) found.push({ kind: "shrunk", detail: `shrunk ${Math.round(lost * 100)}% (${base} to ${after} lines)` });
      }
      if (f.status === "renamed") {
        const share = baseKnown ? del / base : null;
        if (share !== null ? share >= o.renameRewriteShare : num(f.changes) >= o.renameFallbackChanges) {
          found.push({ kind: "rename_rewrite", detail: share !== null ? `renamed from ${oneLine(f.previous_filename, 80)} with ${Math.round(share * 100)}% rewritten` : `renamed from ${oneLine(f.previous_filename, 80)} with ${num(f.changes)} changed lines` });
        }
      }
    }

    // Binary: GitHub gives no patch for binary files. A missing patch alone is ambiguous (huge text diffs, mode changes), so the extension decides.
    if (f.status !== "removed" && (BINARY_EXT.test(f.filename) || /^Binary files /m.test(String(f.patch ?? "")))) {
      found.push({ kind: "binary", detail: "binary file touched" });
    }

    const ok = waived(o.allow, f.filename);
    for (const x of found) if (!ok.has(x.kind)) flags.push({ kind: x.kind, file: f.filename, detail: x.detail });
  }
  if (removed > o.massDeleteFiles) flags.push({ kind: "mass_delete", file: null, detail: `${removed} files deleted (limit ${o.massDeleteFiles})` });
  return flags;
}

/** One line per flag, safe to put on a board or in a review body. */
export function explain(flags) {
  return (Array.isArray(flags) ? flags : []).map((x) => oneLine(x.file ? `${x.file}: ${x.detail}` : x.detail, 160));
}
