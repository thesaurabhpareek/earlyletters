# Consult matrix

Status: proposal. It waits for a Karma ruling (see the end of this file). Nothing here changes a workflow, a ruling or `COUNCIL.md`.

This file answers one question: for this kind of change, which roles do I ask first, and where do I write down that I asked? The rows are the routing table in `docs/agents/exec/COUNCIL.md` section 4, copied as they stand. `COUNCIL.md` wins if the two differ. The test `scripts/agents/consult-matrix.test.mjs` fails when a row here differs from section 4.

## The matrix

| If the question is about | Owner | Always consult |
|---|---|---|
| Code, architecture, CI, branches, release mechanics, the harness | CTO | CISO for security, CAIO for agents |
| What's in a release, scope, priority, metrics | CPO | CTO for cost, CDesO for experience; CBO and CFO when it touches Plus or pricing |
| How something looks, feels or reads in the app | CDesO | CPO; CPrivO if it shows personal data |
| Website, store listing, launch, any public claim | CMO | CLO and CCO for claims; CPrivO for privacy claims; CAIO for AI and transcription claims |
| The claims registry (every public claim and the evidence it is true of the shipped build) | CMO keeps it | CCO checks each claim against the build; CLO for legal exposure; CPrivO for privacy claims |
| Pricing model, Plus, partners, print, distribution | CBO | CFO; CLO for contracts |
| Spend, subscriptions, runway, tax, entity | CFO | CBO; CLO for entity and contracts |
| Terms, contracts, IP, names, trademarks, disputes | CLO | CCO; CPrivO for data terms |
| Which laws or store rules apply; the obligations register | CCO | CLO; CPrivO |
| Personal data, consent, retention, deletion, the privacy label, children | CPrivO | CCO, CISO, CDO |
| Threats, keys, accounts, incidents, dependencies | CISO | CTO; CPrivO if personal data is involved |
| Data model, analytics, data quality, how we collect and store | CDO | CPrivO always; CTO |
| Whether we collect a piece of personal data at all (minimisation) | CPrivO | CDO, CCO |
| Speech models, AI features, agents, evals | CAIO | CTO; CPrivO for any data a model sees |
| AI-specific law (what an AI rule requires of us) | CAIO advises | CCO owns whether it applies and the register entry |

The roles are Claude roles, not counsel, an accountant or a regulator (`COUNCIL.md` section 5). A row says who to ask. It is not a ruling.

## The Consulted line

Every pull request whose change falls under a row above carries one line in its description:

```
Consulted: CLO (CLO-3), CPrivO (CPrivO-2)
```

- Name each role in the row's "Owner" and "Always consult" cells that applies to the change, with the ruling id in brackets when the role wrote one.
- A role that was asked and wrote no ruling reads `CMO (asked, no ruling yet)`.
- A change that falls under no row reads `Consulted: none needed (no row of docs/agents/exec/CONSULT-MATRIX.md applies)`.
- A ruling id exists in `docs/agents/exec/RULINGS.md` or `docs/agents/cto/RULINGS.md` before it is cited. Check the log and the open PRs that touch it before you cite one.

What the line is and is not:
- It records who was asked. It is not a sign-off, and it does not replace the counted review at the full 40-character head sha, the two approval comments the compliance fence asks for (CR-27), or a founder decision in `docs/DECISIONS.md`.
- A chat "approved" is not a record.
- It adds no step for the founder (`COUNCIL.md` section 6). The author writes it.
- When two roles disagree, `COUNCIL.md` section 3 step 4 applies: both positions are written down with their evidence, and a founder-only matter goes to him as one question.

Proposed wording for `.github/pull_request_template.md`: `docs/ops/proposed/pr-template-consulted-line.md`. That file is a founder path.

## Kinds of change section 4 does not list

Section 4 has no row for a new language or pack, a release as a whole, a data rights request, an App Store review message, a vendor already in use, or closing the product. `docs/agents/harness-v2/LIFECYCLE.md` (PR #815) drafts rows for them and marks them as its own. This file does not copy them. For those, ask Karma which role owns the question, as `COUNCIL.md` section 3 says, and write the answer on the Consulted line.

## Karma ruling needed

This is a proposal until Karma rules. No ruling is made, and none is cited here.
- Question: is a table that copies `COUNCIL.md` section 4 into its own file, with a Consulted line in the PR template, a new register or a new approval step (`COUNCIL.md` sections 5 and 6)?
- The spec (HV2-B38 in LIFECYCLE.md) proposes extending the table in `COUNCIL.md` section 4 instead. This file is a separate copy kept equal by a test. Karma can rule for either form.
- HV2-B40 (the idea brief) reads "who must be consulted" from this matrix and needs its own ruling that a template in `docs/backlog/` is not a register. B40 is not built here.
