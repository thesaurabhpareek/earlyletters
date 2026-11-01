# Robustness and compliance audit after build 1 (1 Nov 2026)

Status: done. 45 gaps found, now 41 backlog items (BL-563 to BL-603); 4 of those need a founder call first. Ruling: CR-47.

The founder asked, on 1 Nov 2026 after build 1 reached TestFlight, for the compliance agents to check how sturdy the system is today and to turn the gaps into a detailed backlog for the app, the backend, data, account security, speed and size, with the door (sign-in, the account holder's name, Terms acceptance, explicit consent) and the consent records held to a strict standard.

## How it was done

Four read-only audits of `develop` at d6e83f9e, run in parallel by the agents who own each area. None changed a file or posted anything.

| Lens | Agent | Found |
|---|---|---|
| The door and consent records | `regulatory-affairs`, with the CCO skill | 12 (COMP-01 to COMP-12) |
| Accounts and backend security | `security-architect`, with the infosec and CISO skills | 10 (SEC-01 to SEC-10) |
| App robustness, speed and size | `mobile` | 14 (APP-01 to APP-14) |
| Data, database and sync | `data-architect` | 9 (DATA-01 to DATA-09) |

Each finding names a file and line on develop, or the search that came up empty. Facts about Apple and Supabase come from pages read on 1 Nov 2026 (sources at the end). Legal readings are engineering readings; counsel must confirm.

## What is already sound

The audits checked these and found them holding, so they are not in the backlog:
- `npm run test:db` passes (38 files on 1 Nov; CLAUDE.md still says 32). Row-level security is on every `public` table; the `ops` and `sync_private` schemas are closed to client roles.
- Edge Functions check the JWT at the gateway (except `config`, `content` and `purge-worker`, which has its own secret checked in constant time), log only closed lists of codes, and send no CORS headers. Invite codes count each guess in the same transaction; invite tokens are stored as hashes.
- Sync writes are idempotent (`sync_op_receipts`, UUIDv7 ids); letter text uses compare-and-set under a row lock; every server time is `timestamptz`; search works the same in all seven languages.
- The phone database uses WAL with `synchronous=FULL`, migrates one transaction per step and leaves a newer file alone; data protection is `CompleteUntilFirstUserAuthentication`, checked by a test. Sign-out waits for queued uploads and never deletes local letters.
- The session, pending invite and Apple user id are in the Keychain; sign-in links use PKCE; there is no over-the-air code path and no `http://` URL or `console.*` call in app code.
- The consent pepper fails closed; the server refuses unknown consent context keys.
- Measured in a Linux export, not on a phone: the Hermes bundle is 9.18 MB against a 12 MB budget.

## Where each finding went

| Finding | Severity | Backlog |
|---|---|---|
| APP-01 Listen sticks on "finishing" | S0 | BL-563 |
| COMP-02 Consent sheet links to a 404 | S0 | BL-564 |
| COMP-01 No app Terms or Privacy published | S0, founder | BL-565 |
| DATA-01 Staging has no backup or tested restore | S0, founder | BL-566 |
| SEC-01 Functions break if staging's legacy keys go | S0 | BL-594 |
| APP-02 Free space checked only at start | S1 | BL-567 |
| APP-03 No global error handler | S1 | BL-568 |
| DATA-04 Refused letters silently stuck on one phone | S1 | BL-569 |
| DATA-08 No database corruption check | S2 | BL-570 |
| APP-08 Book re-reads every letter | S2 | BL-571 |
| APP-07, APP-12 Transcription during a take; downgrade on any kill | S1 | BL-572 |
| COMP-10 No real re-consent sheet | S1 | BL-573 |
| COMP-11 Backup consent would be refused | S2 | BL-574 |
| COMP-05 Agree line after the account exists | S1, founder | BL-575 |
| COMP-04 Privacy acknowledgment not recorded | S1 | BL-576 |
| COMP-03, COMP-09, DATA-05 Consent records incomplete | S1 | BL-577 |
| DATA-05 Deletion request cannot find consent rows after 60 days | S1 | BL-578 |
| COMP-12 No record before any account | S2 | BL-579 |
| COMP-07 Age No leaves the server account | S1 | BL-580 |
| COMP-06 Accounts that never accepted Terms are kept | S1 | BL-581 |
| COMP-08 Apple full name collected with no use | S1 | BL-582 |
| DATA-02 One applied-migrations list for all projects | S1 | BL-583 |
| DATA-03 No outside alert when purge stops | S1 | BL-584 |
| DATA-06 Audit tables can be rewritten or truncated | S2 | BL-585 |
| DATA-07 Supabase Auth audit log may keep IPs | S2 | BL-586 |
| DATA-09 No plan for alpha data at production | S2 | BL-587 |
| APP-05, APP-06 Launch and record budgets unmeasured | S1 | BL-588 |
| APP-10, APP-11 Size unknown, fonts twice, unused packages | S2 | BL-589 |
| APP-04 Nobody owns TestFlight crashes; no source maps | S1 | BL-590 |
| APP-13 Kill gate simulator-only, 5 s tolerance | S1 | BL-591 |
| APP-14 Build 2 over build 1 not proven | S1 | BL-592 |
| APP-09 No battery number for recording | S3, founder | BL-593 |
| SEC-02 Email code lockout only on the phone | S1 | BL-595 |
| SEC-03 Staging sign-up open to anyone | S1 | BL-596 |
| SEC-04 Sign-everyone-out switch unproven | S1 | BL-597 |
| SEC-05 No account recovery or takeover runbook | S1 | BL-598 |
| SEC-06 No test pins the Keychain class | S1 | BL-599 |
| SEC-07 ATS not checked; parser accepts http | S2 | BL-600 |
| SEC-08 Photo storage has no quota | S2 | BL-601 |
| SEC-09 Chapter 05 out of date | S2 | BL-602 |
| SEC-10 Unknown what staging logs hold | S1 | BL-603 |

## The consent record standard

The compliance audit wrote the field list, its source, purpose and level, and the never-list. It is now PRIV-R21 in `docs/engineering/07-privacy-engineering.md`, and BL-577 builds it. Every act records the document and version, the action, method and screen, the server and phone times, the app version and build number, the OS major version, the platform, the language of the words shown, the hash of those words before any name is filled in, and an allowlisted context (including whether a store age signal was possible). It never records an IP, a device identifier, an age or birth date, a name or email, or free text.

## How everyone writes requirements from now on

`docs/agents/COORDINATION.md` section 10. Human voice, Given/When/Then with numbers, and for anything a person agrees to, four extra lines: Shown, Records, Never, and Decline and withdraw. 25 of the 26 agent charters now point to it (the `regulatory-affairs` charter is fenced and follows separately), and the backlog's Definition of Done has two new lines (11 Records, 12 How it is written).

## Limits

- Nobody could see a hosted dashboard. Plan tiers, backups, cron state and the auth audit-log setting are unverified until the founder reads them.
- Nothing here was measured on a phone. Every device number in the backlog is a budget to check, not a result.
- The audits read `develop`; build 1 was built from an earlier commit that is not tagged (BL-592).

## Sources (read 1 Nov 2026)
- Apple App Review Guidelines: https://developer.apple.com/app-store/review/guidelines/
- Apple, Maximum build file sizes: https://developer.apple.com/help/app-store-connect/reference/app-uploads/maximum-build-file-sizes
- Apple, iPhone models compatible with iOS 17: https://support.apple.com/guide/iphone/iphone-models-compatible-with-ios-17-iphe3fa5df43/17.0/ios/17.0
- Supabase backups: https://supabase.com/docs/guides/platform/backups
- Supabase pricing: https://supabase.com/pricing
- Supabase auth audit logs: https://supabase.com/docs/guides/auth/audit-logs
- Supabase API keys: https://supabase.com/docs/guides/api/api-keys
- Supabase function secrets: https://supabase.com/docs/guides/functions/secrets
- Supabase auth rate limits: https://supabase.com/docs/guides/auth/rate-limits
- Supabase signing keys: https://supabase.com/docs/guides/auth/signing-keys
