# NX-36-S17: a returning parent signs in on a new phone and sees what arrived

Owner: design systems. Status: spec for `mobile`, `content` and `qa`, 10 Nov 2026 (UTC). Docs only: nothing here is built, no migration or function is written, and no string is live until the founder approves its row and `mobile` wires it in the same PR that moves it.
Signed: Chief Design Officer (Claude role).

Tags. EVIDENCE: read in the repo on `develop` at `c1f7cec51de9a193c5c7541c36518d9d048d052e`, or in the named PR head, this session. UNVERIFIED: not read, not run, or not measured (section 9). PROPOSED: my number or wording.

Sources read, with the heads I read them at (re-read through the REST API on 10 Nov):

| Source | Head |
|---|---|
| NX-36 screen specs, S17 and sections 2, 8, 10 to 12 (`docs/roadmap/next/03-requirements/NX-36-build-12-screen-specs.md` and `NX-36-wireframes.html`, branch `docs/nx-36-screen-specs-9nov`) | `1a30be2cd` (read from the branch tip) |
| #731 returning and new phone words, RW-01 to RW-44 | `e8108504b7347633b3180e90ff6df96f18a6b05e` |
| #732 You tab states (`docs/design/specs/YOU-TAB-STATES-9nov.md`) | `3d3498a200a4d88f35f17bc1df5e51a7130f7a23` |
| #733 NX-38 gaps R1 to R11 (`docs/requirements/NX-38-build12-must-have-gaps-9nov.md`) | `e1b0abeb5e7ddd50a210bae3869c0d63b1f50e96` |
| #724 welcome and sign in | `d4a9983b22fcd121fcf0bd43736d91246a643d11` |
| #728 code, consent, child | `3da02d5fb920cd57f03eb5f99d528de581b9a69b` |
| #737 new account and claim (`lib/first-run/*`, `(auth)/sign-in/consent.tsx`) | `cf7e107c6ae77accd285bd2cadc4c0617a69c6b3` |
| #738 You tab states | `0cd8e1f176ab6bbd50404a401e8fd0d4dc96db57` |
| #702 session counter (description only; draft) | `48b0d44e7af8ed5d0ab67a65f3461cc74b2f021f` |
| Sync, on `develop`: `apps/mobile/src/lib/sync/{engine,merge,outbox,ownership,types}.ts`, `packages/api/src/server/sync.ts`, `supabase/migrations/20261004100000`, `20261015000000`, `20261016000000`, `docs/adr/0025-sync-protocol-v1.md`, `docs/ARCHITECTURE.md`, `docs/prd/PRD.md` section 7.3 | `c1f7cec51` |
| Screens and words, on `develop`: `components/book/{letter-card,letter-card.logic,app-note,book-page.logic}`, `components/player/audio-player.tsx`, `lib/player/*`, `lib/export/build.logic.ts`, `components/settings/where-live.logic.ts`, `packages/content/src/{strings.en,features/player.en,features/auth.en}.ts`, `VOICE.md`, `BRAND.md`, `test/rules.test.ts` | `c1f7cec51` |

I read no hosted Supabase project, no device and no build. Every statement about "the server" below is about the SQL and TypeScript in the repo.

## 0. The short version

1. S17 is not blocked by three gaps. It is blocked by one real gap and two choices. The real gap is a route: nothing in the stack (#724, #728, #737, #738) shows a "your book is opening" state, and the first-run gate sends a signed-in phone with no book to the child step. On a second phone that can show "Who is this book for?" to a parent whose account already has a book, while the pull is still running. I call it gap 4 (section 1, F7). It is the only item that can make a duplicate book, so it comes first.
2. Gap 1 ("has local audio") is already answerable without any change: `entries.audio_uri IS NOT NULL`. What is missing is the other half, "a recording exists but is on another phone". The server already sends that on every pulled row of your own letters (`audio_kept_on_device`, in the pull since `20261004100000`). The phone throws it away when it inserts the row (`merge.ts`, `insertOwnRow`). Keeping it needs a small local SQLite column. It needs no server change and no migration on the server. No server function is needed for any tier below.
3. Gaps 2 and 3 (the two keys) are words, and one of them can be true without the per-letter fact. See section 4.
4. The card's VoiceOver label already says "Recording kept on this phone" for every spoken letter of your own, with or without a file (`letter-card.logic.ts`). On a new phone that is false for every pulled letter. This is a truth defect that ships with sync on, whatever S17 does. It is fixed in Tier 0.
5. Three tiers (section 7). Tier 0 is the floor and needs no counsel read: route, loading, the card label made true, a plain arrival line. Tier 1 adds the arrival line that mentions recordings, in a form that needs no new fact. Tier 2 adds the local column, the letter page line, and the optional card note. My recommendation: ship Tier 1 in Build 12, Tier 2 in 1.0.1.
6. Backup is off in every `eas.json` profile on `develop` (5 of 5 say `"EXPO_PUBLIC_BACKUP": "off"`), `capabilities.backup` also needs the server switch, and nothing else uploads audio. So it is true in Build 12 that the words travel and the recordings do not. A parent who loses or wipes the first phone has no recording anywhere in the app. Section 4 words every line so it stays true then and does not frighten.
7. #702 (the session counter) and the lock-offer move do not block S17 and S17 does not touch them (section 6.4).

## 1. What is true today (EVIDENCE)

| # | Fact | Where |
|---|---|---|
| F1 | A pull onto an empty phone brings the book and its letters. `sync_pull` loops over every book the person is a member of whether or not the phone asked for it, so a new phone needs no list from `sync_books`. | `20261016000000_sync_v1_server.sql` (the `for b in select ... from child_members` loop in `sync_pull`); `merge.ts` `buildPullRequest`, `mergeBook` |
| F2 | A page is 200 rows across all books (engine default `pageSize`, server maximum 500). One cycle reads at most 100 pages (20,000 rows); `lastSyncedAt` is written at the end of the cycle. Rows come in server write order (`order by x.sx, x.id`), not date order. The store notifies after every page, so letters appear while later pages are still coming. | `engine.ts` (`pageSize`, `MAX_PULL_PAGES`, `pullAll`); `20261016000000` (`jsonb_agg ... order by x.sx, x.id`) |
| F3 | Every pulled row of your own letters carries `audio_kept_on_device` (boolean). The wire schema makes it a required boolean. The phone sets it from `audio_uri !== null` when it builds the op. The server column is insert-only, so it records whether the letter had a recording on the phone at its first upload and is never updated. | `20261016000000` (pull, own branch); `packages/api/src/server/sync.ts:157,619`; `outbox.ts:180,466,494` |
| F4 | `insertOwnRow` does not read it. A pulled own letter is inserted with `audio_uri` NULL and no other recording fact. | `merge.ts` `insertOwnRow` |
| F5 | No audio travels. Backup is `"off"` in all 5 build profiles; `capabilities.backup` is `serverFeatures && EXPO_PUBLIC_BACKUP`; the Settings backup row shows only when `backupInBuild()`. The merge code says recordings "come back through the owner's backup (F08 6.5 B), never through sync". | `eas.json`; `app.config.ts:177`; `lib/capabilities.ts`; `lib/backup/gate.ts`; `merge.ts` doc on `applyHeldRows` |
| F6 | On the letter page an own spoken letter with no audio file already shows `playerCopy.notOnPhone` ("The recording for this letter is not on this phone.") and draws no play button. It cannot tell "recording is elsewhere" from "no recording was ever kept". | `audio-player.tsx`; `player.logic.ts` `recordingAvailability`; `player.en.ts` |
| F7 | `firstRunGate`: a session and no local book returns `childStep`. After "consent" on an account that has a book, `consent.tsx` calls `close()` and the gate decides again. The only thing that creates the local book is the first pull. So between close and the first page landing the gate says `childStep`. No `newPhone`, `arrivedWords`, `audioElsewhere` or "Opening your book" exists anywhere in the 4 heads or on `develop` (git grep). The race is read from the code, not run. | `gate.logic.ts`; `account-books.logic.ts` `afterConsent`; `consent.tsx` |
| F8 | The Book card's VoiceOver label adds "Recording kept on this phone" for `spoken && own`, whatever `audio_uri` holds. It is false on a new phone, and false on the first phone for a letter made with Keep recordings off. | `letter-card.logic.ts` `cardLabel`; `strings.en.ts` `book.recordingOnPhone` |
| F9 | `AppNote` draws the Microphone glyph (16 pt) plus a `footnote` muted line, the glyph hidden from VoiceOver. `COMPONENTS.md` 2.5b and NX-36 S17 say "Info glyph". The code is right (EXPERIENCE_PASS S26: the info icon read as a warning). I fixed the doc line in this PR. | `app-note.tsx`; `COMPONENTS.md` |
| F10 | `AppNote` is used today in place of the excerpt (waiting, no words). Nothing draws it as an extra line under a letter's words. S17's card note would be a new use. | `letter-card.tsx` `excerptOf` |
| F11 | Own letters never get the arrival wash. Only the other parent's letters do (`firstSeen`). So 200 pulled own letters do not flash. | `book.tsx` lines 81 to 149; `book.logic.ts` `firstSeen` |
| F12 | There is no manual "refresh letters" control on `develop`. `syncNow` is called only from account deletion, the join wait and leave. The Book has no pull to refresh. Account, Sync is a row with a value (`On`, `Off, kept on this phone`, `Not set up yet`, `Waiting for a connection`) and a "Finish setting up" or "Agree and sync" row, with no Try again row. NX-36 S17 and #731 section 6 point to one. | `settings/account.tsx`; `auth.en.ts` `account.sync`; grep of `syncNow` |
| F13 | "Where your letters live" says, when sync is on, "Your recordings are kept on this iPhone." That is false on a phone whose letters came from an account. The page also carries an "iPhone backup" line: "Includes your recordings, if iCloud Backup is on." with a counsel hold (CCO-8) on any line that says the backup brings the book back. | `strings.en.ts` `whereLive.onPhoneSynced`, `iphoneBackup` |
| F14 | Export on a phone with pulled own letters says nothing about missing recordings: `audioMissingReason` returns null when `!e.audioUri` ("Keep recordings was off: there never was a file"). | `lib/export/build.logic.ts:263 to 283` |
| F15 | The lock offer lives only on "The book is open." in `onboarding.tsx`. A returning parent does not pass through it. #702 adds a phone-local counter of sessions that end in a kept letter and moves nothing yet. | `onboarding.tsx:516`; #702 description |
| F16 | PRD budgets for this path (gate "Yes"): book list and child visible after sign-in, p95 10 s; all text for one year (about 240 entries), p95 30 s on LTE. Targets, not measurements. | `docs/prd/PRD.md` section 7.3 |

## 2. What the parent sees, in states

The path (NX-31-R12, NX-36 S17, #731 state 4): S1 (age, asked once on every phone) then S2 (same two buttons) then the code or Apple sheet, then consent. If the account has a book and this phone has none: no child step, no signature step, no reminder or lock card in that session, and the person lands on Tonight (S13). If the account has no book: the existing "No book here yet" screen (#731 state 2). A different Apple Account or email than last time gets that screen, and that is how they find out. S17 starts after `afterConsent(kind)` returns `close` for `hasBook`.

Nothing here adds motion. Every state uses an existing component.

### 2.1 State map

| State | Trigger (existing data) | What shows | Keys |
|---|---|---|---|
| A. Opening | Signed in, consent answered, account has a book, the phone has no book | `StateScreen kind="loading"`: the `moon` drawing (breathes, still under Reduce Motion), `title2` heading, one `body` sentence, no buttons | `authCopy.newPhone.loading`, `.loadingBody` |
| B. Arrived | The book exists on the phone and the first pull cycle is done, or 10 s have passed with a book | Tonight (S13). On the first Book the person opens: the arrival line, then the Book as it is | `authCopy.newPhone.arrivedWords` or `.arrivedPlain` |
| C. Slow | 10 s with no book on the phone, or the engine phase is `auth`, `paused_server` or a server failure | `StateScreen kind="error"` (never red; the envelope drawing), heading, one sentence, primary "Try again", quiet "Try another way" | `authCopy.newPhone.slowTitle`, `.slowBody`; reuse `authCopy.outage.retry`, `authCopy.consent.noBook.tryAnother` |
| D. Offline | No book yet, and the phone has no connection | `StateScreen kind="error"`, the same shape, retries by itself when the connection returns (the S3 rule) | `authCopy.newPhone.offlineTitle`; reuse `authCopy.offline.body` (RW-42) |
| E. Partial | The book exists; some pages did not arrive | The letters that arrived. No line. The engine retries on foreground (5 s minimum gap), after a save and on its backoff timer | none |
| F. Large book | More than one page (more than 200 letters across the account) | As B; see 2.5 | none |
| G. Empty | The account's book has no letters | The Book's own empty state. The plain arrival line above it | `authCopy.newPhone.arrivedPlain` |
| H. Typed only | No spoken own letter in the book | As B with the plain line | `authCopy.newPhone.arrivedPlain` |

### 2.2 A. Opening (the route)

This is the one piece of S17 that cannot be skipped (F7).

- Rule for `mobile` (PROPOSED shape, `mobile` owns the code): a phone with a session and no local book never shows the child step until it knows the account has no book. It asks `readAccountBooks` (exists in #737, bounded at 10 s, fail-safe to `unknown`). `hasBook` means state A. `new` means the child step. `returningNoBook` and `unknown` mean "No book here yet". After a kill and relaunch the same question is asked again, so the answer is not stored and cannot go stale.
- Leaving A: when the phone has the book and (`SyncStatus.phase` is not `syncing` and `lastSyncedAt` is set, or 10 s have passed since A began). Both fields exist today (`types.ts` `SyncStatus`), so no engine change is needed. If the book is still not on the phone at 10 s, go to C.
- Why 10 s: it is the PRD budget for "book list and child visible after sign-in" (F16) and the session gate's own timeout (`GATE_TIMEOUT_MS`), so a person meets one number everywhere. PROPOSED, not measured.
- Layout: `StateScreen` is centred with 20 pt gutters. Heading `title2`, sentence `body`. No button (loading never carries a primary). VoiceOver: the region is busy and announced once, politely.
- No count, no percentage, no "3 of 12". A spinner never appears.

### 2.3 B. Arrived

Landing is Tonight (S13), unchanged. S13's "From the book" row picks from letters on the phone when the person first sees it; `mobile` takes that pick after state A ends so it does not change when later pages arrive (UNVERIFIED how S13 re-picks).

The arrival line, on the first Book the person opens after arrival:
- Plain text at the top of the list, above the first chapter. `callout` style, `textMuted`, 20 pt gutters, 12 pt below. Not a card, no icon, no button, no dismiss (NX-36 S17; the one ask per session still holds, and this is not an ask).
- It shows once. `mobile` keeps one local setting, `newPhone.arrivalShown`, written when the Book that showed it is left. It never leaves the phone, holds no name, date or text, and is cleared by Erase everything on this phone.
- Which words: `arrivedWords` if at least one own spoken letter on the phone has no local audio (a query on data already stored: `capture_mode <> 'typed'`, own, `audio_uri IS NULL`); otherwise `arrivedPlain`. Evaluated when state A ends. A line that talks about recordings is never shown for a book of typed letters.
- VoiceOver reads it first on the Book, then the rest of the list.

Cards on the Book:
- Tier 0 and Tier 1: unchanged to the eye. The VoiceOver label stops saying "Recording kept on this phone" unless the letter has a recording file reference on the phone (F8). It says nothing about the recording otherwise.
- Tier 2, option P (ruled in NX-36 S17): each affected card gets the AppNote line under the signature row.
- Tier 2, option Q (my recommendation): no note on cards. The card is silent; the letter page says it.
- Why Q: on a book of 200 spoken letters, P prints "The recording stayed on the phone it was made on." 200 times and VoiceOver reads it 200 times. That is a list of what each letter lacks, which is the gap-counting VOICE.md rules out ("celebrate what exists"), repeated at the speed of scrolling. The arrival line already says it once, and the letter page says it where the play button would be, which is where a person looks for it. This is decision D3 in section 8.

### 2.4 The letter page

For an own spoken letter, four cases (today there are two lines; Tier 2 makes four):

| Case | `audio_uri` | file | `audio_elsewhere` | Shows |
|---|---|---|---|---|
| 1 playable | set | exists | any | The player, as today |
| 2 file missing | set | missing | any | `playerCopy.notOnPhone`, as today |
| 3 elsewhere | NULL | none | 1 | `sync.audioElsewhere.line` in an `AppNote`, where the play button would be. 0 play buttons |
| 4 none | NULL | none | 0 | Nothing. No note, no play button. (Today this case shows `notOnPhone`, which wrongly implies a recording exists; F6) |

Tier 0 and Tier 1 leave the page as it is today: cases 3 and 4 are one case showing `playerCopy.notOnPhone`. That sentence is true wherever a recording exists, and for a letter that never had one it is mildly misleading but not false of "this phone". It is not new and not blocking.

The line uses `AppNote` (footnote, muted, Microphone glyph hidden from VoiceOver, no signature, never the letter's type: D-084). The existing `notOnPhone` is drawn as `body` muted, not `AppNote`; when Tier 2 lands both use `AppNote` so the two notes look alike.

### 2.5 F. Large book and E. Partial

- A year of daily letters is about 240 (PRD figure), so 2 pages. Five years is about 1,200, so 6 pages. One cycle can read 20,000. Build 12 books will be small; the rule below is for the first big family.
- Rule: A ends at 10 s at the latest. If the cycle is still running, the person lands on Tonight with what has arrived and the rest keeps coming. No progress bar, no count, no "still arriving" line (that counts a gap, #731 section 6).
- Because rows arrive in server write order (F2), the Book (newest first) can show older letters at the top until the later pages land, then the newest slide in at the top. UNVERIFIED by a run. If the two-phone run shows it, the cheapest fix is to hold A until the first cycle finishes (not only 10 s), which is decision D5; do not add a new motion to hide it.
- Own letters never wash on arrival (F11), so nothing flashes.
- Partial: whatever arrived stays. There is no manual retry on `develop` (F12). The retry is automatic. NX-36's "Try again row in Account, Sync" does not exist; it is gap G2.

### 2.6 What does not arrive, and edge cases

- Held drafts and voice-only letters waiting for their words sync as author-only held rows (server switch `app.held_sync`, `20261016000000`). On a new phone they arrive without the recording, and the transcription cannot run. What the Book shows for such a letter is UNVERIFIED. Flag for `mobile`: confirm before the two-phone run.
- A reinstall on the same phone, or a replacement for a lost phone: the first phone is gone, so "your other phone" would be untrue. This is why the recommended words (section 4) say what happened, not where the file is now.
- A phone restored from an iPhone or iCloud backup arrives with its own database and files; that is not S17. S17 words must not mention iPhone backup or iCloud (F13, CCO-8).
- More than one book: the arrival line is one per phone, not per book.
- Nameless book: the line names no child.

## 3. The data fact engineering needs (part b)

Two facts, named so the code and this file say the same thing.

| Fact | Meaning | Source today | Needs |
|---|---|---|---|
| `hasLocalAudio` | This phone holds a reference to a recording file for the letter | `entries.audio_uri IS NOT NULL` (the `Entry.audioUri` field, already read by the card). On the letter page the file check stays `availabilityOf` | Nothing. Exists |
| `recordingElsewhere` | The letter had a recording on the phone that made it, and this phone does not hold it | The server's `audio_kept_on_device` on the pulled own row, true, with `audio_uri IS NULL` locally | A local column. Details below |

The honest meaning of `recordingElsewhere` is narrow, and the words must match it: "the phone that made this letter kept a recording at the moment it first sent the letter". It does not say the file still exists, or where it is now (F3: insert-only).

Local change (Tier 2 only; mobile-owned; no server change, no server migration, no function):
- Add `entries.audio_elsewhere INTEGER NOT NULL DEFAULT 0` as local migration 10 (the last one on `develop` is version 9 in `lib/db/migrations.ts`). Class L2 like `held_v`. Never synced, never in analytics, not in Export.
- `insertOwnRow` writes `row.audio_kept_on_device ? 1 : 0`. `mergeOtherRow` does not (the other parent's recordings have their own line, `book.recordingElsewhere`, and co-parent is hidden in Build 12).
- `mergeExistingOwnRow` does not change it. When a recording is adopted from a held draft (`adoptHeldDraft` sets `audio_uri`) the column is ignored because `hasLocalAudio` wins.
- Rule that never lies: show `recordingElsewhere` only when `audio_uri IS NULL AND audio_elsewhere = 1`. When the answer is 0 or unknown, say nothing.
- No backfill: a letter already on a phone either has its file or was made without one.
- Review: this is on the sync merge path, a class where "anything that can lose a word" is S0 in the 1 Nov audit legend. The change adds a column and one value in an INSERT; it deletes and updates nothing. The sync steward reads it.

A server change would be needed only for something this file does not ask for: a per-letter fact that survives the first phone being wiped (for example, a server-held record of which device holds the file, or a deleted-recording marker). That is a migration and a function, it is founder-gated, and I do not recommend it for Build 12. The route to recordings actually travelling is backup (F08, `20261023000000_backup_server.sql`), which is off by design and a separate founder decision.

Consumers of the facts (so none is forgotten):
1. Card VoiceOver label (Tier 0): `hasLocalAudio` only.
2. Arrival line choice (Tier 1): the local query in 2.3, no new column.
3. Letter page case 3 and 4 (Tier 2): `recordingElsewhere`.
4. `whereLive.onPhoneSynced` (words, section 4): no fact needed.
5. Export (`audioMissingReason`, F14): with `recordingElsewhere`, return `not_on_this_device` instead of null. Tier 2, low priority.
6. Analytics: `letter_opened.has_audio` is `!!e.audioUri`, so on a new phone it is false for spoken letters. It means "a recording is on this phone". Leave as is; analytics are off in every 1.0 profile.

## 4. Words (part c)

Rules applied (VOICE.md, BRAND.md, `rules.test.ts`): parent vocabulary (book, letter, recording, words, phone); no dash of any kind, curly quote, ellipsis character or emoji; no "we" or "our" outside the sanctioned promises; nothing implies software wrote anything; no count of gaps; never "safe", "backed up", "restore", "lost", "missing", "gone", "waiting for", "on their way"; no brand name; `{child}` never gendered (none of these names the child). Buttons 22 characters or fewer. All rows need founder word approval. COUNSEL-READ means the string states where something is kept or what is promised (it is a registered row).

### 4.1 The recording sentence: three options

NX-36 S17 and RW-34 propose "The recording is on your other phone." Content (#731 section 6) asks whether "the phone it was made on" is better. My reading of what the data supports (F3, section 3) is narrower than both:

| | Words | Chars | Problem |
|---|---|---|---|
| A | The recording is on your other phone. | 37 | Says the file is on a phone the person still has. Untrue after a lost, wiped or replaced phone, and after a reinstall. Can sting |
| B | The recording is on the phone it was made on. | 45 | Present tense, so the same untruth if that phone is wiped. Kinder than A |
| C (recommended) | The recording stayed on the phone it was made on. | 49 | Past tense. States only what happened: it was kept where it was made. True in every case above. Matches the sentence VOICE.md already uses ("Recordings stay on the phone that made them") |

I recommend C for the letter page. It does not promise the file can be found, does not promise it will arrive later, mentions no backup, and uses no word from the avoid list. The founder chooses (D2).

### 4.2 Keys

| Key | Words (recommended) | Chars | Kind | COUNSEL-READ | Notes |
|---|---|---|---|---|---|
| `authCopy.newPhone.loading` | Opening your book. | 18 | NEW (RW-32) | no | Heading of state A. Same words as #731 |
| `authCopy.newPhone.loadingBody` | Your letters are coming across. | 31 | NEW | no | One sentence under the heading. States no location and no count |
| `authCopy.newPhone.arrivedPlain` | Your book is here. | 18 | NEW | no | Tier 0. The line when no spoken letter lacks its recording, and for an empty book |
| `authCopy.newPhone.arrivedWords` | Your book is here. The words came across. Recordings stay on the phone that made them. | 86 | NEW (RW-33 reworded) | **yes** | Tier 1. Says where recordings are. The last sentence is VOICE.md's own wording of the v1.0 promise and is general, so it needs no per-letter fact and is true for any book |
| `authCopy.newPhone.slowTitle` | Your book is taking a while. | 28 | NEW | no | Heading of state C. No blame, no alarm |
| `authCopy.newPhone.slowBody` | Check your connection, then try again. | 38 | NEW | no | One sentence |
| `authCopy.newPhone.offlineTitle` | Opening your book needs a connection. | 37 | NEW | no | Heading of state D. Body reuses `authCopy.offline.body` (RW-42): "Try again when you are back online." |
| `sync.audioElsewhere.line` | The recording stayed on the phone it was made on. (option C) | 49 | NEW (RW-34) | **yes** | Tier 2. Letter page case 3, and the card only if the founder chooses option P |
| `whereLive.onPhoneSynced` (second sentence) | Each recording is kept on the iPhone that made it. | 50 | CHANGED | **yes** (registered) | Replaces "Your recordings are kept on this iPhone." which is untrue on a phone whose letters came from an account (F13). True on every phone. The first sentence ("...kept on this iPhone and on our servers.") is unchanged |

Reused, not new: `authCopy.outage.retry` "Try again" (RW-38, still a proposal), `authCopy.consent.noBook.tryAnother` "Try another way" (registered; its hint says it signs out), `authCopy.offline.body` (RW-42), `playerCopy.notOnPhone` (kept for case 2 and for Tier 0 and 1).

Dropped from #731: RW-35 `sync.audioElsewhere.label`. The line is plain text to VoiceOver, so a separate label with the same words adds a string and nothing else. If `content` wants one, it equals the line.

Hint for the arrival line: none. It is not a control.

### 4.3 Not used, so nobody adds them back

"Your recordings are safe", "kept safe", "backed up", "restore", "come with you", "missing", "lost", "waiting for", "still on their way", "some letters", "3 of 12", any count; "on your other phone" if option C is chosen; any mention of iPhone backup or iCloud (counsel hold, CCO-8); "we" in any of these.

### 4.4 Content-rule check (by hand; the repo test was not run)

I checked each string above by script for: no U+2014, U+2013, curly quotes, U+2026 or emoji; no `\b(we|our)\b`; no `safe|backed up|restore|lost|missing|gone|waiting for|on their way`; no digit; buttons not used. All pass. The strings are not in `packages/content` yet, so `rules.test.ts` cannot see them; the PR that moves them in repeats the check. The numeral "5" in section 2 is documentation, not a string.

## 5. Accessibility and motion (part d)

WCAG 2.2 AA and Apple HIG; A-NFR-005 to A-NFR-007, B-NFR-006, LEGAL-REQ-051, D-027. No new token, no new component.

| Concern | Spec |
|---|---|
| Components | `StateScreen` (A, C, D), `Text` (`callout`, `body`), `AppNote` (letter page; card only under option P), `Button` (via StateScreen). Nothing new |
| Dynamic Type to AX5 | The arrival line, the card note and the letter-page note wrap and grow; none is truncated, none has `numberOfLines`. The AppNote glyph does not scale; the words beside it do. State screens: the block scrolls, the actions stay put, a button label wraps to two lines at AX5 (Button spec: never truncates). On a 320 pt phone at AX5 the arrival line is 5 to 7 lines; that is correct |
| Smallest text | The note is `footnote`, 13 pt at the default size (`tokens.minFontSize`). The arrival line is `callout` (15 pt) because it carries the one truth about recordings |
| Contrast | Arrival line, `textMuted` on `bg`: 5.51 : 1 light, 8.01 : 1 dark. Card note, `textMuted` on `surfaceRaised`: 5.83 : 1 light, 7.32 : 1 dark (NX-36 had 8.01 for the dark card, which is the `bg` pair; the card pair is 7.32). Letter page note on `bg`: 5.51 and 8.01. State screens use existing roles. Ratios are the NX-36 section 2.5 numbers on token hex values; I did not recompute them |
| Colour is never the only signal | Every note is words plus the Microphone glyph. The slow and offline states carry words and the envelope drawing, never red |
| Targets | The state screens' buttons: primary 56 pt, quiet 44 pt. The arrival line and notes are not controls |
| VoiceOver, focus | Each state moves focus to its heading on arrival (`useFocusOnMount`, A11Y-F09). A: heading then sentence, region busy, announced once. B: the arrival line is the first element of the Book, then the months. The Microphone glyph is hidden. Cards: one element, composed label (dateline, signature, words); the recording clause only when `hasLocalAudio` (Tier 0) or, under option P, the line (Tier 2). Letter page case 3: the note is read where the play button would be; no "button" role anywhere on it |
| VoiceOver, announce | State A and C use the StateScreen polite live region. The arrival line is not announced on its own; it is read in order. Nothing is announced as a stream. No page-by-page progress |
| Reduce Motion | A: the drawing is still (Breathe is off under Reduce Motion, `state-screen.tsx`). The arrival line and notes have no entrance. Landing uses the route's existing transition, which already falls back to the one 200 ms fade |
| Reduce Transparency, Increase Contrast | Plain paper, no lamp; `line` at control strength (`tokens.highContrast`). The notes use no blur |
| Motion tokens | None added. The Book's existing cold launch stagger and layout rules stay. Own letters do not wash (F11) |
| Haptics, sound | None |
| Dark | Cards draw the 1 pt `line` edge as today; the notes use `textMuted` of the dark set |
| Name absent | The Book title falls back to `onboarding.childFallback`. No string names the child |

## 6. Acceptance criteria and tests (part e)

Titles start with the id in brackets (BACKLOG Definition of Done 1). "Layer" is the existing layer. File names are PROPOSED. Tier is the lowest tier that needs the row.

### 6.1 Given, When, Then

| AC | Tier | Criterion |
|---|---|---|
| AC-01 | 0 | Given a signed-in phone with no book and an account that has one, When consent closes, Then the person sees "Opening your book." and never the child step, and no second book is made |
| AC-02 | 0 | Given AC-01, When the app is killed and reopened during the wait, Then the same question is asked again and the same screen shows |
| AC-03 | 0 | Given state A, When the book is on the phone and the first pull cycle is done, or 10 s have passed with a book, Then the person is on Tonight |
| AC-04 | 0 | Given 10 s with no book on the phone, Then state C shows with "Try again" and "Try another way", in no red, and "Try another way" signs out |
| AC-05 | 0 | Given no connection before the book exists, Then state D shows and retries by itself when the connection returns |
| AC-06 | 0 | Given a spoken own letter pulled onto this phone, Then its card label does not say "Recording kept on this phone" |
| AC-07 | 0 | Given the first Book view after arrival, Then the arrival line shows once at the top and never again |
| AC-08 | 0 | Given an empty account book, Then the Book's own empty state shows with the plain arrival line |
| AC-09 | 0 | Given a partial pull, Then the letters that arrived show, no line talks about the rest, and the engine tries again on the next foreground |
| AC-10 | 0 | Given arrival, Then no lock offer, reminder ask or analytics ask shows in that session, and the kept-letter session counter (#702) is unchanged |
| AC-11 | 1 | Given a book with at least one own spoken letter that has no local audio, Then the arrival line is `arrivedWords`; given none, it is `arrivedPlain` |
| AC-12 | 2 | Given a pulled own letter with `audio_kept_on_device` true, Then the phone stores `audio_elsewhere = 1`; with false, 0; a letter with a local file is never shown as elsewhere |
| AC-13 | 2 | Given letter page case 3, Then the note shows, there are 0 play buttons and VoiceOver reads the note; case 4 shows nothing |
| AC-14 | 2 | Given option P is chosen, Then the card shows the note and its label carries it once; given option Q, the card shows and says nothing about the recording |
| AC-15 | 1 | Given a phone whose letters came from an account, Then no string says "Your recordings are kept on this iPhone" (`whereLive.onPhoneSynced` changed) |
| AC-16 | 2 | Given Export on a phone with `recordingElsewhere` letters, Then each such letter is listed `not_on_this_device` |

### 6.2 Named tests

| Test title | Layer and file | AC |
|---|---|---|
| `[NX-36-S17] a signed-in phone with no book, on an account that has one, shows Opening your book and never the child step` | mobile unit, `test/new-phone-route.test.ts` (extends `first-run-gate.test.ts`) | AC-01 |
| `[NX-36-S17] after a kill during the wait the account is asked again and the child step is not shown` | same | AC-02 |
| `[NX-36-S17] the opening screen ends when the book exists and the first cycle is done, or at 10 seconds with a book` | same | AC-03 |
| `[NX-36-S17] no book at 10 seconds shows the slow state with Try again and Try another way, and it is not red` | same | AC-04 |
| `[NX-36-S17] with no connection before the book exists the connection state shows and retries when the connection returns` | same | AC-05 |
| `[NX-36-S17] an unreadable or timed out account answer still shows No book here yet` | same (exists in #737; keep) | fail-safe |
| `[NX-36-S17] a card label says Recording kept on this phone only when the letter has a recording reference on this phone` | mobile unit, `test/card-recording-label.test.ts` | AC-06 |
| `[NX-36-S17] the arrival line shows once on the first Book view and never again` | mobile unit, `test/new-phone-line.test.ts` | AC-07 |
| `[NX-36-S17] an empty book gets the plain line and the Book's own empty state` | same | AC-08 |
| `[NX-36-S17] the arrival line carries no numeral and no child name` | same | words |
| `[NX-36-S17] the line that mentions recordings shows only when a spoken own letter has no local audio` | same | AC-11 |
| `[NX-36-S17] a first pull onto an empty phone brings every letter's words and dates and leaves audio_uri null` | sync e2e, extends `test/sync-e2e.test.ts` (PGlite) | F1, F4 |
| `[NX-36-S17] a pull of 450 letters over three pages shows letters after page one and ends with 450 and no duplicate` | same | F2, AC-09 |
| `[NX-36-S17] a failed second page keeps the first page's letters and the next cycle completes the book` | same | AC-09 |
| `[NX-36-S17] arrival shows no lock offer, reminder ask or analytics ask and leaves keptLetterSessions() unchanged` | mobile unit, `test/new-phone-route.test.ts` (after #702) | AC-10 |
| `[NX-36-S17] a pulled own letter stores audio_elsewhere from audio_kept_on_device` | sync e2e | AC-12 |
| `[NX-36-S17] a letter whose recording this phone holds is never marked elsewhere` | sync e2e | AC-12 |
| `[NX-36-S17] the letter page gives playable, missing file, elsewhere and none for the four cases` | mobile unit, `test/audio-elsewhere.test.ts` | AC-13 |
| `[NX-36-S17] the elsewhere case draws 0 play buttons and the none case draws no note` | same | AC-13 |
| `[NX-36-S17] the card note and the card label agree with the chosen option` | same | AC-14 |
| `[NX-36-S17] whereLive never says recordings are kept on this iPhone for an account phone` | `packages/content/test` or mobile `where-live.test.ts` | AC-15 |
| `[NX-36-S17] every new-phone string passes the content rules and none contains a count, "we", safe, backed up, restore, lost, missing or waiting for` | content, `test/new-phone-words.test.ts` | section 4 |
| `[NX-36-S17] the note and the arrival line have no line limit and the glyph is hidden from VoiceOver` | mobile unit (logic) | section 5 |
| `[NX-36-S17] an export marks a recordingElsewhere letter not_on_this_device` | mobile unit, `lib/export` test | AC-16 |

Device rows (`qa` numbers them above the claimed ids, as the council found collisions): two phones and two Apple Accounts, which only the founder has (BL-791, BL-766). D17-1 sign in on phone B with the account of phone A and walk A to B; D17-2 airplane mode during the pull, then back online; D17-3 kill during the pull and relaunch (no child step, no duplicate book); D17-4 a fictional "Asha" account seeded with 1,200 letters, to see page by page arrival and the Book's top; D17-5 VoiceOver walk of states A to E and the letter page; D17-6 AX5 on a 320 pt phone; D17-7 Reduce Motion and Reduce Transparency; D17-8 dark; D17-9 a different Apple Account gets "No book here yet"; D17-10 a held draft and a waiting letter on phone A, then phone B.

### 6.3 Design QA checklist (tick on a device, with date and build)

- [ ] The child step is never shown to an account that has a book.
- [ ] A, C, D: heading focused first; busy announced once; no red; no count.
- [ ] The arrival line is the first thing VoiceOver reads on the Book, once.
- [ ] 0 play buttons for a letter with no local audio.
- [ ] No card label says "Recording kept on this phone" for a letter without a file reference.
- [ ] AX5 on 320 pt: 0 clipped lines, 0 truncated letter text, buttons whole.
- [ ] Contrast of the line and notes in light and dark (5.51 / 8.01 on `bg`; 5.83 / 7.32 on a card).
- [ ] Reduce Motion: no breathing, no entrance.
- [ ] No string contains a forbidden character, count, "we", or a safekeeping claim.
- [ ] Nothing leaves the phone that was not already allowed; no analytics added.

### 6.4 The lock offer move and #702

- S17 adds no ask. The reminder and lock asks come after a kept letter (S11 and S12); an arrival with no letter kept triggers none, and the "no reminder or lock card in that session" rule holds with no code.
- The counter is phone-local and starts at 0 on a new phone, so a returning parent is offered the lock after the third session that ends in a kept letter on that phone, like anyone. A returning parent who only reads is never offered it; the lock stays in Settings, App lock. I recommend that, and that arrival does not count as a session (AC-10). If product wants a new phone to offer the lock sooner, that is a #702 follow-up, not S17.
- The move itself (off "The book is open." to session 3) does not change S17, which never visits that step (F15). The two items do not depend on each other and can merge in either order.

## 7. Minimum viable S17 and the fallback (part f)

| Tier | What ships | New strings | Counsel | Local schema | Server | Size (my estimate) |
|---|---|---|---|---|---|---|
| 0, the floor | Route (A, C, D) so the child step never shows; the card label made true; the plain arrival line; the existing letter page line stays | 6 non-registered keys: `loading`, `loadingBody`, `arrivedPlain`, `slowTitle`, `slowBody`, `offlineTitle` (and reuse of 3 existing) | none | none | none | M for the route, S for the rest |
| 1, recommended for Build 12 | Tier 0 plus `arrivedWords` chosen by a query on data already stored, plus the `whereLive.onPhoneSynced` correction | + 2 registered | `arrivedWords`, `whereLive.onPhoneSynced` | none | none | S |
| 2, 1.0.1 | Tier 1 plus the local column, letter page cases 3 and 4, the Export marker, optionally the card note (option P) | + 1 registered (`sync.audioElsewhere.line`) | the line | local migration 10 | none | M |

Tier 0 is honest on its own: every sentence it adds is true, and a parent still learns about recordings from the letter page, which already says the recording is not on this phone. Its cost is that the parent first hears about recordings on opening a spoken letter, not on arrival. That is the trade the founder accepts by choosing Tier 0 over Tier 1.

Why the route is in Tier 0 and not optional: without it the second phone can open the child step on an account that has a book (F7). That risks a duplicate book, the one thing the "No book here yet" fail-safe was built to prevent (`account-books.logic.ts`). It is read from the code and not run, so the two-phone run must confirm it. If the run shows the child step never appears (the pull always wins), A shrinks to a guard and a loading frame, but I would still ship it.

The fallback rule (ship the staged on-device binary now; account-first in 1.0.1) means this for S17:
- The staged binary has server features off, no sign-in and no sync. `firstRunGate` returns `unchanged` and S17 cannot be reached. Nothing in this file ships in it, and it needs nothing from this file. No second phone exists there.
- S17 is a condition of turning account-first on, in any version, not of the staged binary. Tier 0 is the floor for 1.0.1 account-first, and Tier 1 should join it.
- If Tier 0 cannot ship by the Build 12 decision day, that is a reason for the fallback, not for shipping sync on without S17. Without it the second phone has a possible duplicate book and a card label that states something false. I recommend that the fallback decision treat "Tier 0 done and the two-phone run passed" as a gate of its own, in the same family as the NX-38 gates.
- People on the staged binary who later update to 1.0.1 take the claim path (their letters are on the phone), not S17; their recordings stay where they are. S17 appears when they sign in on a second phone.
- The fallback does not change the words: no Tier 1 or 2 line is shipped in the staged binary, so no counsel read is spent on it.

## 8. Gaps that remain and decisions for the founder

### Gaps that remain

| # | Gap | Owner | Blocks |
|---|---|---|---|
| G1 | No route state for "signed in, account has a book, pull not landed" (F7). New, not one of the three | `mobile` | Tier 0 |
| G2 | No manual way to refresh letters on `develop` (F12); NX-36 S17 and #731 section 6 point to an Account, Sync row that is not there | `mobile`, `design systems` (spec a row if wanted) | nothing in Tier 0 to 2; partial pulls rely on automatic retry |
| G3 | Card label says "Recording kept on this phone" for every spoken own letter (F8), including on the first phone with Keep recordings off | `mobile` | Tier 0 |
| G4 | `whereLive.onPhoneSynced` untrue on a new phone (F13) | `content`, counsel | Tier 1 |
| G5 | Export README silent about missing recordings on a new phone (F14) | `mobile` | Tier 2 |
| G6 | Held drafts and waiting letters arrive without a recording and cannot be transcribed on the new phone; display UNVERIFIED (2.6) | `mobile`, sync steward | confirm before the run |
| G7 | Pull order is write order; the Book may show older letters on top until the end of a large pull (F2), UNVERIFIED by run | `mobile`, `qa` | D5 |
| G8 | The recording is nowhere in the app if the first phone is lost, wiped or reinstalled, because backup is off. True, and the words avoid hiding it or frightening | founder, counsel | words only |
| G9 | Two phones and two Apple Accounts are needed to close any of this; only the founder has them (BL-791, BL-766) | founder | verification |
| G10 | `letter_opened.has_audio` means "a recording is on this phone" (6, consumer 6); the TRACKING_PLAN line should say so | `analytics` | none |

### Decisions for the founder

| # | Decision | Recommendation |
|---|---|---|
| D1 | Which tier ships in Build 12 | Tier 1. Tier 0 if counsel cannot read two strings in time. Tier 2 in 1.0.1 |
| D2 | The recording sentence: A, B or C (4.1) | C. A and B claim where the file is now |
| D3 | A note on every affected card (P, as NX-36 rules) or on the letter page only (Q) | Q. P repeats what each letter lacks |
| D4 | Arrival line on the first Book (ruled) or also on Tonight | Keep the ruling: one place. A person who goes straight to record still meets the truth on any spoken letter |
| D5 | State A ends at 10 s, or waits for the whole first cycle | 10 s. Revisit if the 1,200 letter run shows the Book's top changing |
| D6 | Never mention iPhone backup or iCloud in S17 words | Yes, until the restore drill passes (CCO-8) |
| D7 | Counsel to read `arrivedWords`, `sync.audioElsewhere.line` and the `whereLive.onPhoneSynced` change | Yes; none of the three promises a backup, a deletion or a future arrival |
| D8 | Local migration 10 (Tier 2): one column, no server change | Approve for 1.0.1 with the sync steward's read. Not founder-gated by the server rule, flagged because it touches the sync merge path |
| D9 | Accept that on arrival a parent is told only what is true now: the words came across and recordings stay on the phone that made them. Nothing says they can get them back | Yes. This is the honest Build 12 position |

## 9. UNVERIFIED, and what I did not read

- Everything on a device: the route race (F7), VoiceOver speech and focus, AX5, Reduce Motion, the Book's top during a large pull, the look of the notes.
- The hosted Supabase project: whether the migrations through `20261016000000` are applied, whether `app.held_sync` is on, and the real pull timing against the PRD budgets. D31-18 says the first-run create migration was not live on one date; I did not check any project.
- Whether the Build 12 profile sets `EXPO_PUBLIC_SERVER_FEATURES` on (on `develop`, `production` and `testflight` say "off" and `preview` says "on"; #698 and the cut decide it) and whether `EXPO_PUBLIC_BACKUP` stays off there. The 5 profiles I read all say off.
- Where the Keep recordings setting lives and whether a recording can be removed from a letter after it is kept. The Export code comment says a letter made with it off has no file.
- How S13's "From the book" re-picks when later pages arrive.
- What the Book shows for a pulled waiting letter or held draft.
- #702 beyond its description and the sequencer reorder, which is not written.
- The `book_entries` view's columns for the other parent's letters (not needed while co-parent is hidden).
- Contrast ratios are NX-36's, computed on token hex values; I did not recompute them.
- I did not run `npm install`, `npm test` or any build, as asked. The content-rule check in 4.4 is by script on the proposed text only.
- The wireframes use stand-in typefaces and an illustrative 2.4 scale for AX5, like NX-36's.

## 10. Where this file and others differ

| Other file | Says | This file |
|---|---|---|
| NX-36 S17 | AppNote with the Info glyph; the note on each card; the retry in Account, Sync | Microphone glyph (code); note on the letter page, card optional (D3); no such row exists (G2) |
| #731 RW-33, RW-34, RW-35 | "The words came across; the recordings are still on your other phone." and "The recording is on your other phone." | Reworded to what the data supports (4.1, 4.2); RW-35 dropped |
| #731 RW-32 | Names the loading heading | Adopted; its screen did not exist (G1) |
| `COMPONENTS.md` 2.5b | Info glyph | Corrected to Microphone in this PR |
| NX-36 section 2.5 table, "Dark" row for S17 | `AppNote` 8.01 : 1 | On a dark card the pair is 7.32 : 1 (8.01 is on `bg`) |

Wireframes: `docs/design/specs/S17-NEW-PHONE-WIREFRAMES-10nov.html` (static, no scripts, no external requests; token hex values; light and dark; AX5 for the arrival; layout studies, not pixel specs).

Chief Design Officer (Claude role)
