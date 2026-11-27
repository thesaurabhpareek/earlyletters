# Proposed CODEOWNERS lines: the media metadata-only allowlist (BL-845)

Status: proposal only, 24 Nov 2026. `.github/CODEOWNERS` is not changed by this pull request (CR-22, D-124). The commit that applies it cites BL-845.

## Why

BL-845 (NX-39-R9 (d); SEC-ML-1, SEC-ML-2) asks for a proposed CODEOWNERS entry for the allowlist the media scanner judges code against. The scanner, the allowlist and the adapter record landed in #1969 and #1984 (CR-206). The allowlist's own header (`apps/mobile/test/support/media-scan-allowlist.ts` line 5) says "Proposed owner in CODEOWNERS: `security-architect`", but no proposal file existed. This is that file.

What decides what media code may touch, and so what the lines cover:

- `apps/mobile/test/support/media-scan-allowlist.ts`: every list the scanner reads. Widening an allowed list or narrowing a banned one lets a call through that fails today.
- `apps/mobile/test/support/media-scan.ts`: the scanner itself. Weakening a rule here does the same.
- `apps/mobile/test/media-ast-scan.test.ts`: the positive controls and the pins. Deleting a pin or a banned fixture does the same.
- `apps/mobile/src/lib/media/asset-record.ts`: the six-field `AssetRecord` and `toAssetRecord`. A seventh field is a new piece of photo metadata the app holds.

## Proposed lines, appended after the `/packages/core/src/plan.ts` block

```
# Media metadata-only scanner, allowlist and adapter record (NX-39-R9; BL-845). Lens: security-architect.
# A change here widens what media code may call, read or keep; review it like the verifier.
/apps/mobile/test/support/media-scan-allowlist.ts   @thesaurabhpareek
/apps/mobile/test/support/media-scan.ts             @thesaurabhpareek
/apps/mobile/test/media-ast-scan.test.ts            @thesaurabhpareek
/apps/mobile/src/lib/media/asset-record.ts          @thesaurabhpareek
```

## What this does and does not do

Every session posts as one account (CR-20), so the lines name the same owner as `*`. They are a routing aid and a label for the reviewer lens, not a boundary: "Require review from Code Owners" is off while one person owns everything (see `docs/ops/proposed/codeowners-lines.md`).

What holds the line today is the test file. Its pinned lists fail when changed, so a widening there means editing a pinned test in the same diff: the allowed library modules (the keys of `ALLOWED_LIBRARY_CALLS`), the six record fields (`ASSET_RECORD_FIELDS`), the empty `FIELD_READ_EXCEPTIONS` (`media-ast-scan.test.ts` lines 116 to 125), and `NAME_EXCEPTIONS` (lines 146 to 151). These are not pinned and are covered only by review, which is what these lines are for: `MEDIA_FOLDERS`, the `MEDIA_MODULE` and `BANNED_MODULE` patterns, the call names inside each `ALLOWED_LIBRARY_CALLS` entry beyond the write, analysis and location filter at line 119, `BANNED_TOKENS`, `BANNED_NAME_PATTERNS`, `BANNED_NETWORK`, `BANNED_NETWORK_VENDORS` and `BANNED_FIELDS`.

## How to verify after applying

1. `git diff develop -- .github/CODEOWNERS` shows only the six lines above.
2. `gh api repos/thesaurabhpareek/earlyletters/codeowners/errors --jq '.errors | length'` prints `0`. (A test PR would not show a review request: GitHub never requests review from a PR's own author, and every session opens PRs as the owner.)

## Rollback

Delete the six lines. Nothing depends on them.
