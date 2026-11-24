# Proposed CODEOWNERS lines: the media metadata-only allowlist (BL-845)

Status: proposal only, 24 Nov 2026. `.github/CODEOWNERS` is not changed by this pull request (CR-22, D-124). Karma applies it; the PR that applies it cites BL-845.

## Why

BL-845 (NX-39-R9 (d); SEC-ML-1, SEC-ML-2) asks for a proposed CODEOWNERS entry for the allowlist the media scanner judges code against. The scanner, the allowlist and the adapter record landed in #1969 and #1984 (CR-206), and both file headers already say "proposed owner in CODEOWNERS: `security-architect`", but no proposal file existed. This is that file.

The two files that decide what media code may touch:

- `apps/mobile/test/support/media-scan-allowlist.ts`: every list the scanner reads (media modules, scanned folders, allowed calls, allowed field reads, `NAME_EXCEPTIONS`). Growing a list here is the one way to make a banned call pass, so a change to it should be read like a change to the verifier.
- `apps/mobile/src/lib/media/asset-record.ts`: the six-field `AssetRecord` and `toAssetRecord`. A seventh field is a new piece of photo metadata the app holds.

## Proposed lines, appended after the `/packages/core/src/pipeline.ts` block

```
# Media metadata-only allowlist and adapter record (NX-39-R9; BL-845). Lens: security-architect.
# A change here widens what media code may call, read or keep; review it like the verifier.
/apps/mobile/test/support/media-scan-allowlist.ts   @thesaurabhpareek
/apps/mobile/src/lib/media/asset-record.ts          @thesaurabhpareek
```

## What this does and does not do

Every session posts as one account (CR-20), so the line names the same owner as `*`. It is a routing aid and a label for the reviewer lens, not a boundary: "Require review from Code Owners" is off while one person owns everything (see `docs/ops/proposed/codeowners-lines.md`). What actually holds the line today is `apps/mobile/test/media-ast-scan.test.ts`, whose "the allowlists are small, literal and reviewed" block pins the allowed library modules, the six record fields and an empty field-read exception list, so widening those also means editing a pinned test a reviewer has to read. Other lists in the allowlist file (scanned folders, `NAME_EXCEPTIONS`) are covered only by review, which is what this line is for.

## How to verify after applying

1. `git diff develop -- .github/CODEOWNERS` shows only the four lines above.
2. Open a draft PR that touches `media-scan-allowlist.ts`; GitHub lists the owner as a requested reviewer by the code-owners rule.

## Rollback

Delete the four lines. Nothing depends on them.
