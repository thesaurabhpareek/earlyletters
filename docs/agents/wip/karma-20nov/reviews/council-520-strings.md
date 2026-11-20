# Council on PR #520: the lines that read as promises

Run on 8 Nov 2026 for Karma. Read-only: nothing was posted, edited or pushed. PR head read: ae39522a (git fetch of pull/520/head, confirmed against the REST API the same day). Develop read at cda0ba83.
Every seat below is a role a Claude session plays. None is counsel. Legal readings are marked "counsel must confirm".

Read in full this session: COUNCIL.md, RULINGS.md (CPO-1, CDO-1, CPrivO-1, CLO-1, CCO-1, CCO-2, CCO-4, CLO-3, CPrivO-2, CCO-5), the skill files of CPrivO, CLO, CCO, CFO, CBO, CMO, CDesO, CPO and Karma, VOICE.md, BRAND.md, compliance/README.md, and the decisions D-082, D-083, D-085, D-100 to D-103, D-116, D-125, D-129, D-132, D-133, D-136 to D-139. Code read on the PR branch: erase-everything.ts, store.ts (eraseEverythingLocal at 1030-1049, localDeletionAllowed at 939), wipe.ts, erase.tsx, delete-book.tsx, recently-deleted.tsx, billing/alpha.ts, letter-ledger.ts clearLedger, the scheduler and plan-reminder prefixes, erase-all.test.ts, the strings diff. Apple's App Review Guidelines were fetched today (page footer: Last Updated October 16, 2026).

Not read, so marked unverified where it matters: Project docs (infra/setup-record.md, the proposals/account-security content.md 4.11 and design 2.12 the PR cites), the coordination docs, anything on the Supabase side, Apple's pages on iCloud Backup behaviour. No device run exists for S1-133. The candidate strings in section E were checked by regex against the rules in rules.test.ts, not by running the test.

---

## A. What each seat can say that only that seat can say

**Chief Privacy Officer.** I traced the data and the lines hold. The erase empties every table (tables are read from sqlite_master, wipe.ts), every recording, listening copy and whole-frame copy, the exports, recovery-export and Print folders (erase-everything.ts:50), the Keychain count, and runs VACUUM so erased words leave the database file; erase-all.test.ts scans the raw bytes for a test word, "Asha" and "Mama". "We hold no copy" is true only because the row cannot show on a phone that has ever signed in (localDeletionAllowed, store.ts:939, hidden in settings/index.tsx:147 and refused in the store), so I'm protecting that gate and the line must never be reused for the signed-in erase (F17-REQ-026, not built). I want two changes: the backups line must name exports, and the failed line must say what a retry leaves behind; the App Privacy label does not change (nothing new is collected, nothing leaves the phone), and the four new device keys still need their classes recorded (two L3, two L2 per the PR body; issue #654 still says L2 for all four). Unverified: whether an unfinished email sign-in leaves an auth record with the email on the server (email.ts:37 sets shouldCreateUser true), which would matter only in a server build.
Chief Privacy Officer (Claude role, not counsel)

**Chief Legal Officer.** These are four promises made in your name as an individual publisher (D-004, D-134), and two of them use absolute words, "no copy" and "nothing". I would not call them wrong, because they are true wherever the row can appear, but D-132 says what users are promised is not delegated, so they are the founder's call and counsel must read the absolutes before the store submission. Terms 8.1 (terms-of-service.md:98) says the count is kept so that reinstalling does not reset it and says nothing about Erase everything, so the first place a person learns the reset would be this screen; D-083 asked counsel about the Keychain count and I found no Keychain entry in COUNSEL_PACKET.md on develop, so I'm adding one question to the brief (my RULED right is the brief's composition, not what counsel sees).
Chief Legal Officer (Claude role, not counsel)

**Chief Compliance Officer.** Apple 5.1.1(v), read today, requires in-app account deletion "if your app supports account creation"; a servers-off build has no account creation, so I classify it as Does not apply there, and in a server build the Delete account row (D-129) does that job and Erase everything is not a substitute; counsel must confirm. Guideline 2.3.1(a), read today, makes misleading marketing grounds for removal, and the staged listing (docs/store/app-store-staged-1.0-proposal.md:52) says "delete everything, any time, from Settings", so that sentence is true only if #520 is in the store build and must come out of the listing if it is not (CPrivO-1 already asked me to check it). On the fence: age-gate.ts is the cco_review file; its decision logic is untouched, the 18+ question comes back after an erase, and a running 24-hour stop is kept (store.ts:1042-1046), so items 1, 5 and 6 of my checklist hold, item 2 needs the classes recorded, item 3 needs two rows in checked-facts.md that I will add, and item 4 (no promise change without the founder) is open; I will post nothing on ae39522a because the edits below make a new head. Evidence is 40 unit tests and no device run, so "works on a phone" stays Gap until S1-133 is walked.
Chief Compliance Officer (Claude role, not counsel)

**Chief Financial Officer.** Money moves nowhere: Plus is Apple-only (D-053, D-080), so erasing neither refunds nor cancels it, and the screen says nothing about that today, although the account-deletion body (account-deletion.en.ts:47) and the billing emails already say deletion "does not cancel Plus". I'd add the same one line for people who have Plus, which prevents a "you kept charging me after I erased" complaint at no cost. The reset's worth is at most the allowance per erase, 2 letters in the store build and nothing in alpha, against a loss of the person's whole book; the exposure is people who erase to dodge x net price ($42.49 a year or $4.24 a month inside the Small Business Program, $34.99 and $3.49 outside, from the CFO skill's Apple reads of 31 Oct, not re-read, enrolment FT-29 unconfirmed), and with no cohort data it is an [A] I cannot size; I would spend nothing on a block.
Chief Financial Officer (Claude role, not counsel)

**Chief Business Officer.** Of the four lines only "Your free letters start again." touches the model: the allowance is the paywall's trigger (D-082, D-103), and the line states a way past it in the one place it is least visible, a delete screen. The reset's value scales with the allowance, which F14 section 6.9 and D-125 item 3 may raise from 2 to 5 and then 10, so a cheap trick today is a bigger one later; what I would never do is a device-level block, because it needs a device id that F14-REQ-025 forbids. My position is to keep the behaviour (D-103 settles it) and cut the sentence; the trade is a little honesty-by-disclosure against a loophole a delete screen announces.
Chief Business Officer (Claude role, not counsel)

**Chief Marketing Officer.** None of the four lines belongs in public copy: "we hold no copy" is true of a signed-out phone only, and the store listing and site must never carry it, where the reader may be signed in. The only public dependency is the staged listing's "delete everything, any time, from Settings"; note the PR body's pointer to store.en.ts:60 is stale, since the committed listing no longer says it and only the staged doc does. I will add the lines and the three book lines to the claims inventory, each with erase-all.test.ts as proof, and I would cut the free-letters sentence, because on a screen that ends in "This cannot be undone" it reads as a perk, and restraint is the brand.
Chief Marketing Officer (Claude role, not counsel)

**Chief Design Officer.** A grandparent at AX5 reads five short paragraphs before the Export card and the destructive button, so the order matters: I rule that the backups line moves up to sit directly under the body, so "We hold no copy" and "what stays" are read together, and that "Your free letters start again." is set in the same muted note style as the lines around it, not body weight. I would cut that sentence entirely, because the screen has one job and an extra state (it is hidden in alpha) is one more thing to test at AX5. One real gap for the product chief: the toast "{child}'s book is in Recently deleted." names a place a sole-book person cannot reach after a cold start until a new book exists (tabsInStack, transitions.logic.ts:137; Review B reported it, I read the code, not run on a device).
Chief Design Officer (Claude role, not counsel)

**Chief Product Officer.** DATA-REQ-024 is P0 and "stays in v1.0" (F17 line 63; R8 R2A-18), and only counsel may relax a DATA-REQ, so #520 is scope of record, not a new feature, and the 9 Nov to 1 Dec window fits. The guardrail "zero lost letters" (03 section 4.3) is bent by one path: after a failed erase, a person who keeps writing has the new letters erased at the next launch (resumeEraseAtLaunch runs eraseEverythingLocal over every row), so words now and a code follow-up to erase only what existed when the mark was written. I'd keep "Your free letters start again.": a person who erases for a fresh start must not meet the paywall on their first new letter, and I found no import in the F15 or deletion specs, so an erase costs the whole book (unverified, two documents grepped).
Chief Product Officer (Claude role, not counsel)

---

## B. Where the seats disagree

1. "Your free letters start again." Keep: CPrivO, CLO, CPO. Cut the sentence, keep the behaviour: CBO, CMO, CDesO. No position on the sentence: CCO, CFO.
2. The absolutes ("We hold no copy", "Nothing is sent anywhere"). Ship now, they are true and tested: CPrivO, CCO. Hold until counsel has read them: CLO. In-app only, never in public copy: CMO.
3. The failed-erase fix. Words now: CPrivO, CDesO, Karma. Words now plus code that erases only what existed when the mark was written: CPO.
4. The sole-book undo path. A product fix before 1 Dec: CPO, CDesO. Leave it as built: no seat argued for that, so it stays open for the product chief to rule.

Karma's tie-break: positions 1 and 2 are about what users are told, which D-132 keeps with the founder, so the founder gets one question with both sides. Positions 3 and 4 are engineering and design inside shipped scope; I rule them.

---

## C. The true facts behind each line

Builds: `testflight` is servers off, backup off, analytics off, app environment preview (alpha, no letter limit). `preview` is servers on (build 2, backup off). `production` is the store build, servers off for the first binary (D-121), allowance 2. (apps/mobile/eas.json on the PR branch.) The Erase row shows in every build, on a phone that has never signed in. It is hidden once the phone has signed in (localDeletionAllowed is syncOwner === null; syncOwner is set at the first sign-in).

**1. "This removes every book, letter and recording from this iPhone, and your settings. We hold no copy."**
- Part one is true in the PR build, in every profile, for everything the app stores. Proven by erase-all.test.ts (rows, recordings, listening and whole-frame copies, exports, recovery-export, Print, then the sweep finds nothing). What it does not cover and does not say: exports a person saved to Files or shared, device backups, the speech model (a separate line says so), plan reminders (kept on purpose; ids start with plan., source scribe.plan; the scheduler matches only el. and scribe.reminders), and a running 24-hour 18+ stop (kept, store.ts:1042-1046; a stopped phone cannot open Settings, _layout.tsx gate, so this is not reachable in practice; not run on a device).
- "We hold no copy" is true today because no server exists in the servers-off profiles, and true in a server build for a never-signed-in phone because nothing syncs, backs up or reports before sign-in (backup, status report and analytics are off or sign-in gated; Privacy Policy 3.0.0 line 45 says no build sends usage analytics or crash reports).
- It stops being true for a phone at its first sign-in: sync uploads letters, and recordings go up when backup is turned on (D-100; off in every profile now). The row hides at that moment, so the line is not shown. It becomes false the day someone builds the signed-in erase (F17-REQ-026) and reuses the string, or the day any upload path is added that runs before sign-in. Unverified edge: an email sign-in that was requested and not finished may leave an auth record with the email on the server (email.ts:37); it holds no letters.

**2. "This happens on this phone only. Nothing is sent anywhere."**
- True today. The erase makes no network call; erase-all.test.ts stubs fetch to throw and asserts the outbox is empty; analytics stops quietly with no consent event (stopAnalyticsForErase), and analytics is off in every profile.
- Scope: it is about the erase. The phone's own next iCloud Backup is Apple's and is not claimed.
- It stops being true if an analytics event for "data erased" is ever added (nothing pins that for an analytics-on build; analytics is off for all of 1.0, D-095, D-124 item 3), and it must not be reused for the signed-in erase, which has to drain the outbox and sign out.

**3. "Your free letters start again."**
- True only where a limit exists. Shown only in the store build: erase.tsx:92 hides it when PLUS_ALPHA is set, and every non-production profile (including `testflight` and `preview`) is alpha, with an allowance of 100 (plan.ts:70, alpha.ts). In alpha the count is still cleared; the line is just not shown.
- True only on a never-signed-in phone. Signed in, the ledger heals from the person's synced letters, so a reset follows account deletion only (F14-U10, F14-REQ-026).
- Holds until an old backup is restored: a restored iCloud Backup brings the old mirror and letters back, and the gate uses the largest count (F14-U05).
- One thing the device row must prove: clearLedger swallows a Keychain error on the reasoning that an item that cannot be cleared cannot be read (letter-ledger.ts:119-135). If that reasoning is wrong on a real phone, the count heals back and the line is false for that phone. Not run on a device.

**4. "Backups of this phone you already made, such as iCloud Backup, are not changed."**
- True in every build: the app cannot touch a device backup. It matches the public deletion page (pages.en.ts:254-259, "What stays").
- It is incomplete. The same page also says "Any exports you made" stay with you, and the in-app line leaves exports out, although the screen itself urges "Save a copy first?" and an export saved in Files survives the erase.
- Unverified: what Apple keeps or replaces in iCloud after the next backup. The line claims only that the erase does not change it, which is true.

**The book lines.**
- bookBodyThisPhone plus bookUndo: true. The book leaves every list at once and waits 30 days; "cannot be restored" is true after the purge, which needs launches that agree on the date (QE-05), so Restore can work a little past day 30.
- bookEraseNowBody "Every letter and recording in it is erased for good.": true on the phone, same wording as the letter precedent (eraseNowBody on develop); device backups and exports are not touched. I would leave it.
- bookEraseFailedToast: true. The book is hidden, `book.erasing.<id>` is set and the next launch finishes it. It cannot be read again after it fades, and the book is not in Recently deleted any more.
- `failed` "Erasing did not finish. Try again.": true but incomplete. The pending mark stays; if the person leaves and keeps writing, the next launch erases the new letters as well (store.ts:1030-1049, erase-everything.ts resumeEraseAtLaunch).
- bookDeletedToast "{child}'s book is in Recently deleted.": true; reachability after a cold start with no other book is the open item in A.

---

## D. The free-count question

**Can a person erase to reset the free letters?** Yes, on a phone that has never signed in. Erase everything calls clearLedger: the Keychain item and the database mirror are removed after the rows, and startLetterLedger skips healing while the erase is pending. The next kept letter is free letter 1.

**What it is worth.** Store build: the allowance, 2 (D-082), which remote config can only raise (F14-REQ-018; F14 6.9 and D-125 item 3 describe a rise to 5, then 10, and no rule fires below 500 first-time downloads). Alpha: nothing. Every non-production profile has an allowance of 100 (MAX_FREE_LETTERS, plan.ts:70), set by the founder on 1 Nov (proposal PL-1, Karma's ruling on #552), because Plus products cannot load on a .preview build; the line is hidden there and there is no paywall to get past. **What it costs the person:** the whole book, unless they export first, and I found no import in the F15 and deletion specs (unverified, two documents grepped).

**What does not reset the count.** Delete a letter or a book: the count never goes down (D-103; erase-all.test.ts rows for delete, restore, erase now, the day-30 purge and a kill part way). Reinstall: the Keychain item usually survives (Terms 8.1 says so); if iOS drops it, the person gets 2 more letters, which F14-U04 records as accepted, "a gift, never a lock-out".

**What D-083 says.** D-083 (delegated; debate Q-013) reads: "Erase everything resets the free count." and "The count is held on the device (Keychain, mirrored in the database) so a reinstall does not reset it; counsel confirms this is acceptable." It gives no reason. The debate it names is not in the repo (DEBATES.md has no hit for it). The reason in the code is a comment: "because the person asked for deletion" (letter-ledger.ts clearLedger; the strings.en.ts comment on freeLetters). My reading as CPrivO: a counter that survives an erase is data we would keep about the person after they asked for everything to go, and a person who erases for a fresh start should not meet the paywall at the first new letter. DATA-REQ-024 (P0) writes it as a test, "the next kept letter is free letter 1", and the PRD's source order lets only counsel relax a DATA-REQ.

**Has anyone ruled it acceptable?** The behaviour, yes: D-103 (founder, 13 Oct) says "The ledger still never decreases, and Erase everything still resets it." The abuse case, no. No entry weighs "someone erases to get two more letters" or says "acceptable". F14's open-question row 4 on how the count is held still reads "Founder confirms; payments engineer", status "Spec default". The counsel check D-083 asked for has no entry in COUNSEL_PACKET.md on develop. Terms 8.1 says nothing about Erase. The on-screen sentence is new in #520 and has no founder decision (the PR body says so; the CCO's checklist item 4 is open for the same reason).

---

## E. Karma's recommendation

**Ship the screen, with three edits, and ask the founder two yes or no questions. Nothing here is a scope change.**

Rule, not asked (Karma and the seats, all inside their rights):
1. The wording edits go in one push, so the two counted reviews reset once (the reviews on file are at 8a8db627; the head is now ae39522a).
2. CDesO's order and style change (backups line under the body; the free-letters line muted) goes in the same push.
3. The failed-erase hazard gets words now and a backlog row for the code fix (erase only what existed when the mark was written). Karma's call, T2.
4. The sole-book undo path becomes a backlog row for the product chief, to rule before 1 Dec.
5. The CCO approval line goes on the final head only, after the founder's answer. The classes (two L3, two L2) are recorded in the ruling and #654 is corrected.
6. The CLO adds to the counsel brief: the absolutes in the four lines, and a Terms 8.1 sentence about Erase and the count.
7. The CMO adds the lines and the book lines to the claims inventory, and the listing's "delete everything, any time, from Settings" is tied to #520 on the submission checklist: in the build, or out of the listing.

**For the founder (a promise in his name is not delegated, D-132):**
- Decision 1. Ship the lines with the three edits below. Default if he does not answer by Wed 11 Nov (a date I propose; Karma can move it): #520 does not merge and nothing is published. The cost of waiting is small: the build after tonight's goes without Erase, and the listing line is checked at submission.
- Decision 2. Keep "Your free letters start again." in the store build only, in the quiet text style. Default: keep. The reset itself stays either way, under D-103.

**Exact wording. Unchanged: body, onThisPhone, freeLetters (text), bookBodyThisPhone, bookEraseNowBody, bookEraseFailedToast, button labels (all 16 characters or fewer; limit 22).**

`settings.erase.backups`, replace:
> Exports you already saved, and backups of this phone such as iCloud Backup, are not changed.

`settings.erase.failed`, replace:
> Erasing did not finish. Try again now. If you wait, the app finishes it the next time it opens, and that erases anything you add before then.

`settings.erase.plusStays`, new, store build only, shown only when Plus is on (same words as account-deletion.en.ts:47):
> Erasing does not cancel Plus. Billing continues through Apple until you cancel.

Screen order (CDesO): body, backups line, onThisPhone, speechStays, plusStays when shown, freeLetters (muted), then the Export card and the button.

If the founder says no to decision 2, delete `settings.erase.freeLetters` and its line in erase.tsx. The behaviour does not change.

**Debate record (self-challenged only; the challengers were the other seats in this session, not a separate agent).** Strongest objection, from the CLO: put no absolutes in a promise in the founder's name until counsel reads them. Answer: both are true wherever the row can appear and test-proven; the row cannot show on a signed-in phone; Privacy Policy 3.0.0 line 109 already says that in builds with servers off everything is on the phone; the default holds the PR, so nothing is published unread. Strongest objection, from the CBO and CMO: the free-letters line teaches a loophole. Answer: anyone who reaches that line has chosen to lose their whole book to get two letters; the line protects the person who erases for a fresh start; a block would need a device id the PRD forbids.

**Citation line (RS-04): not done by the council.** The setup-record and the coordination docs were not read. Karma must run them and open the ask with the "Checked:" line before it goes.

---

## F. Message to the founder

I put the Erase everything screen in #520 in front of the whole team, because four of its lines read as promises in your name and D-132 keeps those with you. The facts hold: it erases everything the app stores on the phone, it sends nothing, and "we hold no copy" is true because the row never shows on a phone that has signed in. Three edits first. The backups line also says that exports you already saved are not touched. The failed-erase line says anything written before the next launch is erased too. People with Plus get one line that erasing does not cancel it.

The team split on "Your free letters start again." Your D-103 already says Erase everything resets the count, so the reset stays either way. Privacy, legal and product would keep the sentence; business, marketing and design would cut it as a perk on a delete screen. I'd keep it, in the quiet text style, in the store build only.

I need two yes or no answers: ship the lines with those three edits, and keep the free-letters sentence. If I hear nothing by Wed 11 Nov, #520 waits and nothing is published. Counsel still has to read "no copy" and "nothing is sent", and the Terms line on the free count; I'm adding both to the packet.
Karma
