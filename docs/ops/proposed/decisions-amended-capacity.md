# Proposed: "Amended by" markers and a "Capacity" line in the decision log

Status: proposal, 1 Nov 2026 (HV2-B12; harness-v2 retro PRD-3 and PRD-4). `docs/DECISIONS.md` is not changed by this pull request. The founder or Karma applies the text below; only the founder decides the Capacity field (D-### entry not drafted here: it is a process rule, so the founder may prefer to adopt it by a line in the Rules paragraph alone).

Checker: `node scripts/agents/decisions-check.mjs` (advisory, exit 0; `--strict` exits 1 on any finding; a patch collision always exits 1). It reads `docs/DECISIONS.md` and, with `--patch <diff>` (repeatable), the added D ids of open pull requests.

## 1. Amended by (no decision needed; fixes a reading hazard)

Problem: a reader who finds D-100 or D-101 in the index sees "Decided" and no sign that D-121 (`docs/DECISIONS.md:885-900`, item 3: "Amends D-100, D-101, M14 and M15 for the first binary only") changes them. The index rows are at `docs/DECISIONS.md:623-624`. A marker in the row's Decision cell fixes it without editing the decision. Same style as the existing `amended by D-030` at `docs/DECISIONS.md:118`.

Patch, line 623 (append to the end of the Decision cell, before the next `|`):

```
 (amended by D-121 for the first store build only)
```

Patch, line 624:

```
 (amended by D-121 for the first store build only)
```

Resulting row 623: `| D-100 | Server features are on in v1.0: sign-in, sync, co-parent sharing, encrypted recording backup, status report and reminder emails (amended by D-121 for the first store build only) | Decided (founder, 13 Oct 2026; confirmed 15 Oct) | Yes, after the security gate | 2026-10-13 |`

Also add one line to the Rules paragraph (top of the file): "An index row whose decision a later entry amends or supersedes carries `(amended by D-xxx ...)` or `(superseded by D-xxx)` in its Decision cell."

Other rows the checker finds without a marker on 1 Nov 2026 (target, by; the amender's own text names the target):
D-032 by D-073; D-053 by D-082; D-073 by D-085; D-089 by D-130; D-107 by D-117 and D-132; D-111 by D-118; D-117 by D-132; D-121, D-122, D-123, D-124, D-126 by D-130; D-125 by D-132 and D-133. Run the checker to get the line numbers. Marking these is optional and can wait; the D-100/D-101 pair is the one that misleads on the release path. One caution: some are "in part" amendments (for example D-130 over D-124), so the marker should say "in part" where the amender's own field does.

## 2. Capacity line (needs the founder: adopt or not)

Problem: decisions made after the freeze (D-130: Tue 3 Nov 2026, 5:00 AM PT, 13:00 UTC) add work to a team whose merge and review time is fixed. D-121 (`docs/DECISIONS.md:885-886`) shows the cost of leaving it out: its date rested on a stated merge budget that D-107 and D-117 later overtook. A one-line field makes the cost visible when the decision is made.

Recommendation: adopt, for entries dated after the freeze. Default if the founder says nothing: no change (the checker stays silent about Capacity until some entry has the line, or `--capacity-adopted` is passed).

Template (add to each new entry, next to Status; sentences, no scoring):

```
- **Capacity:** who does the work, roughly how long, and what it pushes back. Write "none" if it adds no work. Example form: "about 2 hours of the mobile agent and one review; pushes nothing back."
```

Rules line (top of the file): "From the first entry dated after the freeze, each entry carries a `Capacity` line."

Not done here: back-filling Capacity on D-130 to D-138 (dated on or before the freeze day, so the checker does not ask for it). D-138 is claimed by open PR #557 at head e34d0be4; the checker's fixture `scripts/agents/fixtures/decisions-check.pr557.diff` shows how a second PR claiming D-138 is caught (fictional second patch).

## 3. Using the checker in a pull request

```
gh api repos/thesaurabhpareek/earlyletters/pulls/557/files --jq '.[]|select(.filename=="docs/DECISIONS.md")|.patch' > /tmp/pr557.patch
node scripts/agents/decisions-check.mjs --patch /tmp/pr557.patch
```

(The `patch` field has no `---`/`+++` header; the checker reads only lines that start with `+`.) A workflow step is not proposed here; that is a later item (`.github/**` is not edited before the founder applies workflow text on or after 10 Nov, D-124).
