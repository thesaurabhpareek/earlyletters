# Security policy

Families trust this app with their letters, voices and their children's details. If you find a way that trust could be broken, please tell us privately. Thank you.

## How to report

Email **security@earlyletters.com** with:

- what you found and where (app version and build, endpoint, or file);
- steps to reproduce, using your own test accounts only;
- what an attacker could do with it;
- how you would like to be credited, if at all.

> Founder setup note: the `security@` mailbox must be created before this policy is relied on. Until it exists and has been tested, `hello@earlyletters.com` is the only verified live address; reports sent there with "Security" in the subject reach the same person.

If GitHub private vulnerability reporting is enabled on this repository, you may use that instead. Please do **not** open a public issue, pull request or discussion about a vulnerability.

## Please

- Use only accounts and books you created. Never access, change or delete anyone else's data. If you reach real family data by accident, stop, do not keep a copy, and tell us what you saw.
- Do not run denial-of-service tests, spam, social engineering or physical attacks, and do not test third-party services we use (Apple, Supabase, Resend, Vercel and others) beyond our own configuration of them.
- Give us a reasonable time to fix the issue before you share it publicly. We will agree a date with you.

We will not pursue or support action against anyone who reports in good faith and follows these rules.

## In scope

- The iOS app (current App Store and TestFlight builds).
- Our backend: database access rules, RPCs and Edge Functions.
- Our websites on `earlyletters.com` and `earlyletters.app`.
- Downloaded language packs, model manifests and server-delivered content (integrity and signing).
- This repository's code, CI configuration and secrets handling.

## Supported versions

| Version | Supported |
|---|---|
| Latest App Store release | Yes |
| Latest TestFlight build | Yes |
| Older builds | Fixes ship in a new build; very old builds may be asked to update |
| `main` and `develop` branches | Yes |

## What to expect

| Step | Target |
|---|---|
| Acknowledge your report | Within 3 business days |
| First assessment and severity | Within 7 days |
| Fix for critical issues (exposure of family data across accounts, authentication bypass) | Within 7 days of confirmation, or a mitigation in place sooner |
| Fix for high issues | Within 30 days |
| Fix for medium and low issues | Within 90 days |

These are targets for a very small team, not guarantees. We will keep you updated, tell you when it is fixed, and credit you if you want.

How we handle incidents internally: `docs/ops/INCIDENT.md`.
