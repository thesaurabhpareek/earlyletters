## Review A at 534d4e3200aecef136dd90eee0fa0c85baad5303: PASS WITH NOTES

Re-check of the words-only commit 534d4e32 on top of 9ad188a9 (head verified with gh api; develop still da83fb1e; `git merge-tree` clean; package.json, package-lock.json and apps/mobile/package.json untouched). I read `git diff 9ad188a9..534d4e32` (7 files, +22/-16). My PASS WITH NOTES at 9ad188a9 stands for everything this commit does not touch; it is restated in "Carried over".

**No logic changed.** In the two source files the only changed lines are doc comments (welcome-sign-in.tsx:47, use-first-run-route.ts:53). Everything else is content strings, two updated test pins, the journey spec line and the S1-201 rows.

**Shared agreement line**
- auth.en.ts defines `const agreeLine` once (line 17) and points both `sheet.agreeLine` and `consent.terms.agreeLine` at it. I compared bytes: head `sheet.agreeLine` equals head `consent.terms.agreeLine` equals develop's `consent.terms.agreeLine` (100 bytes, identical) and the sentence in the registered row docs/legal/in-app-disclosures.md:24 (that row adds the gloss "(versioned links)" and has no final period; the code line is unchanged from develop).
- The existing registered pins (experience-pass.test.ts:179, server-surfaces-auth.test.ts:157) are on `consent.terms.agreeLine`, so they now cover both keys by construction. No test pins `sheet.agreeLine` on its own; none is needed while the const is shared.
- The registered row says "versioned links"; the Welcome opens the floating pages (CR-60 hold, BL-575, already recorded by the author). Unchanged by this commit.

**Old strings.** `git grep` for "Sign in is back", "Sign in needs a connection", "Sign in cannot be reached", "to bring it to your account" and "By continuing you agree" finds nothing in the repo except FIRST-RUN-AND-SIGN-IN-JOURNEY-WIREFRAMES-10nov.html (left alone on purpose). Tests (first-run-welcome.test.ts:183,192; use-first-run-route.test.ts:255), the comments, the journey spec line 120 and S1-201 (c), (d), (e), (h) all carry the new words. The PR body's older "Update 11 Nov" paragraphs (lines 19 and 20) still quote the old titles; the new top section supersedes them (nit).

**Content rules.** The delta and the whole PR add 0 non-ASCII characters and 0 em dashes, en dashes, curly quotes, ellipses or emoji. Button labels: Start on this phone 19, Try again 9, Sign in with email 18. "Sign-in" as a noun matches BRAND.md and VOICE.md ("sign-in link", "That sign-in did not finish"). packages/content: 17 files, 388 pass.

**Ran.** Related tests (first-run-welcome 36, redteam 5, use-first-run-route 25, use-arrival 3, gate 58, route 17, merge-back 11, lamp 44, welcome-handoff 6, server-surfaces-auth-screens 51, auth-email-link 28): 284 pass. Full apps/mobile: 249 files, 4687 tests, 72 fail, the same 8 environment files and counts as plain develop. `tsc --noEmit`: the same 5 develop-baseline errors, none in PR files. Servers-off no-op still holds: the 25 hook tests that pin zero book-list reads, zero store listeners, zero network reads and no timer pass, and no logic moved.

**startLocalNote: "You can sign in later and choose to keep your letters in your account."** True of what runs today. A person who local-starts and signs in later goes through the sign-in sheet to consent.tsx, then the claim screen "Keep your letters in this account?" with "Keep in this account" and "Not my account" (`claiming`, consent.tsx; `accountClaimPending` in auth-store.ts hides the session from sync until the person taps Keep, so nothing uploads first; takeOwnership claims only local rows). "Not my account" ends the session and leaves the phone as it was. Declining the sensitive-data step also keeps the letters on the phone. The note says letters, and recordings do stay on the phone. Three caveats, none of them a defect in this PR:
1. It is true because of the BL-347 claim screen, not #722's `mergeBack()`. Nothing outside test/first-run-merge-back.test.ts imports merge-back.logic.ts, so its header line "called by the app today" is inaccurate (a #722 comment, worth a later fix).
2. If the account already has a book, Build 12 adds the phone's book as a second book (merge-back note; the "into the existing book" choice is unshipped and #737 is not merged). The note does not claim otherwise.
3. No choice is shown when the same account already owns the phone's letters (they sync) or another account owns them (nothing moves). A fresh install has no owner, so the first-run local start does get the choice.

**Carried over from 9ad188a9 (code unchanged)**
- Nits: "You are back online." is keyed on the gate step, not the screen, so after a session loss plus an offline blip it can be spoken over the child step; Back to the welcome step after a `session_expired` loss shows no "Begin the book" (typed values are kept, the quiet Sign in door is the way on); a native network read that never settles would ignore Try again; S1-178 (b) still says Sign in is "the only quiet button"; handler swaps, the `inFlight` guard and the consent push are source-pattern or unpinned (device rows S1-201 e, g, h, j); a double tap on "Sign in with email" pushes two sheets.
- No 10 s timer on an in-flight sign-in: documented as not in it (S1-201 g).

**CI at this head:** compliance-fence (2 runs), tests and content rules, typecheck, database rules, web, web e2e, edge functions and the migrations check are success; "no e2e seam in store bundles (B-8)" and "store-profile Release launch" are still in_progress and no `required` check had appeared when I looked. A PASS holds only once required CI is green at this exact head.

**Not verified:** anything on a device; the words on a phone (S1-201 c, d, e, h); VoiceOver reading of the new announcements; the claim screen after a real local start and later sign-in.

Reviewer: independent of the author (CR-44).
