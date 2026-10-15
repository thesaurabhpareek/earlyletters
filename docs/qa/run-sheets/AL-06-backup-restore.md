# AL-06 Backup upload and restore on a second phone with the recoverable key

| | |
|---|---|
| Proves | Recordings back up encrypted: zero plaintext in any upload (F08-REQ-018, F08-REQ-020); an upload cut by a kill or airplane mode resumes (F08-U17); a second phone restores every recording with equal hashes (F08-REQ-023); with iCloud Keychain off, a restore asks the recovery service, which holds the request and emails the owner (D-102, F08-REQ-028, F08-REQ-029). Alpha plan item 4 |
| Builds | Rehearsal R2 (`preview`, servers on, `EXPO_PUBLIC_BACKUP=on`, the staging escrow URL and the **drill** key) on Tue 27 Oct, founder step F23. Never build 1, and never a build with the production escrow key |
| Phones and accounts | Phone A (SE 3) and Phone B (current iPhone), both on **one** Apple Account (Account A), iCloud Keychain on for round A; the app account "Mama" on both |
| Time | about 2.5 h, as F23 plans [E] |
| Needs first | PRs #150 and #151 merged (S05 client and server), the backup flag PR and the escrow key PR merged (Mon 26 Oct); founder steps F18 and F20 done (escrow project `scribe-escrow-staging`, the drill-key ceremony, secrets, `EXPO_PUBLIC_ESCROW_URL`); a proxy (Proxyman or Charles) on the Mac with its certificate trusted on Phone A only; 6 scripted Asha recordings |
| Record in | the session's evidence file, rows AL-06.1 to AL-06.6, plus S05's B6 rows |

**The detailed run sheet is S05's**: `docs/qa/BACKUP_RESTORE_DRILL.md` (WP-F08-B6), on PR #150 (`feat/backup-client`) until it merges. Follow its steps B6-P1 to B6-P5, B6-01 to B6-04 and B6-06 in that order. This sheet only sets the alpha subset, what each row must capture, and the go rule. Where the two disagree, S05's file holds the steps and this file holds the alpha pass rule; tell S19 so one of them is fixed.

The alpha subset uses **6 recordings instead of 20** (alpha plan F23 [R]): 3 of 30 s, 2 of 2 min, 1 of 5 min, read from the TDD 03 corpus scripts by a consenting adult. Their SHA-256 values (from Settings > Recordings or an export's manifest) go into the evidence file before the drill. A hash is not personal data; the recordings themselves never go anywhere but the two phones and the staging bucket.

## Rows

| # | S05 step | What must be true for the alpha | Capture |
|---|---|---|---|
| AL-06.1 | B6-01 on Phone A | Turning backup on shows the four claims and nothing more (encrypted on this phone; a recovery key; our recovery service logs every use and emails you; never listened to, sold or used to train models) and no count; "Backed up" appears; staging `audio_blobs` has 6 confirmed rows and `child_keys` one row for (Asha, Mama) | Minutes to "Backed up"; row counts |
| AL-06.2 | B6-02 during AL-06.1 | Zero matches in the proxy capture for `ftyp`, for the hex SHA-256 of three recordings and for a 64-byte run copied from one recording; uploads go only to the resumable upload path and the `entry-audio` bucket | The search terms and their counts (all 0). The capture file stays on the Mac |
| AL-06.3 | B6-03 on Phone A | After a kill mid-upload and 30 s of airplane mode, the upload continues from where it was (a `HEAD`, then only the missing parts); nothing uploads while a recording runs; exactly one confirmed row for that letter | yes or no per part |
| AL-06.4 | B6-04 on Phone B (iCloud Keychain on) | Text arrives at once; all 7 recordings (6 plus the one from AL-06.3) play within 10 minutes; every SHA-256 equals Phone A's; no new `escrow_unwraps` row and no "key opened" email (iCloud Keychain brought the key) | Minutes; "7 of 7 hashes equal" or the letter numbers that differ |
| AL-06.5 | B6-05 | A recording made on Phone B is never overwritten by a restore | yes or no |
| AL-06.6 | B6-06 (iCloud Keychain off on Phone B, or a third phone on another Apple Account) | The restore asks the recovery service: no new key is made (`child_keys` still one row); the phone shows the hold time; the request email "A new iPhone asked for your recordings" reaches Mama's mailbox with the Stop link. The alpha needs the request and its email only; approval and the hold ending (B6-07 to B6-09) are should-haves (alpha plan 1.2) | Hold time shown; email received yes or no; push n/a (no push in the alpha) |

## Go rule (alpha item 4)

AL-06.1 to AL-06.4 and AL-06.6 pass, and the escrow function answers its two checks on the escrow project (runbook B6, founder step F20). If any of them fails, build 2 ships to the family with backup **off** (`EXPO_PUBLIC_BACKUP=off`), item 4 fails, and the decision rule in `docs/qa/ALPHA_GO_NO_GO.md` applies.

## Stop rule

Any plaintext match in AL-06.2, a hash that differs in AL-06.4, or a key made for the wrong person is S0. Turn backup off on both phones, stop the drill, tell the founder and S05, and keep the proxy capture on the Mac for diagnosis.
