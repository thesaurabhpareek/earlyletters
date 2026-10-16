# Run sheets

Owner: S19 (QA). A run sheet orders the steps of one scripted device session or drill, says what each step should show and what to capture, and names the evidence rows. Results go in one evidence file per device session, copied from `docs/qa/evidence/TEMPLATE.md`. Item details that are not repeated here live in `docs/qa/DEVICE_TEST_PLAN.md`.

Times marked [E] are estimates. [R] marks a recommendation taken from `docs/release/ALPHA_PLAN.md` (for example its 6 recordings instead of 20 in the backup drill).

## Drill identities (read before every drill)

During the alpha, staging holds the family's real letters (from founder step F16), the family uses build 2, and both alpha profiles install the same app (`com.earlyletters.scribe.preview`). A drill must never touch a real book. Every run sheet points here, and its first step is the check below.

**1. Drill data only.** Drills use only:
- the **drill child "Asha"**, a book the drill itself makes on a drill phone;
- **drill app accounts**: "Drill Mama" (Sign in with Apple on drill Apple Account A, whose email is Mailbox 1, or email with Mailbox 1), "Drill Papa" (Mailbox 2), "Drill C" (Mailbox 3, the cap check), "Drill D" (Mailbox 4, the deletion run to completion), and three spare aliases kept unused for the "new address" steps (Mailbox 5 for AL-04.7, Mailbox 6 for AL-08.5, Mailbox 7 for the T11 session, where it becomes "Drill E", the only account that session deletes). Mailboxes are the founder's own test aliases, never a family member's address. The T11 session also needs a drill Google account for its Google sign-in;
- **two drill Apple Accounts** (A and B) for the phones in Sign in with Apple and backup drills, never the founder's own Apple Account if the family's app account signs in with Apple. Both need adding as TestFlight testers;
- the scripted Asha letters (DEVICE_TEST_PLAN P-08) read by a consenting adult, never a real letter.

No drill account ever invites, joins or is invited into a real family book, and no family member's account ever joins a drill book.

**2. Drill phones.** A phone is a drill phone only while it holds no real family letter: the same app cannot hold a family book and a drill book side by side. A phone that has ever run build 1 or build 2 with real letters is not a drill phone until those letters are exported and the founder decides to clear it. The co-parent drill's second phone (AL-05) follows the same rule: a helper's own phone with the family app on it is not a drill phone.

**3. The check before the first step**, and again before any step that deletes or reinstalls the app, installs an older build, turns backup on, signs out or deletes an account. Open the app on the phone:
- (a) Settings > Account shows "signed out", or a drill account (its masked email is a drill mailbox);
- (b) the Book's child switcher lists only the drill child Asha, and the Book holds only drill letters (scripted lines, or lines that name the drill);
- (c) for AL-04, AL-06 and any Sign in with Apple step: iOS Settings shows the drill Apple Account at the top.
If the app is not installed yet, the phone passes (a) and (b). If any part fails, **this is not a drill phone: stop.** Do not delete, reinstall or downgrade. If the family book must leave that phone, the founder exports it first (Settings > Export your book), keeps the ZIP off the phone, checks the family book is on staging under the family account, and only then decides.

**4. Staging is shared with the family.** Drill accounts live on the same staging project:
- every query names the drill account's id in its `where` clause, and every `update` uses the guarded form in AL-07 (exactly one row changes, or nothing does);
- never turn off sign-ups, sign people out or pause the project while the family uses staging, unless the founder has told the family the time box first (AL-08 part B); sign out only drill accounts;
- a proxy certificate (AL-06) goes only on a drill phone and comes off after the drill.

**5. Plan state.** On a Free install the third letter kept opens the Keep sheet (`decideKeepLetter`, two free letters, `apps/mobile/src/app/review.tsx`). Every sheet's **Plan** row says whether it needs Plus on (the sandbox trial from AL-09.2, or a development build with the StoreKit file) or Free with a stated number of letters already kept.

## Alpha drills (D-106, TestFlight alpha)

Dates and founder steps (F01 to F27) are in `docs/release/ALPHA_PLAN.md` (PR #152); the sheets name only the founder step. Build 1 is the `testflight` profile with servers off; R1, R2 and build 2 are the `preview` profile with servers on against staging (PR #145). The go/no-go checklist that consumes these rows is `docs/qa/ALPHA_GO_NO_GO.md`.

| Drill | Run sheet | Builds | Plan | Time [E] | Founder step | Alpha plan item |
|---|---|---|---|---|---|---|
| AL-01 First run and permissions | `AL-01-first-run.md` | Build 1, build 2 | Free, nothing kept before | 55 min | F12 (build 1), F25 (build 2) | 8 (J1) |
| AL-02 Record, transcribe, edit and save offline | `AL-02-record-offline.md` | Build 1, build 2 | Free, nothing kept before | 45 min | F12, F25 | 6, 8 (J2 to J5) |
| AL-03 Kill the app during save, and while recording | `AL-03-kill-during-save.md` | Build 1 (10-run subset), build 2 (50 runs each) | Plus on | 45 min; about 4 h | F12 (subset); F25 (a helper) | 9 |
| AL-04 Sign in with Apple and email | `AL-04-sign-in.md` | R1, build 2 | Free, exactly 1 letter kept before | 75 min | F19; F25 smoke | 1 |
| AL-05 Two-phone sync, co-parent invite and the two-parent cap | `AL-05-two-phone-sync.md` | R1, build 2 | Plus on for Drill Mama; Free for Drill Papa, who keeps exactly 1 letter (AL-05.9) | 90 min | F19; F25 smoke | 2, 3 |
| AL-06 Backup upload and restore on a second phone | `AL-06-backup-restore.md`, with S05's `docs/qa/BACKUP_RESTORE_DRILL.md` (PR #150) | R2 | Plus on | 2.5 h | F23 | 4 |
| AL-07 Account deletion | `AL-07-account-deletion.md` | R1, staging, build 2 | Drill Mama: Plus renewing for AL-07.2; Drill Papa: Free, 1 letter kept; Drill D: Free | 70 min | F19 (request and cancel); before F27 (completion) | J8; 07 G3 |
| AL-08 The server switch and the kill path | `AL-08-server-kill-switch.md` | Build 1 (part A), R1 and a switch-off build of the same commit (parts B, C) | Part A Free; parts B and C Plus on | 80 min | F12 (A); F19 (B, C) | go/no-go check 4 |
| AL-09 StoreKit sandbox purchase and trial | `AL-09-storekit-sandbox.md`, with S06's D-1 to D-12 detail (`feat/plus-status-alpha`) | Build 2 (build 1 for the first rows) | Free, exactly 2 letters kept before | 75 min | after F14; F25 | 5 |
| AL-10 Rollback rehearsals: staging stop, pack downloads switch, database restore, TestFlight expiry (RA-19-05) | `AL-10-rehearsals.md` | None for parts A and C; build 1 or 2 for B; R1 for D | Not relevant | about 3 h in four sittings | founder steps by date: C by Wed 21, A before Thu 22, B Fri 23, D Tue 27 or Wed 28 | go/no-go checks; `docs/release/AUTOMATION.md` 2.10 |

### Suggested sessions

| Session | When | Drills, in order |
|---|---|---|
| Build 1 check, before Family and Friends get it | After F12 | AL-08 part A, AL-01, AL-02, then AL-09.1 and AL-09.2 to turn Plus on, then the AL-03 subset. If F14 (products in the sandbox) is not done yet, the AL-03 subset runs on a development build with the StoreKit file instead, and its rows say so |
| Drill 1 on R1 | F19 | AL-04, AL-05.0 to .14, AL-07.0 to .6 (Drill Papa must still be in the book), AL-05.15, AL-08 parts B and C |
| Backup drill on R2 | F23 | AL-06 |
| Build 2 checks | F25 | AL-09, the AL-05 smoke rows, the AL-03 50-run set (a helper), AL-01 and AL-02 on build 2, AL-07.1 to .3 |
| Staging deletion completion | Before F27 | AL-07.7 to .9 |
| Rollback rehearsals | Wed 21 to Wed 28 | AL-10 part C (by Wed 21), part A (before Thu 22), part B (Fri 23, the same day as AL-08 parts B and C on R1, which are the fifth rehearsal), part D (after build 2 is in TestFlight) |

Evidence file names: `docs/qa/evidence/<date>-<build>-<device tag of Phone A>.md`, one per session.

The founder's hours for these are in `docs/release/ALPHA_PLAN.md` section 4 (F19 2 h, F23 2.5 h, F25 2.5 h); the build 1 check and AL-03's 50-run set add about 6 h [E] that the alpha plan does not hold yet. The drills also need phones and accounts the alpha plan does not list: at least two drill phones with no family letters, a third drill phone for AL-05 (the second parent), the two drill Apple Accounts (both TestFlight testers), and the seven drill mailboxes in rule 1. A device operator or a family helper can run AL-01, AL-02 and AL-03; AL-04 to AL-09 need the founder for staging and App Store Connect steps.

## Other run sheets

- `2026-10-30-T11-session-1.md`: PRD V2 device spikes round 1 (T11) from PR #143. Under D-106 the alpha drills above come first; its speech and backup-spike blocks still feed T11 and T15. It opens with the drill identity rule above and its own check row (T11.0), and its deletion block deletes only Drill E with guarded SQL.
