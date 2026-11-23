# Sign-up geo block: alignment of the hook, the app and the phone signal (BL-1907)

Owner: security architect. Status: DRAFT alignment note. It reads `docs/regulatory/signup-geo-checks.md` (the spec, owned by regulatory-affairs) and does not change it, the card, any decision or any migration. No migration is applied or edited here; the hook stays off. Not legal advice; every legal reading is for counsel.

Marks. [V] read in this session at the source named. [UNVERIFIED] not read, or not run, in this session. Hosts that did not answer from this session: ofac.treasury.gov, www.bis.gov, db-ip.com (no connection). Hosts that did: raw.githubusercontent.com (Supabase Auth and Supabase docs source).

Source version. Every cite to supabase/auth below is to branch `master` on raw.githubusercontent.com. That is not the hosted version we run: the repo records no Auth version (`supabase/config.toml` has none), and the hosted version was not read. Each cite group says so. Before the hook is enabled, read the running Auth version from the project's dashboard or its Auth health endpoint, re-read the same files at that tag, and replace each `master` cite with the tag. Until then each cite reads as [V] for master only, [UNVERIFIED] for what runs.

## 1. The error code mismatch, settled from the Auth source

What the app expects. `apps/mobile/src/lib/auth/errors.logic.ts:53` maps `errorCode(e) === 'region_refused'` to the `region_refused` kind. `apps/mobile/test/auth-region-refused.test.ts:23` and `:30` build a fake error with `code: 'region_refused'` and pin it as [U].

What the hook returns. `supabase/migrations/20261121030000_compliance_gates.sql:270` returns `{"error": {"http_code": 403, "message": "signup_unavailable_region"}}`. Nothing in it can carry a code.

What the client really receives [V] for master, not hosted (repository supabase/auth, ref master, files read raw from raw.githubusercontent.com in this session; the hosted version is not read, see Source version above; paths below are in that repository):
- `internal/hooks/hookserrors/hookserrors.go`: the response is read for only two fields, `error.http_code` and `error.message`. A hook cannot set an error code. An error object with an empty message is not an error at all.
- The same file builds an `HTTPError` with status 403 and that message and no `ErrorCode`.
- `internal/api/errors.go`, `handleResponseErrorHTTP`: with no `ErrorCode` the body is sent with the code `unknown` (status below 500) and the message as given.
- `@supabase/auth-js` (`node_modules/@supabase/auth-js/src/lib/fetch.ts:100-145`): throws `AuthApiError(message, 403, 'unknown')`.
- So the app receives `status 403`, `code 'unknown'`, `message 'signup_unavailable_region'`. `region_refused` never arrives. Today a refused person falls through `baseKind` to the ordinary unknown error, not the refusal screen. This closes item 2 of section 1 of the spec for the Postgres-function hook (the spec held it as [UNVERIFIED]); the two-field read is [V], a running local stack still has to confirm the wire shape (section 8, test 5).
- Rollback, read again [V] for master, not hosted (supabase/auth master: `internal/api/hooks.go`, `internal/api/signup.go:180-186`, `internal/hooks/hookspgfunc/hookspgfunc.go`, `internal/hooks/v0hooks/manager.go`; the hosted version is not read). `checkTX` (`hooks.go:116-121`) returns "unable to trigger hooks during transaction" if `conn.TX != nil`, so the before-user-created hook is not run inside an Auth transaction; `signup.go:180-181` says "always call this outside of a database transaction as this method" and "can be computationally hard and block due to password hashing". `triggerBeforeUserCreated` passes `db` to `InvokeHook` (`hooks.go:49`), a connection whose `TX` is nil, and `runPostgresHook` has `if tx != nil { invokeHookFunc(tx) } else { db.Transaction(invokeHookFunc) }` (`hookspgfunc.go:108-114`). The earlier wording of this note, that the hook runs in its own `db.Transaction`, is withdrawn: the connection is not a nil pointer, so the `db.Transaction` branch is most likely not taken. The hook runs outside any Auth transaction, and `hookserrors.Check` turns the returned JSON into the 403 only afterwards (`hookspgfunc.go:116`). So the `block` count bumped by the hook most likely survives the refusal, because nothing of Auth's wraps it to roll back.
  - Consequence for the timeout. `invokeHookFunc` sends `set local statement_timeout TO '<ms>'` (`hookspgfunc.go:90`, with the comment "We rely on Postgres timeouts to ensure the function doesn't overrun"). `set local` lasts to the end of a transaction; with no transaction open it has no lasting effect. So Auth's `statement_timeout` for the hook may not apply on this path. [UNVERIFIED]: this needs the local-stack run (section 8, test 6), which reads `current_setting('statement_timeout')` inside the hook. Until then the bound on a slow hook is our own `lock_timeout` (section 3) and the hook's fail-open handler, not Auth's timeout.
  - The migration header (`supabase/migrations/20261121030000_compliance_gates.sql:34-36`) says: "Known gap, to verify on a local stack: if GoTrue rolls back its transaction when the hook returns an error, the 'block' count is lost with it". That header is superseded by this note, and the migration is applied, so it is not edited. Corrected reading: on master the hook runs outside any Auth transaction, so there is no Auth transaction to roll back and the count most likely survives; the claim stays unproven until test 6 runs. The header's "Known gap" is therefore not a known gap, and nobody should plan a workaround from it.
  - This is the source's reading, not a run. The error path, not the count, is what this note relies on.

Which side changes. The hook cannot be the side that moves (it has no code field), and a migration that is not applied should not be edited to rename a message the TDD already names (`docs/tdd/new-scope/12-first-run.md:105`, FS-10: "maps a 403 whose message is `signup_unavailable_region`"). So the app moves. The card and the TDD already say message, not code.

Exactly what must change:

| Where | Change |
|---|---|
| `apps/mobile/src/lib/auth/errors.logic.ts:53` | Match `errorStatus(e) === 403 && errorMessage(e) === 'signup_unavailable_region'` (both exist in `../supabase/errors.logic`: `errorStatus`, `errorMessage`). Exact match on the whole message, not a substring or regex. Remove the `code === 'region_refused'` branch, so a thrown `{code:'region_refused'}` is no longer special. Keep it before the network check. Rewrite the comment at `:49-52`: it is no longer [U]. |
| `packages/api` (contract) | Export one constant, `SIGNUP_REGION_REFUSED = 'signup_unavailable_region'`, so app and test read one value. Name and place are for the api owner; the point is one source. |
| `apps/mobile/test/auth-region-refused.test.ts:23,29-31,36` | Build the refusal in the real shape (`AuthApiError`-like: `status 403`, `code 'unknown'`, `message` the constant). Replace the [U] pin test. Add the negative cases in section 8. |
| `apps/mobile/test/first-run-gate.test.ts:203`, `packages/content/test/server-surfaces-auth.test.ts:280` | Names of the kind only; no change unless the kind is renamed (it is not). |
| `apps/mobile/src/app/(auth)/sign-in/index.tsx:78-95` | Route `region_refused` from Apple and Google to `RegionRefusedScreen` (card NS-54-R8: "the screen is the neutral refusal, not an error"). Today only `sign-in/code.tsx:223` does; the provider path shows the one-line `authErrorMessage`. This is a mobile change, listed here and not made here. |
| Welcome / email Send (`send` context) | See section 3: at Send the kind must be held in memory, not shown (E62). |
| `supabase/migrations/20261121030000_compliance_gates.sql` | No change. `supabase/tests/compliance_gates.test.mjs:32` already pins the message; add the drift test in section 8. |
| `docs/tdd/new-scope/12-first-run.md:105` | Already says a 403 whose message is `signup_unavailable_region`. No change. The "no spec names a code" comment at `errors.logic.ts:49-52` is replaced by section 1 of this note. |

## 2. One paragraph per method: how the hook and the calling code interact

All methods meet one hook, `public.hook_before_user_created`, at user creation only. A person with an account is never checked again (NS-40-R11; counsel question 2 of the spec). The hook reads `event.metadata.ip_address` [V]: Auth sets it from `utilities.GetIPAddress(r)` (supabase/auth master, `internal/hooks/v0hooks/v0hooks.go`), which takes the platform forwarded address first and the `X-Forwarded-For` chain second (supabase/auth master, `internal/utilities/request.go`; `getIPAddressWithXFF` takes the first parseable `X-Forwarded-For` entry, else `r.RemoteAddr`). These cites are to master, not the hosted version (see Source version). How many proxy hops Supabase trusts is not read: [UNVERIFIED], and it decides whether a client can spoof the address (test 4).

Email, link or code (NS-41, NS-40-R9). Auth creates the user when the sign-in is requested for a new address, so the hook can answer at Send, before any code exists: [UNVERIFIED] for the exact moment (read `internal/api/otp.go` and run it locally). E62 says Send must show the same "check your email" for a new and a known address, and the refusal screen only after the code step. So the app must hold `region_refused` from a Send in memory for that attempt, show the same wait screen, and show the refusal at the code step. A known address from a refused place is never refused (no hook), so it receives a real code; the new address receives none. That is a thin existence signal at the code step only (the CF-8 residue in `docs/tdd/new-scope/12-first-run-5.md:21`); it must be named to the product owner and not hidden by this note. Mutant: showing it at Send breaks NS-41-R2.

Apple and Google (NS-54-R8, NS-40-R10). `signInWithIdToken` creates the user for a first sign-in; the external path calls `triggerBeforeUserCreatedExternal` [V] (`internal/api/hooks.go`, called from `external.go`; master, not the hosted version). That the id-token endpoint reaches it is [UNVERIFIED] until test 3. The refusal comes back as the same 403 and message, so the same mapping applies. There is no code step: the screen is shown as soon as the sheet returns (spec S12). The app keeps no provider token on refusal (card NS-54-R6, R7). The change is the routing in section 1.

Phone (NS-54-R22 onward; not built, not decided). The hook runs when the number's user is created, with the same IP. Whether Auth creates a phone user at Send or at verify is [UNVERIFIED]; if at Send, the same E62 holding rule applies. The calling code is not part of the hook input. See section 5.

Passkey (NS-54 method table). A passkey is added to an account that already exists, so the hook does not run. No change.

## 3. The IP lightweight check the founder asked for

What it is. The check already built, unchanged: IP from `metadata.ip_address`, country from the in-database range table, refuse with 403 if the country is a `country` row with status `block` in `ops.restricted_jurisdictions`. Region rows (Crimea, Sevastopol, Donetsk, Luhansk) are ignored by the hook and rest on Terms 2.4 at sign-up.

Source. `ops.geo_ip_ranges`, loaded by `compliance/scripts/load-geo-ip.mjs` from DB-IP "IP to Country Lite", licence CC BY 4.0 with attribution (`migration :12-14`). The licence page and the file format were not opened (db-ip.com did not answer): [UNVERIFIED], read both before the first load. No platform country header is used (spec F13).

Cost. One range lookup in memory per sign-up, no network call, no per-request fee. The `lock_timeout` of 200 ms bounds how long the function waits for a lock (for example during a monthly load), not how long the query runs; a timeout raises, the exception handler fails open and counts `error`, so a sign-up cannot be held up by it and the denial-of-service risk to sign-up is low. A forged `X-Forwarded-For` can only let a person choose their own sign-up country; it cannot refuse anyone else, because the address checked is that one request's. The data file is a monthly refresh by a person or scheduled script; the report flags data older than 45 days. Row count and table size: [UNVERIFIED] (no file loaded). Money cost: the data is free under the licence; the only costs are the monthly load and the attribution line (BL-553).

What it must never log or store. The IP, the resolved country except on a block row, the email, the user id, the event JSON, the exception text, a timestamp finer than a day. The migration already follows this (`:37-38`, `:274-281`, counts only). Added requirements, each with a test in section 8:
- No `raise notice`, `raise warning` or `raise log` anywhere in the hook or the lookup functions.
- The hook's argument is the whole event. Postgres can write statement parameters to its log (statement logging, slow-query logging, query-plan logging): the hosted settings for those are [UNVERIFIED]; GEO-4 reads them with the Auth audit log retention.
- Auth's own request log line for the refused call carries the remote address and the message [UNVERIFIED: not read in this session; no source or log sample was opened, and GEO-4 settles it]; the platform's retention of it is GEO-4 and gates the hook (spec section 1, item 7). Until then the policy line "we do not keep the IP" is true of our tables only.
- A refusal message is the fixed string, with no country, no place and no reason.
- Fail open stays: no IP, no data, unknown country, stale data or an error lets the person in and is counted (spec 3.4). Reason: refusing every sign-up because a monthly file is late would be an outage, not a control (migration header, `:39-41`). Cost: a person with no resolvable address, or a stale file, passes unrefused, and Terms 2.4 is then the only layer; the counts and the staleness flag make that visible, not impossible. Counts: `pass`, `geo_unknown`, `geo_stale` and `error` are written by the hook outside any Auth transaction (section 1), and `block` most likely is too, shown by test 6. The hook runs outside any Auth transaction (section 1).

## 4. The embargo list: source and refresh

Source of truth in the repo: `ops.restricted_jurisdictions`, seeded from the founder's D-131 list (KP, IR, CU, SY, RU, BY at country level; UA-43, UA-40, UA-14, UA-09 at region level, `migration :81-106`). A change of which places are blocked is a founder decision in `docs/DECISIONS.md`; no agent edits a row.

Facts the list rests on. All of the following are [UNVERIFIED] in this session: OFAC's current program pages and its list of comprehensively sanctioned jurisdictions, the status of Syria after the program ended, the EAR country groups and sections 746.6, 746.8 and 746.9, and the Ukraine-related regions. The primary hosts (ofac.treasury.gov, www.bis.gov) gave no connection when tried here. The spec holds the same facts as secondary only (its F1 to F4). Nothing in this note adds a fact about OFAC or BIS.

Refresh. Three triggers, in this order: (1) a hit from `ops.regulatory_watch` (`compliance/scripts/regulatory-watch.mjs`) triaged relevant; (2) a scheduled read of the primary pages each quarter by regulatory-affairs, filed in `.claude/skills/regulatory-compliance/references/checked-facts.md`; (3) any counsel answer to question 3 of the spec. The output of a refresh is a proposed change to the seed list for the founder, never a direct edit. Each row keeps `source_url`, `checked_on` and the `UNVERIFIED` note until a primary page has been read; test 8 fails a `block` row that has neither an `UNVERIFIED` note nor a `checked_on` inside the refresh window. The refresh window is not defined anywhere: no spec, card or migration names a number of days for `checked_on`. The four region seed rows (UA-43, UA-40, UA-14, UA-09, note "Region level: web page only") carry a `checked_on` date, so whether test 8 is red on them is unproven until the window is defined. What must be defined, by regulatory-affairs with the data owner: (a) the window in days, with the trigger it follows (the quarterly read above suggests one quarter, but that is a suggestion, not a rule), (b) whether it applies to region rows, which the hook ignores, and (c) the clock the test reads (a fixed date passed in, not `now()`, so the test is stable). Once defined, the data owner decides in a new migration whether a row needs the `UNVERIFIED` marker; no applied or unapplied file is edited by this note.

The IP data refresh is separate: monthly, by the loader, and an alert on `geo_stale` and `geo_unknown` (spec GEO-3).

Condition before the hook is enabled. The hook is not switched on until the GEO-3 alerts exist and have fired once in a test: an alert on any `error` count above zero in a day, and an alert on a `geo_unknown` spike (a threshold the alert owner sets from a week of `pass` counts, because a spike in `geo_unknown` is the sign that the address source or the data file has failed open for everyone). Alert owner: ops (GEO-3 owner), with the security architect reading the first thresholds. Reason: the hook fails open (section 3), so without an alert a broken hook looks the same as a working one. Status: not built.

## 5. The phone country-code signal

Reconcile two readings that disagree.
- Card NS-54-R29: the calling code of a verified number is "at most a signal stored as a country code only; it never refuses a person alone".
- Spec section 3.8: "reject server-side a number whose code is on the list even if the app was edited"; and section 6 step 4: "Both signals are checked; either one refuses" (step 3 adds a server check before any SMS is sent).

These conflict: one says never refuses alone, the other refuses on the code alone. Recommendation, for the product owner and counsel (spec question 5), not a decision: keep R29 as written. The code is a soft signal; the control stays the IP hook and Terms 2.4. What the code may do without refusing:
1. Picker hiding is by region, not by dialling code. Some dialling codes are shared by more than one country, so hiding a code could hide an unblocked country, and R29 itself names "shared codes". The generated hidden list is built from `ops.restricted_jurisdictions` country rows keyed by ISO region, and a code is hidden only if every region on it is blocked. No dialling code is listed in this note: none was read from a source (spec 3.8), and the data step takes them from an ITU or library data file.
2. A number whose issuing region is blocked is not sent a code, and the screen is the existing "this number cannot be used" fallback (NS-54-R28), not the refusal screen and not a statement about a country. That saves the SMS fee and sends no text, and it is a fallback to email, Apple or Google, not a refusal of the person. This is the part counsel must read (question 5); until counsel answers, build only the count in 3.
3. A content-free count of the outcome (`phone_region_signal`, `blocked_issuer`, no number, no person), same table as the hook counts.

Not stored. R29's "stored as a country code only" should be tightened: the code is derived on demand from the number already held (NS-54-R25) and not kept in a second column, so a derived field cannot outlive a removed number (NS-54-R41). If the product owner wants it kept, it is a new L3 field with a retention line and an export entry (spec section 6). This is a change to list against R29, below.

What it must never log. The number, any part of it, its code beside an account id, or a per-person mismatch with the IP result. Counts only.

## 6. Changes to list against NS-54-R29 (and neighbours)

1. R29 text: replace "stored as a country code only" with "derived from the held number when needed, not stored separately" (or name the new column, retention and export row).
2. R29 text: state that the picker hides by region and never by a shared dialling code.
3. R29 and spec: the spec's "Both signals are checked; either one refuses" (section 6 step 4) and its step 3 server check before any SMS contradict R29's "never refuses alone". Edit the spec sentence, or add refusal as a counsel-cleared exception to R29.
4. R29 test title `[NS-54-R29] a calling code never refuses alone`: add the shared-code case (a code used by a blocked and an unblocked region) and the no-refusal-screen case.
5. NS-54-R8: add that the provider path shows the refusal screen, with the routing change in section 1 (today an inline line).
6. NS-40-R9: no card text names the code string, so no card edit is needed. The [U] wording exists in two places only: the comment at `apps/mobile/src/lib/auth/errors.logic.ts:49-52` (rewrite it to the message-and-status rule in section 1) and the test title at `apps/mobile/test/auth-region-refused.test.ts:29` (retitle it).
7. NS-40-R12 stays as written: counts by result with the country code on refusals only. No edit is proposed on a rollback theory; test 6 decides whether `block` totals can be trusted.

## 7. What counsel must see before this is published or enabled

Words and facts only counsel can settle. Each is routed through the spec's section 7 and COUNSEL_PACKET Q57; wording to `legal`.
- The jurisdiction list after OFAC and BIS pages are read (spec question 3; section 4 here).
- IP-country block at creation, fail open, Terms 2.4 as one programme (question 1); existing accounts not re-checked (question 2).
- The Privacy Policy line on the IP, against what Auth's own log keeps (spec item 7); the App Store label for an IP used in memory.
- A calling code as a sanctions signal, and a no-SMS rule for blocked-issuer numbers (question 5); a phone for everyone against Apple 5.1.1(v) (question 4).
- The held-then-refused behaviour at the code step and its thin existence signal (section 2, email).
- The Review Notes line for Apple 3.2.2(v); no country named until the primary pages are read (question 6).
- The refusal words stay PROPOSED (`packages/content/src/features/auth.en.ts:204-209`, `:244`); this note changes none.

## 8. Failing-test plan (written first; each has a mutant)

1. Real-shape mapping (mobile, `auth-region-refused.test.ts`). Fails today. An error with `status 403`, `code 'unknown'`, `message` the constant gives `region_refused` from `authErrorKind` in contexts `code`, `provider` and `link`. For `send`, `authErrorKind` also returns `region_refused` (a pure mapper has no memory); the unit that holds it is the Welcome/send handler (`apps/mobile/src/lib/first-run/welcome.logic.ts`, `inlineErrorKind`/`failureStillCounts`), and a second test asserts that a `send` refusal yields the same wait screen as a success and sets a held flag read at the code step. Mutant: compare to the old `code === 'region_refused'` and the test must fail.
2. Negatives (same file). 403 with another message, 500 with the constant, a substring such as `xsignup_unavailable_regionx`, and `{code:'region_refused'}` alone are not the refusal. A `status 0` fetch failure is `network`. Mutant: a substring match must fail one of these.
3. Provider path routes to the screen (`sign-in/index.tsx`): source test that `region_refused` reaches `RegionRefusedScreen` and no `retry` or storage call; mutant adds a Try again.
4. IP source (local stack, GEO-1): a sign-in from a known network records `pass`; a forged `X-Forwarded-For` from the client does not decide the country beyond the client's own request. Result recorded; if the client can pick its own country, that is accepted (it cannot refuse anyone else) and noted.
5. Wire shape (local stack, GEO-1): a refused sign-up by email, Apple (id token) and Google (id token) returns `403`, `code 'unknown'`, the constant message, and no other field of ours. [UNVERIFIED] until run.
6. Count survival (local stack, GEO-1): whether `block` survives the refusal. Expected per section 1: it survives, because the hook runs outside any Auth transaction and the 403 is built after it returns. This run also reads `current_setting('statement_timeout')` inside the hook, to settle whether Auth's timeout applies on this path (section 1). If it does not, NS-40-R12's test still checks row shape only and a gap is filed; no card edit is assumed.
7. Drift guard (`supabase/tests`, grep style): the constant in `packages/api` equals the literal in the migration; the hook's error object has exactly the keys `http_code` and `message` (a third key would be dropped by Auth and the app would never see it); no `raise notice|warning|log` in the hook or the lookup functions; no function argument or column named `ip`, `email` or `user_id` in `ops.compliance_check_counts`.
8. Embargo rows (`supabase/tests`): every `block` row has `decided_by` of a decision id, a `source_url`, and either an `UNVERIFIED` note or a `checked_on` inside the refresh window; the picker's generated hidden list equals the country rows reduced by shared dialling codes (when the picker exists). Red today on the four region rows (section 4).
9. `[NS-54-R29]` (when phone exists): a number with a blocked-issuer code is not refused by itself; the only effects are the fallback screen and one count; nothing stores the code beside an account id.

## 9. Not done here, on purpose

No migration, no hook switch, no data load, no list change, no content change, no `docs/BACKLOG.md` edit, no edit to the spec. Sections 1 and 6 are the lists the owners of mobile, the card and the spec work from.
