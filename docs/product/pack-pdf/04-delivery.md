# Part V. How we deliver it

## 16. Dependency map

Every card, what it waits on, and the gates that are not engineering (founder, counsel, device runs, words). Arrows point from what must come first to what waits on it.

![Dependency map](/home/claude/pdf/img/deps.svg)

{{DEP_TABLE}}

**Critical path to the next store build.** The photo work is a chain of nine changes that must merge in order (picker and native module, then the store, then capture and Review, then the Photos lens). After it come the fast-Book work and the export schema that carries pictures, which itself waits on the on-device data rules (ADR 0028) merging and on a legal merge the founder owns. Then the device rows and the release candidate. That is about twelve changes in series, about 24 counted reviews at the floor and about 48 at the rate seen so far. The longest founder-held steps on the path are that legal merge and the device run.

**Lanes that never wait on the photo chain.**

| Lane | Work |
|---|---|
| Keeping | Let it go always finishes; the new-phone close-out |
| Floor | Accessibility floor; speed baseline |
| Reminders | Notification budget first, then reminders proven |
| Find | Find, split into reviewable changes |
| Docs and legal | Backup readiness notes; counsel questions; the roadmap; the pilot kit |
| Quality | Requirement tracing for the new ids; device rows; P0 tests for every card |
| Words | Lines for Let it go, Save a copy, Share and one past letter |

## 17. Project plan

All windows are provisional. Release dates and what is in each release are the founder's decisions. No date follows until two things are measured over the first wave: counted reviews per day, and review rounds per change.

| Milestone (provisional) | What ships on | What ships dark | Exit gate |
|---|---|---|---|
| Next store build | Let it go always finishes; new-phone close-out; notification budget; reminders proven; accessibility floor | Photo with a letter, Find, the fast Book, export with pictures (on in test builds, off in the store build until their gates pass) | G0, G1, G4, G5 |
| The one after | Letter page as one list; calm Book header; Save a copy; whose book on Home; Share one letter (words); a letter for another day; one past letter; photo and Find on if their gates passed | | G2 for Share; G3 words |
| Then | Read the year back; printable book (PDF); Firsts if the five-parent study passes; typed days; hands-free spike findings | | Study pass line; export golden test |
| Gated, no window | Sealed letters; quick capture doorways; someone else speaks; each second language; the other parent in the store app | | Counsel answers; the seal sync mechanism; two-phone seal run |

**Gates.**

| Gate | What must hold |
|---|---|
| G0 | Requirement tracing sees the new ids, and every P0 row has a test and a backlog row |
| G1 | The on-device data rules and the export schema they need are merged |
| G2 | Counsel has read what each card names (pilot consent, the photo label line, the shared picture, the new questions) |
| G3 | The founder has approved the words |
| G4 | Every P0 device row passes on the release candidate |
| G5 | The privacy label and claims inventory match what the build sends |
| G6 | No production flag is on while its card has an open P0 |

### 17a. The engineering task list the harness assigns

Every task below is a row in `docs/BACKLOG.md` (BL-922 to BL-987) with its owner, size, what it waits on and the card rows it satisfies. A task is picked by the harness when it is ready, or blocked only on tasks that are done (`scripts/agents/lib.mjs`). "Waits on" in words (a counsel answer, a founder step, an unmerged PR) means a person moves it. Ready now: {ready}.

{{TASKS}}

**Engineering skills by bucket** (agent handles in `agents/roster.json`).

| Bucket | Skills |
|---|---|
| Keeping | mobile, sync, content, qa; security-architect and privacy for backup readiness |
| Capture | mobile, content, qa; data-architect and sync for synced fields; speech for languages |
| Reading and keepsakes | mobile, design-systems, security-architect (native photo module), data-architect, privacy, content |
| Family | user-research (pilot, run interactively), mobile, content, sync, data-architect, security, legal |
| Foundations | design-systems, mobile, qa, data-architect, data-steward, compliance-engineer |

**What is not measured yet**, and therefore why no date is promised: counted reviews per day; review rounds per change (one data point: four); founder hours per device run, word approval and legal merge; counsel turnaround; iOS builds per month against the free limit; whether the hosted agent harness is running; which phones the founder holds.

## 18. Test strategy

Each card's acceptance rows are its unit and integration tests. Above them:
- **Order.** P0 tests are written before or with the code, as tests that fail on the old code. Then integration over the fictional Asha fixtures (1,000 letters, 300 pictures). Then parent journeys. Then the device run sheet, P0 rows first.
- **Priority.** P0 means a promise breaks if it fails (a letter lost, a word changed, a charge out of place, something leaving the phone, a count or guilt line, a name on a lock screen); it blocks any build outside the founder's family. P1 blocks a store build. P2 is tracked.
- **Regression.** Every change: the full test suite, type check, content rules and the trace ratchet. Every merge: the simulator flows, and the kill harness when capture or storage changes. Every store candidate: device P0 rows, an upgrade from the last store build with a seeded book, an export round trip, a privacy label and claims diff. Monthly: the full device plan.
- **Devices.** An iPhone SE (3rd generation), a phone on iOS 17, a current large iPhone, a second phone on the same account, and an iPad (App Review runs the iPhone app there). Every walk with the largest text size and Bold Text, VoiceOver, Voice Control, Switch Control, Reduce Motion, Increase Contrast, Smart Invert, dark mode, Low Power Mode and airplane mode where needed.
- **Real family data never appears in tests.** Device runs use a separate install and a test account that holds only the fictional Asha book.

{{JOURNEYS}}

## 19. Risks

| Risk | Signal | Response |
|---|---|---|
| A recording is lost or a word changed | Any report; the guardrail at zero | Severity 1; durability tests are P0 gates |
| Review capacity, not code, sets the pace | Changes waiting for counted reviews | Small changes; one purpose each; measure throughput in wave 1 before dating anything |
| The photo chain slips | The first change in the chain stays red | Keep the other lanes moving; photo ships dark until its gates pass |
| App Review objects to a feature | A rejection | Nothing placeholder in store builds; hidden features forbidden (2.5.19); labels match behaviour |
| A legal reading is wrong | Counsel answers differ from defaults | Every legal default is reversible and held unpublished until counsel confirms |
| Free-plan limits are hit | The weekly check (database and accounts) and the manual storage and egress read | Backup stays off; pictures stay on the phone |
| Parents do not want what we rank | Tester answers, the pilot read-out | The cheapest tests run first (the pilot, hand-sent measures); the rank moves on evidence |
| Apple adds child-centred features to its own apps | New iOS releases | Our moat is the visible change list, two authors and the book by age |

## 20. Decisions on record, and what is still open

**Decided by the founder:** three tabs; no co-parent "coming soon" in any build; the requirements approved (19 Nov); the photo size exceptions, merging the tab decision record, and the ready-for-review steps on the data rules and Find (20 Nov); first store release servers on with sign-in, automatic release, production on the Free plan.

**Decided by Karma under the founder's delegation (20 Nov), reversible:** sign-out keeps the book on the phone and says so; system writing tools off on letter fields; no system-intelligence donation; tester measures deleted after 90 days; pilot consent kept 12 months after the read-out; the stored photo copy keeps up to 4,032 px; every capability that ships free in the 1.0.x line stays free; undo windows wait for VoiceOver; cards carry no build numbers.

**Still the founder's:** word approvals; any spend (storage, devices, proof books, reviewers); the backup flip; release dates; which phones he holds; legal text merges.

**Still counsel's:** the questions in the counsel packet that each card names, including a baby's voice and picture, another adult's words, shared-book deletion, plan-notice timing, retention, and the new questions raised in the council review.
