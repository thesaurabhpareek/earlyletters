// Feature-local copy for the purge worker (brief: new strings live in a copy.ts in the
// feature folder until the content agent moves them into packages/content).
// The account deletion receipts themselves come from packages/content src/emails/account.en.ts.
//
// Content rules apply (CLAUDE.md): no em or en dashes, curly quotes, ellipsis or emoji;
// no fear, guilt or loss language; never a child's name, a letter or anything from a book.
// Placeholders: {app}, {date}, {email}, {kind}, {count}, {runbook}, {run}, {time}.

export const workerCopy = {
  // Sent to family members when a sole parent deletes a book they write in
  // (DATA-REQ-014). Contributors are hidden in v1.0, so this goes out only once they ship.
  contributorNotice: {
    subject: "A book you write in is scheduled for deletion",
    body: [
      "A parent asked us to delete a book on {app} that you write letters in. It will be deleted on {date}.",
      "Your letters are yours. To keep a copy, open {app} before then and choose Settings, Your data, Export everything.",
      "Questions? Write to us at {email}.",
    ],
  },

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
} as const;
