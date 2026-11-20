# Execution readiness, 20 Nov 2026: what is ready and how to start

Owner: Karma (CTO). Status: preparation only. No app code, migration, workflow change or build has been started. Work starts when the founder says "start".

Tags: [V] checked against a file or command, [E] estimate, [U] not verified.

## 1. What exists (all on develop unless marked)

| Folder | What an agent reads it for |
|---|---|
| `inputs/` | What the rev 2 lock (#934, merged 88f3a975) adds over the first pack; the re-sync list |
| `experience/` | Experience, motion and accessibility acceptance per screen |
| `quality/` | Test-case catalogues A to D, journeys and device sheets, definition of done, checks and balances C-03 to C-10 |
| `security/` | Secure-coding checklist, abuse and failure cases, security and privacy acceptance, open questions |
| `performance/` | NFR budgets, measurement plan, content-free observability, code-quality gates |
| `libraries/` | What we already have, adoption rules, adopt or avoid decisions |
| `skills/` | Brief template, skills matrix, knowledge packs, harness gaps |
| `briefs/{mobile,data,platform}/` | One brief per task: goal, files, tests, budgets, order, who reviews |
| `docs/tdd/new-scope/` | Architecture, security, privacy, data and sync, designs 08 to 17 |
| `docs/agents/cto/RULINGS.md` | CR-66 to CR-69 bind engineering choices; CR-69 A1 to A13 close the open architecture questions |

Not merged yet [V at 21:10 UTC]:
- PR #847 (engineering plan `17-engineering-project-plan.md` plus `17b-engineering-plan-new-scope.md`): re-synced to rev 2 and CR-69; needs the founder's size exception and two reviews at its head.
- PR #993 (errata E62 to E68, closures CL-136 to CL-142): product's; the plan cites it and says so.
- PRs #994 to #996: amendments to the earlier designs (32 of 45 applied; 13 deferred, section 6).
- PRs #946 and #952: two platform briefs awaiting review.

## 2. Rules that hold for every task

1. The cards win (CR-66). A statement that builds against a locked card needs a Conflict line to product, never a silent choice.
2. The constitution holds: the machine may remove and repair, never add meaning; no content in logs, analytics or crash reports.
3. Words a parent reads are PROPOSED content keys only; the founder approves them.
4. Merge gate D-132: two independent counted reviews at the exact head, green `required` CI; app code also needs the green macOS store-profile launch. Reviews are posted only after the reviewer hands back and the head is at least 10 minutes old.
5. Founder-only: legal merges (docs/legal only, D-132), applying hosted migrations, accounts, secrets, money, dependencies, size exceptions, workflow patches, dates.
6. Claim the work on `docs/agents/BOARD.md` before starting, one brief per agent, one concern per PR, at most 400 changed lines.
7. Numbers: migration numbers come from merge order, never from a design (CR-69 A11); ids from `scripts/agents/next-id.mjs`.

## 3. Execution sequence (the plan governs; this is the shape)

Source: plan 17 and 17b, the three brief READMEs (`briefs/*/README.md`). Waves and sizes there are [E].

1. Start-now work with no founder step: the data briefs T1 (synced-column drift guard), T3 (phone-class label check) and BL-959; the CI and platform briefs that need no workflow paste; the photo stack reviews (#835 to #840; merging them needs the founder's size exceptions).
2. Wave 1 fixes: second-account book (BL-922, BL-961), consent retry, quiet books, held screen. These come before any new field group.
3. Early work the plan places before the first-run drop: days stack A, the one kill-switch PR (CR-69 A5) and the notification budget registry (BL-966, `TOTAL_MAX = 60`, plan notices first). Which build each ships in is the plan's drop table (17b), a recommendation until you confirm.
4. First-run Drop D (NS-38 to NS-45, 21 PRs [E]) ships before any family outside the founder's signs in (E43). Consent order (CR-69 A6): founder applies migration `20261108000000`; builder ships with its release blocked until the APPLY.md file 29 check is shown; measured gate (zero null `app_build` sheet acts for 14 days, engineering default); then the founder sets `app.consent_fields_required`.
5. Drop B (days B stack) only if its gates close before the 1.0 freeze; Drop C and NS-52 after 1.0 is approved; NS-51 is a spike in Build 13 and ships in 1.1 after counsel and device rows (E32; the plan states this as a default, the founder confirms).
6. Platform: label guard activation, SHA pins, secret scan, PR size and coverage jobs, lint introduction; each needs a founder workflow paste or dependency approval first.

## 4. Readiness checklist (what "ready" means here)

- [x] Rev 2 requirements locked by product; errata E1 to E61 merged; E62 to E68 open on #993.
- [x] Architecture designs 12 to 17 merged; CR-69 merged.
- [x] Quality catalogues, NFR budgets, security acceptance, libraries and skills merged.
- [x] Briefs merged except #946 and #952 [V].
- [ ] Amendments #994 to #996 merged.
- [ ] Plan #847 reviewed; founder size exception.
- [ ] Product and design open questions answered: my 24 product and 13 design question rows are PR comments starting `<!-- req-question:<row id> -->` on #934 (merged) and #935 (closed, superseded by #978); product was asked on 20 Nov to close them in one errata round.
- [ ] Founder decisions in section 5.

## 5. Founder decisions, with my recommendation (none are decided here)

| Item | Recommendation |
|---|---|
| Size exceptions: plan 17 (859 lines) and 17b; photo stack #835 to #840 (783, 1015, 732, 629, 603 and growing); H1 | Accept the plan; accept the photo slices as they are one concern each; refuse #798 whole |
| New dev dependencies (jest-expo, React Native Testing Library) and runtime `expo-video` after 1.0 | Approve the test pair; defer `expo-video` to after 1.0 (CR-69 A8) |
| Workflow pastes: ratchet fetch step then `RATCHET_BASE_REQUIRED=1`, merge-queue `skipped` rule and `eas.json` in the `changes` match, two-job deploy (F4) | Paste in that order, fetch step before the variable |
| Applying `20261108000000` and the other hosted migrations; setting `app.consent_fields_required` | Apply first, set last (CR-69 A6) |
| Counsel questions: share a picture (Q45), region hook fails open or closed (Q57), seals (Q50), source licence (L-8) | Send the packet; defaults in the cards stand until answered |
| Words: NS-42-R18 notice, neutral lock body, Find lines, held screen, character-limit line | Review the PROPOSED keys together in one sitting |
| Variant B (pictures leave the phone, `mediaSync`) | Not now; not built or chosen |
| Drop lines and 1.1 for NS-51 | Keep the defaults in the cards |

## 6. Follow-ups already known

- Data, security and lifecycle pack: `data-security/00-README.md`; executive-aligned decisions: `DECISIONS-20nov.md` (what you decide is its section 8).

- Deferred amendments (13): ADR 0028 edits (16-A-1 to A-3); AUTH_SETUP.md (12-A11); chapters 05 and 07 (12-A14, 16-A-15); `supabase/APPLY.md` (12-A15); quality catalogue (12-A12); BOARD.md (12-A13); the kill-switch PR (16-A-12); cards (17-A14, 16-A-14); 12-A16 pending the CF-1 ruling.
- For `qa`: catalogue A row NS-32-R7 and `CHECKS-AND-BALANCES.md:176` still say 64; the fact is 60 in total (E13, CL-115, CR-69 A1).
- For BL-964 (`qa`) and CI-SIZEGATE (`ops`): copy the CI-PIN ratchet rule word for word.
- Open conflicts for product: CF-1 (`age_signal` leftovers) and CF-8 (region refusal against NS-41-R2).
- Possible bug to fix when work starts: dates of birth in `Invalid ISO date` errors (`packages/core/src/age.ts:15`, `child.ts:28,33`) [U: found earlier in this session, re-check before fixing].

## 7. Not verified here

Review counts, sizes and heads of open PRs change by the hour; read them live. Device behaviour, macOS queue times and hosted database state were not touched.
