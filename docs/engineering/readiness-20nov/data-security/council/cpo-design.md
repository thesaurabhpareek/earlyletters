# Council return: Chief Product Officer and Chief Design Officer

Re: "Open decisions before start" (Karma, 20 Nov 2026), sections D, E, F and the seat notes on A to C.
Written 20 Nov 2026 by two Claude roles (CPO, then CDesO). Not posted anywhere. Not legal, tax or accessibility-audit advice: every legal point says "counsel must confirm".

## 0. What I read, and what I did not

Read in full from origin/develop (fetched 20 Nov): `docs/agents/exec/COUNCIL.md`, `.claude/skills/early-letters-cpo/SKILL.md`, `.claude/skills/early-letters-design/SKILL.md`. Also read: the decisions list; the data-security pack docs `07-communication-1` to `-4` from branch `agent/sync/readiness-datasec-comms` (PR #1001); `docs/design/NOTIFICATIONS.md`; PRD V2 `features/F02-account.md`; the readiness README section 5; plan #847 (`17` and `17b`, section 3a and 5.2 to 5.4, from the PR head); CR-69 and CR-70 in `docs/agents/cto/RULINGS.md`; errata E13, E32, E43, E47, E51, E59; GAP-LOG G-D21; `reminders.en.ts`; the question comments on #934 (24 Q-P rows) and #935 (13 Q-D rows); the words packet in PR #870; the Find words in PR #894; the let-it-go words in PR #866.

Not read or not verifiable here: any phone behaviour (nothing has run on a device, per NOTIFICATIONS.md and 07.4); Apple's pages on notification categories and Show Previews [U]; WCAG 1.4.11 text [U, from memory]; CAN-SPAM [U]; hosted Supabase state [U]; D-121 and D-130 as they stand today (my skills quote them as of 31 Oct; the plan on 20 Nov speaks of Builds 13 to 15 and does not say whether Build 13 has server features on) [U].

How to read the verdicts: AGREE (the default stands), CHANGE (to what, why), NEEDS COUNSEL or NEEDS FOUNDER (the exact question). Scope, dates, what a parent is promised and every word a parent reads are founder items whatever I say; where I write AGREE on one of those I mean "this is my recommendation to him", not a ruling.

---

# PART 1. Chief Product Officer

Frame for every item: the person is a parent at 2 a.m. with one free hand, or a parent whose inbox is the only key to the book. The release is a bet on one thing: that a parent keeps letters and trusts that they stay hers (rank 1 job, "never lose what I made"). The guardrails in PRD 03 section 4.3 are hard stops: no lost letter, no paywall outside its triggers.

## D1. Alert emails at v1

Verdict: CHANGE (partly), and NEEDS FOUNDER on one question.

The default ("build only what Supabase Auth and built senders already send; others after first outside family") is right for A4, A5, A7, A8 and wrong for A1.

What I found and the default does not say:
- 07.2 says "No product card names a security alert". True of the locked cards 08 to 11, 19, 21 [V by my own grep of `docs/product`]. It is not true of PRD V2: `features/F02-account.md` F02-REQ-017 is **P0** ("New-sign-in email, driven by the server"), and its sequencing line (F02, "Sequencing") puts the new-device email **before** "the switch flip for anyone outside the founding family (F02-REQ-024)". F02 also says F08 escrow releases no key to a session whose email has not been queued. `docs/emails/CATALOG.md:51` says 1.0, which is where "not launch-blocking" in the list comes from.
- So the default "after first outside family" reverses the PRD's own order. Either the PRD row is superseded (and nobody has said so) or the default is wrong. The source order in PRD README puts founder decisions first and the cards above PRD V2 (CR-66), but no card or errata row demotes F02-REQ-017 [V: 07.4 section 5.1 says E1 to E73 and CL-001 to CL-147 do not close it].
- The PRD's design and 07.2's design differ: the PRD email carries a "Not you? Secure your account" link to a scanner-safe Stop page and collapses to one summary after 5 new sessions in an hour; 07.2 rule 3 allows no action link and rule 6 never summarises A1.

My recommendation (one, for the founder):
1. A1 (new device) is built before the switch flip for any family outside the founder's. It is cheap insurance for a passwordless book whose only credential is the inbox, and the PRD already says so. A5 and A7 already exist and ship as they are.
2. A1 ships **without** an action link at first (07.2 rule 3), because the Stop page is the part that only matters once recording backup is on, and the repo says backup stays off until built (C7: the "Stop this and sign out" link is dead [V per list]). The email tells the parent the path in words (see the CDesO wording note). The Stop page ships with backup, not before.
3. Keep the PRD's safety valve in a form 07.2 can accept: the first 5 new-session emails in an hour send individually; further ones fold into one summary sent within minutes, never held to the next day. This answers 07.2's own worry (a flood hiding the one real warning) without delaying a real alert.
4. A6 (email after "Sign out other devices") and A3 (recovery) after the first outside family, as the default says. A3 has a prerequisite that is not an email: the account-recovery runbook (BL-598) does not exist [V 07.2 section 1]. A parent locked out of a book needs a human route before any outside family, whether or not an alert is sent.

Question for the founder, exact wording: "F02-REQ-017 says the new-sign-in email is P0 and ships before anyone outside your family signs in. The data pack proposes after. Which stands?" My answer: PRD V2 stands for A1, as above. Default if no answer: PRD V2 order (A1 before the flip), because the cost of building it is smaller than the cost of an outside family on a passwordless account with no warning.

Condition: CISO reads rule 3 (no link) against the PRD's Stop page, and CPrivO reads the device-class word (07.4 asks both). If CISO says the Stop page is needed at v1, A1 waits for the Stop page and the flip waits for A1.

Record when closed: "D1 closed (date): A1 new-device email is built before servers go on for any family outside the founder's, no action link until backup ships, 5-an-hour summary; A5 A7 A8 as built; A6 and A3 after first outside family; BL-598 recovery runbook written before the flip. Founder: yes/no on F02-REQ-017 order. CPO, CDesO, CISO, CPrivO read."

## D2. Alerts in quiet hours; alert cap

Verdict: AGREE on quiet hours. CHANGE on the cap statement (reconcile with D1).

- Exempt from quiet hours: yes. A takeover warning eight hours late is worse than a 3 a.m. email, and sign-in mail is already exempt (`CATALOG.md:137`). The parent's phone decides whether Mail makes a sound; we do not.
- "A1, A3 to A9 never capped; A2 capped at 5 per 24 h [E, our number]": A2 has no email by default (D3), so the 5 is a number for a feature that does not exist. Mark it dormant in the register so nobody tests or builds it. Replace "A1 never capped" with the D1 summary rule.
- Add: a security email is never marketing and never carries a count, a streak or a gap word (it does not today).

Record: "D2 closed: security alerts exempt from the 21:30 to 07:00 hold; A2 cap is dormant until A2 email exists; A1 follows the 5-an-hour summary rule."

## D3. Email after repeated wrong codes; lockout or paging

Verdict: AGREE (no email, phone pause only).

An email saying "someone is guessing your codes" frightens a parent and gives her nothing to do. Sound as a signal for us (a server count) and unsound as a message to her. Conditions: (1) any server lockout or paging job is CISO's, and it must never lock a parent out of the local book on her own phone, only out of sign-in (nothing may sit between a parent and a saved letter); (2) the pause line stays plain and has no ticking timer (DESIGN_LANGUAGE rule: no time-boxed UI). The phone pause is in memory only and resets on restart [V 07.2 gap 2]: note that it is advisory, and do not call it protection in any claim.

Record: "D3 closed: no email after wrong codes; phone pause only; server count and paging stay with the CISO as an open item; no copy calls the pause protection."

## D4. Neutral lock-screen body and birthday title (G-D21)

Verdict: AGREE with the default, NEEDS FOUNDER (G-D21 is his, with CPrivO's read), and CHANGE the scope: widen it.

The default is right: with names off, the birthday notification says "Something for the book today"; the birthday wording shows only when the parent turned names on. Add the category with a hidden-preview placeholder (NS-32-R13); the words are in PR #870 row 18 (see CDesO part).

The scope is too narrow. G-D21 fixes the birthday title only. With names off, the built neutral set still puts the child's age in months on a lock screen: `monthOpen` title "Month {month} begins", and the birthday body "A year of letters." Age is derived from the birth date, which the pack classes L4 (stays on the phone). The pack's rule R1 forbids "a due date" and counts; it does not say "age". CPrivO must decide whether the age in months is as private as the name. If yes, the neutral month title becomes a name-free, number-free line ("A new month is open in the book" is the family the content already uses for `monthBodyNeutral`), and the neutral birthday body drops "A year of". I would rule yes (rank the lock screen as the least private surface we use) but it is a promise-adjacent word change, so it goes with the E2 sitting.

Record: "D4 closed: neutral title and body when names are off, including month and birthday; category and hidden-preview placeholder built; names only behind the switch and never with App lock on. Founder approved words (date). CPrivO read."

## D5. Marketing email to app sign-ups

Verdict: AGREE (no; transactional only).

Conditions: (1) the `welcome`, `welcome-coparent`, `welcome-family` templates have no sender (07.1 E12); keep it that way for 1.0; whether a welcome email counts as transactional is a legal question, counsel must confirm [U, CAN-SPAM not read]; (2) any future marketing email needs the founder, the CMO, the CLO and CCO, a separate opt-in that is never pre-ticked and never part of sign-in, and an unsubscribe; (3) the constitution holds: no email ever carries a count of gaps or "we miss you" (07.3 S7 already forbids).

Record: "D5 closed: no marketing email to app sign-ups; transactional only; welcome templates stay unsent in 1.0."

## D6. Notification budget 60 in total

Verdict: AGREE.

60 pending in total, plan notices first inside it, one budgeted notification a day (E13, CL-115, CR-69 A1). NOTIFICATIONS.md says iOS has 64 pending slots and the planner keeps 60 [per that doc, not re-read from Apple]. The built planner plans up to 60 plus 4 plan notices, which is 64, so today's code is at the edge, not over it; BL-966 closes the gap.

Conditions: (1) NS-32-R12 (never a name or letter words on a lock screen by default) needs its passing test before the store cut; the plan already holds the cut for it (17 section 3a); (2) the one-notification-a-day-across-books defect (NS-13-R19 and NS-32-R1b: two notes can fall on one day today) is **not** a never-list row, so I would not hold the cut for it: fix it first in wave 2, before reminders turn on in Build 14 for a wider group, and have the founder write the decision to ship it as a known defect in Build 13 (the plan says only he can make that call); (3) the qa catalogue rows that still say 64 (NS-32-R7, CHECKS-AND-BALANCES:176) are corrected.

Record: "D6 closed: 60 pending in total; NS-32-R12 test before the cut; NS-32-R1b fixed in wave 2 unless the founder writes otherwise."

## E1. Release cut and drops

Verdict: AGREE with the plan 3a recommendations and the defaults on NS-51; NEEDS FOUNDER to confirm (release content is his).

My reasoning, in release terms. The smallest release that keeps the promise is Build 13 with: held screen and one reader (BL-922), the let-it-go words (BL-925/926), BL-928, the second-account fix (BL-961), the P-4 stuck-recording row, and the NS-32-R12 test. Photo and Find ship dark. The bet Build 13 tests: a parent keeps letters on one phone and believes they stay hers. What proves us wrong: tester notes where a parent cannot find her words after keeping, or sees another account's book. The release cannot measure this with analytics (off for the 1.0 line) so the proxy is the Build 13 device sheet and tester notes. Say so in the notes.

Conditions:
1. Do not let the photo stack (six serial hops, each waiting on a roughly 75 minute macOS launch per plan 3b) take review capacity from the P0 keeping rows. Review is the bottleneck (17 section 4; 278 of 324 passes on one day). Order of review: the Q1 rows first.
2. Build 14: if the counsel read on the photo label is late, turn on Find first, photo dark. Find changes no data flow. Share waits for photo code (BL-931) and counsel Q45; say that in the plan, as 3b already does.
3. NS-51 ships 1.1 after counsel and device rows (E32): AGREE. A spike in Build 13 behind a flag is acceptable only if no code path reads the library in the store build [CISO and CPrivO read].
4. No date. The plan sets none and neither do I. See gap 1: the path to Build 13 is mostly founder hands (F4 secret, db deploy re-run, #830, phone list, `app-store` approval).

Record: "E1 closed (date): plan 17 section 3a stands: Build 13 cut waits for the Q1 rows plus NS-32-R12; photo and Find dark in 13; Build 14 turns on Find, then photo after counsel read; NS-51 in 1.1. Founder confirmed (date)."

## E2. Words a parent reads (CPO seat)

Verdict: AGREE with "founder reviews in one sitting", and CHANGE the packet: add what is missing (below). The CDesO notes in Part 2 carry the per-line view. Product points only:
- The packet in PR #870 covers the held screen, share verb, the placeholders, the character-limit line and Find. **No draft text exists for NS-42-R18** (the notice at collection): E51 says first-run ships the links only until the founder approves words. A legal-adjacent notice must be drafted by content, read by CLO and CPrivO, then approved. I did not write it.
- Alert wording (07.2) is intent only; no `comms.alert.*` key exists. It needs a content draft and a CISO read before the sitting, otherwise the sitting approves the intent and not words.
- Sitting size: 69 rows in #870 plus Find (12) plus alerts. Cut the sitting by sorting: rows that a flag keeps dark (photo, share) can wait; Build 13 rows go first (held screen, let-it-go, placeholders, sign-out sheet, NS-42-R18).

Record: "E2 closed: Build 13 words approved by the founder in one sitting (date): [keys]; later-build words held."

## E3. Open product and design questions (Q-P1 to Q-P24, Q-D1 to Q-D13)

Verdict: AGREE with the engineering defaults in all 24 product rows except two NEEDS FOUNDER notes; CDesO view on the 13 design rows is in Part 2 section 6.

Product rows (#934), one line each:
- NS-38: own stack after wave 1 and Drop A, nothing on for outside families: AGREE (matches E43).
- NS-52-S10: position and derived poster name: AGREE.
- NS-47-R38: reading B, already ruled in E45: closed.
- FR-CMP-16 (withdrawal control): read `privacy.tsx` first; add a P0 row if missing: AGREE (founder default in E46).
- NS-40-R9 (region hook): keep fail open, hook off until counsel and CCO answer: AGREE (E47; this is B6).
- NS-01-R36 vs NS-52-R40: R36 holds until NS-52 ships: AGREE.
- NS-47-R37, NS-47-R14, NS-46-R25: AGREE (they only add a place to turn names off or send fewer notes).
- X4-R1: AGREE (nothing on B's screens says A's letters exist; the sign-out sheet speaks to A only).
- NS-40-R7, NS-40-R8 (no age signal; a No sends nothing): AGREE, the card wins.
- NS-42: AGREE (E51).
- NS-37, NS-34, NS-34-R6, FR-QAL-02: AGREE (hand runs marked [stand-in], never green).
- NS-01-R61, NS-52-R10, EXPO_PUBLIC_DAYS_ASK, NS-45, NS-45-R13: AGREE.
- FR-SEC-06 (no owner check for Delete account; Erase everything gets one): AGREE as product. Note it interacts with C1 (re-auth code before deletion). Both can stand: C1 is an email code, FR-SEC-06 is the phone's passcode. Product condition: deletion must not become harder than sign-up (counsel must confirm any rule here).
- **NS-44-O13 (allowance per phone)**: NEEDS FOUNDER, already in the digest as E59. Add one fact: D-082, decided by the founder 4 Oct, says "the first 2 letters **per account** are free". The card default is per phone. They differ by one word, and the record should show the amendment in his words, not only an erratum. Recommendation: per phone for 1.0 (the card), and a D-entry amending D-082. Also a promise to a user, so counsel reads the paywall line.
- **NS-01-R41 / any row that changes a visible promise**: none else.

Record: "E3 closed (date): errata round E69 onward adopts the engineering defaults for Q-P rows listed; O-13 per phone with D-082 amendment (founder); design rows per CDesO."

## E4. FP-9 owner `mobile` (Karma, T1)

Verdict: AGREE.

FP-9 is Apple sign-in email-only scope and foreground revocation (`12-first-run-5.md`). Product consequence to record: with no name from Apple, the parent's display name (the co-parent "From Papa" signature) must be typed by her, which is one more ask. Keep to one ask at a time; place it after the first kept letter, not before.

Record: "E4 closed: FP-9 owner mobile."

## F1. Size exceptions and sequencing

Verdict: AGREE (accept as one concern each; refuse #798 whole), with sequencing conditions.

- Plan #847 (859 plus 96 lines): accept; it is docs, and splitting it breaks the cross-references. Add a staleness line: its capacity numbers were read at 18:20 UTC on 20 Nov and one day is evidence, not a trend (its own caution).
- Photo slices #835 to #840: accept as one concern each. They ship dark in Build 13 (Q2), so the size is review cost now for value in Build 14. That is acceptable only if the P0 keeping rows are reviewed first.
- #798 whole: refuse, as the default says. Five of eight split PRs merged already (#881 to #885).
- H1: per PR when it exists.

Record: "F1 closed: exceptions accepted for #847 (17 and 17b), #835 to #840, H1 as one concern each; #798 not accepted whole. Condition: P0 keeping rows get the first review slots."

## Seat notes on other sections (no objection unless stated)

- A1 Supabase Pro: product view: before the first outside family, not before the first store build, if Build 13 is servers-off. Seven-day backups matter when families' words exist on our servers. If Build 13 is servers-on, before Build 13.
- B1 (no remote push in 1.0) and B2 (nothing leaves the phone): AGREE; both match the constitution and the plan.
- B8 (no screen for a parent's own audit rows): AGREE; the rows go into the export.
- C-section, F2, F3: not my seat. No product objection to the default of F2 (jest-expo and RNTL yes, rest deferred) or F3.

---

# PART 2. Chief Design Officer

Frame: the person is a tired parent in the dark, a grandparent at AX5 with Bold Text, and a parent in a worse moment reading a security email on her lock screen. Standard first (Apple HIG, WCAG 2.2), opinion marked as opinion. I have not seen any of this on a phone: every judgement below rests on the packet text and the code, not a device.

## 1. D2 (design view): alerts in quiet hours

Verdict: AGREE (exempt).

Design reason: a security email arrives in the Mail app, whose own notification settings the parent controls. We do not add a second, quieter way to deliver it. Keep one shape for every alert (section 3). Never use red, urgency words, exclamation marks or a countdown in an alert: the email fonts are off (CL-062) and the voice rules ban fear language, so urgency must come from a clear first sentence, not from styling.

## 2. D4 (design view): lock-screen design

Verdict: AGREE with the default; CHANGE two points.

What the lock screen is: the least private surface we use, read in public, at any text size, with Show Previews set by the parent not by us.

1. Neutral title and body with names off: AGREE. The `days.lock.body.neutral` line ("A day you chose to mark. A few words, if you like.", `WORDS.md:779`, ruled reading B in E45) and the quiet line ("The book is open if you want it.") are calm and name nothing. Both have no question mark, as NS-46-R37 asks. I would not add a flourish.
2. Category and hidden-preview placeholder (NS-32-R13): AGREE, and choose the words in PR #870 row 18 **option A**, "Something for the book, whenever you have a minute." Option B ("Something for tonight.") is wrong: the same placeholder shows for birthday, month and typed-day notes, which do not come at night (the packet says so). Row 19 "A reminder about your plan." is fine; it carries no price or date. Two categories, two placeholders. One design note: iOS shows the app's name beside any notification, so the placeholder does not repeat the brand. Whether iOS also hides the **title** when previews are hidden, and whether the optional "show title" category flags exist, I did not read in Apple's documentation this session [U]. Design requirement either way: with Show Previews on "Never", no title that carries a day name or a name may show. Do not enable any option that shows the title while previews are hidden. Device row NTC-T24 must be run on a phone before this is called done.
3. Month and birthday leak the child's age (see CPO D4). CHANGE: treat age as a lock-screen fact. Titles with names off carry no number: replace "Month {month} begins" with a name-free, number-free line; replace "A year of letters." in the birthday body. Words PROPOSED; founder approves.
4. Keep: interruption level `active`, no sound, no badge (R7); no banner while the app is open (LR-13); names forced off when App lock is on. A badge on the icon would count a gap, which we never do.
5. Under large text, iOS truncates a lock-screen body. The first 40 characters of the title must carry the meaning alone; the lint already caps title 40 and body 110.

Record: "D4 design closed: neutral family title and body; placeholders row 18 A and row 19; no number on a lock screen with names off; device check NTC-T24 passed on a phone (date, model, iOS)."

## 3. Alert wording and layout (07.2, A1 to A9)

These are PROPOSED intents only. I give the design review that content should work from; I do not write the keys.

Shape for every alert, one component: fixed subject (a content key, no variable); one sentence of what happened with the time in plain words and the zone ("Tuesday 17 November, 9:41 PM Pacific"); one sentence of what to do; one line of help. Plain text and the HTML carry the same words. No image, no tracking, no link that signs anyone in (LR-08, LR-09). Body type no smaller than 16 px equivalent; no colour carries meaning (Differentiate Without Color Alone).

Per alert:
- A1 new device. The intent ends "If not, here is what to do." With no link allowed (rule 3), "here is what to do" points at nothing. This is the main flaw. The email must carry the steps itself: "If this was not you: open the app, then Me, then Account, then Sign out other devices. Also change the password of the email account you sign in with." Reason: sign-in is by emailed code and link, so someone with the inbox can sign in again after "Sign out other devices" (07.2 states this for A6). The honest second step is to secure the inbox. CISO confirms the advice is complete. Device word: "an iPhone or iPad", from the app; if unknown, "a new device". Subject: "Your book was opened on a new device".
- A2 repeated wrong codes. Default no email: AGREE. If it is ever built, drop "Your book is safe": that is a security claim we cannot back.
- A3 recovery. "Access to your book was restored on {date}. If this was not you, write to us." Fine. Add a help address in the body, not a link that acts.
- A4 deletion receipts: built; fine. The in-app line I6 and the email must say the same facts (rule 10).
- A5 email changed. Masked new address to the old inbox (first letter and domain): AGREE. Say what changed and what to do if not you, in that order.
- A6 other devices signed out. "Your letters are kept on each phone" is true by I5; keep. The in-app line on the signed-out phone (I5, "Signed out for your safety") and this email use the **same sentences**. Check the existing help line under the control ("other phones will need to sign in again") does not read as "this secures your account". It does not end sign-in by email.
- A7, A8, A9: AGREE as drafted. A9 passkey: same shape as A7.
- I9 (an in-app echo of an alert): AGREE no new screen in v1 (Q-COM-6 default). One more place to read about a fear is not a feature.
- Q-COM-4: mask the new address to the old inbox: AGREE.
- Q-COM-5: no email for wrong codes: AGREE.

Conflict to settle with CPO: the PRD's "Not you? Secure your account" wording and link (F02-U33) against 07.2's no-link rule. Resolution above: no link at v1, Stop page ships with backup.

Record: "Alert wording: content drafts `comms.alert.*` to the shape above; A1 states the in-app path and the inbox step; CISO read; founder approved (date)."

## 4. E2 words: line-by-line (from PR #870, #894, #866)

Verdicts are for the words, on the standard and the voice. Founder approves; counsel where marked.

- Held screen, row 6: A "Finish setting up to open your book here." AGREE A. B says "ready", which the phone cannot know (the packet says so).
- Held screen, row 7: A "There is nothing on this phone to copy yet. ..." CHANGE: drop "yet" (a gap word; Find's card bans it too, R39). "There is nothing on this phone to copy. Your letters are in your account, and each recording is on the phone that made it." Counsel reads where data is.
- Row 8 VoiceOver hint "Signs out, so you can sign in a different way.": AGREE; it says the consequence before the tap.
- Row 9 "More letters are on their way.": AGREE (no count). Show it only while the pull is actually arriving.
- Row 10 and 12: AGREE; counsel on row 10 as the packet says.
- Rows 13 and 14 (second account): AGREE the plain version. Design note: the screen tells the signed-in person that another account's book is on this phone; e2e E withdrew the screen for that reason. The founder default (a screen) stands; CPrivO read. One action only: Sign out.
- Sign-out sheet rows 15 to 17: AGREE; ship row 16 only once Erase everything shows after sign-out (the packet's own condition).
- Lock placeholders rows 18 and 19: see section 2.
- Let-it-go words (#866): AGREE option A throughout: "A recording you let go is still on this phone.", "Remove now", "This recording is still on this phone. {app} will try again the next time it starts." They say only what the code does (the sweep runs at launch) and promise no completion. Confirmation "It will be removed from this phone, and it cannot be brought back." counsel reads first (the PR's K2 note: a held server draft can return words).
- Character-limit line, row 32: "Up to 140 characters. Only what you type is kept." AGREE as copy. Design condition: no counter that changes colour; at the limit the field stops and VoiceOver says one short line once. The second sentence is a claims row (nothing is read from the photo).
- Share verb, row 58: CHANGE to B, "Send this letter". The sheet that follows already says "This will be sent" and "It goes only where you send it". "Share" invites the system share sheet and social posting; "Send" says where it goes. Opinion, not a standard: the verb is content's with legal. Row 62 "Sent exactly as said." only when the words are untouched; that "exactly" sits near D-125 item 9 (held out of the listing until counsel clears it), so counsel reads it.
- Find lines (#894): AGREE all except `fieldHint`. CHANGE `fieldHint` ("A few letters are enough to start looking.") to "Type a word, or part of one, to start looking." because "letters" here collides with the product noun (a kept letter) beside a field called "Find a letter"; the PR's own comment records this review. Keep no number in any Find line.
- NS-42-R18 notice: no words exist to review (E51). Layout requirement only: two plain sentences above the links on the Welcome and Terms step, in reading order before the primary button, never inside a disclosure, and still on screen at AX5 on an SE 3 without hiding the button (scroll is fine; hiding is not). Whether this meets any legal notice rule: counsel must confirm.

Record: "E2 design closed: words above approved or changed by the founder (date); CHANGE rows: 7, 58, find.fieldHint."

## 5. Accessibility floor attached to all of the above

- Every alert, placeholder and held-screen line reads correctly at AX5 and with VoiceOver; none relies on colour.
- A claim in the App Store accessibility labels or on the site needs the S1-23 walk on a phone. Nothing in this return changes that; do not declare Larger Text before it passes. (The walk has not run, per `DEVICE_TEST_PLAN.md` as I read it.)
- Contrast on a new frame token (see Q-D NS-01-R41): 3.15:1 in dark clears a 3:1 non-text bar [U, WCAG 1.4.11 from memory]; the light value is not stated in the question, so it needs the number.

## 6. E3 design rows (#935, Q-D1 to Q-D13): CDesO view

- DS2-03 radii v2: AGREE, in one token PR. The before and after screenshots (Home, Book, letter page, first run, light and dark) come from the release build on a device frame, not the web preview.
- MOTION-OPEN-2 spring to 0.30 s: AGREE; one device clip of the card-to-page carry; Reduce Motion form kept.
- NS-01-R41 frame colour: AGREE the new `mediaFrame` token; add the light-mode ratio to the PR.
- FOUNDATIONS-Q1 glass dim 35 or 45: AGREE the proposal; I decide from the measured Asha set (DS2-12).
- NS-33-R1 heading level: AGREE; React Native cannot assert the level on iOS, so the row stays partial until a VoiceOver rotor read on a phone. Do not claim "level 1".
- FOUNDATIONS-Q5 glass fallback: AGREE `glassFallback` #282421 with the high-contrast edge and 1 pt hairline; pair tests decide.
- MOTION-OPEN-1 lamp: AGREE keep the lamp as the named exception (off under Reduce Motion, Reduce Transparency, Increase Contrast, Low Power); retire Breathe.
- COMPONENTS-G3 tab bar stays: AGREE.
- MOTION-OPEN-3 haptics: AGREE trim, with the allowed-sites test; the single success on first Keep stays.
- FOUNDATIONS-Q4 `moon.stars` for Home: AGREE for 1.0 as opinion, with a reset trigger: if a tab-finding task with parents shows more than 1 in 5 cannot find Home, switch to the house glyph (Apple's pattern, D-051). VoiceOver says "Home" either way.
- FOUNDATIONS-Q6 icons: AGREE chrome only; no `expo-symbols` (matches F2).
- OQ-H1 Home slip: AGREE no reserved height; the SE 3 device row decides, and check AX5.

Record: "E3 design rows closed (date): defaults adopted as above; measured values from DS2-12."

---

# Gaps the list is missing (decisions nobody has named)

1. **Which build does each item gate, and is Build 13 servers-on?** D-121 (as my skills read it on 31 Oct) says the first store build has server features off; plan 3a puts the production database deploy (F4, 29 migrations) before Build 13 and 5.2 says that deploy unblocks "every servers-on build". If Build 13 is servers-off, most of C, D1, D2 and B5 gate the **switch flip for the first outside family**, not the cut. If servers-on, they gate Build 13. The list needs one line per item: "first store build", "first outside family", or "later". And no date has been set; the chain to the cut is founder hands (F4 secret, deploy re-run, #830, naming his phones, the `app-store` approval).
2. **F02-REQ-017 against 07.2** (D1 above): a P0 PRD row, its "before the flip" sequencing, its Stop link and its 5-an-hour summary all differ from the data pack's defaults. Needs one recorded order of precedence (cards, then PRD V2, per CR-66) and one founder answer.
3. **The lock screen leaks age** with names off (month number, "A year of letters.") beyond what G-D21 covers.
4. **No recovery path for a locked-out parent.** The account-recovery runbook (BL-598) is missing and the sign-everyone-out levers are "NOT RUN" [V 07.2]. A3 cannot send a recovery notice for a recovery nobody can perform.
5. **"Sign out other devices" does not end email sign-in**, and the help line must not imply it does. Alert and in-app words need an honest second step (secure the inbox).
6. **D-082 says "per account"; E59 says "per phone".** Record the amendment as the founder's, not only as an erratum.
7. **No way to read whether any of this works.** Analytics is off for the 1.0 line, so nothing measures the reminder permission grant, alert delivery or the held screen. State the proxy: Build 13 device sheet plus tester notes, and say plainly that the 60 percent permission target in NOTIFICATIONS.md has no public support (its own table says so).
8. **No owner for Apple Hide My Email and DMARC** for alert mail: the registration is "founder hands, state [U]" (07.1 section 4). An alert that Apple drops is a silent failure of the one message that matters. Needs a named check before A1 ships.
9. **App name and subject on a lock screen.** Mail previews will show "Early Letters" and the fixed subject. Fine for most, but CPrivO should confirm the subject family does not reveal a baby book in a way a parent would not want (for example a shared work phone). Low risk, one question.

# Conditions I attach (collected)

1. D1: A1 before the flip, no link until backup ships, 5-an-hour summary, BL-598 runbook first. CISO and CPrivO read.
2. D4: no number or name on a lock screen with names off, including month and birthday. CPrivO read.
3. D6: NS-32-R12 test before the cut; NS-32-R1b in wave 2 or a written founder decision.
4. E1: P0 keeping rows get the first review slots; photo stack does not starve them.
5. E2: Build 13 words first; NS-42-R18 and alert words drafted by content before the sitting; rows 7, 58 and `find.fieldHint` changed as above; counsel reads rows 7, 10, 15 to 17, 62 and the let-it-go confirmation.
6. Nothing accessibility-related is declared publicly until the device walk passes.

# Items I am not closing, with the exact question

- NEEDS FOUNDER: "F02-REQ-017 says the new-sign-in email ships before anyone outside your family signs in. The data pack says after. Which stands?" (My answer: before.)
- NEEDS FOUNDER: G-D21, widened: "With names off, may a lock screen show the child's age in months or 'a year of letters'?" (My answer: no.)
- NEEDS FOUNDER: NS-44-O13 (per phone), with a D-082 amendment in his words.
- NEEDS FOUNDER: release content and dates (E1), confirmed by him.
- NEEDS COUNSEL (must confirm): whether a welcome email is transactional (D5); the notice at collection (NS-42-R18); rows 7, 10, 15 to 17, 62; the share and send verb with legal; whether any accessibility law reaches this app.

Signed:

Chief Product Officer (Claude role)

Chief Design Officer (Claude role)
