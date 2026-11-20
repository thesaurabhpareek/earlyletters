## Review B at 1fb48f4eeb2ba9100c83974380e1ae9d36f71fdc: PASS WITH NOTES
<!-- agent:compliance-engineer -->

Lens B: privacy and compliance. Delta reviewed: feat/mobile-bl-952-5-rebuild...feat/mobile-bl-952-6-words (lib/find/flag.ts, pause.ts, find-flag.test.ts; packages/api kill-switches, remote-config, envelope, standards and its test; packages/content features/find.en.ts and find-copy.test.ts; scripts/packs/remote-config.json; one check-in line).

Second pass at 1fb48f4e: the change since 005ead60 is `pause.ts` (takes the config reader as an argument; no `require('../remote')`) and its test. That removes Find's only path to a network-capable module, which strengthens R22. It reads one boolean and keeps nothing.

Must fix: none.

### What I checked
- Card R1, R11, R13, R14, R22, R27, R43, sections 12, 18 and 19 (Door lines, Label effect, Claims); ADR 0028 D4; privacy.md on develop line 109 (NS-02: no label change).
- No new data. The pause is one boolean in the signed remote config (`kill-switches.ts:35-39`, `remote-config.ts:65, 78`, default off in `scripts/packs/remote-config.json`). It carries nothing about a person, a book or a query, and nothing is sent because of it. `findPausedNow` takes a reader of the config already on the phone from its caller (`pause.ts:11-17`), and an unreadable config counts as not paused, so the pause can only hide Find (card R1 Remote pause row).
- The build switch is on only for the exact value `on` (`flag.ts:7`); no profile sets it.
- R22: since 1fb48f4e no Find file names the remote module at all; the caller hands the pause its reader (`find-flag.test.ts:41`), and the import scan from #881 still covers `lib/find`.
- Words (all PROPOSED; the founder approves them, which this PR says). From the privacy side I read each of the twelve lines for a data claim. None says where words are kept, that nothing leaves the phone, or anything about history. `notReady` says "on this phone", which is true (the index is in `scribe.db`). No line counts results (R11, test `find-copy.test.ts:31-40`). No line names the index, the query or the database (CR-25, test `:80-82`). Nothing implies a machine writes or ranks (test `:67-69`).
- Cites: 20 sampled (PR body refs, card rows R1, R3, R11, R13, R23, R39, R41, sections 16 and 19, kill-switches lines, remote-config lines); 20 hold.

### Findings, most serious first
1. Note (claims test). Card section 19 forbids "search your recordings" and "find anything you said". The voice tests catch "smart" and "AI" (`find-copy.test.ts:67-69`) but not "recording" or "anything you said", and those are the ones that would be false (the index holds kept words only, not audio). Add `recording\w*|anything you said|everything you said` to that test so a later rewording cannot slip one in.
2. Note (claims inventory). The section 19 "Enables" line ("Find a letter by a word in it, even offline.") needs its row in the claims inventory before the switch turns on in `production`; no word in this file makes that claim yet, so nothing is due here. Recorded for `legal` and `content`.
3. Note. `placeholder` puts `{child}` on screen in the field. That is the book's name on the parent's own phone and fine, but the screen (slice 8) must not pass the filled placeholder or the field's value to an accessibility event logger, analytics screen-view or route. The R15 and R25 canaries in slice 8 should include the filled placeholder.

### Not verified
- That the founder approves the words (needs:founder; not mine).
- The signed config's signature check (lens A and `security-architect`).

CI at 1fb48f4e (head 21 minutes old), read at 12:48 UTC: tests and content rules, typecheck, database rules and required green; compliance-fence green beside any cancelled duplicate run; only the store-profile Release launch was still queued or running.

Reviewer: independent of the author (CR-44).
