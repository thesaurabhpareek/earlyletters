# AL-04 Sign in with Apple and email

| | |
|---|---|
| Proves | Sign in with Apple and email by link and by code work on staging (A-REQ-016, A-REQ-018, A-REQ-022); Terms with the 18+ line and the sensitive-data consent come before any sync (A-REQ-034, PRD-REQ-002, F02-REQ-010); local letters join an account only after the claim screen with the masked email and a tap (BL-347, F02-REQ-019); a link opened on another phone, or while another account is signed in, signs nothing in (F02-REQ-018, F02-REQ-020); the laptop page signs nothing in (A-REQ-023); resend waits 60 s (A-REQ-025); an offline cold start stays signed in (A-REQ-032); the Apple refresh token is captured for deletion (BL-330, F02-REQ-004). `docs/ops/AUTH_SETUP.md` section 11 items 1, 3, 4 and 6. Alpha plan item 1 (journey J6) |
| Builds | Rehearsal R1 (`preview`, servers on, staging) on Fri 23 Oct (founder step F19, drill 1); build 2 smoke on Wed 28 Oct (F25). Never build 1 (switch off: record `blocked`, reason "switch off") |
| Phones and accounts | Phone A (SE 3) on Apple Account A; Phone B (current iPhone) on Account A or B; a laptop with a browser; a second Apple Account for "Hide My Email"; two test mailboxes of the founder's own (call them Mailbox 1 and Mailbox 2 in evidence, never the address) |
| Time | about 75 min [E] |
| Needs first | R-17 items BL-347 and BL-330 merged (PR #139) and in the build; staging set up (F04, F10, F11, F16, F17); AASA live (F15); the build has the staging URL and publishable key (F06); the app on Phone A has two letters saved while signed out (from AL-02) |
| Record in | the session's evidence file, rows AL-04.1 to AL-04.13 |

Never write an email address, a code, a link, a user id or a token into evidence, an issue or a chat. Write "Mailbox 1", "listed", "1 row".

## Steps

| # | Do | Expected | Capture |
|---|---|---|---|
| AL-04.1 | Phone A, signed out, two letters on the phone. Save another letter and wait for the Keep the book sheet (it offers sign-in after a save, A-REQ-013), or use Settings > Account > Sign in. Choose Apple, with "Share My Email". | Apple's sheet; then the Terms sheet with the 18+ line; then the sensitive-data consent with nothing preselected; Agree on both | Seconds from Apple's sheet closing to signed in; screenshot names |
| AL-04.2 | Read the next screen. | The claim screen shows the account's email masked and asks before your letters move; nothing has synced yet. Tap the button that keeps them here | yes or no for "masked email shown"; yes or no for "asked before moving" |
| AL-04.3 | Founder, on the laptop: Supabase staging > Authentication > Users. Then Table Editor: count the entries for this account. | The Apple identity is listed; the three letters are on staging only after the tap in AL-04.2 | "listed"; letter count (3) |
| AL-04.4 | Founder: on staging, count rows in `ops.apple_tokens` for this account (SQL editor, service role). | One row: the Apple refresh token was captured and stored wrapped, so deletion can revoke it (BL-330). Never copy the value | "1 row" or "0 rows" |
| AL-04.5 | Settings > Account > Sign out, then sign in again with Apple. | Sign out waits for unsynced letters; on the second sign-in there is no Terms sheet | yes or no |
| AL-04.6 | Sign out. Sign in with Apple on the second Apple Account with "Hide My Email". | Signed in; the relay mailbox receives the account email (needs AUTH_SETUP 2.5 relay setup) | yes or no; minutes for the email |
| AL-04.7 | Sign out. Continue with email, Mailbox 1 (a new address). Open the email in iOS Mail on Phone A and tap the link. | One email holds both a link and a code; the link opens the app (not Safari) and signs in | Seconds from Send to the email; yes or no per step |
| AL-04.8 | Sign out. Continue with email, Mailbox 2 (an account that exists). Type the code by hand. Then tap Resend at once. | The code signs in; the same screen and timing as a new address (no hint the account exists); Resend is disabled for 60 s | yes or no; seconds Resend stayed disabled |
| AL-04.9 | Request a link on Phone A. Open that email on Phone B (signed out, the app installed) and tap the link. | Phone B signs nothing in and routes to "type the code" (the link works only on the phone that asked) | yes or no |
| AL-04.10 | With Account A signed in on Phone A, open a link requested for Mailbox 2 on Phone A. | Account A stays signed in; nothing changes; the app explains | yes or no |
| AL-04.11 | Open a link more than an hour old. Then open a fresh link on the laptop. Then open the same page on the phone and tap its Open button. | The old link says it has expired and offers the code; the laptop page shows the code instruction and signs nothing in; the phone opens the code screen | yes or no per part |
| AL-04.12 | Gmail and Outlook apps, and a link forwarded in Messages, if installed on Phone A. | Each opens the app; no click-tracking redirect in the link (Resend tracking off, F05) | One line per mail app |
| AL-04.13 | Signed in. Airplane mode on. Close the app from the app switcher, open it, save a letter. | Opens signed in; records and saves; the letter syncs after airplane mode is off | yes or no |

## Pass rule

AL-04.1 to AL-04.11 and AL-04.13 pass. AL-04.12 may be partial (record which apps were tested). AL-04.4 passes only with 1 row; 0 rows means account deletion cannot revoke Apple's token, which keeps alpha item 1 and the R-17 gate open.

## Stop rule

Any sign-in that lands in an account other than the one asked for, letters that sync before the claim tap, or a link that signs in on the wrong phone is S0: stop, sign everything out, file the issue, and tell the founder before anyone else signs in.

## Not proved here

Google sign-in (not in the alpha, `ALPHA_PLAN.md` 1.3), the sign-in budgets (06-nfr: 50 runs, p90 3 s native and 30 s email), passkeys, Apple revocation from iOS Settings (DEVICE_TEST_PLAN S2-14).
