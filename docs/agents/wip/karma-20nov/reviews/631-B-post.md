Posted after the merge (058d08ea, 17:10 UTC): this review was still running when #631 landed, so it is a fix-forward list, not a hold. Docs only; the code and the user-visible words check out. Please take these into one docs PR (device plan and the claims list) before the founder's phone run.

## Review B at 19b3b9c7cb6f804e8ac9be9f337e439066c0e2ff: CHANGES

PR #631 (Settings > Privacy, now also carrying #639). Lens B: content rules, privacy claims, constitution, registered text. I am independent of the author in method, not in identity: I run in the same Claude Code family as the Karma CTO session that produced this merge, but I did not write it, and every check below was re-derived from the tree at this sha in my own worktree.

State note: while I worked, #631 was squash-merged to develop (merged_at 17:10:11Z, 058d08ea). So CHANGES here means "fix forward in a small docs PR", not "hold the merge". No finding is a wrong word or a false claim in the app. All four findings are in docs.

### What I ran
- packages/content vitest: 12 files, 281 passed.
- apps/mobile whole vitest: 209 of 210 files, 3951 of 3953 tests pass. The 2 failures are licences.test.ts (sandbox artifact, as warned). Includes privacy-page (10), where-live (12), settings-p6b (19), settings-home (10), storage-and-words-labels (6), speech-consent, promise-sample, analytics-off-v1.
- tsc --noEmit in apps/mobile: one error, expo-clipboard not found at help-fallback.tsx:11 (declared at package.json:27, not installed in the shared node_modules). CI typecheck is green at this head.
- New tests against the merge-base source (374a249e, tests copied from the head): 9 failures in 5 mobile files, privacy-page and where-live fail to load (privacy.logic.ts and where-live.logic.ts do not exist there), and 1 failure in experience-pass. The tests do bite.
- Merge: parents are 3e96bd0b and develop 374a249e. The tree of 3e96bd0b is identical (tree hash 76dbd5f9) to the reviewed #639 head bf470a1a, so the squash equals what was reviewed. The only hand-resolved file is DEVICE_TEST_PLAN.md (git show --remerge-diff). git diff 3e96bd0b..head has the same added and removed lines as develop's own change since 04dab502 (20 files). No conflict markers; headings are develop's list plus S1-96 and S1-97; S1-111 intact; the only duplicate headings (S1-15, S1-17) are already on develop.
- Character scan of every added line in the 24-file diff: no em or en dash, curly quote, ellipsis character, emoji or nbsp.

### Findings (docs only; none changes a user-visible word)
1. **DEVICE_TEST_PLAN.md still sends testers to screens this change removed, and contradicts S1-96 and S1-97.** S1-31 (c), line 418: "Recordings. ... tap the language row"; there is no Recordings page now, the language row is on Storage. S1-31 (e), line 420, and its Expected at 427 and 430: "Read the three never-lines", "Each line has a LockSimple mark", "each never-line is one element". This PR deletes the list and its lock icons (settings-p6b [S44] pins that), so a correct build FAILs S1-31 (e) while S1-96 says "no lock icons". Also stale: line 74, 147 (the "may not play" list is now on Where your letters live), 223 (Settings > Recordings). Fix: point S1-31 (c) at S1-97 (c) and (e) at S1-96, and rename the screens in 74, 147 and 223.
2. **S1-96 (a) lists the lines in an order the screen does not draw.** privacy.tsx:79-82 draws the fact rows (P2, P3, P4) and then the iPhone backup row last; the plan says P2, iPhone backup, P3, P4. A tester reading top to bottom, as the step says, will record a mismatch. No test pins the order. Fix the plan to the screen's order (or move the row at privacy.tsx:82).
3. **S1-97 is not quite runnable as written.** (a) omits the line the page shows while no export exists (where-letters-live.tsx:72-74, exportNudge, strings.en.ts:810). (c) says "fresh install before the speech model is here" but does not say to choose "Not now" at the end of first run; with "Download on Wi-Fi" the download is already running when the tester taps English.
4. **The founder's claims list is incomplete.** The PR body lists the 8 settings.privacy.* lines. The #639 half adds more privacy claims: whereLive.onPhone, onPhoneSynced, iphoneBackup.body, and the footer "We hold no copy." (strings.en.ts, whereLive block). That footer is the strongest absolute in the change. It is true for testflight and gated to no sync, or a status of exactly off (where-live.logic.ts), but it belongs on the LEGAL-REQ-044 list before release. No code change.

### Each privacy statement, checked for the testflight profile (eas.json:69-82: SERVER_FEATURES, BACKUP, ANALYTICS all off)
- Kept on this phone, not sent to us (P2, whereLive.onPhone, "We hold no copy"): capabilities.ts:169 and :173 make signIn and sync follow the server switch; supabase/client.ts:97 returns null when off; backup and account deletion need the switch too (capabilities.ts, buildFlagEnabled). The only network left is GET for docs and packs (remote/expo-adapter.ts:52, credentials omit; headers at remote/documents.ts:287-292 are accept, request id, app version, if-none-match; pack files via File.downloadFileAsync, packs/expo-adapter.ts:206; no letter data). privacy-manifest.ts:14 says a server-off build "sends nothing we keep". Other fetch sites in src: supabase and backup, both off.
- iPhone backup includes recordings: takes are written to Documents/ExpoAudio (capture/recordings.ts:9, :25), not excluded; model-files.ts:14 says so on purpose; only derived copies are excluded (ScribeAudioModule.swift:94, :476). The letters database opens in the expo-sqlite default (db/repos/open-native.ts:17), no exclusion. The copy claims recordings only: true, and understated.
- Speech written down on this phone: whisper.rn on device (transcribe-whisper.ts:2); no SFSpeech or cloud recogniser anywhere in src.
- No usage or crash reports: capabilities.ts:197 analytics is off in every profile (analytics-off-v1 passes); no Sentry, Bugsnag, Crashlytics or MetricKit in apps/mobile dependencies or src; the PostHog path exists in lib/analytics/index.ts but gets no key unless analytics is on (postHogKeyForBuild, pinned by analytics-off-v1). Caveat for legal, already in the PR: TestFlight can hand the founder crash logs. The app itself collects none.
- Notifications never show the words of a letter: two schedule sites only (reminders/scheduler.ts:153, billing/plan-reminders.ts:82), data is enums; the planner fills child name (only with Names on), weekday and month (planner.ts:247-274, :330, :359).
- Anyone who can unlock this iPhone can open the book: no app lock, no local-authentication dependency, at this sha. Names row reads lockScreenNamesOn (reminders/prefs.ts:104), default false (:35).
- No account; deleting the app removes its letters and recordings from this phone: signIn is off in testflight; the claim is scoped to "this phone".
- Nothing new logs or sends letter text: no console, track or fetch in any added or changed source line (the one track in storage.tsx:150 is old, fixed key, analytics off). The new pages read settings, counts and the static sample only.

### Removals and registered text
- Never-list: its three promises (ads, selling, training) are all in trust.promise (strings.en.ts:1353), now the first thing on Privacy (privacy.tsx:74). trust.short moved to the foot of Privacy (:126). Settings home no longer says a privacy line (ruled, design.md 2.11). The old Recordings card line moved to the CCO-8 recordings-only wording. Kept: orphan and unplayable lists (where-letters-live.tsx:78-90), Download and Remove (speech-row.tsx), the "Recordings and letters stay" footer on Storage, registered help.mistakes on Your words (its title mistakesTitle is no longer drawn; still registered). No router.push to /settings/recordings remains; only analytics/routes.ts:38 maps it.
- REGISTERED and HELD are byte-identical (the experience-pass diff touches only CONSENT_NEVER, now {}, by the CPrivO-5 council ruling; the ruling text is SETTINGS_AND_ACCOUNT.md section 11 on PR #596). in-app-disclosures.md quotes none of the changed keys, and its section 2 rules hold: no "stay on this phone", no "cannot", no encryption claim.
- Content rules: no gendering ({child} only in sensitiveHelp); none of take, entry, draft, pack, raw_transcript, tidy, clean, correct, edit, improve in any added string; no fear or loss words (where-live tests assert it); "we" only in sanctioned lines plus "We hold no copy.", which rules.test passes; no key ends in button or cta in the added strings. "Where your letters live" is 23 characters, but it is a row and screen title, not a button, so the 22 rule does not apply.

### Nits
- Three near-duplicate lines on Where your letters live while no export exists: "Save a copy any time.", the nudge, "An export is a copy to open and keep." (the spec lists all three).
- "this phone" on Privacy and "this iPhone" on Where your letters live; only the backup line is pinned to one wording.
- "An um or a repeat comes out, marked..." drops the glossary's "small slips" phrasing (BRAND.md LNG-18) and says nothing of a misheard-name fix (EditType stt_fix). Not wrong. BRAND.md still says Word for word is named "in Settings"; Settings no longer names it.
- Dead copy with no screen: recordingsCard, C7_CLEARED and settings.recordings.onPhoneBody ("in your iPhone's own backup, if you use one"). Do not re-draw them.
- Stale outside this PR: docs/store/app-store.md:90, docs/store/screenshots/README.md:31, J16-02.json. analytics/routes.ts has no entries for the two new routes (analytics off).

### Not verified
- Apple's page at support.apple.com/108366 (proxy 403 from here); it is the target of "How to check".
- The ruling documents (privacy-settings.md, content.md, settings-ia.md, CCO-8): not in the repo at this head. I read SETTINGS_AND_ACCOUNT.md from PR #596's head 70d1e9fe only.
- No device run: VoiceOver, AX5, dark mode and the in-app browser are untested by me. Uniqueness of S1-96 and S1-97 against other open PRs was not rechecked.
- CI at this head: required is success; typecheck, tests and content rules, web, web e2e, database rules, B-8 all success; the store-profile Release launch was still in progress when I looked. A PASS holds only once required CI is green at this exact head.

Reviewer: independent of the author (CR-44).


---
_Generated by [Claude Code](https://claude.ai/code)_
