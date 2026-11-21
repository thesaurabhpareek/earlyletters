# Decision register

The reference for every decision behind Early Letters: what we decided, why, what else we considered, who decided and when, how hard it is to undo, and what would make us revisit it. Read this before you reopen a question or read code to work out why something is the way it is.

Owner: the `decision-records` agent (`.claude/agents/decision-records.md`), which updates it every day.

## How it relates to the other decision documents

| Document | Holds | Owner |
|---|---|---|
| `docs/DECISIONS.md` | The dated log: who decided what and when, and its status. The source of truth for a D-id's wording. | Coordinator |
| `docs/adr/` | Architecture decision records: the technical reasoning and options for one design choice. | The author, through review |
| `docs/agents/BRIEF-*.md` | Founder briefs: batches of founder decisions given to the team. | Founder |
| **This register** | One record per decision from all of the above, plus decisions made in issues, PRs and chats. It adds what none of them hold: door type, reversal cost, revisit triggers, review date and where the decision lives in the product today. | `decision-records` |

The register never rewrites a decision. When it disagrees with its source, the source wins and the register is fixed. When a decision was made somewhere with no D-id (for example the v1.0 scope call in issue #127), the register records it as `R-###` and the coordinator is asked to log it in `docs/DECISIONS.md`.

## Door types

The terms come from a well-known distinction between consequential, irreversible decisions ("one-way doors") and changeable, reversible ones ("two-way doors"), and the warning that most decisions are the second kind and should not get the heavy process of the first. Source: Jeff Bezos's Amazon letter to shareholders (SEC filing 0001193125-16-530910), as quoted by Farnam Street, https://fs.blog/reversible-irreversible-decisions/, checked 2026-10-15. We add a third type because an early product has many decisions that are cheap today and expensive once real families depend on them.

| Door | Meaning for us | Examples from this product |
|---|---|---|
| `one-way` | Cannot be undone, or only at a cost we would not pay: identifiers that are permanent, promises made in public, data destroyed, legal commitments, platform settings Apple does not let us reverse. | The bundle ID after the first upload; turning on Family Sharing for a subscription; a public privacy promise; anything published from a public repository |
| `one-way after launch` | Two-way today; becomes one-way once real users, their data, a store listing or a paid subscriber depends on it. These are the decisions to get right before the freeze. | The data model of a letter once families have written letters; prices for existing subscribers; what "delete" means once people have deleted things |
| `two-way` | Can be changed with a code change, a migration on our own data, or copy, with no lasting cost to anyone outside the team. | A library choice; a default setting; the agent team's models and caps |

When unsure, pick the more conservative type and say why in **Door**.

## Reversal cost

Starts with `low`, `medium` or `high`, then says what undoing it would take: code only, a migration on live data, a store resubmission, user communication, a legal or counsel review, a new Apple account, lost data. The cost is about undoing it in the future, not about how hard it was to decide.

## Revisit triggers

**Revisit when** names the concrete conditions under which the decision should be reopened. Each trigger starts with its kind:

| Kind | Use for | Example |
|---|---|---|
| `scale` | Numbers of families, letters, storage, requests, agents | `scale: past 10,000 active families, re-check the device-only storage limit` |
| `market` | Competitors, pricing pressure, new countries or languages | `market: launching outside the US` |
| `law` | New or changed law, regulation or counsel advice | `law: counsel confirms a state law requires server-side consent records` |
| `customer` | What families say or do: support themes, research, usage | `customer: more than 1 in 10 support requests ask for web access` |
| `cost` | Spending that crosses a limit the founder set | `cost: monthly infrastructure above $50` |
| `platform` | Apple, Expo, Supabase or model-provider policy and capability changes | `platform: Apple allows Family Sharing to be turned off` |
| `technology` | A better tool becomes available or a dependency dies | `technology: an on-device model reaches the server model's quality` |
| `team` | Who builds and runs it changes | `team: a second engineer joins` |
| `none` | Settled; nothing foreseeable should reopen it | `none expected: this is the constitution` |

Write triggers someone can actually check. "If needs change" is not a trigger.

## A record

Records live in `records/<area>.md`, one `###` heading per decision. Fields, in this order (the example shows the shape only; the real records are in `records/`):

```markdown
### D-085 Recently deleted shelf, confirm before delete, durable erase
- **Source:** `docs/DECISIONS.md` D-085 (Decided, founder, 2026-10-04); PR #98
- **Decided:** One or two sentences: what was decided.
- **Why:** The reasons that carried it, citing evidence where there was some.
- **Alternatives:** The options rejected, and why, in a line each. Optional, but write it whenever the source has it.
- **Door:** two-way
- **Reversal cost:** low: a code change; nothing is lost, because the shelf only delays erasure
- **Revisit when:** customer: families ask to restore after 30 days; law: counsel sets a different deletion window
- **Review by:** on trigger
- **Status:** in force
- **As built:** `apps/mobile/src/app/settings/recently-deleted.tsx`, `apps/mobile/src/lib/store.ts`
- **Also:** BRIEF-20261003-7
```

- **Ids.** `D-###` for decisions in `docs/DECISIONS.md`; `ADR-####` for ADRs; `BRIEF-YYYYMMDD-n` for decision n of a founder brief that has no D-id; `R-###` for a decision recorded nowhere else yet. One record per decision. If one record covers several ids, list the others under **Also**.
- **Status.** `in force`, `amended by <id>`, `superseded by <id>`, `proposed` (in an open PR, not merged), `parked` (deferred to a later release), `open` (not decided), or `retired`.
- **As built.** Where the decision shows up today: paths, a migration, a setting, or `not built`. This is what saves a reader from searching the code.
- **Review by.** A date for decisions that should be re-checked on a schedule (prices, vendors, legal positions), otherwise `on trigger`.
- **Plain English.** No em or en dashes, curly quotes or emoji. Facts only: if a source does not say why, write `Why: not recorded in the source` rather than inventing a reason.

Areas: `product`, `monetisation`, `privacy-legal`, `data-backend`, `mobile-platform` (app, speech, languages, design), `release-ops`, `agents-process`, `brand-content`.

## Changing a decision

The register follows decisions; it does not make them. To change a decision, the founder or coordinator records the new one in `docs/DECISIONS.md` (or an ADR). The `decision-records` agent then marks the old record `superseded by` or `amended by` the new id and adds the new record. Retired ids are never reused.

## Keeping it current

`node scripts/docs/decisions.mjs --check` lists decisions with no record, malformed records, overdue reviews and an out-of-date index. `--write` regenerates [INDEX.md](INDEX.md). The `decision-records` agent runs both every day, and also reads the issues and PRs merged that day for decisions made outside `docs/DECISIONS.md`.
