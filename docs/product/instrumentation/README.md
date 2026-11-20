# Instrumentation programme: index (PROPOSED)

Status: PROPOSED, 20 Nov 2026. Author: `product` (PM5). Charter: founder, 20 Nov. Analytics stays OFF through the whole 1.0 line (D-095, D-124 item 3, FR-DAT-01); everything here is designed and built DARK (compiled, tested, inert) for the release after 1.0. Founder rules: open source and completely free tools only; one event standard followed strictly. Docs only in this phase.

## 1. The ten files

Filenames for files not yet on develop or a branch when this was written are UNVERIFIED; the owner of each file fixes its row in a later edit.

| Kind | File | Owner | Pair | State |
|---|---|---|---|---|
| Standard | `docs/analytics/instrumentation/00-event-standard.md` | `analytics` | all | not landed; founder baseline in force |
| PM 1 | `docs/product/instrumentation/01-<capture-first-run>.md` | PM1 | `analytics` | UNVERIFIED |
| PM 2 | `docs/product/instrumentation/02-<book-reading-find-photos>.md` | PM2 | `decision-science` | UNVERIFIED |
| PM 3 | `docs/product/instrumentation/03-<keeping-trust>.md` | PM3 | `data-steward` | UNVERIFIED |
| PM 4 | `docs/product/instrumentation/04-<family-reminders-days-lifecycle>.md` | PM4 | `data-architect` | UNVERIFIED |
| PM 5 | `docs/product/instrumentation/05-plus-growth-foundations.md` | PM5 | `ops` | this PR |
| Data | `docs/analytics/instrumentation/analytics.md` (stack, schema, allowlist, migration) | `analytics` | PM1 | UNVERIFIED |
| Data | `docs/analytics/instrumentation/decision-science.md` (metric tree, funnels, retention, read-out) | `decision-science` | PM2 | UNVERIFIED |
| Data | `docs/analytics/instrumentation/data-steward.md` (classification, retention, consent, DSR) | `data-steward` | PM3 | UNVERIFIED |
| Data | `docs/analytics/instrumentation/data-architect.md` (storage, reporting, server tables) | `data-architect` | PM4 | UNVERIFIED |
| Data | `docs/analytics/instrumentation/ops.md` (observability, SLOs, alerts, runbooks) | `ops` | PM5 | UNVERIFIED |

## 2. The basics (shared by every area)

Names follow `<area>.<object>.<action>`, snake_case, ASCII, past tense, at most 3 segments. Areas are a closed list: onboarding, capture, book, family, keeping, me, plus, notifications, system. Ids come from `docs/design/IA-FINAL-20nov.md` (lower case, underscores: E-S10 is `e_s10`), never from text on screen.

| Basic | Event name | Trigger | Closed properties | Pair for rates |
|---|---|---|---|---|
| Screen view | `screen.<screen_id>.viewed` | A place in IA-FINAL drawn in front | `schema_version`; per-screen enums named in the owning PM file | none |
| Tap | `ui.<control_id>.tapped` | A control on a screen was used | none beyond the control id | pairs with `.impressed` on the same id |
| Impression | `ui.<element_id>.impressed` | A slip, prompt, card, sheet, banner, empty state or message drawn | state enum where the element has states | tap rate = `.tapped` over `.impressed`, same id |
| Funnel | `f_<area>_<goal>` (a list, not an event) | Ordered event names | none | step drop-off |
| Performance | `perf.<metric>.measured` | A budget row of `NFR-BUDGETS.md` measured | `budget_band` within, near, over; `device_tier` | raw ms stays on the phone |
| Error | `system.error.raised` | A closed error class | `area`, `code` enums | none |

Every registry row carries: name, trigger, properties with type and allowed values, classification label, owner, consent gate, status (proposed, approved, built), requirement id, `schema_version`. A rename is a new event; the old one is deprecated with a date. A validator test rejects names not in the registry and properties not on the allowlist. Source: `event-standard-brief.md`, until the standard lands.

## 3. How this becomes errata and backlog rows

1. Review: each PR is read by its pair, the CTO (Karma) and the CPO. Merged files stay PROPOSED.
2. Errata: where a locked statement must change, the PM file holds a "Proposed change" box naming the next free erratum (E83 onward, CL-158). The founder decides; nobody edits `docs/product/prd/18-errata-after-lock.md` or `GAP-LOG.md` in this phase. Known candidates: FR-MKT-34 (website tracker, PM5), FR-DAT-01 wording when analytics returns, any change to the label.
3. Backlog: each file ends with working rows IN-nn in waves. `product` converts them into BL rows (ids continue each milestone block; BL-055 to BL-099 are never used), each with Status, Mode, Owner, Milestone, Size, `Satisfies:` ids, Scope and Done-when, one PR a reviewer can read in ten minutes.
4. Order: wave 1 registry and validator (no feature depends on it), wave 2 on-device markers and tests, wave 3 dark events per area, wave 4 server views and anything needing a founder account.

## 4. Decisions merged from the files

Only PM5's list exists on this branch; the other four PM files and the data files were not on develop or any branch when written. Their owners add rows here when they land (UNVERIFIED until then). Each has a default.

| # | Decision | Owner | Default |
|---|---|---|---|
| 1 | Website tracking after 1.0 versus FR-MKT-34 (no tracker through launch); needs erratum E83 if changed | CPO, founder | No tracker; revisit after 1.0 with a cookieless open-source counter |
| 2 | Does "free and open source only" include Supabase free plan and Vercel Hobby (free tiers of paid products, already in the stack)? | founder | Yes, existing stack stays; no new paid tier |
| 3 | A server to self-host PostHog, GlitchTip or Umami | founder | None; events to a Supabase table, reporting in SQL |
| 4 | Accessibility and language states in analytics | counsel, founder | Not measured |
| 5 | Catalogue stores raw counts (`letters_kept`, `allowance`); standard needs bands | analytics, CPO | Bands; old names deprecated with a date |
| 6 | New areas outside the closed list (for example a website area) | CPO | None added |
| 7 | Analytics return version, consent sheet wording, label change, counsel | founder | v1.1 or later, founder's call |
| 8 | Any new dependency (client SDK, validator library) | founder | List only; `package.json` is the founder's |

Risks across the programme: events built dark can rot unless the validator runs on every PR (IN-02 in PM5); a 15 to 25 family beta cannot support any effect claim (FR-DAT-42); first run is not measured in the field in 1.0 (FR-DAT-33), so install to first letter is read by stopwatch only.
