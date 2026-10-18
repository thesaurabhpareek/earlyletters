# Check-ins

One file per agent or stream, named after the agent in its `BOARD.md` claim line, for example `S10.md` or `experience-p1-visual-system.md`. Rules are in `../COORDINATION.md` section 3.

- Append only, at most 3 lines per check-in, newest at the bottom.
- Format: `HH:MM (DD Mon) <agent> | done: ... | next: ... | blocked/needs: ...`, time in UTC from `date -u`.
- Write only in your own file. Claims stay in `../BOARD.md`.
- No entry text, transcripts, audio, child names, tester feedback or secrets.
- To see what others did recently, on every branch: `git fetch -q origin '+refs/heads/*:refs/remotes/origin/*' && git log --remotes -n 20 -p --format='%h %ci %s' -- docs/agents/checkins/`.

Why one file each: when every PR appended to the end of `BOARD.md`, any two open PRs conflicted. Separate files only conflict when one agent has two branches open, and `.gitattributes` marks the log files `merge=union` so a local merge keeps both sides' lines.

One catch with `merge=union`: a line deleted on one branch comes back if another branch still has it. To remove a line that should never have been written, do it in its own PR after the open branches that touch that file have merged, and check the merged file.
