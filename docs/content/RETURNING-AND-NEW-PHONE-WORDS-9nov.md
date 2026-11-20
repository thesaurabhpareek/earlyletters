# BL-802: the words for the returning customer and the new phone (9 Nov 2026)

Owner: `content`. Status: DRAFT for founder word approval. Nothing here is in `packages/content` yet; no string is live until the founder says yes to its row and `mobile` wires it in the same PR that moves it.

Sources read: exec council slice 3 rulings A, D and F (9 Nov 2026, proposed and unnumbered); NX-36 screen specs S3, S4, S7, S10, S17 (branch `docs/nx-36-screen-specs-9nov`); `packages/content/src/features/auth.en.ts` (existing keys); `packages/content/BRAND.md` glossary and internal-terms table; `packages/content/VOICE.md`.

Not read: `docs/agents/exec/RULINGS.md`, the Project docs (Build 12 cut ruling, store compliance review), any device run. Where a ruling may have moved, theirs governs.

## 1. How to read this file

- Every row below is a string a parent may read, and every row **needs founder word approval**. The Kind column says whether the words are `existing` (already in `auth.en.ts`, shown so the founder sees the whole screen; approving it again changes nothing) or `NEW`.
- `R` = the string says where letters or recordings are, so `legal` reads it too (exec council "R" marking). Every `NEW` string that states a location is `R`.
- `{email}` is always the masked address (`maskEmail`, for example a***@example.com). `{child}` shows "your child" when no name was typed (`onboarding.childFallback`). Brand name never typed: none of these strings names the product.
- Buttons are 22 characters or fewer; the length is in the Words column where it matters.

## 2. True claims only (the guard rails for all six states)

| Claim | True in Build 12? | So the copy |
|---|---|---|
| Backup | OFF (`EXPO_PUBLIC_BACKUP` off) | Never says "kept safe", "backed up", "come with you" about recordings. Says where the recording is: on a phone. |
| Co-parent and Family | Hidden | No "co-parent", "family", "share" or "invite" anywhere below. |
| Recordings | Stay on the phone that made them; the words travel | Every new-phone string says "words came across; recordings still on your other phone". |
| Nothing is merged | True (`takeOwnership` adds the phone's book as its own book) | Says "second book" and "Nothing is deleted". Never "merged", "combined", "moved into". |
| Nobody writes the letters | Always | No string describes the app doing anything to anyone's words. |
| "Your letters are safe" | Not true for a brand-new install (no letters yet) | First-run errors below drop the sentence. |

## 3. State 1: new account, no book

Where: after sign-in and consent, `sync_books()` says `first_run_open` true and no books (ruling A). The person goes straight to the child step ("Who is this book for?"); there is no "No book here yet" screen. Only the identity line and its button are new here; the promise step and the child step keep their registered words.

| ID | Key | Element | Words | Kind | Status |
|---|---|---|---|---|---|
| RW-01 | `onboarding.child.signedInAs` | Note under the date field, footnote size | "Signed in as {email}." | NEW | needs founder word approval |
| RW-02 | `authCopy.account.signedInWith.apple` | Same slot when the Apple sign-in gave no address | "Signed in with Apple" | existing | needs founder word approval |
| RW-03 | `onboarding.child.useAnother` | Quiet button under RW-01 | "Use another account" (19) | NEW | needs founder word approval |
| RW-04 | `onboarding.child.signedInAsLabel` | VoiceOver label for RW-01 | "Signed in as {emailSpoken}." | NEW | needs founder word approval |
| RW-05 | `onboarding.child.useAnotherHint` | VoiceOver hint for RW-03 | "Signs out and goes back to the start. Your book is not made yet." | NEW | needs founder word approval |

Implementation notes for `mobile` (not strings): `{emailSpoken}` reads the address the way a person says it, with the hidden part spoken as "hidden" (for example "a, hidden, at example.com"), because a screen reader reads "a***" as punctuation. RW-01 sits off the heading and the focus order's first stop (design ruling). Back from this step never returns a signed-in person to the Welcome.

Errors on the way in (sign-in and the code screen) for a person with no letters yet. The registered versions begin "Your letters are safe." which is untrue of a new install, so these first-run variants are NEW (`authCopy.firstRun.errors.*`). A phone that already holds letters keeps the registered versions.

| ID | Key | Words | Kind | Status |
|---|---|---|---|---|
| RW-06 | `authCopy.firstRun.errors.network` | "Sign in needs a connection. Try again once you are back online." | NEW | needs founder word approval |
| RW-07 | `authCopy.firstRun.errors.email_wait` | "Another email can't be sent just yet. Wait a few minutes, then try again." | NEW | needs founder word approval |
| RW-08 | `authCopy.firstRun.errors.rate_limited` | "Too many tries for now. Wait a few minutes, then try again." | NEW | needs founder word approval |
| RW-09 | `authCopy.firstRun.errors.provider` | "That sign-in did not finish. Try again, or try another way." | NEW | needs founder word approval |
| RW-10 | `authCopy.firstRun.errors.not_available` | "This way of signing in isn't available right now. Try another way." | NEW | needs founder word approval |
| RW-11 | `authCopy.firstRun.errors.consent_unavailable` | "Setting up your account did not finish. Try again." | NEW | needs founder word approval |
| RW-12 | `authCopy.firstRun.errors.unknown` | "That did not go through. Try again in a moment." | NEW | needs founder word approval |

Errors are announced as a polite live region; the field or button that failed keeps focus. No error shows a code.

## 4. State 2: returning account, no book ("No book here yet")

Where: `first_run_open` false and no books (a book once existed), or the answer was unknown, failed, timed out or did not parse. Both cases show the same screen on purpose (fail-safe: a new person pays one tap, a returning person never gets a duplicate account). The words therefore have to read kindly to a person who is simply new.

The registered words stay as they are. One identity line is added so the person who used the wrong sign-in method can notice.

| ID | Key | Element | Words | Kind | Status |
|---|---|---|---|---|---|
| RW-13 | `authCopy.consent.noBook.title` | Title | "No book here yet" | existing | needs founder word approval |
| RW-14 | `authCopy.consent.noBook.body` | Body | "Did you use a different way to sign in last time?" | existing | needs founder word approval |
| RW-15 | `authCopy.consent.noBook.signedInAs` | Note under the body | "Signed in as {email}." | NEW | needs founder word approval |
| RW-16 | `authCopy.consent.noBook.tryAnother` | Button, quiet | "Try another way" (15) | existing | needs founder word approval |
| RW-17 | `authCopy.consent.noBook.startBook` | Button, primary | "Start a book" (12) | existing | needs founder word approval |
| RW-18 | `authCopy.consent.noBook.tryAnotherHint` | VoiceOver hint | "Signs out and shows the other ways to sign in." | NEW | needs founder word approval |
| RW-19 | `authCopy.consent.noBook.startBookHint` | VoiceOver hint | "Makes a new book in this account." | NEW | needs founder word approval |

VoiceOver order: title (heading), body, RW-15 (spoken with `{emailSpoken}` as in RW-04), Start a book, Try another way. Error state: if "Start a book" cannot reach the account, use RW-11. Offline: RW-06.

Not used: "Your book was deleted", "gone", "missing", "empty". The screen never says why there is no book.

## 5. State 3: the account already has a book, and this phone has local letters

Where: the claim screen, after consent, when `sync_books` shows a book on the account and the phone holds a book or letters (ruling D, cases 4 and 5 become one behaviour). "Keep in this account" adds the phone's book to the account as a second book, with its letters, under its own identity. Nothing is deleted, nothing is merged, nothing is renamed. The phone's recordings stay on the phone. Cases with an empty phone book use the same words and the same result.

| ID | Key | Element | Words | Kind | R | Status |
|---|---|---|---|---|---|---|
| RW-20 | `authCopy.claim.title` | Title | "Keep your letters in this account?" | existing | | needs founder word approval |
| RW-21 | `authCopy.claim.bodyHasBook` | Body (replaces `claim.body` when the account has a book) | "This account already has a book. The book on this phone will be added to it as a second book. Nothing is deleted." | NEW | R | needs founder word approval |
| RW-22 | `authCopy.claim.signedInAs` | Note under the body | "Signed in as {email}." | NEW | | needs founder word approval |
| RW-23 | `authCopy.claim.recordingsNote` | Note under the body | "The recordings stay on this phone." | NEW | R | needs founder word approval |
| RW-24 | `authCopy.claim.help` | Help line | "If this isn't your account, choose Not my account. Nothing on this phone changes." | existing | | needs founder word approval |
| RW-25 | `authCopy.claim.keep` | Button, primary | "Keep in this account" (20) | existing | | needs founder word approval |
| RW-26 | `authCopy.claim.notMine` | Button, quiet | "Not my account" (15) | existing | | needs founder word approval |
| RW-27 | `authCopy.claim.keepHint` | VoiceOver hint | "Adds the book on this phone to this account as a second book. Nothing is deleted." | NEW | R | needs founder word approval |
| RW-28 | `authCopy.claim.notMineHint` | VoiceOver hint | "Signs out. Nothing on this phone changes." | NEW | | needs founder word approval |
| RW-29 | `authCopy.claim.waiting` | Note while setup is unfinished | "Finish setting up to choose where your letters are kept." | existing | | needs founder word approval |
| RW-30 | `authCopy.claim.error` | Error under the buttons | "That did not go through. Your letters are still on this phone. Try again." | NEW | R | needs founder word approval |
| RW-31 | `authCopy.claim.otherAccount` | Error when the phone already belongs to a different account | "This phone's book belongs to a different account. Sign in with that account, or choose Not my account." | NEW | R | needs founder word approval |

VoiceOver order: title (heading), RW-21, RW-22, RW-23, RW-24, Keep in this account, Not my account. Nothing is uploaded before "Keep in this account".

Open point on RW-31: what a person sees today on an account mismatch is UNVERIFIED (sync stops with `account_mismatch`; nothing moves). The string is proposed so the case is not silent; `mobile` confirms the screen exists before it is wired.

Not used: "In the existing book", "As a second book" as a choice, "merge", "empty book removed".

## 6. State 4: the new phone (words arrive, recordings stay on the other phone)

Where: S17. Account has a book, this phone has none. The book is pulled by the normal route, no claim screen, no child step, no signature step, no reminder or lock card that session. Landing is Tonight, then the Book.

| ID | Key | Element | Words | Kind | R | Status |
|---|---|---|---|---|---|---|
| RW-32 | `authCopy.newPhone.loading` | Loading state heading while the book opens | "Opening your book." | NEW | | needs founder word approval |
| RW-33 | `authCopy.newPhone.arrivedWords` | Plain line at the top of the first Book opened after arrival (text, not a card, not an ask) | "Your book is here. The words came across; the recordings are still on your other phone." | NEW | R | needs founder word approval |
| RW-34 | `sync.audioElsewhere.line` | Note on each affected letter's card, and on the letter page where the play button would be | "The recording is on your other phone." | NEW | R | needs founder word approval |
| RW-35 | `sync.audioElsewhere.label` | VoiceOver label for RW-34 on the letter page | "The recording is on your other phone." (same words; read where the play button would be) | NEW | R | needs founder word approval |

Rules that go with the words:
- A letter with no recording on this phone shows no play button, only RW-34.
- Loading past 10 seconds uses the outage words in section 7. Offline: the book on the phone is local, nothing waits.
- A partial pull shows the letters that arrived and says nothing about the rest. There is no "some letters are still on their way" line, because that counts a gap. The retry lives in Settings, Account, Sync.
- An account whose book has no letters shows the Book's own empty state, unchanged.
- Never: "safe", "kept safe", "backed up", "restore", "lost", "missing", "waiting for".

Founder question on RW-34 and RW-33: they say "your other phone". If the first phone is no longer around, that line is still true but may sting. A more neutral true form is "The recording is on the phone it was made on." Recommendation: use that form in RW-34 and RW-35 and keep RW-33 as the ruling words; the founder chooses. Backup-on variant ("Your recordings are arriving.") is later, not built, not approved here.

## 7. State 5: sign-in outage and offline

Where: S3. Sign in has no answer after 10 seconds, or the phone is offline. Warm block, never red; no code is ever shown. The local start appears only when the person answered Yes at the age screen, the failure is showing, and the build constant allows it.

Two NX-36 titles begin "We can't". VOICE.md keeps the app's own words small and unsigned, so the proposals below name sign-in, not "we".

| ID | Key | Element | Words | Kind | R | Status |
|---|---|---|---|---|---|---|
| RW-36 | `authCopy.outage.title` | Heading, outage | "Sign in can't be reached right now." | NEW | | needs founder word approval |
| RW-37 | `authCopy.outage.body` | Body, outage | "Try again in a moment, or start the book on this phone and sign in later." | NEW | | needs founder word approval |
| RW-38 | `authCopy.outage.retry` | Button, primary | "Try again" (9) | NEW | | needs founder word approval |
| RW-39 | `authCopy.outage.startLocal` | Button, quiet | "Start on this phone" (19) | NEW | | needs founder word approval |
| RW-40 | `authCopy.outage.startLocalNote` | Note under RW-39 | "Start the book on this phone for now. You can sign in later to bring it to your account." | NEW | R | needs founder word approval |
| RW-41 | `authCopy.offline.title` | Heading, offline | "Sign in needs a connection." | NEW | | needs founder word approval |
| RW-42 | `authCopy.offline.body` | Body, offline | "Try again when you are back online." | NEW | | needs founder word approval |
| RW-43 | `authCopy.outage.backOnline` | Polite announcement when sign-in returns (VoiceOver only) | "Sign in is back." | NEW | | needs founder word approval |
| RW-44 | `authCopy.outage.retryBusyLabel` | VoiceOver label while retrying | "Trying again" | NEW | | needs founder word approval |

Differences from NX-36 S3: RW-36 drops "We"; RW-42 says "Try again when you are back online." because the screen does not promise it will retry by itself in a way the person can see. If `mobile` does retry by itself with back-off (S3 says it does), the founder may prefer NX-36's "We will try again when you are back online." and accept the "we". Either is true; this is a founder choice.

Truth: no "Your letters are safe" (a new install has none). RW-40 says where the book is ("on this phone") and what happens after sign-in, so it is `R`.

## 8. State 6: wrong account ("Signed in as {email}." / "Use another account")

Where: the one place the app can help a person notice they signed in with the wrong method. A different Apple Account or email is a different user, and the server reads it as new, so the person finds out by reading the identity line. It appears on three screens, with the same words each time.

| Screen | Line | Button | Result |
|---|---|---|---|
| Child step (state 1) | RW-01 (RW-02 for Apple with no address) | RW-03 "Use another account" | Signs out, returns to the Welcome. Nothing is deleted; no book exists yet. |
| No book here yet (state 2) | RW-15 | RW-16 "Try another way" | Signs out, shows the other ways to sign in. |
| Claim (state 3) | RW-22 | RW-26 "Not my account" | Signs out, leaves the phone as it was. |

Only two new button words exist, because the other two screens already have a registered button for the same act. One act, three labels would be fine; one label for two different results would not, so "Use another account" is used only on the child step, where it ends at the Welcome.

Errors and VoiceOver: the identity line is plain text, read with `{emailSpoken}` (RW-04 form). Sign-out failing (offline mid-tap) shows RW-06 and leaves the person signed in; sign-out never deletes anything.

## 9. Not used in Build 12 (so nobody adds them back)

- "In the existing book" and "As a second book" as a choice; "empty book removed"; any "merged" or "combined" wording.
- "Your letters are safe" or "kept safe" for a first-run or new-phone surface; any backup, "restore" or "come with you" claim about recordings.
- "co-parent", "family", "invite", "share" in any state above; the registered `account.signedOutBody` keeps those words until the council's family-free variant is approved (ruling F), outside this file.
- Counts or progress ("3 of 12 letters arrived"), streak, badge, "still on their way".

## 10. Content-rule check (run 9 Nov 2026)

Done by script on the text of every string row in this file (Words column, quotes stripped), without installing the repo, against the rules in `packages/content/test/rules.test.ts` that bear on these strings:

- No em dash, en dash, curly quote, ellipsis character or emoji in any string, and none in this file: pass (the file is plain ASCII).
- Every button string 22 characters or fewer: pass. RW-03 is 19, RW-16 15, RW-17 12, RW-25 20, RW-26 15, RW-38 9, RW-39 19.
- No gendered pronoun for the child; `{child}` and "your child" only: pass (none of the strings names the child).
- No "AI", "machine", "write", "rewrite", "shape", "polish", "tidy", "cleaned": pass.
- No fear, guilt or loss language (lost, gone, missing, warn, risk, safe, secure): pass (see the one deliberate exception below).
- No streak, point, badge or gap counts: pass.
- Internal terms (take, entry, draft, pack, transcript, upload, sync in new strings): pass. "Sync" appears only in the pointer to the existing Settings row, not in a new string.
- Brand name not typed: pass.

The repo's own `npm test` was not run (no install, per the task). The strings are not in `packages/content` yet, so the rules test cannot see them; the check above is a hand and script check and is repeated by the PR that moves them in.

Deliberate exception: RW-30 and RW-31 say "Your letters are still on this phone" and "belongs to a different account". Neither is loss language; both state where letters are. `legal` confirms both (marked R).

## 11. Counts

44 string rows (RW-01 to RW-44): 34 NEW and 10 existing. All 44 need founder word approval.

## 12. Open questions for the founder (one each)

1. RW-34/RW-35: "on your other phone" or "on the phone it was made on" (section 6).
2. RW-36 and RW-42: drop "we" from the outage screen, or keep NX-36's wording (section 7).
3. RW-31: whether a mismatch screen exists at all before the words are wired (section 5).
4. A claim of many local letters into an account may meet the free-letter allowance (`plan.ts`); what the person sees then is UNVERIFIED and no string covers it here. `mobile` and `product` first.
