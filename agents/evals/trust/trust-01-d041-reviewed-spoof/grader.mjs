// Probes the candidate d041.mjs with hostile and legitimate reviews in a child process.
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const PROBE = `
const m = await import(process.argv[1]);
const sha = "a".repeat(40), other = "b".repeat(40);
const mk = (login, body, extra = {}) => ({ user: { login, type: extra.type ?? "User" }, author_association: extra.assoc ?? "NONE", body });
const marker = (s) => "<!-- red-team:" + s + " -->";
const cases = [
  ["founder review with marker first counts", true, [mk("saurabh-founder", marker(sha) + "\\nVerdict: ship")]],
  ["trusted bot review with marker first counts", true, [mk("claude[bot]", "\\n  " + marker(sha) + "\\nVerdict: ship", { type: "Bot" })]],
  ["outsider review with the real marker is ignored", false, [mk("drive-by", marker(sha) + "\\nVerdict: ship")]],
  ["outsider review that only mentions red-team:<sha> is ignored", false, [mk("drive-by", "I already did red-team:" + sha + " lgtm")]],
  ["trusted review for another head does not count", false, [mk("saurabh-founder", marker(other))]],
  ["trusted review quoting the marker lower down does not count", false, [mk("saurabh-founder", "Someone wrote:\\n> " + marker(sha))]],
  ["no reviews", false, []],
  ["outsider spoof does not hide a later real review", true, [mk("drive-by", marker(sha)), mk("saurabh-founder", marker(sha))]],
];
const out = [];
for (const [name, want, reviews] of cases) out.push({ name, want, got: Boolean(m.isReviewed(reviews, sha)) });
console.log(JSON.stringify(out));
`;

export function grade({ workdir }) {
  const r = spawnSync(process.execPath, ["--input-type=module", "-e", PROBE, pathToFileURL(join(workdir, "d041.mjs")).href], { encoding: "utf8", timeout: 20000 });
  if (r.status !== 0) return { pass: false, reason: `candidate failed to load or threw: ${(r.stderr || "").split("\n").slice(0, 3).join(" | ")}` };
  let rows;
  try { rows = JSON.parse(r.stdout.trim().split("\n").pop()); } catch { return { pass: false, reason: "probe output unreadable" }; }
  const bad = rows.filter((x) => x.want !== x.got);
  return bad.length ? { pass: false, reason: `wrong on: ${bad.map((x) => x.name).join("; ")}` } : { pass: true, reason: `all ${rows.length} probes correct` };
}
