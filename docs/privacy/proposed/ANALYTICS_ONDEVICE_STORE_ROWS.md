# Proposed DATA_CLASSIFICATION rows: the on-device analytics store

Owner: `privacy`. Status: proposal, docs only. Nothing here was run on a device.
Read at `origin/develop` `44c497eea` (24 Nov 2026), after #1809 (install id, BL-1239) and #1810 (policy-aware gate, BL-1238) landed. Every cited line was re-opened at that head; the analytics package and the mobile analytics and erase files had no change since `d05e0cee1`.

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
| `scribe.analytics.id` | L2 | The random install id: a lowercase random UUID from `Crypto.randomUUID` (`apps/mobile/src/lib/analytics/index.ts:75-80`, `consent.ts:191`), never an account, device or advertising id (`consent.ts:6-10`). Minted the first time the gate allows an event, not before (`client.ts:210-211`, `consent.ts:189-197`); also minted on a yes if none exists, and an id that already exists is kept on a yes (`consent.ts:256-258`). Absent after the person switches analytics off (`consent.ts:274-276`). In the `settings` table of `scribe.db` (`index.ts:47-51`, `apps/mobile/src/lib/store.ts:355-377`). Only analytics code reads it (`ConsentStore`); it is sent only as the PostHog distinct id when the gate allows an event (a yes under `ask_first`; under `collect_by_default`, basics events after the disclosure with no yes, `gate.ts:35-37`) and in the `analytics-forget` request (`apps/mobile/src/lib/analytics/index.ts:188-190`, `packages/analytics/src/client.ts:284`). Removed by Erase everything (`consent.ts:311`), by the post-deletion `forgetAllIds` (`index.ts:194-197`), and when a newer consent major asks again (`consent.ts:233`) |
| `scribe.analytics.retired_ids` | L2 | JSON array of past install ids, newest first, kept only so account deletion can ask PostHog to delete their events (`consent.ts:12-17`). An id is added when analytics is switched off (`consent.ts:270-273`) and when a newer consent major asks again (`consent.ts:228-233`). Not capped when an id is added. The cap of 20 (`MAX_RETIRED_IDS`, `consent.ts:83`) is applied only by `settleRetired`, which removes the oldest id only after `forgetRetired` returns true, and does nothing without that callback (`consent.ts:288-303`). The mobile app passes no `forgetRetiredId` (`index.ts:75-83`), so on develop the list is emptied only by Erase everything or by the post-deletion `forgetIds` (`index.ts:194-197`). The deletion path sends at most 21 ids: `forgetAnalytics` sends `analytics.ids().slice(0, 21)` (`apps/mobile/src/lib/account-deletion/api.ts:156`), the server accepts 1 to 21 (`supabase/functions/analytics-forget/handler.ts:14, 34`), and on success `analytics.forget()` runs `forgetAllIds` and clears the whole list (`api.ts:162-164`). `ids()` is the current id first, then retired newest first (`consent.ts:204-207`), so when the phone holds more than 21 ids in all (more than 20 retired ids alongside a live id, or more than 21 retired with none), the oldest are removed locally without being named to the vendor. Same table, same readers as the id. Removed by Erase everything (`consent.ts:312`) |
| `scribe.analytics.disclosure_shown` | L2 | The string `1` once the in-app disclosure of the `collect_by_default` policy has been shown (`consent.ts:41-42, 130-133`). It gates events only under `collect_by_default` (`gate.ts:29-37`). The build uses `ask_first` because no `basicsPolicy` is passed (`client.ts:134`, `index.ts:75-83`); the flip is the founder's (`client.ts:48`). Nothing in `apps/mobile/src` calls `recordDisclosureShown` today (read by `git grep`). On the phone only, no content. Cleared by Erase everything (`consent.ts:315-316`) and by the post-deletion `forgetIds`, which calls the same `forgetAllIds` (`index.ts:194-197`) |
| `scribe.analytics.consent_meta` | L2 | JSON `{version, decided_at}` of the last answer: the consent version string and a time (`consent.ts:169-171`). Read at launch to decide whether a newer major asks again (`consent.ts:226-228`). Removed by Erase everything (`consent.ts:317`) and when a newer consent major asks again (`consent.ts:235`) |
| `scribe.analytics.pending_acts` | L2 | Up to 50 consent answers not yet uploaded through `record_policy_act`, each with only `action`, `version`, `surface` and `client_recorded_at`; no id, text or name, and a stored object is rebuilt field by field on read (`consent.ts:46-61, 328-346`). Removed by Erase everything (`consent.ts:313-314`) |

## The five points asked for, in one place

| | Install id | Retired list | Disclosure flag |
|---|---|---|---|
| Holds | one random id | random ids, newest first | `1` |
| Where | `settings` table, `scribe.db` (`index.ts:47-51`) | same | same |
| Tier | L2 | L2 | L2 |
| Retention | until the person switches analytics off (becomes retired), a newer consent major asks again (`consent.ts:228-233`), Erase, or the post-deletion `forgetIds`; no time limit in code | until the server acknowledges a forget (only with a callback, not wired on mobile), Erase, or the post-deletion `forgetIds`, which sends at most 21 ids in all and then clears the whole list (`api.ts:156, 162-164`, `handler.ts:34`) | until Erase; no time limit in code |
| Who can read | analytics code in the app; the holder of an iPhone backup, because `scribe.db` is copied by it (`apps/mobile/src/lib/db/expo-adapter.ts:20-26`, `apps/mobile/src/lib/db/migrations.ts:372`, read in code, not run) | same | same |
| What Erase does | When the erase is not already pending (`apps/mobile/src/lib/erase-everything.ts:146`), `stopAnalyticsForErase` revokes if granted (id moves to retired), then `forgetIds` removes id, retired list, pending acts, disclosure flag and meta and writes `consent` as `unknown` or `denied` (`index.ts:182-186`, `apps/mobile/src/lib/erase-everything.ts:147-151`, `consent.ts:306-319`). Nothing is sent about it (`index.ts:178-181`). The `settings` rows are then wiped with the rest (`apps/mobile/src/lib/erase-everything.ts:10`) | same | same |

Order of operations: in `eraseEverything` the analytics step runs inside a `try` that swallows any error (`apps/mobile/src/lib/erase-everything.ts:146-152`), and it is skipped on a resumed erase (`if (!eraseEverythingPending())`, line 146). In both cases the later wipe of every `settings` row (`erase-everything.ts:10`) is a second path to the same result, so the keys go either way.

Test coverage, read not run: `apps/mobile/test/erase-all.test.ts:79` mocks `../src/lib/analytics`, and line 454 seeds the key `analytics.id`, not `scribe.analytics.id`. No test runs `stopAnalyticsForErase` against the real `ConsentStore` and the real settings table together, so "Erase removes all of these keys" is true by reading and by two half-tests, not end to end. A follow-up test is for `qa` and `analytics`.

## Other analytics keys on the phone (not changed here)

Three more keys sit in the same table. They already have rows in 4.6 (lines 804 and 805 at the time of reading) and this proposal leaves them as they are:

- `scribe.analytics.first_launch_at` and `scribe.analytics.last_active_at` (`packages/analytics/src/lifecycle.ts:19-22`), written at `lifecycle.ts:67, 100`.
- `scribe.analytics.consent_offers` (`packages/analytics/src/consent-timing.ts:22`), read at `apps/mobile/src/lib/analytics/ask.ts:19`.

None of the three is removed by `forgetAllIds` (`consent.ts:306-319` lists the keys it removes). They go only with the settings wipe on Erase everything.

## Open questions for the Chief Privacy Officer (not decided here)

1. **The retired list has no ceiling, and the deletion path already drops ids unsent.** Past 20, an id leaves the list only when the server acknowledges a forget; with no callback, or a refusal, it stays (`consent.ts:14-17, 282-303`). The mobile app wires no callback (`index.ts:75-83`) and the call itself is BL-1252 (`consent.ts:77`). Nothing in code trims on revoke any more (`consent.ts:270-273`). So the list can grow without bound on a phone where a person switches analytics off and on repeatedly, and the existing row's "up to 20" is not true of the code. Separately, at account deletion `forgetAnalytics` sends only `ids().slice(0, 21)` (`apps/mobile/src/lib/account-deletion/api.ts:156`), the server refuses more than 21 (`supabase/functions/analytics-forget/handler.ts:34`), and on success the whole list is cleared (`api.ts:162-164`, `index.ts:194-197`). Today a phone with more than 21 ids in all loses the oldest locally without them ever being named to the vendor, so their events cannot be deleted by us afterwards. Questions: is an unbounded list on the phone acceptable until BL-1252; should deletion send the ids in batches of 21 and clear only those acknowledged, or is dropping the oldest accepted; and what is the rule for a ceiling that would force dropping an id whose events cannot then be forgotten?
2. **A yes keeps an id minted before consent.** `grant` keeps an existing id "because replacing it would orphan events that could then never be forgotten" (`consent.ts:257-258`), and `load` keeps an id that exists without a yes (`consent.ts:238`). Under `collect_by_default` the id is minted at the first allowed event after the disclosure (`gate.ts:29-37`, `client.ts:210-211`), so events sent before a yes and events after it share one id. On develop this is not reachable, because the build is `ask_first` (an event needs `granted`, `gate.ts:29-32`) and v1.0 sends no analytics at all (`index.ts:39-41` comment, the `capabilities.analytics` return in `startAnalytics`). Questions: is one id across the pre-yes and post-yes periods acceptable once `collect_by_default` is on, given that switching off retires the id so later periods cannot be joined (`consent.ts:12-13`)? Should a yes after pre-consent events start a new id and ask the server to forget the old one instead?
3. **Related, raised by this read, not by the reviewers.** Erase everything forgets every id locally and sends nothing (`index.ts:178-184`), so events held by the vendor under those ids cannot afterwards be named in an `analytics-forget` request from this phone. Whether that is intended for the no-account case is for the Chief Privacy Officer; the row above states it as it is.

## What I ran

- Read and re-opened the files cited, at `44c497eea`. Nothing was run on a device.
- `node scripts/guards/docs-leak-guard.mjs` (clean), `npm test -w @scribe/content` (552 passed), and a scan of this file for dashes, curly quotes, ellipsis characters and emoji (clean).
- Section 4.6 and `data-policy.md` were not edited (under `docs/legal`).
