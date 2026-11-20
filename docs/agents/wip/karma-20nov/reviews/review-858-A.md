## Review A at dfa66e2f5784dfec5fb791acac498b37e966bbbb: PASS WITH NOTES
<!-- agent:principal-architect -->
Must fix: none.

Lens A (principal-architect): code shape, contracts, buildability. File `docs/tdd/new-scope/security.md`, 357 lines, ASCII only, TDD 01 tags, no card text copied.

## What I checked
- Facts: I sampled 30 cites against `develop` and the installed tree. All hold. Examples: `isFounderComment` is a deny-list on the first line (`scripts/agents/lib.mjs:250-254`); `review_paths` for `security-architect` lack `apps/mobile/modules/**` and `supabase/tests/**` (`agents/roster.json:237-253`); the cards' view block re-grants `select` on `book_entries` (`20261015030000:251-253`) while `20261023060000:99` revoked it; the policy at `scribe_core.sql:271` cannot run without a grant (`explicit_grants.sql:49-51`); the invite message names the child (`share-text.ts:8`); contributor invites are refused while `app.contributors_enabled` is off (`20261015010000:121-123, 169`); preflight refuses `UIBackgroundModes` (`preflight-testflight.mjs:589-590`); `agents.yml` is pinned (`:132`); the counted header regex (`merge-queue.mjs:75`); export names audio by entry id (`schema.ts:31-32`) and ids are UUIDv7 (`ownership.ts:33`).
- Boundaries: no founder or counsel question is decided. OQ-S1 to OQ-S11 carry owners and defaults. The X2 reads in 3.3 and 3.5 are this steward's own reads, which X2 requires; they count only once posted, and counsel's reads stay owed. No word is approved.
- Contracts: NSC-10 (every definer RPC checks the author itself; revoke-only view replace; deny cells) is the right rule for NS-12 and the seal pull. Option (b) for the seal agrees with CR-67 AX-2. NSC-11 needs `SCPHO` in the registry and in `SQLSTATE_RULES` (`envelope.ts`), as `data-and-sync.md` C1 says.
- Buildability: section 7 lists S-1 to S-8 with owners, lenses and sizes under the limit. Section 4 gives each design the controls it must carry; I checked them against `architecture.md` AP-4, AP-6, AP-9 and found no clash.

## Findings (none blocks)
1. CR-67 AX-17: the boundary set is B1 to B7 plus eval C's TB6 to TB8 as B8 to B10 (repository to production build, real family to tests and evidence, phone to logs). Section 1 has B1 to B7 only. Add them on next touch.
2. CR-67 AX-9: NSC-08 names `tmp/share`. CR-67 rules one Caches folder per feature (expo-file-system 57 has no tmp, `10-reading-and-family.md` C8). Rename on next touch.
3. NSC-01 buildability: a SHA-256 manifest test can only prove the sources equal the manifest, not who reviewed the manifest. The review is enforced by routing. So S-3 should add the manifest path (`apps/mobile/modules/REVIEWED.sha256`) to `security-architect`'s `review_paths` with `apps/mobile/modules/**`; say that in NSC-01. Also say how the hash treats line endings (`.gitattributes`), or a checkout on another platform fails the test.
4. NSC-05 and CR-67 AX-1 agree that one native setting is built once. Name ADR 0039 (eval C s1.4, now the shared number) in NSC-05, so `mobile`, `design-systems` and this file point to one record.
5. Section 9: "Once S-1 lands, this file's section 3 shrinks to a pointer" is good. Until then two homes exist (#342 and this file); keep S-1 first in section 7, as written.

## CI
All checks green at the head. The head was older than 10 minutes when I finalised.

## Not verified
- That `create or replace view` keeps grants on the hosted Postgres version (the file marks it).
- Whether B's screens show A's local book after a mismatch on a phone (K-2).
- Writing Tools behaviour on iOS 17 and 18.

Reviewer: independent of the author (CR-44).
