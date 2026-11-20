# NX-32: Managing my account after I have one

Status: draft, 9 Nov 2026 (UTC). Docs only. Author: `security-architect` handle, for the founder's request after the newest TestFlight test. It assigns no real id (`_CONVENTIONS.md`), reserves nothing, and answers no legal question: every counsel item is a flag.

Readiness: not scored against the 14-point audit; `qa` to score. What keeps it from ready: three founder decisions (D-1 to D-3 below), counsel for the "What we keep" page and the recovery wording, and a hosted project (theme 1) to prove anything that touches Auth.

| | |
|---|---|
| Working label | NX-32 (file number is the working id, like `NX-15`; rows are `NX-32-R<n>`) |
| Sibling files | NX-30 (navigation and landing, another agent), NX-31 (onboarding and account creation, another agent). This file starts after a person is signed in. It never specifies the sign-up path |
| Builds on, does not repeat | NX-02 (`02-sign-in-and-session-security.md`: sign-in, sign-out queue, force sign-out, Keychain), NX-04 (`04-delete-account-and-erase-phone.md`), NX-08 (`NX-08-consent-withdrawal.md`: the withdrawal sheet), NX-03 (`03-age-consent-and-region.md`), theme 8 billing (`08-plus-and-billing-trust.md`), theme 9 (`09-co-parent-and-shared-voice.md`), F02 in `docs/prd/v2/features/F02-account.md`, #614 (Settings regroup, merged), #635 (Before you begin, open), #520 (Erase everything, merged) |
| Refines | F02-REQ-001, -007, -023 (via NX-02); A-REQ-019 (partly), F02-U33 (new-device email); IAM-R05, IAM-R06, IAM-R10, IAM-R11, IAM-R12, IAM-R14, IAM-R24; SEC-R24; LEGAL-REQ-014, -044; DATA-REQ-054 |
| Tag | EVIDENCE for what the code does today (section "What exists today"). HYPOTHESIS for demand: no parent interview in `01-customer-needs.md` asks for account screens; the need comes from the founder's test and from Apple 5.1.1(v) and 4.8 |
| Size | M for the build 12 slice (R1, R2, R4, R9 to R12, R17, R18 guards and copy). L for the rest (R5 to R8, R13 to R16 need server work) |
| Gate | Founder (D-1 to D-3). Counsel (R15, R16 wording, R18 page). Apple 5.1.1(v) and 4.8 for what stays visible. A security read of any Auth settings change (SEC-R13) |
| Order | After theme 2 and theme 4 in the same wave; the build 12 slice can ride with them |

## What the parent will see and do

Asha's parent opens Settings and taps the card at the top. They land on Account. In eight lines it reads:

1. **You.** The way they signed in (mark, "Signed in with Apple" or "with email") and the address.
2. **Your letters are signed.** "Signed as Papa", a row that opens the book's existing sign-as editor. Nothing is typed twice.
3. **Ways to sign in.** Apple or email, then any passkeys. Add one, remove one. The last way cannot be removed.
4. **Your email.** Change it. Both inboxes get a note, and nothing changes until the new one is confirmed.
5. **Your devices.** This phone and the others, with the date each was last used. One row signs out every other device.
6. **Lock and lost phone.** App lock (a link), and "If you lose this phone", a short plain page.
7. **Your data.** Plan (a link), Sync and family sharing (shows the answer, opens NX-08's sheet), Export your book, Get a copy of what we hold, What we keep about you, Delete my account (NX-04).
8. **Sign out** at the bottom, with the words that tell them their letters stay on this phone. Help sits one tap away.

Nothing here counts anything, nags, or asks for a reason.

## What exists today (tree `origin/develop` fetched 9 Nov 2026; read by file, not run)

Built, read in `apps/mobile/src/app/settings/account.tsx` and `apps/mobile/src/lib/auth/session-provider.tsx`:

- Account header with provider mark, "Signed in with Apple" or "with email", email (selectable); Sync row (On, Off kept on this phone, Not set up yet, Waiting for a connection); "Finish setting up" and "Agree and sync" rows; Passkeys list, Add, Remove (only when `EXPO_PUBLIC_PASSKEYS=1`, `passkey.ts`); Devices > "Sign out other devices" (`signOut({ scope: 'others' })`, `session-provider.tsx` near line 525); Sign out with the outbox wait, "Stay signed in", and the signed-out page (`account-view.logic.ts`).
- The whole route redirects to Settings when `capabilities.signIn` is false (`account.tsx`, `AccountSettingsRoute`).
- Settings home (#614, merged): a header card that shows the name the parent signs as and opens Account when sign-in is on (`headerCard()` in `settings-home.logic.ts`); a Plan row under it; App lock row; Delete account row, own section, only while signed in and `capabilities.accountDeletion` (`settings/index.tsx`). Its header comment says Delete account stays there "until Account takes it in build 2".
- "How letters are signed": per book, `settings/children/[id].tsx` has a `signsAs` editor (limit 30 on the server column `profiles.signs_as`; whether the book value and the profile value are the same field is UNVERIFIED).
- Export your book: `settings/export.tsx`, a local ZIP, confirmed with Face ID or passcode when App lock is on (`confirmForExport`).
- App lock: `lib/app-lock/*` and `settings/app-lock.tsx`; it is a local screen lock and holds no sign-in secret (UNVERIFIED by test; read in `copy.ts`: "Anyone else who picks up your phone sees a cover").
- Server settings (`supabase/config.toml`): `jwt_expiry = 900`, `enable_manual_linking = false`, `[auth.email] double_confirm_changes = true`, notification emails enabled for `email_changed`, `identity_linked`, `identity_unlinked`. Whether the hosted project has the same values is UNVERIFIED (no hosted project is known, theme 1).
- `profiles` has `display_name` (60) and `signs_as` (30); `authenticated` holds select and update on it (`supabase/tests/grants.mjs`, policy `profiles_update_self`). Whether update is limited to those two columns is UNVERIFIED.
- A step-up precedent exists on the backup server: a call needs a sign-in within 10 minutes (`SCSTP`, `apps/mobile/src/lib/backup/contract.ts`).

Not found by search (9 Nov): any call to `updateUser`, `linkIdentity`, `unlinkIdentity` or `getUserIdentities` in `apps/mobile/src`; any email-change screen; any session or device list (the only `auth.sessions` read is a backup-server helper in `20261023000000_backup_server.sql`); any server-built "copy of my data" function (`supabase/functions` holds `analytics-forget`, `apple-token`, `config`, `content`, `escrow`, `invite-redeem`, `purge-worker`, `subscription-status`; DATA-REQ-054 specifies one); any "What we keep about you" page; any lost-phone page; any app-side step-up before a sensitive account action.

Not built: everything marked "new" in the check table.

Which build shows Account at all is UNVERIFIED and contested. `apps/mobile/eas.json` writes `EXPO_PUBLIC_SERVER_FEATURES` `off` for `production`, so a build from that profile has no Account, no sign-in and no sync (`lib/capabilities.ts`). #676 (open) removes the Apple sign-in entitlement from that build. `index.md` of this folder and the founder's brief say build 12 is on production servers. Until the founder settles that (D-1), R1 to R18 are specified for a server-on build, and a server-off build shows none of them (R1 guards this).

## The check

"Fails on old code" states what the tree does today (`_CONVENTIONS.md` section 6).

| Label | Tag | Given, When, Then | Fails on old code because | Source |
|---|---|---|---|---|
| NX-32-R1 | EVIDENCE | Given a build with server features off, When the parent opens Settings, Then the header card, Account route and every row in R2 to R20 are absent (0 rows), and a stale link to `/settings/account` lands on Settings. Given server features on and a signed-out phone, Then Account shows only the existing signed-out page (not respecified; NX-31 owns what leads to sign-in). | PASSES today for the route (`AccountSettingsRoute` redirects). New rows must keep it true: no test pins "every new Account row is behind `capabilities.signIn`". | `capabilities.ts`; NX-02 |
| NX-32-R2 | EVIDENCE | Given a signed-in Asha account on a server-on build, When the parent opens Account, Then the sections appear in this order and no other: You, Signs letters as, Ways to sign in, Your email, Devices, Lock and lost phone, Your data (Plan, Sync and family sharing, Export, Get a copy, What we keep, Delete), Sign out. 8 sections; Family and sharing is absent (R20). A section whose capability is off is absent, not greyed out. | `account.tsx` draws four sections (header, Sync, Passkeys, Devices) and Sign out; the order is not pinned. `account-view.logic.ts` decides row states only. | A-REQ-019 |
| NX-32-R3 | EVIDENCE | Given the Account screen needs to say how letters are signed, When it draws "Signs letters as", Then the value is read from the active book's existing `signsAs` (the one `children/[id]` edits and the header card shows), the row opens that editor, and Account holds 0 copies of the value. Editing it in either place changes both within 1 screen focus. No `display_name` is asked for, stored or shown (D-3). | No Account row exists for it; the header card reads the active book (`getActiveChild()?.signsAs`, `settings/index.tsx`). | #614; data minimisation |
| NX-32-R4 | EVIDENCE | Given an account with identities and passkeys, When Account lists "Ways to sign in", Then each method shows its name (Apple, email, passkey with its saved name), the date it was added, and "This is how you signed in" on the current one; the count of rows equals the count the server reports (identities plus passkeys). | Only the current provider mark and passkeys are drawn; identities are not read (no `getUserIdentities` in `apps/mobile/src`). | NX-02 |
| NX-32-R5 | EVIDENCE | Given a parent who signed in with Apple, When they choose "Add email" and confirm the code sent to the new address within 15 minutes (900 s), Then the account has 2 methods and a notification reaches the address; the reverse (email account adds Apple) works the same way. Given the code is wrong or late, Then 0 methods are added. Adding needs a step-up (R22). | No linking call exists, and `enable_manual_linking = false` in `supabase/config.toml`: the server would refuse. Turning it on is a security decision (D-2). | IAM-R05 |
| NX-32-R6 | EVIDENCE | Given an account with exactly 1 method that can sign in, When the parent taps Remove on it, Then the row has no Remove action, the screen says in one line why, and a direct server call to remove it is refused (0 methods removed, account still signs in). Given 2 or more, Remove asks once, and afterwards the count is one fewer and at least 1. Removing an Apple identity also revokes the stored Apple refresh token (`apple-token`, 204). | Passkey Remove has no count check; its confirm says "You can still sign in another way" (`authCopy.account.removePasskeyBody`), which is true only because every account today has an Apple or email identity. No identity removal exists. Whether Auth itself refuses to unlink the last identity is UNVERIFIED and must be proved on the throwaway project. | IAM-R06; F02-REQ-004 |
| NX-32-R7 | EVIDENCE | Given a signed-in parent who enters a new address, When they confirm, Then Auth sends a confirmation to the new address and a notice to the old one (`double_confirm_changes = true`), the screen shows "Check your new email" and the sign-in address does not change until the new link or code is confirmed. An address already in use gets the same screen and the same wait as a free one (no existence leak, IAM-R09; timing class within the NX-02-R3 tolerance). Needs a step-up (R22). | There is no email-change call or screen in `apps/mobile/src`. | IAM-R09; F02-REQ-005 |
| NX-32-R8 | EVIDENCE | Given an email change is confirmed on phone A with phone B also signed in, When it completes, Then phone A stays signed in, every other session ends (`scope: others`), and the old address got the `email_changed` notice within 2 minutes p95 (the NX-02 mail budget). Phone B meets the quiet signed-out page with its letters kept (NX-02-R4 wording). | Not built. The default for other sessions after an address change is UNVERIFIED (recommendation D-4). | SEC-R24 |
| NX-32-R9 | EVIDENCE | Given 3 sessions for Asha's account, When the parent opens Devices, Then 3 rows show: "This phone" first, then others with a plain device kind where known (otherwise "Another device") and the date last used; no IP address, no model, no place. A different account's sessions never appear (0 of 3 foreign rows). Offline, the list says it needs a connection and "Sign out other devices" stays offline-disabled with the reason. | No list exists. Auth offers no client call for it as far as this file found (UNVERIFIED); the plan is a new function `list_my_sessions()` (section "Schema and grants"). | IAM-R12; TDD 04 3.2.3 |
| NX-32-R10 | EVIDENCE | Given 3 sessions, When the parent taps "Sign out other devices" and confirms, Then the 2 others fail their next refresh, the list shows 1 row, this phone's stored session is unchanged, and phone B (offline until later) keeps its upload queue and shows the quiet signed-out page with letters kept when it reconnects (0 letters lost). | The call exists and works as written (`signOutOtherDevices`); never run across two phones, and no test covers the queue on the signed-out phone. The tap has no confirm today (one tap acts). | IAM-R12; F02-REQ-023 |
| NX-32-R11 | EVIDENCE | Given Sign out with 3 unsent letters (NX-02-R4 owns the queue), When the person confirms, Then afterwards this phone's database, audio and App lock setting are byte-identical to before, the signed-out Account page offers "Sign in", and the confirm body is the existing true sentence ("Your letters stay on this phone"). This row proves the sentence is true; the queue is NX-02-R4. | The sentence is a registered true statement (`signOutBody`, "one of the three keys allowed to say so"); no test asserts the local data is unchanged after a sign-out. | NX-02-R4; claim registry |
| NX-32-R12 | EVIDENCE | Given App lock on, When the parent opens Account, Then the "App lock" row shows On or Off and opens the existing page (1 tap); Account makes no claim that the lock protects the account or recovers it; a lost-phone page (R13) says the lock keeps a stranger out of the book on that phone and that it does not sign the phone out. | The App lock row sits in Settings, Privacy and security only (`settings/index.tsx`); no Account link; no copy explains lock versus sign-in. | CDesO-1 |
| NX-32-R13 | HYPOTHESIS | Given the recovery runbook of NX-02-R10, When the parent opens "If you lose this phone", Then a page of at most 5 short steps shows: sign in on the new phone the same way, use Sign out other devices to end the lost phone's session, and what is and is not on our servers for them (letters already synced when sync was on; letters only on the lost phone are not recoverable from us unless the encrypted backup was on, D-085, D-108). 0 lines promise recovery of anything not held. Owner for the target minutes: `support` (NX-02-R10). Until that target and counsel's read exist, this is a question, not a build row. | No page exists. The recovery runbook (#620) is not on `develop` (NX-02-R10). | NX-02-R10; D-085; D-108 |
| NX-32-R14 | EVIDENCE | Given the Plan row, When the parent taps it in Account, Then it opens the existing `settings/plus` page (1 tap) and shows the same status words as the Settings Plan row (Free, Plus, Plus shared), read from the same source (`getPlan`). Account shows no price text and holds 0 billing logic. Cancel and refund steps stay where theme 8 puts them. | The Plan row exists on Settings home only (#614); Account has none. | theme 8; CCO-9 |
| NX-32-R15 | EVIDENCE | Given Export your book in Account, When tapped, Then it opens the existing export page; with App lock on the confirm shows `appLockCopy.exportReason` first. Export still works with sync off, after a withdrawal and while signed out (PRIV-R09). | PASSES today on Settings home; Account has no link. Guard row. | PRIV-R09; C-REQ-017 |
| NX-32-R16 | HYPOTHESIS | Given "Get a copy of what we hold" in Account, When the parent asks, Then in the first release it opens the Help mail with a fixed subject and no body (LEGAL-REQ-014) and the page says the reply time that `support` has promised (NX-16); a later release builds it in the app as DATA-REQ-054 specifies (server-built package, needs a step-up, link by email, not shown in the app). Counsel sets the promised time. | No function exists (`supabase/functions` has no export folder) and no row exists. | DATA-REQ-054; NX-16 |
| NX-32-R17 | EVIDENCE | Given sync On, Off (after decline or withdrawal), unknown or signed out, When Account shows "Sync and family sharing", Then its value is read from the same source as Settings > Privacy (`sensitive-row.ts`: `read` and `subscribe`), the two rows never disagree (0 mismatches over the 4 states), and a tap opens the NX-08 sheet when On and the existing "Agree and sync" step when Off. This row builds no sheet; NX-08 owns it. | The Account Sync row is a read-only value and "Agree and sync"; it reads auth state while Privacy reads `sensitive-row`; a mismatch between them is possible and untested (UNVERIFIED which is current on a phone). | NX-08-R1, -R11 |
| NX-32-R18 | HYPOTHESIS | Given the page "What we keep about you", When opened (3 taps or fewer from Settings), Then it lists in plain words each kind of thing we hold: the sign-in address or Apple's relay address; which sign-in methods are on; the agreements recorded with dates; the letters, only when sync is on; the list of devices (R9); the plan status; and what we do not hold (no password, no contacts, no location, no advertising id). Every line maps to a row of the App Store privacy label, and a test fails if the page names a data type the label lacks or the label has one the page lacks. Flagged for counsel (claims registry, LEGAL-REQ-044); no line ships until counsel passes the set. | No page exists. Today's label source is `docs/store/app-store-connect-1.0.md` (the older `privacy-labels-apple.md` says it is superseded; its current content was not re-read, UNVERIFIED). | LEGAL-REQ-044; privacy label |
| NX-32-R19 | EVIDENCE | Given "Delete my account" in Account, When tapped, Then it opens the NX-04 flow (no second screen, no second route), needs a step-up (R22), and is absent when `capabilities.accountDeletion` is off or the phone is signed out. This row specifies only the second entry point. | `test/account-deletion-switch.test.ts` pins that `settings/index.tsx` is the only file naming `/settings/delete-account` and that `ROUTES.deleteAccount` is used once (line 332 and 335). An Account row would fail that test on purpose (D-129). Changing it needs the founder's approval (D-5). | D-129; NX-04 |
| NX-32-R20 | EVIDENCE | Given a build where the Family tab and child row are hidden (#665, D-126) or co-parent is off, When Account draws, Then no "Family and sharing" row, member list, invite or leave control appears (0 rows). Given co-parent is later on, Then the row lists members by the name each signs as, and leaving a book follows IAM-R20 and IAM-R21 (the last parent cannot leave). The member list is a later file (theme 9); this row only keeps it hidden. | Not built; the guard that no co-parent control reaches Account does not exist. | D-126; theme 9; IAM-R21 |
| NX-32-R21 | EVIDENCE | Given Help in Account, When tapped, Then the support mail opens with the fixed subject and nothing else (no email address of the user, no name, no version string in the body, LEGAL-REQ-014); with no Mail account the address shows to copy. The Terms and Privacy links are not repeated in Account (they are in Settings, Legal); Account carries exactly 1 help row. | Help exists on Settings home with `useHelpLink` (`settings/index.tsx`). Guard row. | LEGAL-REQ-014; F20-REQ-007 |
| NX-32-R22 | EVIDENCE | Given a sensitive account act (add a method, remove a method, change email, get a copy of data when built, delete account), When the last sign-in on this session is older than 10 minutes, Then the app asks the person to prove it is them the way they signed in (Apple sheet, or the email code) and the act waits; after 10 minutes of the proof the act is refused again. Where the act runs on a server function, the function checks the age of the sign-in itself and answers 401 `reauth_required` with no state change. A wrong or cancelled proof changes 0 things and shows no alarm words. | No step-up in the app (grep of `apps/mobile/src` for `reauth`, `stepUp`, `requireRecent` found only `lib/backup/contract.ts`). The 10-minute figure is the backup server's (`SCSTP`); it is a proposal for the rest. | SEC-R24; backup precedent |
| NX-32-R23 | EVIDENCE | Given a phone idle for any time, When the person opens the app, Then recording and reading never wait on a session (IAM-R11); Account acts in R5 to R8, R16, R19 need a live session and R22's proof; the stored session ends only by the person signing out, the server revoking it, `forceReauthEpoch` (NX-02-R5), or a server idle limit (D-6). | The idle limit is not set in `supabase/config.toml` (no inactivity or timebox setting found, 9 Nov). Whether the plan the project is on supports one is UNVERIFIED (Supabase Pro setting, not checked). | IAM-R11 |
| NX-32-R24 | EVIDENCE | Given any account act in R5 to R10, R16, R19, When it runs, Then the server holds a record without the phone's help: Auth's own audit log entry plus the notification email that `config.toml` enables for identity added, identity removed and email changed, and for session revocation a row through `ops_audit_write` from the function that revokes. The record holds profile id, act, time and result only. A canary check shows 0 of 4 canaries (email address, child name "Asha", a letter sentence, a token) in any row our code writes or any log line it emits. | No account act is recorded by our code today; Auth logs exist on a hosted project that is not known to exist. Retention of Auth's own audit log is UNVERIFIED. | SEC-R24; PRIV-R10 |
| NX-32-R25 | EVIDENCE | Given an attacker or a stuck script that repeats an account act, When an act is called more than 5 times in 10 minutes by one account (email change, add method, remove method), Then the 6th is refused with a friendly wait line and 0 state changes, and email sends obey `[auth.email] max_frequency`. | No account act exists to limit. Limits for sign-in are Auth's. | SEC-R24; NX-02-R3 |
| NX-32-R26 | HYPOTHESIS | Given Account at AX5 on an iPhone SE 3 with VoiceOver, Then 0 clipped lines, the order of the 8 sections is read as in R2, destructive rows (Remove, Delete) carry a word and an icon, tap targets are 44 pt or more, and Reduce Motion leaves a fade only. | No device row exists for Account at AX5 beyond S1-27. | S1-27; V-01 to V-10 |

## Abuse cases, one line per act (STRIDE; entries for `docs/security/` threat model when built)

| Act | Threat (STRIDE letter) | Control | Row |
|---|---|---|---|
| Email change | Someone with a borrowed unlocked phone takes the account (S, E) | Step-up; both inboxes confirm; notice to the old address; other sessions end | R7, R8, R22 |
| Email change | A guess reveals whether an address has an account (I) | Same screen and timing for taken and free | R7 |
| Add a method | Attacker links their own Apple id (S, E) | Step-up; new-method notice by email; manual linking is off until D-2 | R5, R22 |
| Remove a method | Lock-out, or removing the method a thief cannot use (D) | Never fewer than 1; server refuses too | R6 |
| Session list | Another account's devices shown (I) | Function filters on the caller's own id; matrix cell with a deny | R9 |
| Session list | IP, place, model leak (I) | Function returns last-used date and a kind only | R9 |
| Sign out others | A thief signs out the real owner (D, E) | Step-up is not required to sign out others (it protects the owner); the owner signs in again; notice email on new sign-in (F02-U33) | R10 |
| Sign out | Data deleted by mistake (T) | Nothing deleted; byte-identical check | R11 |
| Export | Stranger on an unlocked phone copies the book (I) | App lock confirm before share | R15 |
| Copy of my data | Someone requests a person's data (S, I) | Step-up; sent only to the account address; link expires; counsel's time | R16 |
| What we keep | The page promises more than the label (R, I) | Page versus label test; counsel | R18 |
| Delete account | Thief erases the family's book (D, T) | Step-up; NX-04's wait and Cancel before the date; Apple token revoked | R19, NX-04 |
| Any act | An agent or script abuses the functions (D) | Rate limit; no service key in the app (SEC-R03, IAM-R23) | R25 |
| Any act | No trace when something goes wrong (R) | Server-side record without the phone | R24 |

## Door lines

Account agrees to nothing new by itself; the doors it opens belong to other files. Where this file adds an act:

**Shown (add or remove a method, change email):** `authCopy.account.*` (new keys listed below), one plain line of what changes and what stays. Remove says the other ways still work.
**Records:** Auth's own audit entry and the notification email (R24). No consent act, because nothing here is an agreement.
**Never:** a password or reset flow (IAM-R06), a reason asked as a condition, the email address, a child's name or any letter text in a log or crash report, an IP or user agent in any table of ours, a token outside the Keychain, "lost", "gone" or "forever" wording.
**Decline and withdraw:** Cancel at every step changes nothing and records nothing. Sync withdrawal is NX-08. Deletion is NX-04.

## Edge cases

- Apple "Hide My Email": the address shown is the relay address; "Change email" for an Apple-only account first adds email as a method (R5), because Apple controls the relay. UNVERIFIED how Auth handles a relay address on change; prove on the throwaway project.
- Two methods that point to the same person but were created apart: merging accounts is not offered (a support path, NX-16). Adding a method that already belongs to another account is refused with one plain line.
- Passkeys off in the build (`EXPO_PUBLIC_PASSKEYS` unset): the passkey rows are absent, and the "ways to sign in" count excludes them (R4, R6). Passkeys are beta in Supabase (F02-account) and tied to the relying party id.
- Offline: R4 to R10 and R16 need a connection and say so in one line; Sign out works offline and waits for the queue (NX-02-R4).
- Step-up proof fails for a wrong code 5 times: the existing 15-minute client pause applies (F02-U14).

## Offline behaviour

Account opens offline from the last known state (provider, address, sync value, plan). Every act that changes the server waits for a connection; none is queued, because a queued email change or removal could fire later without the person watching. The screen says "needs a connection" in plain words and the rest of the app keeps working.

## What we never do

Offer a password. Ask for a display name we do not use. Show or store an IP address, a place or a device model in an account list. Remove the last sign-in method. Make Sign out delete anything. Write, rewrite or summarise a person's words on this screen. Count how often someone opens Account.

## Copy needs (packages/content)

Existing, checked 9 Nov in `packages/content/src/features/auth.en.ts` (`authCopy.account`): `title`, `signedOutTitle`, `signedOutBody`, `signIn`, `signedInWith.*`, `syncTitle`, `syncLabel`, `sync.*`, `finishSetup`, `passkeysTitle`, `passkeysHelp`, `addPasskey`, `passkeyAdded`, `passkeyFallbackName`, `removePasskey`, `removePasskeyTitle`, `removePasskeyBody`, `devicesTitle`, `signOutOthers`, `signOutOthersHelp`, `signOutOthersDone`, `signOut`, `signOutTitle`, `signOutBody`, `signOutWaiting`, `staySignedIn`, `signOutEarly`, `cancel`; `appLockCopy.settingsHome.*`, `appLockCopy.exportReason`; `copy.settingsHome.*`.

New, names only (words by `content`, reviewed for the rules; no wording proposed here). Parent vocabulary: "sign-in link" never "magic link"; "device" or "phone", never "session" or "identity"; "book" and "letters", never "entries" or "takes".

| Key (under `authCopy.account` unless stated) | Use | Counsel-registered? |
|---|---|---|
| `signsAsTitle`, `signsAsValue` | R3 row | no |
| `methodsTitle`, `methodThisOne`, `methodAddedOn`, `addEmail`, `addApple`, `methodAdded`, `removeMethod`, `removeMethodTitle`, `removeMethodBody`, `lastMethod` | R4 to R6 | `lastMethod` and `removeMethodBody` make a promise about sign-in: flag for counsel (claims registry) |
| `emailTitle`, `changeEmail`, `changeEmailCheckNew`, `changeEmailDone` (no key for a taken address: taken and free share one screen, IAM-R09) | R7 | no |
| `devicesThisPhone`, `devicesOther`, `devicesLastUsed`, `devicesNeedConnection`, `signOutOthersConfirmTitle`, `signOutOthersConfirmBody` | R9, R10 | no |
| `lockAndLostTitle`, `lostPhoneRow`, `lostPhone.*` (page, 5 steps at most) | R12, R13 | yes: what we do and do not hold for a lost phone |
| `dataTitle`, `copyOfMyData`, `copyOfMyDataHelp` | R16 | yes: reply time and what the copy contains |
| `whatWeKeep.*` (page) | R18 | yes: every line is a privacy claim (LEGAL-REQ-044); registered text once approved |
| `stepUp.title`, `stepUp.body`, `stepUp.apple`, `stepUp.email`, `stepUp.cancelled` | R22 | no |
| `errors.tooManyAttempts` (existing family `authCopy.errors.*`; check for a close key before adding) | R25 | no |

## Analytics events (opt-in, content-free, names only)

Existing and in the catalog (`packages/analytics/src/catalog.ts`, seen 9 Nov): `signed_out`, `export_started`, `export_completed`, `export_failed`, `export_shared`, `account_deletion`, `settings_changed`. New, add to the catalog and `docs/analytics/TRACKING_PLAN.md` first, in the same PR: `account_method_added` and `account_method_removed` (property `method`: apple, email or passkey), `account_email_change` (property `step`: requested or confirmed), `account_signed_out_others` (no property), `account_step_up` (property `result`: done or cancelled). No email, no name, no counts of letters. Analytics are off in 1.0 (D-124 item 3), so none of this sends anything.

## Device rows

Existing: S1-27 (sign-in and Account screens), S1-35 (delete), S1-22 and S1-28 (two phones). Open PR patches scanned 9 Nov (#635, #665, #680, plus the ids the diff text showed): the highest ids in play are S1-112 (Before you begin), S1-131, S1-135 (reminders), S1-140 (tabs in the store build). I found no S1-1xx row for Account and cannot see every open branch, so the ids below are placeholders:

- `S1-1xx-A` Account order and rows at AX5 with VoiceOver (R2, R26).
- `S1-1xx-B` two phones: sign out other devices with 3 unsent letters on the second (R10).
- `S1-1xx-C` add email to an Apple account, then remove Apple; remove the last method refused (R5, R6).
- `S1-1xx-D` email change with a second phone signed in (R7, R8).
- `S1-1xx-E` sign out, then check the book, audio and lock are unchanged (R11).
- `S1-1xx-F` lost-phone drill (R13; shares NX-02-R10's drill).

## Dependencies

Theme 1 (a hosted project, or Auth behaviour cannot be proved). NX-02 (queue-safe sign-out, force sign-out). NX-04 (delete route and Apple revoke). NX-08 (the sheet R17 opens). NX-30 and NX-31 (below). NX-16 (support route and reply time for R16). #614 and #520 are merged; #635 and #676 are open and are read, not changed.

What this file needs from NX-30 (stated, not decided):

1. Account reachable from Settings in 1 tap (the header card, as #614 built it), and from any tab in 2 taps or fewer. Whether Account later becomes its own tab is NX-30's call; this file's content works in either place.
2. One name for the area in parent vocabulary: the word "Account" is already the title (`authCopy.account.title`).
3. A signed-out phone's entry to sign-in stays one route, owned by NX-31.
4. The Delete account row staying as the one named entry on Settings home unless D-5 says Account may carry a second.

What this file needs from NX-31: after sign-up the person lands knowing which method they used (R4 reads it), and the first Account visit needs no setup step.

## Engineering block

| Line | This theme |
|---|---|
| API contract (`packages/api`) | New typed contract for `list_my_sessions()` (rows: `id`, `createdAt`, `lastUsedAt`, `isCurrent`, `kind`: `phone` or `other`) in `packages/api/src/server/` with a contract test; additive, version 1. No new type for Auth calls (supabase-js). |
| Budget (`06-nfr.md`) | Account opens from the last known state in 1 s or less (proposed); Devices list within the light Edge or RPC p95 of 600 ms (proposed); confirmation mail within 2 minutes p95 (NX-02). Proposed numbers go into `06-nfr.md` in the PR of the first test that measures them. |
| Accessibility | R26. Account order is a reading order; destructive rows are word plus icon; 44 pt targets; Reduce Motion fade only. |
| Switch, off behaviour, noticed by | Switches: `capabilities.signIn` (whole area), `capabilities.accountDeletion` (R19), the passkey flag (rows only), the server-features switch. Off: rows absent, route redirects (R1). Rollback: all new rows are additive; the one server change (`list_my_sessions`) is dropped by a later migration, never edited. Noticed by: the weekly auth check (NX-02-R1) and Auth logs, counts only. |
| Data class and retention | Sign-in address: L3, never in a log or crash report. Session list rows: L3, read live from `auth.sessions`, copied nowhere. Account-act audit rows: profile id, act, time, result; L3; service role only; kept per `DELETION_AND_EXPORT_SPEC.md`. Signs-as text: L3 (a name the child hears), never in analytics or logs. No display name collected (D-3). |
| Schema and grants | See next section. |
| Analytics events | Above. |

## Schema and grants (IAM-R14, IAM-R15, IAM-R24; CLAUDE.md grants rule)

- New function `public.list_my_sessions()`: security definer, `set search_path = public, pg_catalog`, plpgsql so the body binds at call time (the precedent is in `20261023000000_backup_server.sql` near line 205), starts with `require_user()`, returns only the caller's rows from `auth.sessions` with the five columns of the API contract and never `ip`, `user_agent`, `user_id` or `refresh_token`. Revoked from `public` and `anon`; granted to `authenticated` only, in its own migration. Add the signature to the function list in `supabase/tests/grants.mjs`. A new migration file (the founder applies it through `deploy-db.yml`, `approve-migration` label by the founder only). Whether `auth.sessions` carries a column for last use and how the current session is matched (the `session_id` claim in the JWT) are UNVERIFIED; prove on the throwaway project.
- Access-matrix cells (IAM-R24), each with a deny: parent reads own sessions (allow); co-parent reads the parent's sessions (deny); contributor (deny); outsider (deny); anonymous (deny, `is_anonymous()`).
- No table. No view. Account-act records use the existing `ops_audit_write` from the one function that revokes sessions, and Auth's own log elsewhere.
- Profile edit: R3 needs none (it edits the existing book field). If D-3 is overruled and a display name is wanted, use a new function `update_my_profile(p_display_name text)` with `require_user()` and a length check rather than the open `profiles` update grant.
- Auth settings (not SQL): `enable_manual_linking` true only if D-2 is yes; any change goes through a PR on `supabase/config.toml` and the hosted dashboard value is checked by a preflight (as NX-02-R2 does for code length).
- Edge Function: none required for R5 to R8 (supabase-js calls with the user's own session). R16's later in-app version is a new function and needs a threat-model entry first (SEC-R01).

## Rollout

1. Build 12 slice (if the build is server-on): R1, R2, R3, R4 (read only), R9 (if `list_my_sessions` is ready, else absent), R10, R11, R12, R14, R15, R17, R19, R20, R21, R26 guards and copy. No Auth setting changes.
2. Next: R5, R6, R7, R8, R22, R24, R25 together, because adding, removing and changing are only safe with step-up and the record. Needs D-2 and D-4.
3. Later: R13 (after the runbook drill), R16 in-app, R18 (after counsel).
4. Off switches as in the engineering block; nothing here changes a store listing sentence until counsel passes R18.

## Owner lanes

`mobile`: screens, step-up, tests. `data-architect` with `data-steward`: `list_my_sessions`, matrix, grants. `security-architect` (this handle): the standard, Auth settings read, threat-model entries, review of any auth-named path. `content`: the keys; `legal` and the founder for counsel items. `support`: lost-phone minutes and the copy-of-data reply time. `ops`: hosted Auth settings preflight. `qa`: the tests below and the device rows. `design-systems`: VoiceOver order. `product`: ids.

## Gate

Founder: D-1 to D-6. Counsel: R13, R16, R18 and the registered strings. Security review (SEC-R13) on the migration and any `config.toml` change, and a counted second review on credentials code. A PR that changes a MUST in `05-identity-and-access.md` or `06-security-engineering.md` needs the founder's approval on the PR; this file proposes none (IAM-R12, IAM-R14 and SEC-R24 are met, not changed).

## Founder-only decisions

| # | Decision | Recommended default |
|---|---|---|
| D-1 | Which build 12 profile shows Account: `eas.json` `production` has server features off, #676 removes the Apple entitlement from it, and the brief says production servers | Settle it on the record before this file's rows are handed out. If build 12 is server-off, none of NX-32 ships in it and only the guards in R1 are built |
| D-2 | Turn on manual identity linking so a parent can add Apple to an email account (and the reverse) | Yes, after a throwaway-project proof that unlinking the last identity is refused and that a linked identity cannot take over another account; with a step-up and a notice email. If not proved, ship email change without add or remove |
| D-3 | Collect a display name | No. Use the sign-as name already in the book; leave `profiles.display_name` empty. Less data, one source of truth |
| D-4 | Sessions after an email change | End every other session, keep this one (R8) |
| D-5 | A second Delete account entry in Account, which needs the D-129 source-grep test to be amended | Yes, one extra entry, so it is where a parent looks (Settings home comment says it moves to Account); keep the route named from one constant and amend the test to allow exactly these 2 files |
| D-6 | A server idle limit on a stored session | 60 days unused ends the session, if the plan supports it; recording and reading never wait on it. The number is a proposal, not data |
| D-7 | Copy of my data in the first release | Help mail with a fixed subject; in-app later (R16) |

## Trace and tests

Id convention: `_CONVENTIONS.md`. A test title starts with the bracketed id. Paths marked "proposed" do not exist yet; the PR that adds the test names the real path. "Fails on old code" is stated in the check table.

| Id | Refines | Test (layer, file, title) | Device or ops row |
|---|---|---|---|
| NX-32-R1 | F02 account switch; D-100 | mobile unit (proposed `apps/mobile/test/account-capability.test.ts`); `[NX-32-R1] every Account row is absent when sign-in is off` | none |
| NX-32-R2 | A-REQ-019 | mobile unit on a pure view function (proposed `apps/mobile/test/account-sections.test.ts`); `[NX-32-R2] Account sections come in the agreed order` | S1-1xx-A |
| NX-32-R3 | #614 | mobile unit (proposed `apps/mobile/test/account-signs-as.test.ts`); `[NX-32-R3] Account reads the book's sign-as name and stores no copy` | none |
| NX-32-R4 | IAM-R05 | mobile unit (proposed `apps/mobile/test/account-methods.test.ts`); `[NX-32-R4] methods list matches identities plus passkeys` | S1-1xx-C |
| NX-32-R5 | IAM-R05 | device plus throwaway project; `[NX-32-R5] Apple account adds email only after the code` | S1-1xx-C |
| NX-32-R6 | IAM-R06 | db or Auth drill (proposed `scripts/ops/hosted-check.mjs`) and unit (proposed `apps/mobile/test/account-methods.test.ts`); `[NX-32-R6] the last sign-in method cannot be removed` | S1-1xx-C |
| NX-32-R7 | IAM-R09 | throwaway-project check (proposed `scripts/ops/hosted-check.mjs`); `[NX-32-R7] taken and free addresses look the same` | S1-1xx-D |
| NX-32-R8 | SEC-R24 | device plus mail check; `[NX-32-R8] email change ends the other sessions and notifies the old address` | S1-1xx-D |
| NX-32-R9 | IAM-R14, IAM-R24 | db (proposed `supabase/tests/list_my_sessions.test.mjs`); `[NX-32-R9] list_my_sessions returns only the caller's rows and no address` | none |
| NX-32-R10 | IAM-R12 | mobile unit (proposed `apps/mobile/test/sign-out-others.test.ts`) and device; `[NX-32-R10] signed-out phone keeps its queue` | S1-1xx-B |
| NX-32-R11 | NX-02-R4 | mobile unit (proposed `apps/mobile/test/sign-out-keeps-local.test.ts`); `[NX-32-R11] sign out leaves book, audio and lock unchanged` | S1-1xx-E |
| NX-32-R12 | CDesO-1 | mobile unit (proposed `apps/mobile/test/account-lock-row.test.ts`); `[NX-32-R12] Account links App lock and claims no recovery` | none |
| NX-32-R13 | NX-02-R10 | drill; Test: none until the target is set | S1-1xx-F |
| NX-32-R14 | theme 8 | mobile unit (proposed `apps/mobile/test/account-plan-row.test.ts`); `[NX-32-R14] Account Plan row reads the same plan and shows no price` | none |
| NX-32-R15 | PRIV-R09 | mobile unit (proposed `apps/mobile/test/account-export-row.test.ts`); `[NX-32-R15] export opens with sync off and signed out` | S1-21 |
| NX-32-R16 | DATA-REQ-054 | Test: none, decision D-7; later function test `supabase/functions/<proposed>/handler.test.ts` | none |
| NX-32-R17 | NX-08-R1, -R11 | mobile unit (proposed `apps/mobile/test/account-sync-row.test.ts`); `[NX-32-R17] Account and Privacy sync rows never disagree` | S1-27 |
| NX-32-R18 | LEGAL-REQ-044 | content test (proposed `packages/content/test/what-we-keep.test.ts`); `[NX-32-R18] every line maps to a privacy label row and back` | none |
| NX-32-R19 | D-129; NX-04 | amend `apps/mobile/test/account-deletion-switch.test.ts` (exists); `[NX-32-R19] Account may name the delete route and Settings home too, and no other file` | S1-35 |
| NX-32-R20 | D-126 | mobile unit (proposed `apps/mobile/test/account-family-hidden.test.ts`); `[NX-32-R20] no family control reaches Account while co-parent is off` | S1-140 |
| NX-32-R21 | LEGAL-REQ-014 | mobile unit (proposed `apps/mobile/test/account-help-row.test.ts`); `[NX-32-R21] Help mail carries the fixed subject and no body` | none |
| NX-32-R22 | SEC-R24 | mobile unit (proposed `apps/mobile/test/step-up.test.ts`) and function test; `[NX-32-R22] a sensitive act older than 10 minutes asks for proof first` | S1-1xx-C, S1-1xx-D |
| NX-32-R23 | IAM-R11 | mobile unit (proposed `apps/mobile/test/idle-open.test.ts`); `[NX-32-R23] recording and reading never wait on a session` | none |
| NX-32-R24 | SEC-R24, PRIV-R10 | canary test (proposed `supabase/tests/account-act-record.test.mjs`); `[NX-32-R24] account acts leave a record with 0 of 4 canaries` | none |
| NX-32-R25 | SEC-R24 | function or db test (proposed `supabase/tests/account-rate.test.mjs`); `[NX-32-R25] the sixth account act in ten minutes is refused` | none |
| NX-32-R26 | S1-27 | device row; Test: none, device | S1-1xx-A |

Trace: NX-32-R1..R26 -> F02-REQ-001, -007, -023, A-REQ-019, F02-U33, IAM-R05, -R06, -R09, -R10, -R11, -R12, -R14, -R24, SEC-R24, LEGAL-REQ-014, -044, DATA-REQ-054, PRIV-R09, PRIV-R10, D-129.

Rows that cannot fail on old code in the sense of a test (R13, R16, R26) are HYPOTHESIS and are not handed to an engineer as build rows. R1, R15, R21 are guards: they pass today and are written so a later change cannot break them.

## Not verified

- Which build profile shows Account (D-1).
- Whether the hosted Auth project exists, its settings (`jwt_expiry`, manual linking, double confirm, notification templates), and its audit-log retention.
- Whether Auth refuses to unlink the last identity, how it treats an Apple relay address on change, and how a session is matched to the JWT.
- Whether `auth.sessions` offers a last-used column and a device kind.
- Whether `profiles` update is limited to columns, and whether `profiles.signs_as` and the book's `signsAs` are the same field.
- Whether the Account Sync row and the Privacy sync row ever disagree on a phone.
- Whether a Supabase plan supports an inactivity limit.
- The current content of the privacy label source for the R18 mapping.
- No code was run; every "built" line is from reading the file.
- Counsel's position on every registered string; this file answers none.
