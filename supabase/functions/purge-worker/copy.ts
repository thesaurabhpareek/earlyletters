// Feature-local copy for the purge worker (brief: new strings live in a copy.ts in the
// feature folder until the content agent moves them into packages/content).
// The account deletion receipts themselves come from packages/content src/emails/account.en.ts.
//
// Content rules apply (CLAUDE.md): no em or en dashes, curly quotes, ellipsis or emoji;
// no fear, guilt or loss language; never a child's name, a letter or anything from a book.
// Placeholders: {kind}, {count}, {runbook}, {run}, {time}.

export const workerCopy = {
  // Internal alert to the founder (hello@). Counts and runbook names only.
  alert: {
    subject: "Deletion pipeline needs attention",
    intro: "The purge worker found something that needs a look. This email holds counts only, no ids and no personal details.",
    line: "- {kind}: {count}. Runbook: {runbook}",
    footer: "Worker run {run} at {time} UTC.",
  },
} as const;

/** Which runbook each alert points to (docs/ops/runbooks). */
export const ALERT_RUNBOOK = {
  tombstones_overdue: 'docs/ops/runbooks/purge-failing.md',
  request_stuck: 'docs/ops/runbooks/stuck-deletion.md',
  step_failed: 'docs/ops/runbooks/stuck-deletion.md',
  step_retrying: 'docs/ops/runbooks/stuck-deletion.md',
  queue_stuck: 'docs/ops/runbooks/purge-failing.md',
  purge_silent: 'docs/ops/runbooks/purge-failing.md',
  purge_failing: 'docs/ops/runbooks/purge-failing.md',
  residue: 'docs/ops/runbooks/stuck-deletion.md',
  apple_no_token: 'docs/ops/runbooks/stuck-deletion.md',
  apple_config: 'docs/ops/SECURITY.md',
  holds_review: 'docs/ops/runbooks/stuck-deletion.md',
  scheduled_overdue: 'docs/ops/runbooks/purge-failing.md',
  pepper_missing: 'docs/ops/runbooks/stuck-deletion.md',
} as const;
