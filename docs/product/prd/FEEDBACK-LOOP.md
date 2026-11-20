# Requirements feedback loop: how a question, a piece of feedback or a review comment becomes a closed requirement

Status: CURRENT | Owner: product | Replaces: none | Load when: any question, feedback or review comment touches a requirement

Written 20 Nov 2026 after the founder's directive of the same day, quoted verbatim as items 34 to 40 in `FOUNDER-MESSAGES-VERBATIM.md` (items 34 to 38 summarised here; item 34: finalize and lock, listen to engineering and fix gaps; item 35: ask engineering their plan and what help they need; item 36: continuous integration and continuous development, not sequential, product reactive to engineering, everyone reviews, keep learning, the harness learns which feedback is worth asking the executives about, a loop that improves by itself; item 37: update the harness, a smart self-healing harness with a feedback and self-improvement loop; item 38: align the harness backlog for CTO review, apply CTO feedback, execute after approval, inform all agents of their new operating style). In short: work runs like continuous integration and continuous development, not in sequence. Product is reactive to engineering questions and clarifies requirements. Design, policy (legal, compliance, privacy), security, QA and engineering review requirements in parallel. Engineering reviews the final requirements and keeps updating its plan. The harness keeps learning from feedback, and it learns which questions are worth asking before it goes to the executives for approval. Docs only: this file changes no card, no code and no script. Harness changes are proposals in `docs/ops/proposed/requirements-feedback-loop.md`.

## Quick reference (load this alone if that is all your budget allows)

1. Ask through the existing channels only: a PR comment starting `<!-- req-question:<row id> -->`, or a handoff to `product` (`node scripts/agents/handoff.mjs open --from <you> --to product --kind question`). Fields: row id, what is unclear, evidence (file:line or id), what it blocks, your proposed answer.
2. Before asking, search the record: card row, `18-errata-after-lock.md`, `GAP-LOG.md` "Closures 20 Nov", `docs/DECISIONS.md`, rulings. If it is there, do not ask; cite the id.
3. Product triages in this order: A answer from record, F needs evidence (cheapest check first), E founder-only, C cross-lens, D exec ruling, B clarify in place. Section 3 has the rule.
4. Nothing waits in a line. Lens reviews (design, policy, security, QA, engineering) run at the same time. A fact check runs while they do.
5. Only three things are gates: the founder-only list (Karma, section 3), the X2 security and counsel read, and the merge gates (D-132: two counted reviews at the full 40-char head sha, green CI).
6. Changing a locked statement needs an errata row (next free E number, now E69) that lists every changed id and ends with a "Plan delta:" line. A clarification that changes no meaning needs only a line in the PR body naming the id.
7. Apply the change to the card in the same PR as the errata row. Tell engineering the same day by handoff, with the plan delta.
8. Silence past the target time means the stated default stands, except founder-only and counsel items, which wait with their safe default in force and nothing irreversible done.
9. Only class E reaches the founder: batched, one digest line a day, each with a default and a deadline. Never one at a time.
10. Weekly: classify the week's questions, turn repeats into a rule in the card or a default, prune what is stale, then Karma reviews before a lesson becomes a rule.

## 1. The loop in one picture

Everything in the same column runs at the same time. A step waits only where a gate is marked.

```
 INTAKE            TRIAGE              CLARIFY / DECIDE            APPLY IN PLACE        NOTIFY               ENGINEERING PLAN       LEARN
 (any agent)       (product, minutes)  (parallel lanes)            (product, same PR)    (product, same day)  (engineering)          (weekly)

 PR comment   -->  class A..F     -->  A cite id, close       -->  edit card row    -->  handoff to each  -->  plan delta read,   -->  retro: classify,
 handoff           by the rule in      B edit the row               add errata E-row,      owner named in        plan re-synced,        find repeats,
 label             section 3           C lens reviews at once:      add CL- closure        the row               reply "answered"       write the rule,
                                         design | policy |         line in GAP-LOG,        digest line           with "plan: none       prune, measure
                                         security | QA |           test plan row if       to chief-of-staff     | re-size | re-order
                                         engineering               a P0 row moved                              | new row | drop"
                                       D exec ruling (Karma
                                         routes to owner)
                                       E founder queue  ====[GATE 1: founder-only, founder gate 10a]==>  one batched ask, default and deadline
                                       F cheapest check, then re-triage

 Other gates:  [GATE 2: X2 security read + counsel read, before a child's voice or picture leaves the phone]
               [GATE 3: merge, D-132: two counted reviews on the head, green CI; fenced paths add CCO and Karma, CR-27; legal text is the founder's merge]
```

The only sequential steps, stated exactly:

| Gate | What waits | Source |
|---|---|---|
| 1. Founder-only list and the founder gate | Money, what a user is promised, retention promises, children's data law, scope and dates, accounts and secrets, one-way doors, legal text merges, his hours. The question waits for his answer or for its stated default, and nothing irreversible happens meanwhile | Karma skill section 3, section 10, section 10a |
| 2. X2 | A copy of a child's voice or a picture leaving the phone needs a `security-architect` read and a counsel read first (E23 extends it to a picture sent to another person) | `00-product-frame.md` X2, `18-errata-after-lock.md` E23 |
| 3. Merge | A PR merges only with two independent counted reviews on the head and green CI; a review counts only if its first line is `## Review A at <40 hex>: PASS` (or `PASS WITH NOTES`, Review B likewise) and the sha equals the head | D-107, D-117, D-132, CR-44, `COORDINATION.md` section 6 |

Counsel's sign-off on legal text is also a wait; it is part of gate 1 and gate 2. Everything else is parallel: lens reviews do not queue behind each other, engineering does not wait for the merge (it builds to the errata row, as `18-errata-after-lock.md` says), and a fact check runs while the lenses read.

## 2. Intake: where a question goes

Use what exists. No parallel process, no new register (`COUNCIL.md` section 5, "No new registers").

| Channel | Use it when | How | Who answers |
|---|---|---|---|
| PR comment tagged with the row | You are reviewing or building a PR and a requirement row is unclear | First line `<!-- req-question:<row id> -->` (for example `NS-06-B27`), then the fields below. Start every agent comment with its own `<!-- agent:<handle> -->` line as well (`OPERATING_MODEL.md` section 4) | `product` on its next run |
| Handoff issue | The question is not tied to a PR, or it needs more than one recipient | `node scripts/agents/handoff.mjs open --from <you> --to product[,<lens>] --kind question --title "<row id>: <what>" --body-file <file>`. Handoffs are the questions table: the board's "Handoffs waiting" column and `ledger.mjs` already count them (`AGENT-COMMS.md` sections 1, 4, 6) | each recipient replies once |
| Label proposal | Many comments share one cause | Open a handoff of kind `rfc` to `product` proposing a label or a rule. Labels are created only through the harness owner (`OPERATING_MODEL.md` section 8) | Karma |
| Interactive session | A person or session cannot write to GitHub (a refused write: do not retry, `OPERATING_MODEL.md` section 8) | Put the fields in the PR body under "Questions" and say what was not posted | `product` reads the PR |

Required fields (body of the comment or handoff, under 30 lines, no user content, no child names, no real family details):

- **Row id:** the card row or id (`NS-06-B27`, `E14`, `CL-015`, `D-082`). One question per row id.
- **What is unclear:** one sentence, with the two readings if there are two.
- **Evidence:** file and line, test name, or id. What you already searched, so product does not repeat it.
- **What it blocks:** the PR, the backlog row, the gate (G0 to G6) or the test, and since when.
- **Proposed answer:** what you will do if nobody answers, and why it is safe. A question without a proposed answer is returned for one.

Product replies once with a status that matches `AGENT-COMMS.md` section 3: `answered`, `done` (the card is edited; link the PR), `declined` (cite the rule), or `blocked` (on what, and who has it).

## 3. Triage: the decision rule an agent can run

Product runs this on every question, in this order, and stops at the first class that fits. A question can have a part for two classes; split it and handle each part (Karma skill section 3, last paragraph).

```
1  ANSWERED?     Is the answer in a card row, an errata row (18), a closure (GAP-LOG "Closures 20 Nov"),
                 a D- entry, an ADR, a CR- or exec ruling, or a default list (D1..D13, T1..T5, README defaults)?
                 YES -> class A. Reply with the id. Close. Do not edit anything.
2  MISSING FACT? Does the answer depend on a fact nobody has checked (code, a test, a source for a law,
                 an Apple rule, a vendor term, a device result)?
                 YES -> class F. Name the cheapest check (grep, read the file, run one test, read the source),
                 run it, then go back to step 1 with the result. UNVERIFIED stays marked if the check cannot run.
3  FOUNDER-ONLY? Does any part touch the list in Karma's skill section 3: money; what a user is promised;
                 retention promises; children's data law; scope, dates, pricing, Plus contents, analytics on or off;
                 a change to a founder decision; accounts, secrets, hosted migrations; one-way doors;
                 legal text merges; the founder's hours?
                 YES -> class E for that part. Rule the rest. Prepare: recommendation, safe default, deadline,
                 debate record (founder gate 10a). Send only through the batched queue (section 7).
4  CROSS-LENS?   Does the answer change what the parent sees or hears (design), a promise, consent, data or a
                 store rule (policy), a threat row, key, access or X2 path (security), a testable row or a P0
                 (QA), or cost, order or built code (engineering)? Is it a door (sign-in, consent, age,
                 deletion, account support)?
                 YES -> class C. Open the lens reviews at once (section 4); product does not wait to start the edit.
5  OTHER EXEC?   Is the decision inside another executive's domain by COUNCIL section 4 and not founder-only?
                 YES -> class D. Karma routes it to the owner (table below); the owner returns RULED, FOUNDER,
                 NOT A QUESTION or NEEDS EVIDENCE. Record in `docs/agents/exec/RULINGS.md`.
6  OTHERWISE     Product can settle it by editing the row. -> class B.
                 B1: the edit changes no meaning (a cite, a typo, a worked example, a test title). Edit in place,
                     list the id in the PR body. No E number.
                 B2: the edit changes meaning. Test: could someone write a test from the old text and a test
                     from the new text that pass or fail differently? If yes, it is B2: an errata row.
```

A question that is class C or D may also contain a class E part; a class A answer may reveal that the record is wrong, which makes it a B2 correction of the record.

Who owns which topic (from `COUNCIL.md` section 4; Karma is the front door for all of them):

| Topic | Owner exec | Also consulted |
|---|---|---|
| Code, architecture, CI, branches, release mechanics, the harness | CTO (Karma) | CISO, CAIO |
| What is in a release, scope, priority, metrics, the PRD | CPO | CTO for cost, CDesO, CBO and CFO for Plus or pricing |
| How something looks, feels or reads | CDesO | CPO; CPrivO if it shows personal data |
| Website, store listing, launch, any public claim | CMO | CLO, CCO, CPrivO, CAIO |
| Pricing model, Plus, partners, print, distribution | CBO | CFO, CLO |
| Spend, subscriptions, runway, tax, entity | CFO | CBO, CLO |
| Terms, contracts, IP, names, trademarks, disputes | CLO | CCO, CPrivO |
| Which laws or store rules apply; the obligations register | CCO | CLO, CPrivO |
| Personal data, consent, retention, deletion, the privacy label, children | CPrivO | CCO, CISO, CDO |
| Threats, keys, accounts, incidents, dependencies | CISO | CTO, CPrivO |
| Data model, analytics, data quality | CDO | CPrivO always, CTO |
| Speech models, AI features, agents, evals | CAIO | CTO, CPrivO |

### Worth asking: five tests before a question is opened

Ask only when all of these hold. Otherwise proceed on your proposed answer and put one line in your PR body ("proceeded on <default> for <row id>; reversible by <how>"). Product reads those lines in the weekly retro.

1. **Not already answered.** You searched the record (section 2 evidence) and the answer is not there.
2. **It matters.** The answer changes a build, a test, a user promise, data, money or an account. A taste question inside the content rules does not.
3. **It blocks or cannot be undone.** Either it blocks your work now (a P0 row, a gate, a PR you cannot finish), or the wrong guess is expensive to reverse (data written, a promise made, a migration, a one-way door).
4. **No safe default exists.** If a reversible default is on record or you can name one, use it and log it. Ask when the two readings produce different tests.
5. **The cheapest check is done.** You read the code or the source first (class F is yours before it is product's).

### Do not ask

- Anything on record: cards, errata, closures, D- entries, ADRs, rulings, the default lists. Cite the id.
- Anything the founder's standing answers settle: "Go with all default answers. Focus on what's best for customer experience." Where two defaults conflict, the customer-experience reading wins (founder, 20 Nov).
- A choice between technical options you are competent to make (Karma skill section 10: never ask the founder to choose between them).
- Build numbers or dates. The roadmap owns timing (ruling T5).
- Wording inside the content rules and the BRAND.md glossary: `content` writes, and a content test fails if the words are wrong.
- A fact the code or a file shows. Read it.
- "Should we add this feature?" That is a scope candidate for the CPO and the parked list (`12-parked-and-not-built.md`), not a requirement question.
- Anything addressed to the founder directly. No agent asks the founder anything. Karma does, in the batched form (section 7).
- A question already open as a handoff. Search `to:product` first and add your evidence there.

## 4. Parallel review lanes

When a change is class C, product opens every lane it needs in one step. Each lane works from the same proposed edit and replies in its own comment. Product folds the replies into one edit. A lane that finds a problem says what must change; a lane that passes says `pass` and names what it read.

| Lane | Lead agents (executive) | What it reviews | Pass criteria |
|---|---|---|---|
| Design | `design-systems`, `content` (CDesO) | States, the words a parent sees, accessibility at the largest Dynamic Type, the glossary | Every changed row has its Shown line by `packages/content` key and its states; no internal term reaches a parent (CR-25); the content rules test would pass (no dashes, no fear or guilt, never gender the child) |
| Policy | `privacy`, `compliance-engineer`, `regulatory-affairs`, `legal` (CPrivO, CCO, CLO) | Promises, consent, retention, children's data, store rules, public claims | Door lines present where the row touches sign-in, consent, age, deletion or support (Shown, Records, Never, Decline and withdraw; `COORDINATION.md` section 10); claims enabled and forbidden updated; every legal or platform fact has a source read that session or is marked UNVERIFIED; counsel items are listed, not decided |
| Security | `security`, `security-architect` (CISO) | Threat rows, keys, access rules, X2 paths, what logs hold | Threat row added or confirmed; X2 read named, scheduled or not needed with a reason; nothing in analytics, logs or crash reports names content, audio or a child (log canary) |
| QA | `qa` | Whether each row can be tested and where | Each changed row has Given/When/Then with a number or observable state, a device, a test title and a priority with its RR-4 reason; the P0 register in `14-test-plan.md` and the G0 backlog row (`BACKLOG-GAPS.md`) move with it |
| Engineering | `principal-architect`, `data-steward`, `mobile`, `sync` (CTO) | Feasibility, cost, order, conflict with built code and open PRs | The edit does not contradict code on `develop` or an open PR (checked by file and line); size or order effect is stated as a plan delta (section 5) |

Response-time targets, all PROPOSED (nobody has measured these; the retro in section 6 sets the real numbers):

| Step | Target (proposed) |
|---|---|
| Class A reply | the same run |
| Class F check | one run |
| Triage after intake | one run of `product` (dispatcher priority: handoffs come before backlog tasks, `AGENT-COMMS.md` section 7) |
| Each lens review | 1 working day |
| Class D exec ruling | 2 working days |
| Class E in the founder's digest | the next daily digest; the deadline in each ask is the founder's own to set, default 3 days from the digest |
| Errata batch to engineering notified | the same day the errata PR opens |

**Silence rule.** When a lens, an exec or engineering has not replied by its target, product records "no reply by <time>" in the PR body and the stated default stands. This does not apply to: (a) founder-only items, which keep their safe default in force and are recorded as undecided, with nothing irreversible done; and (b) counsel items and the X2 reads, which are never treated as passed by silence. A lens reply that arrives later still counts and reopens the edit through a new errata row if it finds a problem. Lens replies are advice. Only the two counted reviews at the full head sha let the PR merge (gate 3).

## 5. The engineering loop

Engineering is a lane and also the plan's owner. It is told of every change the day it is proposed, and it keeps its plan current.

Plan homes (read, not duplicated here): `24-engineering-handoff.md` (architecture, conflicts, build order for NS-46 to NS-52, owner `principal-architect`), `23-dependency-map-and-plan.md` (workstreams, order, gates, founder queue, owner `product`), `docs/engineering/plans/locked-pack-plan.md` (product-side sequencing input) and the task-level plan `17-engineering-project-plan.md` (PR #847, plan of record for engineering order; not on this branch when this was written). The readiness files RD-A to RD-G named in the directive were not on this branch either; link them by name when they land.

Rules:

1. **A plan delta line on every errata row.** From E30, the Ruling cell of each errata row ends with `Plan delta: <engineering doc and section or backlog row ids>; <none | re-size | re-order | new row | drop>; <who is told>`. Example: `Plan delta: 24 section 4 step 2.1, BL-977; new row (build NS-09-R6); mobile, principal-architect`. E1 to E29 predate the rule and are not edited; E30 to E32 were given theirs on 20 Nov.
2. **Tell, do not wait.** In the same PR run that adds the errata rows, product opens one handoff (kind `fyi` or `request`) to `principal-architect` and to each owner the plan deltas name. Body: the E numbers, changed ids, plan deltas. Engineering builds to the E row until the PR merges (`18-errata-after-lock.md` header).
3. **Engineering replies in one run** with `answered` and the plan change (`plan: none | re-size | re-order | new row | drop`, and the doc and section it changed), or with a new question in the intake form if the change cannot be built as written. A new question re-enters at section 3, step 1.
4. **Who edits what.** Product edits cards, errata, `GAP-LOG.md` and `23`. `principal-architect` edits `24` and ADR text. Backlog rows follow the backlog rules (the product agent edits `docs/BACKLOG.md`; others change only their own task's status line). No one edits another owner's file; send a handoff.
5. **New P0 row means a backlog row.** Gate G0 holds until every P0 row names a backlog row (E30, `BACKLOG-GAPS.md`). An errata row that adds a P0 row also adds its proposed backlog row to the plan delta.
6. **Engineering is a source of questions.** Its questions are answered ahead of backlog work because handoffs come first in the dispatcher's order. Engineering's proposed answers are accepted as class B or C when no lens objects by the target time.

## 6. The learning loop

The harness learns which questions are worth asking by looking at what it asked.

**Weekly retro (proposed cadence; start with one run of `product`, Karma reviews).** Inputs: handoffs to `product` and `req-question` comments of the week, errata rows added, closure lines added, the journal `Learned:` lines of the agents that asked, and `node scripts/agents/ledger.mjs --since <date> --summary`. Steps:

1. List each question with its class (A to F), the row id, who asked, and time from open to closed.
2. Mark repeats: the same row id twice, the same topic from different askers, or a class A (already on record) question. A class A question means the record was hard to find, not that the asker erred.
3. For each repeat, write the rule that stops it, in the place the next asker looks: a clarifying sentence in the card row (class B1), a line in the default list (README defaults, `GAP-LOG.md`), a pointer in `LOAD-ORDER.md`, or an entry in the do-not-ask list above.
4. Count the metrics below and compare with last week.
5. Prune (see "Keeping context small").
6. Post a short retro entry in the harness lessons file (below). Karma reads it.

**Metrics (proposed targets are not set; take a baseline for four weeks first).** Baseline facts on record on 20 Nov 2026: 68 errata rows (E1 to E68) after the lock, and 142 closure rows (CL-001 to CL-142; CL-001 to CL-113 are the 113 grouped rows: 79 RULED, 32 FOUNDER, 2 EVIDENCE) in `GAP-LOG.md`.

| Metric | How to count it | What a bad trend means |
|---|---|---|
| Question-to-closure time | median and p90 from intake to reply `answered`/`done`, by class | A lane is slow, or the triage order is wrong |
| Repeat-question rate | questions that were class A, or repeat a row id already asked, divided by all questions | The record is hard to find; fix load order and defaults |
| Errata rate per card | errata rows that name the card per week | A card has a drafting problem; send it back to its author for a review |
| Share closed by class A or B without an exec | (A + B) divided by all closed | Low means too much goes up; high with a high errata rate means B2 edits are skipping review |
| Founder asks per week | class E items that reached the digest | Should fall; each one is a failure to rule or to find a default |
| Rework | errata rows that amend an earlier errata row | The change was not reviewed in parallel early enough |
| Lens lateness | lens replies after target, by lane | The target is wrong or the lane is starved |

**Where lessons are recorded.** There is no new register. Two homes already exist:

- An agent's own durable lesson goes in its `agents/<handle>/MEMORY.md` (under 120 lines, replace stale lines) and its journal `Learned:` line (`OPERATING_MODEL.md` sections 3 and 5).
- A lesson about the process itself goes in a dated lessons file next to the one on record, `docs/agents/harness-v2/LESSONS-<date>.md`, in the same format as `LESSONS-2026-11-08.md`.

**How a lesson becomes a rule.** A lesson is a proposal until Karma reviews it. Karma (or the owner exec by section 3) reads the lesson, its evidence (the question ids behind it) and the counter-case, then rules: accepted (the rule is written into its home: a card row, a default list, this file, or a proposal for a charter or skill change, because agents never edit another agent's charter or the CTO skill, `OPERATING_MODEL.md` section 8), rejected (with the reason), or needs more weeks of evidence. An accepted process rule is recorded as a CR- ruling in `docs/agents/cto/RULINGS.md` through a docs PR. A rule that touches the founder-only list is a class E question and goes through the gate; the retro never widens what an agent may decide.

**Keeping context small.** Fewer, better-placed lines mean less to load.

- Every file in `docs/product/prd/` carries a status header (`Status: CURRENT | SUPERSEDED | INPUT`, owner, `Replaces:`, `Load when:`). A file with no header is not loaded by default.
- A replaced file gets a top banner "Superseded by <file>, <date>" and drops out of the load order. Do not delete history; mark it.
- When an errata row is applied in place, mark it applied with the PR in the same PR, so a reader of the card need not load `18-errata-after-lock.md` for that row. Once every row is applied, `18` becomes history.
- Load order and the file registry are kept in `LOAD-ORDER.md` and `REGISTRY.md` in this folder. They were being written by another agent when this was written; this file links by name and does not repeat them.
- Closures stay one line each in `GAP-LOG.md`. The long reasoning lives in the exec ruling the line cites.

## 7. The founder interface

The founder asked not to be asked small things ("Don't keep asking me for these small things." 30 Oct) and to hear only after debate ("Ask me questions post debating with CTO." 31 Oct). So:

- **Only class E reaches him.** A, B, C, D and F never do.
- **Batched, never piecemeal.** Karma holds the class E items and sends at most 4 questions at a time, each with 2 to 4 options and the recommendation first (Karma skill section 10). Dated founder steps go as one entry in `docs/release/FOUNDER_QUEUE.md`.
- **Each item carries:** one sentence of context; risk and return in one line; the default and the date it applies; what was already ruled around it; sources read this session; one line of debate record; and the opening line `Checked: <setup record, PRs of the last 24 hours, coordination docs>` (RS-04).
- **One digest line a day.** `chief-of-staff` adds to the daily digest (`OPERATING_MODEL.md` section 7) one line: `Requirements feedback: <n> opened, <n> closed (A <n>, B <n>, C <n>, D <n>), <n> waiting on you; oldest <id> default <x> on <date>`. The line is the daily total; each waiting item is listed under "decisions only the founder can make".
- **A default is safe by construction.** It is the reversible choice, and the team works on it while the question is open. For a founder-only item the default is not recorded as his decision; it is recorded as the working position until he answers. Nothing irreversible, legal, financial or on an account moves on silence.

His standing delegation, quoted from `FOUNDER-MESSAGES-VERBATIM.md` and the pack's lock:

- 19 Nov: "I approve all requirements. Have full executive team review, critique, provide detailed feedback then have CPO and product agents enhance requirements and lock them down."
- 19 Nov: "Consult with exec team and make all decisions."
- 20 Nov: "Go with all default answers. Focus on what's best for customer experience. And proceed to lock all requirements and once done inform harness and engg leads working on architecture."

Limit, stated plainly: this delegation lets Karma and the executives rule inside their own lanes. It does not move the founder-only list. `COUNCIL.md` section 2 binds every executive to that list, and walls (`docs/agents/WALLS.md`) stay his click. Errata E26 proposes recording the defaults as one delegated D-entry; as of this file that entry is not recorded in `docs/DECISIONS.md`.

## 8. What the harness must change (proposals only)

Nothing below is done. This file works today with handoffs, PR comments, the ledger and the digest as they are. The proposals would take out hand work. The full list, with files, owner, size and the way back, is in `docs/ops/proposed/requirements-feedback-loop.md`. In short:

1. A `req-question` handoff kind and PR label, with the five required fields checked by `handoff.mjs`.
2. A dispatcher rule: a trusted `<!-- req-question:<row id> -->` comment schedules `product` in a triage mode ahead of backlog work.
3. A board lane for requirements questions by class and age.
4. A lens fan-out helper that opens the parallel lens handoffs in one command and flags a lane past its target.
5. Ledger kinds and a small metrics script for section 6.
6. A `Requirements feedback` field in the digest brief.
7. A lint that checks the "Plan delta:" line on new errata rows and the status header on prd files.
8. A weekly retro as a standing duty for `product`.
9. A founder-queue batching check that refuses an ask without the `Checked:` line, a default and a deadline.

Owners are the harness owner (Karma, under D-132) for `scripts/agents/`, the roster and workflows, and the owners of the `product` and `chief-of-staff` charters. Agents do not edit those themselves (`OPERATING_MODEL.md` section 8).

## 9. What this file did not verify

- Response-time targets and the weekly cadence are proposed. No data exists to set them.
- `REGISTRY.md` and `LOAD-ORDER.md` did not exist on this branch when this was written; I link by name only. The engineering readiness files RD-A to RD-G and the task-level plan `17-engineering-project-plan.md` (PR #847) were not on this branch.
- I did not run `scripts/agents/handoff.mjs`, `dispatch.mjs` or `ledger.mjs`. Their behaviour here comes from `AGENT-COMMS.md`, `OPERATING_MODEL.md` and a read of label handling in `scripts/agents/lib.mjs`. A `req-question` kind does not exist yet; until it does, use kind `question` and the comment tag.
- I did not check whether the digest or board already carry a requirements field.
- I did not verify any law, Apple rule or vendor term. This file makes no legal claim.
- The class rule is untested on live questions. The first retro should replay it on the errata rows E1 to E68 and the closures CL-001 to CL-142 and check that each lands in a sensible class.

Sources read this session: `docs/agents/COORDINATION.md`, `AGENT-COMMS.md`, `OPERATING_MODEL.md`, `HARNESS.md` (headings and board and digest references only), `.claude/skills/early-letters-cto/SKILL.md` sections 1, 3, 10, 10a, `docs/agents/exec/COUNCIL.md`, `18-errata-after-lock.md`, `22-final-holistic-spec.md` sections 9 and 10, `GAP-LOG.md` "Closures 20 Nov", `FOUNDER-MESSAGES-VERBATIM.md`, `README.md` of this folder.
