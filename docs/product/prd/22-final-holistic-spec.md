# 22. The pack in one reading: what the product does, where days, background, reminders, pictures and Home today fit, and what the founder decides

Status: CURRENT (LOCKED rev 2) (entry point) | 20 Nov 2026 | Owner: `product` | Replaces: none | Load when: FIRST for every role: the whole pack in one reading, the eight founder answers (section 7), the file map (section 8) and the lock (section 10).

Status detail: LOCKED 20 Nov 2026 (requirements rev 2; see section 10). Written by `product` for a human reader (the founder, Karma, a new designer or engineer). Docs only: nothing here is built, no string is live, no decision is recorded in `DECISIONS.md`. This file cites; it never changes a requirement. Where it and a card differ, the card wins (and the card's own order of precedence: `GAP-LOG.md` rulings, the founder direction, the function reviews). Nothing is legal advice; every legal or store reading is "counsel must confirm". No dates: cards state order and gates only (ruling T5).

Facts about the screens come from the information architecture audit (`docs/design/e2e/IA-AUDIT.md` on branch `docs/e2e-ux-20nov`, head `ed44fe899`; design judgement and code reading, not observed users). Facts about code come from the ten reviews of NS-46 to NS-50 (`tools/review/ns46-50/`). Anything either could not check is marked UNVERIFIED in the card.

## 1. What the product does now

Early Letters is a baby memory book families fill by talking (public descriptor today: letters to your child, in your own words and voice, BRAND.md). A parent speaks or types about their child; the machine may remove and repair, never add meaning (CLAUDE.md constitution): every edit is verified and reversible, the words as heard are kept, nothing writes, rewrites or summarises a person's words.

Three tabs, one job each (frame, NAV-TAB-ROLES; Family is never a tab and no build shows a "coming soon" surface):

| Tab | The parent's sentence | What lives there |
|---|---|---|
| Home (Say) | "I go to Home to say something to {child}." | The one primary action, Say. Dateline, greeting, one prompt with "Another thought", at most one slip, the capture cluster (Speak and Type as 64 pt twins; Start from a photo and Not much today as 44 pt quiet controls), the Plus line when it applies, a book switcher with two books. 5 content elements, 4 actions, 0 to 1 slips (IA-AUDIT 5.1). |
| Book (Read) | "I go to the Book to read what we kept." | The letters, by month; Photos and Firsts lenses; Find; the letter page; read together; delete with undo. Nothing here starts a letter. |
| Me (Look after) | "I go to Me to look after my account and books." | About 22 rows in 9 groups (IA-AUDIT 4.1): account and plan, books, writing, reminders, keeping the book safe, privacy, delete, help, about. |

Only Home starts a letter. Everything else adds to a letter that exists or reads kept letters. The shape of the whole product is in `00-product-frame.md`; the first minutes are in `19-from-download-to-first-letter.md`.

## 2. What this scope adds (cards NS-46 to NS-50)

The founder's direction of 20 Nov (`20-founder-direction-20nov.md`) asked for days that matter to a family, an optional cultural background, a catalogue of reminder words, picture-first starts and a Home that has something for today. The five cards in `21-days-cultural-photos-home.md` answer it; this pack adds ways to start a letter, not a second job.

| Card | One line | Free or Plus |
|---|---|---|
| NS-46 Days we mark | A library of days the parent ticks (nothing pre-ticked); one Days page with the typed days of NS-18; a ticked day recurs yearly and sends one reminder at 09:00 through the existing planner slot and budget | Free |
| NS-47 Cultural background | The optional, once-only ask that helps browse traditions; what is kept (only the ticked days, on the phone, L4) and the lock-screen rules | Free |
| NS-48 Notification catalogue | One pure function that picks the words of a reminder the planner already decided to send; adds no reminder, class or setting | Free |
| NS-49 Picture-first and Journaling Suggestions | Level 1 (Apple's picker) as a first-class start; level 2 (Apple's suggestions picker) parent-started; level 3 (library reading) moved to NS-51 | Free |
| NS-51 Photo moments (`27-photo-moments-and-media.md`) | The parent opts in, once, to let the phone's picture dates show days worth a letter; dates only, on the phone; an invitation in the picture start and one neutral budgeted reminder; drop C, spike first | Free |
| NS-52 Pictures and videos with a letter (`27`) | Up to 6 pictures and 2 videos per letter (proposed defaults), in the Book, Save a copy, export and delete; phone only by default (Q-PM-3); video never printed; drop C | Free at the defaults |
| NS-50 Home today | One more rank in the single Home slip slot: a day the parent chose, today. Not a strip | Free |

## 3. How each fits in each tab, with no duplicated information

The audit's rule: one owner per fact. Home and Book hold almost no duplicated information; the real duplicates are several doors to one function (Save a copy has six), one fact drawn two ways (the age line) and code computed twice (IA-AUDIT 1). The new scope is placed so it adds none.

| Where | What is there | Owner and rule |
|---|---|---|
| Home, slip slot | At most one slip, fixed order: (1) the waiting set, (2) the seal-opened line, (2b) a day the parent chose, today, (3) Save a copy, (3b) the Days ask (once, capped at two showings), (4) one past letter (NS-50-R5; the order is one registry). A slip, not a strip: a strip of several things is a feed with a count of things waiting, which the frame forbids (R-IA-3). | The day slip reads the days store; it names a day only when it is today, never lists upcoming days or a count, and a quiet book shows none. |
| Home, capture cluster | "Start from a photo" is the third, quietest item. Where level 2 exists it opens a two-item menu ("Choose a photo", "Pick from recent days"); elsewhere it opens the picker directly. | NS-49. The picture suggestion is never a slip and never a tile (NS-50-R10). NS-51 adds one third menu item here when a moment exists (NS-51-R8, R40); NS-52 adds multi-select and video to the same picker (NS-52-R2). No duplicate entry: one start, one menu. |
| Me, Reminders area | One row, Photo moments (opt-in, pause, albums, off). Pictures and videos have no Me row; Storage shows their size only (NS-52-R31). | NS-51-R35 and NS-52-R31; the row lives beside Days, not in a new group. |
| Home, prompt | An ordinary prompt from the existing catalogue, also after a day reminder (a day reminder leaves no trace in the synced row, NS-47-R5). On a quiet day (Memorial Day, Veterans Day) the quiet line replaces the prompt block (default pending founder). | `entries.prompt_key` never carries a day. |
| Book | Unchanged. The "on this day" look-back stays with NS-23 and NS-31; a day reminder never says "last year" or shows an earlier letter (NS-46-R22). | NS-23 owns the one past letter on Home. |
| Me, Days page (C-S24) | One page for the typed days of NS-18 and the ticked days of the library, in two sections ("Days you added", "Days you chose"), one "Add a day" flow, "Browse days" (a sheet), "Clear all", the day-name switch, one plain line that anyone who can open the phone can see the list. Before tree test T1 it is one row under Reminders; after T1 it sits in the regrouped Me group "Days and reminders" (working title, RV-3). | R-IA-2: no second list. NS-47 owns what is kept; NS-46 owns which days exist and when they fire. |
| Me, Reminders | The evening reminder settings, the names switch (child's name only), one calm line when Reminders is off that chosen days still send a reminder, and one line that Apple's own journal suggestion notifications are separate. | NS-13 owns reminders; NS-48 adds no setting (the preview calls the planner's function). |
| Me, Erase, sign-out, Delete account | Each clears the days store and its reminders; a line on C-S20 says days chosen stay on the phones and are cleared with the account. | NS-36, NS-45, NS-47-R15 to R17. |
| Notifications | One budgeted reminder a day (the evening reminder, month, birthday, typed day or library day), 60 pending in total with plan notices first (errata E13). Apple's own journal suggestion notifications (iOS 26) are the system's and outside our budget. | `budget.ts` is the one place the rule lives (it is enforced nowhere today). |

Me regroup proposed by the audit (adopted for design, built only after tree test T1, R-IA-4): Writing; Days and reminders (Reminders, Days, Past letters on Home); Keeping your book (Save a copy, Where your letters live, Recently deleted, Storage); On this phone (App lock, Privacy); an untitled last group (Erase everything, Delete account); Help and legal; About. No row is deleted.

Is Home enough to be the default tab? The audit says it is not thin: one job above the fold, and the weakness is a stale second visit. NS-50 does not claim to fix that: on a day with nothing marked Home is unchanged. A default-tab check with five parents is NS-50-R13.

## 4. What is in 1.0, build 13 and after (the release cut)

The reviews found no one cut in the pack, 87 P0 rows and a long chain of unbuilt prerequisites. The cut in card 21 ("Release line and cut") orders the work; the founder decides it (Q-FD-7). Every row of NS-46 to NS-50 is tagged with its drop there.

| Drop | In it | Needs first | Line |
|---|---|---|---|
| A | NS-48 phase 1 (day-part filter, weekday tone, the built 8 re-keyed, rules-test coverage, no key in the payload) | No planner change beyond words | The next build (Build 13 or later) |
| B | NS-46 seasonal, family and civic days, US only; the plain browse-and-tick list in Me (the fallback with no question, no tradition, no country); NS-47 store rules only; NS-50 rank 2b; NS-49 level 1 (moved from A on 20 Nov, CL-015: it needs NS-01, which stays dark; only if the A-S01 re-draw passes its AX5 test) | NS-01 on `testflight`; the one notification budget, typed days in reminders, the Home slip registry and the Quiet this book control (their rows are in `23-dependency-map-and-plan.md` section 1a); the days store registered and Erase-scanned; counsel on any copied table and on the consent line | 1.0 only if every gate closes before freeze, otherwise 1.1 |
| C | NS-47 ask slip and tradition browse; culture-led days; tradition-member review; the day-name switch; NS-48 recency and last-letter layers; NS-49 level 2; NS-51 photo moments (spike first); NS-52 pictures and videos (Variant A) | Counsel CUL-Q5 to Q7 and Q11; the J-CUL-01 device walk; a recorded reviewer per tradition; the NS-13 anchor; the entitlement; a weak-link launch run on iOS 17.0, 17.1, 17.2 and 26 | After 1.0 is approved |
| D | NS-38 to NS-45 (card 19) as one first-run stack: age question, region check, sign-in, consent, first letter, Plus and allowance, account life | Wave 1 and Drop A shipped; the founder approves its words (E43) | Before any family outside the founder's signs in |

Not in this pack and parked: a Home strip, other countries' days, regional days (Pongal, Onam, Parsi New Year) in the first drop, OPP-02 to OPP-05 before first-run evidence (`12-parked-and-not-built.md`, `functions/feature-opportunities.md`).

Built today, from the reviews' reading of the code: the planner has three kinds (`evening`, `monthAge`, `birthday`); typed days are a design, not shipped; the one-a-day rule is enforced nowhere except evening yielding to month and birthday; `Child.quiet` has no reader (errata E16); there is no Home slip host or registry; no notification category or hidden-preview placeholder exists; level 1 pictures live in the open PR stack and not in this branch. Each is a prerequisite named in the cards.

## 5. The promises that hold, and the file that backs each

| Promise to the parent | Backed by |
|---|---|
| Nothing is ticked for you; "Not now" is a full answer of equal weight; the app never says a day is missing, never counts what you ticked | NS-46-R2, R19, NS-47-R25, R30 |
| Your faith and origin stay on your phone: the store is L4, outside the iPhone backup, cleared at sign-out and Erase, never exported, synced, logged or sent; no request carries a day | NS-47-R1, R4, R6, R8, R15, R16, R34 |
| Only a family's own words are kept: a day reminder opens an ordinary prompt and leaves no day in the synced row | NS-47-R5 (CB-3) |
| The lock screen does not name your day by default: one neutral title and body, the day's name only behind its own switch (off, forced off with App lock), only an allowlist of seasonal days may name themselves, never a day beside a child name, no category shows a title with previews hidden | NS-46-R36, NS-47-R12, R13, R36, R38 |
| Reminders do not multiply: the catalogue only chooses words; one budgeted reminder a day; a quiet or hidden book gets none | NS-48-R2, R21, NS-46-R30 |
| No guilt or gap language: no count, comparison, "again", "another", age norm or pregnancy word; zero exclamation marks | NS-48-R4, R10, R30, R36 |
| Quiet days stay quiet: Memorial Day, Veterans Day, Good Friday, Yom Kippur show a name only, no question | NS-46-R16, R37 |
| A picture you pick, only that picture: no photo-library permission, no PhotoKit call, level 3 only as NS-51 (dates only, opt-in, phone only), no mark of how it started; Apple's suggestion title is yours only if you tap "Use this" | NS-49-R6, R7, R9, R10, R13; NS-51-R5, R26, R29 |
| Honest wording: the app receives the suggestion you choose and uses only its picture (not "only the picture reaches the app"); "Only on this phone" holds only while its tests hold | NS-49-R16, NS-47-R22 |
| Free stays free: no reminder, slip or line names Plus, a price or a Keep step | NS-46-R27 (T2) |
| Sign-out keeps the book (D1); writing tools are off on letter fields (D2); nothing is donated to the system (D3) | All five cards |

Constitution and voice (CLAUDE.md): no em or en dashes, curly quotes, ellipsis characters or emoji; no fear, guilt or loss language; never imply AI writes anything; `{child}` only; no streaks, points or badges; the fictional family Asha only, and no fixture pairs a real tradition with Asha.

## 6. The gates

Gates G0 to G6 are the release gates in `14-test-plan.md` (compliance's evidence gates are CG0 to CG6, K7).

| Gate | What it needs for this scope |
|---|---|
| G0 | The trace reads NS ids; every P0 row has a test and a backlog row. Card 21 now has 182 rows and 87 P0 with no backlog row. P0 rows in the pack by `p0.py` on 20 Nov: 1,050 (536 in NS-01 to NS-52, 514 in `functions/*.md`); 771 have no row-level backlog row (`BACKLOG-GAPS.md` section 1). |
| G1 | On-device data rules for the L4 store (ADR 0028). |
| G2 | Counsel reads: source licences (NS-46-R23), CUL-Q5 to Q7 and Q11, the consent line, the recent-days lines, DPLA 3.3.3(H), 5.1.3. |
| G3 | The founder approves every word (`days.*`, `culture.*`, `ntc.*`, `features.photos.suggestions.*`). |
| G4 | Every P0 device row passes: the lock-screen walk (J-CUL-01), one week of reminders on a phone (NTC-T24), launch and picker on iOS 17.0, 17.1, 17.2 and 26 and an iPad, blank snapshots, VoiceOver and AX5 on an SE 3. |
| G5 | The privacy label and claims match the binary; the store listing says the day reminder time truthfully (NS-46-R46). |
| G6 | No `production` flag is on while its card has an open P0 (`EXPO_PUBLIC_DAYS`, `EXPO_PUBLIC_SUGGESTIONS`). |

Standing rules for a day library: a tradition ships only after a member of that tradition has read its rows (DL-8); no date is written from memory (computed or sourced, DL-3, DL-4); an October review each year; a wrong date is the failure with the highest cost to trust, so a remote pause exists and one report trips a same-day review (NS-46-R28, R44).

## 7. Founder decisions: answered 20 Nov (the eight residue items)

Status: ANSWERED 20 Nov 2026. The founder, relayed 20 Nov: "Go with all default answers. Focus on what's best for customer experience. And proceed to lock all requirements and once done inform harness and engg leads working on architecture" (`FOUNDER-MESSAGES-VERBATIM.md` item 33). Every default below is accepted. Where two defaults conflict, customer experience wins. The earlier long master list is closed: the founder-only groups and the 79 ruled groups (113 closure rows) are one line each, by id, in `GAP-LOG.md` "Closures 20 Nov" (CL-001 to CL-135; CL-001 to CL-113 are the 113 grouped rows); the source is Project doc `infra/exec-rulings-2026-11-20-pre-kickoff-debate.md`. Nothing is copied here.

| Id | Decision | Answer (default accepted) | Closure ids |
|---|---|---|---|
| F1 | Level 3 photos library read | Spike only in Build 13 on `exp/photos` behind a flag; ship in 1.1 after the spike, the counsel read and the device rows (errata E32) | CL-012, CL-046, CL-052 |
| F2 | Pictures and videos: phone only (Variant A) for 1.0 | Yes; label unchanged; the other parent does not see pictures; hosted (B) only after the security read and the counsel read | CL-048 |
| F3 | Lock screen for photo moments | Neutral line that names no content, not the founder's example; revisit with App lock off and names on | CL-054 |
| F4 | Caps and pen test | Caps free for all while phone-only (6 pictures, 2 videos, 60 s, 100 MB); pen test spend yes before any non-family person stores letters on the server | CL-047, CL-069 |
| F5 | The four 842 departures | Accepted: Days ask after first letter; no "East East" option; only ticked days stored; religion and native country optional with opt-out | CL-009, CL-010, CL-013, CL-089 |
| F6 | Counsel batch | One engagement for every "counsel must confirm" row (Q45, Q48, X2 naming wording, ticked days, breach law, RQ and PQ points); engage before any non-family user. Flags stay off until answered; a counsel answer is never defaulted | the FOUNDER rows in `GAP-LOG.md` Closures |
| F7 | Account hands | Decision made, action pending (list below) | CL-019, CL-038, CL-042, CL-062, CL-066, CL-090, CL-091 |
| F8 | Alpha families | Tell them before the build; the founder decides any gift | CL-077 |

Drops (Q-FD-7, CL-015, E43): A with the next build (NS-48 phase 1), B only if its gates close before 1.0 freeze (now including NS-49 level 1), C after 1.0 is approved, D (first-run, NS-38 to NS-45) after wave 1 and Drop A and before any family outside the founder's signs in.

Founder hands (decisions made; these are actions pending his hands, not questions):
- Apple: request the Journaling Suggestions capability on the App ID if the portal says a request is needed (approval UNVERIFIED).
- DNS and mailboxes: `dmarc@` and `hello@` provider, `abuse@` alias.
- Backup and key custody: monthly second backup copy, two offline key copies, one adult holds the sealed key sheet, a status page on a second provider, a second contact route.
- Vercel: confirm the plan (UNVERIFIED).
- Borrowed phones: iOS 17.0 or 17.1, iOS 17.2 or later, an iPad.
- Money: counsel engagement, accountant for tax and payment points, the pen test.
- People: tell the alpha families first.

Founder answered 20 Nov (item 40, `FOUNDER-MESSAGES-VERBATIM.md`): every row below is accepted as the executive team recommends. The rows stay as written; a later no on any line reopens it.

Founder digest: defaults that stand (added 20 Nov, one line each, default and deadline). These are founder-only or counsel-only. The default is the working position, not his decision, and nothing irreversible is done on it. Deadline for all: Mon 23 Nov 2026, his to change; a "no" on any line reopens it. The one counsel list is `docs/engineering/readiness-20nov/security/SECURITY-OPEN-QUESTIONS.md` (PR #915).

| Id | One line for the founder | Default in force | Where |
|---|---|---|---|
| E43 (CL-117) | First-run (NS-38 to NS-45) ships as Drop D: after wave 1 and Drop A, before any family outside yours signs in | Yes, in that order | `18` E43 |
| E46 (CL-120) | The sensitive-data withdrawal control is not built today; I add one P0 row and it is built before anyone outside the family signs in | Add the row; counsel-adjacent | `18` E46 |
| E47 (CL-121, CL-146, E72) | The country check fails open and counts an error if its own lookup fails; the hook stays off until counsel and the CCO answer | Fail open; hook off | `18` E47 |
| E56 (CL-130) | A No at the age step sends nothing and writes no server row (the phone keeps a local stop flag, NS-40-R3); Terms 2.1 and Privacy 8 are aligned later (legal text is yours) | Card as written; BL-580 deferred | `18` E56 |
| E59 (CL-133) | The free allowance is per phone, not per account | Per phone, as built | `18` E59 |
| E75 (CL-149) | Marketing email: people who sign up in the app get transactional mail only (codes, account and security notices, receipts, legal); no newsletter, product news or Plus offer, and the waitlist is never joined to accounts. Whether the waitlist's own "tell me when it is ready" mail is commercial is counsel's (Q34) | No marketing email to app addresses at 1.0; any later one needs his yes and a separate opt-in off by default | `18` E75; FR-MKT-44 |
| E78 (CL-152), E83 (CL-158) | The new-device sign-in email is built, tested and read by security before the first family outside yours signs in (your answer of 20 Nov), and it also gates the backup flip | Before the first outside family (NS-08-R21) | `18` E78, E83; NS-08-R21 |
| E67 (F-1) | Writing tools on letter fields (SOQ F-1): accept the recorded finding, or fund the small native setting (NSC-05)? Until decided, the production profile keeps the photos flag off and the Firsts label waits | OFF on letter fields (brief D2); not shown in a production profile without the native setting | `18` E67; SOQ F-1 |
| E67 (F-9) | The G1 server gate (block others' rows at once on a newer Terms version, or after a grace window)? | Grace window as `BRIEF-G1-sync-pull-consent-gate.md` line 14 says (numbers not re-read); the age attestation is never graced | `18` E67; SOQ F-9 |
| E67 (F-12) | A secret scan in CI and `docs/ops/SECRETS.md` | Yes, both (neither exists today); the CI workflow is still to be written, and it goes under `docs/ops/proposed` until he copies it | `18` E67; SOQ F-12 |
| E67 (K-7) | Copy the label-guard workflow from `docs/ops/proposed/workflows/label-guard.yml` to `.github/workflows` (D-124) | Its source states no default; it stays uncopied and the guard runs where someone runs it | `18` E67; SOQ K-7 |
| E67 (K3) | Where card NS-09-R6 meets founder decision 15 (`storage.tsx`: "letters and recordings never appear here") | The card wins (E28): one state line, "A recording is still being removed", and Remove now; never a list, never a count | `18` E28, E67 |
| E67 (plan Q3) | Seals: in scope, or "not built" (plan #847 section 5.3, Q3) | In scope, as cards 05, 06 and 21 say: built after Share one letter and its study, a sealed letter has no Share control, Home shows the seal-opened line at rank 2; no seal code until counsel answers (rows stay blocked, `23` 4.6 item 36) | `18` E67; plan #847 Q3 |
| E67 (plan Q4) | Keep #798 as one PR with a size exception (plan Q4) | Recommendation only, no default: no, split as BL-952 says; #798 as one PR waits for his answer | `18` E67; plan #847 Q4 |
| E67 (plan Q5) | The size exception for the plan file itself (plan Q5) | Recommendation only: accept; the plan file does not merge until he answers | `18` E67; plan #847 Q5 |
| E67 (plan Q6) | Switch on the autonomous agent lane (plan Q6, SOQ F-10) | Off for waves 1 and 2; interactive sessions run the agents | `18` E67; plan #847 Q6 |
| E67 (plan Q7) | The daily run cap (plan Q7) | Unchanged at 30 while the lane is off | `18` E67; plan #847 Q7 |
| E67 (dependencies) | Engineering-owned (`mobile`, CR-69 A8): `expo-symbols` (design rulings 31 and 35, the Icon wrapper, chrome only), `expo-battery` (the lamp off under Low Power Mode, ruling 31) and `expo-image` or an equivalent decision (media posters). Product states the need only; he approves new dependencies | Not added until he approves | `18` E67; CR-69 A8 |
| CL-008 | Pilot notes kept 30 days, consent records 12 months; no pilot before the reads | 30 days and 12 months | card 03 |
| CL-099 | Support keeps messages 12 months; support never reads a letter | 12 months | `functions/support.md` |
| CL-015 | Which drop ships what: A with Build 13, B only if its gates close before freeze, C after 1.0; NS-49 level 1 moved from A to B (E31) | As recorded | card 21 release line |
| CL-052 | Photo moments (NS-51) is not in 1.0: a spike in Build 13 behind a flag, ships in 1.1; pictures and videos (NS-52) after 1.0 | As recorded (F1, E32, E34) | card 21, card 27 |
| CL-097 | No printed book in 1.0; entity, partner, price, tax and the Mail Order Rule wait for a go or no-go | No print in 1.0 | `functions/print-and-fulfilment.md` |
| CL-103 | Spend cap on uploads (waits), one plain iCloud line, accountant before any storage-linked Plus change | As recorded | `functions/finance.md` |

Karma's items (parent-visible, not founder items): the conflicts list of card 21, RV-1 to RV-24 and K11 to K17 in `GAP-LOG.md`. K12 and K14 to K17 are carried into the cards in place as of 20 Nov (CL-112: K12 in NS-48-R34, K14 in NS-30, K15 after NS-45-R18 and NS-10-R14, K16 in `14-test-plan.md` section 7, K17 as NS-17-R11 and R12); no errata row, because no locked statement changed.

## 8. Where everything is (every card and function file)

Cards, in `docs/product/prd/`:

- [00 product frame](00-product-frame.md), [01 photo with a letter](01-photo-with-a-letter.md), [02 Find](02-find.md), [03 family hears it pilot](03-family-hears-it-pilot.md), [04 hands-free spike](04-hands-free-capture-spike.md), [05 share one letter](05-share-one-letter.md), [06 Firsts, sealed letter, quick capture](06-firsts-sealed-letter-quick-capture.md), [07 remaining capability rows](07-remaining-capability-rows.md)
- [08 keeping and trust](08-keeping-and-trust.md), [09 capture](09-capture.md), [10 reading and family](10-reading-and-family.md), [11 foundations](11-foundations.md), [12 parked](12-parked-and-not-built.md)
- [13 engineering plan](13-engineering-plan.md), [14 test plan](14-test-plan.md), [15 council review](15-council-review.md), [16 council review round 2](16-council-review-round-2.md), [18 errata after lock](18-errata-after-lock.md)
- [27 photo moments, pictures and videos](27-photo-moments-and-media.md), [26 founder direction on photos and media](26-founder-direction-photos-library-and-media.md), [19 from download to first letter](19-from-download-to-first-letter.md), [20 founder direction](20-founder-direction-20nov.md), [21 days, cultural background, catalogue, pictures, Home today](21-days-cultural-photos-home.md)
- Records: [GAP-LOG](GAP-LOG.md) (rulings, K11..K17, RV-1..RV-24), [FUNCTION-TRACE](FUNCTION-TRACE.md), [BACKLOG-GAPS](BACKLOG-GAPS.md), [README](README.md), [RESUME](RESUME.md)

Function reviews, in `functions/` (the brief is [BRIEF](functions/BRIEF.md)): [support](functions/support.md), [marketing](functions/marketing.md), [operations](functions/operations.md), [finance](functions/finance.md), [data and measurement](functions/data-and-measurement.md), [privacy](functions/privacy.md), [legal](functions/legal.md), [compliance](functions/compliance.md), [risk and security](functions/risk-security.md), [back office](functions/back-office.md), [messaging and entry points](functions/messaging-and-entry-points.md), [languages and localisation](functions/languages-and-localisation.md), [reliability](functions/reliability.md), [AI and speech](functions/ai-and-speech.md), [research and validation](functions/research-validation.md), [quality](functions/quality.md), [lifecycle and platforms](functions/lifecycle-and-platforms.md), [print and fulfilment](functions/print-and-fulfilment.md), [days library](functions/days-library.md), [notification catalogue](functions/notification-catalogue.md), [cultural background data](functions/cultural-background-data.md), [photos and suggestions](functions/photos-and-suggestions.md), [feature opportunities](functions/feature-opportunities.md).

The ten reviews of NS-46 to NS-50 are in `tools/review/ns46-50/`: [analytics](tools/review/ns46-50/analytics.md), [compliance](tools/review/ns46-50/compliance.md), [content](tools/review/ns46-50/content.md), [design systems](tools/review/ns46-50/design-systems.md), [marketing](tools/review/ns46-50/marketing.md), [mobile](tools/review/ns46-50/mobile.md), [privacy](tools/review/ns46-50/privacy.md), [product](tools/review/ns46-50/product.md), [qa](tools/review/ns46-50/qa.md), [security](tools/review/ns46-50/security.md).

## 9. What this file could not verify

I did not run the product, a device, a test or any code; I rely on the cards, the audit and the reviews, each of which marks its own UNVERIFIED items (for example whether Apple's suggestions picker reports cancel or empty, who owns the returned photo file, whether a hidden-preview title shows on Apple Watch, and whether App Review reads an optional faith question as unneeded data). No holiday date, Apple rule or law was verified here.

## 10. Lock

Status: LOCKED 20 Nov 2026 for requirements rev 2: cards 00 to 27, the function files in `functions/`, and the design areas A to E (`docs/design/e2e/*/DESIGN.md`). Authority: the founder, 20 Nov: "Go with all default answers. Focus on what's best for customer experience. And proceed to lock all requirements and once done inform harness and engg leads working on architecture."

What locked means:
- A change is made only by an errata row with the next free E number in `18-errata-after-lock.md` (highest today E83); the row names every changed id.
- No duplicate copies: one home per fact; link by id. Anything new carries a status header.
- Two layers (founder items 9 and 15): the product layer reads as customer need and carries no BL or PR ids; the execution layer (backlog, trace, engineering plan) carries them and maps back. Ids are not stripped by script.
- Rulings live in `GAP-LOG.md`, by id; card text and the closure lines agree, and where they differ the card wins (CR-66).
- Questions, feedback and review comments on any locked row follow `FEEDBACK-LOOP.md`: intake with the row id, a triage class, parallel lens reviews, and an errata row with a plan delta line when a locked statement changes.

Remains execution-side (nothing here is a requirement question):
- Spikes: hands-free (NS-04, five days), date chip, level 3 on `exp/photos`, Journaling Suggestions entitlement step 1, pictures and videos (transcode, metadata, iCloud), weak-link launch run.
- Devices: every P0 device row, J-CUL-01, NTC-T24, phones to borrow.
- Counsel: the F6 batch; accountant for tax and payment points.
- Accounts: the founder hands list in section 7.
- Build gates: G0 (a backlog row for every P0 row, `BACKLOG-GAPS.md`) to G6; code-side items (`kill-switches.ts`, proposed ADR 0029 (no file yet), `WORDS.md`, `budget.ts`).
- Informing the harness and the engineering architecture leads: not done by this edit pass; the coordinator relays it.

