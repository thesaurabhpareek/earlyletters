## Review A at 9d441b4372ea2689414e9f0c08c6c6c7312157e5: PASS

Lens A (accuracy of the record against its sources, mergeability), third round, delta only. `gh api` returned head 9d441b43 (no sha was given this round; this is the head I fetched and reviewed), one commit on ee52bc74 ("CPO-10 states the other views, the log's field labels and the exact number claim"); merge base is origin/develop 6cd2223b (develop has not moved). Docs only, still 2 files. Earlier rounds: cc873e98 CHANGES (4 must-fix, all closed at ee52bc74), ee52bc74 PASS WITH NOTES (7 notes).

### The delta (`git diff ee52bc74 9d441b43`, read in full)
- `cto/RULINGS.md:551`: one phrase, "as this sentence says" to "as the sentence above says". Nothing else in CR-60 changed; my round-two word diff against develop (pure insertion, "delete or document" untouched) still holds because this commit only edits the inserted text.
- `exec/RULINGS.md:136-150`: CPO-10 reworked; checked line by line below.

### My seven notes from ee52bc74
1. Field labels: fixed. Order is now Question, Tier and type, Options considered, Ruling, Why, Condition, Other views, Door, No D- id, Way back, Revisit, Signed, so the four s11 labels used by all 10 other entries are present, each tagged (CPO) or (filer).
2. Number sentence: fixed and true. "CPO-2 and CPO-3 are cited in code" (develop: CPO-2 13 hits, CPO-3 1, nothing else but CPO-1); "CPO-2, CPO-3 and CPO-6 to CPO-9 in open PRs" matches my scan of all open PR patches and bodies (ids found: 2, 3, 6, 7, 8, 9; CPO-4 and CPO-5 nowhere). CPO-10 appears only in #723, #719, #715, which cite this entry.
3. "The reason given": fixed. Line 140 (Ruling) keeps the exact quote of cpo.md:5 and the acceptance of cpo.md:33; the new "Why (CPO)" says "the 30-day promise holds with one book. The answer gives no reason that separates (a) from (b) or (c)". Both halves are true of cpo.md:33.
4. "No D- id" is now tagged (filer). The BL-777 row still says "a D- id is assigned at the ruling"; that is the product agent's row in #715, not this PR.
5. Other views: fixed and accurate. "The CDesO proposed a toast with Undo on the delete until the CPO rules" equals design.md:17; "gave no written view of where the row should sit" is true (design.md has nothing else on BL-776). "The product manager's default for build 12 was option (c) ... with (a) later" equals product-ops.md:64 (the note is signed "Product Manager (Claude role)"). cpo.md:39 ("I need the CDesO on items 3 and 5") is still not recorded; optional.
6. CR-60 phrase: now "the sentence above". Its nearest antecedent is the "PR #710 deletes it" sentence, which does not say how to document; the "Before it: delete or document" clause is the one meant. Readable, not wrong. A reader could still miss it; "as the 'Before it' clause says" would be exact. Nit.
7. Caveat and door: the Question now says the restart behaviour "was read in code on `develop` and has not been run on a phone" (true; the code is `(tabs)/book.tsx:318`, `(tabs)/index.tsx:203`). Door is "two-way with cost" with a stated reason (revert is possible; until built, a person who deletes their only book meets the gap), which agrees with Karma's T2 row and with CCO-6.

### Re-run at this head
- `git grep -F LEGAL_CONTENT_DIR -- apps .github`: origin/develop exit 0; #710 head fa5d1dec exit 1 (unchanged; #710 is still open at that head).
- `git merge-tree --write-tree origin/develop 9d441b43`: clean (exit 0). Also clean against #715 (40544e82) and #719 (5cb4218e).
- Added lines (whole PR vs develop): 0 non-ASCII bytes; `git diff --check` clean; only the two RULINGS files; nothing under `docs/legal/` or `docs/DECISIONS.md`.
- CI at 9d441b43: when I first looked 5 runs listed, 2 queued and "required" absent; I polled until it settled: 9 runs, all completed/success, including "required". PR is mergeable, state blocked (review requirement only).

### Nits (optional)
- Line 138 "which no file or open PR uses" is now literally false: #715 and #719 use CPO-10, for this ruling. Add "for another ruling".
- Line 137 still says "the twelve seats each answered the status note"; the 11 seat files in council-9nov all agree, the CTO seat has no file (not verified).

### Not verified
`infra/exec-rulings-*` (Project docs, outside the repo; the entry says so itself); that cpo.md is the CPO's verbatim answer (taken from the lead's file); any phone behaviour.

Reviewer: independent of the author (CR-44).
