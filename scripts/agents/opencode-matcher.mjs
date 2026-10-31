// ONE offline model of opencode's bash permission matching, shared by the test files.
// Test support only (no workflow or script imports it).
// ENGINE-CONFIRMED on opencode 1.18.34 for the cases the red team ran: the LAST matching rule wins; `*` crosses
// spaces and tabs; a trailing " *" makes the arguments optional; backslashes count as slashes; and the engine
// matches shell-grammar command nodes (see commandNodes below), each by its full text, never the whole line.
// A rule whose pattern contains an unquoted separator therefore never fires on its own node.
// `case` and arithmetic AGREE with the engine (denied by both). Remaining disagreements: heredocs (the matcher mirrors the
// engine, which does not look inside them: a known hole, dangerous direction), `! !` (both run), comment text after `#`,
// unbalanced quotes (harmless), `function f { ...; }` and `{gh ...;}` (matcher allows, engine denies: safe direction), a `(` inside
// a word (unconfirmed), `?` as a single character (modelled, not separately confirmed). `time` is not stripped: the engine
// matches it as part of the node, and the config denies `time *`. STILL UNVERIFIED: whether `gh pr create` pushes the branch itself.
// Not modelled: wrappers, quoting tricks, variables. The deny list catches only the bare form.

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
 * The command nodes of a shell line, the way the engine sees them (tree-sitter bash grammar; ENGINE-CONFIRMED on
 * opencode 1.18.34 for the cases the red team ran). A node is matched alone, by its full text:
 *  - separators outside quotes: newline, | , ; , & and && ||  (so a single & splits, and a rule containing & never fires);
 *  - `$( ... )`, backticks and `<( ... )` are nodes of their own AND stay in the text of the node that holds them;
 *  - `( ... )` and `{ ...; }` groups, a leading `!`, and the bodies of if/for/while are nodes of their own;
 *  - quotes are NOT split: `echo "a;gh pr merge 7"` and `echo 'x | gh pr merge 7'` are one node each, and a quoted
 *    `|` in `--jq '.[] | .n'` stays in the node text; single quotes hide `$( )` completely;
 *  - a backslash escapes the next character, and backslash-newline is a continuation (no split);
 *  - `2>&1` and `&>` are redirects, not separators.
 * Heredocs: the rest of the `<<WORD` line and the body up to the terminator are data (the engine does not look inside). Approximate (not modelled): `eval`, aliases, and anything else the grammar does.
 */
export function commandNodes(cmd) {
  const out = [];
  // Leading keywords are stripped, and at most ONE leading `!`. `time` is NOT stripped: the engine matches the node text
  // including `time` (so `time gh pr merge 7` runs under a gh-only rule), and `! ! gh pr merge 7` runs too (engine-confirmed).
  const kw = /^(?:(?:\{|then|do|else|elif|if|while|until)\s+)+/;
  const strip = (t) => t.replace(kw, "").replace(/^!\s+/, "").replace(kw, "");
  const push = (t) => { const x = strip(t.trim()).trim(); if (x && x !== "}" && x !== "fi" && x !== "done" && x !== "esac") out.push(x); };
  // Scan [from, end) and return {text, next}; `closer` is the character that ends a substitution or group.
  function scan(str, from, closer) {
    let seg = "";
    let i = from;
    let q = ""; // "" | "'" | '"'
    while (i < str.length) {
      const ch = str[i];
      const next = str[i + 1];
      if (q === "'") { seg += ch; if (ch === "'") q = ""; i++; continue; }
      if (ch === "\\") {
        if (next === "\n") { seg += ch + next; i += 2; continue; }
        seg += ch + (next ?? ""); i += 2; continue;
      }
      if (ch === "`") {
        const end = str.indexOf("`", i + 1);
        const stop = end < 0 ? str.length : end;
        for (const n of commandNodes(str.slice(i + 1, stop))) out.push(n);
        seg += str.slice(i, Math.min(str.length, stop + 1)); i = stop + 1; continue;
      }
      if (ch === "$" && next === "(") {
        const r = scan(str, i + 2, ")");
        seg += str.slice(i, r.next); i = r.next; continue;
      }
      if (q === '"') { seg += ch; if (ch === '"') q = ""; i++; continue; }
      if (ch === "'" || ch === '"') { q = ch; seg += ch; i++; continue; }
      if ((ch === "<" || ch === ">") && next === "(") {
        const r = scan(str, i + 2, ")");
        seg += str.slice(i, r.next); i = r.next; continue;
      }
      if (closer && ch === closer) { push(seg); return { next: i + 1 }; }
      if (ch === "<" && next === "<" && str[i + 2] !== "<" && str[i - 1] !== "<") {
        // Heredoc. The engine does NOT look inside it (engine-confirmed: `cat <<EOF`, a substitution in the body, and
        // `cat <<EOF; gh pr merge 7` all RUN), so the rest of the line and the body up to the terminator are skipped as data.
        // That is the dangerous direction: a shell would run a substitution in an unquoted body. Recorded as a known hole.
        const m = /^<<(-?)\s*(['"]?)([A-Za-z_][\w-]*)\2/.exec(str.slice(i));
        if (m) {
          push(seg + m[0]); seg = "";
          const nl = str.indexOf("\n", i + m[0].length);
          let pos = nl < 0 ? str.length : nl + 1;
          i = str.length;
          while (pos < str.length) {
            let end = str.indexOf("\n", pos);
            if (end < 0) end = str.length;
            const line = str.slice(pos, end);
            pos = end + 1;
            if ((m[1] ? line.replace(/^\t+/, "") : line) === m[3]) { i = pos; break; }
          }
          continue;
        }
      }
      if (ch === "(") { push(seg); seg = ""; const r = scan(str, i + 1, ")"); i = r.next; continue; }
      if (ch === ")" ) { push(seg); seg = ""; i++; continue; }
      const redirectAmp = ch === "&" && (str[i - 1] === ">" || str[i - 1] === "<" || next === ">");
      if (ch === "\n" || ch === ";" || ch === "|" || (ch === "&" && !redirectAmp)) { push(seg); seg = ""; i++; continue; }
      seg += ch; i++;
    }
    push(seg);
    return { next: i };
  }
  // top level: nodes found inside substitutions were pushed first; the enclosing node is pushed when its separator is reached.
  scan(cmd, 0, "");
  return out;
}

/** cmd -> true when any command node is denied (see commandNodes). The whole line is not matched. */
export function deniedBy(rules) {
  const decide = decider(rules);
  return (cmd) => commandNodes(cmd).some((n) => decide(n) === "deny");
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
