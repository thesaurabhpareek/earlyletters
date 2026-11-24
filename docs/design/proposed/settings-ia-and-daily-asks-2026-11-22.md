# PROPOSAL: Settings and Me, organised by the parent's jobs, and the setup asks that can move into the feed

Status: PROPOSAL, 22 Nov 2026. Docs only. Author: `product`. Nothing here is decided, no app code is changed, and no copy in `packages/content` is changed. Every string below is working copy for `content` to rewrite and the founder to approve.

Founder ask (22 Nov 2026): "Make sure the settings page in the current app is well organised in the new one, and functionalities there are cleanly thought through to drive better user experience. Some of the things in settings can become part of our 1-2 setup action a day in feed organically."

**Rulings since first draft (22 Nov 2026).** The founder said "everything is approved, ask the exec team". Karma took the rulings below with CPO and Chief Design Officer lenses; the founder may reverse them. **These were relayed to me in a message from the coordinator. I did not read them from a primary file: the ruling file lives in the claude.ai Project and I cannot open it from here. The words below are written from that relayed text.** Anywhere this document earlier gave a one-ask-a-day default, that default is SUPERSEDED by the Q1 ruling.

- **Q1, Ruled:** up to two setup asks a day, at most one per session, at most one OS-alert or consent ask a day, never during recording, Review or export. This replaces the one-a-day default in `apps/mobile/src/lib/asks/next-ask.logic.ts` and the matching lines in PRD-REQ-001 and principle 10. The PRD edit goes through `product`.
- **Q2, Ruled:** there is no feed in the IA. Read it as the existing after-save card plus one quiet text row in Home's footer slot (O-06 precedent).
- **Q5, Ruled:** use the word "Save a copy" for A4, subject to the content-rules test.
- **Q10, Ruled:** no second-parent ask in 1.0.
- **Open with a neighbour:** Home pictures PR #1567 proposes that the picture card counts inside the two daily asks; its Q7 asks whether it should sit outside. This proposal assumes it counts inside until #1567's Q7 is answered.

Marks: [verified: file:line] means I read that line in this worktree (develop at `19602c567`). [unverified] means I did not read it, or it needs a device or a person to confirm. I have not run the app; nothing on a device is verified.

## 0. The short version

1. The Settings home on `develop` is already regrouped (header card, Plan, Children, Writing, Your letters, Privacy and security, Help and legal, About) [verified: apps/mobile/src/app/settings/index.tsx:117-212]. A further regroup is already designed and waits for the tree test T1 [verified: docs/design/IA-FINAL-20nov.md:391-406]. This proposal builds on that regroup and does not invent a third. What it adds is: three merges, one placement change, the removal of four row sub-lines, and a clear rule for which rows may also appear as a quiet ask.
2. Nine setup actions were considered. Four are recommended as asks (reminder time, Keep the book, App lock, Save a copy), two are held until their build flag or counsel gate opens (Back up recordings, second parent), and three are rejected as asks and stay in Settings only (language, pictures access, names on the lock screen). Section 3 gives the reason for each.
3. The founder's "1-2 a day" conflicts with a written requirement: PRD-REQ-001 says at most one ask per session and one per calendar day [verified: docs/prd/v2/features/F02-account.md:216], the code enforces one per day [verified: apps/mobile/src/lib/asks/next-ask.logic.ts:14,79], and principle 10 says one permission or consent sheet per session [verified: docs/prd/v2/03-goals-and-principles.md:38]. Going to two a day is a scope change; it is now Ruled (see the top of this file, Q1): two a day, one per session, one OS-alert or consent ask a day. My earlier one-a-day default is superseded.
4. Every ask is a doorway, never a replacement. The Settings row stays, in the same place, whatever the person answers to the ask.

## 1. Audit of every current Settings row

Source for every "where" cell: `apps/mobile/src/app/settings/index.tsx` on `develop`. "Home" means the Me tab body, which is the same component as `/settings` [verified: apps/mobile/src/app/(tabs)/you.tsx:7-12]. Every row is a push to its own page, no accordions [verified: index.tsx:28-29]. Verdict words: KEEP (stays as is), MOVE (same row, new place), MERGE (two places become one), PROMOTE-TO-DAILY-ASK (the row stays and the same setup can also be offered as an ask card), DEMOTE (less prominent than now).

| # | Row | Where now | What it does | Verdict | Reason |
|---|---|---|---|---|---|
| 1 | Header card | Top, index.tsx:119-126 | The name the person signs as, plus "On this phone" or the sign-in line. Opens Account when sign-in is in the build [verified: apps/mobile/src/components/settings/settings-home.logic.ts:65-77] | KEEP | One card, no plan words. Fixed by the Me tab states [verified: IA-FINAL-20nov.md:342] |
| 2 | Signed-out card | Top, index.tsx:131 | Replaces the header card in states B and C (signed out, local start) [verified: apps/mobile/src/components/settings/settings-home.logic.ts:93-113] | KEEP | It is already the standing door to Keep the book; no change |
| 3 | Plan | Directly under the card, index.tsx:127,133 | Free, Plus or Plus, shared, with its line; opens `/settings/plus` | KEEP, fixed place and label | The Terms name "Settings, Plan, Manage subscription" as the cancel path and "Settings, Plan, Request a refund" as the refund path [verified: docs/legal/terms-of-service.md:119,128]. The code says a row labelled Plan must be here in every build, one tap from home (CCO-9, CTO ruling 8 Nov 2026) [verified: index.tsx:99-101; apps/mobile/src/components/settings/settings-home.logic.ts:50-55]. I could not find the CCO-9 heading in `docs/agents/exec/RULINGS.md`; the code comment is my only source for its number [unverified] |
| 4 | Each book (child) row | Children, index.tsx:139-146 | Opens "{child}'s book": details, Hide this book, Delete this book | KEEP | Working title "Books" is proposed [verified: IA-FINAL-20nov.md:374-380]; the built title is "Children" |
| 5 | Add a child | Children, index.tsx:147 | Opens the add-a-book form | KEEP | Word "Add a book" is a PROPOSED content change, not mine |
| 6 | Hidden books | Children, only while one is hidden, index.tsx:149 | The way back from Hide this book | KEEP | Already shows only when it applies |
| 7 | "Not set" beside a book with no birthday or due date | Children row trailing text, index.tsx:143 | Says a detail is missing | DEMOTE | It is a small gap word on a home list, against "celebrate what exists, never count gaps" [verified: CLAUDE.md content rules]. Not a count, so low risk, but the ask in section 3 (A5) is the better way to fill it. Recommend no trailing text. `content` decides |
| 8 | Spoken language | Writing, index.tsx:153 | Primary language plus up to two more; starts a language download [verified: language.tsx:1-14] | KEEP, with Storage merged in | The choice is already made in first run [verified: apps/mobile/src/app/onboarding.tsx:48-51 imports the language picker; whether it always shows is unverified]. See row 14 |
| 9 | Your words | Writing, index.tsx:154 | "With small fixes" or "Exactly as said" as the default for new letters; each letter can still be changed in Review [verified: your-words.tsx:12-16] | KEEP | No ask: see section 3, rejected list |
| 10 | Reminders | Writing, index.tsx:155 | Master switch, how often, time, month and birthday messages, names on the lock screen [verified: reminders.tsx:206,318,321] | PROMOTE-TO-DAILY-ASK (already one) | The reminder card after the first letter is the existing first ask [verified: lib/asks/next-ask.logic.ts:80-81]. Row stays. MOVE, conditional on T1: it leaves Writing for a "Days and reminders" group, as IA-FINAL 7.3 designs; the layout that ships first is 7.2, where Reminders stays in Writing [verified: IA-FINAL-20nov.md:374-387] [verified: IA-FINAL-20nov.md:395-402] |
| 11 | Appearance | Writing, index.tsx:156 | Theme and reading size [verified: appearance.tsx:28-30] | KEEP | No ask: a theme is something a person looks for, and there is no moment that is not a guess |
| 12 | Where your letters live | Your letters, index.tsx:160 | Where the book is kept, what brings it to a new phone; shows Export and Backup rows too [verified: where-letters-live.tsx:16-28,64-68] | KEEP, first row of "Keeping your book" | IA-FINAL 7.2 and 7.3 already group it with Save a copy [verified: IA-FINAL-20nov.md:374-406]. Its Export and Backup rows are doors to the same pages, not copies of the settings (state read from one place) |
| 13 | Export your book | Your letters, index.tsx:161 | Makes a copy of the book | PROMOTE-TO-DAILY-ASK | A copy after a month of letters is a natural, warm moment (A4). Row stays. "Save a copy" as the visible word is already PROPOSED [verified: IA-FINAL-20nov.md:422] |
| 14 | Storage | Your letters, index.tsx:165 | Language downloads: how big, remove. Letters and recordings never appear there [verified: storage.tsx:24-28] | MERGE into Spoken language | It lists only what Spoken language downloads, and the glossary already says "Settings > Languages and speech" for the act [verified: packages/content/BRAND.md "language pack" row]. It sits under "Your letters" today, which a parent could read as their letters. Still two taps from Me, so C-REQ-016 holds [verified: settings/_layout.tsx:15]. If the later Pictures and videos storage group (NS-52, after 1.0) [verified: IA-FINAL-20nov.md:330] lands, it needs its own home: see Q6 |
| 15 | Recently deleted | Your letters, index.tsx:162 | 30-day shelf for deleted letters with Restore and Erase now [verified: recently-deleted.tsx:27-30] | MOVE | Into "Keeping your book", as IA-FINAL 7.3 does. Restore is never gated (D-085) [verified: docs/prd/v2/03-goals-and-principles.md:35] |
| 16 | Back up my recordings | Your letters, only when `capabilities.backup` is on, index.tsx:164 | Encrypted backup of the owner's recordings; one turn-on sheet records a consent act first [verified: backup.tsx:12-24] | MOVE, and PROMOTE-TO-DAILY-ASK later | Into "Keeping your book". The flag is off in every `eas.json` profile, so the row is absent today [verified: IA-FINAL-20nov.md:88]. Ask held: see A6 |
| 17 | Erase everything on this phone | Your letters, only when no account ever claimed the phone, index.tsx:168-170 | Erases every book, letter, recording and setting; two steps [verified: erase.tsx:24-30] | MOVE | To the untitled last block with Delete account, as IA-FINAL 7.3 designs [verified: IA-FINAL-20nov.md:402-403]. One destructive place, away from "keep" rows |
| 18 | App lock | Privacy and security, index.tsx:175-181 | Face ID or passcode switch; "Ask again after" [verified: app-lock.tsx:14-25] | KEEP and PROMOTE-TO-DAILY-ASK | First row of its group by ruling CDesO-1 [verified: index.tsx:174]. Ask: A3 |
| 19 | Privacy | Privacy and security, index.tsx:182 | Facts, consents, who can see it, Export and Recently deleted shortcuts, the two documents [verified: privacy.tsx:21-40] | KEEP, untouched | Counsel and privacy own this page (CPrivO-5, LEGAL-REQ-003, -006) [verified: privacy.tsx:21-23]. Its Export, Recently deleted and App lock rows are deliberate second doors ("one setting, two doors", CDesO-1) [verified: privacy.tsx:31-35]. Do not remove them |
| 20 | Delete account | Own block above Help, only when signed in, settled, and the build flag is on, index.tsx:187-191 | Two-step deletion with a 30-day window [verified: delete-account.tsx:2-15] | KEEP, MOVE within the same file | D-129: hidden unless the build is switched on; this file is the only one that names the route [verified: docs/DECISIONS.md:996; index.tsx:50-51]. Moving the block next to Erase keeps both rules. No ask, ever |
| 21 | Help | Help and legal, index.tsx:194 | Opens Mail with a fixed subject [verified: index.tsx:44-46] | KEEP | LEGAL-REQ-014 [verified: index.tsx:45-46] |
| 22 | If you are struggling | Help and legal, index.tsx:195 | Lines for the phone's region; Lines in other countries | KEEP | Always present, never behind a flag (D-034) [verified: index.tsx:45-47] |
| 23 | Legal | Help and legal, index.tsx:197 | One page for the Terms, the Privacy Policy and Licenses [verified: legal.tsx:8-12] | KEEP | Legal text stays where counsel put it |
| 24 | Version, the early-version note, the sign-off | About, index.tsx:201-212 | Version and build, the registered note word for word, then the sign-off | KEEP verbatim | The note is registered text (D-060, K-13), unstyled, with no heading of its own (CLO-5) [verified: index.tsx:36-42] |
| 25 | Row sub-lines on Me home: Spoken language, Export, Recently deleted, Storage | index.tsx:153,161,162,165 | One-line help under each row | DEMOTE | Each help line repeats what the page says. Showing them only on the destination page makes Me shorter and easier to scan. The Plan sub-line stays because it is the registered free-letters line [verified: index.tsx:127; apps/mobile/src/components/settings/settings-home.logic.ts:22-28]. Content and design own the change; it is optional (Q9) |

Rows reached from inside other pages, for completeness: Account (Sync, Devices, Sign out) from the header card [verified: account.tsx:2-9]; Licenses from Legal; Lines in other countries from If you are struggling; Hidden books, Delete this book under each book. None changes.

Two things I found that are not row verdicts:
- The built stack title is "Settings" while the tab heading is "Me", so a deep link to `/settings` shows a different word over the same body [verified: IA-FINAL-20nov.md:555]. Not ruled yet. See Q8.
- The second-parent caption is described in the Me spec (one small tappable caption below the fold) [verified: docs/design/specs/06-HOME-BOOK-ME-IA-11nov.md:187], but `settings/index.tsx` has no such row [verified: index.tsx:113-214, no family row]. Whether it was built elsewhere I did not check [unverified].

## 2. Proposed Me and Settings structure

Tab order is Home, Moments, Book, Me when the Moments flag is on, Home as landing (DC-4, ruled by the Chief Design Officer, not founder-decided) [verified: docs/DECISIONS.md:1224; docs/design/moments-design-closure.md:44-47]. The flag is off today, so a build draws Home, Book, Me [verified: docs/design/specs/06-HOME-BOOK-ME-IA-11nov.md:19]. Me is last either way, so this proposal does not touch the bar. The bar carries no badge, dot or mark, ever (DC-4) [verified: docs/design/moments-motion-spec.md:25,95].

Me's job is "Look after my account and books" [verified: 06-HOME-BOOK-ME-IA-11nov.md:16]. Me never holds a letter, a lamp or a count [verified: same line]. On day one it is long and the least visited tab, so its first screen is Account, Plan and Books [verified: 06-HOME-BOOK-ME-IA-11nov.md:193].

Group titles below are the built words or the working titles already in IA-FINAL. The "job" column is for the team only and is never shown. `content` names anything not already built.

| Order | Group (title) | Parent's job | Rows, in order | Notes |
|---|---|---|---|---|
| 0 | Header card, then Plan (no title) | "Who am I here, and what do I pay" | Account card or Sign in card; Plan | Fixed. Plan stays labelled Plan, directly under the card (CCO-9) |
| 1 | Books (built: Children) | "Look after each child's book" | Each book; Add a book; Hidden books (only while one is hidden) | Unchanged but for the title |
| 2 | Writing | "Say it my way" | Spoken language (its page ends with "Downloaded on this phone", which is today's Storage page); Your words; Appearance | Storage merged in. Appearance stays here, as IA-FINAL 7.3 has it |
| 3 | Days and reminders (working title) | "Hear from the app when I want" | Reminders; Days (when the Days flag is on); Past letters on Home (when built) | From IA-FINAL 7.2 and 7.3 [verified: IA-FINAL-20nov.md:374-402]. I did not check whether Days or Past letters are built [unverified] |
| 3b | Second-parent caption (standing, not a row) | "Add my child's other parent" | One quiet caption, only while co-parent is not live | Below the first-screen fold, never under the export group, per the Me spec [verified: 06-HOME-BOOK-ME-IA-11nov.md:187]. Where co-parent is live, the people rows replace it here |
| 4 | Keeping your book (working title) | "Keep the book safe and take it with me" | Where your letters live; Save a copy (built: Export your book); Back up my recordings (only when the build has it); Recently deleted | Four rows, all about the same job. Recently deleted sits last: it is the undo, not the plan |
| 5 | Privacy and security | "Who can see it" | App lock; Privacy | Title, order and contents as built. Counsel-held page |
| 6 | (no title) | "Leave" | Erase everything on this phone (only when no account ever claimed the phone) or Delete account (signed in, settled, build flag on) | Only one of the two ever shows, because their conditions cannot both hold [verified: apps/mobile/src/components/settings/settings-home.logic.ts:108-122]. D-129 holds |
| 7 | Help and legal | "Get help, read the terms" | Help; If you are struggling; Legal | Unchanged. Struggling always present |
| 8 | About | "What version is this" | Version; the early-version note word for word; the sign-off | Unchanged |

What this changes from today, in six lines: Storage merges into Spoken language; Reminders leaves Writing for its own group; "Your letters" becomes "Keeping your book" and gains Recently deleted at the end; Erase joins Delete account in one last block; four sub-lines go; the coming-soon caption has a stated place. What it does not change: Plan, Privacy, Legal, Help, About, App lock, or the tab bar.

How this relates to what is already designed: IA-FINAL 7.2 is "ships first" and 7.3 "built only if T1 finds each task at least as often as 7.2 and not worse on keep-safe tasks" [verified: IA-FINAL-20nov.md:374,391-393]. The table above is not exactly 7.3. The differences, and my recommendation on each:

| Difference | IA-FINAL 7.3 | This proposal | Recommend | Why |
|---|---|---|---|---|
| Storage placement | Stays in "Keeping your book" [verified: IA-FINAL-20nov.md:401] | Merged into Spoken language | This proposal, but only until the Pictures and videos storage group (NS-52) has a home; if that is unsettled, follow 7.3 | Storage lists only language downloads, so under "Keeping your book" a parent can read it as their letters. Q6 |
| Privacy group title | "On this phone" (working title) [verified: IA-FINAL-20nov.md:402] | The built "Privacy and security" | The built title | It is counsel-adjacent text, already shipped, and the 7.3 title was marked PROPOSED, not decided |
| Recently deleted | Inside "Keeping your book" before Storage | Last in "Keeping your book" | This proposal | It is the undo, not the plan |
| Added by me | none | The caption place, four sub-lines gone | as proposed | See rows 25 and 3b |

7.2 is the layout that ships first; 7.3 and this table are for T1 (Q3).

## 3. Setup actions that can appear as an ask in the feed

### 3.1 What "the feed" is

There is no feed in the IA. The nearest thing is Home, which lists no kept letters and starts only a letter, and holds at most one memory slip and one Plus line [verified: 06-HOME-BOOK-ME-IA-11nov.md:52-61]. Ruled (Q2): there is no feed in the IA, so "in feed" means these two places:
- The after-save card: the card the reminder prime already uses, risen over the Book once the letter is kept [verified: apps/mobile/src/components/asks/reminder-prime-ask.tsx:2-5; lib/asks/index.ts:3-5].
- One quiet text row in Home's existing footer slot. There is precedent: DC-4's O-06 is "one quiet Home line after the first kept letter, once, never back after a tap or dismissal... text row, no badge" in the existing footer slot [verified: docs/design/moments-design-closure.md:46]. The slot would hold one row at a time, the ask, the Plus line, or the O-06 line, in that order of who is already shown (Q2).

The first tab-order or Home-order change is not proposed here; a footer row is a slot Home already has.

### 3.2 The rules (proposed)

| # | Rule | Where it comes from |
|---|---|---|
| R1 | At most two asks per local day. At most one per session. At most one of the two per day may lead to an OS alert (notifications, Face ID, photos) or a consent sheet | Founder's 1-2 a day; the per-session cap and the one-permission rule are today's [verified: F02-account.md:103; 03-goals-and-principles.md:38]. The day cap of 1 to 2 is a change to PRD-REQ-001; Ruled (Q1), and the PRD edit goes through `product`. Today's one-a-day code default is superseded |
| R2 | Never while a letter is being made: not on Listen, Write or Review, not while recording or typing, not during export [verified: F02-account.md:99,103]. The card shows only after a letter is kept, or when Home is at rest with the capture cluster idle | Existing rule, stated for the new slot |
| R3 | Never in the first session, and never before the first kept letter: first run asks for nothing (K-02) [verified: docs/product/prd/28-moments-tab.md:96] | Existing |
| R4 | One ask at a time. No stack, no second card behind the first, no "1 of 3" | Principle 10 |
| R5 | The ask is shown only if the setting is not already done. It is silent about anything done | Principle 4: celebrate what exists, never count gaps [verified: 03-goals-and-principles.md:36-37; CLAUDE.md] |
| R6 | Every card has two buttons of equal size: the yes, and "Not now". No close-only dismissal that hides a choice, no pre-ticked answer | Existing cards use three answers and no close [verified: reminder-prime-ask.tsx:14-18]. Apple's rule that a "no" must have an alternative [verified: 28-moments-tab.md:79 names 5.1.1(iv)] |
| R7 | "Not now" returns at most once, after a later milestone, then never. A yes, or the person changing the setting themselves, ends it for good | Mirrors Keep the book (once, once more, never a third time) [verified: next-ask.logic.ts:10-12] and the reminder prime (cap 2) [verified: next-ask.logic.ts:21] |
| R8 | The card's memory is device-only, in plain `asks.*` settings keys, no names, no text, no analytics. Analytics is off in 1.0 [verified: lib/asks/index.ts:7-21,19-21] | Existing |
| R9 | No setup checklist, no "3 of 6 done", no progress ring, no dot on Me or on any row, no red anything, ever. Me never shows how much is "left" | Principle 4; DC-4 no badge |
| R10 | A card never says what the person "hasn't" done, never mentions a time it could have been done earlier, and never names a loss | Content rules [verified: CLAUDE.md] |

Order of asks when two are due the same day: the reminder prime, then Keep the book, then the rest in the table's order. The first ask slot after the first letter stays the reminder prime [verified: next-ask.logic.ts:80-81, F13-REQ-023: F13-prompts-reminders.md:291].

The real cost of Home-footer asks, stated plainly (Review B finding 2):
- `nextAsk()` is called only from `askAfterSave()` after a kept letter and returns `'reminder_prime' | 'keep_book' | null` [verified: apps/mobile/src/lib/asks/index.ts:3-5; next-ask.logic.ts:18]. A3 to A5 are Home-at-rest footer rows, so they need a second call site (Home mount), a widened `NextAsk` union and a new Home footer row component.
- It enforces one a day today: `askShownThisSession || askShownToday` ends the function [verified: next-ask.logic.ts:79], and `lastAskDay` stores a single date [verified: lib/asks/index.ts:17,70]. The ruled cap is two a day, one per session, one OS-alert or consent ask a day. That needs a per-day count and a per-day flag for the permission-type ask, in place of the single date, plus a new test table for `next-ask.test.ts`.
- `AskFacts` has none of the new inputs: App lock state, "ever exported", birthday present [verified: next-ask.logic.ts:29-56]. There is no source of truth for "ever exported" that I could find in `lib/asks` [unverified].
- New `asks.*` device-settings keys are needed, and each must be cleared by the erase-everything path [verified: lib/asks/index.ts:12].
- Footer-slot sharing with the Plus line and the O-06 line needs one owner and a precedence test: `design-systems` for the slot, `mobile` for the build.

So this is a small change to a pure function plus a new component and a second call site, not a one-line change.

### 3.2a Sizes and stacked-PR sequencing (proposed; sizes are estimates, not measured)

Each slice is one PR a reviewer can read in ten minutes. Rows are written by `product` after this is merged; none exists yet. Sizes are the founder's S, M, L scale as used in the backlog; I have not measured any of them.

| Slice | What | Owner | Size | Stacked on | Waits for |
|---|---|---|---|---|---|
| 1 | Storage merged into Spoken language; four row sub-lines removed (audit rows 14, 25) | `mobile`, with `content` and `design-systems` lines | S | none | Q6 and Q9 recommendations (not ruled); touches no ask code |
| 2 | PRD-REQ-001 and principle 10 edit to the ruled cap (docs) | `product` | S | none | nothing; the ruling is in |
| 3 | `nextAsk` two-a-day cap, per-session cap, per-day permission flag, test table | `mobile` | M | slice 2 | nothing |
| 4 | Home footer row component, second call site, one-row precedence with Plus and O-06 | `mobile`, with `design-systems` approval | M | slice 3 | Home pictures PR #1567 for the shared slot |
| 5 | A3 App lock ask and the `asks.*` keys, erase-all clear | `mobile`, `privacy` read | M | slice 4 | privacy on the trigger and words |
| 6 | A4 Save a copy, A5 birthday | `mobile`, `content` | S each | slice 4 | "Save a copy" passes the content-rules test; A5 waits for Q7 |
| 7 | Me regroup (7.3 order, Erase beside Delete account, caption place) | `mobile`, `design-systems` | M | none | tree test T1 |

Slices 1, 2 and 7 do not depend on the ask work. Slices 3 to 6 are one stack. A6 and A7 are not sliced: they stay held.

### 3.3 Candidates

Each recommended card follows PRIV-R21: Shown, Records, Never, Decline [verified: this role's brief; docs/agents/COORDINATION.md section 10 is cited there and I did not re-read it in this run, so treat the line format as [unverified] against that file]. Where a consent or an OS alert follows, the card only opens the existing sheet or alert; I write no consent text. Working copy passes the content rules (no em dash, no gap counting, no AI-writes claim, `{child}` for the child).

| Id | Setup | Settings row it comes from | Trigger | Ask-card moment | If declined | Class | Verdict |
|---|---|---|---|---|---|---|---|
| A1 | Reminder time | Reminders | Exists: first ask slot after the first kept letter; again once after the first month chapter; never if Reminders are already on or the person ever said Yes [verified: next-ask.logic.ts:80-81,89] | After-save card over the Book. Existing buttons: "Yes, evenings", "Pick a time", "No reminders" [verified: reminder-prime-ask.tsx:14-18]. Setup journey proposes the working title "A quiet minute for {child}?" and a bedtime question [verified: docs/design/notifications/SETUP_JOURNEY.md:46-63] | Cap of 2 primes ever; "No reminders" ends the first; the second is the last [verified: next-ask.logic.ts:20-21; F13 row 4c] | Permission (notifications) | Keep as is; no change here |
| A2 | Keep the book (sign in) | Header card, Account | Exists: second letter or first save of session 2; once more from the third letter; never a third time [verified: next-ask.logic.ts:82-91] | The account sheet over the Book [verified: F02-account.md:117] | Later returns once; then only Settings, Account | Consent (Terms, sensitive data) | Keep as is. Counsel-held |
| A3 | App lock | App lock | Lock is off, the phone has a passcode, 5 or more kept letters, and the first month chapter is done [verified: firstMonthDone: next-ask.logic.ts:59-61]; never when the lock is on. A phone with no passcode never sees it, because the switch is disabled there [verified: app-lock.tsx:21] | Home footer row after a kept letter, at rest. Working copy: "Keep the book behind Face ID?" with "Turn on" and "Not now". Turn on opens the App lock page's own authenticate step [verified: app-lock.tsx:18] | "Not now" returns once, after the third month chapter [unverified rule, proposal], then never | Permission (Face ID) | Recommended. Trigger and wording to privacy and content |
| A4 | Save a copy | Export your book | The first month chapter is done, or 10 kept letters, whichever is first; only if the book has never been exported | Home footer row. Working copy: "A month of letters is in the book. Save a copy?" with "Save a copy" and "Not now". Opens the Export page, nothing starts by itself | Returns once after a later month, then never; the row stays | None (the person chooses a place) | Recommended, low priority. Needs the word "Save a copy" approved (IA-FINAL 7.4 marks it PROPOSED) [verified: IA-FINAL-20nov.md:422] |
| A5 | A birthday or due date | The "Not set" on a book | The book has neither a birthday nor a due date, and 2 letters are kept. First run collects one [verified: onboarding.tsx:160-161,291-292]; whether it can be skipped I did not confirm [unverified] | Home footer row. Working copy: "Add {child}'s birthday?" with "Add" and "Not now". Opens the book's details page. Age math, prompt choice and the month and birthday messages depend on it [verified: CLAUDE.md "age math, prompt selection"] | Returns once after the third letter, then never | None | Recommended only if first run can skip it; otherwise there is no gap to fill. Open: Q7 |
| A6 | Back up recordings | Back up my recordings | Only in a build with `capabilities.backup` on; signed in; sensitive-data consent given; the next session after consent [verified: F02-account.md:112] | After-save card. It only opens the existing turn-on sheet, which records the consent first [verified: backup.tsx:18-20] | "Not now" returns once; the Settings row stays | Consent (backup) | HELD. Absent from every build until the flag and counsel's backup line are in [verified: IA-FINAL-20nov.md:88]. Not for 1.0 unless the founder turns it on |
| A7 | Second parent | Caption in Me (not live) | Only when co-parent is live, the person is signed in and the book is synced; not before | One Home footer row, once. Opens the invite flow | Never again after "No thanks"; the caption or rows in Me stay | Consent (a third person's data) | HELD. Not live [unverified]. Counsel-held when it is |

Considered and not recommended as asks (they stay in Settings only):

| Setup | Reason |
|---|---|
| Spoken language | First run already sets it [verified: onboarding.tsx:48-51,79]. The only trigger that would make an ask useful is guessing the language from what someone said, which means reading their words to nudge them. No |
| Pictures access (Moments) | Already decided: the library ask is the parent's own tap inside Moments, and a parent-opened primer is not an unprompted ask (RV-03) [verified: 28-moments-tab.md:96]. The door and its card live in Moments (DC-1, DC-7) [verified: 28-moments-tab.md:146; moments-design-closure.md:74]. A feed ask for pictures would be an unprompted permission ask and would cut across counsel gates G2 and G3 [verified: docs/agents/exec/RULINGS.md:974]. Hold it out of this system |
| Names on the lock screen | Default is off (D-025, C-REQ-009) [verified: SETUP_JOURNEY.md:145], and turning it on gives away more, so the app must not nudge it. It is also forced off while App lock is on [verified: reminders.tsx:318-321 comment; app-lock.tsx:23] |
| Your words default | Would need a counter of how often someone picks "Exactly as said" in Review. I found no such counter [unverified], and Review already has a per-letter control. Not worth a new data point |
| Appearance and reading size | No honest trigger. Any trigger guesses at eyesight or taste |
| Analytics consent | Off in the whole 1.0 line (D-124 item 3) [verified: next-ask.logic.ts:12-13] |

### 3.4 One card, written out (A3), so the shape is concrete

```
+--------------------------------------------+
|  Keep the book behind Face ID?             |
|                                            |
|  [ Turn on ]                    Not now    |
+--------------------------------------------+
Shown: Home footer, one row, when the capture cluster is idle and no other ask has shown this session.
Records: whether you said Not now, and when, on this phone. Nothing is sent. The lock setting itself, on this phone.
Never: your letters, your child's name or anything about you leaves the phone because of this card. No count, no badge, no second card behind it.
Decline: Not now closes the row. It may return once, a few months on. The App lock page in Me works the same any day.
```

A4, Save a copy (working copy, `content` to rewrite; passes the content rules by construction, and the word "Save a copy" is Ruled under Q5 subject to the content-rules test):

```
+--------------------------------------------+
|  A month of letters is in the book.        |
|  Save a copy?                              |
|                                            |
|  [ Save a copy ]                Not now    |
+--------------------------------------------+
Shown: Home footer, one row, once the first month chapter is done (or 10 kept letters), when the capture cluster is idle, no other ask has shown this session, and the day has fewer than two asks.
Records: whether you said Not now, and when, on this phone. Nothing is sent. The copy itself goes where you choose when you save it.
Never: your letters or your child's name go anywhere by themselves because of this card. Nothing is saved until you choose a place. No count, no badge, no mention of a copy you do not have.
Decline: Not now closes the row. It may return once after a later month, then never. Save a copy in Me works the same any day.
```

A5, a birthday or due date (working copy):

```
+--------------------------------------------+
|  Add {child}'s birthday?                   |
|                                            |
|  [ Add ]                        Not now    |
+--------------------------------------------+
Shown: Home footer, one row, only when the book has neither a birthday nor a due date and 2 letters are kept, at rest, with the day under two asks. Never while a letter is being made.
Records: the date you enter, on this phone, in {child}'s book details. It syncs only if this book already syncs, under the sync consent you gave. The card itself records only that you said Not now, and when.
Never: the date appears in a notification, or in analytics or logs. It is never guessed from a letter. No count, no "missing" label.
Decline: Not now closes the row. It may return once after the third letter, then never. {child}'s book details in Me works the same any day.
```

The body line, and the working copy of A1 to A3, are for `content` to write. I have not touched `packages/content`.

## 4. Constraints check

| Constraint | Where it comes from | Result |
|---|---|---|
| The machine may remove and repair, never add meaning; nothing writes or "shapes" a person's words | CLAUDE.md constitution | Pass. No ask or row changes any text. Your words stays a plain choice of view; A-cards only open existing pages |
| No gap counting; celebrate what exists | CLAUDE.md content rules; principle 4 | Pass with one flag: "Not set" on a book with no birthday (audit row 7) should go. Rule R9 bans any "left to set up" count, checklist, or progress |
| No streaks, points, badges | CLAUDE.md | Pass. Nothing in this proposal counts days of use. A3 and A4 triggers count kept letters and the first month chapter, which exist today as plain facts [verified: lib/asks/index.ts:59-66; next-ask.logic.ts:59-61], and are never shown to the person |
| No fear, guilt or loss language | CLAUDE.md | Pass in working copy. A4 must not become "keep your letters safe": copy review required |
| One ask at a time | Principle 10; PRD-REQ-001 | Partly changed. Per session stays 1. Per day goes 1 to 2, Ruled (Q1, relayed). At most one OS-alert or consent ask per day keeps the spirit |
| Never during recording, Review or export | F02 6.1 | Pass (R2) |
| No entry text, transcript, audio or child name in analytics, logs, crash reports | CLAUDE.md privacy rules | Pass. Ask memory is device-only (R8). A card may show `{child}` on screen, never in a notification |
| Safety tiers stay on the device | CLAUDE.md | Not touched |
| Plan row labelled Plan, one tap from Me's top | Terms 8.x; CCO-9 as quoted in code | Pass (audit row 3) |
| Delete account route named only in `settings/index.tsx`; hidden unless the build is switched on | D-129 | Pass. The block moves inside the same file; no ask |
| If you are struggling always present | D-034 | Pass |
| Early-version note word for word, no heading | D-060, K-13, CLO-5 | Pass |
| Privacy page, consents, names switch, backup consent, sensitive-data consent stay where counsel put them | LEGAL-REQ-003, -006, -008; CPrivO-5; F08-REQ-039 | Pass. No consent text is rewritten; cards open existing sheets only. Privacy keeps its second doors |
| Co-parent: not a tab; at most a caption in Me | 06 spec P8 | Pass (row 3b) |
| Pictures access is the parent's tap inside Moments | RV-03, DC-1 | Pass: rejected as a feed ask |
| Every Settings row within 2 taps from Me | C-REQ-016 [verified: settings/_layout.tsx:15] | Pass. Storage under Spoken language is 2 taps |
| Tab order Home, Moments, Book, Me, no badge | DC-4 | Pass. Unchanged |
| Glossary: "Back up", "Save a copy" are not banned words, "photo moments" is | BRAND.md | "Save a copy" is a PROPOSED word, not yet in the glossary; `content` to add before any copy ships [verified: IA-FINAL-20nov.md:422] |
| Changes to registered promises, scope and dates are the founder's (CR-73) | CLAUDE.md | Q1 and Q2 are Ruled under the founder's delegation (relayed) |

## 5. Open questions for the founder

Each has my recommendation and the default I would use if there is no answer. Q1, Q2, Q5 and Q10 are Ruled and their rows say so. "Default" means what happens in the plan if nothing is decided.

| # | Question | Recommendation | Default if unanswered |
|---|---|---|---|
| Q1 | Change PRD-REQ-001 from one ask a day to two? | RULED (relayed, see top): up to two setup asks a day, at most one per session, at most one OS-alert or consent ask a day, never during recording, Review or export. Replaces the one-a-day default in `next-ask.logic.ts` and the matching lines in PRD-REQ-001 and principle 10; the PRD edit goes through `product`. My one-a-day default is superseded | Ruled |
| Q2 | Where does a non-permission ask live? | RULED (relayed, see top): there is no feed in the IA; read as the existing after-save card plus one quiet text row in Home's footer slot (O-06 precedent). Shared with Home pictures PR #1567, whose Q7 asks whether the picture card sits outside the two a day; assumed inside until answered | Ruled |
| Q3 | Ship the 7.3 regroup now, or after tree test T1? | Test first. T1 compares this table with the built layout on "keep safe" tasks. The Storage merge and the four sub-lines are safe to ship without T1 | Keep today's layout; merge Storage only |
| Q4 | Offer App lock as an ask (A3)? | Yes, after the first month chapter and 5 letters, only on a phone with a passcode | Yes, same trigger. Privacy to confirm |
| Q5 | Rename Export your book to "Save a copy" before A4 ships? | RULED (relayed, see top): use the word "Save a copy" for A4, subject to the content-rules test | Ruled |
| Q6 | Merge Storage into Spoken language, given the later Pictures and videos storage group (NS-52)? | Yes now. When NS-52 lands, Pictures and videos gets its own row in Keeping your book, since it is the person's pictures, not a download | No merge until NS-52's home is settled |
| Q7 | Can the first-run birthday or due date be skipped? If yes, ask for it once later (A5)? | Yes to A5 once, after the second letter. If it cannot be skipped, drop A5 | No A5 |
| Q8 | One name for one screen: "Me" tab heading over a "Settings" stack title? | "Me" on the tab and heading, "Settings" never shown except where the Terms say "Settings, Plan". The job line "Account and settings" already covers the Terms' words | Unchanged (OI-15 stays open) |
| Q9 | Remove the four sub-lines from Me home (audit row 25)? | Yes; keep each on its own page. Keep Plan's line | Keep them |
| Q10 | Should the second-parent ask exist in 1.0? | RULED (relayed, see top): no second-parent ask in 1.0. Caption only | Ruled |
| Q11 | Drop "Not set" next to a book with no birthday (audit row 7)? | Yes, show nothing; A5 handles it | Keep, flagged to content |

Q1, Q2, Q5 and Q10 are Ruled by Karma under the founder's delegation (relayed, not read from a primary file; the founder may reverse). Q3, Q4, Q6 to Q9 and Q11 are still open recommendations. Everything else is a recommendation for the owning agent: `design-systems` for the Me layout, `content` for words, `privacy` for A3, `mobile` for the build.

## 6. What I did not do, and the limits

- No app code, no copy change, no backlog row, and no edit to `docs/DECISIONS.md`. The Q1 ruling needs a D-### entry and a PRD-REQ-001 edit; both are follow-ups for me, as Proposed.
- The four rulings (Q1, Q2, Q5, Q10) were relayed to me by the coordinator. I did not read them from a primary file.
- I read `settings/index.tsx`, `apps/mobile/src/components/settings/settings-home.logic.ts`, `lib/asks/index.ts`, `next-ask.logic.ts`, the header comments of every other `settings/*.tsx` screen, and parts of `reminders.tsx` and `privacy.tsx`. I did not read every line of the Reminders, Privacy, Account or Export screens, so row-level details inside them are not audited.
- I read IA-FINAL-20nov.md sections 5 to 7 in the parts that name Me and Settings, the 06 Me spec sections 1, 5 and 6, SETUP_JOURNEY.md in full, F02 section 6.1, principle 10, DC-4, RV-03, D-129, D-165's neighbours, BRAND.md's glossary, and the Terms' cancel and refund lines. I did not re-read `docs/agents/COORDINATION.md` section 10, PRD.md or `docs/legal/ENGINEERING_REQUIREMENTS.md` in this run, so the Shown, Records, Never and Decline wording is from my brief only.
- No device, no user test. Which ask moments feel organic and which feel pushy is a hypothesis. A five-parent session (as SETUP_JOURNEY.md proposes for the reminder) should check A3 to A5 before they ship. Analytics is off in 1.0, so any check is by interview, not telemetry [verified: SETUP_JOURNEY.md:18].
- "CCO-9" as a ruling number comes from code comments only [unverified in RULINGS.md]; the Terms lines are the binding source for the Plan row.
