# F10 Read together

| | |
|---|---|
| Release | v1.0 gate (word highlight v1.1, F34) |
| Priority and rank | P1, rank 21 (`05-feature-map.md` section 2). Built with no limit; ships with device checks and WP-F10-10. Out of the first three screenshots unless C1 shows use (R1 PL-30) |
| Personas | P1, P2, P4, P6 |
| Existing IDs | PRD-REQ-020 Rev (M2: D-082, D-083), K-11, D-037 (superseded for Read together by D-051 (main) and D-082), C-REQ-010 (first Read together), C-REQ-023, C-NFR-004, C-NFR-009, LEGAL-REQ-011, LEGAL-REQ-050, LEGAL-REQ-051, ADR 0009, BL-022, BL-036, BL-145, BL-154, BL-160, BL-216, BL-265 |
| Depends on | F08 (player, listening copy, audio session), F09 (chapters, `LetterText`), F11 (co-parent letters, DR-07), F14 (`hasPlus()` for the analytics `access` property only; no gate) |
| Status | Draft V2.2, 13 Oct 2026. Free with no session limit and no Plus gate (M2; D-082, D-083 in `apps/mobile/src/app/read-together.tsx`); session counting and the try allowance are removed, IDs kept and marked. Revised after critique round 1: per-letter skip and a letter list before Start (R3 DX-17), the night surface (DX-13), each letter read by VoiceOver in its own language (DX-21), `expo-keep-awake` already installed (R6 check 3 row 2), status per WP (R5 EQ-25, EQ-26). Dates are milestone ids in `08-delivery.md` section 2.1 |

## 1. Why

- [F] The AAP encourages shared reading from birth through kindergarten and prefers print to digital media (R2-S29). Read together has to be parent-led and sit beside the PDF book (F15), not replace books.
- [S] Hearing the person's voice is the value Remento reviewers name most (11 of 64, R2 section 0 item 5).
- [F] No product R1 opened plays a sequence of a parent's letters to a child as a session; Babble has the closest pattern (big cards, Story Mode in order) (R1 F10; R1-S18).
- [F] Tiny Treasures now pitches a "baby memory book you can hear" (R1-S67), so others compete for this moment too.
- [A] We found no study of a recorded parent's voice on a child (R2 section 0 item 9). The live-voice study (61 girls aged 7 to 12) does not transfer (R2-S24). Copy never claims a calming, sleep or developmental effect.
- [D] Read together is free for every letter that exists, with no session limit (D-082, D-083; M2). Plus gates only the Keep step of a new letter (F14). Word highlight moved to v1.1 (B7).

## 2. Who

| Persona | Moment | Holding, feeling, short of | What F10 must do |
|---|---|---|---|
| P1 Evening parent | Bedtime, child on the lap, 2 to 5 years old (R2-S29) | Phone in one hand, child in the other arm; dim room; may have written some letters for an adult reader, about a hard night or a loss | Start in one tap, nothing plays until they press Play, no sheet in the middle; never plays a letter the parent has not chosen to share with a small child |
| P2 Co-parent | Reads the book with the child | Their own recordings, the other parent's letters as text | Say plainly whose voice is where (DR-07) |
| P4 Multilingual family | Letters in Hindi, Spanish, Arabic | Mixed scripts; a parent may not read the other's language | Letters stay as written; the voice carries the language when it is on this phone |
| P6 Future reader | Listening at 3, later alone | A small screen | Large Print, clear voice, nothing to tap by accident |

## 3. What we are solving

**Outcome:** a parent can play a month of letters in order, in each author's voice where that voice is on this phone, with the words on screen, in a calm screen a child can sit with, free and without limit.

| Metric | Target | How measured | Consent caveat |
|---|---|---|---|
| Share of monthly active parents who start Read together | Set after cohorts (03 section 4.2) | `read_together_started` | Opt-in only |
| Plus sheets or StoreKit calls from Read together | 0 | Static check: no `lib/billing` call other than `hasPlus()` in `read-together.tsx` | None |
| Sessions finished (`reason = finished`) | Set after cohorts | `read_together_ended` | Opt-in only |
| Copy claiming an effect of voice on the child | 0 | Claims registry (LEGAL-REQ-045) and content review | None |

## 4. Scope

**In v1.0**
- Pick a chapter, press Play, letters play oldest first with the text visible in Large Print.
- Each letter in the author's voice when the recording is on this phone (listening copy if present, original one tap away, F08).
- Plain pages for letters with no recording here: typed letters, the other parent's letters (DR-07), voice-only letters still waiting for words.
- Before Start, the chapter's letters as a list with their first words, each with a tick the parent can clear for this session; a per-letter "Skip in Read together" switch for the author's own letters; letters written to a `hard` prompt start skipped: their local `entries.prompt_key` starts with `hard.` (`apps/mobile/src/lib/db/migrations.ts`; `hard.*` keys in `packages/content/src/prompts.ts`) (R3 DX-17).
- The night surface whatever the system theme (R3 DX-13); each letter's text read by VoiceOver in the letter's language (R3 DX-21).
- No session limit and no Plus gate (M2).
- Pause, previous, next, replay, speed 0.75x and 1x.
- Interruptions, route changes, lock and background handled; screen kept awake while playing.
- First Read together milestone (C-REQ-010).

**Later**
- Word highlight from ADR 0009 alignment: v1.1 (F34, B7).
- Hearing the other parent's voice: v1.1 shared voice (F31, DR-07).
- Background and lock-screen playback (car, pocket): v1.1 candidate, needs Q2.

**Never**
- Autoplay on open, or any sound before the parent presses Play.
- Text-to-speech or any machine voice reading a letter. The only voice is the author's.
- A sleep timer at v1.0: no evidence that parents need one (none in R1, R2 or UR), and a chapter ends on its own. Revisit only with Study 3 data.
- Claims that recorded voice calms, soothes or helps development (R2 section 0 item 9).
- Child-facing modes or child recording (LEGAL-REQ-059; `readTogether.makeLetterTogether` stays behind `child-input`, PRD-REQ-005).
- A session counter, a try allowance or any Plus UI in Read together (M2).

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

1. **Open.** Parent taps Read together. App opens `read-together.tsx` full screen on the night surface whatever the system theme, chrome-free, Large Print (`tokens.readingScale.largePrint`). Shows `readTogether.title`, the chapter picker (`readTogether.chooseMonth`) preset to the newest chapter with in-book letters, and `readTogether.startButton`. Nothing plays.
2. **Choose a chapter.** Picker lists chapters with in-book letters, newest first, using F09 titles. Before You is included.
2b. **Choose the letters.** Under the picker, the chapter's letters in reading order, each with its signature and first words and a tick. Ticks start on, except letters whose author switched on "Skip in Read together" and letters written to a `hard` prompt, which start off. Clearing a tick affects this session only (`readTogether.letterList.*`, new; content owns the words).
3. (Removed, M2: there is no allowance check.)
4. **Session starts.** The first recording plays. `read_together_started` fires with `access` `plus` or `free` (analytics only; nothing is counted against a limit).
5. **A letter with a recording here.** Page shows the dateline line (`readTogether.nowReading` "{signsAs}, Month {month}"), the full text through `LetterText` (F09) in its own script and direction, the signature at the end (`book.signature`). The listening copy plays if one exists, else the original (F08 rule); `recordings.originalSwitch` (F08) is one tap away. No word highlight. The parent scrolls; the app does not auto-scroll.
6. **Next letter.** When a recording ends, a 2 s pause, then the next page turns and its recording plays, while `readTogether.autoplayLabel` ("Play the next one on its own") is on. It is on by default once the parent has pressed Play; off makes each letter wait for Next.
7. **A typed letter.** Page shows the text and `readTogether.noRecording` ("This one was typed. Read it aloud together."). The sequence stops on this page and waits for Next. The app never reads it with a machine voice.
8. **The other parent's letter (v1.0).** Page shows the text and `book.recordingElsewhere` ("Recording kept on {signsAs}'s phone"). The sequence waits for Next. Nothing suggests that voice will play here (DR-07).
9. **A voice-only letter (no words yet).** The recording plays; the text area shows `pendingCopy.book.waitingForWords`.
9b. **A letter the parent cleared or the author skipped.** It is not in the session; the sequence goes to the next ticked letter.
10. **End of chapter.** `readTogether.endOfMonth` (or `endOfMonthAlt`), then `readTogether.againButton`, `readTogether.nextMonthButton` and `readTogether.finishButton`. Continuing to the next chapter is the same session. After the first session ever in this book, the Book shows `moments.firstReadTogether` once (C-REQ-010).
11. (Removed, M2: there are no free sessions to run out of.)

### 6.3 Session rules (analytics and the milestone only)

Changed 13 Oct 2026 (M2): sessions are no longer counted against a limit. A session exists only for `read_together_started`, `read_together_ended` and the first Read together milestone.

| Rule | Value |
|---|---|
| A session starts | When the first recording of a chapter starts playing after Start, in Read together |
| A session ends | Close, 30 minutes with nothing playing, or the app going to the background for more than 30 minutes [A] |
| Limit | None (D-082, D-083) |
| Removed | `apps/mobile/src/lib/read-together.ts` and `FREE_READ_TOGETHER_SESSIONS` are deleted (commit 71070c4). Left over: the constant `READ_TOGETHER_SESSIONS_KEY` in `apps/mobile/src/lib/billing/config.ts` and `readTogetherFreeSessions` in `packages/api/src/remote-config.ts`, both unused (F14-REQ-035) |

### 6.4 Audio behaviour

| Situation | Behaviour | Basis |
|---|---|---|
| Audio session | `setAudioMode('playback')` (`doNotMix`, plays in silent mode) while playing; `idle` within 500 ms of pause, end, close or background | `apps/mobile/src/lib/audio-mode.ts`, F08-REQ-011 |
| Speaker, AirPods, car Bluetooth | The system route is used; the app adds no route picker at v1.0 | expo-audio docs list no route API (opened 3 Oct 2026) |
| Headphones or Bluetooth disconnect | Playback stops (expo-audio stops audio on disconnect, per its docs); page stays; Play resumes from the same point | expo-audio docs |
| Call, Siri, alarm | Playback pauses; never auto-resumes (F08-REQ-011). expo-audio documents no interruption event, so the player treats `playing` turning false while the app expected playing as an interruption | expo-audio docs; TDD 01 3.4 |
| Screen lock and background | v1.0 has no background playback: `enableBackgroundPlayback: false` in `apps/mobile/app.config.ts`. Playback pauses on background; position kept | `app.config.ts`; TDD 01 3.4 item 3 |
| Auto-lock mid-chapter | Screen kept awake while a recording plays, released on pause and close, through `useKeepAwakeWhile` in `apps/mobile/src/lib/resilience/keep-awake.ts` over `expo-keep-awake` (installed, ~57.0.2 in `apps/mobile/package.json`) | `keep-awake.ts`; R6 check 3 row 2 |
| Lock-screen controls | Not at v1.0 (they need background playback to be useful). expo-audio has `setActiveForLockScreen`, which requires `doNotMix` (Expo docs) | Q2 |
| Speed | 1x default, 0.75x option (DESIGN_LANGUAGE 12) with pitch correction (`setPlaybackRate(rate, pitchCorrectionQuality)`, Expo docs) | new |
| UI sounds and haptics | None during playback (SOUND.md rule 2; MOTION section 6) | SOUND.md |

### 6.5 Unhappy paths and edge cases

| ID | Trigger | System behaviour | What the person sees | Recovery | Test |
|---|---|---|---|---|---|
| F10-U01 | Offline | Everything is local | Session works | n/a | E2E-05 offline variant |
| F10-U02 | Chapter has no recording on this phone (all typed or all the other parent's) | Pages turn by Next; no playback, so no `read_together_started` | Text pages with plain lines | n/a | `[F10-REQ-008]` |
| F10-U03 | Recording file missing or hash mismatch | Treated as no recording here; F08 integrity report | `book.recordingOnPhone` line replaced by text-only page; sequence waits | Export flags it (F15) | Fixture |
| F10-U04 | App killed mid-session | Nothing to recover; restart opens the Book | Book | n/a | Kill test |
| F10-U05 | Call during playback | Pause, no auto-resume | Paused state, Play button | Tap Play | Device script |
| F10-U06 | Headphones removed | Stops; same page | Paused | Tap Play | Device script |
| F10-U07 | App backgrounded or locked | Pause, `idle`; resumes nothing on return | Paused at same letter | Tap Play | `[LEGAL-REQ-011]` style AppState test |
| F10-U08 | Duplicate taps on Start | Start disabled while starting; one `read_together_started` | One session | n/a | Unit |
| F10-U09 | VoiceOver on | While a recording plays, focus stays on Pause and nothing else announces, so the speaker and VoiceOver never overlap (TDD 09 2.11) | Play, Pause, Next labelled with author and duration | n/a | V-script |
| F10-U10 | AX5 text | Letter text uncapped (D-027); controls stack; 64 pt play target | Nothing truncated | n/a | AX5 snapshot |
| F10-U11 | Reduce Motion | Page turn is a 200 ms fade | Calm | n/a | V6 |
| F10-U12 | SE 3, 60-letter chapter | Pages render one at a time; next page prepared during the 2 s gap | No stall | n/a | Perf: next page under 300 ms p95 |
| F10-U13 | Removed (M2): no allowance | | | | |
| F10-U14 | Removed (M2) | | | | |
| F10-U15 | Removed (M2): Plus changes nothing in Read together | | | | |
| F10-U16 | Removed (M2): no remote session value is read | | | | |
| F10-U17 | Letter deleted by its author mid-session | Page leaves on next render; sequence continues | Next letter | n/a | Unit |
| F10-U18 | Arabic letter with Hindi and English pages | `LetterText` per page; direction per paragraph | Each in its own script | n/a | F09 fixture |
| F10-U19 | Hidden book | Read together not reachable from the hidden view [R] | n/a | Show book again | Unit |
| F10-U20 | Signed out (sign-in is optional) | Works the same | Normal | n/a | n/a |
| F10-U23 | Plus lapsed or never bought | Works the same; every existing letter plays (PRD-REQ-026) | Normal | n/a | `[F10-REQ-014]` |
| F10-U21 | Removed (F08-REQ-006 Rev, D-068): there is no remote listening-copy flag. A copy whose hash does not match its original is never used; that letter plays the original | Original plays | No gap | n/a | F08-REQ-006 Rev |
| F10-U22 | Low battery or Low Power Mode | No change; no background work exists | Normal | n/a | n/a |
| F10-U24 | Every letter in the chapter cleared or skipped | Start is disabled | "Tick a letter to start." (new key) | Tick one | Unit |
| F10-U25 | System in light mode at bedtime | The night surface is used anyway | Dark screen | n/a | Theme test with light system theme |
| F10-U26 | A Hindi, Arabic or Chinese letter with VoiceOver on, paused | VoiceOver reads the page in the letter's language | Correct voice | n/a | VoiceOver script V1b (07 owner) |
| F10-U27 | The other parent's letter written to a `hard` prompt | Unverified whether `prompt_key` reaches the other parent's phone (F16 contract); if not, the letter starts ticked. The author's own skip switch applies only on their phone | Ticked | Clear the tick | Unit; F16 owner confirms the field |

## 7. Requirements and acceptance criteria

| ID | P | Requirement | Acceptance criteria | Source |
|---|---|---|---|---|
| PRD-REQ-020 | P0, Rev (M2) | Read together is free with no session limit | Given a Free phone with 3 letters, When Read together starts 5 times, Then it opens every time with 0 Plus sheets and 0 StoreKit calls (device check D-3 in `docs/ops/APP_STORE_CONNECT_SUBSCRIPTIONS.md`) | D-082, D-083 |
| D-037 | n/a | Superseded for Read together (M2): no counter | n/a | D-082 |
| F10-REQ-001 | P0, Rev (M2) | A session (analytics only) starts at first playback | Given Read together opened and closed without Play, Then no `read_together_started`. Given Start and the first recording playing, Then exactly one per session | DR-06 |
| F10-REQ-002 | n/a | Removed (M2): no try mode | n/a | D-082 |
| F10-REQ-003 | P0, Rev (M2) | Remove the old counter and its config | Given the codebase, Then `FREE_READ_TOGETHER_SESSIONS`, `READ_TOGETHER_SESSIONS_KEY` and `readTogetherFreeSessions` have 0 uses. Built for the first (commit 71070c4); the other two remain (F14-REQ-035) | D-082 |
| F10-REQ-004 | n/a | Removed (M2): nothing is counted | n/a | D-082 |
| F10-REQ-005 | P0 | Nothing plays before Play | Given Read together opens, Then no audio starts until Start is pressed; given a session ends, Then nothing starts on its own | DESIGN_LANGUAGE 10 |
| F10-REQ-006 | P0 | In-order playback of one chapter | Given a chapter with letters dated 2, 9 and 20 of a month, Then they play 2, 9, 20; month-precision letters play first (F09-REQ-003 order reversed for reading) | DR-06 |
| F10-REQ-007 | P0 | Auto-advance only between recordings, after Play | Given autoplay on, When a recording ends and the next letter has a recording here, Then it starts after 2 s. Given the next letter has none, Then the sequence stops on that page | new |
| F10-REQ-008 | P0 | Plain pages | Given a typed letter, Then `readTogether.noRecording` shows. Given the other parent's letter whose audio is on their phone, Then `book.recordingElsewhere` shows with their signature and no play control. Given any page, Then no machine voice reads it | DR-07, F11-REQ-015, constitution |
| F10-REQ-009 | P0 | Text visible and exact | Given any page, Then the rendered text equals `final_text` byte for byte in its script and direction; no word highlight in v1.0 | B7, F11-REQ-016 |
| F10-REQ-010 | P0 | Version choice follows F08 | Given a letter with a listening copy, Then it plays; the original switch is reachable in one tap | F08-REQ-007 |
| F10-REQ-011 | P0 | Interruptions never auto-resume | Given a call, Siri, alarm, headphone removal or backgrounding during playback, Then playback pauses, audio mode returns to `idle` within 500 ms, and nothing resumes without a tap | F08-REQ-011 |
| F10-REQ-012 | P0 | Screen stays on while playing | Given auto-lock at 30 s and a 2-minute recording playing, Then the screen does not lock; given pause, Then the keep-awake lock is released within 1 s | new |
| F10-REQ-013 | P0 | No background playback at v1.0 | Given the release build, Then `UIBackgroundModes` has no `audio` entry (config test, TDD 03 config lint) | `app.config.ts`, LEGAL-REQ-011 |
| F10-REQ-014 | P0, Rev (M2) | No Plus UI in Read together | Given a Free, lapsed or Plus phone, Then Read together shows no Plus sheet, card or line and makes no StoreKit call | M2, LEGAL-REQ-050 |
| F10-REQ-015 | n/a | Removed (M2): no quiet states without a gate | n/a | D-082 |
| F10-REQ-016 | P0 | Calm controls | Given the session screen, Then it shows only: close, chapter title, the page, Previous, Play or Pause (64 pt), Next, speed and the autoplay switch; no links out, no ads, no prompts | DESIGN_LANGUAGE 12, B16 |
| F10-REQ-017 | P0 | VoiceOver never talks over the voice | Given VoiceOver on and playback running, Then no element announces until playback pauses | TDD 09 2.11 |
| F10-REQ-018 | P0 | Copy truthful for v1.0 | Given `readTogether.subtitle` and store copy, Then no string says every letter plays in its author's voice while DR-07 A holds; the claims registry lists the v1.0 wording | DR-07, LEGAL-REQ-045 |
| F10-REQ-019 | P0 | No effect claims | Given every Read together string, Then none says calm, soothe, sleep, bond, develop or brain (content test addition) | R2 section 0 item 9 |
| C-REQ-010 | P0 | First Read together milestone | Given the first session in a book, Then `moments.firstReadTogether` shows once per reader in the Book | C |
| F10-REQ-020 | P1 | Letter list before Start with ticks for this session; a per-letter "Skip in Read together" switch for the author's own letters; letters written to a `hard` prompt start unticked | Given a chapter with 5 letters, 1 skipped by its author and 1 from a `hard` prompt, Then the list shows 5 with 3 ticked and the session plays 3. Given a cleared tick, Then the next session starts with it ticked again unless the author skipped it | R3 DX-17 |
| F10-REQ-021 | P1 | The night surface whatever the system theme | Given the system in light mode, Then every Read together screen uses the night tokens (theme test) | R3 DX-13; DESIGN_LANGUAGE principle 2 |
| F10-REQ-022 | P1 | Letter text carries the letter's language for VoiceOver (`accessibilityLanguage`) | Given a Hindi letter, Then its text element has `accessibilityLanguage` `hi` | R3 DX-21 |

## 8. Data, privacy and security

| Data | Level | Where | Who reads | Retention | Leaves the phone |
|---|---|---|---|---|---|
| Autoplay and speed preference (new settings keys) | L2 | Local | This device | Same | Never |
| "Skip in Read together" flag on the author's own letters | L3 | Local, on the author's phone only at v1.0 [R] | This device | Life of the letter | Never at v1.0; a synced flag would need the F16 contract |
| Audio played | L4 | Local files (F08) | This device | F08 | Never (B7) |

Read together writes nothing to the server. Analytics carry counts and buckets only.

## 9. Non-functional requirements

| Budget | Value | Gate |
|---|---|---|
| Start to first audio | p95 500 ms on SE 3 (local file) | No |
| Page turn | under 300 ms p95 | No |
| Battery | Screen on only while playing; no background work | No |
| Accessibility | WCAG 2.2 AA, AX5, VoiceOver (LEGAL-REQ-051); shared rules in `06-nfr.md` | Yes |

## 10. Analytics

| Event | Status | Properties (L2) | Question |
|---|---|---|---|
| `read_together_started` | Exists | `child_ordinal`, `access` (`plus`, `free`; catalogue schema 4), `letters_bucket` | Who uses it, with and without Plus |
| `read_together_ended` | Exists | `reason` (`finished`, `stopped`, `interrupted`), `session_bucket`, `letters_heard` | Do sessions finish |
| `playback_started` | Exists | `surface = read_together`, `author_relation` | Whose voices are heard |
| `read_together_page_without_audio` (new) | New | `reason` (`typed`, `other_parent`, `missing`) | How often DR-07 bites (input to F31 priority) |

Consent-gated (LEGAL-REQ-003). U5 in `02-customers.md` (child age at use) cannot be measured without asking; Study 3 answers it.

## 11. How we build it (with the architect)

- **Pure logic in core.** `packages/core/src/read-together.ts` (new): `buildQueue(chapterEntries, deviceAudio)` returning pages with `audio | typed | elsewhere | waiting`; session timeout. No allowance (M2).
- **Screen.** Rewrite `apps/mobile/src/app/read-together.tsx` (today: text only, counts on open, all chapters oldest first) around the queue, using the shared player from F08 (`components/audio/player.tsx`, WP-F08-03) and `LetterText` from F09.
- **Counter.** Removed (M2): `apps/mobile/src/lib/read-together.ts` is deleted; `read-together.tsx` reads `hasPlus()` only for the analytics `access` property.
- **Keep awake.** `expo-keep-awake` is installed (~57.0.2); the screen uses `useKeepAwakeWhile` from `apps/mobile/src/lib/resilience/keep-awake.ts`. Nothing to add.
- **Alignment.** BL-145 still lands for v1.1; v1.0 ignores `alignment` entirely (no sentence fallback either, to keep one mode that tells the truth).
- **Riskiest unknown.** expo-audio interruption behaviour on SE 3 (no documented event). Spike WP-F10-01: call, Siri, alarm, AirPods out, car disconnect, lock; record status transitions.

## 12. Work packages

Stream: S13 (`08-delivery.md` section 3.3). 08 section 3.3 governs file ownership; a path here owned by another stream is a request. Status checked on `origin/develop` on 13 Oct.

| WP | Scope | Owner | Owns files | Depends on | Done when | Mode | Status 13 Oct |
|---|---|---|---|---|---|---|---|
| WP-F10-01 | Spike: interruption and route behaviour of expo-audio playback on SE 3 | Mobile engineer, device operator | `apps/mobile/src/dev/audio-probe.tsx` (new) | WP-F08-03 | Transition table in an evidence file under `docs/qa/evidence/` | Human device check (W2, `08-delivery.md` section 10.2) | Not run |
| WP-F10-02 | Queue logic (BL-154, rescoped by M2: no counting), with the tick and skip rules | Mobile engineer | `packages/core/src/read-together.ts` (new), `packages/core/test/read-together.test.ts` (new) | none | `[F10-REQ-001]`, `[F10-REQ-006]`, `[F10-REQ-007]`, `[F10-REQ-020]` queue cases | Agent | Not built (no `read-together.ts` in core) |
| WP-F10-03 | Removed (M2): the leftover constant and config key go with WP-F14-17 | n/a | n/a | n/a | Removed; `[F10-REQ-003]` is proved by WP-F14-17 | n/a | Removed |
| WP-F10-04 | Session screen: picker, pages, controls, plain lines (BL-160) | Mobile engineer, design systems | `apps/mobile/src/app/read-together.tsx`, `apps/mobile/src/components/read-together/` (new) | WP-F08-03, WP-F09-05, WP-F10-02 | `[F10-REQ-005]`, `[F10-REQ-008]`, `[F10-REQ-009]`, `[F10-REQ-010]`, `[F10-REQ-016]`, `[F10-REQ-014]` static check | Agent | Partly built: `read-together.tsx` plays with autoplay and reads `hasPlus()` for analytics only; no `components/read-together/` |
| WP-F10-05 | Audio states, keep awake, no background mode | Mobile engineer | `apps/mobile/src/components/read-together/session.ts` (new), `apps/mobile/test/config.test.ts` (request to S20) | WP-F10-01 | `[F10-REQ-011]`, `[F10-REQ-012]`, `[F10-REQ-013]` | Agent plus device check | Partly built: keep-awake wired through `lib/resilience/keep-awake.ts` |
| WP-F10-06 | Removed (M2) | n/a | n/a | n/a | Removed; `[F10-REQ-014]` is checked by a static test in WP-F10-04 | n/a | Removed |
| WP-F10-07 | Accessibility pass | Design systems (S15 review) | Read together components | WP-F10-04, WP-F00-01 harness | `[F10-REQ-017]`, AX5 snapshots, V-script | Agent | Not built |
| WP-F10-08 | Copy: v1.0 subtitle, list and skip lines, content test for effect words | Content (S16) | `packages/content/src/features/read-together.en.ts` (new; not a `copy.ts` in components, R5 EQ-29); request for `readTogether.subtitle` and `store.en.ts` | none | `[F10-REQ-018]`, `[F10-REQ-019]` | Agent | Not built |
| WP-F10-09 | Analytics wiring | Analytics engineer (S18) | `packages/analytics/src/catalog.ts` (new event) | BL-250 | Catalogue test passes with `read_together_page_without_audio` | Agent | Not built; 1.0.x unless a slot is free (`08-delivery.md` section 6.4) |
| WP-F10-10 | Letter list and per-letter skip; night surface; `accessibilityLanguage` per letter | Mobile engineer (S13) | `apps/mobile/src/components/read-together/`, `apps/mobile/src/app/read-together.tsx` | WP-F10-02, WP-F10-04 | `[F10-REQ-020]`, `[F10-REQ-021]`, `[F10-REQ-022]` | Agent | Not built |

## 13. Open questions and assumptions

| # | Question | Who | By | What changes |
|---|---|---|---|---|
| Q1 | Answered by M2: nothing is counted; for analytics one sitting is one session | n/a | n/a | n/a |
| Q2 | Background and lock-screen playback (car, phone in pocket). Needs `UIBackgroundModes audio`, which the config keeps off for LEGAL-REQ-011 reasons and TDD 03 lints against. Spec default: off at v1.0; ask counsel whether playback-only background audio is fine | Counsel, founder | T17 | F10-REQ-013 |
| Q5 | Should "Skip in Read together" sync so it also applies on the other parent's phone? Spec default: local at v1.0 [R] | Founder | T34 (v1.1 planning) | F16 contract |
| Q3 | Answered by M2: no allowance, so no birthday rule | n/a | n/a | n/a |
| Q4 | Store and `readTogether.subtitle` copy say each letter plays in its author's voice; false for the other parent's letters at v1.0 (DR-07). Proposed: "Open the book with {child}. Hear the letters recorded on this phone, in the voice that wrote them." | Content, counsel | Copy freeze | F21, `packages/content` |

| # | Assumption | How we validate |
|---|---|---|
| A1 | A 2 s pause between letters suits bedtime | Study 3 prototype |
| A2 | Parents prefer autoplay on after Play | Study 3; watch `read_together_ended` reasons |
| A3 | 30 minutes idle ends a session | `session_bucket` distribution after cohorts |

## 14. Sources

- `docs/prd/v2/_AUTHORING.md` B7, section 3b M2; `02-customers.md` P2, P6, U5, U6; `03-goals-and-principles.md`; `05-feature-map.md` section 2; `09-decisions-and-risks.md` DR-06 (answered), DR-07, DR-15.
- Decisions: `git show origin/main:docs/DECISIONS.md` D-051; D-082 and D-083 as carried by commit 71070c4 (`apps/mobile/src/app/read-together.tsx` header, `packages/analytics/src/catalog.ts` schema 4 note).
- `docs/prd/PRD.md` 1.3: PRD-REQ-020, PRD-REQ-022, K-11, K-28, section 6.5, 7.4.
- `docs/prd/C-habits-pricing-settings.md` 4.1, C-REQ-010, C-REQ-023, C-NFR-004, C-NFR-009.
- `docs/DECISIONS.md` D-035, D-037; `docs/adr/0009-word-alignment.md`.
- `docs/tdd/01-mobile-client.md` 3.4, 3.9; `docs/tdd/08-payments-entitlements.md` 2.2, truth table rows 13 to 21; `docs/tdd/09-accessibility-design-system.md` 2.11; `docs/tdd/03-audio-transcription.md` config lint; `docs/tdd/07-quality-test-strategy.md` E2E-05.
- `docs/design/DESIGN_LANGUAGE.md` 10, 12; `docs/design/COMPONENTS.md` 2.21, 2.22; `docs/design/SOUND.md` 3.
- Code: `apps/mobile/src/app/read-together.tsx`, `apps/mobile/src/lib/read-together.ts` (deleted in 71070c4), `apps/mobile/src/lib/resilience/keep-awake`, `apps/mobile/src/lib/audio-mode.ts`, `apps/mobile/app.config.ts`, `packages/core/src/plan.ts`, `packages/content/src/strings.en.ts` (`readTogether.*`, `book.recordingElsewhere`, `moments.firstReadTogether`), `apps/mobile/src/lib/copy.ts` (`pendingCopy.readTogether`), `packages/analytics/src/catalog.ts`.
- `docs/prd/v2/features/F08-recordings.md` (F08-REQ-006, -007, -011), `F11-co-parent.md` (F11-REQ-015, -016).
- Research: R1 F10 (R1-S13, R1-S18, R1-S48, R1-S67); R2 section 0 items 5 and 9, R2-S24, R2-S29.
- Opened 3 Oct 2026: Expo Audio docs, https://docs.expo.dev/versions/latest/sdk/audio/; Expo KeepAwake docs, https://docs.expo.dev/versions/latest/sdk/keep-awake/.
