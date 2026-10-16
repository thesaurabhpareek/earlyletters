# AL-05 Two-phone sync with a co-parent invite and the two-parent cap

> **Drill identities first.** Follow `README.md` "Drill identities": the drill book for Asha, drill accounts only. No drill account invites or joins a real family book, and no family member's own account joins the drill book. Do the drill-phone check (rule 3) on all three phones before AL-05.1. A helper's own phone with the family app on it is **not** a drill phone.

| | |
|---|---|
| Proves | Invite and join ask first and never switch the open book by themselves (BL-322, F11-REQ-006, F02-REQ-021); the join screen shows the inviter's sign-off and no child name before consent (`peek_invite`, R-17 checklist 5.1); at most two parents per book, on create and on accept (D-069, F11-REQ-004, `SCCAP`); letters, edits, deletes and restores reach the other phone (F16-REQ-009); offline letters queue and sync later (F16-REQ-016); private letters and working material never cross (F09-REQ-022, PRD-REQ-004, F11-REQ-009); the other parent cannot edit or delete (F09-REQ-028); a recording stays on its author's phone (F08-REQ-012, D-073); leave keeps or takes out the leaver's letters (F11 section 6.2). DEVICE_TEST_PLAN S1-09 and S1-22. Alpha plan items 2 and 3 (journey J7) |
| Builds | Rehearsal R1 at F19 (drill 1); a two-phone smoke on build 2 at F25 (AL-05.1 to AL-05.5, AL-05.8, AL-05.12) |
| Plan | Phone A (Drill Mama): **Plus on**, through the sandbox trial (AL-09.2 on this phone first), because this sheet keeps about 15 of Mama's letters and on Free the third opens the Keep sheet. If the sandbox is not ready (F14), run AL-05.8 with one try and AL-05.12 with one letter, and record the rows as reduced. Phone C (Drill Papa): Free; Papa keeps no letters in this sheet. The counting rule for the other parent's letters is checked in AL-09.10, on Free |
| Phones and accounts | Phone A: the founder's SE 3 (a drill phone), iOS on drill Apple Account A, app account Drill Mama. Phone C: a third drill phone (a helper's spare or a borrowed iPhone with no family app), iOS on drill Apple Account B or the helper's own Apple Account, app account Drill Papa (Mailbox 2), added to the TestFlight "Founder" group for R1. Phone B: the founder's current iPhone (a drill phone), app account Drill C (Mailbox 3), for the cap check. Phone A and Phone C are on different Apple Accounts, so nothing passes through iCloud Keychain |
| Time | about 90 min [E] |
| Needs first | AL-04 passed on R1; R-17 items `peek_invite` with BL-334, BL-331 with BL-332 (PR #140) and BL-322 (PR #148) merged and in the build, and the migrations on staging (F16); Phone A has the drill book for Asha with 3 letters, one of them spoken; the helper agreed to help and knows the book is fictional (Asha) |
| Record in | the session's evidence file (named after Phone A), rows AL-05.0 to AL-05.15 |

Invite links and codes are bearer secrets for the book: never paste one into evidence, an issue or a group chat. Share them only between the drill phones (Messages to yourself, AirDrop).

Wording: the join, cap and leave lines quoted below are S04's copy in `packages/content/src/features/family.en.ts` on PR #148 (keys named in each row). They are not on `develop` yet; if #148 changes them, the meaning in each row still holds and the key names the line to look for.

## Steps

| # | Do | Expected | Capture |
|---|---|---|---|
| AL-05.0 | The drill-phone check on Phone A, Phone B and Phone C. | All three pass. If any fails, **stop** | pass or stop, per phone |
| AL-05.1 | Phone A (Drill Mama): Family tab > Invite a co-parent. Share the link to Phone C. Then make a second invite and share it to Phone B (keep it unused for AL-05.7). | Each invite is made once (no duplicate on a double tap); the Family tab lists the pending invites | yes or no; number of pending invites (2) |
| AL-05.2 | Phone C, app not installed: tap the link. | The website's invite page; it shows no child name and offers TestFlight or the App Store | yes or no for "no child name" |
| AL-05.3 | Phone C: install from TestFlight, then tap the link again with the app closed. | The 18+ question comes first, nothing chosen. After Yes the join screen asks "Join this book as a parent?" with "Invited by Mama." (`familyCopy.accept.askTitle`, `.invitedBy`, the inviter's sign-off) and two equal choices, "Join as a parent" and "Not now", nothing preselected; no child name and no book data yet | Screenshot names; yes or no per part |
| AL-05.4 | Phone C: sign in as Drill Papa (Mailbox 2), Terms, the sensitive-data consent, then "Join as a parent", then "Open the book" (`familyCopy.accept.open`). | Joining runs only after Join; the open book changes to Asha's only after Open. Papa's phone shows Mama's in-book letters | yes or no; seconds from Join to Mama's letters showing |
| AL-05.5 | Phone A: open the Family tab. Then on Phone C tap the first link again. | Papa is listed as a parent; that pending invite is gone. The used link says it has already been used | yes or no |
| AL-05.6 | Phone A: try to invite another co-parent now that the book has two parents. | No third parent invite can be made: the Share action is replaced by "Asha's book has two parents." (`familyCopy.create.fullNote`), or the attempt ends in the full-book message. Nothing is created | Which of the two you saw |
| AL-05.7 | Phone B: open the second invite from AL-05.1, sign in as Drill C (Mailbox 3), consent, "Join as a parent". | "This book already has two parents. Ask the person who invited you." (`familyCopy.errors.book_full`, SCCAP at accept); Drill C joins nothing; Phone A's Family tab still lists two parents | yes or no |
| AL-05.8 | Both phones in the foreground with Asha's Book open. Phone A: save a typed letter. Time until it shows on Phone C. Repeat 10 times (short typed letters, `Asha sync 1` and on). | Every letter arrives; no single try over 30 s (06-nfr section 4: p95 30 s, p99 60 s; 10 tries are a smoke, not the gate) | 10 timings in s and the slowest |
| AL-05.9 | Removed 16 Oct: the rule that the other parent's letters never count toward Mama's free letters is AL-09.10, on Free. | n/a | n/a |
| AL-05.10 | Phone A: mark one new letter private before saving, and mark one already-shared letter private. | The new private letter never shows on Phone C; the shared one leaves Phone C within one sync | yes or no per part |
| AL-05.11 | Phone C: open one of Mama's letters, including the spoken one. | Only the final words show: no change marks, no "Exactly as said" view, no Delete, Edit or Change the date. The spoken letter shows that its recording is on Mama's phone, with no play control | yes or no per part |
| AL-05.12 | Phone A: airplane mode on. Save 2 letters. Wait 10 s. Close the app from the app switcher, open it, still offline. Then airplane mode off. | Within about 10 s each letter shows it has not been sent yet (F16-REQ-016's "Not sent yet"; that wording is not in `packages/content` on 16 Oct, so write down what the screen says); both letters still there after the relaunch; after reconnecting, both arrive on Phone C once each | Seconds to the not-sent state; count on Phone C (2, not 4) |
| AL-05.13 | Phone A: change the words of one shared letter (your own edit in the letter or Review), then delete another shared letter, then restore it from Settings > Recently deleted. | Phone C shows the new words, then the letter leaves, then it returns, each within one sync | yes or no per part; seconds |
| AL-05.14 | Optional, needs Drill Mama on two phones: sign Phone B into Drill Mama too (after the drill-phone check). Both offline, change the words of the same letter differently on each. Both online. | Neither version is lost; Mama sees a note about the two versions (F16-REQ-010) | yes or no; or "not run" |
| AL-05.15 | Phone C: the Family tab's "Leave Asha's book" (`familyCopy.leave.button`). Read the sheet; choose "Leave my letters in the book" (`familyCopy.leave.keepTitle`); then "Leave the book". | Two equal choices, "Leave my letters in the book" and "Take my letters out of the book", nothing preselected, and the confirm disabled until one is chosen. After leaving, Phone C keeps Papa's own letters (read, export, delete) and drops Mama's. Phone A keeps every letter and shows one neutral note that Papa has left (F11's `coParent.left.note`, not in #148's copy yet: write down what it says) | yes or no per part |

## Pass rule

Every row except AL-05.9 and AL-05.14 passes. AL-05.6 and AL-05.7 both must stop a third parent; either one failing is a fail of R-17 item `BL-331` (the cap) and alpha item 3.

## Stop rule

S0, stop and tell the founder before anyone else joins: a private letter, a raw transcript, change marks or a recording reaching the other parent; a third parent joining; a letter lost or doubled after sync; Drill C seeing anything of Asha's book; any sign that a phone or account in this drill holds a real family book.

## Not proved here

Push notifications (not in the alpha), the 72-hour undo and joining by code (not built yet, PR #148 follow-ups), the sync budget over 50 runs on LTE, the restore of a whole book on a new phone (DEVICE_TEST_PLAN TF-04 item 4 and F16 drills).
