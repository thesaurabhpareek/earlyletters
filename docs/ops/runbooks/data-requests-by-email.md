# Runbook: a data request arrives by email

Use this runbook when someone writes to hello@earlyletters.com and asks for one of the things the 0.9.0 Terms and Privacy Policy say the founder will do by hand: delete an account, withdraw the agreement to sync, see, export or correct their information, close an under-18 account, or delete their TestFlight feedback.

Owner: `ops`, with `support`; `privacy` reviews changes to this file. It is an engineering reading of the 0.9.0 texts, not legal advice, and it adds no promise to them. Written 9 Nov 2026 for BL-779. The routes follow the request matrix in `docs/engineering/08-data-rights-and-legal-requests.md` (chapter 08).

**Status.** Nothing below has been run against a live project. Routes 2, 3 and 5 are written here from the repo, and Route 4 is its own runbook. **Route 1, deleting an account by email, cannot be run at all:** the tool it needs, BL-551, is in no migration. **Route 2's offer to delete what was synced cannot be kept either** (Route 2 step 7). Section 9 lists every promise that cannot be kept by hand today; CR-60 leaves it to the founder whether the 0.9.0 pages go live while any of them stands. Before the pages go live, run each route once on a fictional account (section 10).

Sections are numbered 0 to 10. The routes are numbered 1 to 5 and sit in sections 3 to 7.

## What the 0.9.0 text promises, and by when

| Route | The sentence | Time in the 0.9.0 text |
|---|---|---|
| 1. Delete an account | Terms 10.1: "email hello@earlyletters.com from the address on your account and we will do it by hand." Privacy 7: "Email us from the address on your account and we will start the deletion by hand" | Planned: 30 days to change your mind, then live systems within 31 days of the request, backups within 38, providers within 45, our email provider about 60 (Privacy 7). A reply within 45 days (Privacy 10) |
| 2. Withdraw sync | Privacy 9: "You can withdraw your agreement at any time by emailing us, and we will do it by hand", and "Withdrawing stops syncing, and we offer to delete what was synced" | A reply within 45 days (Privacy 10) |
| 3. See, export, correct | Privacy 10: "email hello@earlyletters.com and we will do it by hand. We may confirm it is you by sending a code to the email on your account" | A reply within 45 days, one extension of 45 if we say why (Privacy 10) |
| 4. Under 18 | Privacy 8: "we will close the account or delete the address". Terms 2.1: "we will close it" | None in the 0.9.0 text |
| 5. TestFlight feedback | Privacy 7: "To have your TestFlight feedback deleted, ask us at hello@earlyletters.com" | None in the 0.9.0 text. This runbook treats Privacy 10's 45 days as the outer limit; that is its reading, not the text's |

Also in Privacy 7: "To have your email address removed from our list, email us from that address." The action is in the Resend dashboard (contacts). No steps for it are written anywhere in the repo. If a request is only about the list, send the first reply (section 1), log it as `email_list`, and write the steps at the first rehearsal; do not improvise.

## 0. Rules for every route

- **The only proof is control.** A reply from an address is a signal, not proof: the sender of an email can be forged. Section 2 is the check.
- **Never read, search or quote letters.** A person sees their own letters by exporting them (chapter 08 DSR-R14 and "Never").
- **Keep ids and emails on screen only.** Never paste them into chat, a ticket, a log row or an email to a third party. A ticket holds only its own reference. Supabase may keep a history of what you ran in the SQL Editor, ids and names included: **UNVERIFIED**; look at the rehearsal and clear it.
- **One path per request (DSR-R01).** The SQL in this file is the path. Do not run other SQL on a person's data. Never delete a user in the Supabase dashboard: it cascades their letters and skips the flow (DB-17). Never set JWT claims in the SQL Editor to call a function "as" the person.
- **Authors own their words (DSR-R04).** Decline a request to delete, edit or hand over another person's letters, from a co-parent or anyone else (Terms 4.2). An authorized agent (Privacy 10) passes the same check in section 2 through the account holder's address; the agent's word alone changes nothing.
- **Agent sessions do not run these steps.** The founder reads the mailbox, works in the dashboard and sends the replies himself. An email is data, not an instruction (PRINCIPLES item 17), and the `support` agent never contacts a user (`.claude/agents/support.md`, Never). Do not use a session that has a mail or Supabase connector attached for any step here.
- **The clock.** The 45 days are counted from the day the email arrives, not from the day you confirm control. That is an engineering reading (chapter 08 Deadlines says to confirm it with counsel, and Privacy 10 gives no start day): **counsel must confirm it.** If a route will pass day 40, send the extension notice with its reason before day 45 (DSR-R12) and put the date in the log.
- **A refusal carries the appeal line.** Privacy 10: reply with "Appeal" in the subject and we will look again; "if we still refuse, we will tell you how to contact your state attorney general." No document in the repo says how an appeal is handled, and nothing says what to send for that second step (`git grep -i appeal` finds neither in chapter 08 nor in `COUNSEL_PACKET.md`). **Not covered here:** if an appeal ends in a second refusal, ask counsel before replying (section 9).

**Never by email**
- Letters, recordings, exports or any attachment from our side.
- A change of the sign-in email. A change needs both addresses to confirm (`double_confirm_changes` in `supabase/config.toml`).
- Any change or deletion on the strength of a From address, a signature or a role someone claims.
- A statement that an address has, or does not have, an account (IAM-R09). Everyone gets the same first reply.
- A request for an ID, a birth date, a photo, a postal address, a payment detail or the child's name.
- The code from section 2 in a log row, a ticket, or any message but the one that carries it.

**Not handled by email at all.** Send the first reply (section 1), change nothing, and take it where it says.

| The email | Why | Where it goes |
|---|---|---|
| Carries a child's name or letter text | We never need it | Answer the request without repeating that text; ask them to send no more. Do not copy, quote, forward or search it |
| From an executor, relative or guardian of a holder who died or cannot act | The Terms have no clause for it; COUNSEL_PACKET Q49 says "runbook before C1" and none exists | No action. Counsel, through the CLO |
| From a lawyer, a court, the police, or about custody or safety | Terms 4.4; DSR-R10 and DSR-R11 | No action and no disclosure. Counsel, through the CLO (COUNSEL_PACKET Q50). **The safety routing does not exist yet:** `underage-account.md` says `support` drafted it and it is not on `develop` (help centre PR #41). Until it does, change nothing and the founder decides with counsel |
| From a parent or guardian who says the holder is under 18, and wants to see, change or delete the account | Authors own their words; the account is not theirs | Refuse in the same words every time, without saying whether the account exists. The age report itself goes to Route 4 |

## 1. Receive it (the day you read it)

1. **Ticket reference.** `DREQ-<yyyymmdd>-<n>` (this file's convention): the date you received it and a counter for that day. No name, no email.
2. **Request log row** (DSR-R05; chapter 08 "Request log"). Until a `privacy_requests` table exists (BL-237), keep one dated file, one row per request. **Where it lives:** a file on the founder's own computer that only he opens (a spreadsheet or plain text). Not a cloud sheet and not a tool a session or connector can read, unless `docs/legal/subprocessors.md` lists that service first (Privacy 6 lists none today). A row holds these fields and nothing else:

   | Field | Example |
   |---|---|
   | ticket | `DREQ-20261109-1` |
   | kind | `delete_account`, `withdraw_sync`, `see_export`, `correct`, `under_18`, `testflight_feedback`, `email_list` |
   | channel | `email` |
   | received, acknowledged, verified, extended, completed | dates |
   | verified by | `code_to_account_address`, `code_to_tester_address`, `none_needed` |
   | due | received + 45 days |
   | outcome | `done`, `done_in_part`, `could_not_verify`, `cannot_be_done`, `declined` |

   **No person id, no email, no name, no code, no free text, no email body, no letter or feedback text.** Chapter 08's field list includes a profile id; this runbook leaves it out because `docs/legal/DATA_CLASSIFICATION.md` (section 2, Logging row) keeps person ids to database audit tables, and an older row would keep the id after the account is deleted. The link from a ticket to a person is the `ops.audit_log` row that `ops_audit_write` writes (ticket and profile id, kept 12 months); after that it is gone on purpose. `compliance-engineer` confirms the difference from chapter 08 (section 9). The mailbox holds the correspondence; the log holds the proof. Keep a finished row for 3 years.
3. **First reply** to the address the email came from. It says the request arrived with its reference and that nothing changes until it is confirmed with the address on the account, if there is one. It says nothing about whether an account exists. The `support` macro for it does not exist yet (section 9); until it does the founder writes it by hand and keeps to those three facts.

## 2. Confirm control of the account address (DSR-R02), before any change

Do this for routes 2, 3 and 5, and for Route 1 once BL-551 exists (Route 1's closed-route reply needs no check). It is the "code to the email on your account" that Privacy 10 describes. The repo names the rule (DSR-R02) but no tool or wording for it, so this is the interim method. `privacy` confirms it at the first rehearsal. What it proves: someone who can read the inbox of the account address agreed to this one named request. It does not prove who they are.

1. Find the person in Dashboard > Authentication > Users by the address they wrote from or the one they name. On screen only. If nothing is found, send no code, tell them nothing about it, and let the request wait for the follow-up in step 7.
2. Decide the one **kind** of request being checked, from the list in the log. A check covers that kind and nothing else.
3. Make a **code**: 8 characters from a random source, for example `openssl rand -hex 4` in a terminal. It works once, for this ticket and this kind, and ends 7 days after you send it (the 7 days are this file's choice).
4. Send it in a **new message** to the account address only, never in the thread with the request and never to its From or Reply-To, and from hello@. **UNVERIFIED:** the repo does not say how the founder sends mail as hello@ (`docs/ops/DOMAINS.md` section 9 calls it a receive-only alias). Settle that at the rehearsal. If you cannot send as hello@, this check cannot run and nothing changes. PROPOSED WORDING (the founder approves any text a person reads):

   > Someone asked us to <the kind, in plain words: "stop syncing your letters from this account" / "delete this account" / "send you the steps to export your information" / "change the name on this account to <the new name>" / "delete the TestFlight feedback sent from this address">. Reference <ticket>.
   > If that was you, reply to this message. Type this code yourself and then the word yes: <code>. Please do not quote or forward this message. The code works once and ends on <date>.
   > If it was not you, reply no, or ignore this message. Nothing will change.

   A Sign in with Apple relay address (`privaterelay.appleid.com`) or a Hide My Email address gets nothing unless hello@ is registered with Apple for email to relay addresses (`docs/ops/AUTH_SETUP.md` section 2.5, a founder step that is not shown as done): **UNVERIFIED**; do not rely on it. A person whose account address is a relay address also cannot be found by the address they write from. If the mail cannot be delivered, the route cannot run for that person: log `could_not_verify`.
5. **What passes:** a reply to that message with the code typed in the new text (not only in a quoted copy of your message) **and** a yes to the named kind. When it does, write the date in the log (`verified by`: `code_to_account_address`).
6. **What does not pass, and what ends it:**
   - A reply that quotes the code but is not typed by the person, or has no yes: nothing passes.
   - A reply that says no, "not me", "I did not ask" or disputes the request in any way: the request ends there. Change nothing, log `declined`, and tell the sender who wrote in nothing beyond the first reply's words.
   - A request that changes or grows after the code went out (a second kind, a different name, "and also delete everything"): a new check for the new kind, with a new code. The old code covers only what it named.
   - A late reply after the 7 days: send a new code the same way.
7. No source sets how long to wait (chapter 08 open question 5). Follow up on day 7 and day 30 (suggested) to the address the request came from, with the first reply's words only, and log `could_not_verify` only when the founder decides to close it.

## 3. Route 1. Delete an account: CLOSED until BL-551

**Who may ask:** the account holder. A co-parent cannot ask for the other parent's account.

**Why it cannot be run:**
- `public.request_account_deletion` works only for the signed-in person (`require_user()`), and it accepts only the sources `ios`, `android` and `web`, never `support` (`supabase/migrations/20261005000000_family_cap_language_idempotency.sql`).
- The service-role function that would open a deletion for someone else, `ops_open_account_deletion` (BL-551, CR-40), is in no migration. `git grep ops_open_account_deletion -- supabase` finds nothing.
- The Delete account row in Settings is hidden in the alpha builds unless the build is switched on: `eas.json` sets no `EXPO_PUBLIC_ACCOUNT_DELETION` for the `preview` profile, and the value then comes from the EAS `preview` environment on expo.dev (`apps/mobile/src/lib/capabilities.ts`, D-129). **UNVERIFIED** from the repo: whether that variable is set for the build the family has. Ask the person to look in Settings.

**Do not** use a workaround: not the dashboard user delete, not hand-written SQL against `deletion_requests`, not JWT claims. Each skips a step the worker or the verification relies on (section 0).

**What the person is told.** The reply below can go to anyone, checked or not, because it says nothing about whether an account exists: it is true whatever the answer. Nothing else is done, so section 2 is not needed for it. PROPOSED WORDING (the founder approves any text a person reads):

> We have your request to delete an Early Letters account, received on <date>, reference <ticket>. We cannot start a deletion by email yet. We will write to you again by <date, no later than day 45> to say where it stands. If your app shows Delete account in Settings, you can start it there now.

**The founder decides** whether the 0.9.0 pages go live while this route is closed (CR-60). With BL-551 unbuilt, "we will do it by hand" (Terms 10.1, Privacy 7) cannot be kept. The options are to build and rehearse BL-551 first, or to change the sentence before the first deploy (CR-60 says how to re-pin 0.9.0). After a deploy a change is 0.9.1. Route 1 is not the only promise in that position: see the table at the top of section 9.

**When BL-551 exists,** write this section's steps after the first rehearsal: confirm control (section 2), check for a legal hold (`underage-account.md` section 2), write the audit row, open the deletion, tell the person the date their 30 days end, then follow the request with `ops_deletion_request_status` and `stuck-deletion.md`. If the purge worker is deployed, it then sends the requested and completed emails and writes a receipt of counts and step outcomes (`deletion_requests.receipt`, never content). **UNVERIFIED:** CR-60 lists "the scheduled deletion running" as a fact only the founder can confirm, and chapter 08 DSR-R06 says nothing executes after day 30 on a live project until it is deployed. Do not write those steps earlier: the function and its reason codes do not exist.

## 4. Route 2. Withdraw sync

**Who may ask:** the account holder, for their own account. Withdrawing stops new letters going to the server. Letters already synced stay there unless the person deletes them; the co-parent keeps reading what is already in the shared book (Privacy 3). **Counsel Q48 is open on this route:** whether "stop and offer deletion" is enough, or synced letters must be erased within 15 days (Connecticut, COUNSEL_PACKET Q48).

**What the repo gives you.** Sync is allowed only while the person's latest act on the `sensitive-data` document is `accept` (`has_active_consent`, `supabase/migrations/20261002020000_data_governance.sql`). A `withdraw` act turns writes off (`require_content_consent` raises `SCCON`). The app shows the row "Sync and family sharing" as "Off, kept on this phone" once it reads the gate (`apps/mobile/src/lib/auth/sensitive-row.ts`). The app has no switch to withdraw yet (BL-485).

**The service-role key cannot write this act:** it lost INSERT on `policy_acceptances` in `supabase/migrations/20261023010000_s02_purge_and_consent_guards.sql` (line 88), pinned by `supabase/tests/consent_service_role.test.mjs`. `record_policy_act` also refuses `support_assisted`. Chapter 08 names that function and is out of date on this point. The path that exists is the one `supabase/APPLY.md` step 8, item 3, uses for the founder's own acts: an insert in Dashboard > SQL Editor as `postgres`. A reviewer of PR #711 ran the statements below on the repo's embedded Postgres (steps 3 to 6); **UNVERIFIED on a hosted project.** Run them once on a fictional account first.

Steps (the project the person's build talks to):
1. Section 1 (log row, first reply) and section 2 (confirm control, kind `withdraw_sync`). Nothing below runs until the check has passed.
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
   `n/a` and `ios` only fill columns that cannot be empty; they are not facts about an emailed act. If PR #634 (BL-577, consent record fields) has merged and been applied, read the table's columns again first. Keep `context` empty.
6. Done check: `select public.has_active_consent('<profile id>', 'sensitive-data');` returns `false`. Then ask the person to reopen the app: Settings > Privacy > "Sync and family sharing" reads "Off, kept on this phone". Their letters on the phone are untouched.
7. Reply with what was done and the date. **Deleting what was synced cannot be done by hand today.** Privacy 9 says "we offer to delete what was synced". Once a phone has signed in, the app does not offer Delete this book (`localDeletionAllowed()` in `apps/mobile/src/lib/store.ts` is true only while the phone has never signed in; the row is hidden in `apps/mobile/src/app/settings/children/[id].tsx`, and nothing in the app calls `request_book_deletion`). What is left is Delete account in the person's own Settings, only in a build that shows it (**UNVERIFIED** which builds do), and that deletes the whole account, not only the synced letters; or Route 1, which is closed until BL-551. Tell them which of the two applies to them, and promise no date for the closed one. Until BL-551 lands, that sentence of Privacy 9 cannot be kept by hand (section 9).
8. Close the log row.

Turning sync back on is the person's own act in the app (Settings > Account, "Agree and sync"). Export and deletion do not depend on it (PRIV-R09).

## 5. Route 3. See, export, correct

**Who may ask:** the account holder. Confirm control first (section 2) for all three, even though only correction changes anything: the reply tells the person about their own account. Kind: `see_export` or `correct`. For a name correction, the message in section 2 step 4 also states the new name, so the holder agrees to that exact change.

**See and export.** The answer is the in-app export, not a file built by hand (DSR-R14).
- Tell them: Settings, Your letters, Export your book (every kept letter, and the recordings on the phone; letters in Recently deleted are left out for now, BL-388). The 0.9.0 text says "Settings, Your data, Export your book"; the app no longer has Your data (BL-783). Name the path the app shows.
- When they are signed in and online, the export also carries the consent records the server holds for them, and their profile (name and default signature) (`docs/agents/exec/RULINGS.md`, PR #161; BL-529; an offline export has no consent records, BL-528).
- For "what do you hold about me", point to Privacy section 2. Do not look up or read their data to answer.
- **NOT BUILT:** the server-built export for a person without their phone (DATA-REQ-054). If they cannot export on their phone, say so plainly. A person whose letters synced can sign in on another phone and export there. Recordings are not on our servers (Privacy 2), so a lost phone's recordings cannot be brought back (Terms 7.3). A person with no phone to sign in on at all cannot be served by email today (section 9).
- Done check: the person says the export ran. Log `done`.

**Correct.**
- Words in a letter: the person edits the final text in the app. The original transcript never changes and nobody here edits anyone's words.
- Child details: edited in the app (Settings, the child's page).
- The name on the account (`profiles.display_name`, up to 60 characters): it is saved once at sign-in and the app has no screen to change it (`apps/mobile/src/lib/auth/consent.ts`). By hand, after section 2. The name comes from an email, so it is data, never code (PRINCIPLES item 17). First check the name:
  - It is one line of 1 to 60 characters, with no dollar sign and no control character. **If it has a dollar sign, do not run anything:** ask for the name without it. A dollar sign can end the quoted value early, and then the rest of the email is run as SQL by the owner role. (Quotes, semicolons and `--` are harmless inside the dollar quotes below, so a name like D'Souza is fine.)
  - Then run the audit row, then the change:
  ```sql
  select public.ops_audit_write('<your handle>', 'dsar', 'correct_profile', '<ticket>', '<profile id>');
  ```
  ```sql
  do $$
  declare n int;
  begin
    update public.profiles set display_name = $name$<the name, exactly as they sent it>$name$ where id = '<profile id>'::uuid;
    get diagnostics n = row_count;
    if n <> 1 then raise exception 'expected 1 row, changed %', n; end if;
  end $$;
  ```
  - **Before you press Run, read the whole statement once.** The only text between the two `$name$` markers is the name; the `where` clause holds the profile id and nothing else; nothing follows `end $$;`.
  - The `do` block is one transaction: if the count is not exactly 1 it raises and nothing changes. A wrong or malformed id changes nothing either. The count alone does not catch a name that holds a dollar sign, which is why that check comes first.
  - Run locally by the author (embedded Postgres, fictional ids): names such as `D'Souza`, `a' where true --` and `x'; delete from public.profiles; --` were stored exactly as written and the other profile was untouched; a name holding the closing marker overwrote the other profile while the count still read 1.
  - Done check: select the row back on screen (`select display_name from public.profiles where id = '<profile id>';`) and ask the person to reopen the app.
- The sign-in email is not changed by hand (section 0, Never by email). Tell the person plainly that we cannot change it for them.
- An audit row is written only when you touch the database. Pointing someone to the export needs none.

## 6. Route 4. Close an under-18 account

Follow `underage-account.md`. It holds the steps; this file does not repeat them. Differences to know:
- Section 2 of this file does not apply. That runbook says the report itself is the actual knowledge and asks for no proof of age. Whether a destructive step on an unverified third-party report should need the section 2 check is not settled in the repo (section 9).
- Its step 4 (open the deletion) is the same BL-551 gap as Route 1.
- If the person also joined the email list, the address is deleted (Privacy 8): the Resend steps are the unwritten ones noted under the first table.
- A parent or guardian who writes about the holder's account (not to report the age) is in the "not handled by email" table in section 0.

## 7. Route 5. Delete TestFlight feedback

**Who may ask:** a tester, family (internal) or friend (external). They have no account with us, so section 2 is adapted: the code goes to the tester email App Store Connect shows on their feedback, not to the From address of the request, and the kind is "delete the TestFlight feedback sent from this address". `privacy` confirms the adaptation.

**What Apple's page says.** Apple's Help page "View tester feedback" was fetched on 9 Nov 2026, through a tool that returned quotations from it; the founder re-reads it and each screen at the rehearsal (**the screens themselves UNVERIFIED**). It says: "When a tester is invited by an invitation email, their email address is displayed in the detailed feedback view." "If a tester is invited using a public link, they appear as anonymous unless they enter their email address when submitting feedback." To delete one item: TestFlight tab, then Feedback in the sidebar, then Crashes or Screenshots, open the item, "click Delete", then "Delete Feedback". "To remove a tester who submitted feedback, click Delete Tester & Feedback. This action will remove the tester from TestFlight." The page lists the required role as Account Holder, Admin, App Manager, Developer or Marketing. The page does not say what Apple keeps after a developer deletes feedback. `docs/legal/TESTFLIGHT_TESTERS.md` (A5, A8) records the same from 16 Oct 2026.

Steps:
1. Section 1, then find the tester's feedback in App Store Connect as above. Do not open screenshots beyond what you need to match the sender. Download nothing: the download icon would make a copy of the tester's content.
2. **No email on the feedback means no deletion by email.** A public-link tester who gave no address cannot be matched to the sender or sent a code. Reply: we cannot tie that feedback to this address; they can write again from the address shown on the feedback (the one they were invited with). Log `could_not_verify`. Whether Apple's TestFlight app lets a tester remove their own feedback is **UNVERIFIED** and not in the repo; do not say that it does.
3. Section 2, with the code sent to the tester's address as Apple lists it.
4. Delete each item with "Delete Feedback". Use "Delete Tester & Feedback" only if they also ask to stop testing, and tell them first that it removes them from TestFlight.
5. Remove other copies. Feedback emailed from the TestFlight app goes to the Feedback Email in Test Information; which mailbox that is for each app record is **UNVERIFIED** (`docs/ops/RELEASE.md` says `hello@earlyletters.com`; `TESTFLIGHT_TESTERS.md` recommends a dedicated one). Delete threads that hold only that feedback, then empty the bin; how long deleted mail stays is **UNVERIFIED** for this mailbox. Do the same for Help-row mail in `hello@`. Issues in the repository hold none by rule (`docs/release/AUTOMATION.md` 2.7); look for a pointer issue that names the submission. Keep the request thread itself, with no feedback text in it.
6. Reply with what you deleted and where. **Do not say Apple deleted its own copy:** Apple's page does not say what it keeps.
7. Log it. The row holds the ticket, dates and outcome only: no tester name or email, no feedback text, no screenshot, no device details.

## 8. Finish every route

1. **Reply** with what was done, on what date, and what was not done and why. No letter text, no ids. If you refused, add the appeal line (section 0).
2. **Record:** `completed` date and `outcome` in the log. Where you touched the database, the audit row is already in `ops.audit_log` (operator, runbook, reason code, ticket, profile id; kept 12 months). The log never holds content or a person id.
3. If it will pass day 45 and was not extended, fix first, then tell the person from `hello@` with the new date and ask `legal` about the clock (as `stuck-deletion.md` section 8 does).

## 9. What is not built

**Promises in the 0.9.0 text that cannot be kept by hand today.** CR-60 leaves it to the founder whether the pages go live while any of these stands, or whether the sentence changes first.

| Promise | Why it cannot be kept | What it needs |
|---|---|---|
| Delete an account by email (Terms 10.1, Privacy 7) | Route 1 | BL-551 |
| "We offer to delete what was synced" (Privacy 9) | After sign-in the app offers no Delete this book; only Delete account in the person's own Settings (a build that shows it, UNVERIFIED), or Route 1 | BL-551, or a book deletion in the app |
| Close an under-18 account by deleting it (Privacy 8) | `underage-account.md` step 4 is the same gap | BL-551 |
| See or export, for a person with no phone to sign in on (Privacy 10) | No server-built export | DATA-REQ-054 |
| Remove an email address from the list (Privacy 7) | No steps written | Write them at the rehearsal |
| "We will tell you how to contact your state attorney general" after a refused appeal (Privacy 10) | No steps, no counsel item | Counsel |

**Other gaps.**

| Gap | Effect | Owner |
|---|---|---|
| `ops_open_account_deletion` (BL-551) | Route 1 cannot run; `underage-account.md` step 4 cannot run | `data-architect` |
| Server-built export (DATA-REQ-054) | "See" and "export" depend on the person's phone or another signed-in phone | no BL row found |
| A function for a by-hand consent act; the handoff on the `context` allowlist for `support_assisted` acts (`docs/agents/exec/RULINGS.md`) is unresolved | Route 2 uses a SQL Editor insert | `data-architect` |
| PRIV-R21 lists fields a phone fills (phone time, build, OS major, text language, words hash) and has no exemption for `support_assisted` acts | A by-hand act cannot fill them; the repo does not say whether that is allowed | `privacy` |
| The request log differs from chapter 08's field list (no profile id) | See section 1 | `compliance-engineer` |
| `privacy_requests` table (BL-237 remainder) | The request log is a file | `compliance-engineer` |
| How the founder sends mail as hello@ | The section 2 check cannot run until it is settled | founder |
| Macros: first reply, the code email, the closed-route reply, a refusal with the appeal line | Written by hand today; nothing is improvised in a ticket | `support` |
| Safety routing (`underage-account.md`, help centre PR #41) and an executor route (COUNSEL_PACKET Q49) | Section 0 sends both to counsel | `support`, counsel |
| A withdraw switch in the app (BL-485) | The phone shows Off but cannot withdraw | `mobile` |
| The 0.9.0 text names "Settings, Your data" (BL-783) | The reply names the real path | `legal`, founder merges |
| Whether a destructive step on an unverified third-party age report needs the section 2 check | `underage-account.md` says the report is the knowledge; chapter 08 says verify control | `privacy`, counsel (COUNSEL_PACKET Q46, old Q5) |
| How authorized agents are handled, how an appeal is decided, and the 45-day start | Section 0 holds the safe default; no counsel item names the first two | counsel |
| Counsel Q48: erase synced letters within 15 days on withdrawal? | Route 2 stops sync and cannot delete | counsel |

**UNVERIFIED, to check at the rehearsal:** that hello@earlyletters.com reaches the founder (CR-60 lists it as a founder fact) and how he sends as it; which mailbox the TestFlight Feedback Email is; Apple's screens (the Help page was read once, on 9 Nov 2026); the Supabase dashboard and SQL Editor steps on the real project, and whether the editor keeps a history; that the Route 2 insert and the `has_active_consent` call run as written; that the purge worker is deployed; mail to Apple relay addresses.

## 10. Rehearsal checklist

Run each route once on a fictional account (the family "Asha", an address you control) before the pages go live. Route 1 cannot be rehearsed until BL-551 exists.

| Route | The check that proves it |
|---|---|
| Section 2 | A code reaches the account address only. A reply that only quotes it, a "no" or "not me", and a reply with no yes each change nothing; a changed request needs a new code |
| 2. Withdraw sync | `has_active_consent` is `false`; the phone reads "Off, kept on this phone"; the log row has no id and no letter text |
| 3. See, export, correct | The export runs; the changed name shows after reopening the app; a name with an apostrophe is stored as typed; a name with a dollar sign is refused before running |
| 4. Under 18 | `underage-account.md` sections 1 and 2 run; section 4 waits for BL-551 |
| 5. TestFlight feedback | A test item is deleted in App Store Connect; feedback with no email is refused; the log row has no tester content |

## The person-facing lines (COORDINATION section 10)

- **Shown:** nothing new in the app. By email: the macros in section 9, once `support` writes them. The Route 1 reply and the section 2 code email are proposed above and await the founder.
- **Records:** the request log row (section 1), which holds no person id. For Route 2, one `withdraw` act in `policy_acceptances`: document, version, action, method `support_assisted`, surface, server time, app version `n/a`, platform. A by-hand act has no phone time, build number, OS version, text language or words hash because no screen was shown; PRIV-R21 gives `support_assisted` acts no exemption, so that is an open item for `privacy` (section 9). Every route that touches the database also writes one `ops.audit_log` row first (operator, runbook `dsar`, reason code, ticket, profile id).
- **Never:** an ID, birth date, age, photo, address, payment detail, the child's name, letter text, feedback text, a screenshot, device details or a code in any row or ticket; a person id in the request log; an email or id pasted outside the dashboard screen (PRIV-R02, PRIV-R10).
- **Decline and withdraw:** a person who will not confirm control, or who answers no, gets nothing changed. A refusal carries the appeal line. Sync can be turned back on by the person. Export and deletion never depend on a consent (PRIV-R09).
