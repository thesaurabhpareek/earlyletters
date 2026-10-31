// ONE offline model of opencode's bash permission matching, shared by the test files.
// Test support only (no workflow or script imports it). UNVERIFIED against the real engine:
// written from Review C's reading of it. Rules: `*` crosses spaces, `?` is one character,
// a trailing " *" makes the arguments optional, backslashes count as slashes, the LAST matching
// rule wins, and a chained command is evaluated segment by segment (and as a whole) where any
// deny denies.

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

/** cmd -> true when the command, or any segment of the chain, is denied. */
export function deniedBy(rules) {
  const decide = decider(rules);
  return (cmd) => cmd.split(/&&|\|\||;|\|/).map((s) => s.trim()).filter(Boolean).some((seg) => decide(seg) === "deny") || decide(cmd) === "deny";
}

/** A list of deny-only patterns as rules (catch-all allow first). */
export const denyOnly = (patterns) => [["*", "allow"], ...patterns.map((p) => [p, "deny"])];

/** True for a command that has git and push in it: recordings of these ran under older rule sets and cannot be compared now. */
export const isPush = (cmd) => /git.*push/.test(cmd);
