# Next: core capability gaps (G-1)

Status: DRAFT for the founder. Docs only. It decides no scope, sets no price, assigns no id and merges nothing.
Date: Mon 9 Nov 2026 (UTC)
Written by: Product Manager (Claude role)
Trigger: the founder tested the newest TestFlight build and said the navigation should add more things and the landing page is dull, and asked for core capability gaps as well as a new-customer experience for account creation and account management.

Out of scope here, only referenced: the navigation and landing requirement is NX-30, new-customer onboarding is NX-31, account management is NX-32 (other agents are writing them). Nothing below repeats them.

## 0. How to read this

- Rank numbers are the rows of `08-ranked-backlog.md` section 2 (it has 32 rows, not 17; ranks 1 to 17 are launch trust work, 18 to 32 are the rest). "Slot 23.5" means "just after row 23 and before row 24".
- Ids like CVL-10, BK-05, FAM-17, OPEN-02 are from `docs/backlog/FUTURE.md` (the old roadmap). They are cited, not new. No BL, D or CR id is created here.
- Tags: EVIDENCE (a file or page I opened, named), HYPOTHESIS (our guess), UNVERIFIED (looked, could not confirm).
- "What is built" means the routes under `apps/mobile/src/app` and a text search of `apps/mobile/src` on `origin/develop` fetched 9 Nov 2026. Open PRs (125 on 8 Nov per 08) were not scanned, so "not built" means "not on develop".
- Competitor facts: each cites a URL I opened on 9 Nov 2026 (the App Store lookup record of the listing text) or a section of `02-benchmark.md` with its URL, and says which. Listing text is what the maker says, not what the app does.
- Severity is my judgement. Week 1 = how much a new parent in their first week notices or leaves over it. Keepsake = how much it matters to the promise that the book lasts. Sizes (S, M, L) are estimates, nothing was measured.
- Constitution test: does it write, rewrite, summarise or shape a person's words (`CLAUDE.md`)? Privacy test: does it put entry text, transcript, audio or a child name into analytics, logs, crash reports or an outside place?

## 1. What is already built or already ranked (so not a gap)

| Expectation | Where it stands | Cite |
|---|---|---|
| Speak a letter, hear it back | Built: `write.tsx`, `review.tsx`, `listen.tsx`, `letter/[id].tsx`. Reliability is rank 14 | 08 rank 14 |
| Read it back with the child | Built: `read-together.tsx`. Word highlight is planned (BK-01), not built | FUTURE 3.2 rank 5 |
| Several children, due-date mode | Built: `settings/children/*`, "Before You" prompts in `(tabs)/index.tsx` | `01` section 0; F12 |
| Export everything | Built: `settings/export.tsx` (ZIP, and a PDF book per F15-REQ-009) | F15 |
| Delete account, erase phone, recently deleted | Built screens, gated by rank 9 | 08 rank 9 |
| A letter on my other phone, and a new phone | Rank 16 (words and dates); recordings are a gap, see G-1 below | `07` |
| Partner writes into the same book | Rank 25 (text), 31 (shared voice) | `09` |
| Relatives add a hello | Rank 31 | `11` |
| Backdate or add earlier letters, import voice memos | Rank 29 (dates built and tested; import blocked on counsel) | `NX-27` |
| Reminders that fit | Rank 23 | `10` |
| Names and languages | Rank 27 and 32 (English only now) | `12` |
| Face ID and app lock, appearance, privacy screens | Built: `settings/app-lock.tsx`, `appearance.tsx`, `privacy.tsx` | routes |
| Accessibility | A requirement (WCAG 2.2 AA, AX5, VoiceOver on every P0 flow, `docs/prd/v2/06-nfr.md`); evidence rows are inside rank 12. Not a feature gap, a proof gap | NFR |
| Account, navigation, landing, first run | NX-30, NX-31, NX-32 (not here) | other agents |

## 2. The gaps

Each gap: the parent's problem, evidence, severity, size, flags, where it fits, and the founder decision it needs.

### G-1 Your voice survives a lost or replaced phone

- Problem: I recorded my voice for {child}, then I changed phones, and only the words came across.
- Evidence: in v1.0 the recording lives on the phone that made it; rank 16 proves words and dates move, and NX-07-R7 shows a letter whose audio is "held on another phone" (`03-requirements/07-letters-on-every-phone.md`). Backup of every recording is OPEN-02, ranked 27 in the old roadmap as Plus, "later" (`FUTURE.md` section 3.5). The customer file's top need is "record, hear it back, never lose it" (`01-customer-needs.md` section 2 rank 1) and "nothing I made is held back" (rank 5). Competitor angle: Remento's whole pitch is the original voice kept with the book (`02-benchmark.md` section 1 item 3, https://www.remento.co/babybook).
- Severity: week 1 low (nobody changes phones in week 1); keepsake HIGH. The product's central promise is that the voice is kept; a lost phone without backup breaks it.
- Size: L (about 3 to 4 person-weeks per FUTURE OPEN-02, an old estimate, plus storage cost I have not priced).
- Constitution: clear (stores bytes, never changes them). Privacy: audio on a server is the most sensitive data we would hold; label answer, encryption custody (the Vault idea in FUTURE 7.3), purge and delete coverage, rank 4 test scope. Needs counsel and the data-steward.
- Fits: NEW, not in 08. Slot 16.5 (right after the two-phone proof, because it extends it). Dependent on ranks 5 and 6.
- Founder decision: do recordings back up free or only with Plus? FUTURE says Plus; the principle "Plus adds, it never gates what exists" and "Never held hostage" (`02-benchmark.md` section 7 item 2) point the other way. I do not recommend a side; it is the single biggest pricing-versus-promise question in this file. Also: say plainly in the launch copy that audio stays on the recording phone until this ships.

### G-2 Add a photo to a letter

- Problem: this is the first smile and I want the photo next to my words.
- Evidence: Baby Diary lists "Add a photo to any memory" (https://itunes.apple.com/lookup?id=6762714102&country=us, listing opened 9 Nov); Tiny Treasures lists voice messages and photos (https://itunes.apple.com/lookup?id=6788518267&country=us); Dearest lists photos and videos (https://itunes.apple.com/lookup?id=6790823627&country=us). Our own design benchmark proposes "a letter can carry its recording plus one or two photos" (`docs/design/BENCHMARK.md` line 53). The PRD says photos are optional and secondary and that photo-only entries are never allowed (`docs/prd/v2/03-goals-and-principles.md` line 109; FUTURE 7.4). Planned as CVL-10 with BK-17, "Later", rank 26 of the old roadmap, after the shared-voice media pipeline. Not built: no image picker in `apps/mobile/package.json` (searched 9 Nov).
- Severity: week 1 MEDIUM (it is a first-run expectation in this category and the lack will show in a store comparison; no measured loss); keepsake HIGH (a book of an 18-year-old's early life with no pictures is a thinner book).
- Size: M if photos stay on the phone and in the export; L if they sync (media pipeline) and print (BK-17 export cap of 3.9 GB).
- Constitution: clear, a photo adds no words. Rule to keep: one photo with a letter, never photo-only, no captions written by the machine, no faces detection (FUTURE 7.3, 7.4). Privacy: system picker only, no library access; strip location data when photos ship (LEGAL-REQ-013 as cited in `docs/prd/v2/10-changes-from-1.3.md` line 109); the photos label answer is already open (F14 in 08); a child's face is the most identifying data we would hold.
- Fits: NEW to 08. Slot 23.5 (local-only, M) with the synced version waiting for rank 31's media pipeline.
- Founder decision: photos in the first public release or 1.1; if yes, local-only first. Photos in Free (FUTURE says "one photo with a letter is Free").

### G-3 Share one letter with one person

- Problem: grandma should hear this one tonight, and I do not want to send the whole book.
- Evidence: the only share paths in the plan are the whole ZIP and a whole-book PDF per child (F15-REQ-009, `docs/prd/v2/features/F15-export.md`); no per-letter share action found in `letter/[id].tsx` (text search for share calls, 9 Nov). Relatives seeing and hearing is the second-ranked need (`01-customer-needs.md` section 2 rank 3), and the no-install answers rivals give are a phone line (Tiny Treasures) and a link (Remento) (`02-benchmark.md` section 7 item 3). Dearest lists "story share cards" (lookup 6790823627), which I would not copy (see section 4).
- Severity: week 1 MEDIUM to HIGH for a parent with a distant relative (HYPOTHESIS: it is the cheapest bridge until rank 31); keepsake low.
- Size: S to M: the system share sheet with the exact text, and the audio file as it was recorded. No link, no server.
- Constitution: clear if it shares the words and the recording exactly as saved, with no template, no "make it nicer" card, no summary line. Privacy: the same plaintext notice as export (DATA-REQ-056 in F15); the child's name may travel inside the shared text because the parent chose it; nothing is logged or counted beyond a content-free "share used" event if analytics is later allowed. A shared audio file contains only the parent's own voice, so the other-people-voices question counsel is asked about import does not apply.
- Fits: NEW. Slot 23.2 (S, no dependencies, uses `expo-sharing` already in the build).
- Founder decision: allow a per-letter share at all (it puts a plaintext copy outside the book, by the parent's choice), and whether Plus is touched (I assume not: export and reading stay free).

### G-4 Find a letter (search)

- Problem: where was the one about the first bath?
- Evidence: specified as F09-REQ-015, "P1, first to cut" (`docs/prd/v2/features/F09-book.md` lines 5 and 227); no search field in `(tabs)/book.tsx` (searched 9 Nov for a search bar or the planned `entries_fts` table). Baby Diary lists "Timeline sorted by month, with search" (lookup 6762714102). Day One's chat can search past entries (`02-benchmark.md` section 1 item 2, 23 Oct release notes). Old roadmap parks it as BK-09 "from year two of a book" (FUTURE 3.5 rank 34), and T5-09 would drop the old server-side search column.
- Severity: week 1 LOW (few letters); keepsake MEDIUM (at 100 or more letters the month list is the only way in).
- Size: S to M (local FTS, Chinese-character fallback is in the spec, F09-U24).
- Constitution: clear (finds, never rewrites). Privacy: on the device only; never a server index; never Spotlight indexing (FUTURE 7.3: "Build a server-side search index over letter text, or index letters in Spotlight" is on the will-not list); search terms never leave the phone or enter analytics.
- Fits: existing spec, absent from 08. Slot 23.7.
- Founder decision: none beyond "after the launch rows".

### G-5 Start a recording without opening the app (Siri phrase or Shortcut; later a widget)

- Problem: the baby is asleep on my arm and I have one thumb.
- Evidence: Baby Diary lists Siri "Record a memory in Baby Diary" and "one-handed, while you feed, rock or drive (parked)" (lookup 6762714102); Tiny Treasures lists CarPlay voice messages (lookup 6788518267); Dearest lists Home Screen widgets (lookup 6790823627). Our customer file: contact-nap capture is a Medium need, signals only (`01-customer-needs.md` section 2 rank 12), the alpha group has not reported on it. FUTURE rank 39, CVL-13 and BK-11, "promote if beta shows capture friction". Not built (no widget or App Intent code found, 9 Nov).
- Severity: week 1 MEDIUM (HYPOTHESIS, speed to first letter is the 90 second target in the PRD); keepsake low.
- Size: M (a native extension; batch it with the other native changes the way rank 28 says `expo-store-review` should be).
- Constitution: clear. Privacy: starting a recording is the parent's tap, not listening; FUTURE 7.4 forbids background recording, wake words and auto-start, so the phrase must open the app to the Speak screen and wait for a tap, or at most start on a visible screen. A widget or lock-screen control must show no child name and no letter text.
- Fits: NEW to 08. Slot 23.9, after proof that capture friction exists (rank 14 and the usability test G1 in `01` section 4).
- Founder decision: whether "start recording from Siri" is allowed to begin recording with the screen off (I recommend no, per FUTURE 7.4).

### G-6 Mark a first (first word, first steps), in the parent's own words

- Problem: this letter is the first time {child} said a word, and I want to find it again.
- Evidence: Baby Diary lists "50 milestones to capture, from first smile to first steps" with a date and a story (lookup 6762714102); From, Mama lists a timeline with milestones (lookup 6760956480). BabyPage uses milestone pages (`02-benchmark.md` section 5). Our rules: no milestone checklists, no auto-detection (FUTURE 7.6, `01` section 3 row on first words); "firsts in the family's own words" is BK-05, v1.3, arrange never author (FUTURE 3.4 rank 21). Quiet count milestones (the 50th letter) are specified (C-REQ-010); I found no code for them in `apps/mobile/src` (UNVERIFIED, they may be behind another name).
- Severity: week 1 LOW to MEDIUM (a store-comparison gap; no review evidence of anyone leaving over it); keepsake MEDIUM (finding the first steps in a year-one book).
- Size: S to M for a parent-chosen tag on a letter ("a first"), M with a Book view of them.
- Constitution: a tag the parent chooses, with the label picked from a fixed list or typed by the parent, is clear. The machine must never decide that a letter contains a first, never suggest wording, never auto-title. A pre-set list of ideas shown as prompts is content, but a "have you recorded X yet?" list counts gaps and breaks the content rules ("never count gaps"). Privacy: the tag is local, part of the book, not an event with the label in it.
- Fits: BK-05 exists, absent from 08. Slot 27.5 (after prompts v3, row 27, which already feeds it).
- Founder decision: tag-only (no checklist) is my default; the founder decides whether to reverse the "no milestone checklists" rule, which I do not recommend.

### G-7 Hear that my partner added a letter

- Problem: my partner recorded something and I only find out when I open the app.
- Evidence: co-parent letters "arrive silently" in v1.0 (`docs/backlog/future/02-family-circle.md` fact 11, as cited in `01` section 5 item 10); FAM-17 is planned with APNs and no names or text in the payload (FUTURE 3.2 rank 4). Not in 08.
- Severity: week 1 low while the Family tab is hidden (08 F8 default); keepsake low; MEDIUM once the Family tab is on.
- Size: S to M plus an APNs key (a founder step).
- Constitution: clear. Privacy: payload carries no name and no text (FUTURE rule); counsel and Apple 4.5.4 notification rules.
- Fits: NEW to 08, attached to rank 25. Slot 25.5.
- Founder decision: none until F8 (Family tab) is decided.

### G-8 A calm play-back of a month or "on this day"

- Problem: I want to hear last month, not scroll.
- Evidence: delight signals only (`01-customer-needs.md` section 2 rank 10, HYPOTHESIS). BK-06 "On this day on Tonight", local only, the highest score per week in the book theme per FUTURE (a score the old roadmap made up; treat as direction). Month play-back is BK-08 ("the year in voices", Later).
- Severity: week 1 none (needs earlier letters); keepsake MEDIUM.
- Size: S for BK-06.
- Constitution: arranges what exists, never authors; no summary line, no "your month in review" text written by the machine. Privacy: local only.
- Fits: NEW to 08. Slot 28.5.
- Founder decision: none.

### G-9 Print or order the book

- Problem: I want something in my hands at the first birthday.
- Evidence: Remento's Baby Book of Firsts is $99 for a year plus a hardcover with a QR code to the original voice (`02-benchmark.md` section 1 item 3; https://www.remento.co/babybook, as read by the benchmark agent on 8 Nov, not re-opened by me); Qeepsake, BabyPage and Chatbooks lead with print (section 5 matrix). Our plan: PDF now (F15-REQ-009, built), print-ready file BK-13, printed Year One pilot October 2027 after a June 2027 go/no-go (FUTURE 3.5 ranks 28 and 44).
- Severity: week 1 low (nobody orders a book in week 1); keepsake HIGH over time.
- Size: L for BK-13 alone; XL with ordering (an entity is needed before selling physical goods, FUTURE rank 44).
- Constitution: the book prints the words exactly as the letter shows; page design may never alter them. Privacy: an order sends a child's name, address and letters to a printer, which is a new data recipient and a label change.
- Fits: existing, not in 08. Parked (see section 4).
- Founder decision: the June 2027 print go/no-go stays; no print dependency in the first public release.

### G-10 Relatives without the app

- Not a new gap; it is ranks 31 and `11`. Listed because a new parent expects it: Tiny Treasures offers a phone line and Remento a link (`02-benchmark.md` section 7 item 3). G-3 is the cheap bridge. The decision to pull the relatives' hello earlier than rank 31 is the founder's (XL, gated by ADRs and the independent test).

### G-11 Items I tested and judged not gaps for week 1

- Multiple children, language, accessibility, export, reminders, catch-up: covered in section 1.
- Video, Apple Watch, Android, iPad: FUTURE ranks 19, 45, 48 and the "will not in 1.x" lists; no review or customer evidence in this repo that they block a first-week parent.
- Account creation and management: NX-31 and NX-32.

## 3. Ranked top 10 (recommendation, not a decision)

None of these should displace the launch rows 1 to 17. They compete with rows 18 to 32 for the build time after the launch gates. The order is by (keepsake or week-1 severity) over size, then by how little each needs from the founder.

| # | Gap | Why here | Slot in 08 | Size |
|---|---|---|---|---|
| 1 | G-1 Voice survives a lost phone | Breaks the central promise if absent; needs a founder decision now so launch copy is honest | 16.5 | L |
| 2 | G-3 Share one letter | Cheapest answer to "relatives can hear it"; S, no server | 23.2 | S to M |
| 3 | G-2 Photo with a letter (local first) | Most visible category expectation; M if local | 23.5 | M |
| 4 | G-4 Find a letter | Already specified; S to M | 23.7 | S to M |
| 5 | G-5 Siri phrase or Shortcut to open Speak | Night capture; only after friction is observed | 23.9 | M |
| 6 | G-7 Partner-added notification | Only matters when Family is on | 25.5 | S to M |
| 7 | G-6 Parent-chosen "first" tag | Meets the milestones expectation without a checklist | 27.5 | S to M |
| 8 | G-8 On this day (BK-06) | Cheap, local, keepsake | 28.5 | S |
| 9 | Row 29 catch-up dates (NX-27 R1 to R3, already finished specs) | Existing; start now, it is a week-1 need for a parent who installs late | 29 (suggest move up) | S |
| 10 | Row 27 names that learn | Existing; trust cost of wrong names | 27 | M |

The founder's remark that the landing page is dull and the navigation thin is answered by NX-30 and NX-31, not by this list; none of G-1 to G-8 fixes a dull first screen.

## 4. Five things we should not build yet, and why

1. Printed book ordering (BK-14 and checkout, T5-27). Needs an entity, a printer, a new data recipient, and the June 2027 go/no-go. The PDF export covers the need until then.
2. Sealed letters and handover at 18 (BK-03, FAM-13). Need a server view and a sync change; the evidence is signals (`01` section 2 rank 11); Dearest and Tiny Treasures have it, but a first-week parent does not ask for it.
3. A milestone checklist or any detection of firsts. Breaks "never count gaps" and risks adding meaning to a person's words (FUTURE 7.6, the constitution).
4. Share cards, themes and templates (Dearest "story share cards"; BK-19 themes). Pressure to "make it nicer", puts a child's name on an image that leaves the book, and adds a design surface before the launch rows land.
5. Video, photo-only entries, Apple Watch, CarPlay. Forbidden or parked in FUTURE 7.4 and rank 48; a second capture runtime is a large risk for a solo team.

Also not now, already ranked: web contribution page, relatives' hello and shared voice (rank 31), Android (FUTURE rank 19), languages beyond English (rank 32).

## 5. Founder decisions this file needs

1. Recordings backup: free, Plus, or later with a plain line in the launch copy (G-1).
2. Photos in the first public release or 1.1, and local-only first (G-2).
3. A per-letter share, and that it never touches Plus (G-3).
4. Siri or Shortcut start: opens Speak only, never records with the screen off (G-5).
5. Tag-only "firsts", no checklist (G-6).
6. Whether to move row 29 catch-up dates up (top-10 item 9).

## 6. What I could not verify

- Competitor claims come from App Store listing text (the lookup records of ids 6762714102, 6788518267, 6760956480, 6790823627, opened 9 Nov 2026) and from `02-benchmark.md`. Listing text is the maker's claim; I did not install or test the apps. Remento's price and book details are carried from the benchmark, not re-opened by me.
- No demand data: no usage, review or interview evidence in this repo says how many new parents leave over any gap. Severities are judgement. The alpha testers' own reports were not available to me (they sit in the Project, not the repo).
- "Not built" rests on routes and text searches of `origin/develop` on 9 Nov; open PRs (125 on 8 Nov) and any code behind a different name were not read. The 50th-letter milestone card, search and share may exist in a branch.
- `docs/design/EXPERIENCE_PASS_2026-10.md` and the feature specs F01 to F21 were read only where cited (F09, F15 and the index lines in `05-feature-map.md`); I did not read all of them.
- Sizes and person-week figures from FUTURE are the old roadmap's estimates; scores in that file were made up by its authors and are direction only.
- Apple's rules for Siri/App Intents, widgets, notifications and photo permission labels, and the cost of storing recordings, were not checked.
- Whether the sign-in, backup and server rows ahead of these (ranks 5, 6, 16) will land in time for G-1 to be useful.

Product Manager (Claude role)
