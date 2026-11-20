# Theme 12: Names and languages kept the way my family says them

Readiness: names part (R3, R4 as a guard, R6) 24 of 28; languages part (R2, R5) NOT READY, 15 of 28 (audit 8 Nov: 14 for the file). Author's re-score, `qa` to confirm. Remains: the FB-02 harness and native reviewers (C14); the founder's pick below.

### Blocked on (languages only; exact question, recommended default)

| # | Question | Who answers | Recommended default | Rows it holds |
|---|---|---|---|---|
| B-1 | Which language goes first after English, and who are its native reviewers? | Founder | Spanish or Hindi, only after named reviewers sign; no date promised, no store claim. | R2, R5 |
| B-2 | Does on-device speech recognition exist for Hindi on the minimum phone, and how does a code-switched clip score? There is no source either way; the FB-02 harness is how it is learned and it is not built. | `speech` (build the harness) | Build FB-02 first (feasibility R13, size M). Until it reports, Hindi stays held and build 12 stays English only. | R2, R4 for code-switched text |
| B-3 | What does "marked, not dropped" look like (R5)? | `speech` and `design-systems` | A display-layer marker on the span the speech missed, never a change to `raw_transcript`, tap to hear the audio; defined with CVL-06 before any row is handed out. | R5 |

The names part is finished and can start now.

| | |
|---|---|
| Working label | NX-12 (working id, see `_CONVENTIONS.md`; R3, R4, R6 names and packs, R2 and R5 languages) |
| Refines | F05, F07 (dictionary), F33, F38, D-115, D-121 item 2(d), CVL-01, CVL-03, FB-02 |
| Tag | EVIDENCE for the risk: off-the-shelf speech scored a 52% error rate on Hindi-English mixed speech (Interspeech 2025 paper, as recorded in UR S12); drops proper nouns at switches. HYPOTHESIS for demand: 0 of 156 newer reviews mention language (R7 theme 15). Benchmark: five voice-first baby listings are English only (`02-benchmark.md` opening 9) |
| Size | L (feasibility item 4; item 5 is M per language; the FB-02 harness is M) |
| Gate | Native reviewers per language (D-121). Counsel for any claim. No Apple gate beyond accurate listing text |
| Order | 12 of 12 |

## What the parent will see and do

Build 12 is English only and says so. A family that speaks another language sees a note in the picker, never a promise. When a language passes its gate, it appears; names they have fixed once are spelled their way; a word the speech missed is marked, not dropped.

## The check

| Label | Tag | Given, When, Then | Fails on old code because | Source |
|---|---|---|---|---|
| NX-12-R1 | EVIDENCE | Given the production profile, Then English-only is on, the picker lists English with a note, and the listing names 1 language (claims test #498, 3 of 3 checks). | Merged (#498); keep it green against production capabilities. | Gap map 1.9 |
| NX-12-R2 | HYPOTHESIS | Given a language outside English, When its harness (FB-02) runs on the minimum phone with recorded clips, Then the verifier accepts 0 meaning changes and the native reviewers sign. Until both, the language stays held. | HELD (B-1, B-2). Harness not built. | Feasibility R13 |
| NX-12-R3a | EVIDENCE (guard) | Given a term in the dictionary, When the engine proposes an `stt_fix` whose replacement is not a dictionary term, Then `verifyEdits` rejects it (`stt_fix_not_dictionary`); and the speech prompt for a recording includes the dictionary names (`dictionaryPrompt`, `chunkPrompt`) while an echo of the name list in the output is dropped. | PASSES on develop: `packages/core/src/verify.ts` (`stt_fix_not_dictionary`, tested in `packages/core/test/core.test.ts` and `providers.test.ts`) and `apps/mobile/src/lib/transcribe-whisper.ts` lines 154 to 156. Guard only. | Opportunity 17; CVL-03; F07-REQ-003, -004 |
| NX-12-R3b | EVIDENCE | Given Add to your words on a selected word in Review, When the parent saves, Then the term and the re-cleaned draft commit in one local transaction (a kill between leaves neither), the next letter containing that sound is checked against the term, and 0 characters of the term appear in any log. The test uses the Asha names. | NOT BUILT: `review.tsx` builds its dictionary on the fly from the child's name, birthday and signs-as through `dictionaryFor` (`apps/mobile/src/lib/store`), and no Add to your words path was found by search; F07-REQ-001 (a local dictionary table) and -005 are specified and unbuilt. | F07-REQ-001, -005, -006; opportunity 17 |
| NX-12-R4 | EVIDENCE | Given a code-switched sentence (Hindi-English), When the verifier checks an edit, Then any edit that changes meaning is rejected, 0 accepted across the reviewed set. | Rule tables were written for single-language text. | Feasibility item 4 pre-mortem |
| NX-12-R5 | HYPOTHESIS | Given a word the speech did not catch, Then it shows as marked and the parent can tap to hear it. | Not built (CVL-06). | Opportunity 18 |
| NX-12-R6 | EVIDENCE | Given the signing keys, Then a pack served from the manifest verifies on a phone (setup steps S-08 keys and S-11 manifest on `packs.earlyletters.app`, to be run); a pack never ships on the Apple locale list alone. Custody of the signing key is `security`'s. | `TRUSTED_SIGNING_KEYS` in `packages/api/src/keys.ts` holds 2 keys (`el-2026-11`, `el-2026-11-backup`), re-checked 8 Nov, so the 27 Oct finding "empty" is stale; what is not shown is a pack verifying on a phone. | Feasibility item 5 |

**Shown:** `languageCopy.*` (exists). **Records:** language choice is a setting; text language is a field on consent acts. **Never:** rewrite, translate or give a synthetic voice; send audio off the phone for language support without consent (server transcription is a separate theme). **Decline and withdraw:** staying on English changes nothing else.

## Edge cases

Scripts (Devanagari, Arabic right to left, Chinese); names with no dictionary form; a letter in two languages; Hindi on-device speech support has no source either way (FB-02); a phone below the minimum.

## Offline behaviour

Packs download on demand and wait for Wi-Fi if the parent chooses; recording continues with words catching up.

## What we never do

Promise a language not gated; count gaps; use a child's name in a log.

## Copy needs (packages/content)

Existing, checked 8 Nov in `features/language.en.ts`: `waitingForLanguage`, `safeModeNote`, the picker group and the status group. `languageCopy.hold.note` was NOT found by search, so it is `new`, together with `languageCopy.marked.word` (held with B-3) and `languageCopy.names.remembered`. Words by `content`; no claim of a language that is not gated.

## Analytics events (opt-in, content-free, names only)

Existing and in catalog (checked 8 Nov): `language_set`, `pack_download`, `dictionary_term_added`, `machine_edit_rejected`.

## Device rows

New: "language clip on SE 3 per language" (FB-02).

## Dependencies

Native reviewers; theme 6 (download choice). Feasibility R13.

## Founder-only decisions

| Decision | Recommended default |
|---|---|
| Which language goes first after English | Spanish or Hindi only after reviewers sign; no date promised |

## Engineering block (cross-cutting, added 8 Nov 2026 after the readiness audit, G-31 to G-37)

| Line | This theme |
|---|---|
| API contract (`packages/api`) | Packs: `packages/api/src/pack-manifest.ts` and `keys.ts` exist, with `manifest-verification.test.ts` and `keys.test.ts`. No new type. A new language adds a manifest entry only. Names: none (local). |
| Budget (`06-nfr.md`) | Add a name from Review to re-cleaned text: p95 150 ms for a 3-minute transcript. Clean and mark a 300-word transcript: p95 300 ms (Hermes release). Downloaded on demand sizes are in section 11.2; the app stays under 40 MB (a pack is never in the IPA). |
| Accessibility | Add to your words sheet and the language picker note: AX5 with 0 clipped lines; VoiceOver reads the selected word before Save; right-to-left letters render correctly (RTL gate); tap targets 44 pt or more; Reduce Motion: fade only. Marked words (R5) are never colour-only. |
| Switch, off behaviour, noticed by | Switch: the English-only build flag (`englishOnlyEnabled()` in `capabilities.ts`) and the signed pack manifest (a language appears only when its pack is served and verified). Off: the picker shows English with a note. Rollback: remove the manifest entry; phones keep what they downloaded but new downloads stop. Noticed by: `machine_edit_rejected` and `pack_download` when analytics are on; in 1.0 by the FB-02 reports. |
| Data class and retention | Dictionary terms (names): L4, on the phone only, never in a log or analytics; removed with the app. Language choice: a setting, L2; text language is a field on consent acts. No audio leaves the phone for language support. |
| Schema and grants | Local: F07-REQ-001 adds a dictionary table (device migration in `db/migrations.ts` with a test; no grants). No server schema in this theme. |
| Analytics events | language_set, pack_download, dictionary_term_added, machine_edit_rejected: in catalog. No new events. The term itself is never a property. |

## Trace and tests

Id convention: `_CONVENTIONS.md`. A test title starts with the bracketed id. Paths marked "proposed" do not exist yet; the PR that adds the test names the real path.

| Id | Refines | Test (layer, file, title) | Device or ops row |
|---|---|---|---|
| NX-12-R1 | D-121; #498 | `packages/content/test/claims-capabilities.test.ts` (exists); `[NX-12-R1] English-only: picker lists English with a note; listing names 1 language` | none |
| NX-12-R2 | feasibility R13 | HELD (B-1, B-2); FB-02 harness on the minimum phone; `[NX-12-R2] verifier accepts 0 meaning changes; reviewers sign` | new: language clip on SE 3 per language |
| NX-12-R3a | CVL-03; F07-REQ-004 | `packages/core/test/core.test.ts` (exists; add the bracket); `[NX-12-R3a] stt_fix to a non-dictionary term is rejected` | none |
| NX-12-R3b | F07-REQ-001, -005, -006 | mobile unit (proposed `apps/mobile/test/add-to-words.test.ts`); `[NX-12-R3b] term and re-cleaned draft commit in one transaction` | new: add a name in Review |
| NX-12-R4 | feasibility item 4 | core regression snapshots (`packages/core/test/regression/`); `[NX-12-R4] no meaning-changing edit accepted across the code-switched set` | none |
| NX-12-R5 | CVL-06 | HELD (B-3); Test: none yet | none |
| NX-12-R6 | feasibility item 5 | `packages/api/test/keys.test.ts` and `manifest-verification.test.ts` (exist; add the bracket) plus a device row; `[NX-12-R6] a served pack verifies` | setup S-08, S-11 |

Trace: NX-12-R1..R6 -> F05, F07 (F07-REQ-001 to -008), F33, F38, D-115, D-121 item 2(d), CVL-01, CVL-03, FB-02.

## Not verified

Demand for non-English at launch; Hindi on-device support; reviewer availability.
