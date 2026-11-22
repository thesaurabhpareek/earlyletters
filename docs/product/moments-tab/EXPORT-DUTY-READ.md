# NS-53 Moments tab: does a typed day label create an export duty? (data-architect read before PR 8)

Status: a reading and a recommendation, docs only. It is not legal advice and it decides nothing the founder or counsel decide. No migration, grant, classification edit or code was changed.
Date: 21 Nov 2026. Base: `origin/develop` at `f59e000de`.
READ means I read the line cited in this worktree. UNVERIFIED means I did not read the primary text (every statute and every counsel view below is UNVERIFIED; I read none).
Read: `docs/legal/DELETION_AND_EXPORT_SPEC.md` lines 198, 255, 371 and DATA-REQ-050 to 052 with sections 4.1 and 4.2; `docs/engineering/08-data-rights-and-legal-requests.md:55` (DSR-R14); `docs/product/moments-tab/ALIGNMENT-data.md`; spec `docs/product/prd/28-moments-tab.md` lines 904, 934, 1286 (R250), 614 (R115), 1029; `docs/BACKLOG.md:7298`; `docs/adr/0032-on-device-sensitive-store.md`; `docs/legal/data-policy.md` 4.4; `apps/mobile/src/lib/erase-everything.ts` (header and imports).
The council ruling the task cites (labels excluded from export and iPhone backup in the first release): I did not find it as a ruling in `docs/`. What I found is the spec text at `28-moments-tab.md:934` ("in no backup and no export (R250)") and R250 at line 1286, which offers two options and names the plain statement as the default. I treat the ruling as the plain statement. UNVERIFIED as a recorded decision.

## 1. The question

`labels{}` in `moments.json` holds a day key mapped to up to 60 characters the parent typed (the spec says it "can hold a child's name", brief line 169). It is L4, on the phone only, excluded from iPhone backup, and the first release excludes it from the export. Does leaving it out of the export break a duty we have written down, or one the law puts on us?

## 2. What the written spec says (READ)

| Line | Text, in effect | What it does to labels |
|---|---|---|
| `DELETION_AND_EXPORT_SPEC.md:198` | Delete-account step 3 "Export first": "Export everything is the primary button". | The button is named "everything". A parent who types a label and then deletes the account is told to export everything first. |
| `:255` (DATA-REQ-023) | After deletion executes, a signed-in device "offers one local Export of what is still on the phone, and then wipes the local database, audio, photos, Keychain items for that account and the analytics id". | The export is the last chance to keep anything on the phone. The wipe list names no device file, so it is also silent on `moments.json` (see section 6, item 5). |
| `:371` / `:375` (DATA-REQ-052) | "export of everything on the phone completes" in airplane mode. | Read literally, "everything on the phone" includes `moments.json`. In context the sentence is about offline completeness and audio, not about scope. |
| `:364` (DATA-REQ-050) | Export contents are "As 4.1 and 4.2". | 4.2 is a closed list: children, entries, letters, audio, photos, book PDF, history. No labels. The spec's proposed README line already says "The app's search index and the choices you hid are not part of this file." |
| `engineering/08...:55` (DSR-R14) | Answer an access request by pointing to Export everything, "rather than a hand-built file ... the export is complete by design". | The access answer rests on the export being complete. If labels sit outside it, "complete by design" is false for the parent's own typed words, unless the answer says what is not in it. |

## 3. The engineering reading

1. The package list in 4.2 does not include labels, so no requirement id, as written, makes the build fail if labels are missing. There is no hard duty in the spec text.
2. There is a soft duty made of three of our own sentences: the button says "everything" (`:198`), the airplane-mode requirement says "everything on the phone" (`:375`), and the access answer says the export is "complete by design" (DSR-R14). A label is not a letter, but it is not the search index either. The ones in the README sentence (search index, hidden choices) are choices and derived data. A label is the parent's own typed words. I read the README precedent as covering `dayKeys`, `hiddenPlaces` and `homePlace`, and not covering `labels{}`.
3. The two protections stack against the parent. Excluded from backup means a lost or replaced phone loses every label (ADR 0032 consequence: a restored phone shows an empty store). No export means there is no other way out either. Typed words that cannot be backed up and cannot be exported can only ever be kept by not changing phones. That is a promise problem more than a legal one, and it is the strongest argument for exporting.
4. The legal side is not mine to read. Whether data kept only on the device and never received by us falls inside an access or portability request at a US-only launch (CLO says GDPR is out, `exec-review/clo.md` line 189, H-5), and whether "Export everything" is a promise that the omission makes untrue, are questions for counsel. UNVERIFIED.

Conclusion: I do not find a duty that the written spec enforces. I do find that excluding labels is only safe if we narrow what we promise (the wording in section 5, route A) or accept the soft duty and export them (route B). Choosing between them changes what users are promised, which CR-73 keeps with the founder. So this goes back to the founder: not because I found a hard duty, but because both routes need his call, and route A needs counsel to confirm the narrowed wording is enough. Until he answers, PR 8 can merge the store, since PR 8 has no label typing UI (section 4).

## 4. Cost of each route

| | Route A: not exported (default of R250, the council reading) | Route B: exported as a labelled section |
|---|---|---|
| Engineering | None in PR 8 beyond a test that the export builder never reads `moments.json` (the R162 canary stays). | A read-only labels read through the store's single reader (ADR 0032 item 7 needs a stated exception), a `data/day-labels.json` file, its entry in `schema/export-v1.schema.json` and the manifest, a README line, an owner check that fails closed, round-trip and owner-mismatch tests. About 3 to 4 files, and the R162 canary is rewritten to allow exactly this one read. |
| Contract change | Wording only (below). | A change to the export package contract (4.2). The mobile engineer owns the builder; I would review the schema and the classification rows. |
| Words to change | DATA-REQ-052 "everything on the phone" narrowed (for example to letters, recordings and pictures); the "Export everything" button and its confirm copy checked by `content`; the DSR-R14 answer lists what is not in the copy; the privacy policy gets one plain line. Owners: `privacy`, `content`, `legal`. | One README line; the policy says labels are in the copy. The label text is the parent's own words in their own file, no new disclosure to anyone. |
| Parent harm | A parent who changes phones or erases loses their own typed words with no way to keep them. | None new. A label can hold a child's name and a hospital place, so a saved file the parent shares carries it: that is their choice, as with letters. |
| Counsel | Must confirm the narrowed wording is enough and that device-only data is out of scope of an access request. Risk if wrong: an access request we answered "we hold nothing" while the app promised "everything". | Little to confirm. Risk if wrong: none that I can see beyond the standard export confirmations. |
| Reversibility | Reversible: adding an export later is a new file in the package, no migration. The words already shipped are the cost. | Hard to take back: once a package carries `day-labels.json`, parents hold it. Removing the section later is a contract break. |

My recommendation, with the limits stated: route B is the cheaper route to a true promise, and route A is cheaper to build and wrong only if the words are not narrowed. I lean B because of the backup point in section 3, item 3. That is an engineering lean, not a ruling; counsel and the founder decide.

## 5. What PR 8 must do under each route

Common to both (these are owed whatever is chosen; the rows are PR 8's under the ruling recorded in `ALIGNMENT-data.md`):
- Store `moments.json` with the contract of section 17.1 and no album or picture members. No SQL, no `supabase/migrations` file, no `grants.mjs` line, no `public` column (nothing for `classification.test.mjs` to read).
- Edit `apps/mobile/src/lib/erase-everything.ts` (`eraseDeviceFiles`, line 62, beside `eraseDaysFile` at line 42) and `apps/mobile/test/erase-all.test.ts`: a scan finds zero bytes after Erase, sign-out, Delete account, Turn off (R115).
- One `DATA_CLASSIFICATION.md` 4.6 row per field class (R250), each with level, retention, deletion path, deletion test and an Export column that says which route was chosen. Unknown preserved fields are L4 by default.
- A `data-policy.md` 4.4 Devices row for the store (DATA-REQ-001), so the inventory source of truth has it; `privacy` words it.
- Amend ADR 0032 or write a new ADR. The ADR is Proposed and says the moments index holds "local asset ids" (line 12 area), while R247 stores no picture or album identifier in the first release. That sentence is stale for this store. `privacy` decides the wording.

Route A adds: the export-builder-never-reads-moments test; PR 8's body states the plain statement and lists the three documents whose words change (spec DATA-REQ-052, the Export everything copy, the policy line). No label typing UI ships until counsel has read the narrowed wording (G2 or G8 style gate; the default for an unanswered counsel item is "that part stays dark", R171).

Route B adds: the read-only labels read, `data/day-labels.json`, the schema and manifest entry, the README line, round-trip, owner-mismatch and "labels never reach the outbox, pull merge or push mapper" tests (R162 stays true for those three). If this takes PR 8 past its 250 line budget, split it as 8b (export). Whichever route: the PR that lets a parent type a label depends on this decision having landed, so no label is ever written before the route it lives under exists. PR 8 itself writes none.

## 6. PR 8 design check: deletion cascade and classification rows

There is no table. PR 8 is a file, so "cascade" means which events delete it.

1. No cross-author cascade, and none is needed: the file belongs to one phone and one `owner`. `raw_transcript` is untouched.
2. Day keys are library days, not letter or book ids. Deleting a letter, leaving a family, removing a contributor and deleting a book must not touch `labels{}`; that is correct, and the PR should say so in its tests (a delete of each leaves the file unchanged).
3. R249 says the home place is "one value per book", while the 17.1 contract has a single `homePlace`. If it is per book, a book deletion must clear that book's value. If it is per phone, R249 is misworded. One of them needs fixing before PR 8 is written. UNVERIFIED which is intended.
4. R115 and ADR 0032 item 3 list sign-out, Erase, Delete account, Turn off and Pause, delete first, before any await. That covers what a parent triggers on the phone.
5. DATA-REQ-023 (`:255`) is the gap: when a deletion executed elsewhere reaches the phone, it "wipes the local database, audio, photos, Keychain items for that account and the analytics id". It names no device file. Whether that path calls `eraseDeviceFiles` I did not read (UNVERIFIED). If it does not, labels survive an account deletion. Owed: add the device files to the DATA-REQ-023 sentence, and a test that the executed-elsewhere path leaves no `moments.json`. Under route B the "one local Export of what is still on the phone" must include labels, or the parent gets one export that leaves them out and then the wipe.
6. `owner`: the spec says "opaque local id, never a person id" and does not say how it is derived (`ALIGNMENT-data.md`, section 5). Without a rule the owner check of ADR 0032 item 3 cannot be tested. Owed in the ADR amendment.
7. Retention and caps are "per field in 17.2". Each 4.6 row needs the actual expiry and cap, not a pointer.

## 7. Owed items

| # | Owed | Owner | When |
|---|---|---|---|
| 1 | Founder decision: route A or B | founder | Before the label typing PR; PR 8 can merge first |
| 2 | Counsel: device-only data and an access request; whether the narrowed or full "everything" wording holds; whether no-backup and no-export is acceptable | counsel via `legal` | Before the typing PR ships; default if unanswered, labels stay dark |
| 3 | 4.6 rows (one per field class) and a `data-policy.md` 4.4 Devices row, each with an Export column | `data-architect` drafts, `privacy` rules the levels and words | In PR 8 |
| 4 | ADR 0032 amendment or new ADR: stale "asset ids" line, `owner` derivation, single-reader exception if route B | `data-architect` with `mobile`; `privacy` words it | In PR 8 |
| 5 | `erase-everything.ts` and `erase-all.test.ts` edits; zero-bytes scan | `mobile` | In PR 8 |
| 6 | DATA-REQ-023 wipe list names device files; test for the executed-elsewhere path | `privacy` (spec words), `mobile` (test) | Before PR 8 merges, or in it |
| 7 | R249 per book or per phone | `product` | Before PR 8 is written |
| 8 | Route A: narrow DATA-REQ-052 and the Export everything copy; DSR-R14 answer; policy line. Route B: README line, schema, manifest | `privacy`, `content`, `legal` (A); `mobile` (B) | With the route |
| 9 | If PR 5b and PR 7 land first: PR 5b 4.6 row (bundled place table, L1) and the `picker_unavailable` decision of `ALIGNMENT-data.md` G2 stay as ruled there | `data-architect`, `analytics` | Unchanged |

## 8. What I did not do

No code, migration, test run, or classification edit. I read no statute and no counsel opinion. I did not read the code path that handles an account deletion executed from another device (section 6, item 5).
