# Run sheets

Owner: S19 (QA). A run sheet orders the steps of one scripted device session or drill, says what each step should show and what to capture, and names the evidence rows. Results go in one evidence file per device session, copied from `docs/qa/evidence/TEMPLATE.md`. Item details that are not repeated here live in `docs/qa/DEVICE_TEST_PLAN.md`.

Fictional family only in every drill: the child is Asha (and Avi for twins), the parents Mama and Papa. Recordings are the scripted Asha letters (DEVICE_TEST_PLAN P-08) read by a consenting adult, never a real letter. No email address, sign-in code, link, invite, user id, token, receipt or key ever goes into evidence, an issue or a chat.

## Alpha drills (D-106, TestFlight alpha by Thu 29 Oct 2026)

Dates and founder steps (F01 to F27) are from `docs/release/ALPHA_PLAN.md` (PR #152). Build 1 is the `testflight` profile with servers off; R1, R2 and build 2 are the `preview` profile with servers on against staging (PR #145). The go/no-go checklist that consumes these rows is `docs/qa/ALPHA_GO_NO_GO.md`.

| Drill | Run sheet | Builds | Phones and accounts | Time [E] | When (founder step) | Alpha plan item |
|---|---|---|---|---|---|---|
| AL-01 First run and permissions | `AL-01-first-run.md` | Build 1, build 2 | SE 3; current iPhone | 55 min | Tue 20 Oct on build 1, before testers (F12); Wed 28 Oct on build 2 (F25) | 8 (J1) |
| AL-02 Record, transcribe, edit and save offline | `AL-02-record-offline.md` | Build 1, build 2 | SE 3; current iPhone for a part | 45 min | as AL-01 | 6, 8 (J2 to J5) |
| AL-03 Kill the app during save, and while recording | `AL-03-kill-during-save.md` | Build 1 (10-run subset), build 2 (50 runs each) | SE 3 | 45 min; about 4 h | Tue 20 Oct (subset); Wed 28 Oct (F25, a helper) | 9 |
| AL-04 Sign in with Apple and email | `AL-04-sign-in.md` | R1, build 2 | SE 3; current iPhone; laptop; two Apple Accounts | 75 min | Fri 23 Oct (F19 drill 1); Wed 28 Oct smoke | 1 |
| AL-05 Two-phone sync, co-parent invite and the two-parent cap | `AL-05-two-phone-sync.md` | R1, build 2 | SE 3 (Mama); a family member's iPhone on their own Apple Account (Papa); current iPhone (a third account) | 90 min | Fri 23 Oct (F19); Wed 28 Oct smoke (F25) | 2, 3 |
| AL-06 Backup upload and restore on a second phone | `AL-06-backup-restore.md`, with S05's `docs/qa/BACKUP_RESTORE_DRILL.md` (PR #150) | R2 | SE 3 and current iPhone on one Apple Account | 2.5 h | Tue 27 Oct (F23) | 4 |
| AL-07 Account deletion | `AL-07-account-deletion.md` | R1, staging, build 2 | SE 3; current iPhone with a fixture account | 70 min | Fri 23 Oct (request and cancel); staging completion before Thu 29 Oct | J8; 07 G3 |
| AL-08 The server switch and the kill path | `AL-08-server-kill-switch.md` | Build 1 (part A), R1 and a switch-off build of the same commit (parts B, C) | SE 3; current iPhone | 80 min | Tue 20 Oct (A); Fri 23 Oct (B, C) | go/no-go check 4 |
| AL-09 StoreKit sandbox purchase and trial | `AL-09-storekit-sandbox.md`, with S06's D-1 to D-12 detail (`feat/plus-status-alpha`) | Build 2 (build 1 for the first four rows) | SE 3; current iPhone; Papa's phone for one row; sandbox testers | 75 min | Wed 28 Oct (F25), after F14 | 5 |

### Suggested sessions

| Session | Day | Drills, in order | Evidence file |
|---|---|---|---|
| Build 1 check, before Family and Friends get it | Tue 20 Oct, after F12 | AL-08 part A, AL-01, AL-02, AL-03 subset; AL-09.1 to .4 only if F14 is done | `2026-10-20-<build 1>-se3.md` |
| Drill 1 on R1 | Fri 23 Oct (F19) | AL-04, AL-05, AL-07.1 to .6, AL-08 parts B and C | `2026-10-23-<R1>-se3.md` |
| Backup drill on R2 | Tue 27 Oct (F23) | AL-06 | `2026-10-27-<R2>-se3.md` |
| Build 2 checks | Wed 28 Oct (F25) | AL-09, the AL-05 smoke rows, AL-03 50-run set (a helper), AL-01 and AL-02 on build 2, AL-07.1 to .3 | `2026-10-28-<build 2>-se3.md` |
| Staging deletion completion | any day before Thu 29 Oct | AL-07.7 to .9 | in the Drill 1 or build 2 file |

The founder's hours for these are in `docs/release/ALPHA_PLAN.md` section 4 (F19 2 h, F23 2.5 h, F25 2.5 h); the build 1 check and AL-03's 50-run set add about 6 h that the alpha plan does not hold yet. A device operator or a family helper can run AL-01, AL-02 and AL-03; AL-04 to AL-09 need the founder for staging and App Store Connect steps.

## Other run sheets

- `2026-10-30-T11-session-1.md`: PRD V2 device spikes round 1 (T11) from PR #143. Under D-106 the alpha drills above come first; its speech and backup-spike blocks still feed T11 and T15.
