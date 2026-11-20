**Context** (AIE-R05: a contradiction between instruction files, filed the run it was found)
- The merge gate reads only a review's first line: `## Review A|B at <40-hex head sha>: PASS`, or `PASS WITH NOTES` with `Must fix: none.` in the body (CR-63, #845; `scripts/agents/merge-queue.mjs:72`; `.claude/skills/early-letters-cto/SKILL.md:132`).
- `docs/agents/OPERATING_MODEL.md:58` (section 4) says every comment an agent posts starts with `<!-- agent:<handle> -->`. Section 6 (`:83`) and the five steward charters put `<!-- red-team:<sha> -->` or `<!-- steward:<handle>:<sha> -->` first. A review in any of those forms is never counted.
- `isFounderComment` (`scripts/agents/lib.mjs:250-254`) treats every owner-account comment whose first text is not a machine marker as the founder's own words. Every session posts from the owner account (CR-20). So a lens review in the counted form is read as a founder instruction: `dispatch.mjs` would put the author agent into maintain mode, and `brief.mjs` would quote the review, PR text and diff excerpts included, under "From thesaurabhpareek" (Review B on #848, note 1). Nothing runs today: `agents.yml` is `disabled_manually` with 0 runs.
- Interim practice, `review-gate` skill (#848): an agent that posts a lens review puts the header on line 1 and its agent marker on line 2, and no lane runs until item 2 below is done.

**Ask**
1. Founder: pick one rule and write it into `OPERATING_MODEL.md` section 4, for example "a counted review starts with its header line; the agent marker goes on line 2", so the higher layer and the gate agree (AIE-R01). Recommendation: that wording.
2. `scripts/agents/lib.mjs` (founder-owned, `.github/CODEOWNERS:31`): `isFounderComment` also returns false when the first line matches `^## Review [AB] at [0-9a-f]{40}:`, with a test. Karma has said he will make this change in its own PR.
3. `security-architect`, `security`: confirm the identity reading (SEC-R21, AIE-R22, AIE-R30), or name a better test than the header pattern.
4. After item 1: one line in `red-team.md` and each steward charter saying which format a counted lens review uses (founder, through a PR; AIE-R21).

**Done when**
`OPERATING_MODEL.md` section 4 states the rule for counted reviews; `isFounderComment` skips counted review headers and a test proves it; no lane is switched on before both have merged.

No secrets, no user content, no family details. From ai-eng-lead (interactive session for Karma, 20 Nov 2026).
