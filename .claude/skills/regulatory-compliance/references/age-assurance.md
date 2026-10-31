# Age assurance: adults only

Engineering notes, not legal advice. Facts with dates; recheck anything older than 90 days before relying on it.

## What we decided
- Early Letters is for adults 18 and over, with no local-only mode for anyone younger (D-006, PRD K-07, PRD-REQ-019, Terms 2.1).
- The child is who the letters are written to. The child is a data subject, never a user.
- The gate asks a neutral question with nothing preselected, before any first action (LEGAL-REQ-002).
- The device stores only `ageGate.passed`, plus `ageGate.stoppedAt` after a No (D-026). An under-18 answer closes the gate for 24 hours on that install.
- Apple's Declared Age Range is to be read where a state requires it and used in memory only, never written to a table, a log or an analytics event. Not built yet (31 Oct 2026), and the API needs iOS 26 while the app's floor is iOS 17, so older phones give no signal.

## The server's part (once sign-in is on: alpha build 2 now, the public in a 1.0.x, D-121)
- The server cannot see the age answer, and should not: storing it would create the age data the gate is designed not to keep.
- What the server can enforce is that no account acts before it has accepted the current Terms, whose acceptance includes the 18+ confirmation (A-REQ-034). That is `policy_acceptances` plus the existing consent gate (`content_gate_state`, `has_active_consent`). Check those before adding anything new.
- An under-18 report from support, or a store signal of a minor after sign-up, is actual knowledge. It needs a runbook that closes the account (letting the person export first where the law allows, Terms 2.1) and writes a content-free `ops.audit_log` row. That runbook does not exist yet (31 Oct 2026). Whether a store signal counts as actual knowledge even after a Yes at our gate is COUNSEL_PACKET Q5(d).

## Laws and platform rules (status as checked)
| Item | Status | Checked | Source |
|---|---|---|---|
| Texas SB 2420 (App Store Accountability Act) | Enforceable. District court enjoined it 23 Dec 2025; Fifth Circuit entered an administrative stay on 28 May 2026 and stayed the injunction pending appeal on 4 Jun 2026; the Supreme Court denied vacatur on 6 Jul 2026; oral argument 4 Aug 2026; no merits decision as of the tracker's 13 Oct 2026 check. | 31 Oct 2026 | texasdatalaw.com/tracker/sb-2420 (secondary; the CCO skill marks the 28 May and 6 Jul dates unverified, so confirm against the court docket before relying on them). Register CR-004. |
| California AB 1043 (Digital Age Assurance Act) | Effective 1 Jan 2027 per the register. Developer duties on requesting the OS or store signal are COUNSEL_PACKET Q5(b). | Not rechecked this session | Register CR-005 (secondary [L15], [L16]) |
| Utah, Louisiana, Alabama app-store laws; Colorado OS-level | Dates per register CR-005 | Not rechecked this session | Register CR-005 |
| COPPA (FTC) | Applies to services directed to children or with actual knowledge of collecting from a child under 13. Our scope question (adults writing about a child) is in the register. | Not rechecked this session | Register; ftc.gov COPPA FAQ |

## What changes on 1 Jan 2027
The register's default (COUNSEL_PACKET Q5): a 1.0.x release in December 2026 that requests the OS or store age signal at launch, holds it in memory, and treats any minor signal as actual knowledge. That release is on the founder's critical path whatever the server-feature releases do.

## Review checklist
- Is the question neutral, with nothing preselected and no hint which answer is "right"?
- Does an under-18 answer create nothing: no child, letter, recording, auth user or upload?
- Is the store signal kept out of storage, logs and analytics?
- Does every new entry point (invite link, deep link, web contribution page) reach the gate first?
