# Moments tab: launch copy drafts (HELD)

Owner: `marketing`. Status: DRAFT, UNPUBLISHED, HELD. Date: 21 Nov 2026. Docs only; nothing here is in `packages/content`, the store, the site or TestFlight.

## 0. Why this is held

Founder-only: what a user is promised. Nothing below is live, and nothing ships until all three hold:

1. The founder approves O-48 (value proposition, first-run promise, store story; spec section 16.1, `docs/product/prd/28-moments-tab.md` lines 877 to 891; row R285; `docs/product/moments-tab/FREEZE-CHECKLIST.md` line 22 and line 208).
2. Counsel answers, in writing, packet Q130 (absolute sentences and policy mechanics, `docs/legal/COUNSEL_PACKET.md` lines 751 to 757) and G2 Q1, packet Q123 (label and consent, lines 705 to 711), which are the questions that decide whether the lines below are accurate in each build. Counsel must confirm that none of these lines is a misleading statement in any build in which it appears (packet line 686). Per spec G2, an agent review or an internal memo does not close these (`docs/product/moments-tab/exec-review/clo.md` lines 16 and 54 to 58).
3. `legal` confirms label, policy and Notes for Review match the build that carries the line (spec G11 (d)). Today the label of record says "Photos or Videos: No ... No photo feature in v1.0" (`docs/legal/app-store-privacy-labels.md` line 54), which a listing line about picking pictures would contradict until it changes (Q123 (a), (d)).

Where "G2 Q8" appears in the task, this file reads it as spec Q8 = packet Q130, and "G2 Q1" as spec Q1 = packet Q123 (packet numbering, lines 658 to 664 and 699).

The app name comes only from `packages/brand/index.ts`. This file uses the placeholder `{app}`; `{child}` is never gendered.

## 1. The two lines (recorded direction, O-48 proposed text)

| Line | Text | Note |
|---|---|---|
| Headline | Pictures start the story. Your voice finishes it. | Spec line 881; packet line 674. |
| Second line | {app} never adds a word to your letter. | Third person, not "we". Same claim as the live store line "It never adds a word" (`packages/content/src/store.en.ts` line 58): it does not widen it to pictures, dates or places, and it is scoped to the letter. The spec's own second line "We never write a word for you." (line 881) is the proposal this replaces. |

Scope check for counsel (Q130 (c)): the second line is about the words in a letter. A card or chip that shows a date or a computed place name is the app's own small note, never in the letter's type (`packages/content/VOICE.md` line 43), but a reader could take "never adds a word" to cover it. If counsel prefers, narrow to "Every word in your letter is one you said or typed." (UNVERIFIED as a claim; same evidence as row C1 below).

## 2. App Store listing additions (HELD)

All lines are true in every build that has the picker door (F1) and no library read (F2), per spec line 891. None uses the tab name, which the spec bars from store text (spec line 891; packet line 684). Limits: promotional text 170, captions 40 (`store.en.ts` header).

### 2.1 Description, new paragraph

Insert after "IT STAYS IN YOUR WORDS", before "YOUR VOICE, KEPT". Heading and body:

> PICTURES START THE STORY
> Pick pictures from a day you want to remember, then say what was happening. Your voice finishes it. Your words stay yours, and {app} never adds a word to your letter.

Proposed from spec line 891 (store story), with the headline from line 881. "{app}" is rendered from `brand.name` in `store.en.ts`, as the existing description does.

### 2.2 Promotional text

Keep the live line unchanged (`store.en.ts` promotionalText). No change proposed. Reason: any promotional line that mentions pictures is a promise about the build, and the F1 build is not approved.

### 2.3 Promotional text, F2 only (HELD harder: F2 and its gates)

Spec line 891, verbatim, live only after the F2-on build is approved and every gate is on record:

> Let the app suggest days from the date, time and place of your pictures, read on this phone, or choose pictures yourself any time.

Not for the first submission. "Place" in this line also waits on G11b (section 5). Without places it would read "from the date and time of your pictures", and that wording is not approved anywhere (UNVERIFIED; new text, needs `content` and counsel).

### 2.4 Keywords

No change. The spec bars "memories", "highlights", "Apple Photos" from store text; keep them out of the keyword field too (rule applied to the field by me, not stated in the spec).

## 3. Website section (HELD)

One-page site, between "How it works" and the privacy section. Copy in the style of `packages/content/src/site.en.ts`. Final words go to `content`.

> Heading: Pictures start the story
> Body: Pick pictures from a day you want to remember, then say what was happening. Your voice finishes it.
> Three short lines under it:
> - Choose the pictures yourself, any time.
> - Say it the way you would tell it to {child}. A minute is plenty.
> - {app} never adds a word to your letter. Every small fix is marked, and you can put any of them back.

Not on the site: anything about what the app reads from the library, because F2 is not approved (section 2.3). No screenshot of the tab name.

## 4. Three screenshot captions (HELD)

Format as the live set (`store.en.ts` screenshots: caption plus subline, caption 40 characters or fewer). Frames are captured from the real app, and cannot be made until the door exists in a build (section 6, row C9). Fictional family Asha only.

| # | Caption (count) | Subline | Frame brief |
|---|---|---|---|
| 1 | Pictures start the story. (25) | Your voice finishes it. | Door sheet with two or three of Asha's pictures chosen, one ask card above. |
| 2 | Pick a day, then say what happened. (35) | A minute is plenty. | The recording screen with the chosen pictures as small chips above the mic. |
| 3 | Your words stay yours. (22) | {app} never adds a word to your letter. | A saved letter with a picture beside it, one marked small fix visible. |

No caption says "memories", "highlights", "daily", "every day", "private" as a headline, or names the tab.

## 5. What we will not say

- Any claim that AI, a model or software writes, improves, polishes or shapes a letter (`CLAUDE.md` constitution; `VOICE.md` line 39). Not "AI-written", not "smart", not "auto".
- Absolutes counsel has not cleared (Q130 (c)): "never leaves the phone", "we hold nothing", "we only see what you pick", "stays on your phone", "no account", "private" as a bare headline, "never ask again". Sentences say what we receive, never where something lives (H-11); every sentence about the picker names its mode (EXH-LEG-3). (Packet lines 684 and 757; `PRIVACY-CONTRADICTIONS.md` row C-11.)
- Places or date-only cards. No place names, no "where it happened", no "date-only cards" as a feature, until G11b clears (place table provenance and licence, packet Q132, `FREEZE-CHECKLIST.md` line 151: default "No places in the first release"). Packet line 730 holds date-only cards as the fallback for the library read, which is itself HELD, so even that is not a public claim yet.
- The tab name in store text; "Apple Photos"; "memories"; "highlights"; "daily"; "every day"; "a better App Review story" (spec line 891).
- "Beta" anywhere in the store listing (`store.en.ts` header, D-060).
- "Exactly as you said it" in the listing (held until counsel clears it, `store.en.ts` header, D-125 item 9).
- Anything about suggestions from pictures, reminders timed from pictures, or reading the library, until F2 and F4 are approved with their gates.
- Counts, streaks, gaps, guilt or loss language; legacy or memorial language; a gendered child.

## 6. Claims table

Status key: VERIFIED means I read the cited line and it supports the claim as worded. UNVERIFIED means no repo source supports it for the shipped build, or I could not check it. "Counsel needed" is yes where a statement about data, the label, absolutes or what a user is promised is involved.

| # | Public claim | Source in the repo | Status | Counsel needed |
|---|---|---|---|---|
| C1 | "{app} never adds a word to your letter" (as a statement about transcription cleanup) | `packages/content/src/store.en.ts` line 58 ("It never adds a word."); `CLAUDE.md` lines 6 to 10 (the machine may remove and repair, never add meaning; every edit goes through `verifyEdits`); `packages/core/src/types.ts` line 5 | VERIFIED for the transcription edit engine. The scope "to your letter" in a build with a picture beside the letter: UNVERIFIED (no picture feature code found, see C9) | Yes (Q130 (c): absolute sentence) |
| C2 | "Every small fix is marked, and you can put any of them back" | `store.en.ts` line 58; `CLAUDE.md` line 10 (every edit is stored and reversible) | VERIFIED (live listing line) | No |
| C3 | "Your words stay yours" | Spec `28-moments-tab.md` line 891; `store.en.ts` line 58 ("It stays in your words" paragraph) | VERIFIED as the live paragraph's meaning; the exact sentence is not live | No (but inherits the Q130 check with C1) |
| C4 | "Pictures start the story. Your voice finishes it." | Spec line 881 (PROPOSED); packet line 674 | UNVERIFIED: proposed text, O-48 is OPEN (`FREEZE-CHECKLIST.md` line 208) | Yes (founder-only promise; counsel must confirm) |
| C5 | "Pick pictures from a day you want to remember, then say what was happening" | Spec line 891 (PROPOSED); true only in a build with the picker door (F1) | UNVERIFIED: no picker or Moments tab code found in `apps/mobile` on develop at `f59e000d`; label says "No photo feature in v1.0" (`app-store-privacy-labels.md` line 54) | Yes (Q123 (a), (d)) |
| C6 | "Choose the pictures yourself, any time" (website) | Spec line 891 promotional text and packet line 674 row "declined" ("You can choose pictures yourself any time") | UNVERIFIED: needs F1 in the shipped build | Yes (Q123) |
| C7 | "A minute is plenty" | `store.en.ts` ("A MINUTE IS PLENTY" section); `VOICE.md` line 28 | VERIFIED (live line) | No |
| C8 | "Your voice finishes it" (the parent's voice completes the letter) | `store.en.ts` ("YOUR VOICE, KEPT": every spoken letter keeps its recording) | VERIFIED for spoken letters. Typed letters have no recording; the line is a headline, not a promise about every letter | No |
| C9 | A caption frame showing pictures with a letter | Needs a build with the door; none exists on develop (`apps/mobile/test/g6-production-flags-off.test.ts` lines 25 and 35 name PHOTO_MOMENTS among flags that "have no code behind them yet") | UNVERIFIED | Yes (label, G2) |
| C10 | "Let the app suggest days from the date, time and place of your pictures, read on this phone" (promotional text, F2 only) | Spec line 891 (PROPOSED); packet line 676 | UNVERIFIED: F2 not approved; "read on this phone" is a statement of where something happens, which Q130 (c) and H-11 treat with care; needs a proving test (`PRIVACY-CONTRADICTIONS.md` C-11, R193) | Yes (Q123, Q125, Q130, Q132) |
| C11 | Anything naming a place | G11b | UNVERIFIED: OPEN, default no places (`FREEZE-CHECKLIST.md` line 151) | Yes (Q132) |
| C12 | Privacy wording anywhere near these lines | The promise is `en.trust.promise`, word for word (D-061; `store.en.ts` header) | Use unchanged; add nothing new | Yes for any new privacy sentence |

## 7. TestFlight tester note (draft, HELD)

Only for a tester build that has the picture door on. A tester build without it carries no note. Q130 (a) asks whether the change needs notice and re-show to testers (UNVERIFIED), so this goes out only after counsel answers. Final words by `content`; sent by the founder, never by an agent. No tester names or family details are kept in the repo (`docs/legal/TESTFLIGHT_TESTERS.md` line 18).

> Thanks for testing {app}.
>
> New in this build: you can pick pictures from a day, then say what was happening. {app} never adds a word to your letter. Your words stay yours.
>
> What we would love to hear: Was it clear what to do first? Did the pictures feel like part of the letter? Was anything confusing?
>
> What to know: feedback you send through TestFlight, with any screenshot, can be seen by people on the team who run this test (see the tester notice you were given). Please do not send pictures of other people's children.
>
> Reply from TestFlight, or write to the feedback address in the invitation.

Checks: no "beta" claim is made in a store surface (this is TestFlight, not the listing); no place, suggestion or library-read language; the feedback sentence follows `docs/legal/TESTFLIGHT_TESTERS.md` rows A2 to A5 (Apple's pages, read there on 16 Oct 2026, not re-read by me).

## 8. Hand-offs

- `content`: adopt or rewrite sections 2 to 4 and 7 after O-48; one key family, no digit or count word (`HARNESS-REPLAN-HYBRID.md` line 101).
- `legal`: claims C1, C4 to C6, C9 to C12 to counsel with Q123 and Q130; label parity before any listing line.
- `product`: O-48 answer; whether the second line is "{app} never adds a word to your letter" or counsel's narrower alternative (section 1).
- Open: whether the "Pick pictures" description paragraph may be in the first submission if the build carries only the door (F1); the packet treats F1 as independent of Q1 to Q4 but not of Q5 to Q7 and Q9, and asks counsel to confirm that reading (packet line 703).
