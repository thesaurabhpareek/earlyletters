## Review A at a997a0faa626a4f54141eaff00a3c0ada151210d: PASS WITH NOTES

Lens A (correctness and tests), PR 712, delta re-review of 99c3bedf..a997a0fa. Head confirmed with `gh api .../pulls/712 --jq .head.sha` and `git rev-parse origin/pr-712`. The delta is one file, docs/qa/DEVICE_TEST_PLAN.md (+3/-3, S1-97b only). No source or test file changed since 99c3bedf, so my earlier findings on the code (labels per state, the only-caller check, AX placement, no double read, and the TrailingWord/ProgressRing pin mutations) stand as written in the previous version of this review. A PASS holds only once required CI is green at this exact head.

### What I ran at a997a0fa
- Tests: test/speech-row-action-label.test.ts 9 of 9 pass; with test/qa-release-catalog.test.ts (parses the plan) and src/components/ui/list-row.logic.test.ts, 3 files and 35 tests pass. I did not re-run the wider group, tsc or the mutations: the delta touches no code or test.
- Delta scan: no non-ASCII, no em or en dashes, no ellipsis in the added lines; nothing outside the plan changed (`git diff --stat` excluding the plan is empty).
- merge-tree against origin/develop (still 6cd2223b): clean, exit 0.
- CI at a997a0fa: only partly finished when I looked. Success: edge functions, native files changed?, install, applied migrations unchanged. Skipped: iOS simulator build. In progress: typecheck, database rules, no e2e seam, tests and content rules. Queued: store-profile Release launch. The `required` check had not appeared yet (10 runs listed). PR mergeable_state is `blocked`. I cannot call this green; it must be re-read before merge.

### Plan text against the code
- S1-97b step (e): "look at the English row on Download. Turn VoiceOver off, tap the row to start the download, and look at it on Stop. Then turn Voice Control on. With the row on Stop, say 'Tap Stop'; when it reads Download, say 'Tap Download'. Turn Voice Control and the larger text size off afterwards." The sequence is consistent with (c) and (d): (d) leaves the row on Download (its double-tap stops the download), so (e) starts on Download. A plain tap with VoiceOver off calls the same onPress (speech-row.tsx:110-112). "Tap Stop" runs `stop`, "Tap Download" runs `startSpeechDownload`. Turning VoiceOver off before the starting tap fixes the earlier ambiguity (a double-tap versus a tap) and the cleanup sentence is sensible.
- Expected (e): "the word sits under 'English' (and, on Stop, the ring beside it), and nothing is broken across lines." This matches the code: at AX sizes the node (a flex-row of ring then word, speech-row.tsx:98-101) is drawn under the title block (list-row.tsx:106). The ring exists only in the downloading state (`percent !== null`); the Waits for Wi-Fi Stop row has the word and no ring, but step (e) does not reach that state, so the line is accurate for what (e) does. The earlier "ring on the Download row" error is gone.
- Needs: the 575 MB parenthesis is back right after "full-tier phone"; the SE clause ("for (e) an iPhone SE (3rd generation), the narrowest screen (375 pt wide)") follows it. The SE is full-tier (4 GB against the 3.4e9 line, tiers.ts:21; DEVICE_TEST_PLAN.md:38), so no conflict with the 575 MB figures.

### Must-fix
None.

### Notes (not blocking)
1. Carried, code: `disabled` forwarding from ListRow to `rowLabel` (list-row.tsx:87) is not pinned by any test; latent, no caller passes `disabled` with an `actionWord`.
2. Carried, code: `hasNode: node !== null` would draw an empty `self-start` View at AX sizes for a falsy non-null node such as `false`; no caller does that now.
3. Carried, docs: COMPONENTS.md does not yet mention `actionWord` or node stacking at AX; the coordinator says design-systems PR #719 updates it. I did not read #719.
4. Carried, test: `labelFor` mirrors what SpeechRow passes instead of rendering it; acceptable with no RN renderer in the repo.
5. Nit, wording: in Needs, "on a fresh install without the speech model" now follows the SE clause and reads as if it applied to the SE only; it applies to every step. A semicolon before "on a fresh install" would fix it.

### Not verified
- Whether iOS Voice Control resolves "Tap Stop" and "Tap Download" against the longer label, what VoiceOver says, and the AX5 layout on an SE 3. All phone-only (S1-97b (d) and (e)).
- Android/TalkBack, read from code only. Other workspaces, test:db, root typecheck, the full apps/mobile suite at this head (the earlier full run was at fa8ff806: 4253 pass, 61 environment failures, the same 61 on clean develop).

Reviewer: independent of the author (CR-44).
