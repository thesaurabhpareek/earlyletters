# 08. New-device sign-in email: the privacy read (privacy, 21 Nov 2026)

Status: DRAFT for `security-architect`, `data-architect`, `sync` and counsel. Docs only. Nothing here is built, applied or decided for the founder. This is the "privacy read of the device table comes first" that E83 (CL-158), NS-08-R21 and FR-SEC-36 name (`docs/product/prd/18-errata-after-lock.md` E83; `docs/product/prd/08-keeping-and-trust.md:136`). It decides class, label line and retention as PROPOSED defaults; counsel and the founder keep what is theirs (section 12).

Tags: [V] read in this session at `origin/develop`; [E] engineering inference; [U] an outside-world fact (Supabase, Resend, Apple, law) not read from a source here. Levels are L1 to L4 as in `docs/legal/DATA_CLASSIFICATION.md` (DC).

## 1. The short version

1. The email may say three things about the sign-in: a device class word, a time, and the in-app path. Nothing else about the device or the place.
2. The device record is a keyed hash of an app-made random id, a class word, and two dates. L3 as a row (the hash links to an account). Deleted with the account. A row not seen for 90 days is deleted.
3. Supabase Auth already holds `auth.sessions` and a refresh-token table [V: `20261023000000_backup_server.sql:205-218` reads `auth.sessions` by id, user and `not_after`; DC:546 lists `auth.sessions` and `auth.refresh_tokens` as L4]. Their columns for IP and user agent [U] stay where they are. We read the session id and nothing else from them, and copy neither.
4. The "Not you?" token is random, hashed at rest, single-use, short-lived, bound to one session, carried in the URL fragment, and its use is audited.
5. Cap: the E81 daily ceiling of 20 must not silently drop a real warning. Recommendation in section 9: the cap never drops A1; it folds, and the in-app line is a second path, not the only one.

## 2. What exists today (read, not assumed)

| Thing | State | Evidence |
|---|---|---|
| Sign-in method | email code or link, Sign in with Apple, Sign in with Google; 15 minute access token; refresh rotation on | `supabase/config.toml:30-43, 63-75` [V] |
| Auth sessions and refresh tokens | held by Supabase Auth in `auth.*`; L4 in DC; the app has no table of devices | DC:546; `20261023000000_backup_server.sql:205-218` [V] |
| Any auth hook in the repo config | none in `config.toml`; the only hook is `public.hook_before_user_created`, a dashboard step | `config.toml` has no `hook` line [V]; `02i` F28 [V] |
| `backup_devices` | one row per install for backup keys; random `device_id` (L3), public key (L3), `platform`, `enrolled_at`, `last_seen_at`, `revoked_*`; owner can read; **not** a sign-in record and only exists when backup is on | `20261023000000_backup_server.sql:251-260, 422-432`; DC:572 [V] |
| `restore_requests.stop_token_hash` | the only token pattern in the repo: SHA-256 stored (32 bytes, unique), 7-day expiry, `stop_used_at`, one use; `backup_svc_stop` returns "stopped: false" for unknown, used or expired and reveals nothing | `20261023000000_backup_server.sql:323-326, 1621-1642` [V] |
| Stop endpoint that ends sessions | the function returns the profile id so "the endpoint signs out every session"; that endpoint (S01) is not in `supabase/functions` | `ls supabase/functions`: analytics-forget, apple-token, config, content, escrow, invite-redeem, purge-worker, subscription-status [V] |
| Sign out other devices (parent control) | exists: `signOut({ scope: 'others' })`; sends no email | `07-communication-2` row "A parent-facing control" [V, from `settings/account.tsx:181-186`] |
| New-device email template | words exist (PR #1077, merged at `87221425`); no sender, no trigger; link `{notYouUrl}` unfilled; `/not-you` page unbuilt | `packages/content/src/emails/auth.en.ts` (new-device-sign-in entry); `07-communication-2` [V] |
| Device-seen table | none. Designed only: `02i` S10 (name PROPOSED) and alert-cap state S11. The store-label doc calls the same idea `account_sessions_seen`; one name must win (open question Q1) | `02i:37-38`; `docs/legal/app-store-privacy-labels.md:60, 82` [V] |
| Resend keys | one per function, sending-only; Auth SMTP is a separate key | `04-secrets-keys-and-endpoints.md:42, 50, 70` [V] |

Conflict to settle before the build (section 3): F02-REQ-017 says detect on "a new Auth session ... whatever the client sends or omits", including a modified client that never registers a device (`docs/prd/v2/features/F02-account.md:182, 232` [V]). E83 and the A1 row say "never from the client" and "device word from the app, not the network" (`07-communication-2` A1 [V]). These agree only if the server detects the session and the app supplies, at best, a class word and a random id.

## 3. What fires the email (privacy view of detection)

Default (reversible): the **server detects every new Auth session** and queues one row; the app's help is optional.
- A modified client that sends no device id still gets a session, so still gets an email with the class word "a new device". That closes the F02 hole without trusting the client. [E]
- The device id is app-made, random, per install, stored in the iOS Keychain or app storage; it is never IDFV, never the advertising id, never a hardware id (the store-label doc already says so, `app-store-privacy-labels.md:60` [V]).
- How the server sees a new session (a Postgres trigger on `auth.sessions`, a Supabase custom access token hook, or a call after sign-in) is a hosted-platform fact: [U] whether a trigger on `auth.sessions` is permitted on the hosted project, and whether the hook event carries the session id. Ask `security-architect` (Q2). Privacy needs only: the detector writes a row with the account id and a session id, and reads no IP and no user agent.
- A refresh of an existing session is not a new session and sends nothing. [E] Test `[NS-08-R21]` must prove it.

## 4. The device record: field by field

Proposed table (name per Q1): one row per account and device, service role only, no grant to `anon` or `authenticated`, RLS on. The PR that adds it ships a comment on every column (`classification.test.mjs`) and its grants in `supabase/tests/grants.mjs`.

| Field | May hold | Level | Why | Retention |
|---|---|---|---|---|
| `profile_id` | the account id, FK to `profiles` on delete cascade | L3 | person id (DC 1.1 rule 4) | with the account |
| `device_hash` | 16 bytes: HMAC-SHA-256 of the app-made random device id, truncated; key is a database or function secret, named by purpose "device hash", holder founder, never in repo or client (`04:354`) | L3 | derived from an identifier tied to a person; DC rule 2 (derived inherits) | with the row |
| `class` | closed enum: `apple` ("an iPhone or iPad") or `other` ("a new device") | L2 | a two-value enum cannot identify anyone | with the row |
| `first_seen_at` | the first sign-in from this hash, to the minute | L2 on its own; the row is L3 | system timestamp | with the row |
| `last_seen_day` | a date, written at most once per day, only when a sign-in happens | L2 | needed only for the 90-day roll-off; a per-sign-in timestamp is a login log we do not need | with the row |
| `notified_at` | when the email was queued, or null for the first device | L2 | idempotency and the "never for the first device" rule | with the row |

Row level: **L3** (highest wins, DC 1.1 rule 1). This is the starting proposal in `02i` S10 and I agree with it. Not L4: no content, no secret, no child data. The hash is not a secret key, but anyone holding the hash and the HMAC key could test a guess of the id; so the key lives apart from the table (Q5).

Not stored, ever, in this table or anywhere we control for this feature:
- IP address, or a prefix of it, or a "city", "country" or "region" derived from it. (DC:547: the Auth audit log may hold IPs; we do not copy them. The compliance gate at sign-up reads the IP in memory and stores none, `02i` F28 [V].)
- Precise location or any coordinates. Location permission is never asked for this feature.
- User agent string, OS version, app build, model identifier (for example "iPhone15,2"), screen size, locale, time zone of the device.
- The device's own name. On iOS the name a person gave their phone often holds a first name ("Asha's iPhone"). It is L3 and often a person's name; it never goes in the table, the email, a log or the page. [U] that iOS exposes it by an API; the rule holds either way.
- The session id in this table. The session id goes only in the token row (section 6), where it dies with the token.
- Any token, code, refresh token or JWT (L4, DC 1.1 rule 8).
- The email address (it is already on the account; the sender reads it in memory when it sends and does not store it).

Why a hash and not the raw id: a raw per-install id is a stable cross-account fingerprint if it ever leaks; a keyed hash per account is meaningless in another account and in a leaked table without the key. [E] Same reasoning as S8 (`02i`).

## 5. What the email may say

Rules (07.2 rules 1 to 5, `07-communication-2`; E83; PR #1077 words):
- **Subject:** fixed content key, no variable (rule 1). The merged subject is "A new sign-in to your account" [V].
- **Body may carry:** the device class word, the event time in words with the zone short name, the in-app path (Me, Account, Sign out other devices), the "Not you?" link, and the line to secure the email account. That is all.
- **Device word:** "an iPhone or iPad" or "a new device". Never a model, an OS, a browser, an app version, or a name. Class comes from the app or is `other`; it is never read from the network.
- **Time:** the sign-in time in the account time zone, else the last synced device zone, else US Pacific (rule 2). The time is when our server saw the session, not a device clock. Format "{date} at {time} {zone}".
- **Never says:** IP, city, country, map, "near", user agent, the other devices' names, how many devices there are, the sign-in method's token, a link that signs in, a child's name or book name, "your book is safe" or "you were hacked" (CDesO line in `07-communication-2` A2 [V]), any count of attempts.
- **No push, no action by opening.** One link only: `{notYouUrl}`; opening it changes nothing (E83; Review A on #1077).
- **The held line** "that device will be signed out" is added by the sender only once the one-session lever and the page both exist (E78; `new-device.en.ts` `heldEmailLine` [V from #1077 reviews]). A test must fail if the sender adds it before then.
- Words are PROPOSED content keys; this file proposes none.

Is "device class word and time only" right? Yes, with the in-app path and the link. A place would invite a wrong panic and is a datum we do not hold. A model name adds identification for no safety gain: a parent knows how many iPhones they own.

## 6. The "Not you?" path: token and page rules

Reviewer notes from #1077 (Review A, `privacy` and `compliance-engineer`; Review B) turned into requirements. `security-architect` owns the final shape; privacy requires at least:

| Rule | Requirement | Test |
|---|---|---|
| Random | 32 bytes from the platform CSPRNG, base64url; never derived from the session id, account id, time or email | statistical test not needed; a test that two tokens for one session differ |
| Hashed at rest | store SHA-256 (32 bytes, unique) like `restore_requests.stop_token_hash` [V]; the plain token exists only in the sender's memory and in the email; zero it after hashing as `escrow` does (`restore.test.ts:135` [V]) | the row holds no plaintext; a read of the table never returns a usable token |
| Single use | one row, `used_at` set in the same statement that ends the session; a second press changes nothing and says "already done" (`ALREADY` state, PR #1077 page copy) | press twice, one sign-out |
| One session | the token row names exactly one session id; the lever ends that session only, not every session, not the book, not the account; letters on the phone stay (E83) | account with 3 sessions: after the press, 2 live |
| Short-lived | default 48 hours from queueing (Q4); `expires_at` is checked on the server on the press; an expired token reveals nothing about the account | expired token: no change, same answer as unknown |
| In the fragment | link is `https://.../not-you#token=...`; a fragment is not sent to a server on a GET, so a mail scanner or prefetch cannot reveal or use it (Review A note 1). The page script reads it and sends it **in a POST body**, never in a query string and never in a URL a server logs (DC 2: no L3 or L4 in URLs; tokens only in fragments) | e2e: GET the page with the fragment, assert no request carried the token and no row changed |
| Acts on a button press only | the confirm page loads, shows the device word and time, and does nothing until the parent presses the one primary button. A script-running scanner that follows links must not press it (F02-REQ-017 [V]) | scanner test with scripts on: no session ends |
| Not a credential | the token cannot sign in, cannot read the book, cannot be exchanged for a session. It can only end the one session it names (Review A note 1) | token presented as a bearer: 401 |
| Audited, content-free | on the press, one row: kind `new_device_signed_out`, outcome, minute, request id; written only on the press, never on load (Review A note 3). Store: `security_events` (S6, design only) or, until it exists, the token row's `used_at` and `outcome`. No IP, no user agent, no address | row written once; no row on load |
| No click tracking, no redirect | the link is not rewritten through Resend click tracking or any redirector (Review A note 2) [U] how Resend click tracking is switched off for a domain or a send | the rendered link equals the generated link |
| Hold until built | the sender does not send until `/not-you` exists and has been read (`links.ts` `when` line, Review A note 4 [V]) | a sender test that fails while the route is "needed" |

What the page must not show or log: the IP of the person who presses, their user agent, the account address, the other sessions, the device hash. The page and its function log kind, request id and outcome only (LR-11 in `07-communication-3`).

Open: [U] Supabase's supported way for a service function to end one session by id (the admin sign-out needs the person's own JWT, `03:198` [V]; the stop design deletes `auth.sessions` rows, `escrow/test/fakes.ts:40` [V]). Whether a direct delete is supported and whether it also kills the refresh tokens is `security-architect`'s to prove in a test against the real Auth (Q3). Until proved, the page must not say "signed out".

## 7. Retention of anything this feature creates

| Item | Level | Kept | Why | Deleted by |
|---|---|---|---|---|
| Device row | L3 row | until `last_seen_day` is 90 days old, or the account is deleted, whichever first | a device not used for 90 days is a new device again, matching the 90-day rule of `backup_devices.last_seen_at` [V, DC:572] | a sweep (needs an owner: `data-architect` and `ops`) and `on delete cascade` from `profiles` |
| Token row | L3 (hash) | until `expires_at` plus 7 days; then deleted | long enough to answer "already done" and to audit; short enough to be no history | sweep; cascade |
| Alert-cap counters (S11) | L2 | the hour count 2 hours; the day count 2 days; no content | counters, no address, no id of the device | sweep; cascade |
| Audit row of the press | L2 | per `security_events` (12 months, D-021; counsel confirms, `02i` S6 [V]) | proof the act was a person's press | its own retention |
| Queued email job | L3 | until sent or dropped; dropped if the account is deleted (T-27) | no mail after deletion | the sender |
| Sent email at Resend | L3 | 30 days at the vendor [U: from `06:94`, "vendor roll-off", not read at Resend] | what Resend keeps is theirs | vendor |
| Function logs | L2 | per platform | kind, request id, outcome only | platform |

Account deletion: the cascade removes the device and token rows with the profile. DELETION_AND_EXPORT_SPEC rows (`docs/legal/**`, founder-reserved, not edited here) must list the new table; flagged to `legal` (section 12). Export: the device row is not content; whether a parent's export lists "devices seen" is Q6 (default: not listed in the book export; DSAR route per counsel).

## 8. What an email provider (Resend) may receive

Under DC 2 (L3 under a DPA, listed in subprocessors) and `06:159` ("address, our email text"; never L4 in subject or body):
- May receive: the account address (To); the fixed subject; the body with the class word, time in words and the link with its fragment; the `Idempotency-Key` header (`a1:<account>:<device hash>` is **not** acceptable as a key because it holds a hash and an account id in a vendor header; use a random per-event id, or an HMAC of the key, Q7); tags limited to the kind name.
- Must not receive: IP, user agent, location, the device hash, the account id, the session id, the child's name, any L4, a sign-in token or code. The "Not you?" token is in the body and so at Resend for the vendor roll-off [U 30 days]; this is the reason it is single-use and short-lived. [E]
- The link host is our own domain; the link is not click-tracked (section 6).
- Resend webhooks (delivery events) [U whether any are enabled]: if used, they may carry the recipient address; the receiver logs the outcome only.
- The keys: a sending-only key held by this one function, separate from the Auth SMTP key and from the other function keys (`04:42, 50, 70` [V]); the service key stays in the function's secrets.
- Sender hardening (07.2 rule 7, T-25): a client token calling the function gets 401 and writes nothing.

## 9. Rate limits and the E81 cap

What E81 says [V: `18-errata-after-lock.md:324-330`, `07-communication-2` rule 6]: first 5 alert emails per account per hour go one by one; the rest of that hour fold into one summary sent within minutes (the summary counts as one); a ceiling of 20 alert emails per account per day; never applies to sign-in codes; an alert stopped by the cap shows as an in-app line on next open.

The problem: if the cap stops a real warning at the 21st, "an in-app line on next open" is read only by someone who opens the app. A thief signs in on a 21st device and the owner is told only when they next open the book. For a book whose only credential is the inbox, the 21st alert is as real as the first.

Recommendation (default, reversible, engineering's number stays):
1. **Per-device idempotency first.** One email per device hash ever (A1 row: "at most 1 per device ever" [V]). A refresh or a second sign-in on the same hash sends nothing. This is the real limit and it makes 20 a day almost unreachable by a person.
2. **Cap by kind of fold, not by drop.** After 5 in an hour: fold into one summary within minutes (E81). After 20 in a day: **send one final summary** ("There have been many new sign-ins today. Look at your devices in the app. Not you? Secure your email account."), once per day, then stop. A summary does not count against the 20. No fourth state where nothing is sent.
3. **The in-app line is the second path, not the only one.** The line appears on next open for every alert the cap folded or stopped. If a parent never opens the app, the one daily summary is still in their inbox.
4. **Signal to us, not to the parent.** The cap hit writes a `security_events` kind "ceiling hit on alert mail" (S6 minimum kinds [V]) so `ops` sees an attack in progress. Without S6 built, a counter row suffices.
5. **Do not raise the number, do not tell the parent about it** (E81: a safety ceiling, not a promise).
6. **Sign-in codes are never capped** (E81), so a parent is never locked out by an attacker triggering alerts. Tested.
This is a change of E81's text ("stops at 20"). Proposed here, not applied: product decides (Q8).

Other limits for the "Not you?" page: a per-IP and per-token attempt limit on the POST (the platform's limits [U]) with a flat answer for unknown, used and expired tokens (no oracle); the IP is used in memory for the limit and stored nowhere.

## 10. How it is tested

Named `[NS-08-R21 ...]`, each with one mutant (BUILD-BRIEF). Fictional family "Asha" only. Privacy asks for at least:

| Test | Proves |
|---|---|
| first device sends nothing; second unseen device sends once; the same device again sends nothing; a refreshed session sends nothing | T-26 and the A1 rule |
| a session from a client that supplies no device id still queues one email with the "a new device" word | F02-REQ-017 [V] without trusting the client |
| the row has exactly the columns of section 4; `classification.test.mjs` passes; no column holds an IP, a user agent or a name (a column-name and a value-shape check on the fixture) | section 4 |
| the rendered email for the Asha fixture has no IP, place, user agent, token other than the one fragment link, no child name; the subject has no placeholder (T-24) | section 5 |
| the held line is absent until the lever and page exist | E78 |
| log canary: run the sender and the page with a canary device id, address and token; none appears in any log line (LR-11, T-29) | section 7 |
| the Resend request body and headers (fake) hold no device hash, account id, session id, IP or user agent; the idempotency key is not a hash of the device in clear | section 8 |
| token: hashed at rest, single use, one session of three, expired is flat, GET and scanner with scripts change nothing, POST on the press ends exactly one session, audit row on press only | section 6 |
| rate: 6th in an hour folds; 21st in a day gets the one daily summary; a sign-in code is never capped (T-23) | section 9 |
| client token to the function URL: 401, nothing written (T-25) | 07.2 rule 7 |
| account deleted: device and token rows gone, queued mail dropped (T-27) | section 7 |
| privacy canary: `privacy` runs the device table and sender fixture against DC levels in review before the first outside family | NS-08-R21 gate |

## 11. Labels and disclosures that must match the code (standing duty 3)

- App Store label: `app-store-privacy-labels.md:60, 82` says "New-device notice on: Device ID Yes (`account_sessions_seen`)". My reading: declare it **when this ships** (Identifiers, Device ID, linked, not tracking, App Functionality), the cautious reading, as that file already recommends. Counsel confirms (CQ8, Q54). [U] Apple's definition of "Device ID" and whether a keyed per-account hash counts; I do not rely on a reading of it.
- This is a new store: the label row changes on the day the feature turns on, not on the day the code lands behind a switch. Tie the label to a capability flag as the doc's section for builds does.
- Privacy policy: `docs/legal/privacy-policy.md` must say we keep a coded record of the devices that sign in so we can warn you, and for how long (90 days not seen; deleted with the account). Wording is `legal`'s; `docs/legal/**` is founder-reserved (CR-73) and is not edited here.
- In-app: none new until the screen of Section 6 and the "Sign out other devices" path (confirm it exists on `develop`: Review B note 1 on #1077 could not find it by search; `07-communication-2` cites `settings/account.tsx:181-186` [V]; mobile to confirm before the sender goes live).

## 12. Open questions, each with my default (none is a decision of the founder or counsel)

| Q | Question | Default I will assume | Who answers |
|---|---|---|---|
| Q1 | One name for the table: `02i` S10 (PROPOSED), `account_sessions_seen` (label doc), `backup_devices` is a different thing | `account_sessions_seen`; not merged with `backup_devices` (different purpose, different lifetime, backup may be off) | `data-architect` |
| Q2 | How the server sees a new session on hosted Supabase: trigger on `auth.sessions` [U], custom access token hook [U], or a post-sign-in call | server-side detection of every new session (section 3); the choice is a hosted-platform check | `security-architect` with `data-architect` |
| Q3 | How the page ends one session by id, and does it kill the refresh token | prove in a test against real Auth; until proved the page does not say "signed out" | `security-architect` |
| Q4 | Token life | 48 hours (the stop link for backup is 7 days because a restore holds 24 hours; a plain sign-out warning needs less) | `security-architect` |
| Q5 | Where the HMAC key lives (Vault [U], or a no-grant config row read only by definer functions as S8) and who rotates it; rotation makes every device "new" once, so it is a planned event | same place as S8 | `data-architect`, founder holds the secret |
| Q6 | Does the account export list "devices seen"? | no in the book export; handled as a DSAR if asked | counsel, then `privacy` |
| Q7 | Resend `Idempotency-Key` form | a random per-event id stored in the job row; never the device hash | `sync` |
| Q8 | The E81 daily cap wording change in section 9 | one daily summary after 20, never silent | product (E81 owner) |
| Q9 | Device-hash label: does it need the Device ID declaration | declare it when on | counsel (CQ8), then `legal` for the label doc |
| Q10 | Is a new-device email a legal duty, or a courtesy | courtesy; no law relied on | counsel (04 Q4) |
| Q11 | Retention numbers: 90 days not seen; token plus 7 days | as written in section 7 | counsel (retention is counsel's), `privacy` proposes |
| Q12 | Time zone of the account: where it is held | existing rule: account zone, else last synced device zone, else US Pacific | `sync` |
| Q13 | Does the audit row go to `security_events` (S6) or to the token row until S6 exists | the token row | `security-architect` |

## 13. Acceptance for the sender PR (for `sync`, the builder)

The PR does not merge, and the founder is not asked to turn the sender on, until each line holds and `security-architect`'s read and this file's section 4 to 9 are on record:

1. The device table has exactly the columns in section 4 with a level comment on each, RLS on, no grant to `anon` or `authenticated`, its grants in the same migration and in `supabase/tests/grants.mjs`, the key held outside the table, cascade from `profiles`, and a sweep for 90-day and token roll-off with a named owner.
2. No IP, user agent, device name, model, OS, location or session id is read into, or written to, any table, log, queue row or Resend request of this feature. A canary test proves it.
3. Detection is server-side per new session; a session with no device id still queues an email; first device and refresh send nothing; the same device sends once.
4. The email uses the PR #1077 words unchanged; subject fixed; body has the class word, time in words, in-app path, the link; the held line is absent until the lever and page exist; no click tracking; the link is the generated one.
5. `{notYouUrl}` is an https link on our domain with a 32-byte random token in the fragment; only the SHA-256 is stored; the plain token is zeroed after sending.
6. The page and lever meet every row of section 6, including: acts only on a button press, one session, single use, expired and unknown answer the same, audit row on press only, and the claim "signed out" is proved against real Auth.
7. The sender hardening of 07.2 rule 7: service role inside one function with its own login role, a client token gets 401, a separate Resend key, a random `Idempotency-Key`.
8. The cap of section 9 is built and tested: 5 an hour, fold, the daily summary after 20, in-app line as the second path, sign-in codes never capped.
9. Delete the account: rows gone, queued mail dropped. Test `[NS-08-R21 ...]` with one mutant each for: first-device rule, the held line, the single-use rule, and the PII-in-Resend-request rule.
10. `privacy` is on the PR as a reviewer, and the store label row for Device ID and the policy line are flagged to `legal` and the founder before the capability flag is turned on. No `docs/legal/**` edit in the sender PR.

## 14. What I did not verify

- Any hosted Supabase behaviour (triggers on `auth.sessions`, hook payload, admin sign-out by id, columns of `auth.sessions` such as IP and user agent), Resend click tracking, Resend retention, webhooks, and Apple's reading of "Device ID" [U].
- Whether the "Sign out other devices" screen is on `develop` beyond the cited lines (Q about #1077 Review B).
- The `security_events` table: design only (`02i` S6).
- No code was run; this is a reading of `origin/develop` at the time of writing.
