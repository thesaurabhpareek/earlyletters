# Memory loop: lessons reach MEMORY.md

Gap: agents write a "**Learned:**" line in every journal entry, but agents/<handle>/MEMORY.md was never updated, so the next run starts without it. This is the "capture the workforce's wisdom" loop; without it the harness does not improve.

What it does (scripts/agents/memory.mjs, called from brief.mjs):
- Reads the agent's recent journal comments and pulls the text after **Learned:**.
- A lesson counts as carried when any 5 consecutive words of it appear in MEMORY.md.
- Uncarried lessons (up to 5, each cut to 240 chars) appear in the next brief under "Carry into memory".
- If MEMORY.md is over 120 lines (OPERATING_MODEL section 3) the brief says to condense it first.
- Never throws: a missing file or odd input gives no lines.

What it does not do: write MEMORY.md itself. The agent does, in its own PR, so memory changes are reviewed like any other change.

Known limits (Unverified in live use): the lane has not run on a live agent yet; the 5-word match can miss a reworded lesson and then re-list it once.
Tests: scripts/agents/memory.test.mjs.
