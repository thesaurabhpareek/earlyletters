// Review gate core (HV2-B06; design: docs/agents/harness-v2/REVIEW-GATE.md, RG-1 to RG-9).
//
// decide({ headSha, comments, now, pendingSeconds }) is a pure function: no network, no clock,
// no file reads. It says whether a PR head has one counted Review A and one counted Review B,
// and returns a status state plus the reasons.
//
// It is a consistency gate, not a security boundary (CR-32). Every review is a comment posted
// from one GitHub account by sessions of one model family (CR-20); the gate cannot tell a real
// review from a typed one. It catches honest mistakes: a stale head, a short sha, a missing
// lens, a FAIL posted after a PASS, a merge during the pending window.
//
// Counting rules reuse scripts/status/page.mjs unchanged (parseLens, countedPass, sameSha).
// Strictness is added here, not there: a pass counts only if its header names the FULL
// 40-character head sha (CR-44 clause 2). page.mjs accepts 7 to 40 characters; the extra
// check lives in this file so the founder page keeps its behaviour.
import { parseLens, countedPass, sameSha, PASSING } from "../status/page.mjs";

export const FULL_SHA = /^[0-9a-f]{40}$/;
export const DEFAULT_OWNER = "thesaurabhpareek";
export const DEFAULT_PENDING_SECONDS = 180;

const LENSES = ["A", "B"];
const HEADER = /^#{0,3}\s*review\s+([ab])(\s+delta)?\s+at\s+([0-9a-f]{7,40})\s*:\s*(\S.*)$/i;
const ms = (t) => Date.parse(t);
const sha7 = (s) => String(s).slice(0, 7);
const fail = (...reasons) => ({ state: "failure", reasons, description: String(reasons[0]).slice(0, 140), lenses: {} });

/** The lens letter a review header names ("Review A", "lens B"), upper case, or undefined. */
function lensOf(body) {
  const first = String(body ?? "").replace(/\r\n?/g, "\n").trim().split("\n")[0] ?? "";
  return first.match(/\b(?:review|lens)\s+([a-z])\b/i)?.[1].toUpperCase();
}

/**
 * @param {object} args
 * @param {string} args.headSha  full 40-hex sha of the PR head right now
 * @param {Array<{id?:number, body:string, created_at:string, updated_at?:string, user:{login:string,type?:string}}>} args.comments
 *   every issue comment on the PR, oldest first or any order (REST shape)
 * @param {string|number|Date} args.now  the moment of the decision
 * @param {number} [args.pendingSeconds=180]  RG-5 window after the newest owner comment
 * @param {string} [args.owner]  the only login whose comments count (RG-6)
 * @param {number} [args.prNumber]  lets forged "PR #166 at ..." headers from another PR be ignored
 * @param {string} [args.headCommittedAt]  when the head commit was made; a sha-less non-pass
 *   posted before it is history. Missing means every sha-less non-pass blocks (fail safe).
 * @returns {{state:"success"|"pending"|"failure", reasons:string[], description:string, lenses:object}}
 */
export function decide({ headSha, comments, now, pendingSeconds = DEFAULT_PENDING_SECONDS, owner = DEFAULT_OWNER, prNumber, headCommittedAt } = {}) {
  try {
    return run({ headSha, comments, now, pendingSeconds, owner, prNumber, headCommittedAt });
  } catch (e) {
    return fail(`gate error, treated as failure (RG-8): ${e?.message ?? e}`); // RG-8: never success on an error
  }
}

function run({ headSha, comments, now, pendingSeconds, owner, prNumber, headCommittedAt }) {
  const head = String(headSha ?? "").toLowerCase();
  if (!FULL_SHA.test(head)) return fail("head sha is not 40 hex characters");
  if (!Array.isArray(comments)) return fail("comments are not a list");
  const nowMs = now instanceof Date ? now.getTime() : typeof now === "number" ? now : ms(now);
  if (!Number.isFinite(nowMs)) return fail("now is not a time");
  if (!Number.isFinite(pendingSeconds) || pendingSeconds < 0) return fail("pendingSeconds is not a number");
  const headCommitMs = headCommittedAt === undefined ? undefined : ms(headCommittedAt);
  if (headCommittedAt !== undefined && !Number.isFinite(headCommitMs)) return fail("headCommittedAt is not a time");

  // RG-6: only the owner's login, never a bot. Ordering key is updated_at (an edit is a new post).
  const mine = [];
  for (const c of comments) {
    const login = c?.user?.login;
    if (typeof login !== "string" || login.toLowerCase() !== String(owner).toLowerCase()) continue;
    if (c.user.type === "Bot" || /\[bot\]$/i.test(login)) continue;
    const at = ms(c.updated_at ?? c.created_at);
    if (!Number.isFinite(at)) return fail(`comment ${c.id ?? "?"} has no usable time`);
    mine.push({ c, at });
  }
  mine.sort((a, b) => a.at - b.at || (a.c.id ?? 0) - (b.c.id ?? 0));

  const state = { A: undefined, B: undefined }; // { ok, verdict, at, id } or { ok: false, why, at, id }
  const notes = []; // advisory reasons that explain a missing pass
  const mark = (lens, v) => { state[lens] = v; };

  for (const { c, at } of mine) {
    const body = String(c.body ?? "");
    const counted = countedPass(body);
    if (counted) {
      const sha = counted.sha.toLowerCase();
      if (sha === head) {
        // The header names the full head sha. A later pass replaces an earlier non-pass (RG-3).
        mark(counted.lens, { ok: true, verdict: counted.verdict, at, id: c.id });
      } else if (sha.length < 40 && head.startsWith(sha)) {
        // RG-2: a prefix is not a binding. It is reported, never counted, and it does not cancel anything.
        notes.push(`short sha: Review ${counted.lens} at ${sha} is ${sha.length} characters; repost with the full 40-character head sha ${head}`);
      } else {
        notes.push(`Review ${counted.lens} ${counted.verdict} names ${sha7(sha)}, not the head ${sha7(head)}; it is history`);
      }
      continue;
    }
    let lens = parseLens(body, prNumber ?? Number.NaN);
    if (!lens) {
      // A header in the counted shape that names the head but carries a verdict page.mjs cannot read
      // (a lone "CONDITIONAL", "UNCLEAR") is still a reviewer saying something other than PASS: it blocks.
      const h = body.replace(/\r\n?/g, "\n").trim().split("\n")[0].match(HEADER);
      if (!h || !sameSha(h[3], head)) continue; // not a review (or a copy of another PR's verdict)
      lens = { verdict: h[4].trim().toUpperCase().slice(0, 40), sha: h[3] };
    }
    if (PASSING.has(lens.verdict)) {
      notes.push(`not counted: a ${lens.verdict} that is not in the exact "## Review A at <40-char sha>: PASS" form (free text never counts)`);
      continue;
    }
    // A non-pass. It blocks if it names the head (any prefix of 7 or more, so a short FAIL still blocks),
    // or names no sha and was posted after the head commit.
    const names = lens.sha ? sameSha(lens.sha, head) : headCommitMs === undefined || at >= headCommitMs;
    if (!names) continue;
    const letter = lensOf(body);
    const blocked = { ok: false, why: `${lens.verdict}${lens.sha ? "" : " (no sha)"}`, at, id: c.id };
    if (letter === "A" || letter === "B") mark(letter, { ...blocked, lens: letter });
    else for (const l of LENSES) mark(l, { ...blocked, lens: "?" }); // unknown letter blocks both until both pass later
  }

  const lenses = Object.fromEntries(LENSES.map((l) => [l, state[l] ? (state[l].ok ? { verdict: state[l].verdict, at: state[l].at, id: state[l].id } : { verdict: state[l].why, at: state[l].at, id: state[l].id }) : null]));
  const blockers = LENSES.filter((l) => state[l] && !state[l].ok).map((l) => `Review ${l} on ${sha7(head)}: latest is ${state[l].why}${state[l].lens === "?" ? " (lens letter not readable, blocks both)" : ""}, id ${state[l].id ?? "?"}`);
  if (blockers.length) return { state: "failure", reasons: [...blockers, ...notes], description: blockers[0].slice(0, 140), lenses };

  const missing = LENSES.filter((l) => !state[l]);
  if (missing.length) {
    const reasons = [`no counted Review ${missing.join(" or Review ")} naming the full head sha ${head}`, ...notes];
    return { state: "failure", reasons, description: reasons[0].slice(0, 140), lenses };
  }

  // Both lenses pass on the head. RG-5: wait out the window after the newest owner comment.
  const newest = mine.length ? mine[mine.length - 1].at : 0;
  const waitMs = newest + pendingSeconds * 1000 - nowMs;
  if (waitMs > 0) {
    const reason = `waiting ${Math.ceil(waitMs / 1000)}s: the window is ${pendingSeconds}s after the newest comment, so a late FAIL can land`;
    return { state: "pending", reasons: [reason, ...notes], description: reason.slice(0, 140), lenses };
  }
  const description = `A ${state.A.verdict}, B ${state.B.verdict} on ${sha7(head)}, no later non-pass. Consistency check, not approval`;
  return { state: "success", reasons: [description, ...notes], description: description.slice(0, 140), lenses };
}
