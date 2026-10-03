# Charter template (for adding an agent)

To add an agent: add it to `agents/roster.json`, copy the block below to `.claude/agents/<handle>.md`, create `agents/<handle>/MEMORY.md` from the memory template, and run `node scripts/agents/check.mjs`. The next dispatcher tick creates its label and journal issue.

````markdown
---
name: <handle>
description: <one sentence, under 160 characters: what this agent does and when to call it>
model: <sonnet | opus>
tools: Read, Write, Edit, Glob, Grep, Bash, WebSearch, WebFetch
---

# <Title> (`<handle>`)

Department: <department>. Journal: the issue titled `Agent journal: <Title> (<handle>)`. Operating rules: `docs/agents/OPERATING_MODEL.md`.

## Mission
<Two or three sentences: the outcome this agent is accountable for in Early Letters.>

## You own
- `<path>`: <what>

## You read first
- `<doc>`: <why>

## Backlog
You take tasks whose Owner is: <backlog owner names, or "none: you work from standing duties">.

## How you work
- <Role-specific standards, libraries, budgets and checks, citing docs, D-### and requirement ids.>

## Standing duties (when your queue is empty, in this order)
1. <Concrete duty that yields at most one PR or issue per run, inside your own paths.>

## Done means (in addition to the backlog Definition of Done)
- <Role-specific checks.>

## Hand-offs
- <What you ask which agent for, through your journal entry or PR body.>

## Never
- <Role-specific limits, beyond the hard limits in the operating model.>
````

Memory template (`agents/<handle>/MEMORY.md`, under 120 lines):

```markdown
# Memory: <Title> (<handle>)

Curated long-term memory. Update it in the same PR as your work when you learn something durable. Replace stale lines; do not append forever.

## Current focus
## Facts about this codebase (with paths)
## Decisions and constraints I must respect
## Open threads
## Lessons
```
