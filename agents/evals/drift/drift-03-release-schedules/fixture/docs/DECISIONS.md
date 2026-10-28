# Decisions (excerpt of the index rows; the full record is not in this slice)

| D-089 | Release engineering model (ADR 0022): preview lane for C0 and C1; store lane from `release/<major>.<minor>` cut at freeze; one version in `apps/mobile/version.json` (note, 24 Oct: after #109; until then `apps/mobile/app.config.ts:162`); EAS build numbers; `ios-v<x.y.z>-rc.<n>` tags build candidates; the tested RC is the binary submitted; `ios-v<x.y.z>` on release; store text generated from `packages/content` | Decided (founder) | Yes | 2026-10-13 |
| D-106 | Alpha in two weeks: option B ships as a TestFlight alpha against staging, target Thu 29 Oct 2026; submission re-planned after the alpha; review delegation widened to app code | Decided (founder, build thread, 15 Oct 2026); the delegation widening is proposed by the coordinator and awaits the founder's confirmation | Yes for the alpha; the delegation waits | 2026-10-15 |

