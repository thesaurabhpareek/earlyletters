# Proposed DATA_CLASSIFICATION rows: the on-device analytics store

Owner: `privacy`. Status: proposal, docs only. Nothing here was run on a device.
Read at `origin/develop` `d05e0cee1` (24 Nov 2026), after #1809 (install id, BL-1239) and #1810 (policy-aware gate, BL-1238) landed.

## Why this file is here and not in the inventory

`docs/legal/DATA_CLASSIFICATION.md` section 4.6 is the inventory of record for device keys, but it sits under `docs/legal`, which this change does not edit. The rows below are written in its row format (`| key | level | what it holds ... |`) so `legal` and the founder can paste them. `data-map.yaml` and `scripts/check-data-map.mjs`, which `docs/engineering/04-data-quality-and-lifecycle.md` (DQ-R02, DQ-R03) names, do not exist on develop, so there is no second inventory to update and no checker to run for device keys.

## What is already in 4.6 and what this changes

Today 4.6 has one row for `scribe.analytics.id` and `scribe.analytics.retired_ids` ("up to 20 retired ids"). Three keys that the code writes have no row, and the "up to 20" wording no longer matches the code (see item 3 below).

| Key | In 4.6 today | Written at |
|---|---|---|
| `scribe.analytics.consent` | yes | `packages/analytics/src/consent.ts:34` |
| `scribe.analytics.id` | yes | `consent.ts:35` |
| `scribe.analytics.retired_ids` | yes, but says "up to 20" | `consent.ts:36` |
| `scribe.analytics.consent_meta` | no | `consent.ts:38` |
| `scribe.analytics.pending_acts` | no | `consent.ts:40` |
| `scribe.analytics.disclosure_shown` | no | `consent.ts:42` |

## Proposed rows (replace the `scribe.analytics.id, .retired_ids` row; add the other three)

| Key | Level | What it holds |
|---|---|---|
| `scribe.analytics.id` | L2 | The random install id: a lowercase random UUID from `Crypto.randomUUID` (`apps/mobile/src/lib/analytics/index.ts:75-80`, `consent.ts:191`), never an account, device or advertising id (`consent.ts:6-10`). Minted the first time the gate allows an event, not before (`client.ts:210-211`, `consent.ts:189-197`); also minted on a yes if none exists, and an id that already exists is kept on a yes (`consent.ts:256-258`). Absent after the person switches analytics off (`consent.ts:274-276`). In the `settings` table of `scribe.db` (`index.ts:47-51`, `store.ts:355-377`). Only analytics code reads it (`ConsentStore`); it is sent only as the PostHog distinct id after a yes and in the `analytics-forget` request (`index.ts:188-190`, `client.ts:284`). Removed by Erase everything (`consent.ts:311`) |
| `scribe.analytics.retired_ids` | L2 | JSON array of past install ids, newest first, kept only so account deletion can ask PostHog to delete their events (`consent.ts:12-17`). An id is added when analytics is switched off (`consent.ts:270-273`) and when a newer consent major asks again (`consent.ts:228-233`). Not capped when an id is added. The cap of 20 (`MAX_RETIRED_IDS`, `consent.ts:83`) is applied only by `settleRetired`, which removes the oldest id only after `forgetRetired` returns true, and does nothing without that callback (`consent.ts:288-303`). The mobile app passes no `forgetRetiredId` (`index.ts:75-83`), so on develop the list is only ever emptied by Erase everything or the post-deletion `forgetIds` (`index.ts:195`). Same table, same readers as the id. Removed by Erase everything (`consent.ts:312`) |
| `scribe.analytics.disclosure_shown` | L2 | The string `1` once the in-app disclosure of the `collect_by_default` policy has been shown (`consent.ts:41-42, 130-133`). It gates events only under `collect_by_default` (`gate.ts:29-37`). The build uses `ask_first` because no `basicsPolicy` is passed (`client.ts:134`, `index.ts:75-83`); the flip is the founder's (`client.ts:48`). Nothing in `apps/mobile/src` calls `recordDisclosureShown` today (read by `git grep`). On the phone only, no content. Cleared by Erase everything (`consent.ts:315-316`) |
| `scribe.analytics.consent_meta` | L2 | JSON `{version, decided_at}` of the last answer: the consent version string and a time (`consent.ts:169-171`). Read at launch to decide whether a newer major asks again (`consent.ts:226-228`). Removed by Erase everything (`consent.ts:317`) |
| `scribe.analytics.pending_acts` | L2 | Up to 50 consent answers not yet uploaded through `record_policy_act`, each with only `action`, `version`, `surface` and `client_recorded_at`; no id, text or name, and a stored object is rebuilt field by field on read (`consent.ts:46-61, 328-346`). Removed by Erase everything (`consent.ts:313-314`) |

## The five points asked for, in one place

| | Install id | Retired list | Disclosure flag |
|---|---|---|---|
| Holds | one random id | random ids, newest first | `1` |
| Where | `settings` table, `scribe.db` (`index.ts:47-51`) | same | same |
| Tier | L2 | L2 | L2 |
| Retention | until the person switches analytics off (becomes retired), or Erase; no time limit in code | until the server acknowledges a forget (only with a callback, not wired on mobile) or Erase | until Erase; no time limit in code |
| Who can read | analytics code in the app; the holder of an iPhone backup, because `scribe.db` is copied by it (`expo-adapter.ts:20-26`, `migrations.ts:372`, read in code, not run) | same | same |
| What Erase does | `stopAnalyticsForErase` revokes if granted (id moves to retired), then `forgetIds` removes id, retired list, pending acts, disclosure flag and meta and writes `consent` as `unknown` or `denied` (`index.ts:182-186`, `erase-everything.ts:146-150`, `consent.ts:306-319`). Nothing is sent about it (`index.ts:178-181`). The `settings` rows are then wiped with the rest (`erase-everything.ts:10`) | same | same |

One order-of-operations fact worth a reviewer's eye: in `eraseEverything` the analytics step runs inside a `try` that swallows any error (`erase-everything.ts:146-152`), and the later wipe of every `settings` row is a second path to the same result.

## Open questions for the Chief Privacy Officer (not decided here)

1. **The retired list has no ceiling.** Past 20, an id leaves the list only when the server acknowledges a forget; with no callback, or a refusal, it stays (`consent.ts:14-17, 282-303`). The mobile app wires no callback (`index.ts:75-83`) and the call itself is BL-1252 (`consent.ts:77`). Nothing in code trims on revoke any more (`consent.ts:270-273`). So the list can grow without bound on a phone where a person switches analytics off and on repeatedly, and the existing row's "up to 20" is not true of the code. Questions: is an unbounded list of retired ids on the phone acceptable until BL-1252, is there a hard ceiling we want regardless of acknowledgement, and what is the rule if the ceiling would force dropping an id whose events cannot then be forgotten?
2. **A yes keeps an id minted before consent.** `grant` keeps an existing id "because replacing it would orphan events that could then never be forgotten" (`consent.ts:257-258`), and `load` keeps an id that exists without a yes (`consent.ts:238`). Under `collect_by_default` the id is minted at the first allowed event after the disclosure (`gate.ts:29-37`, `client.ts:210-211`), so events sent before a yes and events after it share one id. On develop this is not reachable, because the build is `ask_first` (an event needs `granted`, `gate.ts:29-32`) and v1.0 sends no analytics at all (`index.ts:39-41` comment, the `capabilities.analytics` return in `startAnalytics`). Questions: is one id across the pre-yes and post-yes periods acceptable once `collect_by_default` is on, given that switching off retires the id so later periods cannot be joined (`consent.ts:12-13`)? Should a yes after pre-consent events start a new id and ask the server to forget the old one instead?
3. **Related, raised by this read, not by the reviewers.** Erase everything forgets every id locally and sends nothing (`index.ts:178-184`), so events held by the vendor under those ids cannot afterwards be named in an `analytics-forget` request from this phone. Whether that is intended for the no-account case is for the Chief Privacy Officer; the row above states it as it is.

## What I ran

- Read the files cited, at `d05e0cee1`. Nothing was run on a device.
- Section 4.6 and `data-policy.md` were not edited (under `docs/legal`).
