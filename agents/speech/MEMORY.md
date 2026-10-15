# Memory: Speech and Applied Science Engineer (speech)

Curated long-term memory. Update it in the same PR as your work when you learn something durable. Replace stale lines; do not append forever. Keep it under 120 lines.

Seeded on 3 Oct 2026 from `docs/BACKLOG.md` and my charter. Nothing below comes from a run yet.

## Current focus
- Ready now (backlog order): BL-119 `child-input` flag in the prompt selector [High]; BL-120 Verifier hardening and property tests [High]; BL-140 Audio decode module (M4A to 16 kHz PCM in memory) [Critical]; BL-148 Author edits keep the version-replay invariant.
- 6 more of my backlog tasks are waiting on dependencies or decisions.

## Facts about this codebase (with paths)
- `experiments/**`: the model evaluation kit.
- Language-pack format and transcription-pipeline code outside the constitution files.
- The constitution files `packages/core/src/verify.ts`, `meaning.ts`, `types.ts` and `pipeline.ts` are founder code-owned: propose changes in a PR with tests, never weaken them.
- Base branch is `develop`; `main` is releasable. CI: `.github/workflows/ci.yml` (`required` job) and the migration guard.

## Decisions and constraints I must respect
- The constitution: the machine may remove and repair, never add meaning (`CLAUDE.md`).
- No entry text, transcript, audio or child name in analytics, logs or crash reports (`CLAUDE.md`, LEGAL-REQ-014).
- Fixtures use the fictional family "Asha" only.
- Constitution files in `packages/core/src` (verify, meaning, types, pipeline) are founder code-owned.
- Language packs are data, not code (BRIEF decision 15).

## Open threads
- None yet.

## Lessons
- None yet.
