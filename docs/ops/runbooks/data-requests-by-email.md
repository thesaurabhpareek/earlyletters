# Runbook: a data request arrives by email

Use this runbook when someone writes to hello@earlyletters.com and asks for one of the things the 0.9.0 Terms and Privacy Policy say the founder will do by hand: delete an account, withdraw the agreement to sync, see, export or correct their information, close an under-18 account, or delete their TestFlight feedback.

Owner: `ops`, with `support`; `privacy` reviews changes to this file. It is an engineering reading of the 0.9.0 texts, not legal advice, and it adds no promise to them. Written 9 Nov 2026 for BL-779. The routes follow the request matrix in `docs/engineering/08-data-rights-and-legal-requests.md` (chapter 08).

**Status.** Nothing below has been run against a live project or on Apple's screens. Routes 2, 3 and 5 are written here from the repo, and Route 4 is its own runbook. **Route 1, deleting an account by email, cannot be run at all:** the tool it needs, BL-551, is in no migration. Before the 0.9.0 pages go live, run each route once on a fictional account (section 10).

Sections are numbered 0 to 10. The routes are numbered 1 to 5 and sit in sections 3 to 7.

## What the 0.9.0 text promises, and by when

| Route | The sentence | Time in the 0.9.0 text |
|---|---|---|
| 1. Delete an account | Terms 10.1: "email hello@earlyletters.com from the address on your account and we will do it by hand." Privacy 7: "Email us from the address on your account and we will start the deletion by hand" | Planned: 30 days to change your mind, then live systems within 31 days of the request, backups within 38, providers within 45, our email provider about 60 (Privacy 7). A reply within 45 days (Privacy 10) |
| 2. Withdraw sync | Privacy 9: "You can withdraw your agreement at any time by emailing us, and we will do it by hand", and "Withdrawing stops syncing, and we offer to delete what was synced" | A reply within 45 days (Privacy 10) |
| 3. See, export, correct | Privacy 10: "email hello@earlyletters.com and we will do it by hand. We may confirm it is you by sending a code to the email on your account" | A reply within 45 days, one extension of 45 if we say why (Privacy 10) |
| 4. Under 18 | Privacy 8: "we will close the account or delete the address". Terms 2.1: "we will close it" | None in the 0.9.0 text |
| 5. TestFlight feedback | Privacy 7: "To have your TestFlight feedback deleted, ask us at hello@earlyletters.com" | None in the 0.9.0 text; Privacy 10's 45 days is the outer limit |

Also in Privacy 7: "To have your email address removed from our list, email us from that address." The action is in the Resend dashboard (contacts). No steps for it are written anywhere in the repo, so add them at the first rehearsal.

## 0. Rules for every route

- **The only proof is control.** Never ask for an ID, a birth date, a photo, an address, the child's name or anything from a letter. A reply from an address is a signal, not proof: the sender of an email can be forged (section 2).
- **Never read, search or quote letters.** A person sees their own letters by exporting them (chapter 08 DSR-R14, "Never").
- **Keep ids and emails on screen only.** Never paste them into chat, a ticket, a log row or an email to a third party. A ticket holds only its own reference.
- **One path per request (DSR-R01).** The SQL in this file is the path. Do not run other SQL on a person's data. Never delete a user in the Supabase dashboard: it cascades their letters and skips the flow (DB-17). Never set JWT claims in the SQL Editor to call a function "as" the person.
- **Never say whether an address has an account** (IAM-R09). Everyone gets the same first reply.
- **Authors own their words (DSR-R04).** Decline a request to delete, edit or hand over another person's letters, from a co-parent or anyone else (Terms 4.2). An authorized agent (Privacy 10) passes the same check in section 2 through the account holder's address; the agent's word alone changes nothing.
- **Safety first.** If the message suggests a child or an adult is at risk, stop and use the safety routing named in `underage-account.md` section 0.
- **A refusal carries the appeal line.** Privacy 10: reply with "Appeal" in the subject and we will look again. Counsel has not read how that works (chapter 08 open questions).
- **The clock.** The 45 days run from the day the email arrives, not from the day you confirm control (chapter 08 Deadlines). If a route will pass day 40, send the extension notice with its reason before day 45 (DSR-R12) and put the date in the log.

## 1. Receive it (the day you read it)

1. **Ticket reference.** `DR-<yyyymmdd>-<n>` (this file's convention): the date you received it and a counter for that day. No name, no email.
2. **Request log row** (DSR-R05; chapter 08 "Request log"). Until a `privacy_requests` table exists (BL-237), keep one dated spreadsheet outside the repo, one row per request, with these fields and nothing else:

   | Field | Example |
   |---|---|
   | ticket | `DR-20261109-1` |
   | kind | `delete_account`, `withdraw_sync`, `see_export`, `correct`, `under_18`, `testflight_feedback` |
   | channel | `email` |
   | received, acknowledged, verified, extended, completed | dates |
   | verified by | `phrase_to_account_address`, `phrase_to_tester_address`, `none_needed` |
   | due | received + 45 days |
   | outcome | `done`, `done_in_part`, `could_not_verify`, `cannot_be_done`, `declined` |
   | profile id | blank for TestFlight; blank it when an account deletion completes |

   No free text, no email body, no letter text, no feedback text (chapter 08). The mailbox holds the correspondence; the log holds the proof. Keep a finished row for 3 years.
3. **First reply** to the address the email came from. It says the request arrived with its reference, that nothing changes until the sender confirms control of the account address, and nothing about whether an account exists. The `support` macro for it does not exist yet (section 9); until it does the founder writes it by hand and keeps to those three facts.

## 2. Confirm control of the account address (DSR-R02), before any change

Do this for routes 1, 2, 3 and 5. It is the "code to the email on your account" that Privacy 10 describes. The repo names the rule (DSR-R02) but no tool or wording for it, so this is the interim method. `privacy` confirms it at the first rehearsal.

1. Find the person in Dashboard > Authentication > Users by the address they wrote from or the one they name. On screen only. If nothing is found, send no challenge, tell them nothing about it, and let the request wait for the follow-up in step 5.
2. Make a phrase of three ordinary words that appear nowhere in the thread.
3. Send it **to the account address** (not to the From or Reply-To of the request), with the ticket reference and one line: reply with this phrase from any address; if you did not ask for this, ignore it. The phrase reaches only whoever reads that inbox, which is what a forged From address cannot do. A Sign in with Apple relay address works the same way.
4. When the phrase comes back, write the date in the log (`verified by`: `phrase_to_account_address`). A reply without the phrase proves nothing. The phrase goes in the email, not in the log.
5. No source sets how long to wait (chapter 08 open question 5). Follow up on day 7 and day 30 (suggested), keep the request open, and log `could_not_verify` only when the founder decides to close it.

## 3. Route 1. Delete an account: CLOSED until BL-551

**Who may ask:** the account holder. A co-parent cannot ask for the other parent's account.

**Why it cannot be run:**
- `public.request_account_deletion` works only for the signed-in person (`require_user()`), and it accepts only the sources `ios`, `android` and `web`, never `support` (`supabase/migrations/20261005000000_family_cap_language_idempotency.sql`).
- The service-role function that would open a deletion for someone else, `ops_open_account_deletion` (BL-551, CR-40), is in no migration. `git grep ops_open_account_deletion -- supabase` finds nothing.
- The Delete account row in Settings is hidden in the alpha builds unless the build is switched on: `eas.json` sets no `EXPO_PUBLIC_ACCOUNT_DELETION` for the `preview` profile, and the value then comes from the EAS `preview` environment on expo.dev (`apps/mobile/src/lib/capabilities.ts`, D-129). **UNVERIFIED** from the repo: whether that variable is set for the build the family has. Ask the person to look in Settings.

**Do not** use a workaround: not the dashboard user delete, not hand-written SQL against `deletion_requests`, not JWT claims. Each skips a step the worker or the verification relies on (section 0).

**What the person is told.** If their Settings shows Delete account, they start it there (the 30-day change-of-mind period and the worker then run as in `docs/ops/README.md`). If not, they get the reply below. PROPOSED WORDING (the founder approves any text a person reads):

> We have your request to delete your Early Letters account, received on <date>, reference <ticket>. We cannot start the deletion by hand yet. We will write to you again by <date, no later than day 45> to say where it stands. Until then your letters stay as they are, and you can export them in Settings, Export your book.

**The founder decides** whether the 0.9.0 pages go live while this route is closed (CR-60). With BL-551 unbuilt, "we will do it by hand" (Terms 10.1, Privacy 7) cannot be kept. The options are to build and rehearse BL-551 first, or to change the sentence before the first deploy (CR-60 says how to re-pin 0.9.0). After a deploy a change is 0.9.1.

**When BL-551 exists,** write this section's steps after the first rehearsal: confirm control (section 2), check for a legal hold (`underage-account.md` section 2), write the audit row, open the deletion, tell the person the date their 30 days end, then follow the request with `ops_deletion_request_status` and `stuck-deletion.md`. The worker already sends the requested and completed emails and writes a receipt of counts and step outcomes (`deletion_requests.receipt`, never content). Do not write those steps earlier: the function and its reason codes do not exist.

## 4. Route 2. Withdraw sync

**Who may ask:** the account holder, for their own account. Withdrawing stops new letters going to the server. Letters already synced stay there, and with the co-parent, unless the person asks for them to be deleted (Privacy 9).

**What the repo gives you.** Sync is allowed only while the person's latest act on the `sensitive-data` document is `accept` (`has_active_consent`, `supabase/migrations/20261002020000_data_governance.sql`). A `withdraw` act turns writes off (`require_content_consent` raises `SCCON`). The app shows the row "Sync and family sharing" as "Off, kept on this phone" once it reads the gate (`apps/mobile/src/lib/auth/sensitive-row.ts`). The app has no switch to withdraw yet (BL-485).

**The service-role key cannot write this act** (`supabase/tests/consent_service_role.test.mjs`, migrations `20261023050000` and `20261023060000`), and `record_policy_act` refuses `support_assisted`. Chapter 08 names that function and is out of date on this point. The path that exists is the one `supabase/APPLY.md` step 8, item 3, uses for the founder's own acts: an insert in Dashboard > SQL Editor as `postgres`. **UNVERIFIED on a live project;** run it once on a fictional account first.

Steps (the project the person's build talks to):
1. Section 1 (log row, first reply) and section 2 (confirm control). Nothing below runs until the phrase is back.
2. The profile id is the user's id in Dashboard > Authentication > Users. On screen only.
3. Audit row first:
   ```sql
   select public.ops_audit_write('<your handle>', 'dsar', 'withdraw_sync', '<ticket>', '<profile id>');
   ```
4. Read the version of their latest act. If there is no row, or the latest action is not `accept`, sync is already off: stop and tell them.
   ```sql
   select version, action, accepted_at from policy_acceptances
    where profile_id = '<profile id>' and document = 'sensitive-data' order by accepted_at desc limit 1;
   ```
5. Record the withdrawal, using that version (the row must point at an existing `policy_versions` row):
   ```sql
   insert into public.policy_acceptances (profile_id, document, version, action, method, surface, app_version, platform, context)
   values ('<profile id>', 'sensitive-data', '<version from step 4>', 'withdraw', 'support_assisted', 'support.email', 'n/a', 'ios', '{}');
   ```
   If PR #634 (BL-577, consent record fields) has merged and been applied, read the table's columns again first. Keep `context` empty.
6. Done check: `select public.has_active_consent('<profile id>', 'sensitive-data');` returns `false`. Then ask the person to reopen the app: Settings > Privacy > "Sync and family sharing" reads "Off, kept on this phone". Their letters on the phone are untouched.
7. Reply with what was done and the date. Privacy 9 says "we offer to delete what was synced". The only deletions that exist for that are Delete this book in the app (a sole parent; with two parents it becomes "leave and remove my letters", `docs/legal/DELETION_AND_EXPORT_SPEC.md` 2.3, not run on a phone for this runbook) and deleting the account, which is Route 1 and closed. Say which one is open. Promise no date for the closed one.
8. Close the log row.

Turning sync back on is the person's own act in the app (Settings > Account, "Agree and sync"). Export and deletion do not depend on it (PRIV-R09).

## 5. Route 3. See, export, correct

**Who may ask:** the account holder. Confirm control first (section 2) for all three, even though only correction changes anything: the reply tells the person about their own account.

**See and export.** The answer is the in-app export, not a file built by hand (DSR-R14).
- Tell them: Settings, Your letters, Export your book (every letter, and the recordings on the phone). The 0.9.0 text says "Settings, Your data, Export your book"; the app no longer has Your data (BL-783). Name the path the app shows.
- When they are signed in and online, the export also carries the consent records the server holds for them (`docs/agents/exec/RULINGS.md`, PR #161; an offline export does not, BL-528).
- For "what do you hold about me", point to Privacy section 2. Do not look up or read their data to answer.
- **NOT BUILT:** the server-built export for a person without their phone (DATA-REQ-054). If they cannot export on their phone, say so plainly. A person whose letters synced can sign in on another phone and export there. Recordings are not on our servers (Privacy 2), so a lost phone's recordings cannot be brought back (Terms 7.3).
- Done check: the person says the export ran. Log `done`.

**Correct.**
- Words in a letter: the person edits the final text in the app. The original transcript never changes and nobody here edits anyone's words.
- Child details: edited in the app (Settings, the child's page).
- The name on the account (`profiles.display_name`, up to 60 characters): the app writes it once at sign-in and has no screen to change it (`apps/mobile/src/lib/auth/consent.ts`). By hand, after section 2:
  ```sql
  select public.ops_audit_write('<your handle>', 'dsar', 'correct_profile', '<ticket>', '<profile id>');
  update public.profiles set display_name = '<exactly what they wrote>' where id = '<profile id>';
  ```
  Type the name exactly as they sent it, and keep it out of the ticket and the log. Done check: select the row back on screen and ask the person to reopen the app.
- The sign-in email is not changed by hand. A change needs both addresses to confirm (`double_confirm_changes` in `supabase/config.toml`). Tell the person plainly that we cannot change it for them.
- An audit row is written only when you touch the database. Pointing someone to the export needs none.

## 6. Route 4. Close an under-18 account

Follow `underage-account.md`. It holds the steps; this file does not repeat them. Differences to know:
- Section 2 of this file does not apply. That runbook says the report itself is the actual knowledge and asks for no proof of age.
- Its step 4 (open the deletion) is the same BL-551 gap as Route 1.
- If the person also joined the email list, the address is deleted (Privacy 8): the Resend steps are the unwritten ones noted under the first table.

## 7. Route 5. Delete TestFlight feedback

**Who may ask:** a tester, family (internal) or friend (external). They have no account with us, so section 2 is adapted: the phrase goes to the tester email Apple shows in App Store Connect, not to the From address of the request. `privacy` confirms the adaptation.

**What the repo says about Apple's side, all UNVERIFIED by this runbook.** `docs/legal/TESTFLIGHT_TESTERS.md` records, from Apple's Help page "View tester feedback" read on 16 Oct 2026, that feedback and testers can be deleted ("Delete Feedback"; "Delete Tester & Feedback" also removes the tester) (A8), that an email-invited tester's address shows in the detailed feedback view while a public-link tester appears anonymous (A5), and that these screens need one of five roles (A2). This runbook's author did not open Apple's pages. At the rehearsal, read each screen and correct this section.

Steps:
1. Section 1, then find the tester in App Store Connect > the app > TestFlight, and their feedback items. If the feedback has no email on it (a public-link tester), you cannot match it to the sender: ask for the build number and the day, and if it still cannot be matched, tell them plainly that it cannot be found.
2. Section 2, with the phrase sent to the tester's address as Apple lists it.
3. Delete each item with "Delete Feedback". Use "Delete Tester & Feedback" only if they also ask to stop testing, and tell them first that it ends their access to the builds.
4. Remove other copies. Feedback emailed from the TestFlight app goes to the Feedback Email in Test Information; which mailbox that is for each app record is **UNVERIFIED** (`docs/ops/RELEASE.md` says `hello@earlyletters.com`; `TESTFLIGHT_TESTERS.md` recommends a dedicated one). Delete threads that hold only that feedback. Do the same for Help-row mail in `hello@`. Issues in the repository hold none by rule (`docs/release/AUTOMATION.md` 2.7); look for a pointer issue that names the submission. Keep the request thread itself, with no feedback text in it.
5. Reply with what you deleted and where. **Do not say Apple deleted its own copy:** what Apple keeps after a developer deletes feedback is unknown here.
6. Log it. The row holds the ticket, dates and outcome only: no tester name or email, no feedback text, no screenshot, no device details.

## 8. Finish every route

1. **Reply** with what was done, on what date, and what was not done and why. No letter text, no ids. If you refused, add the appeal line (section 0).
2. **Record:** `completed` date and `outcome` in the log. Where you touched the database, the audit row is already in `ops.audit_log` (operator, runbook, reason code, ticket, profile id; kept 12 months). The log never holds content.
3. If it will pass day 45 and was not extended, fix first, then tell the person from `hello@` with the new date and ask `legal` about the clock (as `stuck-deletion.md` section 8 does).

## 9. What is not built

| Gap | Effect | Owner |
|---|---|---|
| `ops_open_account_deletion` (BL-551) | Route 1 cannot run; `underage-account.md` step 4 cannot run | `data-architect` |
| Server-built export (DATA-REQ-054) | "See" and "export" depend on the person's phone or another signed-in phone | no BL row found |
| A function for a by-hand consent act; the handoff on the `context` allowlist for `support_assisted` acts (`docs/agents/exec/RULINGS.md`) is unresolved | Route 2 uses a SQL Editor insert | `data-architect` |
| `privacy_requests` table (BL-237 remainder) | The request log is a spreadsheet | `compliance-engineer` |
| Macros: first reply, the phrase email, the closed-route reply, a refusal with the appeal line | Written by hand today; nothing is improvised in a ticket | `support` |
| A withdraw switch in the app (BL-485) | The phone shows Off but cannot withdraw | `mobile` |
| The 0.9.0 text names "Settings, Your data" (BL-783) | The reply names the real path | `legal`, founder merges |
| Whether a destructive step on an unverified third-party age report needs DSR-R02 | `underage-account.md` says the report is the knowledge; chapter 08 says verify control | `privacy`, counsel (COUNSEL_PACKET Q46, old Q5) |
| How authorized agents are handled, and the appeal | Section 0 holds the safe default | counsel |

**UNVERIFIED, to check at the rehearsal:** that hello@earlyletters.com reaches the founder (CR-60 lists it as a founder fact); which mailbox the TestFlight Feedback Email is; Apple's screens and wording; the Supabase dashboard and SQL Editor steps on the real project; that the section 4 insert and `has_active_consent` call run as written.

## 10. Rehearsal checklist

Run each route once on a fictional account (the family "Asha", an address you control) before the pages go live. Route 1 cannot be rehearsed until BL-551 exists.

| Route | The check that proves it |
|---|---|
| Section 2 | A phrase reaches the account address only; a reply without it changes nothing |
| 2. Withdraw sync | `has_active_consent` is `false`; the phone reads "Off, kept on this phone"; the log row has no letter text |
| 3. See, export, correct | The export runs; the changed name shows after reopening the app |
| 4. Under 18 | `underage-account.md` sections 1 and 2 run; section 4 waits for BL-551 |
| 5. TestFlight feedback | A test item is deleted in App Store Connect; the log row has no tester content |

## The person-facing lines (COORDINATION section 10)

- **Shown:** nothing new in the app. By email: the macros in section 9, once `support` writes them. The reply in Route 1 is proposed above and awaits the founder.
- **Records:** the request log row (section 1). For Route 2, one `withdraw` act in `policy_acceptances`: document, version, action, method `support_assisted`, surface, server time, app version `n/a`, platform. A by-hand act has no phone time, build number, OS version, text language or words hash, because no screen was shown (PRIV-R21). Every route that touches the database also writes one `ops.audit_log` row first (operator, runbook `dsar`, reason code, ticket, profile id).
- **Never:** an ID, birth date, age, photo, address, payment detail, the child's name, letter text, feedback text, a screenshot or device details in any row or ticket; an email or id pasted outside the dashboard screen (PRIV-R02, PRIV-R10).
- **Decline and withdraw:** a person who will not confirm control gets nothing changed and the same reply. A refusal carries the appeal line. Sync can be turned back on by the person. Export and deletion never depend on a consent (PRIV-R09).
