# Gap tracker (fix wave starting 2026-10-05, branch `auto/2026-10-05-fixes`)

Sources:
- the security review (`docs/reviews/2026-10-04-security-privacy.md`)
- the legal alignment report (`docs/legal/COUNSEL_PACKET.md`, the Q-003 memo)
- the db-followup, backlog and integration reports
- earlier agent reports

Owners update the **Status** column: `open`, `in progress`, `fixed (test: …)`, `blocked (why)`, or `founder`. One owner per gap. Any change outside your owned files goes on the board as a request.

| ID | Gap | Source | Owner | Status |
|---|---|---|---|---|
| G-01 | Email-link login hijack. Fix: PKCE, a check that this phone started the sign-in, and a confirmation showing the account email before any local data is claimed | review H1 | auth-fix | open |
| G-02 | Invite flow: ask before joining, never switch book on its own, map SCCAP, Family screen uses leave_child / remove_child_member | review H2, db-followup | auth-fix | open |
| G-03 | Apple refresh token never captured. Build the `apple-token` Edge Function plus a client call after Apple sign-in, so deletion can revoke it (5.1.1(v)) | review H3 | auth-fix | open |
| G-04 | Invite token in the URL path. Move it to the fragment (`/i#t=`), update AASA paths and docs; the website must not log `/i/*` | review M2 | auth-fix | open |
| G-05 | Email OTP: 8 digits, expiry, rate limits; CAPTCHA decision (document it, plus client support if feasible in RN) | review M4 | auth-fix | open |
| G-06 | `forceReauthEpoch` is never acted on | review L3 | auth-fix | open |
| G-07 | Idempotency keys are regenerated on every retry; create one per user action (invites.ts, consent.ts) | db-followup | auth-fix | open |
| G-08 | Family members can read the child's birthday and due date from `children` | review M1 | db-fix | open |
| G-09 | The `sync_pull` digest reveals that a co-parent wrote a private letter | review M5 | db-fix | open |
| G-10 | op-id squatting in `sync_op_receipts` | review L1 | db-fix | open |
| G-11 | `create_child` has no daily limit on the server; `delete_entry` / `restore_entry` are not rate-limited | db-followup, review M3 | db-fix | open |
| G-12 | The consent pepper silently accepts an empty value (fail closed instead) | TDD 05 X-12, BL-334 | db-fix | open |
| G-13 | `peek_invite` (server half of "ask before joining"). It must show only the inviter's sign-off name, never the child's, before consent | db-followup | db-fix | open |
| G-14 | DATA_CLASSIFICATION 4.1: `entries.language`, `idempotency_keys`, rate tables, new functions | db-followup | db-fix | open |
| G-15 | On-device plan reminders (Q-003 position) and a purchase confirmation sheet with "Save a copy" | legal, BL-342 | payments-fix | open |
| G-16 | Swift edge cases: an Int conversion trap, a store sheet that can stay stuck, the AUSoundIsolation exception risk, thread safety | review, speech | payments-fix | open |
| G-17 | `packages/api`: SCCAP → `parents_full`, `policyActionsNeeded` enforced by rpc, leaveChild / removeChildMember endpoints, ADR 0017 §6 | db-followup | platform-fix | open |
| G-18 | Remote config accepts a replacement at the same version | review | platform-fix | open |
| G-19 | Export is missing consent history and dictionary terms | review | platform-fix | open |
| G-20 | k-anonymity can be defeated by differencing two insights views | review | platform-fix | open |
| G-21 | Copy: sensitiveConsent says "the family you choose" (should be co-parent); hard-coded trial lengths in the renew strings; health-data notice link in the store description; drop "crash" from the consent strings | legal | platform-fix | open |
| G-22 | `decode-uri-component` advisory in the app bundle | review | platform-fix | open |
| G-23 | App-level privacy manifest (PrivacyInfo) missing | review L7 | mobile-fix | open |
| G-24 | Analytics consent sheet sequencing; Sentry only with consent (or a decision not to adopt it) | analytics | mobile-fix | open |
| G-25 | Design consistency: ListSection indent, sheets on `Sheet`, ToggleRow, aura token, `editMark` underline, recordings screen with no backup, "nobody spoke" card | design, brand | mobile-fix | open |
| G-26 | Local migration v5 `entries.language` plus sync mapping (upsert, `changed`, ALL_GROUPS) | db-followup | mobile-fix | open |
| G-27 | Web preview: seeded audio, favicon, deleting unused assets | brand | mobile-fix | open |
| G-28 | Maestro flows (15), device test plan, RELEASE.md | TDD 07 | qa | open |
| G-29 | Stable testIDs for E2E (qa posts the list; mobile-fix adds them) | qa | mobile-fix | open |
| G-30 | DECISIONS: stale "still need founder" list, Q-006 converged, Q-010 owners | backlog | coordinator | open |
| G-31 | Mirror COUNSEL_PACKET, the Q-003 memo and FOUNDER_TASKS week 1 into the Project doc | legal, backlog | coordinator | open |
| G-32 | Governance migration still pending on the live project. Founder applies all files per APPLY.md, or builds production fresh | legal CN-10 | founder | founder |
