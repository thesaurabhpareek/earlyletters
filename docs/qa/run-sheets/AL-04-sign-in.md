# AL-04 Sign in with Apple and email

> **Drill identities first.** Follow `README.md` "Drill identities": drill child Asha, drill accounts only, never the family book. This sheet signs in, out and between accounts on staging, where the family's letters live: do the drill-phone check (rule 3, including part c, the drill Apple Account) on Phone A and Phone B before AL-04.1. Every query below names a drill account's id; never run one without it.

| | |
|---|---|
| Proves | Sign in with Apple and email by link and by code work on staging (A-REQ-016, A-REQ-018, A-REQ-022); the Keep the book sheet offers sign-in at the second saved letter (A-REQ-013 Rev); Terms with the 18+ line and the sensitive-data consent come before any sync (A-REQ-034, PRD-REQ-002, F02-REQ-010); local letters join an account only after the claim screen with the masked email and a tap (BL-347, F02-REQ-019); a link opened on another phone, or while another account is signed in, signs nothing in (F02-REQ-018, F02-REQ-020); the laptop page signs nothing in (A-REQ-023); resend waits 60 s (A-REQ-025); an offline cold start stays signed in (A-REQ-032); the Apple refresh token is captured for deletion (BL-330, F02-REQ-004). `docs/ops/AUTH_SETUP.md` section 11 items 1, 3, 4 and 6. Alpha plan item 1 (journey J6) |
| Builds | Rehearsal R1 (`preview`, servers on, staging) at F19 (drill 1); build 2 smoke at F25. Never build 1 (switch off: record `blocked`, reason "switch off") |
| Plan | Free, **exactly one** letter kept before AL-04.1, so the letter saved in AL-04.1 is the second: that is when the Keep the book sheet opens (A-REQ-013 Rev). A third kept letter would open the Plus Keep sheet instead, so this sheet keeps no more |
| Phones and accounts | Drill phones only. Phone A (SE 3) signed in to iOS with **drill Apple Account A**, whose email is Mailbox 1 (shared, not hidden). Phone B (current iPhone) signed in to iOS with **drill Apple Account B**. A laptop with a browser. Mailbox 1 (the account "Drill Mama"), and Mailbox 5, an alias never used before. Never the founder's own Apple Account if the family's app account signs in with Apple |
| Time | about 75 min [E] |
| Needs first | R-17 items BL-347 and BL-330 merged (PR #139) and in the build; staging set up (F04, F10, F11, F16, F17); AASA live (F15, from #144); the build has the staging URL and publishable key (F06); Phone A: a fresh drill book for Asha with one letter kept, signed out |
| Record in | the session's evidence file, rows AL-04.0 to AL-04.13 |

Never write an email address, a code, a link, a user id or a token into evidence, an issue or a chat. Write "Mailbox 1", "listed", "1 row". A user id goes only into the founder's SQL editor, for one query, and is not kept.

If a later sign-in on Phone A shows the claim screen for letters that belong to another drill account, choose the option that leaves the letters where they are, and write down what the screen offered.

## Steps

| # | Do | Expected | Capture |
|---|---|---|---|
| AL-04.0 | The drill-phone check on Phone A and Phone B, with part (c): iOS Settings shows drill Apple Account A on Phone A and B on Phone B. | Both pass. If not, **stop** | pass or stop |
| AL-04.1 | Phone A, signed out, one letter kept. Type and save a second letter. | Within about half a second of the save animation the Keep the book sheet opens with Apple, Google, Email and Later (A-REQ-013 Rev). Choose Apple, with "Share My Email". Then the Terms sheet with the 18+ line, then the sensitive-data consent with nothing preselected; Agree on both | Seconds from the save to the sheet; seconds from Apple's sheet closing to signed in; screenshot names |
| AL-04.2 | Read the next screen. | The claim screen shows the account's email masked and asks before your letters move; nothing has synced yet. Tap the button that keeps them here | yes or no for "masked email shown"; yes or no for "asked before moving" |
| AL-04.3 | Founder, on the laptop, staging: Authentication > Users, find the account by Mailbox 1 and copy its user id into the SQL editor only. Run: `select count(*) as letters from public.entries where author_id = '<Drill Mama user id>';` | The Apple identity is listed; `letters` is 2, and it was 0 before the tap in AL-04.2 (run the query once before the tap if you can) | "listed"; letters before and after (0, 2) |
| AL-04.4 | Founder, same id: `select count(*) as tokens from ops.apple_tokens where profile_id = '<Drill Mama user id>';` | `tokens` is 1: the Apple refresh token was captured and stored wrapped, so deletion can revoke it (BL-330). Never select or copy the token columns | "1 row" or "0 rows" |
| AL-04.5 | Phone A: Settings > Account > Sign out, then sign in again with Apple. | Sign out waits for unsynced letters; on the second sign-in there is no Terms sheet | yes or no |
| AL-04.6 | Phone B (drill Apple Account B), signed out: Settings > Account > Sign in > Apple, with "Hide My Email". | Signed in to a new drill account; the relay address receives the account email (needs AUTH_SETUP 2.5 relay setup) | yes or no; minutes for the email |
| AL-04.7 | Phone A: sign out. Continue with email, Mailbox 5 (never used). Open the email in iOS Mail on Phone A and tap the link. | One email holds both a link and a code; the link opens the app (not Safari) and signs in | Seconds from Send to the email; yes or no per step |
| AL-04.8 | Phone A: sign out. Continue with email, Mailbox 1 (the existing Drill Mama). Type the code by hand. Then tap Resend at once. | The code signs in; the same screen and timing as a new address (no hint the account exists); Resend is disabled for 60 s | yes or no; seconds Resend stayed disabled |
| AL-04.9 | Request a link on Phone A for Mailbox 1. Open that email on Phone B (signed out) and tap the link. | Phone B signs nothing in and routes to "type the code" (the link works only on the phone that asked) | yes or no |
| AL-04.10 | With Drill Mama signed in on Phone A, open a link requested for Mailbox 5 on Phone A. | Drill Mama stays signed in; nothing changes; the app explains | yes or no |
| AL-04.11 | Open a link more than an hour old. Then open a fresh link on the laptop. Then open the same page on the phone and tap its Open button. | The old link says it has expired and offers the code; the laptop page shows the code instruction and signs nothing in; the phone opens the code screen | yes or no per part |
| AL-04.12 | Gmail and Outlook apps, and a link forwarded in Messages, if installed on Phone A. | Each opens the app; no click-tracking redirect in the link (Resend tracking off, F05) | One line per mail app |
| AL-04.13 | Phone A, Drill Mama signed in. Airplane mode on. Close the app from the app switcher and open it. Type a few words as a draft and leave it (do not keep it: a third kept letter opens the Plus Keep sheet on Free). | Opens signed in, offline; the Book shows the two letters; the draft is there after another relaunch | yes or no |

## Pass rule

AL-04.0 to AL-04.11 and AL-04.13 pass. AL-04.12 may be partial (record which apps were tested). AL-04.4 passes only with 1 row; 0 rows means account deletion cannot revoke Apple's token, which keeps alpha item 1 and the R-17 gate open.

## Stop rule

Any sign-in that lands in an account other than the one asked for, letters that sync before the claim tap, a link that signs in on the wrong phone, or any sign of a real family book on a drill phone is S0: stop, sign the drill accounts out, file the issue, and tell the founder before anyone else signs in.

## Not proved here

Google sign-in (not in the alpha, `ALPHA_PLAN.md` 1.3), the sign-in budgets (06-nfr: 50 runs, p90 3 s native and 30 s email), passkeys, Apple revocation from iOS Settings (DEVICE_TEST_PLAN S2-14).
