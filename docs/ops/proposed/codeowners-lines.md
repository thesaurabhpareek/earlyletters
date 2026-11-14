# Proposed CODEOWNERS lines (HV2-B20 part c)

Status: proposal only, 1 Nov 2026. `.github/CODEOWNERS` is not changed by this pull request (D-124, CR-22); the founder decides whether to apply any of it.

## What CODEOWNERS can and cannot do here (CR-32 and the README)

One account owns every area and every agent session posts as that account (CR-20). So a CODEOWNERS line names the same person whatever path it covers. It is a routing aid: it tells a reader, and GitHub's review-request feature, who to ask. It is not a boundary. "Require review from Code Owners" is off by design while one person owns everything (`.github/README.md:34`), and "Do not allow bypassing" is off so the owner can recover from broken CI (`.github/README.md:35`). The fence that actually blocks a path is `compliance-fence` (required on `develop`, CR-32), and it covers `compliance/**`, not the paths below. Do not read any line here as protection.

## What is already there

`.github/CODEOWNERS` on develop (`246debbd`) already has:

- `*` and `/.github/` for `@thesaurabhpareek`, so `.github` needs no new line;
- `/docs/agents/` for `@thesaurabhpareek`, which already covers `docs/agents/cto/` (GitHub uses the last matching pattern; all of these name the same account, so the result is the same).

Not covered by a specific line, and so falling to `*`: `/docs/ops/`, `/scripts/review-gate/` (the directory arrives with #559; it does not exist on develop yet).

## Proposed additions, appended after the `/.github/` line

```
# Release and operations docs and proposals (ops)
/docs/ops/                          @thesaurabhpareek

# Review gate: decides whether a PR may be called ready (HV2-B06, #559)
/scripts/review-gate/               @thesaurabhpareek
```

## Optional, for the reader's benefit only (no effect on who is requested)

Naming the intent where a path is already covered by a broader line:

```
/.github/                           @thesaurabhpareek   # already present; workflows and CI docs
/docs/agents/cto/                   @thesaurabhpareek   # already covered by /docs/agents/; the CTO rulings log
```

I would not add the second pair: they duplicate lines that exist, and a duplicate that later diverges is how a routing file goes wrong.

## When this becomes a boundary

Only when there is a second account to own some of these paths, "Require review from Code Owners" is turned on, and "Do not allow bypassing" is on (`.github/README.md:34-35`). Until then the two lines above are labels.
