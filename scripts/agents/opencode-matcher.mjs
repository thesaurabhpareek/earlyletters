// ONE offline model of opencode's bash permission matching, shared by the test files.
// Test support only (no workflow or script imports it).
// CONFIRMED on opencode 1.18.34 for the cases Review B and the engine run covered: the LAST matching rule
// wins; `*` crosses spaces and tabs; a trailing " *" makes the arguments optional; backslashes count as
// slashes; a command is split at newline, |, ; and && and each segment is matched alone (the whole line is
// not matched, so a rule whose pattern contains one of those characters never fires). `?` as one character is
// modelled but was not separately confirmed.
// STILL UNVERIFIED on the engine: whether `gh pr create` pushes the branch itself, and every pattern added in
// round 8 (the extra gh denies, the read allows, the .agent-run/ and /tmp/ allows and their re-denies).
// Not modelled: wrappers, quoting, variables, substitution. The deny list catches only the bare form.

const norm = (x) => x.replaceAll("\\", "/");

export function globToRe(g) {
  let l = norm(g).replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\?/g, ".");
  if (l.endsWith(" .*")) l = l.slice(0, -3) + "( .*)?";
  return new RegExp("^" + l + "$", "s");
}

/** rules: [[pattern, action], ...] in order. Returns a function cmd -> "allow" | "deny" for ONE command string. */
export function decider(rules) {
  const res = rules.map(([g, action]) => ({ re: globToRe(g), action }));
  return (cmd) => { let a = "allow"; for (const r of res) if (r.re.test(norm(cmd))) a = r.action; return a; };
}

/**
 * cmd -> true when any segment is denied. The REAL engine (opencode 1.18.34, engine-confirmed in round 7)
 * splits a command at newline, |, ; and && and matches each segment alone; the whole line is not matched.
 * So a rule whose pattern contains one of those characters never fires: `gh issue comment ... | tee x` and
 * `... \ncurl x` run. Single & , $( ), backticks and quotes do not split.
 */
export function deniedBy(rules) {
  const decide = decider(rules);
  return (cmd) => cmd.split(/&&|\||;|\n/).map((s) => s.trim()).filter(Boolean).some((seg) => decide(seg) === "deny");
}

/** A list of deny-only patterns as rules (catch-all allow first). */
export const denyOnly = (patterns) => [["*", "allow"], ...patterns.map((p) => [p, "deny"])];

/**
 * True for a command that pushes (or might): git and push in it, except a plain commit, log, checkout or
 * branch command with no chain or substitution, which merely mentions the word (round 7 narrowed the deny
 * to command position, so `git commit -m 'push notes'` is allowed again). Recordings of pushes ran under
 * older rule sets and cannot be compared now.
 */
export const isPush = (cmd) => /git.*push/.test(cmd) && !(/^\s*git\s+(commit|log|checkout|branch|switch)\b/.test(cmd) && !/[;&|`$(\n]/.test(cmd));
