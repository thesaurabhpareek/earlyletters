# Check-ins

One file per agent or stream, for example `S10.md` or `experience-p1.md`. Rules are in `../COORDINATION.md` section 3.

- Append only, at most 3 lines per check-in, newest at the bottom.
- Format: `HH:MM (DD Mon) <agent> | done: ... | next: ... | blocked/needs: ...`, time in UTC.
- Write only in your own file. Claims stay in `../BOARD.md`.
- No entry text, transcripts, audio, child names, tester feedback or secrets.

Why one file each: when every PR appended to the end of `BOARD.md`, any two open PRs conflicted. Separate files only conflict when one agent has two branches open, and `.gitattributes` marks these files `merge=union` so a local merge keeps both sides' lines.
