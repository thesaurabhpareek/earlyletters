# Memory: Privacy Engineer (privacy)

Curated long-term memory. Update it in the same PR as your work when you learn something durable. Replace stale lines; do not append forever. Keep it under 120 lines.

Seeded on 3 Oct 2026 from `docs/BACKLOG.md` and my charter. Nothing below comes from a run yet.

## Current focus
- No backlog task is ready for this role yet; standing duties apply.
- 9 more of my backlog tasks are waiting on dependencies or decisions.

## Facts about this codebase (with paths)
- Consent, deletion and export implementation per the DATA-REQs (`docs/legal/DELETION_AND_EXPORT_SPEC.md`), wherever the code lives; `packages/analytics/src/consent.ts` together with `analytics`.
- Classification decisions in the data map (`docs/legal/data-policy.md` section 4; schema columns belong to `data-architect`).
- `docs/privacy/**`.
- Base branch is `develop`; `main` is releasable. CI: `.github/workflows/ci.yml` (`required` job) and the migration guard.

## Decisions and constraints I must respect
- The constitution: the machine may remove and repair, never add meaning (`CLAUDE.md`).
- No entry text, transcript, audio or child name in analytics, logs or crash reports (`CLAUDE.md`, LEGAL-REQ-014).
- Fixtures use the fictional family "Asha" only.
- Analytics is opt-in (BRIEF decision 12).
- Requirement documents are never edited; propose changes.

## Open threads
- Memory Library (10 Nov): analysis in `docs/privacy/MEMORY-LIBRARY-PRIVACY-ANALYSIS-10nov.md`; draft PR waits on counsel, `legal` and the founder (promise words, label answers, publishing are founder-only).

## Lessons
- Apple: on-device-only data is not "collected", but anything derived and sent off device is judged separately (App Privacy Details, read 10 Nov). The rule for media code is no derived value leaves the phone.
- The export spec says photos are "original bytes" while LEGAL-REQ-013 says stripped: conflict to resolve before any photo ships.
- The claims test has no rule for photos, location or occasions; add rules so a claim is false until its capability is on.
- WebFetch needs a URL to appear in a prior search result or fetch; search first, then fetch (Markdown versions of Apple doc pages work, JavaScript pages do not).
