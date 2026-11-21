# Proposed CI step: the NS trace ratchet (BL-964, gate G0)

Agents cannot edit `.github/workflows/`. The founder pastes this step into the `unit` job of `ci.yml`, after `npm test`, once the plain `--check` question below is settled.

```yaml
      - name: Trace ratchet (NS rows, gate G0)
        run: |
          git fetch --depth=1 origin "${{ github.base_ref }}"
          BASE=()
          if git show "origin/${{ github.base_ref }}:docs/ops/trace-ns-baseline.txt" > "$RUNNER_TEMP/ns-base.txt"; then
            BASE=(--ns-base "$RUNNER_TEMP/ns-base.txt")
          fi   # the first PR that adds the baseline has no base copy
          node scripts/trace.mjs --no-write --check "${BASE[@]}"
```

What it fails on: a P0 row (or cross-cutting id) with no test title that is not in `docs/ops/trace-ns-baseline.txt`; a bracketed NS id in a test title that no card defines and the baseline does not list; a baseline that gained a line against the base branch's copy. A baseline line whose row was removed or lowered from P0 fails until the author runs `--update-ns-baseline`; a line whose row now has a test is only reported as stale. A baseline deleted while the base branch has one fails.

Open question for the founder (07 Q8): plain `--check` also fails on the 5 v2 ids cited but defined nowhere in `docs/prd/v2/11-requirement-rules-and-retro-changes.md`. Until product fixes those, this step exits 1 on `develop`. Product owns the fix.
