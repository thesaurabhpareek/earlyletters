## Review B at 0377402544a6aebb4e9f391b623a31d20f387194: PASS WITH NOTES

PR 662, lens B (content rules, claims, test adequacy, device plan). Head sha confirmed with gh api before starting; worktree at that sha, clean after my mutation runs. origin/develop is still d26335da (the merge base), so `git merge-tree --write-tree origin/develop <sha>` is clean (exit 0) and "trial merge" is the PR head itself.

### What I read and ran
- Whole diff (10 files, +241/-16) plus the surrounding code at every site, and every caller of the changed functions (`grep` over apps/mobile/src and packages for `consentLine`, `speechRow`, `wordsCard`, `statusText`, and all three percent strings `{n}%` / `{percent}%`).
- packages/content `npx vitest run`: 12 files, 281 tests, all pass (rules 130, claims-capabilities 15, experience-pass 6, no-real-family-data 11).
- apps/mobile `download-wait-line`, `settings-p6b`, `first-run-wait`, `speech-download-status`, `qa-release-catalog`, plus `words-state`, `p5-critics`, `first-run-cover`: 8 files, 177 tests, all pass.
- Full apps/mobile vitest: 211 files pass, 7 fail, 61 tests fail (config, privacy-manifest, capabilities, licences, preflight-production, app-lock-wiring, hosting-ios17). I re-ran those 7 files with src, docs and tests reverted to d26335da: the same 61 fail. Not from this PR (expo config / missing native module / duplicate key id in packages/api/src/keys.ts).
- `npx tsc --noEmit` in apps/mobile: only the known errors (expo-clipboard, expo-local-authentication, app-lock/controller.ts); none in a file this PR touches.
- Added lines scanned with a script (en/em dash, curly quotes, ellipsis, arrows, NBSP, emoji, any non-ASCII): 0 hits.
- CI at this sha: 11 of 12 checks success including `required`, typecheck, tests and content rules, database rules; `store-profile Release launch` was still in_progress and iOS simulator build is skipped. A PASS holds only once required CI is green at this exact head.

### 1. User-visible words and VoiceOver
- packages/content has zero changed files. No new copy: the below-1% text is `packsCopy.phases.downloading` ("Downloading", packs.en.ts:35), already on the first-run card and Storage. "download" is the BRAND.md sanctioned word for the act (BRAND.md:136). Registered strings are byte-identical. Wording is consistent with #626: `consentLine` now calls the helper and returns the same strings as before (old inline code was `n === null ? phases.downloading : fill(...)`).
- VoiceOver, traced per site (no announcement rule is touched; nothing new is announced, no percent is announced):
  - First-run card: unchanged. `spokenLine` still returns "Downloading" for any bar; the bar's accessibilityValue is still absent below 1% (speech-consent-card.tsx:174-178).
  - Book card: the reason enters `cardLabel` (letter-card.logic.ts:26), so the card's one label reads "Downloading" instead of "Getting ready, 0%" in the first percent. No live region, no announce call on this path.
  - Review: `card.note` is a plain footnote (review.tsx:1244); announcements fire only on `card.state` or title change (review.tsx:1209-1222); `empty` kind has live: none. So no change beyond the string.
  - Letter page: the wrapper already has `accessibilityLiveRegion="polite"` (letter/[id].tsx:599); iOS ignores it, and the text already changed every percent before. Not new.
  - Storage row (ListRow label = title, subtitle, list-row.tsx:82) and Spoken language row (language-row.tsx:99): label reads "English, Downloading" in the first percent, then the n% line. Ring is aria-hidden.
- Residual, disclosed by the PR and confirmed: the bar `accessibilityValue` on Review (review.tsx:1252, `Math.round`) and Storage (storage.tsx:52) is unchanged. A VoiceOver user focusing the Review bar can still hear "0" below 0.5%, "1" at 0.5 to 0.99% while the words say "Downloading", and "100" at 99.5% and up while the words say 99%. The first-run card does not do this. Follow-up, not a regression.

### 2. Claims and registers
No claims-capabilities, experience-pass or rules test pins the "Getting ready" text for these sites (grep over packages/content/test: no hit). The only pins are in apps/mobile tests (words-state 173, p5-critics 316, speech-download-status 84, settings-p6b), all at n>=1 and all pass. EXPERIENCE_PASS_2026-10.md:383 ("Getting ready, {n}%", KEEP) still true from 1%.

### 3. Test adequacy
- download-wait-line.test.ts (15 tests) covers the helper at 0, 0.004, 0.0099, 0.01, 0.019, 0.4, 0.5, 0.999, 1, 1.7, -0.2, NaN, null, plus a 4000-step sweep over -0.5..1.5 for all three copy lines (regex `\b0%|\b100%` is sound: "40%" and "10%" do not match). Sites covered by behaviour: Review (wordsCard), Storage row (speechRow), Spoken language row (statusText, real function with RN stubbed), first-run (consentLine). Book and letter page are covered by source regex only; the scan test is the second guard.
- Fails on old code: reverting only the 6 site files (helper kept) gives 8 failures (settings-p6b Recordings, Review x2, Storage, Spoken language, Book, letter, scan); reverting all of src gives 12 failures. Matches the PR's claim. The consentLine test passes on old code by design (it pins no regression there).
- settings-p6b edits are exactly the three reversals this change causes (1.7 now 99, -0.2 now "Downloading", unchanged 0.999) plus two additions (0.004, 0.01). Nothing else touched.

### 4. Device plan
- S1-15a Expected ("Book, Review and Settings show their wait line, never 0%") and S1-15b step 6 match the code at every site above. Step 6's flow (Write the first one, Type, Add to book, Speak, Finish, Review, Keep, Book) is unchanged and still consistent with Expected 6. No banned characters.
- Note A (should fix, one line): S1-15a step 7 (DEVICE_TEST_PLAN.md:223) sends the tester to "Settings > Recordings". There is no such screen at this sha (settings/index.tsx ROUTES has storage and whereLive only); the language row is in Settings > Storage (speech-row.tsx, storage.tsx:94) and the text-rules row is in Spoken language. The PR now rests its Expected on that step. Change to "Settings > Storage" (and Spoken language).
- Note B (should fix): the new "Downloading" text is hard to see on a phone with the step 6 flow. 1% of 575 MB is 5.75 MB, about 46 s at 1 Mbps; typing a letter, recording 20 s and reaching Review takes longer, so a tester will mostly see "Getting ready, n%" and tick pass without ever seeing the case this PR fixes. Add: reach Review within the first minute, or use a slower profile, and add to Record which line was seen at Review and Book. Unit tests carry the proof; this is about the human step being honest.

### Nits
- Book/letter tests assert source text with regexes; extracting each ternary into a pure function would let them run real inputs.
- The scan regex `fill\([\w.]*(?:\.downloading|pack\.progress),` misses a destructured `fill(downloading,` or a multi-line call; `sites >= 6` equals the current count exactly.
- speech-download.logic.ts (header says pure, Node-testable) now imports packs/copy -> lib/copy -> @scribe/brand, content, core. All pure, no cycle; fine, just noting the new dependency.

### Not verified
Anything on a device (VoiceOver readout, Reduce Motion, background/kill during download); Android TalkBack with the letter page live region; the PR's "4109 tests" total (I counted files and the 61 base failures, not the grand total); the in_progress CI job's outcome; `npm test` and `npm run test:db` at the root.

Reviewer: independent of the author (CR-44).
