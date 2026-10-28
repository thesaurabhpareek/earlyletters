# Proposed: pass robustness switches to the dispatcher (RB-29)

Not applied. It edits `.github/workflows/agents.yml`, which needs D-041 independent review (and OPERATING_MODEL section 8 says agents never edit workflows).

Without it the dispatcher runs the defaults (`AGENTS_GATES=warn`, reports only). With it, the founder can set repository variables `AGENTS_GATES`, `AGENTS_PROVENANCE`, `AGENTS_SLA`, `AGENTS_STALE`, `AGENTS_STALE_HELD` without another workflow change. An unset variable expands to an empty string, which the dispatcher treats as the default.

```diff
       - name: Dispatch
         id: dispatch
         env:
           GH_TOKEN: ${{ github.token }}
@@
           AGENTS_PAUSED: ${{ vars.AGENTS_PAUSED }}
+          AGENTS_GATES: ${{ vars.AGENTS_GATES }}
+          AGENTS_PROVENANCE: ${{ vars.AGENTS_PROVENANCE }}
+          AGENTS_SLA: ${{ vars.AGENTS_SLA }}
+          AGENTS_STALE: ${{ vars.AGENTS_STALE }}
+          AGENTS_STALE_HELD: ${{ vars.AGENTS_STALE_HELD }}
           ONLY_AGENT: ${{ inputs.agent }}
```

Reviewer check: the added lines read repository variables only, no secrets, and the job's permissions are unchanged (it already has `pull-requests: read`, which covers the new files and commits reads).
