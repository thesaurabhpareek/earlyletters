# Engineering design for the locked requirements pack (new scope)

Status: written 20 Nov 2026 from the locked pack (#846 at `450bcb4a`); each file goes up as its own docs PR and needs two counted reviews. Owner: Karma (engineering thread); the harness claim is the "new-scope engineering design" row in `docs/agents/BOARD.md`.

## How to read this folder
- The locked cards win over everything here (CR-66). A design that finds a card wrong writes a Conflict line and sends it to product; it never builds the other way.
- Tags follow `docs/tdd/01-mobile-client.md`: Fact (file:line), Assumption, Rec, Risk, OQ (owner and default), Conflict, Unverified.
- Depth follows the card's wave in `13-engineering-plan.md` section 4 and #847: waves 1 and 2 are full designs, wave 3 an outline, waves 4 and 5 one paragraph. Built or in-review cards (NS-01 photo, NS-02 Find, NS-35 one start, NS-09 let it go) are recorded, not redesigned; only their open rows are designed.
- The task-level plan, owners and sequence are in `docs/product/prd/17-engineering-project-plan.md` (#847). Rows marked "PR breakdown: see design" take their PR list from these files.
- Words a parent reads appear only as content keys marked PROPOSED. The founder approves words (`content` drafts them, BL-965).

## Files
| File | Covers | Lens A / lens B for its PR |
|---|---|---|
| `architecture.md` | System view, layers, boundaries, API and sync contract changes, cross-cutting patterns AP-n, sequencing, the cross-check of every design (AX-1 to AX-17) | data-steward / security-architect |
| `security.md` | Threat model for the pack: boundaries B1 to B7 (eval C TB6 to TB8 join as B8 to B10, CR-67 AX-17), controls NSC-n, the X2 rule for a child's voice or picture, lane conditions | principal-architect / security-architect |
| `privacy.md` | DPIA rows per card, consent and notice, the App Store label per card, the one inventory PR per wave (BL-960), level rulings, founder and counsel questions | principal-architect / compliance-engineer |
| `data-and-sync.md` | Every schema change in order (phone L11 to L15, server S1 to S5, H1), field groups, the seal pull clause, export minors, deletion per field, the F4 migration checklist, tests | principal-architect / data-steward |
| `08-keeping.md` | NS-08 to NS-12: let it go open rows, NS-10 account and consent, keep-safe readiness | principal-architect / security-architect |
| `09-capture.md` | NS-13 to NS-20 and NS-04: reminders back-off, typed days, signs-as, languages, the hands-free spike | principal-architect / compliance-engineer |
| `10-reading-and-family.md` | NS-21 to NS-31 and NS-05, NS-06: the letter page, calm header, one past letter, share, Firsts and seals, co-parent | principal-architect / design-systems |
| `11-foundations.md` | NS-32 to NS-37 and the open rows of NS-01, NS-02, NS-07: reminders, accessibility, speed budgets, data rules, Book speed | principal-architect / design-systems |

## Inputs these designs fold in (cited, not repeated)
- The product thread's engineering evaluation of the same pack, cited as eval A (data and sync), eval B (mobile client) and eval C (platform, quality, delivery): branch `docs/eng-eval-20nov` at `6c011919`, `docs/engineering/eval-20nov/`. It is input, not a second design. ADR numbers 0029 to 0039 are the ones eval C s1.4 proposes; no design allocates its own.
- The product thread's end-to-end UX drafts (`docs/design/e2e/**`, branch `docs/e2e-ux-20nov`, in progress). Error and state keys follow its state suffixes (architecture.md section 3).

## Rulings on the conflicts between designs
Karma's rulings on AX-1 to AX-17 and on the eleven decisions `architecture.md` section 7 asks for are recorded as CR-67 in `docs/agents/cto/RULINGS.md`. Questions only the founder or counsel can answer are collected, with defaults, in #847 section 5.3 and the counsel packet update (BL-949); none is decided here.

## Code findings from the designs (code reading, not a phone)
| Finding | Where | Card row | Fix owner |
|---|---|---|---|
| A second signed-in account sees the first account's book | `first-run/gate.logic.ts:110-125`; `sync/ownership.ts:49` stops only sync | NS-10-R3, [X4-R1] | BL-961 (both halves, CR-67 AX-12) |
| A consent retry writes a second acceptance row | `consent.ts:117` makes a new key per call | NS-10-R7 | quiet-and-consent fix, then BL-978 |
| Reminders still come for a quieted book | `reminders/prefs.ts:115-117` | NS-32-R14, J-N19 | quiet-and-consent fix |
| "A month ago" ignores Quiet this book | `draft-card.logic.ts:190-206` | J-N19 | quiet-and-consent fix |
| Sign-out leaves reminders planned | card NS-13-R14 says not built | NS-13-R14 | BL-967 |
| No switch for the system writing tools on a text field | React Native 0.86.3 has no prop | ruling D2 | CR-67 AX-1 |
| Caption and place ceilings count code points | #835 `migrations.ts:460-461` | NS-01 caps, BL-957 | photo stack, before #835 merges |
