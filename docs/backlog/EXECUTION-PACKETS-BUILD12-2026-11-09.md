# Execution packets for the Build 12 cut (9 Nov 2026)

Written by `product`, docs only, 9 Nov 2026 (UTC). It decides nothing. Rows are in `docs/BACKLOG.md` section "Build 12 cut, founder decisions of Mon 9 Nov 2026" (BL-775 to BL-815). The merge order, gates, metrics and rollout are in `docs/backlog/BUILD12-PLAN-2026-11-09.md`. Earlier packets (BL-764, 765, 770, 772) stay in `EXECUTION-PACKETS-2026-11-08.md`.

How this was checked: PR numbers, heads and states by `gh api repos/thesaurabhpareek/earlyletters/pulls/<n>` on 9 Nov; file lists by `.../pulls/<n>/files`; test titles read from the PR head blobs. I ran no test and no build (no `node_modules` on this machine). "Fails on old code" is the PR's or requirement file's claim. Anything I did not read is marked UNVERIFIED.

## 0. Rules for every packet

- Claim check, before the first edit. Read `docs/agents/BOARD.md`, then list who has the files open:
  ```
  for n in $(gh api 'repos/thesaurabhpareek/earlyletters/pulls?state=open&per_page=100' --paginate --jq '.[].number'); do gh api "repos/thesaurabhpareek/earlyletters/pulls/$n/files" --paginate --jq '.[].filename' | sed "s|^|#$n |"; done | grep -E '<the regex in your packet>'
  ```
  If an open PR already does the same job, comment on it with what is missing and take the next step. If it only touches the same file, say so in your PR body and rebase on its merge.
- Stacking: a branch cut from an open PR's branch is a stack. The PR stays draft and says "stacked on #nnn (head sha)" until the lower PR merges; after a squash merge use `git rebase --onto origin/develop <lower head sha>`.
- Gates before any push: `npm test -w @scribe/mobile`; `npm test -w @scribe/content` when copy changes; `npm test -w @scribe/core` when core changes; `npm run test:db` for `supabase/**`; `npm run typecheck`. One PR, one concern, under 400 lines and 20 files. #703 needs the full tests on a full checkout (council pass 2).
- Content rules: no em or en dashes, curly quotes, ellipsis characters or emoji; no fear, guilt or loss language; never imply AI writes; `{child}`, never a gendered word; fictional family Asha only.
- Never: edit an applied migration, touch `eas.json` profile values (frozen until after the go/no-go, D-124 item 1), add an analytics event (proposals only, see the plan file section 4), merge, apply a migration, or write `DECISIONS.md`.
- Build 12 profile facts to keep in view (read from `apps/mobile/eas.json`): the `production` profile has `EXPO_PUBLIC_SERVER_FEATURES` off, `EXPO_PUBLIC_BACKUP` off, `EXPO_PUBLIC_ACCOUNT_DELETION` on today. Account-first turns the first one on in the production flip PR, which is not yours.
- Hand-back format (PR body, last section, and one line in your journal): PR number and full head sha; the packet id; files changed (count); each test title run with pass or fail and the command; the claim-check output (or "no overlap"); device rows needed and who runs them; UNVERIFIED list; anything you did not touch that you expected to.

## 1. Packet BL-776: Family tab hidden in the servers-on store build

Customer outcome: the bar a stranger sees in Build 12 is Tonight, Book, You, with no door to a feature that is not in the listing.
Engineer: `mobile`. Reviewer: `red-team`, `design-systems`. Status: blocked until #665 merges.
Claim-check regex: `apps/mobile/src/(app/\(tabs\)/_layout|lib/family/entry.logic|app/settings/children)|store-family-tab|tab-bar`

What exists (read at the heads): #665 (head a8614c5e) adds `familySurfacesShown` in `apps/mobile/src/lib/family/entry.logic.ts` and guards the Family tab with `Tabs.Protected`; its test `apps/mobile/test/store-family-tab.test.ts` has `hides only in a store build with server features off` and `the alpha builds keep them`. Its comment says a store build with server features on "shows them as the real flow". #699 (head cab3713a) repeats #665's five files and adds the You tab.

Do:
1. After #665 merges, branch from `origin/develop`. Change `familySurfacesShown` so the store build (`alpha` false) returns false whatever `coParent` says, keyed on one named constant (for example `CO_PARENT_IN_STORE_BUILD = false`) that a family release flips. Alpha builds unchanged.
2. Extend `apps/mobile/test/store-family-tab.test.ts` with `[NX-30-R18] the servers-on store build has no Family tab and no Family row`.
3. Update the comment block at the top of `entry.logic.ts` (the line about "a store build with server features on").

Files: `apps/mobile/src/lib/family/entry.logic.ts`, `apps/mobile/test/store-family-tab.test.ts`. Maybe `apps/mobile/src/app/settings/children/[id].tsx` if its row reads another predicate (read it first).
Do NOT touch: `eas.json`, `capabilities.ts` values, invite flows, `(tabs)/_layout.tsx` beyond what #699 owns.
Done when: the new title and the two alpha titles pass; `tab-bar.test.ts` (from #699) asserts three tabs for the servers-on store build.
Open question for the founder: the draft D-152 reading of D-126 (the plan file section 7).

## 2. Packet BL-775: land the You tab (PR #699)

Engineer: the author (`mobile`); `product` only checks. Status: in-review, draft, stacked on #665.
Claim-check regex: `app/\(tabs\)/(_layout|you)|settings/_layout|docs/design/IA.md|tab-labels|tab-bar`

Steps to merge: (1) #665 merges; (2) rebase `git rebase --onto origin/develop a8614c5e` (the stack base); (3) add BL-776 first or in the same stack, so a servers-on store build is three tabs; (4) BL-807's SemiBold selected cue, if design agrees in time, as a separate small PR; (5) ready for review, then `qa` runs the NX-30a R2 and R3 tap counts on the SE 3.
Tests that must pass on the rebased head (exact titles): `[NX-30a-R1] the last tab is You and it opens Settings home`; `[NX-30a-R4] every tab sets the Large Content Viewer title and fixed label size`; `[NX-30a-R6] no visible tab leads to a coming-soon page`; `[NX-30a-R7] the You tab draws no lamp and has one level 1 heading`; `[NX-30a-R8] four tabs at 320 pt and 375 pt keep 44 pt targets and whole labels` (rename to "three tabs" for Build 12: the title says four, the Build 12 bar is three; ask the author); `[NX-30a-R9] tab titles are single words from copy.tabs`.
Do NOT touch: `settings/index.tsx` content; Photos route; Family code.
Note: the You label `copy.tabs.you` is a placeholder (NX-30-R6). The word is the founder's; do not argue it in the PR.

## 3. Packet BL-777: #700, the server accepts an empty child name

Engineer: `data-architect`. Reviewer: `red-team`; the founder labels and applies. Status: in-review (draft).
Claim-check regex: `supabase/migrations/2026110|children_entitlements|child_name_optional|supabase/tests/grants`

What exists: `supabase/migrations/20261109000000_child_name_optional.sql` (79 lines) changes the `children_name_check` and `create_child_row`; test `supabase/tests/child_name_optional.test.mjs` (titles: `[NX-31-R28] the server accepts a child with an empty name and a date`, `... still refuses a child without a date`, `... a 61 character name is still refused`, `... a 60 character name is accepted`, `... a name of spaces is stored as empty, never as a placeholder`, `... a missing name is stored as empty (the column stays NOT NULL)`, `... the column still refuses NULL`, `... an empty-name create is idempotent on retry`, `... consent is still needed before an empty-name book`, `... create_first_run_children accepts an empty name`).
Open items before ready:
1. Timestamp clash: #634 (`20261108000000_consent_record_fields.sql`) and #677 (`20261108000000_analytics_first_party_events.sql`) share a version. Council pass 2: rename one before either merges. My recommendation (data-architect decides): keep #634 (its order is set by CR-52 and #655), re-stamp #677 (draft, off by default, not in Build 12) to a free stamp after #700's, for example `20261109010000`. #700's `20261109000000` then stays unique. Check: `ls supabase/migrations | cut -c1-14 | sort | uniq -d` must print nothing on the final merged tree.
2. Does #634 also redefine `create_child_row` or `children` rules? Not read: UNVERIFIED. If it does, #700 must be rebased on it, because #634's stamp is earlier.
3. `supabase/tests/grants.mjs`: confirm no new function or table needs a line (the file adds none by its header).
4. Label `approve-migration` (founder) and a `red-team` review; both on the current head.
5. Add the line in `supabase/APPLY.md` (next file number 32 at the time of writing; recheck with `node scripts/agents/next-id.mjs`).
Do NOT touch: any applied migration; `.github/migrations-applied.txt` (the founder's apply step does).
Done when: `npm run test:db` passes with the titles above and the migration is applied on production before BL-778 reaches a servers-on build.

## 4. Packet BL-778 and BL-780: #701 then #703, names that may be empty

Engineer: `mobile` (#701), `content` (#703). Reviewer: `red-team`; founder for the nine strings.
Claim-check regex: `app/onboarding|components/onboarding/child-step|packages/core/src/child|apps/mobile/src/lib/copy|packages/content/src/(strings|prompts)|first-run-child-name|nameless-child|app/\(tabs\)/index|app/write|app/listen`

#701 (head 4e322591): titles in `apps/mobile/test/first-run-child-name.test.ts`: `[NX-31-R3] an empty name with a date creates the book and shows the fallback`; `[NX-31-R3] a name and no date: Continue waits and the reason line shows`; `[NX-31-R3] a typed name is kept as typed, trimmed`; `[NX-31-R3] twins or more still need each name, so the books can be told apart`; `[NX-31-R28] later books keep their rule: the add-book form still wants a name`; `[NX-31-R28] the phone makes the book with an empty stored name, never the fallback, and a later edit may set or clear it`. Also `packages/core/test/child.test.ts`.
#703 (head 09283722, stacked on #701): `packages/content/test/nameless-child.test.ts` titles `[NX-31-R3] no string reads wrongly when the child's name is blank` and `[NX-31-R3] the checks catch the known bad readings`; plus four more in `first-run-child-name.test.ts` (capital at the start of a string; "your child" not capitalised mid-string; a typed "your child" left as typed).
Steps: merge #700 first (council order); #701; then rebase #703 with `git rebase --onto origin/develop 4e322591`; run the full workspace tests on a full checkout (one check was still in progress on 9 Nov, so the state was `unstable`); the founder approves the nine changed strings and two replaced prompts (council question 3). If the founder does not approve, ship #701 with the strings as they are.
Do NOT touch: the add-book form's name rule (a name stays required for later books; the founder may widen it, one line); the print order; server code.
Also open: F03-U02 says Continue is disabled on an empty name; it is stale. The edit is in the plan file section 7 as a draft for the founder.

## 5. Packet BL-779: #702, the session counter

Engineer: `mobile`. Reviewer: `privacy`. Claim-check regex: `lib/asks/|kept-letter-sessions`
Head 48b0d44e. Titles: `[NX-31-R14] a session counts only when it ends with a kept letter`; `... a session in which nothing was kept is not counted, and an empty phone counts 0`; `... the count survives a restart and ignores a value that is not a number`; `... reads and writes the settings table, and a second counter on the same table agrees`; `... the counter imports no analytics, network or logging, and every kept letter reaches it through askAfterSave`.
Watch: the counter counts only on the `askAfterSave` path. A save path that skips it never increments, so BL-789 must define what session 3 means when the count is wrong (BL-808). Merge #702 last of the five, or any time before BL-789; it has no overlap with the others (files `lib/asks/index.ts`, `kept-sessions.ts`).
Do NOT touch: analytics, the ask order (BL-789).

## 6. Packet BL-789: lock offer to session 3

Engineer: `mobile`, words `content`. Reviewer: `red-team`, `privacy`. Starts after #702 merges. (#640 is already merged: bc3b8209.)
Claim-check regex: `app/onboarding|components/app-lock|lib/app-lock|lib/asks/|lib/analytics/ask-sequencer|settings/(privacy|app-lock)|next-ask|app-lock-wiring`
Files: `apps/mobile/src/app/onboarding.tsx` (remove `LockOffer` from the finish screen; keep the import only if used elsewhere), `apps/mobile/src/lib/asks/next-ask.logic.ts` and `index.ts` (add `lock` to `NextAsk`, session 3 order from NX-31-R29, read the counter from `kept-sessions.ts`), `apps/mobile/src/lib/analytics/ask-sequencer.logic.ts` (the post-screen-9 table), `apps/mobile/src/components/app-lock/lock-offer.tsx` (as a card), tests `apps/mobile/test/next-ask.test.ts`, new `apps/mobile/test/app-lock-offer-placement.test.ts`.
Tests (exact titles): `[NX-31-R14] no lock offer in first run; offered once in session 3`; `[NX-31-R14] a session counts only when it ends with a kept letter` (exists in #702); `[NX-31-R29] session 3 offers the lock first and only one ask`; `[NX-31-R2] asks appear in table order with 0 OS sheets before Speak and before the first kept letter`. Existing `app-lock-wiring.test.ts`, `app-lock-behaviour.test.ts`, `app-lock-machine.test.ts` stay green.
Do NOT touch: the lock machine, Keychain code, `settings/app-lock.tsx` behaviour (Settings > Privacy keeps its entry), the reminder card copy. The lock offer words must not name Photos.
Definition of done: the titles pass; a device row (fresh install: no lock card at "The book is open."; after three kept-letter sessions the card shows once).

## 7. Packet BL-790: Tonight "From the book" row

Engineer: `mobile`, words `content`. Reviewer: `design-systems`, `privacy`. Starts after BL-799 writes the empty and one-letter words (or in parallel if the author writes them with `content`).
Claim-check regex: `app/\(tabs\)/index|tonight|from-the-book|content/src/strings`
Files: `apps/mobile/src/app/(tabs)/index.tsx` (a row below Speak and Type), a pure logic file next to it (for example `apps/mobile/src/components/tonight/from-the-book.logic.ts`: pick by date or the parent's choice, never relevance; skip private letters and quiet days; cut at a whole word), `packages/content/src/strings.en.ts` (`tonight.fromTheBook.*`), tests `apps/mobile/test/tonight-from-the-book.test.ts` and `apps/mobile/test/tonight-a11y-order.test.ts`.
Tests (exact): `[NX-30-R2] a kept letter shows below the actions with 0, 1 and 3 drafts waiting`; `[NX-30-R3] a private letter or a quiet day is never chosen`; `[NX-30-R4] Tonight shows no count, streak or badge in 5 states`; `[NX-30-R7] reading order and 44 pt targets at AX5`; `[NX-30-R8] the row never moves under Reduce Motion and enters once per launch`.
Do NOT touch: `lib/motion.ts` or `tokens.motion` (no new motion token; the row uses the existing Tonight stagger), `review.tsx`, `listen.tsx`, recording or save code, the greeting. No audio on this row (that is option L2, undecided, NX-30-R9). Merge after #701 and #703 (they edit three lines of the same file).
Definition of done: titles pass; `qa` runs S1-183 and an AX5 look on the SE 3.

## 8. Packet BL-785: Delete account in the same build (test part only)

Engineer: `mobile`. Reviewer: `security-architect`. Startable part: the tests. The flag value in the production profile changes only in the production flip PR (frozen).
Claim-check regex: `eas.json|capabilities|account-deletion-switch|profile-flags|settings/(index|delete-account|account)`
Files: new `scripts/release/profile-flags.test.mjs` (reads `apps/mobile/eas.json`), `apps/mobile/test/account-deletion-switch.test.ts` (exists; amend so Account may name the delete route, NX-32-R19, only if BL-809 picks one entry).
Tests: `[NX-31-R25] a profile with sign-in on has account deletion on`; `[NX-31-R25] the Delete account row shows when sign-in is on`.
Do NOT touch: `eas.json` values; the purge worker; the production flip.
Done when: both titles pass today (flags are consistent) and would fail for a profile with `EXPO_PUBLIC_SERVER_FEATURES` on and `EXPO_PUBLIC_ACCOUNT_DELETION` off.

## 9. Packet BL-794: backup stays off in Build 12

Engineer: `mobile`, `content`. Reviewer: `compliance-engineer`. Claim-check regex: `eas.json|capabilities|backup|first-run-recording-line|supabase/APPLY`
Files: `scripts/release/profile-flags.test.mjs` (shared with BL-785; coordinate), `apps/mobile/test/backup-profile.test.ts` (new), `packages/content/test/first-run-recording-line.test.ts` (new).
Tests: `[NX-34-R1] the public release profile turns backup on only with server features on and a bundled escrow` (it must fail if `EXPO_PUBLIC_BACKUP` is on without escrow); `[NX-31-R21] the recording line follows the account's backup state, not the build capability`; and a scan that no first-run, Settings or Notes string contains "kept safe", "backed up" or "safe" while backup is off (council conflict 4).
Do NOT touch: backup code, the backup migration (it is not applied to production), the privacy label.

## 10. Packet BL-788: mail readiness preflight

Engineer: `ops` (script), `security-architect` (policy). Claim-check regex: `scripts/release/|docs/ops/(AUTH_SETUP|DOMAINS)|preflight`
Files: `scripts/release/mail-readiness.mjs`, `scripts/release/mail-readiness.test.mjs`; read `docs/ops/AUTH_SETUP.md` 4.1 to 4.3 and `docs/ops/DOMAINS.md` first. Overlap with BL-757 (NX-01-R7): read its row and any open PR before starting.
Test: `[NX-31-R20] public preflight fails without DMARC policy, verified domain, rate limit and tracking off` (DNS and Resend answers injected as fixtures; no network in the test).
Do NOT touch: DNS, Resend, Supabase settings, secrets. The live run is the founder's.

## 11. Packet BL-795: motion S0 (tests and tokens only)

Engineer: `design-systems`. Reviewer: `qa`. Claim-check regex: `packages/design-tokens|lib/motion|press.ts|letter/\[id\]|docs/design/MOTION`
Rule from NX-35 section 10: for Build 12 only the test-only parts may ride, and only if `qa` agrees in the PR; the two literal moves (`press.ts` line 46, `letter/[id].tsx` line 223) wait until after Build 12.
Files: `packages/design-tokens/test/tokens.test.ts` (cases for the proposed `progressSettleMs` 400 and `pressReducedMs` 90, only if the tokens are added), a lint script and test for numeric literals in motion calls, Reduce Motion unit tests.
Tests: `[NX-35-R16] no numeric literal sits inside a motion call in app or components` (it fails today on the two known literals unless they are listed in an allowlist that expires; say which); `[NX-35-R17] every moment has a Reduce Motion fallback`.
Do NOT touch: any screen file, `review.tsx`, `listen.tsx`, `(tabs)/index.tsx`. Council pass 2: no motion change in Build 12 beyond the From the book row.

## 12. Packet BL-798: the nav usability test (a study, not an engineer packet)

Owner: `user-research`, founder runs it. Needs a TestFlight build with BL-775. Script and thresholds: NX-30 section on the evaluation plan and NX-30a. Use the founder and 3 to 5 parents on one phone. Hand back: one page under `docs/qa/evidence/` with times, taps and quotes, no names of children, no recordings kept. The thresholds are proposed; a miss is a finding, not a veto.

## 13. Packet BL-814: the Free-to-Pro line in the ops sheet

Owner: `ops`. Claim-check regex: `docs/ops/`. One short section in the Build 12 ops sheet: (1) the date to check the production project is not paused, before the submit date; (2) the trigger: move to Pro the day the build shows In Review; (3) who does it (the founder, spend) and the proof (a dated screenshot of the plan page in the release record); (4) the keep-alive #685 is a stop-gap and its state is UNVERIFIED. Do NOT touch the plan itself.

## 14. Not startable, and why

| Row | Why not | Who unblocks |
|---|---|---|
| BL-781, 782, 783, 784, 787, 791 | Account-first waits on G1 to G7, a hosted project (BL-757, BL-758), #676 closed and the D-144 to D-146 entries | founder, `ops`, `security` |
| BL-786 | The reviewer path is chosen by the founder (F5, F7, F14, F15) | founder |
| BL-792 Photos, BL-793 backup | Not in Build 12 | founder (after 1.0) |
| BL-796, 797 motion S1, S2 | After Build 12 | design systems |
| BL-799 to BL-813 specifications | Startable by `product` with the named lane; each is a spec file, not an engineer packet | `product` |
