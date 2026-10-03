# F10 Read together

| | |
|---|---|
| Release | v1.0 gate (word highlight v1.1, F34) |
| Priority and rank | P0, rank 15 (`05-feature-map.md` section 2) |
| Personas | P1, P2, P4, P6 |
| Existing IDs | PRD-REQ-020 Rev (B7, DR-06), K-11, D-037, C-REQ-010 (first Read together), C-REQ-023, C-NFR-004, C-NFR-009, LEGAL-REQ-011, LEGAL-REQ-050, LEGAL-REQ-051, ADR 0009, BL-022, BL-036, BL-145, BL-154, BL-160, BL-216, BL-265 |
| Depends on | F08 (player, listening copy, audio session), F09 (chapters, `LetterText`), F11 (co-parent letters, DR-07), F14 (Plus sheet), F19 (remote config) |
| Status | Draft V2, 3 Oct 2026 |

## 1. Why

- [F] The AAP encourages shared reading from birth through kindergarten and prefers print to digital media (R2-S29). Read together has to be parent-led and sit beside the PDF book (F15), not replace books.
- [S] Hearing the person's voice is the value Remento reviewers name most (11 of 64, R2 section 0 item 5).
- [F] No product R1 opened plays a sequence of a parent's letters to a child as a session; Babble has the closest pattern (big cards, Story Mode in order) (R1 F10; R1-S18).
- [F] Tiny Treasures now pitches a "baby memory book you can hear" (R1-S67), so the moment is contested.
- [A] We found no study of a recorded parent's voice on a child (R2 section 0 item 9). The live-voice study (61 girls aged 7 to 12) does not transfer (R2-S24). Copy never claims a calming, sleep or developmental effect.
- [D] Read together is free for 3 sessions, then Plus (PRD-REQ-020, K-11). Word highlight moved to v1.1 (B7), so the session had to be redefined (DR-06).

## 2. Who

| Persona | Moment | Holding, feeling, short of | What F10 must do |
|---|---|---|---|
| P1 Evening parent | Bedtime, child on the lap, 2 to 5 years old (R2-S29) | Phone in one hand, child in the other arm; dim room; wants it calm | Start in one tap, nothing plays until they press Play, no sheet in the middle |
| P2 Co-parent | Reads the book with the child | Their own recordings, the other parent's letters as text | Say honestly whose voice is where (DR-07) |
| P4 Multilingual family | Letters in Hindi, Spanish, Arabic | Mixed scripts; a parent may not read the other's language | Letters stay as written; the voice carries the language when it is on this phone |
| P6 Future reader | Listening at 3, later alone | A small screen | Large Print, clear voice, nothing to tap by accident |

## 3. What we are solving

**Outcome:** a parent can play a month of letters in order, in each author's voice where that voice is on this phone, with the words on screen, in a calm screen a child can sit with, and the free and Plus boundary is counted exactly as decided.

| Metric | Target | How measured | Consent caveat |
|---|---|---|---|
| Share of monthly active parents who start Read together | Set after cohorts (03 section 4.2) | `read_together_started` | Opt-in only |
| Sessions counted when the rule says they should not | 0 | Unit and E2E-05 | None |
| Sessions finished (`reason = finished`) | Set after cohorts | `read_together_ended` | Opt-in only |
| Plus offers shown during a session | 0 | E2E and static check | None |
| Copy claiming an effect of voice on the child | 0 | Claims registry (LEGAL-REQ-045) and content review | None |

## 4. Scope

**In v1.0**
- Pick a chapter, press Play, letters play oldest first with the text visible in Large Print.
- Each letter in the author's voice when the recording is on this phone (listening copy if present, original one tap away, F08).
- Honest pages for letters with no recording here: typed letters, the other parent's letters (DR-07), voice-only letters still waiting for words.
- Session and counter per DR-06: counted per book on this device, 3 free from remote config, single-letter playback always free.
- Pause, previous, next, replay, speed 0.75x and 1x.
- Interruptions, route changes, lock and background handled; screen kept awake while playing.
- Plus sheet only before a session starts, handed to F14.
- First Read together milestone (C-REQ-010).

**Later**
- Word highlight from ADR 0009 alignment: v1.1 (F34, B7).
- Hearing the other parent's voice: v1.1 shared voice (F31, DR-07).
- Background and lock-screen playback (car, pocket): v1.1 candidate, needs Q2.
- Server session counter: v1.1 (D-037).

**Never**
- Autoplay on open, or any sound before the parent presses Play.
- Text-to-speech or any machine voice reading a letter. The only voice is the author's.
- A sleep timer at v1.0: no evidence that parents need one (none in R1, R2 or UR), and a chapter ends on its own. Revisit only with Study 3 data.
- Claims that recorded voice calms, soothes or helps development (R2 section 0 item 9).
- Child-facing modes or child recording (LEGAL-REQ-059; `readTogether.makeLetterTogether` stays behind `child-input`, PRD-REQ-005).

## 5. Market reference

| Product | What it does | Does it work? (evidence) | What customers say | Our call |
|---|---|---|---|---|
| Babble | Soundbook of photos with recorded voice; Baby Mode with large cards; Story Mode plays in order [F] R1-S18 | 5.0 (1); last update Mar 2024 [F] R1-S18 | n/a | **Match** big controls and in-order play; **Innovate** with month chapters [R] |
| Tiny Treasures | "Baby memory book you can hear"; sealed messages [F] R1-S67 | 5.0 (7) | Reviewers value giggles and changing speech [S] R1-S67 | Positioning threat; our claim is the words as said plus the voice [R] |
| Remento | QR codes in printed books play the original voice [F] R1-S13 | 4.8 | Voice is the point [S] R2 section 0 item 5 | Different moment (adult reader); QR is F42 [R] |
| Calm | Narrated Sleep Stories for bedtime [F] R1-S48 | 4.8 (2M) | n/a | **Match** the quiet bedtime screen; **Avoid** sleep claims [R] |
| Gap | No product plays a parent's letters to a child as a session (R1 F10) | n/a | n/a | **Innovate** [R] |

## 6. Experience

### 6.1 Entry points

| Entry | Where | Exists today |
|---|---|---|
| Book header button | `(tabs)/book.tsx`, shown when any letter is in the book | Yes (`readTogether.title`) |
| Letter view | Floating player "Read together" (DESIGN_LANGUAGE 12); opens the letter's chapter | No (new) |
| Milestone card "Read the chapter" | `moments.firstMonthComplete.cta` | Key exists |
| Birthday notification | F13 opens the Book; Read together from there | n/a |

### 6.2 Happy path

1. **Open.** Parent taps Read together. App opens `read-together.tsx` full screen, chrome-free, Large Print (`tokens.readingScale.largePrint`). Shows `readTogether.title`, the chapter picker (`readTogether.chooseMonth`) preset to the newest chapter with in-book letters, and `readTogether.startButton`. Nothing plays. Nothing is counted.
2. **Choose a chapter.** Picker lists chapters with in-book letters, newest first, using F09 titles. Before You is included.
3. **Check the allowance.** On Start, the app calls `decide({ feature: 'read_together', ... })` in `packages/core/src/plan.ts` with `triesUsedInBook` and `freeTries` from remote config. `allow` continues; `offer` opens the F14 Plus sheet (step 11); `quiet` shows a line with no purchase (F10-U14).
4. **Session starts.** The first recording plays. At that moment, and only in try mode, the device increments `readTogether.sessions.<childId>` once (D-037, DR-06). `read_together_started` fires.
5. **A letter with a recording here.** Page shows the dateline line (`readTogether.nowReading` "{signsAs}, Month {month}"), the full text through `LetterText` (F09) in its own script and direction, the signature at the end (`book.signature`). The listening copy plays if one exists, else the original (F08 rule); `recordings.originalSwitch` (F08) is one tap away. No word highlight. The parent scrolls; the app does not auto-scroll.
6. **Next letter.** When a recording ends, a 2 s pause, then the next page turns and its recording plays, while `readTogether.autoplayLabel` ("Play the next one on its own") is on. It is on by default once the parent has pressed Play; off makes each letter wait for Next.
7. **A typed letter.** Page shows the text and `readTogether.noRecording` ("This one was typed. Read it aloud together."). The sequence stops on this page and waits for Next. The app never reads it with a machine voice.
8. **The other parent's letter (v1.0).** Page shows the text and `book.recordingElsewhere` ("Recording kept on {signsAs}'s phone"). The sequence waits for Next. Nothing suggests that voice will play here (DR-07).
9. **A voice-only letter (no words yet).** The recording plays; the text area shows `pendingCopy.book.waitingForWords`.
10. **End of chapter.** `readTogether.endOfMonth` (or `endOfMonthAlt`), then `readTogether.againButton`, `readTogether.nextMonthButton` and `readTogether.finishButton`. Continuing to the next chapter is the same session. After the first session ever in this book, the Book shows `moments.firstReadTogether` once (C-REQ-010).
11. **After the free sessions.** Start in a Free book with `triesUsedInBook >= freeTries` returns `offer`. The F14 sheet opens before anything plays (`plus_offer_viewed` with trigger `read_together`). Not now returns to the picker with a line that every letter still plays one at a time from the Book (`pendingCopy.readTogether.keepNote`). Plus never interrupts a session that already started.

### 6.3 Session and counter rules (DR-06)

| Rule | Value |
|---|---|
| A session starts | When the first recording of a chapter starts playing after Start, in Read together |
| Counted | Once per session, only when the decision was `allow` via `try` |
| Not counted | Opening Read together; choosing a chapter; reading pages with no recording on this phone; single-letter playback in the letter view; any session in a book with Plus (own or the other parent's, K-28) |
| A session ends | Close, 30 minutes with nothing playing, or the app going to the background for more than 30 minutes [A] |
| Scope | Per book, per device (`readTogether.sessions.<childId>`), L2 count (TDD 01 3.9). Reinstall resets it (D-037, accepted) |
| Limit | Remote config, default 3, invalid values fall back to 3, capped at 100 (`freeTriesFrom` in `plan.ts`) |
| Config key name | PRD-REQ-020 and D-035 say `read_together_free_sessions`; a comment in `plan.ts` says `read_together_free_tries`. Use `read_together_free_sessions` and fix the comment (WP-F10-02) |
| Today | `apps/mobile/src/lib/read-together.ts` counts per phone, at screen open, with the constant `FREE_READ_TOGETHER_SESSIONS = 3`. All three are replaced (BL-154) |

### 6.4 Audio behaviour

| Situation | Behaviour | Basis |
|---|---|---|
| Audio session | `setAudioMode('playback')` (`doNotMix`, plays in silent mode) while playing; `idle` within 500 ms of pause, end, close or background | `apps/mobile/src/lib/audio-mode.ts`, F08-REQ-011 |
| Speaker, AirPods, car Bluetooth | The system route is used; the app adds no route picker at v1.0 | expo-audio docs list no route API (opened 3 Oct 2026) |
| Headphones or Bluetooth disconnect | Playback stops (expo-audio stops audio on disconnect, per its docs); page stays; Play resumes from the same point | expo-audio docs |
| Call, Siri, alarm | Playback pauses; never auto-resumes (F08-REQ-011). expo-audio documents no interruption event, so the player treats `playing` turning false while the app expected playing as an interruption | expo-audio docs; TDD 01 3.4 |
| Screen lock and background | v1.0 has no background playback: `enableBackgroundPlayback: false` in `apps/mobile/app.config.ts`. Playback pauses on background; position kept | `app.config.ts`; TDD 01 3.4 item 3 |
| Auto-lock mid-chapter | Screen kept awake while a recording plays, released on pause and close (`expo-keep-awake`, new dependency; `useKeepAwake` and `activateKeepAwakeAsync` per Expo docs, opened 3 Oct 2026) | new |
| Lock-screen controls | Not at v1.0 (they need background playback to be useful). expo-audio has `setActiveForLockScreen`, which requires `doNotMix` (Expo docs) | Q2 |
| Speed | 1x default, 0.75x option (DESIGN_LANGUAGE 12) with pitch correction (`setPlaybackRate(rate, pitchCorrectionQuality)`, Expo docs) | new |
| UI sounds and haptics | None during playback (SOUND.md rule 2; MOTION section 6) | SOUND.md |

### 6.5 Unhappy paths and edge cases

| ID | Trigger | System behaviour | What the person sees | Recovery | Test |
|---|---|---|---|---|---|
| F10-U01 | Offline | Everything is local; plan decision uses the cached entitlement (C-NFR-004); an `offer` while offline becomes `quiet offline` | Session works within the allowance | n/a | E2E-05 offline variant |
| F10-U02 | Chapter has no recording on this phone (all typed or all the other parent's) | Pages turn by Next; no playback, so no session counted | Text pages with honest lines | n/a | `[F10-REQ-004]` |
| F10-U03 | Recording file missing or hash mismatch | Treated as no recording here; F08 integrity report | `book.recordingOnPhone` line replaced by text-only page; sequence waits | Export flags it (F15) | Fixture |
| F10-U04 | App killed mid-session | Counter was written at session start in one local write; restart opens the Book | No double count | n/a | Kill test |
| F10-U05 | Call during playback | Pause, no auto-resume | Paused state, Play button | Tap Play | Device script |
| F10-U06 | Headphones removed | Stops; same page | Paused | Tap Play | Device script |
| F10-U07 | App backgrounded or locked | Pause, `idle`; resumes nothing on return | Paused at same letter | Tap Play | `[LEGAL-REQ-011]` style AppState test |
| F10-U08 | Duplicate taps on Start | Start disabled while the decision runs; one increment | One session | n/a | Unit |
| F10-U09 | VoiceOver on | While a recording plays, focus stays on Pause and nothing else announces, so the speaker and VoiceOver never overlap (TDD 09 2.11) | Play, Pause, Next labelled with author and duration | n/a | V-script |
| F10-U10 | AX5 text | Letter text uncapped (D-027); controls stack; 64 pt play target | Nothing truncated | n/a | AX5 snapshot |
| F10-U11 | Reduce Motion | Page turn is a 200 ms fade | Calm | n/a | V6 |
| F10-U12 | SE 3, 60-letter chapter | Pages render one at a time; next page prepared during the 2 s gap | No stall | n/a | Perf: next page under 300 ms p95 |
| F10-U13 | Free book, allowance used, parent | `offer`: F14 sheet before playback | Plus sheet | Not now; letters still play from the Book | E2E-05 |
| F10-U14 | Allowance used on the child's birthday or offline | `quiet` (TDD 08 row 21): no sheet; a line says Read together is part of Plus and each letter still plays from the Book | Calm line, no purchase | Letter view playback | `[C-REQ-023]` |
| F10-U15 | Co-parent holds Plus | `allow plus_book`; never counted | No limit | n/a | TDD 08 row 14 |
| F10-U16 | Remote value changed from 3 to 5 | Next decision uses 5 without a release | Two more sessions | n/a | E2E-05 step 4 |
| F10-U17 | Letter deleted by its author mid-session | Page leaves on next render; sequence continues | Next letter | n/a | Unit |
| F10-U18 | Arabic letter with Hindi and English pages | `LetterText` per page; direction per paragraph | Each in its own script | n/a | F09 fixture |
| F10-U19 | Hidden book | Read together not reachable from the hidden view [R] | n/a | Show book again | Unit |
| F10-U20 | Signed out | Works; any `offer` asks to sign in first (`needsSignIn`, PRD-REQ-022) | Keep the book sheet before Plus | n/a | TDD 08 truth table |
| F10-U21 | Listening copy flag turned off remotely mid-session | Current letter keeps playing; next uses the original | No gap | n/a | F08-REQ-006 |
| F10-U22 | Low battery or Low Power Mode | No change; no background work exists | Normal | n/a | n/a |

## 7. Requirements and acceptance criteria

| ID | P | Requirement | Acceptance criteria | Source |
|---|---|---|---|---|
| PRD-REQ-020 | P0, Rev (B7, DR-06) | Read together free sessions | Given a Free book and `read_together_free_sessions = 3`, When the parent starts 3 sessions with recordings, Then the 4th Start opens the Plus sheet. Given the value changes to 5, Then 2 more are allowed without a release. Given single-letter playback in the letter view, Then it is never limited or counted | DR-06, K-11 |
| D-037 | P0 | Counter per book on the device | Given books A and B on one phone, When 3 sessions run in A, Then B still has 3. Given a reinstall, Then counts reset | D-037 |
| F10-REQ-001 | P0 | Session starts at first playback | Given Read together opened and closed without Play, Then the count is unchanged. Given Start and the first recording playing, Then the count is +1 exactly once per session | DR-06 |
| F10-REQ-002 | P0 | Counted only in try mode | Given own Plus or the other parent's Plus, Then the count never changes | K-28, `plan.ts` |
| F10-REQ-003 | P0 | Remove the old counter | Given the codebase, Then `FREE_READ_TOGETHER_SESSIONS` and the unscoped `readTogether.sessions` key are gone; a migration copies an old per-phone count into the active child's key once | BL-154 |
| F10-REQ-004 | P0 | No recording here, no count | Given a chapter whose letters have no recording on this phone, When the parent pages through all of them, Then the count is unchanged | DR-06 |
| F10-REQ-005 | P0 | Nothing plays before Play | Given Read together opens, Then no audio starts until Start is pressed; given a session ends, Then nothing starts on its own | DESIGN_LANGUAGE 10 |
| F10-REQ-006 | P0 | In-order playback of one chapter | Given a chapter with letters dated 2, 9 and 20 of a month, Then they play 2, 9, 20; month-precision letters play first (F09-REQ-003 order reversed for reading) | DR-06 |
| F10-REQ-007 | P0 | Auto-advance only between recordings, after Play | Given autoplay on, When a recording ends and the next letter has a recording here, Then it starts after 2 s. Given the next letter has none, Then the sequence stops on that page | new |
| F10-REQ-008 | P0 | Honest pages | Given a typed letter, Then `readTogether.noRecording` shows. Given the other parent's letter whose audio is on their phone, Then `book.recordingElsewhere` shows with their signature and no play control. Given any page, Then no machine voice reads it | DR-07, F11-REQ-015, constitution |
| F10-REQ-009 | P0 | Text visible and exact | Given any page, Then the rendered text equals `final_text` byte for byte in its script and direction; no word highlight in v1.0 | B7, F11-REQ-016 |
| F10-REQ-010 | P0 | Version choice follows F08 | Given a letter with a listening copy, Then it plays; the original switch is reachable in one tap | F08-REQ-007 |
| F10-REQ-011 | P0 | Interruptions never auto-resume | Given a call, Siri, alarm, headphone removal or backgrounding during playback, Then playback pauses, audio mode returns to `idle` within 500 ms, and nothing resumes without a tap | F08-REQ-011 |
| F10-REQ-012 | P0 | Screen stays on while playing | Given auto-lock at 30 s and a 2-minute recording playing, Then the screen does not lock; given pause, Then the keep-awake lock is released within 1 s | new |
| F10-REQ-013 | P0 | No background playback at v1.0 | Given the release build, Then `UIBackgroundModes` has no `audio` entry (config test, TDD 03 config lint) | `app.config.ts`, LEGAL-REQ-011 |
| F10-REQ-014 | P0 | Plus sheet only before a session | Given a session in progress, Then no Plus sheet, card or line appears until it ends. Given the allowance is used, Then the sheet appears on Start, before playback | C-REQ-023 |
| F10-REQ-015 | P0 | Quiet states | Given the allowance used on a birthday or offline, Then no purchase UI shows and the line points to letter view playback | TDD 08 rows 21, C-REQ-023 |
| F10-REQ-016 | P0 | Calm controls | Given the session screen, Then it shows only: close, chapter title, the page, Previous, Play or Pause (64 pt), Next, speed and the autoplay switch; no links out, no ads, no prompts | DESIGN_LANGUAGE 12, B16 |
| F10-REQ-017 | P0 | VoiceOver never talks over the voice | Given VoiceOver on and playback running, Then no element announces until playback pauses | TDD 09 2.11 |
| F10-REQ-018 | P0 | Copy truthful for v1.0 | Given `readTogether.subtitle` and store copy, Then no string says every letter plays in its author's voice while DR-07 A holds; the claims registry lists the v1.0 wording | DR-07, LEGAL-REQ-045 |
| F10-REQ-019 | P0 | No effect claims | Given every Read together string, Then none says calm, soothe, sleep, bond, develop or brain (content test addition) | R2 section 0 item 9 |
| C-REQ-010 | P0 | First Read together milestone | Given the first counted or Plus session in a book, Then `moments.firstReadTogether` shows once per reader in the Book | C |

## 8. Data, privacy and security

| Data | Level | Where | Who reads | Retention | Leaves the phone |
|---|---|---|---|---|---|
| `readTogether.sessions.<childId>` | L2 count, L3 key (TDD 01 3.9) | Local `settings` | This device | Until app delete or book delete | Never at v1.0 (server counter v1.1) |
| Autoplay and speed preference (new settings keys) | L2 | Local | This device | Same | Never |
| Audio played | L4 | Local files (F08) | This device | F08 | Never (B7) |

Read together writes nothing to the server. Analytics carry counts and buckets only.

## 9. Non-functional requirements

| Budget | Value | Gate |
|---|---|---|
| Start to first audio | p95 500 ms on SE 3 (local file) | No |
| Page turn | under 300 ms p95 | No |
| Plus decision | under 1 ms (pure, TDD 08 I-1) | No |
| Battery | Screen on only while playing; no background work | No |
| Accessibility | WCAG 2.2 AA, AX5, VoiceOver (LEGAL-REQ-051); shared rules in `06-nfr.md` | Yes |

## 10. Analytics

| Event | Status | Properties (L2) | Question |
|---|---|---|---|
| `read_together_started` | Exists | `child_ordinal`, `access` (`plus`, `try`), `letters_bucket` | Who uses it, under which access |
| `read_together_ended` | Exists | `reason` (`finished`, `stopped`, `interrupted`), `session_bucket`, `letters_heard` | Do sessions finish |
| `read_together_try_used` | Exists | `n` | Where the allowance runs out |
| `playback_started` | Exists | `surface = read_together`, `author_relation` | Whose voices are heard |
| `plus_offer_viewed`, `plus_offer_dismissed` | Exist | `trigger = read_together` | Conversion from the gate |
| `read_together_page_without_audio` (new) | New | `reason` (`typed`, `other_parent`, `missing`) | How often DR-07 bites (input to F31 priority) |

Consent-gated (LEGAL-REQ-003). U5 in `02-customers.md` (child age at use) cannot be measured without asking; Study 3 answers it.

## 11. How we build it (with the architect)

- **Pure logic in core.** `packages/core/src/read-together.ts` (new): `buildQueue(chapterEntries, deviceAudio)` returning pages with `audio | typed | elsewhere | waiting`; `shouldCount(decision, sessionState)`; session timeout. Allowance through `decide()` in `plan.ts` (exists, BL-036).
- **Screen.** Rewrite `apps/mobile/src/app/read-together.tsx` (today: text only, counts on open, all chapters oldest first) around the queue, using the shared player from F08 (`components/audio/player.tsx`, WP-F08-03) and `LetterText` from F09.
- **Counter.** `apps/mobile/src/lib/read-together.ts` becomes per-book keys plus the remote value from the F19 config client (BL-022); `PlusGate` and its `onContinueDev` bypass are deleted when F14's sheet lands (BL-216).
- **Keep awake.** Add `expo-keep-awake` with `flock /tmp/scribe-npm.lock npx expo install expo-keep-awake` (brief coordination rule); licence check before install (MIT expected, verify in the package).
- **Alignment.** BL-145 still lands for v1.1; v1.0 ignores `alignment` entirely (no sentence fallback either, to keep one honest mode).
- **Riskiest unknown.** expo-audio interruption behaviour on SE 3 (no documented event). Spike WP-F10-01: call, Siri, alarm, AirPods out, car disconnect, lock; record status transitions.

## 12. Work packages

| WP | Scope | Owner | Owns files | Depends on | Done when | Mode |
|---|---|---|---|---|---|---|
| WP-F10-01 | Spike: interruption and route behaviour of expo-audio playback on SE 3 | Mobile engineer | `apps/mobile/src/dev/audio-probe.tsx` (new) | WP-F08-03 | Transition table in PR | human device check |
| WP-F10-02 | Queue and counting logic, config key fix (BL-154) | Mobile engineer | `packages/core/src/read-together.ts` (new), `packages/core/test/read-together.test.ts` (new), `packages/core/src/plan.ts` comment | BL-036 | `[F10-REQ-001]`, `[F10-REQ-002]`, `[F10-REQ-004]`, `[F10-REQ-006]`, `[F10-REQ-007]`, `[D-037]` | agent |
| WP-F10-03 | Per-book counter and migration of the old key | Mobile engineer | `apps/mobile/src/lib/read-together.ts` | BL-022, WP-F10-02 | `[F10-REQ-003]`, `[PRD-REQ-020]` unit | agent |
| WP-F10-04 | Session screen: picker, pages, controls, honest lines (BL-160) | Mobile engineer, design systems | `apps/mobile/src/app/read-together.tsx`, `apps/mobile/src/components/read-together/` (new) | WP-F08-03, WP-F09-05, WP-F10-02 | `[F10-REQ-005]`, `[F10-REQ-008]`, `[F10-REQ-009]`, `[F10-REQ-010]`, `[F10-REQ-016]` | agent |
| WP-F10-05 | Audio states, keep awake, no background mode | Mobile engineer | `apps/mobile/src/components/read-together/session.ts` (new), `apps/mobile/test/config.test.ts` | WP-F10-01 | `[F10-REQ-011]`, `[F10-REQ-012]`, `[F10-REQ-013]` | agent plus device check |
| WP-F10-06 | Plus hand-off and quiet states | Payments engineer | `apps/mobile/src/components/read-together/gate.tsx` (new) | BL-216 | `[F10-REQ-014]`, `[F10-REQ-015]`, E2E-05 | agent |
| WP-F10-07 | Accessibility pass | Design systems | Read together components | WP-F10-04 | `[F10-REQ-017]`, AX5 snapshots, V-script | agent |
| WP-F10-08 | Copy: v1.0 subtitle, gate lines, content test for effect words | Content | `apps/mobile/src/components/read-together/copy.ts` (new); request to content owner for `readTogether.subtitle` and `store.en.ts` | none | `[F10-REQ-018]`, `[F10-REQ-019]` | agent |
| WP-F10-09 | Analytics wiring | Analytics engineer | `packages/analytics/src/catalog.ts` (new event) | BL-250 | Catalogue test passes | agent |

## 13. Open questions and assumptions

| # | Question | Who | By | What changes |
|---|---|---|---|---|
| Q1 | Does moving to the next chapter in one sitting count as a new session (DR-06 says "a chapter begins")? Spec default: no, one sitting is one session | Founder | 16 Oct (with DR-06) | F10-REQ-001 |
| Q2 | Background and lock-screen playback (car, phone in pocket). Needs `UIBackgroundModes audio`, which the config keeps off for LEGAL-REQ-011 reasons and TDD 03 lints against. Spec default: off at v1.0; ask counsel whether playback-only background audio is fine | Counsel, founder | 6 Nov | F10-REQ-013 |
| Q3 | On the child's birthday with the allowance used, `decide()` returns quiet. Allow one session as a gift that day instead? Spec default: quiet line, letters play from the Book | Founder | 23 Oct | F10-REQ-015, TDD 08 row 21 |
| Q4 | Store and `readTogether.subtitle` copy say each letter plays in its author's voice; false for the other parent's letters at v1.0 (DR-07). Proposed: "Open the book with {child}. Hear the letters recorded on this phone, in the voice that wrote them." | Content, counsel | Copy freeze | F21, `packages/content` |

| # | Assumption | How we validate |
|---|---|---|
| A1 | A 2 s pause between letters suits bedtime | Study 3 prototype |
| A2 | Parents prefer autoplay on after Play | Study 3; watch `read_together_ended` reasons |
| A3 | 30 minutes idle ends a session | `session_bucket` distribution after cohorts |

## 14. Sources

- `docs/prd/v2/_AUTHORING.md` B7; `02-customers.md` P2, P6, U5, U6; `03-goals-and-principles.md`; `05-feature-map.md` sections 2 and 5 (cut 4); `09-decisions-and-risks.md` DR-04, DR-06, DR-07, DR-15.
- `docs/prd/PRD.md` 1.3: PRD-REQ-020, PRD-REQ-022, K-11, K-28, section 6.5, 7.4.
- `docs/prd/C-habits-pricing-settings.md` 4.1, C-REQ-010, C-REQ-023, C-NFR-004, C-NFR-009.
- `docs/DECISIONS.md` D-035, D-037; `docs/adr/0009-word-alignment.md`.
- `docs/tdd/01-mobile-client.md` 3.4, 3.9; `docs/tdd/08-payments-entitlements.md` 2.2, truth table rows 13 to 21; `docs/tdd/09-accessibility-design-system.md` 2.11; `docs/tdd/03-audio-transcription.md` config lint; `docs/tdd/07-quality-test-strategy.md` E2E-05.
- `docs/design/DESIGN_LANGUAGE.md` 10, 12; `docs/design/COMPONENTS.md` 2.21, 2.22; `docs/design/SOUND.md` 3.
- Code: `apps/mobile/src/app/read-together.tsx`, `apps/mobile/src/lib/read-together.ts`, `apps/mobile/src/lib/audio-mode.ts`, `apps/mobile/app.config.ts`, `packages/core/src/plan.ts`, `packages/content/src/strings.en.ts` (`readTogether.*`, `book.recordingElsewhere`, `moments.firstReadTogether`), `apps/mobile/src/lib/copy.ts` (`pendingCopy.readTogether`), `packages/analytics/src/catalog.ts`.
- `docs/prd/v2/features/F08-recordings.md` (F08-REQ-006, -007, -011), `F11-co-parent.md` (F11-REQ-015, -016).
- Research: R1 F10 (R1-S13, R1-S18, R1-S48, R1-S67); R2 section 0 items 5 and 9, R2-S24, R2-S29.
- Opened 3 Oct 2026: Expo Audio docs, https://docs.expo.dev/versions/latest/sdk/audio/; Expo KeepAwake docs, https://docs.expo.dev/versions/latest/sdk/keep-awake/.
