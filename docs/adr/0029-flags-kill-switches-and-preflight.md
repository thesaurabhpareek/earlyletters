# ADR 0029: Feature flags, kill switches and the preflight list, including phone-only features

- **Status:** Proposed, 20 Nov 2026. Decisions marked [CR-69] are ruled in `docs/agents/cto/RULINGS.md` CR-69 (A5, A12) and `docs/product/prd/ENGINEERING-QUESTIONS-CLOSED-20nov.md`; they are two-way until the code ships. Marked [E] they are ruled in `docs/product/prd/18-errata-after-lock.md` (E20, E21). Docs only: no code, no migration.
- **Author:** `mobile` with `sync` (drafted from `docs/product/prd/24-engineering-handoff.md` section 2, draft A1). Reviewers asked: `principal-architect`, `security-architect`, `privacy`.
- **Number:** the next free id from `node scripts/agents/next-id.mjs` on 20 Nov 2026 was 0029, and no file or open PR holds it. Cards and GAP-LOG cite "ADR 0029" as if it existed; this is that record. `docs/engineering/plans/inputs/C-platform-quality-delivery.md` section 1.4 reserved other numbers for sibling ADRs (0030 to 0039); this series takes ids in the order `next-id.mjs` gives them (CR-69 A11), so a card that cites a reserved number is read through the table in the PR description.
- **Amends:** ADR 0016 section 5.3 (`docs/adr/0016-lean-app-and-server-driven-content.md:127-129`), which says kill switches only stop server-dependent features.

## Context

- Build flags are `EXPO_PUBLIC_*` values read by `apps/mobile/src/lib/capabilities.ts`. `buildFlagEnabled` (`capabilities.ts:186`) returns false whenever server features are off, and `mayRun` is true only when the build flag is on.
- TestFlight builds run with servers off, so a phone-only feature gated through `mayRun` would be hidden in the very builds that test it (E20).
- `packages/api/src/kill-switches.ts:1-8` says each switch "only stops a server-dependent feature". Open PRs already hide phone-only screens with a switch (`bookSearch` in #894, photos in #837, UNVERIFIED here: not merged to `develop`; `apps/mobile/src/lib/find/` has no `flag.ts` today).

## Decision

1. **Two flag families.** Server-gated features keep `mayRun`. Phone-only features use a local `EXPO_PUBLIC_*` flag read directly (exact string `on`). [E] E20. A remote pause on a phone-only feature exists only where its card adds one, and `photos` and `bookSearch` stay as built ([CR-67] AX-4, `docs/agents/cto/RULINGS.md:655`); it is read outside `mayRun` through an injected `RemoteConfigReader`. [Proposal: the reader shape, from handoff draft A1.]
2. **A pause only hides.** A switch can hide a feature, never turn one on, and never stops export (LEGAL-REQ-040). The `kill-switches.ts` header is rewritten to say so. [E] E21, [CR-67] AX-4. Unreadable or older config counts as not paused (fail-open for the person's own words). [Proposal: handoff draft A1.]
3. **One flag set for the new scope.** `EXPO_PUBLIC_PHOTO_MOMENTS`, `EXPO_PUBLIC_VIDEO`, and the kill switches `photoMoments`, `videos`, `signIn`, `libraryDays`. `EXPO_PUBLIC_MEDIA_ATTACH` and the handoff names are retired. `killSwitches.mediaSync` and `EXPO_PUBLIC_MEDIA_SYNC` exist for variant B only (pictures leave the phone), which is the founder's choice and is not chosen here. [CR-69] A5.
4. **One PR adds the new keys with the drift test:** `remote-config.test.ts`, `contract-drift.test.ts`, the "Eight keys" line in `packages/api/README.md`, `KILL_SWITCH_FLAG`, and the older-signed-config rule. Whichever of the days and first-run stacks merges second rebases. The older-signed-config rule is [CR-69] A5. Keys are additive only: an older config parses a missing key as off (API-R11, `docs/engineering/02-api-and-contracts.md:55`). [Proposal beyond A5.]
5. **The scheduler re-plans when remote config changes**, through `remoteConfigDoc.subscribe` (`apps/mobile/src/lib/remote/index.ts:132`), inside the existing debounce. [CR-69] A12 (handoff Q-E4 default).
6. **The preflight list names every flag** with its hidden state, so the gate record shows which flags a build ships on. [Handoff draft A1 and C-6; not separately ruled, so a proposal of this ADR.]
7. [Proposal] The remote `flags.lockScreenNamesDefault` (`packages/api/src/remote-config.ts`) never becomes a path to turn on day names (NS-47-R12); see ADR 0033.

## Consequences

- Phone-only features can be tested on TestFlight with servers off. A pause arriving mid-session cancels pending notes within the debounce, where today nothing subscribes the scheduler to config.
- The header of `packages/api/src/kill-switches.ts` and ADR 0016 5.3 are edited by the PR that adds the keys, not by this ADR.
- The names for `reminders` and `media` pause keys in handoff draft A1 are not in CR-69 A5; the PR that needs them takes the names from the card, or asks.

## Not decided here

Which drop a first-run card ships in, and the flag for the Days ask (CR-69 A13, filed on #934 and #935).
