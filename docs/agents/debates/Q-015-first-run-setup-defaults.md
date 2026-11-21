# Q-015: First run, setup defaults and permissions (birthday, edits, model download, deep link, screen awake, helplines, coming-soon doors)

Format: DEBATES.md entry. Id note: the brief called this Q-014, but Q-013 is already used twice on other branches (pricing membership, quiet-day notes) and Q-014 by the data-lifecycle debate (`origin/docs/debate-data-lifecycle`). This takes the next free number. Prepared 4 Oct 2026. It prepares the decision; the founder decides. Nothing here is built. Source of findings: the three critiques on `origin/qa/journey-flows` (`docs/release/journey/critiques/*.md`, steps J01-05 to J01-12, J03-07, J05-01, J05-04, J11-03, J16-05, J17-01, J19-01). Code lines are from `origin/develop` at `cfdca3f`.

- **Status:** Escalated to the founder.

## 1. Question

First run and Settings set the facts everything else depends on (the child's age, the speech download, what a phone does on its own). Seven small defaults are wrong or unsafe in v1.0. What is the one UX for each, without reopening a decided item?

## 2. Facts

**Decided, not reopened:** D-056 seven spoken languages, UI English. D-065 lean app under 40 MB, models download on demand (data, not code, so guideline 2.5.2 holds; Apple text read 4 Oct). D-066 server-driven content. #54 (`c1764f9`): v1.0 on-device only, co-parent sharing "coming soon", on purpose. D-055 co-parent only. D-043 one welcome screen. D-061 calm privacy. Brief decision 15 (large downloads wait for Wi-Fi). LEGAL-REQ-011: never record in the background, never auto-start recording. LEGAL-REQ-058: US storefront only, no stored country. CLAUDE.md: raw text immutable, nothing writes a person's words.

**Open:** everything below. Pricing of first-run books is Q-013 (pricing branch), not here.

**Corrections to the critiques, found by reading code:**
- No user-visible first-run string says "every book made in first run is free". It is a code comment (`onboarding.tsx:119`) and a journey step note. The visible text is "Each child gets their own book" (`strings.en.ts` `onboarding.child.addAnotherHelp`). The real conflict with the membership decision is `strings.en.ts:782` and `billing.en.ts:25,27` ("first book is always free"), and the `start_book` gate (`lib/billing/gates.ts:43`). Q-013 owns those; its recommendation (one pool of 2 letters, books free) makes the first-run exemption moot. Rule here: add no price or "free" line to first run until Q-013 is decided.
- The engine is better than the critique says. Large packs (over 5 MB) already wait for Wi-Fi unless allowed, resume by HTTP Range chunks, and keep 1 GB free for recordings (`lib/packs/engine.ts:43-47, 555-561`). Settings, Storage has a mobile-data switch. What is missing is the ask, the size and the consent.
- The 575 MB figure is the full tier. Phones under 4 GB RAM or of unknown RAM get the 190 MB model (`lib/models/tiers.ts:31-34`, `catalog.ts:134,152`). Hindi also falls back to the 574 MB model until ours is hosted (`catalog.ts:199`). Any size shown must come from `planFor(language).bytes`, never a typed number.
- Editing is a UI gap only. `updateChild` exists and sends per-field patches (`lib/store.ts:273-294`); the server lets a parent change name and dates (`children_guard`, `20261002020000_data_governance.sql:64-81`).

## 3. The seven clusters

### 3.1 Birthday and due date

Facts: birthday state starts as `new Date()` (`onboarding.tsx:79`, `add-child-form.tsx:33`), so "Continue" is always on and a 7-month-old becomes "0 days". Prompts use `ageMonths` (`(tabs)/index.tsx:69-77`), so a wrong date puts newborn prompts on a toddler. A due date never becomes a birthday: `child.birthday` stays null, Tonight shows only the date (`(tabs)/index.tsx:92-93`), chapters stay empty (`components/book/chapters.ts:22`).

- **A. Keep today as default, add "Is this right?" when the date is today.** Product: one line. Red team (design): a default that is wrong for almost everyone is still the default, and a newborn's parent is also on "today", so the warning fires on the one case that is right.
- **B. No default. A required choice, with a read-back of the age.** Design: the read-back ("Age today: 7 months and 1 week") is the mistake catcher. Content: no verb, so twins and any grammar work, no gender. Engineering: iOS's compact picker cannot show "unset", so use a row that opens an inline picker in a sheet. Red team (product): one more tap for the newborn case. Answer: one tap, and it is the date the whole book hangs on.
- **C. Ask age ("how many weeks or months?") and compute a date.** Red team (all): invents a birthday the family never said; birthday notes and chapters would quietly be wrong by weeks. Rejected.

**Recommendation: B**, plus an arrival card for due dates. The card is deliberately neutral: never "arrived", "born" or "congratulations", because a due date can end without a birth. It shows 7 days after the due date, "Not now" waits 14 days, and after the second "Not now" it stops for good (Settings keeps the row). Saving moves the due date into the birthday and clears the due date (a due date is L4 consumer health data, `data_governance.sql:1077`; keep less). Letters dated before the birthday sit in "Before You" by themselves (`chapters.ts:22`).

Strings (`packages/content/src/strings.en.ts`, `onboarding.child`):
- `dateRowEmpty` "Choose a date"; `sheetConfirm` "Use this date"; sheet titles reuse "Birthday" and "Due date".
- `readbackAge` "Age today: {age}."; `readbackToday` "Born today."; `readbackDue` "Due {date}."
- `birthdayHelp` becomes "We sort letters by {child}'s month of age. You can change this later in Settings."
- Arrival card (new `birthdayCard`): title "Add {child}'s birthday"; body "When you are ready, add it and the book sorts letters by month. Letters you wrote before stay in Before You."; buttons "Add birthday" and "Not now".
- Continue stays off until a date is chosen; accessibility hint "Choose a date to continue".

### 3.2 Editing, and what is immutable

Facts: name, date and signature rows are plain `ListRow`s with no `onPress` (`settings/children/[id].tsx:51-53`). A first-run typo or wrong date cannot be fixed. With one child there is no way to remove the book either (Hide shows only for two or more, `[id].tsx:81-83`); whole-book deletion belongs to Q-014 (data lifecycle). Chapters and ages are derived at render from the birthday (`chapters.ts`, `export/build.logic.ts:161`), so changing it stores no stale value. `authorSignsAs` is frozen on each letter at save (`lib/README.md:45`, `store.ts:368`).

- **A. Stay read-only; fix by support email.** Red team: a typo in a child's name in a keepsake, with no fix, is the worst small bug in the product. Rejected.
- **B. Editable name, date and signature in Settings (recommended).** Immutable forever: child id, created time, each letter's own date and words (`raw_transcript`), each letter's saved signature. Everything else about the child is editable by a parent. Name edits change headers and the "Asha is..." line everywhere, never any letter's words (constitution). Signature edits apply to letters from then on; old letters keep theirs.
- **C. B plus a "check your answers" step at the end of first run.** Red team (D-043): adds a screen to the one we cut to one. The read-back in 3.1 does the same job inline. Rejected for v1.0.

Sync later (v1.1, `children_guard`): each edit sends only its changed field (already how `updateChild` works), so two parents editing different fields never overwrite each other; same field is last write wins, acceptable for a name. Contributors cannot edit (`SCPAR`), so the v1.1 UI must hide edit rows for non-parents. A birthday change regroups the book on both phones, which is correct.

Strings (`strings.en.ts` `children.settings`): name sheet help "Letters you already wrote are not changed."; date sheet footer "Letters dated before a birthday sit in Before You."; signature help "New letters are signed this way. Letters already in the book keep the name they were signed with."; button "Save". Rows get a chevron.

### 3.3 Speech model download: consent, Wi-Fi, resume

Facts: choosing a language in the picker calls `setPrimary` then `setAuthorSpeechLanguage` (`spoken-language.ts:55-58`), whose listener starts the download (`transcription-queue/index.ts:153`). Not choosing does not avoid it: the first Review calls `requestSpeechFor` (`index.ts:197`). No screen says the size, that it needs Wi-Fi, or lets the person say no. Review's Wi-Fi wait card has only "Type it instead" (`review.tsx:769-777`); the mobile-data once-option exists but only in Settings (`language.tsx:70`, `storage.tsx:101`). Whether chunks continue while the app is in the background is **unverified** (not found in `expo-adapter.ts`).

- **A. Status quo plus a size line in the picker.** Red team (legal/privacy, design): still starts without a decision; a size next to a language name is not consent.
- **B. Disclosed auto-start on Wi-Fi, with "Not now".** Product: first letter has words soonest. Red team: this is today's silent start with a caption.
- **C. Explicit tap on the finish step: "Download on Wi-Fi" or "Not now" (recommended).** Nothing downloads until the person taps. "Not now" keeps the voice; the first Review then shows an ask card with the same button instead of auto-starting.
- **D. Ask at the first Speak.** Red team (product): the first letter waits for words, at the most emotional moment. Rejected.
- **E. Bundle a model.** Breaks D-065 (40 MB). Rejected.

**Recommendation: C.** Rules: (1) a device setting `speech.download` is `yes`, `later` or unset; only `yes` auto-starts downloads (picker choice, first Review, a new language). (2) Picking a language in the picker only stores it. (3) Existing phones migrate: a language chosen or a model installed means `yes`. (4) The ask shows size from the plan for this phone's tier, and if free space is below size plus the engine's 1 GB reserve it shows the space line and no primary button. (5) Review's Wi-Fi wait card gets "Use mobile data, {size}" (one time, `allowCellularOnce`). Wi-Fi-only default and resume are untouched.

Strings (`speech.en.ts`, `words.en.ts`): finish card title "Get your words ready"; body "Your words are written down on this phone, so they stay on it. This needs a one-time download of {size}."; note "It waits for Wi-Fi, and carries on where it left off if it is interrupted."; buttons "Download on Wi-Fi" and "Not now"; footnote "You can do this later in Settings, Storage. Your voice is always kept."; low space "This phone needs {size} of free space first."; Review ask `pack.askTitle` "Get your {name} words ready", `askBody` "Your voice is kept. To write down the words, this phone needs a one-time download of {size}.", `askButton` "Download on Wi-Fi"; wait card `mobileDataButton` "Use mobile data, {size}".

### 3.4 Deep link policy

Facts: `redirectSystemPath` returns the incoming path unchanged for anything it does not recognise (`family/entry.logic.ts:71-73`, `auth/links.logic.ts:52-68` classify to `other`). So `scribe://listen`, or any `https://earlyletters.com/...`, opens that screen. `listen.tsx` starts recording on mount (`:117-123`). That breaks LEGAL-REQ-011 ("never auto-starts recording") and the repo's own warning that any app can claim a custom scheme (`links.logic.ts` header, TDD 04 3.1.6). The same pass-through also reaches `/review`, `/settings/delete-account` and developer or 404 screens (critique J19-01). Nothing in the repo produces a `scribe://listen` link.

- **A. Keep.** Red team (legal, security): a web page or another app can start a recording in a locked-in moment. Rejected.
- **B. Allowlist: only `/`, `/invite`, and the two auth links route; everything else goes to `/` (recommended).**
- **C. B now, plus a future "capture link" for Shortcuts or Action Button that opens Listening in a ready state with a Start button.** Not built now; no producer exists; recording would still need the tap.

**Recommendation: B.** If the founder wants an Action Button or widget in v1.1, C is the safe shape (tap to start, never on open). No new strings.

### 3.5 Screen awake and screen lock

Facts: LEGAL-REQ-011 and `listen.tsx:128-132` end and keep the take when the app leaves the foreground, and `enableBackgroundRecording` is off (`app.config.ts:236-241`). Auto-lock is a background event, so a 2-minute letter ends at the lock timer and Review opens (nothing is lost, the letter is just cut). No keep-awake on Listening or Read together (`read-together.tsx`). `expo-keep-awake` is already a dependency and used once (`settings/export.tsx:1,33,54`).

- **A. Leave it.** Red team: the most common first-night failure, silent, with the parent looking at a lock screen.
- **B. Keep awake only while recording (not paused) and only while Read together audio plays (recommended).** Released on pause, finish, leave, background. Not for downloads. Red team (privacy): auto-lock is a privacy control. Answer: Listening shows no text; Read together shows the open book only while a person is playing it; never idle.
- **C. Turn on iOS background audio.** Needs counsel review per LEGAL-REQ-011 and breaks D-065's lean, calm review story. Rejected.

**Recommendation: B**, plus one honest line on Review when the take ended by leaving the app: "The recording stopped when you left the app. Everything up to then is kept." (pass `stopped=background` from `endTake`). Primary source for the library's idle-timer behaviour was not re-read here; test on a device.

### 3.6 Helplines and non-US users

Facts: Settings, "If you are struggling" lists three US lines and 911 (`strings.en.ts:982-1006`; D-034, D-059; counsel Q25; founder task FT-36 re-verify by 23 Oct). The app ships only in the US storefront (LEGAL-REQ-058, PRD line 25), and no code may store a country. So the real gap in v1.0 is language and honesty about scope, not geography. A duplicate list with different content sits unused in `packages/core/src/safety.ts:54-58`.

Sources. Primary pages 988lifeline.org, postpartum.net, findahelpline.com and iasp.info were **blocked in this sandbox: unverified**. Search snippets (secondary, 4 Oct): 988 offers Spanish (press 2, text AYUDA) and interpreters in "more than 240 additional languages" through Language Line Solutions, by saying the language on a call (snippet text of 988lifeline.org FAQ pages); PSI says its Warmline serves callers worldwide for local referrals (snippet). No source was opened for any non-US number.

- **A. Keep the US list, say plainly it is for the United States, add the 988 language line, re-verify in primary sources before submit (recommended).**
- **B. One link to an international directory.** Red team: a crisis moment becomes a browser search, a third party we have not read terms for (unverified), and a network call from an on-device app.
- **C. Pick lines by device region now.** Red team (legal): unverified numbers in a crisis row; LEGAL-REQ-058 forbids storing country, and reading it at render needs counsel.

**Recommendation: A.** When any second storefront opens, the launch checklist needs a verified region list (candidates, both unverified: a directory such as findahelpline.com or IASP; or national lines checked one by one), counsel Q25 extended, and a decision on device region versus storefront. Bundled text stays the source; remote refresh through D-066 is a v1.1 idea, not needed now.

Strings (`strings.en.ts` `struggling`): body adds "They are for people in the United States."; 988 `how` becomes "Call or text 988, any time. Press 2 for Spanish, or say your language to reach an interpreter." (ship only after a primary-source check; otherwise keep the old line). Delete `US_RESOURCES` from core or test it equals the content list.

### 3.7 The coming-soon doors

Inventory: (1) welcome "I was invited" (`onboarding.tsx:346`); (2) Family tab (`(tabs)/_layout.tsx:68`, `family.tsx`); (3) Settings row "Write this book together, Coming soon" (`[id].tsx:67-73`); (4) a permanently disabled "Family can read" switch (`[id].tsx:78`, `strings.en.ts:799,899`); (5) "Tell me when it's here" then "We'll let you know here when it's ready" (`familyCopy.soon.notify`); nothing reads that flag afterwards (grep, only the sheet itself). Also an invite link opens the sheet (`entry.logic.ts:66-68`).

- **A. Keep all five (#54 as built).** Product: honest teaser, tests demand. Red team: (1) and (4) cannot lead anywhere for anyone in v1.0 (no invite can exist without a server); (5) promises a notice no code can send; Apple 2.1(a) says "placeholder text, empty websites, and other temporary content should be scrubbed" (read 4 Oct, summarized tool), which does not name "coming soon" but a reviewer may; quality critique J17-01 rates it a risk.
- **B. Soften: keep (2), (3) and the invite-link landing; hide (1) and (4); make (5) true (recommended).** Founder's #54 intent (a visible co-parent teaser) stays; only doors with no possible user go. Hide (1) and (4) behind `capabilities.coParent` so v1.1 brings them back with no new work.
- **C. Hide everything.** Safest for review, loses the only way to learn demand; reverses a deliberate founder choice. Not recommended without the founder.

**Recommendation: B.** Make (5) honest: `notify.done` becomes "Noted on this phone. When the update arrives, you will see it here." and a v1.1 item shows one card on Tonight the first time a build with co-parent sharing opens on a phone that asked (otherwise remove the button). Add content-free events `coparent_soon_opened` (entry) and `coparent_soon_notify` so the teaser measures something. App Review notes say co-parent sharing is not in this version.

## 4. Recommendation in one view, cost, risks, what would change it

| Cluster | Recommended UX |
|---|---|
| 3.1 | No default date; required; age read-back; neutral due-date card, shown twice at most |
| 3.2 | Name, date, signature editable; letters, their dates and saved signatures immutable |
| 3.3 | One explicit "Download on Wi-Fi" or "Not now" at the end of first run; size from the tier plan |
| 3.4 | Route allowlist; unknown links go home; nothing starts a recording |
| 3.5 | Awake only while recording and while Read together plays |
| 3.6 | US list with scope line; primary-source check before adding the 988 language line |
| 3.7 | Hide two dead doors; keep tab, Settings row, link landing; make the notify line true |

Cost (estimate, engineer days): 3.1 1.5; 3.2 1.5; 3.3 3; 3.4 0.5; 3.5 0.5; 3.6 0.5 plus founder FT-36; 3.7 1. About 8.5 days, no new dependency, no migration, no server.

Risks: 3.3 raises the share of people with no words on night one (mitigated: voice kept, ask card, one tap); 3.1 adds a tap for newborns; 3.7 hides a path counsel or the founder may want for beta testers.

Would change my mind: a device test showing downloads do not survive a lock (then 3.3 needs "keep the app open" copy and 3.5 widens); Apple rejecting the Family tab (then C in 3.7); the founder wanting Action Button capture (3.4 option C); a primary source contradicting the 988 claims (drop the line).

## 5. Change list for a build agent (start when the founder says yes)

1. **Dates.** `packages/core/src/age.ts`: add pure `readbackAge(birthISO, todayISO)` (uses `ageOn`/`ageLabel`; "Born today." at 0 days). `apps/mobile/src/components/child/child-date-field.tsx` (new, row plus sheet with inline picker, no initial choice) used by `onboarding.tsx:79,238-270`, `add-child-form.tsx:33`, and the Settings edit. `onboarding.tsx` `disabled` also true while no date is chosen. New `lib/child/birthday-card.logic.ts` `planBirthdayCard({ birthday, dueDate, today, snoozes, lastSnoozedOn })`; card on `(tabs)/index.tsx`; settings keys `birthdayCard.snoozes.<childId>`. Saving: `updateChild(id, { birthday, dueDate: null })`.
2. **Editing.** `settings/children/[id].tsx:51-53` rows get `onPress` and open sheets (name 60 chars as `onboarding.tsx:94`, signature 30). Analytics `child_setting_changed` keys `name|birthday|signs_as` (no values).
3. **Download consent.** `lib/models/author-language.ts`: split store-only `setAuthorSpeechLanguage` from `startSpeechDownload`; new `lib/models/speech-consent.ts` (`yes|later`, migration rule). `spoken-language.ts:58` stops starting downloads; `transcription-queue/index.ts:153,197` start only on `yes`. `onboarding.tsx` finish step card and `chooseLanguage` (`:101-108`); `review.tsx:754-777` ask card and mobile-data button; `language.en.ts` absent status keeps its size.
4. **Links.** `family/entry.logic.ts:71-73` default returns `/`; unit table in `test/auth-links.test.ts` or `coparent-soon.test.ts` neighbours.
5. **Awake.** `lib/use-keep-awake-while.ts` wrapping `activateKeepAwakeAsync`/`deactivateKeepAwake` with a tag; used in `listen.tsx` (phase recording) and the Read together player; `listen.tsx:130` passes `stopped=background`; Review note.
6. **Helplines.** `strings.en.ts:982-1006`; remove or test `core/safety.ts:54-58`; add the region gate to the launch checklist and extend COUNSEL_PACKET Q25 and FT-36 to "primary sources, including 988 languages".
7. **Coming soon.** `onboarding.tsx:346` and `[id].tsx:77-79` rendered only when `capabilities.coParent`; update `test/coparent-soon.test.ts` (`onboarding_join` shows no button when off, link and tab unchanged); `familyCopy.soon.notify.done`; analytics catalogue two events; App Review notes.
8. **Docs.** DECISIONS rows on the founder's answers; DEBATES entry moves to Converged; `docs/qa/DEVICE_TEST_PLAN.md` rows below; PRD text for first run.

**Tests.** Content `rules.test.ts` scans all new strings (fix copy, not tests). New: `readbackAge` table (today, 13 days, 7 months 1 week, leap-day birthday); `planBirthdayCard` table (before due date, +7, snooze, two snoozes stop, birthday set); `updateChild` leaves letters, their dates and `authorSignsAs` unchanged and sends only the changed field; speech consent (picker never downloads, `later` never auto-starts, migration to `yes`, mobile-data once path, low space blocks, size follows tier); deep link allowlist (`scribe://listen`, `/review?draftId=x`, `/settings/delete-account`, unknown path all give `/`; invite and auth unchanged); keep-awake hook (on while recording, off on pause, finish, unmount, background); coming-soon test updated. Device pass: mic denied then Settings then return (card should recheck on foreground; whether iOS restarts the app on a permission change is **unverified**), lock mid-letter, airplane mode mid-download then resume, full disk, Hindi and a 3 GB phone showing the 190 MB size.

## 6. Questions only the founder can answer

1. Birthday: required at first run, no default and no skip (A, recommended), or keep today's default with a warning line (B)?
2. May a parent edit the child's name, date and signature in Settings, with only letters and their dates and saved signatures immutable (A, recommended), or stay read-only (B)?
3. Model download: an explicit "Download on Wi-Fi" or "Not now" at the end of first run (A, recommended), or a disclosed auto-start on Wi-Fi with "Not now" (B)?
4. Hide "I was invited" and the disabled "Family can read" switch in v1.0, keeping the Family tab, the Settings row and the link landing (A, recommended), or keep every door as #54 built it (B)?
5. "Tell me when it's here": keep it with the true line and a v1.1 one-time card (A, recommended), or remove it (B)?
6. Helplines: keep the US list with a United States scope line and add the 988 language line only after a primary-source check (A, recommended), or hold the row unchanged until counsel Q25 answers (B)?
7. Due-date card: neutral wording, first shown 7 days after the due date, stops after two "Not now" (yes or no)?
8. Deep links: allowlist now, with an Action Button capture link only as a v1.1 tap-to-start (A, recommended), or approve a capture link for v1.0 (B)?

- **Affected:** mobile, content, design, legal (Q25, review notes), analytics (two events), QA, founder (items above), pricing owner (Q-013 for first-run books).
- **Replies:** none yet.
- **Status:** Escalated to the founder.
