# Quality critique of the v1.0 iOS journey

Owner: Quality Engineer. Method: all 116 step files read; screenshots looked at for the key screens (age gate, promise, child step, mic denied, Review, deleted, export failure, crash); every other screen judged from its step text plus the source in `apps/mobile/src`. Web captures are not defects: anything a phone does differently is marked "from code reading, not observed". Findings: `quality.json` (5 blocker, 31 major, 37 minor across 117 entries; 64 steps are ok).

## Top 10 risks

1. **No error boundary or crash handler (J20-01).** Blank page on web; a throw in an event handler or timer is fatal in a native release. A failing DB open or migration locks the person out of Export and recordings.
2. **Delete is permanent to the person and not really deleted (J10-06).** Undo lives only on that screen; no Recently deleted; tombstoned audio and text stay on disk and in backup.
3. **Durability gates have never run on a phone.** Kill-during-save (500), backup/restore drill, Maestro flows and native build evidence are absent. A killed M4A may not play and the sweep does not check.
4. **First-run mistakes are permanent (J01-07, J01-08, J03-07).** Birthday defaults to today, a due date never becomes a birthday, and name/date/signature cannot be edited or a book removed.
5. **Deep link `scribe://listen` starts recording on mount (J05-04); unknown links hit the default 404 (J19-01).**
6. **Recording is cut by screen lock; Read together autoplay stops at lock (J05-01, J11-03).** No keep-awake; background audio is off.
7. **Crash reporting is promised but does not exist (J04-04, J16-02)**; no OTA channel for hotfixes.
8. **Typing and Review edits can be lost (J07-02, J06-08)**: debounce with no flush, uncaught timer errors, edits held in component state only.
9. **No way to discard a draft after Finish (J06-12, J05-08)**; export omits drafts, orphans and deleted items while saying "every letter and recording" (J15-01).
10. **Store review and budgets unproven**: "coming soon" Family tab and dormant sign-in SDKs/entitlements (J17-01); no perf harness, no CI size gate, native size unmeasured.

Also noted: local `raw_transcript` immutability is by SQL convention only (no local trigger; CLAUDE.md's trigger is the server schema).

## NFR table

| NFR | Target | Evidence today | Status |
|---|---|---|---|
| Data durability | Zero letters lost; 500-kill gate (PRD 7.4) | WAL + synchronous=FULL, draft before mic, atomic save, launch sweep, unit tests (`test/sweep.test.ts`); no device or kill-gate evidence | Gap |
| Immutable raw, reversible edits | Trigger-enforced | Server trigger only; local by WHERE clauses; edits reversible in Review, not after save | Gap |
| Crash handling | Crash-free sessions 99.8% (PRD 7.5) | No boundary, no handler, no reporter; ASC/Organizer only | Fail |
| 404 / bad links | Designed screen | Default Unmatched Route; unrestricted route passthrough | Fail |
| Cold start / first frame | p50 1.2 s, p90 2.0 s (SE 3) | No harness (TDD 06 "BL-044 human"); services deferred after first frame (by design, read) | Unproven |
| Record start | p95 500 ms | Not measured | Unproven |
| Local save | p95 200 ms | Single transaction by design; not timed | Unproven |
| Book chapter of 60 letters | p95 500 ms | Whole-table reload per change; no fixture | Unproven |
| Transcription | 2-min letter 30 s on SE 3 | Not measured; 575 MB model, about 1 GB resident (estimate) | Unproven |
| Export | 230 MB in 2 min; complete | Verified ZIP with manifest hashes; omits drafts/orphans/deleted; no ZIP64 | Partial |
| App size (D-065) | Download under 40 MB | JS 11.6 MB of 12 MB; native/thinning not measured; no CI gate | Unproven |
| Accessibility | WCAG 2.2 AA, AX5, VoiceOver | Token contrast tests, reduce motion, VoiceOver rows by design; no AX5/axe in CI, no VoiceOver evidence, 900 ms save card | Partial |
| Privacy of logs/analytics | No content anywhere | Opt-in analytics, allowlist, no content in paths read; no client log canary; no crash reporter | Partial |
| Network egress | Only disclosed hosts | Code shows models host, StoreKit, PostHog after consent; google.com not from app code; device capture needed | To verify |
| Data at rest | Data Protection class | Set in `app.config.ts`; DB not separately encrypted (accepted); backups include deleted | Partial |
| Localisation | 7 spoken languages | UI English only; no ar/hi/zh layout fixtures | Gap |
| Traceability | Req id to test | About 30 ids in titles; no TRACE.md; no component tests; web e2e not in CI | Gap |
| App Store readiness | No review blockers | "Coming soon" tab, dormant sign-in entitlement and SDKs, counsel-pending mic string, no plist lint | Risk |

Honesty note: nothing here was run on an iPhone. Items marked unproven or "from code reading" need the S1 session in `docs/qa/DEVICE_TEST_PLAN.md`.
