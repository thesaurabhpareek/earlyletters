// Parser agreement table for HV2-B36 (ASCII only). Each row is a review comment body and whether
// it COUNTS as a pass for its lens under the CR-63 rule in scripts/agents/merge-queue.mjs
// (origin/develop, 20 Nov 2026). `counted` was produced by running merge-queue.mjs parseReview on
// the body; prep.mjs must give the same answer on all rows. The fictional family is Asha.
export const SHA = "a83634ced2a5ecf32717bf833f941b892fc660b9";
const h = (lens, verdict, extra = "") => `## Review ${lens} at ${SHA}: ${verdict}\n${extra}`;

export const CASES = [
  { name: "PASS bare", body: h("A", "PASS"), counted: true },
  { name: "PASS with Must fix: none", body: h("A", "PASS", "Must fix: none"), counted: true },
  { name: "PASS naming a fix", body: h("A", "PASS", "Must fix: the Asha fixture is wrong"), counted: false },
  { name: "PWN with Must fix: none", body: h("A", "PASS WITH NOTES", "Must fix: none"), counted: true },
  { name: "PWN with no Must line", body: h("A", "PASS WITH NOTES", "Looks fine."), counted: false },
  { name: "PWN No Must.", body: h("A", "PASS WITH NOTES", "No Must."), counted: true },
  { name: "PWN There is no must-fix.", body: h("A", "PASS WITH NOTES", "There is no must-fix."), counted: true },
  { name: "PWN naming a fix", body: h("A", "PASS WITH NOTES", "Must fix: rename the helper"), counted: false },
  { name: "CHANGES", body: h("A", "CHANGES"), counted: false },
  { name: "FAIL", body: h("A", "FAIL"), counted: false },
  { name: "BLOCKED", body: h("A", "BLOCKED"), counted: false },
  { name: "PASS. with a full stop", body: h("A", "PASS."), counted: false },
  { name: "lowercase pass", body: h("A", "pass"), counted: false },
  { name: "short sha", body: `## Review A at ${SHA.slice(0, 12)}: PASS\n`, counted: false },
  { name: "uppercase sha", body: `## Review A at ${SHA.toUpperCase()}: PASS\n`, counted: false },
  { name: "Review C", body: h("C", "PASS"), counted: false },
  { name: "leading space", body: ` ${h("A", "PASS")}`, counted: false },
  { name: "CRLF PWN with none", body: h("A", "PASS WITH NOTES", "Must fix: none").replace(/\n/g, "\r\n"), counted: true },
  { name: "bold **Must fix:** x", body: h("A", "PASS", "**Must fix:** the Asha fixture is wrong"), counted: false },
  { name: "Must fix: None", body: h("A", "PASS", "Must fix: None"), counted: true },
  { name: "Must fix: nothing", body: h("A", "PASS", "Must fix: nothing"), counted: false },
];

/** Extra forms CR-63 accepts on a PASS WITH NOTES that has no "Must fix:" line. */
export const PWN_ACCEPTED = [
  "Must fix: none.",
  "No Must.",
  "There is no must-fix.",
  "Nothing must be fixed before merge.",
];
