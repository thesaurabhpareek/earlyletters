# The privacy label guard (G11)

`scripts/release/label-effect.mjs` (BL-975; card `07-remaining-capability-rows.md` section 5, rows NS-07-G11-1a to G11-5; gate G5). The card proposed `scripts/guards/`; it lives with the release scripts because it is a release gate.

```bash
node scripts/release/label-effect.mjs --base origin/develop --body-file pr-body.txt
```

Exit 0 is a pass, 1 is a finding, 2 means the guard itself could not run. Each FAIL line names a file and line or the missing item, never diff content.

## What fails, and how to clear it

| Line | Cause | Clear it by |
|---|---|---|
| `FAIL G11-1a <file>:<line>` | Added lines, in one block, call the network (or add a server table, column, bucket or function in `supabase/migrations`) and name letter text, a recording, a picture or a child name | Recording the label change, below, or not sending that data |
| `FAIL G11-3 <file>:<line>` | A new analytics, crash or ads SDK in `apps/mobile/package.json`, a new entitlement, or a new usage string in `app.config.ts` | Recording the label change, below |
| `FAIL record: ...` | One of the four conditions is missing | The PR body names a D-id; that D-id is a decision in `docs/DECISIONS.md` on the base branch; its section names the privacy label; `docs/legal/app-store-privacy-labels.md` changes in the same PR |
| `FAIL G11-2 <card>:<line>` | A card in `docs/product/prd/*.md` (or a Part of one) has no line starting `**Label effect.**` or `Label effect:` before the next card | Adding the line |

## What it cannot do (residual risk, NS-07-G11-4)

- A session can still record a matching decision on the base branch before the PR, and the guard will pass. The guard reads `docs/DECISIONS.md` from the base branch, so a decision added in the same PR does not count, but it cannot tell who wrote an earlier one. **The founder's merge remains the real gate.**
- It reads added lines block by block, by name. Data sent through a helper defined elsewhere, or under a field name it does not know, passes. An edited line counts as added, so rewording a call that already carries content fails until it is recorded.
- It never decides the label. Counsel confirms the label itself (Q54).

## Turning it on (NS-07-G11-5)

The job is `docs/ops/proposed/workflows/label-guard.yml`. The founder copies it to `.github/workflows/label-guard.yml` (D-124: the Claude GitHub App cannot edit workflows) after the locked cards merge (#846), because the pre-lock cards on `develop` lack their label lines and G11-2 would fail every PR. When it has been green for a week, add `label guard` to the required checks on `develop`.
