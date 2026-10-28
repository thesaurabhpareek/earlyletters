// The red-team verdict shown on the agents board. The board line is read by the next agent
// and by the founder, so whatever this returns is effectively an instruction channel.
// Review bodies are free text written by a reviewer (or, if trust fails, by anyone).
// Harness verdicts are exactly: "ship", "fix first", "founder decision".

/** Returns the verdict of a review body, or "" when there is none. */
export function verdictOf(body) {
  return (String(body ?? "").match(/Verdict:\s*([a-z ]+)/i)?.[1] ?? "").trim().toLowerCase();
}

export function boardRow(pr, body) {
  const v = verdictOf(body);
  return `#${pr}: red team ${v || "no verdict"}`;
}
