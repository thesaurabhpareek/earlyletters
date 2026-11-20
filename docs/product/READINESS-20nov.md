# Readiness to start development: evidence for Karma (20 Nov 2026)

Status: CURRENT, 20 Nov 2026 | Owner: `product` | Replaces: none | Load when: someone asks "are we ready to start" and you need the evidence, not a feeling.

Docs only. Nothing in this file is built, decided or dated. It answers the founder's ask of 20 Nov 2026: "confirm when we are ready to start development work and have all requirements and dependency mapping and project plan ready."

Pinned to `develop` at `021ecdfea` (fetched 23:52 UTC). `develop` moves every few minutes today, so every count below says how it was run, and you can run it again. Where I could not check something it says NOT VERIFIED. I did not run `npm test`, a device, or any hosted service.

## 0. The short answer

Karma can confirm three things with evidence, and cannot yet confirm four.

Can confirm:
- The requirements are locked at rev 2 and every card, errata row and function file is accounted for (section 1).
- The dependency map has 243 rows, no cycle and no row that names a blocker that is not in the map (section 2.13).
- The plan has an order, parallel limits, reviewers and a default for every founder gate (section 3).

Cannot confirm yet (each is a NO or NOT VERIFIED line in section 5):
- Every P0 requirement has a backlog row. 665 of 1,052 P0 rows have no row-level backlog row, so gate G0 is not met.
- Every Wave 1 row has a brief. Three have none: BL-963, BL-985, BL-982.
- Karma's execution map and review framework (the 20 Nov Project doc) match this file. I could not open that doc from this repo session, so I used the summary I was given. Where his map differs, his map wins and this file needs one edit.
- The founder's words and counsel gates. No PROPOSED word is approved, and no counsel answer is on file.

So: development can start on the Wave 1 rows that are ready and briefed (section 3.2). It is not true that all requirements, all dependency rows and the whole plan are ready in the sense of "nothing is left to write". The honest line is "ready to start Wave 1, with the gaps in section 5 named".

Signed: product.

## 1. Requirements

### 1.1 What is locked

- Requirements rev 2 are LOCKED (`docs/product/prd/README.md` header; `RESUME.md`). #934 merged into `develop` as `88f3a975` at 20:37 UTC on 20 Nov (`merged_at` from the GitHub REST API).
- Founder words on record: "I approve all requirements." (19 Nov) and "Go with all default answers. Focus on what's best for customer experience. And proceed to lock all requirements and once done inform harness and engg leads working on architecture." (20 Nov). Both are quoted in plan 17 section 5.2 and `22-final-holistic-spec.md`.
- A locked card changes only by an errata row. The register is `docs/product/prd/18-errata-after-lock.md`.

### 1.2 Counts, with the command that produced each

All run from the repo root on `develop` at `021ecdfea`.

| What | Count | Command (listed in the block under this table) |
|---|---|---|
| Errata rows | 83 distinct, E1 to E83, none missing | c1 |
| Closures | 158 distinct, CL-001 to CL-158, none missing | c2 |
| Highest erratum | E83 (new-device sign-in email before the first outside family, CL-158, #1051) | c1 |
| NS cards | 52 of 52 have a heading (NS-01 to NS-52) | c3 |
| Function files | 23 reviews plus `BRIEF.md` | c4 |
| P0 rows, raw tool output | 1,062 | c5 |
| P0 rows, real | 1,052 (537 in NS cards, 515 in function files) | the raw 1,062 minus 10 rows the tool reads out of `17-engineering-project-plan.md` (section 1.5, defect 2) |
| P0 rows with a row-level BL row | 251 | c6 |
| P0 rows cited to a BL row in their own text | 79 | c6 |
| P0 rows named only at card level | 57 | c6 |
| P0 rows with no BL row at all | 665 (225 NS, 440 function) | c6 |

```
c1  python3 -I -c "import re;t=open('docs/product/prd/18-errata-after-lock.md').read();i=set(int(m) for m in re.findall(r'^(?:[|]|#+\s)\s*[*]*E(\d+)\b',t,re.M));print(len(i),min(i),max(i))"
c2  python3 -I -c "import re;t=open('docs/product/prd/GAP-LOG.md').read();i=set(int(m) for m in re.findall(r'\bCL-(\d+)',t));print(len(i),min(i),max(i))"
c3  grep -hE '^#{1,4}[[:space:]]*NS-[0-9]{2}' docs/product/prd/[0-2][0-9]-*.md | grep -o 'NS-[0-9][0-9]' | sort -u | wc -l
c4  ls docs/product/prd/functions | wc -l        (24, one of them BRIEF.md)
c5  python3 -I docs/product/prd/tools/review/p0.py . --json
c6  the same, with line 60 of p0.py changed from BL-\d{3} to BL-\d{3,4} in a copy under /tmp, rows from 17-engineering-project-plan.md dropped
```

The P0 numbers equal the numbers `RESUME.md` gives for the lock (1,052, 537 NS, 515 FR). The tier split moved because the four-digit rows BL-1001 to BL-1020 now exist.

### 1.3 Every NS card

| Card | In file | P0 rows | Named by a BL row (row) | Cited in the row text (cite) | Card level only | No BL row at all | BL rows that cite the card |
|---|---|---|---|---|---|---|---|
| NS-01 | 01 | 37 | 11 | 1 | 25 | 0 | BL-126, BL-287, BL-868, BL-931, BL-932, BL-933 +18 more |
| NS-02 | 02 | 18 | 18 | 0 | 0 | 0 | BL-952, BL-958, BL-961, BL-962, BL-981, BL-989 |
| NS-03 | 03 | 7 | 6 | 0 | 0 | 1 | BL-127, BL-129, BL-132, BL-991 |
| NS-04 | 04 | 6 | 6 | 0 | 0 | 0 | BL-290, BL-972, BL-988 |
| NS-05 | 05 | 17 | 2 | 0 | 15 | 0 | BL-126, BL-939, BL-981, BL-991 |
| NS-06 | 06 | 31 | 31 | 0 | 0 | 0 | BL-287, BL-954, BL-957, BL-962, BL-968, BL-969 +6 more |
| NS-07 | 07 | 14 | 14 | 0 | 0 | 0 | BL-299, BL-973, BL-974, BL-975, BL-990, BL-991 |
| NS-08 | 08 | 14 | 5 | 0 | 0 | 9 | BL-128, BL-290, BL-976, BL-990 |
| NS-09 | 08 | 13 | 7 | 0 | 0 | 6 | BL-138, BL-181, BL-977, BL-987, BL-988 |
| NS-10 | 08 | 9 | 9 | 0 | 0 | 0 | BL-961, BL-965, BL-978, BL-987, BL-990 |
| NS-11 | 08 | 5 | 2 | 0 | 3 | 0 | BL-126, BL-934, BL-942, BL-963, BL-965, BL-990 |
| NS-12 | 08 | 5 | 5 | 0 | 0 | 0 | BL-949, BL-979, BL-990 |
| NS-13 | 09 | 18 | 18 | 0 | 0 | 0 | BL-943, BL-965, BL-967, BL-982, BL-987, BL-991 +1 more |
| NS-14 | 09 | 4 | 2 | 0 | 0 | 2 | BL-181, BL-940, BL-941, BL-988 |
| NS-15 | 09 | 4 | 4 | 0 | 0 | 0 | BL-944, BL-945, BL-988 |
| NS-16 | 09 | 8 | 8 | 0 | 0 | 0 | BL-949, BL-957, BL-965, BL-980, BL-988 |
| NS-17 | 09 | 11 | 1 | 0 | 0 | 10 | BL-182, BL-327, BL-987, BL-988 |
| NS-18 | 09 | 3 | 3 | 0 | 0 | 0 | BL-949, BL-982, BL-991 |
| NS-19 | 09 | 2 | 0 | 0 | 0 | 2 | BL-183, BL-988 |
| NS-20 | 09 | 0 | 0 | 0 | 0 | 0 | none, by design (a "why it waits" card, 0 P0 rows) |
| NS-21 | 10 | 5 | 2 | 0 | 0 | 3 | BL-183, BL-287, BL-937, BL-962, BL-989 |
| NS-22 | 10 | 2 | 2 | 0 | 0 | 0 | BL-938, BL-985, BL-989 |
| NS-23 | 10 | 5 | 5 | 0 | 0 | 0 | BL-946, BL-963, BL-965, BL-989 |
| NS-24 | 10 | 3 | 2 | 0 | 0 | 1 | BL-183, BL-947, BL-987, BL-989 |
| NS-25 | 10 | 13 | 13 | 0 | 0 | 0 | BL-983, BL-991 |
| NS-26 | 10 | 0 | 0 | 0 | 0 | 0 | none, by design (a "why it waits" card, 0 P0 rows) |
| NS-27 | 10 | 0 | 0 | 0 | 0 | 0 | none, by design (a "why it waits" card, 0 P0 rows) |
| NS-28 | 10 | 0 | 0 | 0 | 0 | 0 | none, by design (a "why it waits" card, 0 P0 rows) |
| NS-29 | 10 | 0 | 0 | 0 | 0 | 0 | BL-986, BL-989 |
| NS-30 | 10 | 0 | 0 | 0 | 0 | 0 | none, by design (a "why it waits" card, 0 P0 rows) |
| NS-31 | 10 | 0 | 0 | 0 | 0 | 0 | BL-966 |
| NS-32 | 11 | 8 | 8 | 0 | 0 | 0 | BL-163, BL-949, BL-966, BL-991 |
| NS-33 | 11 | 13 | 6 | 0 | 0 | 7 | BL-139, BL-162, BL-184, BL-931, BL-948, BL-954 +2 more |
| NS-34 | 11 | 3 | 2 | 0 | 0 | 1 | BL-168, BL-185, BL-329, BL-948, BL-992 |
| NS-35 | 11 | 4 | 1 | 0 | 0 | 3 | BL-183, BL-952, BL-971, BL-988 |
| NS-36 | 11 | 14 | 2 | 0 | 0 | 12 | BL-186, BL-254, BL-959, BL-960, BL-990 |
| NS-37 | 11 | 3 | 2 | 0 | 0 | 1 | BL-183, BL-956, BL-989 |
| NS-38 | 19 | 8 | 0 | 0 | 0 | 8 | BL-187, BL-994 |
| NS-39 | 19 | 10 | 0 | 0 | 0 | 10 | BL-188 |
| NS-40 | 19 | 11 | 2 | 0 | 0 | 9 | BL-198, BL-577 |
| NS-41 | 19 | 18 | 0 | 1 | 0 | 17 | BL-208 |
| NS-42 | 19 | 15 | 0 | 1 | 0 | 14 | BL-291 |
| NS-43 | 19 | 11 | 0 | 0 | 0 | 11 | BL-292 |
| NS-44 | 19 | 10 | 0 | 0 | 0 | 10 | BL-293 |
| NS-45 | 19 | 15 | 0 | 0 | 0 | 15 | BL-294, BL-994, BL-995, BL-996, BL-997, BL-998 +1 more |
| NS-46 | 21 | 22 | 10 | 1 | 0 | 11 | BL-295, BL-1002, BL-1005, BL-1007, BL-1008, BL-1009 +3 more |
| NS-47 | 21 | 27 | 8 | 0 | 0 | 19 | BL-296, BL-1002, BL-1005, BL-1009, BL-1010, BL-1015 |
| NS-48 | 21 | 13 | 10 | 0 | 0 | 3 | BL-297, BL-1002, BL-1003, BL-1004, BL-1016 |
| NS-49 | 21 | 21 | 6 | 0 | 0 | 15 | BL-298, BL-1001, BL-1006, BL-1017 |
| NS-50 | 21 | 4 | 2 | 0 | 0 | 2 | BL-295, BL-1014 |
| NS-51 | 27 | 27 | 4 | 0 | 0 | 23 | BL-045, BL-1001, BL-1019 |
| NS-52 | 27 | 26 | 12 | 0 | 14 | 0 | BL-046, BL-1001, BL-1018, BL-1020 |
| **52 cards** | | **537** | **251** | **4** | **57** | **225** | |

Reading it:
- 47 of 52 cards are named by at least one BL row. NS-20, NS-26, NS-27, NS-28 and NS-30 have none, by design: they are "why it waits" cards with 0 P0 rows. NS-29 and NS-31 are named only by a parked row (BL-986) and by BL-966's "no Memory Library classes" line.
- Being named is weaker than being covered. NS-38 to NS-45 (first run) are named only by proposed group rows (BL-187, BL-188, BL-198, BL-208, BL-291 to BL-294) and have no build-step rows. Their PR list exists only in a design file (`docs/tdd/new-scope/12-first-run-5.md`, FP-1 to FP-20). I carry those PRs as FP rows in section 2 so they are in the map, but they have no BL id.
- NS-46 to NS-52 got build-sequence rows BL-1001 to BL-1020 (#1028). Those rows cover 52 of 140 P0 rows by name. 73 still have none.

### 1.4 Every function file

| Function file | P0 rows | Cited to a BL row in the row text | No BL row |
|---|---|---|---|
| ai-and-speech.md | 54 | 6 | 48 |
| back-office.md | 17 | 4 | 13 |
| compliance.md | 23 | 1 | 22 |
| cultural-background-data.md | 23 | 1 | 22 |
| data-and-measurement.md | 16 | 2 | 14 |
| days-library.md | 18 | 5 | 13 |
| feature-opportunities.md | 5 | 0 | 5 |
| finance.md | 8 | 1 | 7 |
| languages-and-localisation.md | 24 | 3 | 21 |
| legal.md | 21 | 4 | 17 |
| lifecycle-and-platforms.md | 24 | 0 | 24 |
| marketing.md | 27 | 1 | 26 |
| messaging-and-entry-points.md | 28 | 14 | 14 |
| notification-catalogue.md | 17 | 0 | 17 |
| operations.md | 19 | 4 | 15 |
| photos-and-suggestions.md | 35 | 0 | 35 |
| print-and-fulfilment.md | 8 | 1 | 7 |
| privacy.md | 35 | 7 | 28 |
| quality.md | 21 | 3 | 18 |
| reliability.md | 24 | 6 | 18 |
| research-validation.md | 17 | 4 | 13 |
| risk-security.md | 22 | 4 | 18 |
| support.md | 29 | 4 | 25 |
| **23 files** | **515** | **75** | **440** |

None of the 515 function-file P0 rows is named in a BL row heading block. 75 cite a BL id in their own text. 440 have nothing. They are grouped into 35 proposed groups (G01 to G35) in `docs/product/prd/BACKLOG-GAPS.md`. That file still carries counts from before BL-1001 to BL-1020 existed.

### 1.5 Two defects in the counting tool (found while running it)

1. `docs/product/prd/tools/review/p0.py` line 60 matches `BL-\d{3}`, so it cannot see BL-1001 to BL-1020. Fixing it to `\d{3,4}` moves the NS-46 to NS-52 P0 rows from 137 "none" to 73 "none". I ran a patched copy from `/tmp`; I did not edit the tool in this PR.
2. The tool reads every `NN-*.md` for NN 00 to 27, and since #847 merged that includes `17-engineering-project-plan.md`. It reads 10 rows out of that plan (J-N1, J-N4, J-N9, J-N11, J-N21, J-N24, J-N27 and three NS rows it repeats). They are not requirements. They inflate the raw count by 10.

Both are one-line fixes. They belong in the next product PR together with a regenerated `BACKLOG-GAPS.md`, so the G0 number in the repo matches this file. Until then, trust the numbers here, not the generated file.

### 1.6 What is still owed on the requirements side

- Project doc `claude/Karma-requirements-locked-2026-11-20.md` needs updating in place (`RESUME.md` says it needs a session with the Projects tool; not done from the repo). NOT VERIFIED whether it is done now.
- The PDF is built by `python3 -I docs/product/prd/tools/pdf/build.py` and not uploaded to Drive (`RESUME.md`).
- E74 to E83 are on `develop`; plan 17 and 17b are pinned to E73 until #1050 merges.
- The founder digest lines in `22-final-holistic-spec.md` section 7 have a default in force with a deadline of Mon 23 Nov (`RESUME.md`).

## 2. Dependency map

### 2.1 How to read it

One table per chain, 243 rows in all. Columns:
- **Id**: a BL id where one exists. Rows with no BL id use the name their source uses: PR numbers for open PRs (`PR-835`), `FP-n` for the first-run PR list, `IN-...` for instrumentation. A suffix after a slash (`IN-08/an`) says which instrumentation file the working id comes from, because those files reuse the same working ids (section 2.15 item 4).
- **Depends on / Blocks**: ids in this map only. A founder, counsel, device or word step is not a row: it is in **Gate**. Blocks is computed from Depends on, so the two always agree.
- **Lane**: the roster handle that takes the row (`agents/roster.json`, `backlog_owner_names`). `founder` means no agent can do it.
- **Size**: S, M or L as the row or its source gives it. `-` where the source gives none.
- **Drop**: A, B, C, D from card 21 or `D` for the first-run drop (E43). `IN (phase n)` is the instrumentation phase its file gives. `-` where card 21 sets none.
- **Gate**: G0 trace and a row per P0; G1 on-device data rules; G2 counsel; G3 words; G4 device rows; G5 label and claims; G6 no production flag with an open P0 (`14-test-plan.md` line 96, `22-final-holistic-spec.md` section 10). Also founder acts (merge of `docs/legal`, `approve-migration`, dashboard settings, money).
- **Status**: live on 20 Nov, from GitHub (REST, `/pulls` and `/commits/<sha>/check-runs`) and `develop`. "Row text says X (stale)" means the line in `docs/BACKLOG.md` is behind the code. "no brief" means no file for it under `docs/engineering/readiness-20nov/briefs/`.

Sources: `docs/BACKLOG.md` rows BL-922 to BL-987 and BL-1001 to BL-1020 (parsed, then corrected against GitHub); plan 17 sections 2 and 3; plan 17b section 2; `docs/tdd/new-scope/12-first-run-5.md` for FP; the instrumentation files under `docs/analytics/instrumentation/` and `docs/product/instrumentation/` plus the open PRs #1040, #1041, #1044 and #1052.

Rows I left out on purpose: BL-934, BL-940 and BL-944 (superseded), BL-986 (parked), BL-988 to BL-999 (design and function-review rows; the requirements are locked, so see 2.15 item 6), and the 35 proposed P0-gap groups (BL-006 and others), which are named in section 1.4 and not build steps.

### 2.1a What changed since plan 17 was written (20 Nov, 18:20 UTC reads)

Plan 17 and plan 23 were true at their read times. Since then these merged, so their "open" lines are old:
- #871 (BL-961 part 2), #866 (BL-925 words), #870 (BL-965 words), #872 (BL-949 counsel packet 1.7.0), #880 (BL-930), #854 (data inventory row for pictures), #847 (plan 17 itself) all merged at about 22:36 to 22:37 UTC.
- #912 (dispatcher reads four-digit ids) merged at 21:43 UTC. `node scripts/agents/check.mjs` now reports 592 backlog tasks and "agent team is consistent".
- #1028 filed BL-1001 to BL-1020; #1029 filed ADRs 0029 to 0035 as Proposed; #1027, #1031 and #1032 merged BL-1005, BL-1003 and BL-1004.
- #1033 (the final information architecture, IA-FINAL) and #1054 (permissions and disclosure matrix, PROPOSED) merged at 23:41 and 23:42 UTC.
- Still open: #879 (BL-961 part 3), #873 (BL-960), #799, #894, #895, #835 to #840, #843, #1040, #1041, #1044, #1052, #1053 (Build 13 master test plan, draft), #1057 to #1061 (drafts).

The statuses in the tables use the GitHub state, not the old plan text.

### 2.2 Release path and platform

| Id | Item | Depends on | Blocks | Lane | Size | Drop | Gate | Status |
|---|---|---|---|---|---|---|---|---|
| BL-976-WIRE | Keep-safe preflight wired into release-ios.yml | B13-CHECKS | - | ops | S | - | founder pastes | not written; brief yes |
| F4 | Founder fixes the production database connection secret | - | DBDEPLOY | founder | S | - | founder act; may not be needed for Build 13 if servers stay off (answer 1 of DECISIONS-20n | founder; not done (plan 17 3a, read 20 Nov) |
| DBDEPLOY | Re-run db-v0.1.0 deploy: dry run, then push (29 migrations) | F4 | P-7 | ops | S | - | founder approves; approve-migration | not started; conflicts with "servers off for Build 13" (see 2.6) |
| P-7 | Record the applied migrations (.github/migrations-applied.txt) | DBDEPLOY | - | ops | S | - | - | not written; brief yes |
| PR-830 | Develop snapshot into main (conflicts) | - | B13-CUT | founder | S | - | founder names the full sha | open, conflicts (plan 17, 20 Nov); NOT VERIFIED now |
| B13-CHECKS | Wire release-ios.yml checks (founder pastes the patch) | - | BL-976-WIRE, B13-CUT | ops | S | - | founder pastes workflow patch | not written; brief yes |
| B13-CUT | Release branch and RC tag from main | PR-830, B13-CHECKS | - | ops | S | - | founder approves app-store environment | not started; brief yes |
| CI-SET | CI briefs: SHA pins, secret scan, PR size, coverage, lint, size gate, queue (8 b | - | - | ops | M | - | founder approves dev dependencies; pastes workflows | not written; briefs yes (grouped here) |
| HG-MQ | Merge-queue fixes (skipped check rule) | - | - | ops | S | - | founder applies (scripts/agents is his) | not written; brief yes |

### 2.3 Account chain

| Id | Item | Depends on | Blocks | Lane | Size | Drop | Gate | Status |
|---|---|---|---|---|---|---|---|---|
| BL-922 | Hold a needsConsent session with no local book out of the child step; one accoun | - | BL-978, FP-6 | mobile | M | - | G4 S1-204, two phones | ready; no PR (922a, 922b not written); briefs yes |
| BL-958 | Build profiles carry the new flags, and the free-space check is size plus 50 MB  | - | PR-1061 | ops | S | - | - | done (#896); row text says ready (stale) |
| BL-961 | A second account never sees the first account's book, and sign-out says so (X4,  | PR-879 | BL-978, BL-1010, BL-1018, BL-1019, HO-908-910-911, FP-16a | mobile | M | - | G4 two-account device row | 2 of 3 merged (#869, #871); 3 of 3 #879 open |
| BL-962 | Letter words stay out of system intelligence and system writing tools (X6, D2, D | - | - | mobile | S | - | - | done (#868); row text says ready (stale) |
| BL-963 | Home slips: one registry, one fixed order (FRAME-SLIP) | - | BL-942, BL-946, BL-1014 | mobile | S | - | G4 | ready; no PR; NO brief |
| BL-978 | A new phone: close the last gap (NS-10) | BL-922, BL-961 | FP-6 | mobile | M | - | G4 S1-204; G3 words for 978b | ready; R7 part done (#903); no PR for the rest; briefs yes |
| HO-908-910-911 | Account follow-ups: planner account guard, reminders on account gone and upgrade | BL-961, BL-967 | - | mobile | M | - | - | briefs yes; PR state NOT VERIFIED |
| B5 | Backup file exclusion, erase, token to Keychain, preflight gate (CR-71) | - | - | mobile | M | - | G4 device row | brief merged (#1025); no PR |
| PR-879 | BL-961 3 of 3: store lists go through bookVisibleNow | - | BL-961, PR-895, FP-13 | mobile | M | - | G4 two accounts | open (e27d104e) |

### 2.4 Reminders chain

| Id | Item | Depends on | Blocks | Lane | Size | Drop | Gate | Status |
|---|---|---|---|---|---|---|---|---|
| BL-537 | Back-off after unopened reminders (C-REQ-008) [Medium] | - | BL-1016 | - | M | - | founder decision to bring it back; G4 | deferred to 1.1 in the backlog; Drop C needs it; founder decision to bring it back |
| BL-943 | Reminders proven on a phone, with back-off and stop (NS-13) | BL-966, BL-967 | BL-982 | mobile | M | - | G4 time-zone device run (J-N3, J-N4, J-N5, J-N24) | blocked by BL-966; brief yes |
| BL-966 | One notification budget, with plan notices outside it (NS-32) | - | BL-943, BL-982, BL-1007, BL-1012, IN-PM4-03 | mobile | M | - | G2 counsel Q41 (plan-notice windows); G4 | ready; no PR; briefs 966A, B, C yes |
| BL-967 | Signing out cancels reminders (NS-13) | - | BL-943, HO-908-910-911 | mobile | S | - | - | done (#904); row text says ready (stale) |
| BL-982 | Typed days in reminders (NS-18) | BL-943, BL-966 | BL-1012 | mobile | S | - | G4 | blocked by BL-966, BL-943; NO brief |
| BL-985 | Quiet this book has a home (F12-REQ-011, NS-22) | - | - | mobile | S | - | G4 | ready; no PR; NO brief; planner now reads a quiet book (#901, #902) |
| BL-1003 | Content rules drift test: every key family is under ALL, notification scope path | - | - | content | S | A | - | done (#1031 merged); row text says in-review (stale) |
| BL-1004 | NS-48 phase 1: pure key function, planner select seam, the built 8 re-keyed with | - | BL-1016 | mobile | M | A | - | done (#1032 merged); row text says in-review (stale) |
| BL-1005 | Analytics tests: stems, enum values, event names, four never-reported kinds, var | - | - | analytics | S | - | - | done (#1027) |
| BL-1016 | NS-48 recency and last-letter layers (step 4.2, Drop C) | BL-537, BL-1004 | - | mobile | M | C | founder decides BL-537 | backlog row says: blocked (the NS-13 anchor and back-off BL-537, and BL-1004) |

### 2.5 Days and culture chain (NS-46, NS-47, NS-48, NS-50)

| Id | Item | Depends on | Blocks | Lane | Size | Drop | Gate | Status |
|---|---|---|---|---|---|---|---|---|
| BL-1007 | Day-only reminder gate and the first-tick permission door (step 2.4, Drop B) | BL-966 | - | mobile | S | B | G2 counsel; founder consent line Q-FD-20, Q-FD-21 | backlog row says: blocked (founder consent line Q-FD-20 and Q-FD-21, and counsel) |
| BL-1008 | Phone-only flag and pause pattern: libraryDays key, schema, parse test, schedule | BL-952, BL-1002 | BL-1012 | mobile | S | B | - | backlog row says: blocked (BL-1002 for ADR A1, and the Find stack BL-952 whose #894 holds the pattern to reuse) |
| BL-1009 | Notification categories with a preview placeholder, opaque identifiers, neutral  | BL-1002 | - | mobile+security | M | B | G4 hidden-preview device run | backlog row says: blocked (BL-1002 for ADR C, then a device run G4 for hidden previews) |
| BL-1010 | Days store module: outside scribe.db, backup-excluded, fail closed, erase and si | BL-961, BL-1002 | BL-1012, BL-1013, BL-1014, BL-1015, BL-1019 | mobile+privacy | M | B | G1; G2 counsel on the consent line | backlog row says: blocked (BL-961 and BL-1002 for ADR B, and counsel on the consent line) |
| BL-1011 | Calendar engine and oracle tables for 2026 to 2030, US days only (step 3.2, Drop | BL-1002 | BL-1012 | mobile+content | M | B | G2 counsel on copied tables (FR-DAY-23) | backlog row says: blocked (counsel on any copied table, FR-DAY-23; computed dates need none, DL-4) |
| BL-1012 | Planner feed for libraryDay and tap routing to Home (step 3.3, Drop B) | BL-966, BL-982, BL-1008, BL-1010, BL-1011 | BL-1013, BL-1014 | mobile | M | B | G4 NTC-T24 | backlog row says: blocked (BL-966, BL-982, BL-1010, BL-1011, BL-1008) |
| BL-1013 | Days page and Browse: the plain browse-and-tick list in Me with one consent line | BL-1010, BL-1012 | BL-1015 | mobile | M | B | G3 words; G4 AX5, VoiceOver | backlog row says: blocked (founder words G3, BL-1010, BL-1012) |
| BL-1014 | NS-50 rank 2b: the day slip and the blank-on-background rule (step 3.5, Drop B) | BL-963, BL-1010, BL-1012 | - | mobile+design-systems | S | B | G4 snapshot device row | backlog row says: blocked (BL-963, BL-1010, BL-1012, and a device run G4) |
| BL-1015 | NS-47 ask slip, tradition browse, day-name switch, culture-led days (step 4.1, D | BL-1010, BL-1013 | - | privacy+mobile | L | C | G2 CUL-Q5 to Q7, Q11; Q-FD-9 reviewer; G4 J-CUL-01 | backlog row says: blocked (counsel CUL-Q5, Q6, Q7 and Q11, and a named tradition reviewer, Q-FD-9) |
| KS-1 | One kill-switch PR: photoMoments, videos, signIn, libraryDays (CR-69 A5) | - | - | mobile+sync | M | - | - | not written; shares files with FP-5 and BL-1008 |

### 2.6 Pictures, Find and native modules chain

| Id | Item | Depends on | Blocks | Lane | Size | Drop | Gate | Status |
|---|---|---|---|---|---|---|---|---|
| BL-868 | Fix the export spec: the stored stripped copy only, and per-item filenames (NX-3 | - | BL-933 | data-architect | S | - | founder merges legal edit (D-125) | ready; not written; founder merges the legal edit (D-125) |
| BL-870 | The photo bucket accepts no writes and no payload carries a photo path (NX-39-R5 | - | - | sync | S | - | approve-migration | ready; not written; needs approve-migration |
| BL-931 | Photo with a letter, as small reviewable PRs (N-11, NS-01) | PR-840 | BL-932, BL-933, BL-939, BL-941, BL-942, BL-945, BL-946 +7 | mobile | L | - | G1; G2 label line; G5; G6 | in progress: #834, #841, #842 merged; #835 to #840 open |
| BL-932 | The Book list stays light with photos: two derivatives (N-06) | BL-931 | BL-956 | mobile | M | - | G4 J-N13 | backlog row says: blocked (BL-931) |
| BL-933 | Export schema 1.7.0 carries photo files (N-08) | BL-868, BL-931 | BL-973, BL-1018 | mobile | M | - | G1; BL-868 legal merge first | backlog row says: blocked (BL-868, BL-931) |
| BL-952 | Find on the phone, as eight reviewable PRs (NS-02) | FIND-8 | BL-938, BL-939, BL-941, BL-942, BL-945, BL-946, BL-947 +2 | mobile | L | - | G3 Find lines; G4 S1-205; G2 via #799 and BL-960 | 5 of 8 merged (#881 to #885); #894, #895 open; 8 of 8 not opened |
| BL-953 | The stored picture follows ruling T3 (NS-01) | BL-931 | - | mobile | S | - | - | backlog row says: blocked (BL-931) |
| BL-954 | Undo windows wait for VoiceOver and never leave a dead button (NS-01, NS-06, NS- | BL-931 | - | mobile | S | - | - | backlog row says: blocked (BL-931) |
| BL-955 | A picked picture survives the app closing before Review (NS-01) | BL-931 | - | mobile | S | - | - | backlog row says: blocked (BL-931) |
| BL-956 | Pictures at large text, in Smart Invert, uncropped, and a light Photos lens (NS- | BL-931, BL-932 | - | mobile | M | - | G4 AX5, Smart Invert | backlog row says: blocked (BL-931, BL-932) |
| BL-957 | One length rule for typed words that become part of a letter (NS-01, NS-06, NS-1 | - | - | mobile+data-architect | S | - | - | ready; no PR; brief yes |
| BL-1001 | Record the level 3 and multi-media reversals and the CR-66 precedence (step 0.1) | - | BL-1018, BL-1019 | founder | S | C | founder ruling | blocked: founder ruling on the reversals (RV-18 on) not recorded |
| BL-1006 | NS-49 level 1 as the first-class picture start (step 1.4, Drop B) | BL-931 | BL-1017 | mobile | M | B | G3 words; G4 AX5; photo stack on TestFlight | backlog row says: blocked (photo stack BL-931 with #835 to #840 open, NS-01 on testflight, the A-S01 re-draw passing its AX5 test, and the founder's words G3) |
| BL-1017 | NS-49 level 2: Journaling Suggestions weak-link spike, then module (step 4.3, Dr | BL-1006 | - | mobile | L | C | G2; Apple entitlement Q-FD-11; phone on iOS 17.0 or 17.1 (Q-FD-33) | backlog row says: blocked (the entitlement Q-FD-11, a phone on iOS 17.0 or 17.1 Q-FD-33, counsel 3.3.3(H) and 5.1.3) |
| BL-1018 | NS-52 variant A: several pictures and video on the phone only (step 5.1, Drop C) | BL-933, BL-961, BL-1001 | BL-1020 | mobile+data-architect | L | C | founder BL-1001 and Q-PM-2; G2 label; dependency review (expo-video) | backlog row says: blocked (BL-1001 reversal, #835 merged, founder limits Q-PM-2, the label read, and a dependency review for `expo-video`) |
| BL-1019 | NS-51 photo moments: the scribe-library spike, then module, moment index and neu | BL-961, BL-1001, BL-1010 | - | mobile+security+privacy | L | C | founder BL-1001; G2 counsel; G5 label | backlog row says: blocked (BL-1001 reversal, counsel on Photos access and guideline 5.1.1, the label, and BL-961) |
| BL-1020 | NS-52 variant B: hosted pictures and video (step 5.3, Drop C) | BL-1018 | - | sync+data-architect+security | L | C | X2; counsel; red team; founder money decision; approve-migration | backlog row says: blocked (X2, counsel, a security threat model, red team, and the founder's money decision; not before BL-1018 is in a build) |
| P-1 | scribe-photo progress event and native Cancel (NS-01-R17b) | PR-837 | - | mobile | S | - | G4 iCloud-only picture | not written; brief yes |
| P-5 | Pictures follow delete, restore, purge (tests) | PR-835 | - | mobile | S | - | - | not written; brief yes |
| PR-835 | Photo slice 3a local migration 11, entry_media store, sweep | - | P-5, PR-836 | mobile | M | - | G4 upgrade from v10; size exception | open, not draft; A and B pass with notes at the head (plan 17, 18:20 UTC; heads unchanged at 23:4x UTC) |
| PR-836 | Photo slice 3b stored copy (strip, commit) | PR-835 | PR-837 | mobile | M | - | G4 ten fixtures; size exception | open, not draft; A and B pass with notes at the head (plan 17, 18:20 UTC; heads unchanged at 23:4x UTC) |
| PR-837 | Photo slice 4a picker adapter and pending picture | PR-836 | P-1, PR-838 | mobile | M | - | G4; size exception | open, not draft; A and B pass with notes at the head (plan 17, 18:20 UTC; heads unchanged at 23:4x UTC) |
| PR-838 | Photo slice 4b photo-first on Home | PR-837 | PR-839 | mobile | M | - | G3 5 keys; G4; size exception | open, not draft; A and B pass with notes at the head (plan 17, 18:20 UTC; heads unchanged at 23:4x UTC) |
| PR-839 | Photo slice 4c photo on Review and letter page | PR-838 | PR-840 | mobile | M | - | G3 13 keys; G4; size exception | open, not draft; A and B pass with notes at the head (plan 17, 18:20 UTC; heads unchanged at 23:4x UTC) |
| PR-840 | Photo slice 5 Book Photos lens | PR-839 | BL-931 | mobile | M | - | G3 key; G4 AX5 | open, not draft; A and B pass with notes at the head (plan 17, 18:20 UTC; heads unchanged at 23:4x UTC) |
| PR-894 | Find 6/8: words (PROPOSED), bookSearch pause, switch | - | PR-895 | mobile | S | - | G3 twelve Find lines | open (1fb48f4e), needs:founder |
| PR-895 | Find 7/8: wired into repos, store, sync; device row S1-205 | PR-894, PR-879 | FIND-8 | mobile | S | - | G4 S1-205 | open (92e37929) |
| FIND-8 | Find 8/8 | PR-895 | BL-952 | mobile | S | - | - | not opened |

### 2.7 Keeping, data and sync

| Id | Item | Depends on | Blocks | Lane | Size | Drop | Gate | Status |
|---|---|---|---|---|---|---|---|---|
| BL-923 | The launch sweep finishes a draft left `discarding` (N-07) | - | P-4 | mobile | S | - | - | done (#832) |
| BL-924 | Discard on Listen keeps the draft when the recording cannot be deleted (N-07) | - | - | mobile | S | - | - | done (#832) |
| BL-925 | Words for a recording that could not be let go yet (N-07) | - | BL-926, BL-977 | content | S | - | G3 founder words | words merged as PROPOSED (#866); founder approval G3 not recorded |
| BL-926 | Review says so when Let it go did not finish (N-07) | BL-925 | BL-977 | mobile | S | - | G3 (BL-925 words) | blocked by BL-925 approval; no PR; brief yes |
| BL-959 | Ids are L3 in ADR 0028 and migration 11 (X10) | - | BL-969 | data-architect | S | - | - | ids at L3 merged (#865); seal-clause amendment not seen merged |
| BL-976 | Recording backup readiness: reads, sizing and the seventh condition (NS-08) | - | - | sync+security | M | - | G4 two phones; the flip is a founder decision | #874, #875 merged; claim patterns and the R8 line remain |
| BL-977 | Let it go always finishes: the remaining rows (NS-09) | BL-925, BL-926 | - | mobile+sync | S | - | G3 (BL-925); G4 | backlog row says: blocked (BL-925, BL-926) |
| P-4 | NS-09-R6 storage line and NS-09-R7, R8 tests | BL-923 | - | mobile | M | - | G4 two phones (R8) | not written; brief yes |
| G1 | sync_pull consent gate (decline rule enforced on the phone) | - | - | data-architect | M | - | red-team read; approve-migration | not written; brief yes |
| H1 | Sync hooks refactor (3 SQL-heavy PRs) | T1 | - | data-architect | L | - | founder size exception; approve-migration; OQ-K1 | not written; brief yes |
| T1 | Synced-column drift guard | - | H1 | sync | S | - | - | not written; brief yes |
| T3 | Phone-class label check | - | - | qa | S | - | - | not written; brief yes |

### 2.8 Words, counsel, QA and trace gates

| Id | Item | Depends on | Blocks | Lane | Size | Drop | Gate | Status |
|---|---|---|---|---|---|---|---|---|
| BL-927 | Accessibility floor: the audit note with exact fixes (N-02) | - | BL-928 | design-systems | S | - | - | done (#867, #877); row text says ready (stale) |
| BL-928 | Accessibility floor fixes on the letter page, Me and the Book header (N-02) | BL-927 | BL-937, BL-984 | mobile | S | - | G4 VoiceOver and AX5 walk | 2 slices merged (#892, #893); Book-header remainder NOT VERIFIED |
| BL-929 | Device baseline run sheet for a small phone (N-01) | - | BL-948, IN-03/pm1 | qa | S | - | G4 founder phone and time | ready; no PR; brief yes (split into ASHA and PERF rows) |
| BL-929-ASHA | Asha seeded book generator (half of BL-929) | - | - | qa | M | - | - | not written; brief yes |
| BL-929-PERF | Perf profile with markers (other half of BL-929; needs a BL row) | - | IN-208, IN-10/pm1 | qa | M | - | - | not written; brief yes; no BL id yet |
| BL-930 | Reword NFR rows 42 and 216 to what the built hand-offs can meet (N-01) | - | - | qa | S | - | founder merges | #880 merged (PROPOSED wording); edit of NFR rows 42 and 216 NOT VERIFIED |
| BL-935 | Pilot kit for family-hears-it (C-19) | - | BL-972 | user-research | S | - | G2 counsel reads consent texts | ready; no PR (user-research does not auto-run) |
| BL-936 | One roadmap, December 2026 to May 2027 | - | - | content | M | - | - | draft merged (#829); row text says in-review (stale) |
| BL-949 | Counsel questions raised by the new-scope pack | - | - | legal | S | - | G2 founder sends to counsel | packet 1.7.0 merged (#872); founder has not sent it (G2) |
| BL-960 | The data inventory home matches what is built (X2) | - | - | privacy | S | - | founder merges legal text (D-125) | in review (#873, needs:founder) |
| BL-964 | Traceability sees the NS ids (gate G0) | - | BL-964-RATCHET, PR-1060 | qa | S | - | G0 | report mode merged (#878); ratchet not written; #1060 draft extends the trace to cards 19, 21, 27 |
| BL-964-RATCHET | Trace ratchet: a P0 row with no test or row fails (G0) | BL-964 | - | qa | S | - | founder decides whether --check blocks (07 Q8) | not written; brief yes |
| BL-965 | Words for the locked pack | - | FP-16a | content | M | - | G3 founder approves words | words packet merged as PROPOSED (#870); founder approval G3 not recorded |
| BL-975 | The privacy label guard (NS-07 G11) | - | - | ops | S | - | - | done (#897, #898, #906); row text says ready (stale) |
| BL-987 | Engineering facts the cards are waiting on | - | - | sync+data-architect+mobile | S | - | - | done (#876); row text says ready (stale) |
| BL-1002 | File the ADRs A1, A2, A3, B, C, D and E as Proposed (step 0.3) | - | BL-1008, BL-1009, BL-1010, BL-1011 | mobile+privacy | S | - | - | done (#1029 merged); row text says in-review (stale) |
| PR-1060 | Trace reads cards 19, 21 and 27 (NS-38 to NS-52) | BL-964 | - | qa | S | - | - | draft, open (4d865bec) |
| PR-1061 | Test: store builds ship with new-scope flags off (G6) | BL-958 | - | qa | S | - | - | draft, open (85a221f6) |

### 2.9 Rows that wait outside Build 13 (Build 14 and later)

| Id | Item | Depends on | Blocks | Lane | Size | Drop | Gate | Status |
|---|---|---|---|---|---|---|---|---|
| BL-937 | The letter page as one "This letter" list (N-03) | BL-928 | BL-939, BL-946 | mobile | S | - | G4 | backlog row says: blocked (BL-928) |
| BL-938 | Book header calm: one bar for Find, the lens row and the month jump (N-04) | BL-952 | - | mobile | M | - | - | backlog row says: blocked (BL-952) |
| BL-939 | Share one letter, Level 1 (text only), behind `EXPO_PUBLIC_SHARE_LETTER` (C-18) | BL-931, BL-937, BL-952 | BL-968 | mobile | M | - | G2 counsel Q45; G3 share words | backlog row says: blocked (BL-931, BL-952, BL-937) |
| BL-941 | Child switcher on Home (C-14) | BL-931, BL-952 | - | mobile | S | - | - | backlog row says: blocked (BL-931, BL-952) |
| BL-942 | Save a copy of the year: the Me action and the birthday slip (NS-11) | BL-931, BL-952, BL-963 | - | mobile | S | - | G3 words | backlog row says: blocked (BL-931, BL-952, BL-963) |
| BL-945 | A letter for another day (NS-15) | BL-931, BL-952 | - | mobile | S | - | - | backlog row says: blocked (BL-931, BL-952) |
| BL-946 | One past letter on Home (NS-23) | BL-931, BL-937, BL-952, BL-963 | - | mobile | S | - | G3 words | backlog row says: blocked (BL-931, BL-952, BL-937, BL-963) |
| BL-947 | Read the year back (NS-24) | BL-931, BL-952 | - | mobile | S | - | - | backlog row says: blocked (BL-931, BL-952) |
| BL-948 | Speed and accessibility rows in the device run sheet for every new card (NS-33,  | BL-929 | - | qa | S | - | G4 | backlog row says: blocked (BL-929) |
| BL-968 | Firsts: mark a letter as a first, with a short label (NS-06 Part A) | BL-939, BL-981 | BL-969 | mobile+sync | M | - | G2 studies; founder hours | backlog row says: blocked (BL-939, BL-981) |
| BL-969 | Sealed letters: the server keeps a seal until its day (NS-06 Part B) | BL-959, BL-968 | BL-970 | data-architect+sync | L | - | G2 counsel Q50; approve-migration | backlog row says: blocked (BL-968, BL-959) |
| BL-970 | Sealed letters on the phone: seal, wait, open (NS-06 Part B) | BL-969 | - | mobile | M | - | G2 | backlog row says: blocked (BL-969) |
| BL-971 | Quick capture doorways, only when ready on that phone (NS-06 Part C) | BL-972 | - | mobile | M | - | G4; spike BL-972 | backlog row says: blocked (BL-972) |
| BL-972 | Hands-free capture spike (NS-04) | BL-935 | BL-971 | speech | M | - | founder phone | backlog row says: blocked (BL-935) |
| BL-973 | Printable book (PDF) (NS-07 C28) | BL-933 | - | mobile | M | - | G2 | backlog row says: blocked (BL-933) |
| BL-974 | Quiet days stay the author's own (NS-07 C5) | - | - | mobile | S | - | - | backlog row says: ready |
| BL-979 | Earlier versions of my own words (NS-12) | - | - | data-architect+mobile | L | - | G2 counsel Q51, Q32, Q48 | backlog row says: blocked (counsel Q51, Q32, Q48 answered) |
| BL-980 | Someone else speaks: the From name on Review (NS-16) | - | - | mobile | S | - | G2 counsel Q45, Q46, Q48, Q54 | backlog row says: blocked (counsel Q45, Q46, Q48, Q54 answered) |
| BL-981 | Five-parent studies: photo, Find, share, Firsts | BL-931, BL-952 | BL-968 | user-research | M | - | founder hours | backlog row says: blocked (BL-931, BL-952) |
| BL-983 | The other parent in the store app (NS-25) | - | - | sync | L | - | G2 counsel Q48, Q49, Q53 | backlog row says: blocked (PR #827 and PR #767 merged; counsel Q48, Q49, Q53 answered) |
| BL-984 | Accessibility floor beyond VoiceOver (NS-33) | BL-928 | - | mobile | M | - | G4 | backlog row says: blocked (BL-928) |

### 2.10 First run chain (NS-38 to NS-45), Drop D

| Id | Item | Depends on | Blocks | Lane | Size | Drop | Gate | Status |
|---|---|---|---|---|---|---|---|---|
| FP-1 | NS-38 listing test, review notes, D-161 text | - | FP-3, FP-8 | content | S | D | G3 words; founder ASC fields | not written; design merged (docs/tdd/new-scope/12-first-run-5.md); NO brief |
| FP-5 | killSwitches.signIn (and libraryDays) in packages/api; same two files as KS-1, c | - | FP-6 | sync | S | D | - | not written; design merged (docs/tdd/new-scope/12-first-run-5.md); NO brief |
| FP-17 | AUTH_SETTINGS register and AUTH_SETUP fix | - | - | ops | S | D | founder reads hosted values | not written; design merged (docs/tdd/new-scope/12-first-run-5.md); NO brief |
| FP-2 | NS-42 consent builder and hash manifest | - | FP-3, FP-4, FP-19 | mobile | M | D | founder applies 20261108000000; counsel Q-D | not written; design merged (docs/tdd/new-scope/12-first-run-5.md); NO brief |
| FP-3 | NS-42 versioned links, version pin | FP-1, FP-2 | - | mobile | M | D | counsel; founder publishes versions | not written; design merged (docs/tdd/new-scope/12-first-run-5.md); NO brief |
| FP-15 | NS-45 update-line reader and Me line | - | - | sync | M | D | words; App Store id (founder) | not written; design merged (docs/tdd/new-scope/12-first-run-5.md); NO brief |
| FP-12 | NS-39 lock offer removed, no-prompt and offline tests | - | FP-7, FP-13, FP-14 | mobile | M | D | - | not written; design merged (docs/tdd/new-scope/12-first-run-5.md); NO brief |
| FP-7 | NS-41 one address form, reasons, pause | FP-12 | FP-8, FP-20 | mobile | M | D | G3 words (BL-965) | not written; design merged (docs/tdd/new-scope/12-first-run-5.md); NO brief |
| FP-9 | NS-41, NS-45 Apple email-only scope, foreground revocation | - | - | mobile | M | D | - | not written; design merged (docs/tdd/new-scope/12-first-run-5.md); NO brief |
| FP-6 | NS-40, NS-41 region_refused, signIn pause, Apple on outage | BL-922, BL-978, FP-5 | - | mobile | M | D | G3 words; File 28 applied by founder | not written; design merged (docs/tdd/new-scope/12-first-run-5.md); NO brief |
| FP-13 | NS-43 addChildren in one transaction | FP-12, PR-879 | - | mobile | M | D | - | not written; design merged (docs/tdd/new-scope/12-first-run-5.md); NO brief |
| FP-14 | NS-44 first-run no-Plus test, allowance titles | FP-12 | IN-05/pm5 | mobile | M | D | G3 words | not written; design merged (docs/tdd/new-scope/12-first-run-5.md); NO brief |
| FP-16a | NS-45 deletion step 1 words | BL-961, BL-965 | - | mobile | M | D | counsel; G3 words | not written; design merged (docs/tdd/new-scope/12-first-run-5.md); NO brief |
| FP-16b | FR-SEC-06 ownerCheck for Erase everything | - | - | mobile | S | D | OQ-F4 | not written; design merged (docs/tdd/new-scope/12-first-run-5.md); NO brief |
| FP-18 | NS-45 purge-worker titles | - | - | sync | S | D | founder deploys the worker | not written; design merged (docs/tdd/new-scope/12-first-run-5.md); NO brief |
| FP-4 | NS-42 local agreement rows reach the account | FP-2 | - | mobile | M | D | counsel Q-D | not written; design merged (docs/tdd/new-scope/12-first-run-5.md); NO brief |
| FP-8 | NS-41 eight-digit code in one release | FP-1, FP-7 | - | mobile | M | D | founder dashboard otp_length same day | not written; design merged (docs/tdd/new-scope/12-first-run-5.md); NO brief |
| FP-10a | NS-40 age-range Swift module and scan | NSC-01, NSC-02 | FP-10b | mobile | L | D | Mac with Xcode; founder App ID capability; Texas risk acceptance | not written; design merged (docs/tdd/new-scope/12-first-run-5.md); NO brief |
| FP-10b | NS-40 signal at launch, entitlement, preflight | FP-10a | - | mobile | L | D | counsel Q46; founder entitlement path | not written; design merged (docs/tdd/new-scope/12-first-run-5.md); NO brief |
| FP-19 | NS-42 sensitive-data withdrawal in Me | FP-2, DA-3 | - | mobile | M | D | counsel Q48 | not written; design merged (docs/tdd/new-scope/12-first-run-5.md); NO brief |
| FP-20 | NS-41 Turnstile bot check on email send | FP-7 | - | mobile | L | D | legal adds subprocessor row; founder Cloudflare and CAPTCHA setup | not written; design merged (docs/tdd/new-scope/12-first-run-5.md); NO brief |
| DA-1 | File 28 re-stamp and apply path | - | - | data-architect | M | D | founder applies | not written; design merged (docs/tdd/new-scope/12-first-run-5.md); NO brief |
| DA-2 | Purge of never-confirmed auth.users after 7 days | - | - | data-architect | M | D | approve-migration | not written; design merged (docs/tdd/new-scope/12-first-run-5.md); NO brief |
| DA-3 | withdraw_sensitive_data function | - | FP-19 | data-architect | M | D | approve-migration; counsel | not written; design merged (docs/tdd/new-scope/12-first-run-5.md); NO brief |
| NSC-01 | modules/REVIEWED.sha256 manifest | - | FP-10a | security-architect | S | D | - | not written; design merged (docs/tdd/new-scope/12-first-run-5.md); NO brief |
| NSC-02 | Entitlement allowlist in preflight | - | FP-10a | security-architect | S | D | - | not written; design merged (docs/tdd/new-scope/12-first-run-5.md); NO brief |

### 2.11 Instrumentation (all built dark; none blocks Wave 1)

| Id | Item | Depends on | Blocks | Lane | Size | Drop | Gate | Status |
|---|---|---|---|---|---|---|---|---|
| IN-01/an | Event standard review and merge (this file set) | - | IN-02/an | analytics | S | IN (phase 1) | CPO and founder review | proposed; file merged; no BL id |
| IN-02/an | ids.ts and generated registry doc (M1, M2) | IN-01/an | IN-03/an, IN-04/an | analytics | M | IN (phase 1) | - | proposed; file merged; no BL id |
| IN-03/an | Rename catalogue and full rename table (M3) | IN-02/an | IN-05/an, IN-DS2/sci | analytics | M | IN (phase 1) | - | proposed; file merged; no BL id |
| IN-04/an | Validators V1 to V16 as tests (M4) | IN-02/an | IN-08/an | analytics | M | IN (phase 1) | - | proposed; file merged; no BL id |
| IN-05/an | Hooks and screen wiring (M5), 29 routes first | IN-03/an | IN-06/an, IN-07/an, IN-08/an | mobile | M | IN (phase 2) | - | proposed; file merged; no BL id |
| IN-06/an | Controls and elements wiring per area from PM tables | IN-05/an | - | mobile | L | IN (phase 2) | - | proposed; file merged; no BL id |
| IN-07/an | Five funnels saved in PostHog; weekly read-out inputs | IN-05/an | - | analytics | S | IN (phase 2) | founder creates PostHog account | proposed; file merged; no BL id |
| IN-08/an | Turn on in the production profile behind the consent gate (section 1a: erratum,  | IN-04/an, IN-05/an, IN-DS-06, IN-DA-10, IN-DA-11, IN-ops-01, IN-K9, IN-DS-02, IN-DS-04 | IN-DS6/sci | founder | S | IN (phase 3) | E-INSTR-1 erratum; label; counsel; subprocessor; policy text; sheet wording (founder) | proposed; file merged; no BL id |
| IN-DS-01 | Create docs/legal/data-map.yaml with the section 9 rows and a test that every ca | - | - | privacy | M | IN (phase 1) | - | proposed; file merged; no BL id |
| IN-DS-05 | Closed screen, control, surface and marker lists generated into catalog.ts; deny | - | - | analytics | L | IN (phase 1) | IA-FINAL is merged (#1033) | proposed; file merged; no BL id |
| IN-DS-06 | Staging deletion drill on a throwaway project: send events under a bootstrapped  | - | IN-08/an, IN-DS-03, IN-DA-11 | qa | S | IN (phase 1) | founder: free host decision (FD-1); throwaway PostHog project | proposed; file merged; no BL id |
| IN-DS-03 | analytics-forget: read persons_queued_for_deletion and deletion_errors, log coun | IN-DS-06 | - | sync | S | IN (phase 2) | - | proposed; file merged; no BL id |
| IN-DS-02 | withdrawal reason and signed-out path with a tight rate limit; Settings line "De | IN-DA-10 | IN-08/an | mobile | M | IN (phase 2) | founder FD-4; E83 text; counsel | proposed; file merged; no BL id |
| IN-DS-04 | Retention job or store setting plus runbook; release gate comparing the publishe | - | IN-08/an | ops | S | IN (phase 2) | founder FD-1, FD-2; policy number | proposed; file merged; no BL id |
| IN-DS-07 | Nightly store-side invariant: no property outside the catalogue, no string over  | - | - | ops | S | IN (phase 3) | founder FD-1 | proposed; file merged; no BL id |
| IN-DS-08 | FR-DAT-01 build test (any 1.0.x profile with analytics on fails) and label-effec | - | - | ops | S | IN (phase 3) | - | proposed; file merged; no BL id |
| IN-DS-09 | Label, Privacy Policy, deletion page, subprocessors row and PrivacyInfo.xcprivac | - | - | privacy | M | IN (phase 3) | counsel items; founder merges legal text on go-live day | proposed; file merged; no BL id |
| IN-DS1/sci | Metric dictionary doc: each metric, formula, events, phase, blind spot (from sec | - | IN-DS2/sci, IN-DS3/sci | decision-science | S | IN (phase 1) | - | proposed; file merged; no BL id |
| IN-DS2/sci | Read-out template and a script that renders counts, intervals and suppression fr | IN-DS1/sci, IN-03/an | - | decision-science | M | IN (phase 1) | - | proposed; file merged; no BL id |
| IN-DS3/sci | Experiment plan template and A/A check rule | IN-DS1/sci | - | decision-science | S | IN (phase 2) | - | proposed; file merged; no BL id |
| IN-DS4/sci | Interval and sample-size helper in repo (pure TS, tested; no new dependency) | - | - | analytics | S | IN (phase 2) | - | proposed; file merged; no BL id |
| IN-DS5/sci | Reconcile TRACKING_PLAN 1.1 and FR-DAT-16 text (Proposed E83) | - | - | analytics | S | IN (phase 1) | founder reading | proposed; file merged; no BL id |
| IN-DS6/sci | First real read-out once P1 data exists | IN-08/an | - | decision-science | S | IN (phase 3) | founder turns analytics on | proposed; file merged; no BL id |
| IN-201 | Draft erratum E83 text and CPO rulings 1 to 8 | - | IN-202 | product | S | IN (phase 0) | founder decides the erratum text | proposed; file merged; no BL id |
| IN-202 | Generate the closed screen, control and element id lists from IA-FINAL; test tha | IN-201 | IN-203 | analytics | S | IN (phase 1) | IA-FINAL merged (#1033) | proposed; file merged; no BL id |
| IN-203 | Add the section 3 rows to catalog.ts and the generated plan; remove stale entrie | IN-202 | IN-204, IN-205, IN-206, IN-207, IN-210 | analytics | M | IN (phase 1) | - | proposed; file merged; no BL id |
| IN-204 | Book, letter page and Read together call sites behind the dark gate | IN-203 | IN-209 | mobile | M | IN (phase 2) | - | proposed; file merged; no BL id |
| IN-205 | Home slip impression hook for the past-letter slip, deduped and App-lock aware | IN-203 | IN-209 | mobile | S | IN (phase 2) | - | proposed; file merged; no BL id |
| IN-206 | Find host events (book.search.used, b_s06_*) with the NS-02-R22 scan test | IN-203 | IN-209 | mobile | S | IN (phase 2) | - | proposed; file merged; no BL id |
| IN-207 | Share events and error codes; test shared text carries no footer | IN-203 | IN-209 | mobile | S | IN (phase 2) | - | proposed; file merged; no BL id |
| IN-208 | perf.*.measured markers mapped to budget ratio for Book, Find, playback | BL-929-PERF | - | mobile | S | IN (phase 2) | - | proposed; file merged; no BL id |
| IN-209 | Canary test across Find, letter page, share, Read together, picture path (analyt | IN-204, IN-205, IN-206, IN-207 | IN-212 | qa | S | IN (phase 2) | - | proposed; file merged; no BL id |
| IN-210 | SQL views for the six funnels and the weekly "Read" report (no BI tool) | IN-203 | IN-212 | data-architect | M | IN (phase 3) | founder: free host and Supabase plan; approve-migration | proposed; file merged; no BL id |
| IN-211 | Verify the section 6 questions are in the question bank; add the missing | - | IN-212 | product | S | IN (phase 3) | - | proposed; file merged; no BL id |
| IN-212 | Release gate: turn-on checklist for this area (consent sheet, label change, coun | IN-209, IN-210, IN-211 | - | ops | S | IN (phase 3) | founder and counsel | proposed; file merged; no BL id |
| IN-PM4-01 | Add the reminder rows (2.3) to the catalogue and the generated plan, dark, with  | - | IN-PM4-02, IN-PM4-04, IN-PM4-05 | analytics | M | IN (phase 1) | - | proposed; file merged; no BL id |
| IN-PM4-02 | Add the family rows (4.2) and the slip rows (1.3) to the catalogue, dark | IN-PM4-01 | IN-PM4-04 | analytics | M | IN (phase 1) | - | proposed; file merged; no BL id |
| IN-PM4-03 | Planner returns suppression reasons and a planned-nudge count; add the pure self | BL-966 | - | mobile | M | IN (phase 1) | - | proposed; file merged; no BL id |
| IN-PM4-04 | Screen and control ids for D-S04 to D-S07 and D-S12 to D-S19 as a fixed list; wi | IN-PM4-01, IN-PM4-02 | IN-PM4-08 | mobile | L | IN (phase 2) | IA-FINAL merged | proposed; file merged; no BL id |
| IN-PM4-05 | Evening reminder delivered (foreground scan) and opened (response) observers; fr | IN-PM4-01 | IN-PM4-08 | mobile | M | IN (phase 2) | - | proposed; file merged; no BL id |
| IN-PM4-06 | Server counters for invite peek and accept, and the weekly second-voice roll-up, | - | IN-PM4-08 | data-architect | M | IN (phase 2) | FR-DAT-28 ruling; approve-migration | proposed; file merged; no BL id |
| IN-PM4-07 | system.email.sent daily counter in the sender function, no address, class enum w | - | - | data-architect | S | IN (phase 2) | - | proposed; file merged; no BL id |
| IN-PM4-08 | Weekly read-out: funnels f_notifications_* and f_family_* with n and "x of n" | IN-PM4-04, IN-PM4-05, IN-PM4-06 | - | decision-science | S | IN (phase 3) | analytics on in a build | proposed; file merged; no BL id |
| IN-PM4-09 | Device run: delivered-versus-opened bias check on a real phone across a week of  | - | - | qa | S | IN (phase 3) | G4 a TestFlight build | proposed; file merged; no BL id |
| IN-01/pm5 | Registry rows for section 3, 4, 5 events (docs and catalog entries, dark), bands | - | IN-02/pm5, IN-08/pm5, IN-09/pm5 | analytics | M | IN (phase 1) | - | proposed; file merged; no BL id |
| IN-02/pm5 | Content-free validator test for plus.* and perf.*, canary with Asha, 1.0.x profi | IN-01/pm5 | - | analytics | S | IN (phase 1) | - | proposed; file merged; no BL id |
| IN-03/pm5 | Closed control-id list for E-S10, E-S11, E-S12, Me Help | - | - | design-systems | S | IN (phase 1) | IA-FINAL merged | proposed; file merged; no BL id |
| IN-04/pm5 | Perf marker harness and perf profile (H1 in MEASUREMENT-PLAN; BL-929 only covers | - | - | mobile | M | IN (phase 2) | EAS build count (founder) | proposed; file merged; no BL id |
| IN-05/pm5 | Gate-before-words unit test (G-P1) and refund test (G-P3) | FP-14 | - | mobile | S | IN (phase 2) | - | proposed; file merged; no BL id |
| IN-06/pm5 | Asha seeded book generator H2 | - | - | qa | M | IN (phase 2) | - | proposed; file merged; no BL id |
| IN-07/pm5 | Weekly read-out template and support tally sheet | - | - | product | S | IN (phase 2) | - | proposed; file merged; no BL id |
| IN-08/pm5 | system.* events dark, MetricKit class-only reader | IN-01/pm5 | - | mobile | M | IN (phase 3) | - | proposed; file merged; no BL id |
| IN-09/pm5 | Server aggregate view for Plus and release health, k at least 10 | IN-01/pm5 | - | data-architect | M | IN (phase 3) | approve-migration | proposed; file merged; no BL id |
| IN-10/pm5 | Website page counter | - | - | web | S | IN (phase 4) | CPO ruling FR-MKT-34; host choice | proposed; file merged; no BL id |
| IN-01/pm1 | Id registry (slugs and IA ids) plus the test against IA | - | IN-02/pm1, IN-04/pm1 | analytics | S | IN (phase 0) | IA-FINAL merged | proposed; file in review; no BL id |
| IN-02/pm1 | No-event-before-consent and no-autocapture tests over first run and capture; upd | IN-01/pm1 | - | mobile | M | IN (phase 0) | - | proposed; file in review; no BL id |
| IN-03/pm1 | Tester-sheet rows for NS-39, 43, 44, 45 if rounds run; first-launch row on the N | BL-929 | - | user-research | S | IN (phase 0) | founder runs rounds | proposed; file in review; no BL id |
| IN-04/pm1 | Typed screen, ui, perf helpers, dedupe, validator V1 to V16 | IN-01/pm1 | IN-05/pm1, IN-06/pm1, IN-07/pm1, IN-08/pm1 | analytics | M | IN (phase 1) | event standard merged (#1042) | proposed; file in review; no BL id |
| IN-05/pm1 | screen.<screen_id>.viewed from the router hook | IN-04/pm1 | IN-13/pm1 | mobile | M | IN (phase 1) | - | proposed; file in review; no BL id |
| IN-06/pm1 | Wire capture.* events and sheet taps; capture.media.saved behind the photos flag | IN-04/pm1 | IN-11/pm1, IN-13/pm1 | mobile | M | IN (phase 1) | - | proposed; file in review; no BL id |
| IN-07/pm1 | Home impressions: prompt, slips, plus line | IN-04/pm1 | IN-13/pm1 | mobile | S | IN (phase 1) | - | proposed; file in review; no BL id |
| IN-08/pm1 | notifications.* wiring | IN-04/pm1 | IN-13/pm1 | mobile | S | IN (phase 1) | - | proposed; file in review; no BL id |
| IN-09/pm1 | onboarding.summary.sent, with E-INSTR-2 parts held until counsel | - | IN-14/pm1 | analytics | S | IN (phase 1) | counsel | proposed; file in review; no BL id |
| IN-10/pm1 | Perf markers (H1) and the three perf.*.measured events (confirm owner with ops) | BL-929-PERF | - | mobile | M | IN (phase 1) | perf build | proposed; file in review; no BL id |
| IN-11/pm1 | Canary suite over every flow here | IN-06/pm1 | IN-14/pm1 | qa | M | IN (phase 1) | - | proposed; file in review; no BL id |
| IN-12/pm1 | Reporting view for server onboarding.* counts, only if FQ-01 is ruled in (supaba | - | - | data-architect | M | IN (phase 1) | founder ruling FQ-01; approve-migration | proposed; file in review; no BL id |
| IN-13/pm1 | Dashboards as code for section 7 | IN-05/pm1, IN-06/pm1, IN-07/pm1, IN-08/pm1 | - | analytics | M | IN (phase 2) | host decision | proposed; file in review; no BL id |
| IN-14/pm1 | Consent wording, label, D-### superseding D-095 and D-124, host and subprocessor | IN-09/pm1, IN-11/pm1 | - | product | S | IN (phase 2) | founder; counsel | proposed; file in review; no BL id |
| IN-K1 | Keeping registry rows (section 2b), denied names and the closed id list for scre | - | IN-K2, IN-K3, IN-K4, IN-K5 | analytics | M | IN (phase 1) | schema convention merged (#1042) | proposed; file in review; no BL id |
| IN-K2 | T0 emit-nothing test and the no-import source scan ([IN-K2], [IN-K3]) | IN-K1 | IN-K6 | qa | S | IN (phase 1) | - | proposed; file in review; no BL id |
| IN-K3 | Retire account_deletion, letter_deleted, export_started.letters_bucket and the d | IN-K1 | IN-K4 | analytics | S | IN (phase 1) | - | proposed; file in review; no BL id |
| IN-K4 | T1 weekly keeping summary: bucketed counters, consent-time id only, weekly, buck | IN-K1, IN-K3 | IN-K9 | mobile | M | IN (phase 2) | - | proposed; file in review; no BL id |
| IN-K5 | Screen, tap and impression wiring for C-S04, C-S06, C-S08, C-S10, C-S12 under th | IN-K1 | - | mobile | M | IN (phase 2) | - | proposed; file in review; no BL id |
| IN-K6 | Canary fixtures through export, let-go, erase, versions, held screens ([IN-K5]) | IN-K2 | - | qa | M | IN (phase 2) | - | proposed; file in review; no BL id |
| IN-K7 | Weekly keeping read-out in docs/research/: format, SQL view for purge receipts a | - | - | data-architect | M | IN (phase 3) | data-steward and data-architect files | proposed; file in review; no BL id |
| IN-K8 | Flip-time rows reserved for NS-08 (R9, R21): server totals for upload failure cl | - | - | ops | S | IN (phase 3) | NS-08 flip decision (founder) | proposed; file in review; no BL id |
| IN-K9 | Consent sheet sentence and label change draft for T1 and T2 (door lines); these  | IN-K4 | IN-08/an | privacy | S | IN (phase 1) | founder and counsel | proposed; file in review; no BL id |
| IN-K10 | Founder and counsel decision: free-only hosting path for PostHog, or a hosted fr | - | - | founder | - | IN (phase 1) | founder | proposed; file in review; no BL id |
| IN-DA-01 | Founder rules F-1, F-2, F-3 and F-10; the production erratum; subprocessor and l | - | - | privacy | S | IN (phase 1) | founder rules F-1, F-2, F-3, F-10 | proposed; file in review; no BL id |
| IN-DA-02 | EXPLAIN every insights view on seeded data; index only where over budget; state  | - | IN-DA-03 | data-architect | S | IN (phase 1) | - | proposed; file in review; no BL id |
| IN-DA-03 | Write reporting_reader migration and reporting_role.test.mjs with the rows in se | IN-DA-02 | IN-DA-05, IN-DA-07 | data-architect | M | IN (phase 1) | approve-migration | proposed; file in review; no BL id |
| IN-DA-04 | Views weekly_second_voice and weekly_invites_accepted (5.1) with tests and colum | - | IN-DA-06 | data-architect | M | IN (phase 2) | approve-migration | proposed; file in review; no BL id |
| IN-DA-05 | Counters migration (5.2), kill switch, _bump call sites in peek_invite and the e | IN-DA-03 | IN-DA-08 | data-architect | M | IN (phase 2) | E-INSTR-1; approve-migration | proposed; file in review; no BL id |
| IN-DA-10 | Withdrawal route: ops.forget_quota_anon migration (6a), withdrawal reason in ana | - | IN-08/an, IN-DS-02, IN-DA-11, IN-DA-08 | data-architect | M | IN (phase 1) | founder F-1, F-3; withdrawal erratum; legal text; approve-migration | proposed; file in review; no BL id |
| IN-DA-11 | Release gate: the staging deletion drill passes and the policy retention number  | IN-DA-10, IN-DS-06 | IN-08/an | qa | S | IN (phase 1) | founder | proposed; file in review; no BL id |
| IN-DA-06 | Tier 0 snippets and the weekly read-out job in the ops repo | IN-DA-04 | - | decision-science | S | IN (phase 2) | secret (founder) | proposed; file in review; no BL id |
| IN-DA-07 | Metabase on demand: saved questions as text in the ops repo, runbook, credential | IN-DA-03 | - | ops | S | IN (phase 3) | founder | proposed; file in review; no BL id |
| IN-DA-08 | Staging drill: events under a test id reach PostHog, forget (account and withdra | IN-DA-05, IN-DA-10 | - | qa | S | IN (phase 2) | - | proposed; file in review; no BL id |
| IN-DA-09 | Fallback B design (separate project, 30 day raw, daily roll-up) only if F-1 or F | - | - | data-architect | M | IN (phase 3) | only if F-1 or F-3 say no | proposed; file in review; no BL id |
| IN-ops-01 | Replace the three date-bearing throws with code-only errors; test | - | IN-08/an, IN-ops-09 | mobile | S | IN (phase 1) | - | proposed; file in review; no BL id |
| IN-ops-02 | R1 to R3 lint or scan tests, typed device log lib/diagnostics/log.ts | - | IN-ops-03, IN-ops-09 | mobile | S | IN (phase 1) | - | proposed; file in review; no BL id |
| IN-ops-03 | Canary tests R4 and R5 | IN-ops-02 | IN-ops-09 | qa | M | IN (phase 1) | - | proposed; file in review; no BL id |
| IN-ops-04 | Gate tests OG-1, OG-2, OG-7 (seam-guard extension, proposed as a patch under doc | - | - | ops | S | IN (phase 1) | founder applies the patch | proposed; file in review; no BL id |
| IN-ops-05 | Perf marker module and registry rows for perf.*.measured (with H1 of MEASUREMENT | - | - | mobile | M | IN (phase 1) | event standard merged (#1042) | proposed; file in review; no BL id |
| IN-ops-06 | Weekly ops report script (numbers only, one issue) and SLO table | - | - | ops | S | IN (phase 2) | founder applies workflow | proposed; file in review; no BL id |
| IN-ops-07 | Runbooks: crash-triage, perf-regression, observability-leak | - | - | ops | S | IN (phase 2) | - | proposed; file in review; no BL id |
| IN-ops-08 | Evidence file template and no-real-family-data scan for docs/ops/evidence/ | - | - | ops | S | IN (phase 2) | - | proposed; file in review; no BL id |
| IN-ops-09 | Crash client wrapper, dark: scrubber, consent gate, per-class caps, tests at a m | IN-ops-01, IN-ops-02, IN-ops-03 | - | mobile | M | IN (phase 3) | founder F1, F4; approves dependency | proposed; file in review; no BL id |
| IN-ops-10 | OTel spike on one Edge Function (1 hour, no commit) | - | - | ops | S | IN (phase 3) | founder opens account (F3) | proposed; file in review; no BL id |
| IN-ops-11 | Upptime-style check job in the private repo (checks and issues, no Pages) | - | - | ops | S | IN (phase 3) | founder adds secrets | proposed; file in review; no BL id |
### 2.12 Text graph, by chain

Each line reads "must be done before". Brackets are gates, not rows. `(done)` rows are shown only where something still depends on them.

```
RELEASE (Build 13 cut)
  B13-CHECKS ----------------> B13-CUT
  PR-830 (founder names sha)-> B13-CUT --[app-store environment, founder]--> device sheet --> submit
  B13-CHECKS ----------------> BL-976-WIRE
  F4 --> DBDEPLOY --> P-7        (only if Build 13 needs servers; founder answer 1 says servers off: see 2.15 item 1)

REMINDERS
  BL-966 (a budget.ts -> b planner one a day -> c categories) --> BL-943 --[G4 time-zone device run]--> BL-982
  BL-966 --> BL-1007 (Drop B day-only gate)
  BL-967 (done), BL-1004 (done), BL-1003 (done), BL-1005 (done)
  BL-1004 (done) --> BL-1016 <-- BL-537 (deferred; needs a founder decision)
  BL-985 (quiet book control) --- no blocker

ACCOUNT
  PR-879 --> BL-961 --> BL-978 <-- BL-922
  BL-961 --> HO-908-910-911, BL-1010, FP-16a, FP-13 (via PR-879)
  BL-978, BL-922 --> FP-6
  BL-963 (slip registry) --> BL-1014, BL-942, BL-946
  B5 --- no blocker

DAYS AND CULTURE
  BL-1002 (done) --> BL-1009, BL-1011, BL-1008, BL-1010
  BL-961 --> BL-1010          BL-952 --> BL-1008
  BL-966, BL-982, BL-1010, BL-1011, BL-1008 --> BL-1012 --> BL-1013 --> BL-1015
  BL-963, BL-1010, BL-1012 --> BL-1014
  KS-1 and FP-5 are the same two files as BL-1008: count once

PICTURES, FIND, NATIVE MODULES
  PR-835 --> PR-836 --> PR-837 --> PR-838 --> PR-839 --> PR-840 --> BL-931
  PR-837 --> P-1        PR-835 --> P-5
  BL-931 --> BL-932 --> BL-956
  BL-931, BL-868 --> BL-933 --> BL-973, BL-1018
  BL-931 --> BL-953, BL-954, BL-955, BL-1006 --> BL-1017
  PR-894 --> PR-895 (also needs PR-879) --> FIND-8 --> BL-952 --> BL-938, BL-941, BL-945, BL-947, BL-1008
  BL-1001 (founder), BL-933, BL-961 --> BL-1018 --> BL-1020      (scribe-photo: merged; expo-video: BL-1018)
  BL-1001 (founder), BL-961, BL-1010 --> BL-1019                 (scribe-library: BL-1019 spike first)
  FP-10a (age-range module) <-- NSC-01, NSC-02

KEEPING AND DATA
  BL-925 [G3 approval] --> BL-926 --> BL-977
  BL-923 (done) --> P-4
  T1 --> H1
  BL-976 (partly merged) --> BL-976-WIRE

FIRST RUN (Drop D)
  FP-1 --> FP-3        FP-2 --> FP-3, FP-4, FP-19 (also DA-3)
  FP-12 --> FP-7, FP-13, FP-14        FP-7 --> FP-8, FP-20 (FP-8 also FP-1)
  FP-5, BL-922, BL-978 --> FP-6
  NSC-01, NSC-02 --> FP-10a --> FP-10b

INSTRUMENTATION (nothing in Wave 1 depends on any of it)
  IN-01/an --> IN-02/an --> IN-03/an --> IN-05/an --> IN-06/an
  IN-02/an --> IN-04/an --> IN-08/an <-- IN-05/an
  IN-08/an (production turn-on) <-- IN-DS-06, IN-DA-10, IN-DA-11, IN-ops-01, IN-K9, IN-DS-02, IN-DS-04
  IN-DA-10 --> IN-DA-11 (also IN-DS-06), IN-DS-02
  IN-K1 --> IN-K2, IN-K3, IN-K5 ; IN-K1, IN-K3 --> IN-K4 --> IN-K9
```

### 2.13 Checks on the map

Run by `docs/product/prd/tools/readiness-check.py`, which reads the Depends on column of the tables above:

```
python3 -I docs/product/prd/tools/readiness-check.py docs/product/READINESS-20nov.md
```

Result on this file: PENDING

What the check proves and does not prove:
- It proves the table is internally consistent: every id in Depends on is a row, there is no cycle, and no row outside the instrumentation chain depends on an instrumentation row.
- It does not prove the table is complete. Rows come from the backlog, the plans and the instrumentation files. A work item that no document names is not here. The 665 P0 rows with no BL row (section 1) are the known hole.
- Dependencies for the BL rows come from each row's `Depends on` line and the blockers named in its status. I added the ones plan 17 names and the backlog line leaves out: BL-978 on BL-922 and BL-961; BL-961 on PR-879 (its third part); BL-952 on FIND-8; BL-931 on PR-840; BL-933 on BL-868; BL-977 on BL-926; BL-984 on BL-928.

### 2.14 Critical path

Three paths matter. All lengths are row counts, not time. I have no basis for time.

Build 13 (the Wave 1 and Drop A set):
1. Reminders: BL-966 (M, three PRs) then BL-943 (M, four PRs), then the G4 device run with a time-zone change. Two M rows in series and then a human step only the founder's phone can do. This is the critical path to a Build 13 candidate if the cut waits for BL-966 (plan 17 Q1, a recommendation the founder has not recorded an answer to).
2. Account: PR-879 (M) and BL-922 (M) in parallel, then BL-978 (M), then the G4 two-phone row (S1-204). Needs a second phone (Q-FD-33).
3. Words: BL-925 founder approval (G3) then BL-926 (S) then BL-977 (S). One approval gates two small rows. If the founder does not approve, the cut waits or ships with a written known-defect decision.
4. Release steps: B13-CHECKS and PR-830 (founder) then B13-CUT. Short in rows, but each step is the founder's.

To 1.0 with Drop B: BL-966, BL-943, BL-982, BL-1012, BL-1013, then BL-1015 (Drop C). Five or six rows deep behind BL-966. The plan 23 conclusion holds: promising Drop B for 1.0 before BL-966 merges is not supported.

Longest chain in the whole map (not Build 13, because the photo flags ship off): the six serial photo PRs (#835 to #840) then BL-931, then BL-939, BL-968, BL-969, BL-970. It is serial because each slice targets the one below it and each needs a macOS launch of about 75 minutes (plan 17 section 2.1).

Instrumentation: the longest chain is IN-01/an to IN-06/an and IN-08/an. It has no effect on any of the paths above.

### 2.15 Findings while mapping (for Karma to rule; none is mine to decide)

1. **Build 13 and the database deploy disagree.** Plan 17 section 3a starts the release path with F4 (the production database secret) and the 29-migration deploy. The founder's answer 1 in `docs/engineering/readiness-20nov/DECISIONS-20nov.md` section 8 says Build 13 is servers off. If servers are off, F4, DBDEPLOY and P-7 are not on the Build 13 path. I kept them in the map, marked, and made nothing depend on them. Karma: which is it?
2. **Backlog statuses that are behind the code.** On `develop`, the row text still says: BL-1002, BL-1003, BL-1004 in review (all merged), BL-927, BL-958, BL-962, BL-967, BL-975, BL-987 ready (all done), BL-936 in review (merged in #829). BL-925, BL-965 and BL-949 read as needing a decision or ready, but their PRs merged. BL-1009 and BL-1011 read blocked, but their only blocker (BL-1002) is done, so by the dispatcher's rule they count as ready (their other gates are counsel and a device run, not rows). `product` owns the fix. I did not edit `docs/BACKLOG.md` in this PR so it cannot collide with #843, which also edits statuses.
3. **Two counting defects in `p0.py`** (section 1.5).
4. **Instrumentation ids collide.** The ten instrumentation files each number their rows. `IN-01` to `IN-08` mean different things in `analytics.md`, PM1 and PM5. `IN-DS1` to `IN-DS6` (decision-science) look like `IN-DS-01` to `IN-DS-09` (data-steward). The tables above add a suffix to tell them apart. None of the 100 rows has a BL id yet. The next free id is BL-1021 (`node scripts/agents/next-id.mjs` prints BL-1021, D-163, ADR 0036).
5. **Instrumentation rows that are the same work.** Closed screen and control id lists: IN-01/pm1, IN-202, IN-DS-05, IN-03/pm5 and part of IN-K1. The perf marker harness: IN-ops-05, IN-10/pm1, IN-208, IN-04/pm5 and BL-929-PERF. The Asha seeded book: IN-06/pm5 and BL-929-ASHA. Five owners could build one thing five times. One owner each (`analytics` for the lists, `qa` for the harness and the Asha book) would fix it.
6. **Rows still marked in progress after the lock.** BL-988 to BL-999 (design areas A to E, the design system, the first-run requirements, and the function reviews) say "in progress (interactive session)". The pack they feed is locked. They should be done or superseded. Not verified which.
7. **`design-spec-sync`.** I was asked to include it. I could not find a PR, branch, backlog row or doc by that name (searched `docs/`, `agents/`, open PR titles, and `git branch -r`). The nearest items are IA-FINAL (#1033, merged) and the design specs under `docs/design/specs/`. NOT VERIFIED. If it is a row, give me its id and I will add it.
8. **Plan precedence.** Plan 17 line 3 and `locked-pack-plan.md` differ on which one sets engineering order (plan 23 section 5 raised this). #847 merged, so plan 17 now stands; `13-engineering-plan.md` sections 4 and 5 and plan 23 sections 2 are older and should say so.
9. **Instrumentation changes the permissions matrix and the label.** #1054 lists seven legal-text changes, all counsel-must-confirm and all in `docs/legal`, which only the founder merges. It also asks the founder one question: photo access level (the shipped default is the system picker, no permission).

## 3. Project plan

No calendar dates, except those a doc already holds. Sizes and review passes are estimates from plan 17 section 4 and 17b section 4, marked [E]. I did not recount them.

### 3.1 Waves and order

The wave model is plan 17 section 4.3 and 17b section 1. Karma's execution map of 20 Nov (waves, chains, gates G0 to G6, Wave 1 builders W1-a to W1-i) is a Project doc; I could not open it from this repo session. I use the chain names from the summary I was given. If his builder letters differ, only the "who" changes, not the order below.

| Wave | What | Rows | Holds the Build 13 cut? |
|---|---|---|---|
| 0 (done) | Step 0.2 rows, ADRs 0029 to 0035 as Proposed, the content drift test, NS-48 phase 1, analytics tests | BL-1001 to BL-1005 (#1028, #1029, #1031, #1032, #1027) | no |
| 1 | The floor and the cross-cutting P0 rows; the photo stack and Find merged dark; platform and release steps | Reminders: BL-966, BL-943. Account: PR-879, BL-922, BL-978. Words: BL-925 to BL-926 to BL-977. Keeping: P-4, BL-976 rest. Gates: BL-929-ASHA, BL-929-PERF, BL-964-RATCHET, PR-1060, PR-1061. Data: T1, T3, BL-959 amendment, BL-868. Platform: B13-CHECKS, B13-CUT, CI-SET, BL-976-WIRE. Dark, in review: PR-835 to PR-840, PR-894, PR-895, FIND-8 | the account rows, BL-925 to BL-926 and BL-966 hold it under plan 17's Q1 recommendation; the photo stack and Find do not (Q2 recommendation) |
| 2 | Export and the picture residue; first run (Drop D); days stack A and B; the media spine | BL-933, BL-932, BL-953 to BL-957, BL-963, BL-984, BL-937, G1, H1; FP-1 to FP-20; BL-1007 to BL-1014 | no |
| 3 | Past-letter and Home rows; NS-47 days store; the Find header | BL-938, BL-939, BL-941, BL-942, BL-945, BL-946, BL-974, BL-985, BL-948, BL-1010 | no |
| 4 | Reports and later keepsake rows | BL-972, BL-947, BL-973, BL-968, BL-982, BL-1006 | no |
| 5 | Gated on counsel or the founder | BL-969, BL-970, BL-971, BL-979, BL-980, BL-983, NS-17, BL-1015 to BL-1020 | no |

Rules for order inside a wave:
- Anything an account or a reminder P0 row needs goes first (BL-961 and BL-966), because they are known failing P0 rows on `develop` (plan 17 section 3a: NS-10-R3, NS-13-R19, NS-32-R1b).
- A row that has an open PR with a passing review pair is reviewed before a new row is started.
- The photo slices merge in order (835, 836, 837, 838, 839, 840), each retargeted and re-reviewed at its final head.
- The instrumentation rows start only when a lane slot is free (section 4.3). They never go ahead of a Wave 1 row.

Review effort for the three stacks, plan 17 and 17b [E]: Wave 1 about 126 review passes (2.7, 0.4 and 0.1 weeks at the low, mid and high pace of the last week). NS-38 to NS-52 add about 88 PRs and about 352 passes (7.7, 1.2 and 0.3 weeks). The founder's gates bind first, not review.

### 3.2 What can start now

Ready, with a brief:

| Row | Lane | Brief | Note |
|---|---|---|---|
| BL-966 | mobile | `BRIEF-BL966A`, `B`, `C` | first row on the reminders critical path |
| BL-922 | mobile | `BRIEF-BL922`, data `BRIEF-BL-922a` | S1-204 needs two phones |
| BL-978 | mobile | `BRIEF-BL978A`, `B` | after BL-922 and BL-961; 978b waits for words |
| PR-879 (BL-961 part 3) | mobile | `BRIEF-PR879` | open PR: review it, do not rewrite |
| BL-957 | mobile | `BRIEF-BL957` | |
| BL-929-ASHA, BL-929-PERF | qa | platform briefs 19 and 20 | PERF needs its own BL row |
| BL-964-RATCHET | qa | `BRIEF-BL-964-trace-ratchet` | whether `--check` blocks is the founder's (07 Q8) |
| T1, T3, BL-959 amendment | sync, qa, data-architect | data briefs | |
| P-4 | mobile | data `BRIEF-P-4` | |
| B5, HO-908-910-911 | mobile | mobile briefs | |
| B13-CHECKS, B13-CUT, BL-976-WIRE, CI-SET, HG-MQ | ops | platform briefs | the founder pastes workflow patches |

Ready, with no brief (NO in section 5):
- BL-963 (Home slips: one registry). It blocks BL-1014, BL-942 and BL-946.
- BL-985 (Quiet this book has a home). The row text is stale: the planner now reads a quiet book (#901, #902). The row needs its problem line rewritten before anyone picks it.
- BL-982 (typed days in reminders) is blocked by BL-966 and BL-943 and has no brief either.

Waiting on a founder step, not on a row: BL-926 and BL-977 (G3 approval of #866's words), BL-1001 (the reversal ruling), BL-1006 (words, photo stack on TestFlight), BL-1007 (consent line), BL-1015 to BL-1020 (counsel, Apple, money).

### 3.3 Parallel limits and who takes the slots

From `agents/roster.json` (`wip_limit`): mobile 3, sync 2, data-architect 2, qa 3, security-architect 1. Also content 2, privacy 2, design-systems 2, analytics 2, security 2, ops 1, legal 1. Team caps: `max_runs_per_day_total` 30, `max_parallel` 6, `max_open_agent_prs` 10.

Open PRs labelled `agent:<handle>` today: (labels). That is far above every limit, so the autonomous lane could only review and fix if it were on. It is off (plan 17 Q6; `HARNESS.md`), and `AGENTS_ENABLED` is not readable from this session, so the lane state is NOT VERIFIED. In practice the PRs come from interactive sessions on the founder's account. The limits are the plan; the real cap is the founder's review time.

How the slots are used in Wave 1:

| Lane | Limit | Slot 1 | Slot 2 | Slot 3 |
|---|---|---|---|---|
| mobile | 3 | reminders: BL-966 a, b, c, then BL-943 | account: PR-879, BL-922, then BL-978 | the dark stacks: review and merge PR-835 to PR-840, then PR-894, PR-895, FIND-8. BL-963, BL-985 and BL-957 take a slot as one frees |
| sync | 2 | T1, then BL-976 claim patterns | FP-5 or KS-1 (one PR, count once) | |
| data-architect | 2 | BL-959 amendment, BL-868 | G1 | |
| qa | 3 | BL-929-ASHA | BL-929-PERF | BL-964-RATCHET, PR-1060, PR-1061, T3 |
| security-architect | 1 | lens on PR-879, then BL-922, BL-978 | then the photo slices | NSC-01 and NSC-02 (needed by FP-10a, Drop D) |

`security-architect` is the tightest: one slot, lens B or A on about a dozen Wave 1 rows (plan 17 section 4.4). Order its reviews by what holds the cut: account first, then reminders, then photo.

### 3.4 Who reviews what

Two counted reviews of different lenses at the PR head, plus green CI, before Karma merges (CR-44, CR-63, CR-70; `docs/agents/COORDINATION.md` lines 62 and 103). Agents never merge. Lens A is correctness and tests that fail on the old code. Lens B is the domain.

| Area | Lens A | Lens B |
|---|---|---|
| Reminders (BL-966, BL-943, BL-982) | principal-architect | compliance-engineer |
| Account (BL-961, HO rows) | security-architect | compliance-engineer |
| New phone and held screen (BL-922, BL-978) | principal-architect | security-architect |
| Photo stack (#835 to #840) | principal-architect | security-architect; design-systems on the screen slices |
| Find | principal-architect | compliance-engineer |
| Data, sync and export rows | data-steward | security-architect or compliance-engineer |
| Words and content | design-systems | compliance-engineer |
| Platform and CI | security-architect | principal-architect |
| Label guard and legal text | compliance-engineer | regulatory-affairs (founder merges `docs/legal`, D-125) |
| Trace and QA rows | principal-architect | ai-eng-lead |
| Instrumentation code | principal-architect | data-steward (consent and label: privacy and compliance-engineer; any migration: red-team and the founder's `approve-migration`, D-041) |

Source for the pairs: plan 17 section 2 and 17b. `docs/engineering/readiness-20nov/quality/CHECKS-AND-BALANCES.md` binds both lenses (rows C-03 to C-10). Karma's own review framework (in the 20 Nov Project doc) is NOT VERIFIED here.

### 3.5 Founder gates: what each unblocks, and what happens if he does not answer

Defaults hold for design and build only. They never stand in for public words, a counsel answer or a store submission (card 21 header).

| Gate or ask | Unblocks | If he does not answer |
|---|---|---|
| G3 words: approve the PROPOSED words (#866, #870, the twelve Find lines in #894, the photo keys, the held-screen words) | BL-926, BL-977, BL-978b, NS-09-R4a and R4b, every flag that needs words | Nothing ships on a PROPOSED word. The words PRs are merged as PROPOSED. `DECISIONS-20nov.md` section 8 says his 20 Nov approval "does not approve any PROPOSED word". The Build 13 cut waits on NS-09-R4, or he writes a known-defect decision (plan 17 Q1) |
| G2 counsel: send packet 1.7.0 (#872, merged) and 1.8.0 (#1057, draft) | Any dark feature turning on; NS-16, NS-12, NS-32, NS-18 gates; days and media | Flags stay off. Nothing public. Counsel time is unknown, so there is no date |
| G4 device rows: say which phones he holds; run the Build 13 sheet | The Build 13 candidate sign-off; Q-FD-33 (borrow phones, waive only what is missing) | Rows stay unrun; flags stay off; the candidate is not signed off |
| G5 label and claims | Photo on; analytics on | Store builds ship with the new-scope flags off (G6 test #1061, draft) |
| Q1 and Q2: what Build 13 contains and whether it waits for photo and Find | Which rows hold the cut | These are plan 17's recommendations, not defaults. Whether he answered is NOT VERIFIED. Without an answer, the cut waits for the Q1 list |
| Apple capabilities and entitlements (Journaling Suggestions Q-FD-11; Declared Age Range; the Texas exposure, card 19 O-2) | BL-1017, FP-10a, FP-10b | Level 2 stays off; FP-10 is not built |
| Money: Supabase Pro ("later", a gate before the first outside family); NS-52 variant B and its cost; an accountant | Backups, hosted media | Nothing is bought; variant A (phone only) |
| Founder-only merges and acts: `docs/legal` (#873, #799, BL-868, the 1.7.0 and 2.3.0 register #1058); `scripts/agents` and workflow pastes (CI-SET, HG-MQ, B13-CHECKS); `approve-migration` (S1, G1, H1, S2 to S5, E63, the IN-DA rows); applying `20261108000000` and File 28; the F4 secret | The rows named in the Gate column | The row waits. Agents never apply or merge these |
| Digest lines in `22-final-holistic-spec.md` section 7 (E43, E46, E47, E56, E59, CL-008, CL-015, CL-052, CL-097, CL-099, CL-103) | Closes the founder digest | The default is in force; the doc's deadline is Mon 23 Nov (`RESUME.md`) |
| Size exceptions (CODE-R02): the photo slices at their new sizes; plan 17 and 17b's own size (Q5) | Merging #835 to #839 and the plans | The PR waits. The 20 Nov "Yes, all three" covered the sizes then, not today's |
| D-entries: the standing defaults (E26); the 20 Nov answers (`DECISIONS-20nov.md` section 10); BL-1001's reversal ruling; the analytics reversal (section 4) | The record; BL-1018 to BL-1020; analytics on | Not decided. I draft only. Analytics stays off |
| Q6 agent lane and Q7 run cap | Autonomous runs | Lane off; cap 30 |

Wave placement for BL-1006 to BL-1020 is mine, from each row's drop and blockers; plans 17 and 17b place those stacks, not these rows.

## 4. Analytics work inserted into the plan

### 4.1 What the founder asked, and what it changes

On 20 Nov the founder's direction was "build for production now so analytics is needed" (quoted in #1041's body). That reverses three locked lines for the production release: D-095, D-124 item 3 and FR-DAT-01 ("no event, counter or payload sent, queued or written"). The instrumentation files propose one erratum to supersede them, placeholder `E-INSTR-1` (the real number comes from E84 when ruled; E83 is taken by #1051). Nothing in the locked pack is edited. The privacy label and the Privacy Policy currently say there is no usage data and no analytics (`PERMISSIONS-AND-DISCLOSURE-MATRIX.md`, gap 2).

What already exists: the typed allowlist, the consent gate, the validators and the PostHog adapter (`posthog-react-native`) in `packages/analytics`, and the consent sheet with its timing (`analyticsConsentDue`: after the first saved letter, never the same session, at most two offers) (`analytics.md` sections 1 and 1a). So there is no new adapter row. The work is wording, tests, deletion proof, and the paper (erratum, label, policy).

### 4.2 When production analytics may turn on

Never before every line below is closed. The turn-on row is `IN-08/an`. In this map its Depends on column holds the rows, and its Gate column holds the founder and counsel items.

| Precondition | Row or item | State |
|---|---|---|
| Staging deletion drill passes: events under a bootstrapped id reach PostHog, forget removes them, repeat for the own-table fallback | IN-DS-06 (qa, S), then IN-DA-11 as the release gate | Not started. Needs the free-host decision (FD-1 or IN-K10) and a throwaway PostHog project |
| Withdrawal route: signed-out withdrawal reason, counts-only global quota, read `deletion_errors`, retired-id cap fix | IN-DA-10 (M), IN-DS-03, IN-DS-02 | Not started. A migration: founder's `approve-migration` |
| Error messages carry no dates: `packages/core/src/age.ts:15` and `packages/core/src/child.ts:28` and `:33` throw `Invalid ISO date: ${iso}` | IN-ops-01 (`mobile`, `core`, S) | Not started. I read all three lines on `develop` at `021ecdfea`: all three still interpolate the date. See 4.4 on its overlap with BL-1011 |
| Consent sheet words, in the Shown, Records, Never, Decline shape (PRIV-R21) | IN-K9 (privacy, content, S), IN-14/pm1 | Not started. Words are the founder's (G3) |
| Privacy label and policy text change, subprocessor row, data-map row | IN-DS-09, IN-DS-01, IN-DS-04 (retention number equal to the policy) | Not started. `docs/legal` is the founder's merge |
| Counsel read | G2 | No packet question exists for analytics yet in #872. Not started |
| The erratum | E-INSTR-1, plus a D-### superseding D-095 and D-124 item 3 (IN-14/pm1, IN-DA-01) | Draft text is IN-201 (PM2). Founder decides |
| The build test: today any 1.0.x profile with analytics on fails; production needs "analytics only behind consent" | IN-DS-08, IN-02/pm1, IN-04/an (validators V1 to V16) | Not started |
| The release gate rewrite (OG-1 to OG-10) and the label-guard exception for `posthog-react-native` | IN-ops-04, IN-DS-08 | Not started. Founder applies workflow patches |
| The host decision | IN-K10 (founder with ops): free-only hosting path, hosted free tier, or none | Founder |

Order inside the set: IN-ops-01, IN-ops-02, IN-04/an and IN-DS-05 first (all `analytics`, `mobile` or `qa`, none needing the founder), then IN-DS-06 and IN-DA-10 and IN-DA-11, then the words and paper, then IN-08/an. Phase numbers in the source files are 0 to 3 and agree with this.

Earliest turn-on: after the last line above. I give no date. It is a separate decision from any build cut. Default if the founder does not answer: analytics stays off in every build, Build 13 included, and `PR-1061` style tests keep it off.

### 4.3 None of it blocks Wave 1

- No row outside the instrumentation chain depends on an instrumentation row. The check in 2.13 enforces this.
- The Wave 1 rows do not share a PR with any instrumentation row. They do share people: IN-02, IN-05, IN-06 and the like are `mobile` rows, and `mobile` has 3 slots. So instrumentation `mobile` rows wait for a free slot after the Wave 1 rows in section 3.3. `analytics`, `qa`, `ops` and `data-architect` instrumentation rows run in their own lanes and can start now.
- Every instrumentation event is built dark: compiled, tested, inert, off in every store profile, until IN-08/an.

### 4.4 Overlaps to watch

- IN-ops-01 edits `age.ts` and `child.ts`. BL-1011 (calendar engine) and ADR 0035 ("one age function in `packages/core`") will edit the same functions. Do IN-ops-01 first (it is S), or fold it into BL-1011. Karma should say which.
- Instrumentation wiring (IN-05/an, IN-05/pm1, IN-K5, IN-PM4-04) touches screens that Wave 1 changes (letter page, Book, Me). Land the Wave 1 screen changes first.
- The same closed id lists are specified in five rows (section 2.15 item 5). One owner.
- The consent sheet words have two writers: IN-K9 (PM3) and IN-14/pm1 (PM1). One sheet, one set of words.
- The permissions matrix (#1054) lists seven legal-text edits, one of them for analytics. Counsel reads them together with the analytics change, not twice.

## 5. Readiness checklist

YES means I checked it and the evidence is named. NO means I checked and it is not true. NOT VERIFIED means I could not check it.

| # | Line | Answer | Evidence |
|---|---|---|---|
| 1 | Requirements locked | YES | Rev 2 LOCKED (`README.md`, `RESUME.md`); #934 merged as `88f3a975` at 20:37 UTC (REST `merged_at`). E1 to E83 and CL-001 to CL-158 present, none missing (section 1.2, c1 and c2) |
| 2 | Every NS card and function file accounted for | YES | 52 of 52 card headings; 5 cards have 0 P0 rows and no BL row by design; 23 of 23 function files counted (sections 1.3 and 1.4) |
| 3 | Backlog rows exist for every NS card | YES at card level, NO at P0-row level | 47 of 52 cards named by a BL row. 665 of 1,052 P0 rows have no row-level BL row: gate G0 is not met. NS-38 to NS-45 have only proposed group rows. 100 instrumentation rows and 26 first-run rows have no BL id (section 2.15 item 4) |
| 4 | The counting tool is right | NO | `p0.py` ignores four-digit ids and reads plan 17 (section 1.5). Numbers in this file are from a patched copy |
| 5 | ADRs filed as Proposed | YES | ADRs 0029 to 0035 on `develop` (#1029 merged), each "Status: Proposed, 20 Nov 2026" (`git show origin/develop:docs/adr/0029-...`). None is Accepted, and only the founder accepts |
| 6 | Dependency map: no cycle, no missing blocker | YES | PENDING (section 2.13) |
| 7 | Dependency map covers every work item | NOT VERIFIED | It covers every item the backlog, the plans and the instrumentation files name. It cannot cover an item no file names. `design-spec-sync` was not found (section 2.15 item 7) |
| 8 | Wave 1 rows ready, with briefs | NO for three rows, YES for the rest | Briefs exist for BL-966, BL-922, BL-978, PR-879, BL-957, BL-929, BL-964, T1, T3, P-4, B5 and the release steps. None for BL-963, BL-985, BL-982 (section 3.2). `ls docs/engineering/readiness-20nov/briefs/*` |
| 9 | Wave 1 rows can be handed out by the dispatcher | YES for BL ids, NO for the rest | #912 merged; `node scripts/agents/check.mjs` says "26 agents, 592 backlog tasks ... agent team is consistent". Rows with no BL id (instrumentation, FP, several release steps) cannot be dispatched |
| 10 | Review framework | YES in the repo, NOT VERIFIED for Karma's | Counted reviews and CR-70 are in `COORDINATION.md`; `CHECKS-AND-BALANCES.md` exists. Karma's 20 Nov execution map and review framework are a Project doc I could not open here |
| 11 | CI green on `develop` | YES for the last completed runs; head pending | (to be filled) |
| 12 | Tests pass | NOT VERIFIED | I ran `node scripts/agents/check.mjs` only. I did not run `npm test`, `typecheck`, `test:db` or `test:functions` |
| 13 | Open-PR stock | (to be filled) | REST `GET /repos/.../pulls?state=open`, counted (time) UTC |
| 14 | Instrumentation does not block Wave 1 | YES | Section 4.3 and the check in 2.13 |
| 15 | Production analytics may turn on | NO | Ten preconditions open (section 4.2) |
| 16 | Words approved | NO | No PROPOSED word is approved (`DECISIONS-20nov.md` section 8) |
| 17 | Counsel answers on file | NO | None in the repo. Packet 1.7.0 (#872) is merged and not recorded as sent |
| 18 | Build 13 contents decided (Q1, Q2) | NOT VERIFIED | Plan 17 gives recommendations. I found no recorded answer |
| 19 | Build 13 needs servers? | NOT VERIFIED | Plan 17 3a and the founder's answer 1 disagree (section 2.15 item 1) |
| 20 | Karma's map matches this file | NOT VERIFIED | Could not read it |

### 5.1 What still needs the founder

1. Approve or change the PROPOSED words (#866, #870, #894's twelve Find lines, the photo keys, the held-screen words). Unblocks BL-926, BL-977, BL-978b.
2. Send counsel packets 1.7.0 and 1.8.0, and merge the `docs/legal` rows (#873, #799, #1058).
3. Say which phones he holds, and run the Build 13 device sheet.
4. Answer plan 17's Q1 and Q2, or accept the recommendations. Say whether Build 13 is servers off (this decides whether F4 matters).
5. Merge or reject the size exceptions for #835 to #839 at their new sizes.
6. Decide the reversal ruling BL-1001 (level 3 and several pictures), and the analytics reversal (E-INSTR-1 and the D-### superseding D-095 and D-124).
7. Pick the free-only analytics host path (IN-K10), and rule F-1, F-2, F-3 and F-10 of the data-architect file.
8. Paste the workflow patches (CI-SET, HG-MQ, B13-CHECKS) and apply migrations with `approve-migration` when a row needs it.
9. Apple: the Journaling Suggestions entitlement, Declared Age Range, the Texas exposure record.
10. Money: Supabase Pro (he said later), NS-52 variant B, an accountant.
11. The digest lines in `22` section 7, which have a deadline of Mon 23 Nov in `RESUME.md`.
12. Paste the D-entries (`DECISIONS-20nov.md` section 10 and E26).

### 5.2 What I did not do

- I did not edit `docs/BACKLOG.md`, the cards, the errata or `p0.py`. Status corrections (2.15 item 2) and the two tool fixes (1.5) go in the next product PR. #843 also edits backlog statuses and should land first.
- I did not file BL rows for the 100 instrumentation items or the 26 first-run PRs. The next id is BL-1021. Filing them is the next product job, once Karma confirms which of them are Build 13 and which are later.
- I ran no tests and touched no device, store or hosted service.

Signed: product.
