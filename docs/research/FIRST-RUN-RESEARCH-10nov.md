# First run and sign-in: research (10 Nov 2026)

Author: general-purpose agent in the researcher role, for the first-run programme (brief signed by Karma). Docs only. Read-only on code.
Tags: [read] = page opened this session, named in section 7. [repo] = read in this repo. [UNVERIFIED] = not read, or remembered, or only seen in a search snippet. [H] = hypothesis.
Status: DRAFT. Every privacy or promise line mentioned here is COUNSEL-READ (not cleared).

## Answer in five lines
1. There is no public, citable completion or skip data for story-style intros. The numbers that circulate come from vendor blogs with no source (section 3). Do not plan on any benchmark rate; measure our own.
2. The best evidence we found says explanatory tutorials do not help task success and can make an app feel harder (NN/g, 70 users, 4 iOS apps) [read]. That is about instruction decks, not value-prop stories. Closest transferable rule: keep it short, skippable, and let the person start.
3. Apple's own guidance is "fast, fun, and optional", with a skip that is never shown again [read]. Auto-advancing screens need a stop control or Reduce Motion handling [read].
4. Our current first run is already one step per screen, full-width Continue at the bottom, honest about why Continue waits. Its gaps for Build 12 are the missing account step, a finish screen that stacks three asks, and two promise lines that need a truth check against servers-on.
5. Recommendation: the intro is tier B behind a flag (as the brief proposes). Tier A is the account entry, the returning-user path and the lock offer. Ship the intro only with a visible Skip from frame one, tap to advance, hold to pause, and a Reduce Motion form. Test it with six parents before widening.

## 1. Benchmark: first-run and story-style intros

What we could actually read is thin. Table separates what I read from what the repo's earlier benchmark recorded (docs/research/competitors/adjacent-and-ux-benchmarks.md, B4, B5, B9, opened 2026-10-03 and earlier, by another author) [repo]. I did not re-verify the recordings in that file.

| Source | What it shows | Status |
|---|---|---|
| Apple HIG, Onboarding | "design a flow that's fast, fun, and optional"; "People tend to grasp and retain information better when they can actually perform the task"; "If you let people skip the tutorial when they first launch your app or game, don't present it again on subsequent launches, but make sure it's easy for people to find if they want to view it later"; "Postpone nonessential setup flows"; permission requests go "when people first access the specific function", or in onboarding if the app cannot function without them; "Prefer letting people experience your app or game before prompting them for ratings or purchases"; "Don't let large downloads hinder onboarding" | [read] |
| Apple Journal | The Apple press release names on-device suggestions, end-to-end encryption, and a lock with "device passcode, Face ID or Touch ID". It describes getting started as "logging a simple text entry" and says nothing about intro screens. Repo benchmark records the first run as suggestions opt-in, notification ask, then a lock offered as a row inside the list | press release [read]; flow [repo, not re-verified] |
| Day One | Repo benchmark records: splash and video, Sign in with Apple, social proof, paywall, then a ready-made welcome entry in the list; photo access asked when a photo is added; reminder time chosen before the system alert | [repo, not re-verified] |
| Duolingo | Repo benchmark records a first lesson before any account, then "Create profile" with a Later option; a mascot arrow at the system alert. The record also lists streaks and guilt as patterns to avoid for us | [repo, not re-verified] |
| Baby-book apps (Qeepsake, Tinybeans, Lifecake) | Qeepsake's help page was blocked (fetch not approved). Store listings surfaced in search but I did not open them. Nothing about their first run is claimed here. USER_RESEARCH.md S32 holds the Qeepsake "text prompts feel like homework" finding used in PARENT_STUDY_PLAN | [UNVERIFIED] for first run |
| Notion | Not researched. No claim | [UNVERIFIED] |
| Instagram Stories conventions | Help Center page 1212825798758222 has only the description "you can skip forward, backward or pause"; the page text names no gesture. A Quartz piece describes pausing by placing a finger on the screen and releasing. Progress segments at the top, left and right tap zones, and swipe-down to dismiss are widely known but I did not read a source for them | pause: [read, secondary]; tap zones, progress bar: [UNVERIFIED] |

Honest reading of the benchmark: the pattern the founder describes (stories, skip, then login or sign up) is a social-app convention. Of the journalling apps I could check, none is documented here as opening with a story reel. Apple Journal starts with a text entry; Day One and Duolingo (repo record) put a sign-in or an action before or around the pitch. That does not make the idea wrong. It means we are choosing it on craft grounds, not on precedent in this category.

Also relevant, read: Apple App Review 4.8 requires an equivalent login service with private email if a third-party login (Google Sign-In named) sets up the primary account; it exempts apps that use only their own sign-in. 5.1.1(v): "If your app doesn't include significant account-based features, let people use it without a login", and account creation requires in-app deletion [read]. The repo already carries the Sign in with Apple entitlement and Google client id handling in apps/mobile/app.config.ts [repo]. Whether our reason for required sign-in counts as "significant account-based features" is for the CCO and counsel. I flag it, I do not rule on it. The guideline page was read from a cached copy; recheck the live text before submission.

## 2. Story-style conventions that matter for a tired, one-handed parent

Conventions to copy, with their support:
- Progress segments, one per frame: [UNVERIFIED] convention; useful because it says "this is short". [H] A visible total ("four frames") reduces the fear of an endless tour.
- Tap right for next, left for back: [UNVERIFIED] as Instagram behaviour. For us, a large right-hand zone suits a thumb-held phone; but the screen's bottom third is also where Continue and Skip sit. Zones must not overlap controls.
- Hold to pause: pause by finger-down is described by Quartz [read, secondary]. A parent holding a baby may hold by accident, so a held frame must resume cleanly on release.
- Skip: Apple asks for optional and not repeated [read]. Skip must be present from frame one, large (44 pt minimum is Apple's usual target size, [UNVERIFIED] this session), and must never lose the person's place in sign-in.
- Auto-advance: Apple's Reduced Motion criteria say "consider stopping the motion based on the user's setting, or providing a control to allow the user to stop the motion" for "auto-advancing carousel screens or any other ongoing motion" [read]. WCAG 2.2.2 (Level A) asks for a way to pause, stop or hide moving content that starts automatically, lasts more than five seconds and is presented in parallel with other content [read]. Whether a full-screen story is "in parallel with other content" is an interpretation; treat it as applying (cheap to satisfy) [H]. VoiceOver users also need manual advance, since auto-advance fights a screen reader.

## 3. What the evidence says about completion and skip rates

- NN/g, "Mobile tutorials" (Kendrick, 8 Mar 2020): remote unmoderated between-subjects test, 70 users (35 per group), four iOS apps with deck-of-cards tutorials. Task success 91% (viewed) vs 94% (skipped), not significant (p=0.443). Perceived ease on a 1 to 7 question 4.92 vs 5.49 (p=0.047), so viewers rated tasks harder. Time not significantly different. The authors note many people skip tutorials on first download [read]. Limits: four apps, instruction tutorials, not value pitch or story frames, not parents.
- NN/g video "Onboarding: Skip it When Possible" (15 Jan 2021): conclusion that instructions people must absorb first "should be avoided as much as possible"; no data on the page [read].
- A vendor blog (dolfy.ai) says a "large share" skip static carousels within 5 to 10 seconds. It names no study and gives no rate [read]. Do not cite it as evidence.
- Completion or skip rates for story-style intros specifically: none found that I can cite. I also did not find any for parents. Treat as: there is none.

What this means: a story intro cannot be justified as a usability aid. Its case is brand and first impression (the website feel), which is a design judgement [H]. The NN/g result warns that it should not teach, and that a long one may make the app feel heavier.

How to measure ours, consistent with the privacy rules (no analytics unless opt-in; first run runs before any consent, so no events are sent, K-01 in onboarding.tsx [repo]):
1. Moderated sessions (section 5): observed skip frame, dwell, and what they say they got.
2. TestFlight parents: App Store Connect aggregates and the same 3-tap end-of-week question used in PARENT_STUDY_PLAN section 6 [repo], asked once: "Did the start feel welcome / neutral / in the way?" with a one-word option.
3. On-device only counter shown in a hidden debug screen for testers (frame reached, skipped yes or no, seconds to account created). No child name, no text, never leaves the phone unless the tester chooses to share a screenshot. Needs mobile agent effort, size [UNVERIFIED].
4. After launch, if analytics opt-in exists by then, only the allowlisted event names the analytics package approves. Do not add events from this doc.
Compare two arms in TestFlight if numbers allow: intro on vs flag off. With a small TestFlight group, differences will not be significant. Say so and use the thresholds as guard rails, not as tests.

## 4. Heuristic review of our current first run

Read: apps/mobile/src/app/onboarding.tsx (599 lines), components/onboarding/welcome-lockup.logic.ts, promise-sample.logic.ts, components/app-lock/lock-offer.tsx, strings in packages/content/src/strings.en.ts and lib/app-lock/copy.ts [repo]. I did not run the app (no builds in this phase), so layout and motion findings come from code and comments only.

Criteria: Apple's onboarding guidance [read], plus our own rules (CLAUDE.md, one hand, night use).

| # | Finding | Evidence | Severity |
|---|---|---|---|
| H1 | No account step exists in this file. Build 12 requires sign-in before the book opens. Today sign-in is "I already have a book" (sheet, trigger sign_in) and "I was invited", both hidden with server features off. The new path needs a clear first fork: create account vs sign in | onboarding.tsx header comment and welcome step [repo] | A, blocking |
| H2 | The welcome carries four text items (hero, body, free line, doors) under a large lockup. The free line ("Your first two letters are free. After that, Plus keeps the book growing...") is a money statement on frame one. Apple: let people experience the app before purchase prompts [read]. It is information, not a prompt, so this is judgement | strings.en.ts welcome.freeLine [repo] | B, [H] move to after the book is open or into the intro's last frame; needs CBO and counsel (founder decision F5 says "said once at setup") |
| H3 | Promise step is the strongest piece: shows a real small fix using the real engine, with Tap to put it back. It teaches by doing, which is what Apple recommends [read]. Keep. If a story intro is added, it should not repeat this; hand off to it | promise-sample.logic.ts [repo] | keep |
| H4 | Promise lines: "The recording is kept on this phone" was justified because backup cannot yet be on in first run; with required sign-in and servers on, brief says "stays on your phone" lines were found untrue (#768, #769). Re-verify this exact line and "Private by default. You choose what goes in the book." against the Build 12 binary. COUNSEL-READ | strings.en.ts promise.recordingBody, privateNote [repo]; brief | A, blocking until checked |
| H5 | Length: welcome, promise, child, signsAs, finish is 5 screens before the book, 3 of them requiring input (name, date, signature). Adding a 4 to 5 frame intro and an account step brings the first-minute count near 10 taps-and-screens before the first letter. NN/g shows pre-task teaching does not raise success [read]. Hypothesis: for a tired parent the cost is felt as delay. [H] | onboarding.tsx ORDER [repo]; NN/g | B, test in sessions |
| H6 | Finish screen stacks the heading, the speech-download consent card and the lock offer, with one pinned Continue. Three asks on a single screen at the moment of delight. Apple prefers permission requests at point of use [read]; the lock offer itself follows that (device read first, Face ID asked on tap). The speech model download is a large file ask by design (D-087) | onboarding.tsx finish step; lock-offer.tsx [repo] | B, [H] order and spacing; split the lock offer to after the first saved letter if sessions show overload |
| H7 | App lock is offered once, equal-weight buttons, off until turned on, hidden when no passcode, and says in words when Face ID is off for the app. Matches Apple Journal's lock-as-row approach in spirit. Gap for the new journey: "next time you come in, Face ID works" has to line up with the sign-in session. Open question: when the lock is off, does returning mean passcode-free open? That is for the journey lead and engineering, not decided here | lock-offer.tsx, copy.ts [repo] | A |
| H8 | Good for one-handed use: Continue is full width at the bottom; Back is top-left (a reach). The reason line sits above Continue in words, and a tap on the waiting Continue moves focus to the empty field. Keyboard avoids via KeyboardAvoidingView | onboarding.tsx controls [repo] | keep; check Back reach in sessions |
| H9 | Motion: staggered arrival on the welcome (120, 150, 180 ms), Reduce Motion form is one fade, step hand-off uses exitMs. Controls never animate (MOTION principle 2). Apple's Reduced Motion criteria ask for a non-moving substitute rather than none [read]. Already aligned; the intro must follow the same tokens | onboarding.tsx enterAt, useMotion [repo]; Apple Reduced Motion page [read] | keep |
| H10 | Accessibility: VoiceOver focus moves to each heading; large-text layout moves the cover under the heading. The intro will need the same plus manual advance [H] | onboarding.tsx header [repo] | A for intro |
| H11 | Datefield defaults to nothing chosen (no "0 days" trap) and "Born today" chip. Good for tired parents | onboarding.tsx [repo] | keep |

## 5. Research plan for new parents (extends PARENT_STUDY_PLAN.md)

Extends docs/design/notifications/PARENT_STUDY_PLAN.md (path in this repo; the brief calls it docs/research/studies/PARENT_STUDY_PLAN.md, which does not exist [repo]). I do not repeat its hard-season care protocol (section 1), its consent and data handling (section 4) or its notification questions. Apply them as written; this plan adds only what is new. The user-research skill (.claude/skills/user-research) sets method, consent and where outputs go [repo].

Decision this study changes: ship the story intro (tier B) or not; frame count and length; where the Skip sits; the order of the sign-in fork; where the lock offer lives. If none of those would change, do not run it.

Method: moderated usability test with think-aloud, 6 sessions, 25 minutes, audio only, no recording by default, notes by participant code. The skill says about 5 per round then iterate (Nielsen 2000, quoted there) [repo]; 6 allows 3 each of two prototype variants. Not a statistical test.

Participants (adults 18+, six, directional):
- 3 with a child 0 to 12 months, 1 expecting, 2 with a child 12 to 24 months (at least 2 second-time parents).
- At least 3 who say they usually skip intros. Ask the question without defining it.
- At most 2 from the founder's close circle (bias: they will be kind). The founder is a new parent and the product owner; use a fixed script, and a second runner for at least 2 sessions if possible.
- Incentive and recruiting channels are founder decisions.

Conditions (this is the part the usual test misses): ask each to run the tasks on their own iPhone in the way they really use it, seated, in low light, and one-handed. Remote runs: the participant holds the phone in one hand with the other hand free "as if holding something"; no child on camera, no video at all. Run two sessions in the evening (after 20:30, as in the study plan, which is when parents say they are free [H1 in that plan, unproven]).

Prototype: clickable Figma or the Build 12 TestFlight if ready, no real data. Two variants of the opening: A) 4 frames with Skip, then account fork; B) account fork directly after the welcome (no intro). Counterbalance by participant. Child name: a stand-in the participant types on their own device, or the fictional family "Asha"; we never ask for or record the real name.

Tasks and success bars (written before data; guard rails for N=6):
| Task | What we watch | Bar |
|---|---|---|
| T1 Open the app for the first time, "do whatever you would do" | Do they skip, tap through, or wait? When do they find Skip? Do they say what the app is for? | At least 5 of 6 find Skip without help within 10 seconds of wanting it; at least 4 of 6 can say in their own words what it keeps, with no prompting |
| T2 Hold the phone with one hand and get to a created account | Thumb reach to Skip, Continue, Apple sign-in; errors; time | At least 5 of 6 finish with no help; no one needs the other hand for a primary control (observed or said) |
| T3 Pause a frame, go back one, go forward | Do hold, left tap and right tap work as expected? Accidental holds? | At least 5 of 6 succeed unprompted by the third try; no one is stuck in a frame |
| T4 Come back the next day (card prompt: "it is the next day, you open it again") | Do they expect Face ID? Do they understand why it asks (or does not)? | At least 5 of 6 reach the book without confusion; any "why am I signing in again" is logged and goes to the journey lead |
| T5 Lock offer: "Here you are offered a lock. What do you do?" | Understanding of Not now vs Turn on; sense of pressure | At least 5 of 6 describe the choice correctly; none says it felt pushy |
| T6 Reflection, three questions: "How did the start feel?" (welcome / neutral / in the way); "What did you expect it to be?"; "What would make you close it?" | Mood, expectation | No more than 1 of 6 says "in the way" for variant A |

Stop rules: any 2 of 6 say variant A is "in the way" and prefer B: recommend no intro in Build 12. Any participant who cannot find Skip: fix before any wider test. Reduce Motion: one session (or a second pass) with Reduce Motion on, checked by the participant or by me from a screen share of settings only; bar is that frames still read and manual advance works.

Privacy and consent (summary; the full text is in the study plan): plain consent read aloud and a one-page form kept outside the repo; audio only, recording off unless the participant opts in per session; participant codes P01 to P06; no child name, date of birth or photo collected; no analytics SDK; findings in aggregate counts; hard-season participants get the standard invitation line and skip cards; if someone shows distress, stop the task, be kind, give support information the founder has verified beforehand [UNVERIFIED numbers]; delete raw notes by the date stated on the form. Nothing here is sent to any service.

Outputs: docs/research/studies/2026-11-first-run/PLAN.md, GUIDE.md, FINDINGS.md when run (skill, section 1). I have not created those files. Findings lead with the decision and answer in three lines. Timeline: 3 sessions a day at most, so 2 days after the founder approves recruiting; synthesis the day after. Whether that fits Wed 11 Nov: unmeasured and unlikely; the plan supports Build 12.1, not the Build 12 word. The fallback rule (on-device binary ships, account-first becomes 1.0.1) should not wait for it.

## 6. Design implications, ranked

Each is tied to evidence or marked [H]. For the journey lead (structure, states) and the motion designer (timing, easing, storyboard).

1. Make the account fork the first thing a returning user can act on, and make creating an account feel like opening the book, not a form [H]. Evidence: the current welcome already has "I already have a book" as a door [repo]; Duolingo-style "value first, account second" is only recorded in the repo benchmark [repo, not re-verified]. Required sign-in conflicts with the usual advice only if the account-based features are not significant (5.1.1(v)) [read]: CCO to confirm.
2. Skip is visible and large from frame one, never repeated after use, with a place to see the intro again (Settings or Help) [read: Apple HIG]. For journey lead: where "view again" lives. Motion: Skip never animates in late; it is present before any frame content.
3. Keep the intro to four frames or fewer, about 15 seconds when untouched; teach nothing [H], supported by NN/g (tutorials did not raise success, raised perceived difficulty) [read]. Do not repeat the promise-sample fix; end the intro on the promise, then the promise screen shows it [H].
4. Ship manual advance and pause with the same weight as autoplay: tap to advance, hold to pause, a visible pause control for those who cannot hold. Autoplay off under Reduce Motion, with frames becoming a manual dissolve (not none) [read: Apple Reduced Motion; WCAG 2.2.2]. Motion designer owns timing; journey lead owns the control states. VoiceOver: manual advance by default.
5. Place Skip, Continue and sign-in buttons in the lower third and keep tap zones from overlapping them [H]. Test Back's top-left reach. Evidence base is the code layout [repo] plus sessions.
6. Do not put a price line on the first frame. Move the free-line to a later point or the last intro frame, subject to CBO and counsel [H; Apple: experience before purchase prompts, read].
7. Defer the lock offer to a calm moment. If sessions show the finish screen overloaded, move it after the first saved letter [H, H6]. Whichever, Face ID is asked only when the person taps Turn on [repo].
8. One truth rule for every frame: no line may say or imply the words stay only on the phone unless true in the Build 12 binary. Check the intro frames, promise screen and sign-in screen text with COUNSEL-READ (not cleared) [brief, repo comment].
9. Motion style: lean on tokens already used (enterAt stagger, exitMs, swapMs, Lamp persistKey "firstRun") so the intro, welcome and form read as one lit room [repo]. Haptics: only for choices, never per frame [repo MOTION 6].
10. Night use [H]: the first frames must be legible in dark mode and not flash white on launch. Assumption: the dark asset exists (lockupAsset(scheme) resolves dark) [repo]; check intro frames too.
11. Measure with the on-device debug counter and the 3-tap end-of-week question, not analytics [section 3]. Do not state a target skip rate; there is no benchmark.

## 7. Sources opened this session

Opened and read (fetched text):
- NN/g, Mobile tutorials (Kendrick, 8 Mar 2020): https://www.nngroup.com/articles/mobile-tutorials/
- NN/g, Onboarding: Skip it When Possible (video page, 15 Jan 2021): https://www.nngroup.com/videos/onboarding-skip-it-when-possible/
- Apple HIG, Onboarding: https://developer.apple.com/design/human-interface-guidelines/onboarding.md
- Apple App Store Connect Help, Reduced Motion evaluation criteria: https://developer.apple.com/help/app-store-connect/manage-app-accessibility/reduced-motion-evaluation-criteria
- Apple App Review Guidelines (4.8, 5.1.1(v), 5.1.2(i), 3.2.2(x); cached copy, truncated after 5.1.4): https://developer.apple.com/app-store/review/guidelines/
- W3C, Understanding SC 2.2.2 Pause, Stop, Hide (WCAG 2.1 Understanding page): https://www.w3.org/WAI/WCAG21/Understanding/pause-stop-hide
- Apple newsroom, Journal launch (Dec 2023): https://apple.com/au/newsroom/2023/12/apple-launches-journal-app-a-new-app-for-reflecting-on-everyday-moments
- Instagram Help Center page 1212825798758222 (meta description only): https://help.instagram.com/1212825798758222
- Quartz, pausing Instagram Stories (date not on the page text I received): https://qz.com/quartzy/1369842/yes-you-can-pause-instagram-stories
- dolfy.ai blog on skip buttons (read only to check for a source; none): https://www.dolfy.ai/blog/onboarding-skip-button-problem-first-run-tutorials-ignored

Blocked, not read: Apple HIG Managing accounts (fetch not allowed by provenance), Qeepsake help article (not approved), WCAG 2.2 Understanding page (provenance; the 2.1 page was read instead, same criterion). Search results seen but not opened: Day One, Notion, Tinybeans, Lifecake, Appcues-type vendor pages, Intercom community post.

## 8. UNVERIFIED list
- Instagram tap zones, progress bars, swipe-down dismissal.
- Any Day One, Duolingo, Apple Journal first-run flow as it ships today (repo benchmark only, dated 2025 to Oct 2026).
- Any baby-book app's first run; Notion's.
- 44 pt as a minimum touch target (Apple figure, not read this session).
- Whether a full-screen story counts as "in parallel with other content" under WCAG 2.2.2.
- Whether required sign-in satisfies 5.1.1(v) "significant account-based features" for Build 12.
- Support-line numbers for the session close (founder to verify).
- Effort for the on-device debug counter.

## 9. Open questions (each with a recommendation)
1. Run the six sessions before the Build 12 word? Recommendation: no, run them on Build 12.1 with the intro behind a flag; the word should not wait for research.
2. Where does the intro live if skipped? Recommendation: Settings, About (journey lead decides).
3. Who confirms 5.1.1(v)? Recommendation: CCO, with counsel, before the Build 12 submission.

## 10. Conflicts with other team docs
None known: I have not yet read the other branches' files (journey, motion, feasibility, words, requirements, test plan). The brief says to compare; I will do so on my next pass. Overlap to watch: PR #764 edits onboarding.tsx; none of my findings plan an edit there.
