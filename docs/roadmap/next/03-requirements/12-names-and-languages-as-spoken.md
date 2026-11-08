# Theme 12: Names and languages kept the way my family says them

| | |
|---|---|
| Working label | NX-12 (id: to be assigned) |
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
| NX-12-R2 | HYPOTHESIS | Given a language outside English, When its harness (FB-02) runs on the minimum phone with recorded clips, Then the verifier accepts 0 meaning changes and the native reviewers sign. Until both, the language stays held. | Harness not built. | Feasibility R13 |
| NX-12-R3 | EVIDENCE | Given a name fixed once in Review, Then the dictionary holds it and the next letter containing that sound is checked against it; the test uses the Asha names and 0 appear in any log. | Dictionary exists; whether it shapes speech output is NOT VERIFIED. | Opportunity 17; CVL-03 |
| NX-12-R4 | EVIDENCE | Given a code-switched sentence (Hindi-English), When the verifier checks an edit, Then any edit that changes meaning is rejected, 0 accepted across the reviewed set. | Rule tables were written for single-language text. | Feasibility item 4 pre-mortem |
| NX-12-R5 | HYPOTHESIS | Given a word the speech did not catch, Then it shows as marked and the parent can tap to hear it. | Not built (CVL-06). | Opportunity 18 |
| NX-12-R6 | EVIDENCE | Given the signing keys, Then a pack served from the manifest verifies on a phone (S-08, S-11 PASS); a pack never ships on the Apple locale list alone. | `TRUSTED_SIGNING_KEYS` empty at the 27 Oct check; re-check. | Feasibility item 5 |

**Shown:** `languageCopy.*` (exists). **Records:** language choice is a setting; text language is a field on consent acts. **Never:** rewrite, translate or give a synthetic voice; send audio off the phone for language support without consent (server transcription is a separate theme). **Decline and withdraw:** staying on English changes nothing else.

## Edge cases

Scripts (Devanagari, Arabic right to left, Chinese); names with no dictionary form; a letter in two languages; Hindi on-device speech support has no source either way (FB-02); a phone below the minimum.

## Offline behaviour

Packs download on demand and wait for Wi-Fi if the parent chooses; recording continues with words catching up.

## What we never do

Promise a language not gated; count gaps; use a child's name in a log.

## Copy needs (packages/content)

Keys to add: `languageCopy.hold.note` (exists in spirit; check), `languageCopy.marked.word`, `languageCopy.names.remembered`.

## Analytics events (opt-in, content-free, names only)

Existing: `language_set`, `pack_download`, `dictionary_term_added`, `machine_edit_rejected`.

## Device rows

New: "language clip on SE 3 per language" (FB-02).

## Dependencies

Native reviewers; theme 6 (download choice). Feasibility R13.

## Founder-only decisions

| Decision | Recommended default |
|---|---|
| Which language goes first after English | Spanish or Hindi only after reviewers sign; no date promised |

## Not verified

Demand for non-English at launch; Hindi on-device support; reviewer availability.
