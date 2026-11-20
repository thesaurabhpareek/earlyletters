# Go/no-go for build <build number> (<profile>)

<!--
HOW TO FILL THIS PAGE (this block is not counted by the checker and is deleted from the filled copy)

Copy this file to docs/release/go-no-go/<YYYY-MM-DD>-build-<n>.md and fill it by hand. HV2-B43, extends
docs/qa/ALPHA_GO_NO_GO.md with one row per function. Founder reading budget: 5 minutes per build (the checker
caps the page at 900 words, about 5 minutes at 200 words a minute; an estimate, not measured).

Marks, one per row:
- verified: you read the source in this session. Give the source (repo path or https link), the date you read it,
  and the status.
- unverified: you could not read it. Status stays open and the note says what was missing.
- founder-held: only the founder can read or decide it (accounts, money, promises, store clicks). Status stays
  open and the note says what he holds.
Status words are the ones in docs/qa/ALPHA_GO_NO_GO.md: pass, open, fail, n/a (n/a needs a reason in the note).
Ruling id: a CR-, D- or role id (CLO-3) that exists in docs/agents/cto/RULINGS.md, docs/agents/exec/RULINGS.md or
docs/DECISIONS.md on this checkout; "-" when none. Legal, Compliance and Finance read pass only with a CLO-, CCO-
or CFO- ruling id, and that id must also appear in the Source cell (for example docs/agents/exec/RULINGS.md#CLO-3). The council roles are Claude roles, not counsel, and a row is not legal, tax or accounting advice.

Read-only commands for the facts:
  git rev-parse <tag or branch the build is cut from>          (the Commit line, 40 characters)
  gh api repos/thesaurabhpareek/earlyletters/commits/<sha>/check-runs --jq '.check_runs[] | "\(.name) \(.conclusion)"'

Where to look (files that exist on develop; a row may cite others):
  QA              docs/qa/ALPHA_GO_NO_GO.md, docs/qa/DEVICE_TEST_PLAN.md, docs/qa/evidence/, CI run on the commit
  Security        docs/security/REVIEW_R17_CHECKLIST.md, docs/security/SECRETS_REVIEW.md
  Privacy         docs/store/compliance/privacy-labels-apple.md, docs/store/compliance/data-and-account-deletion.md
  Compliance      compliance/README.md, docs/store/compliance/app-review-notes.md, docs/store/readiness.md
  Legal           docs/legal/COUNSEL_PACKET.md, docs/legal/subprocessors.md
  Marketing claims docs/reviews/2026-10-claims-inventory.md
  Support         docs/support does not exist on develop; mark unverified unless you read another source
  Finance         docs/agents/exec/RULINGS.md holds no CFO entry on develop; mark unverified or founder-held
  Design          docs/design/specs, the largest Dynamic Type and VoiceOver rows in docs/qa/DEVICE_TEST_PLAN.md
-->

Commit: <full 40-character sha the build is cut from>
Read on: <YYYY-MM-DD> (UTC)
Filled by: <session or person>
Build record: <path or link, or none>

Each row has one mark: verified (source and date in the row), unverified (not read) or founder-held (only he can read or decide it). This page holds no ship call. The founder makes it in chat.

| Function | Role | Source | Date read | Mark | Status | Ruling id | Note |
|---|---|---|---|---|---|---|---|
| QA | qa agent | <source> | <YYYY-MM-DD> | <mark> | <status> | - | <note> |
| Security | CISO role | <source> | <YYYY-MM-DD> | <mark> | <status> | - | <note> |
| Privacy | CPrivO role | <source> | <YYYY-MM-DD> | <mark> | <status> | - | <note> |
| Compliance | CCO role | <source> | <YYYY-MM-DD> | <mark> | <status> | - | <note> |
| Legal | CLO role | <source> | <YYYY-MM-DD> | <mark> | <status> | - | <note> |
| Marketing claims | CMO role | <source> | <YYYY-MM-DD> | <mark> | <status> | - | <note> |
| Support | support agent | <source> | <YYYY-MM-DD> | <mark> | <status> | - | <note> |
| Finance | CFO role | <source> | <YYYY-MM-DD> | <mark> | <status> | - | <note> |
| Design | CDesO role | <source> | <YYYY-MM-DD> | <mark> | <status> | - | <note> |

Roles are Claude roles, not counsel. A row is a reading of a source on the date shown.
