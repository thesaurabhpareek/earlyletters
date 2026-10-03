# Chapter format (for the five stewards drafting the compendium)

This file is a working note for the drafting run. It is deleted before the PR is merged.

## File header

Every chapter starts with this frontmatter, then the title:

```markdown
---
chapter: 03
title: Database and schema
owner: data-steward
reviewers: [security-architect, compliance-engineer]
status: adopted
last_reviewed: 2026-10-03
applies_to: supabase/**, apps/mobile/src/lib/db/**
---

# 03. Database and schema
```

## Sections, in this order

1. **Purpose.** Two or three sentences: what this chapter protects and why it matters for Early Letters specifically.
2. **Principles.** Three to six short principles. Each one line, then one line of why.
3. **Rules.** Numbered, stable ids with the chapter prefix (for example `DB-R01`). Format:

   `**DB-R01 (MUST)** One-sentence rule. *Why:* one line. *Enforced by:* the real mechanism today, or `review` (named steward), or `not yet: <finding id or backlog id>`.`

   - Levels: MUST, MUST NOT, SHOULD, SHOULD NOT, MAY (RFC 2119 meaning).
   - A MUST rule needs an enforcement entry. If nothing enforces it yet, say `not yet` and name the finding or backlog id that will. Never claim a test, lint rule or CI job exists unless you found it in the repo (grep it).
   - Rule ids never change meaning once merged. Retire a rule by marking it `(RETIRED: reason)`; never reuse its number.
4. **How to apply it.** Short checklists or patterns an engineer or agent uses while working. Code snippets only where a pattern is easier to copy than to describe; keep them under 15 lines and make them real for this repo.
5. **Exceptions.** Who can grant one (always the founder, recorded as a `D-###` in `docs/DECISIONS.md` or in the PR body for one-off cases) and how it is recorded.
6. **Open questions.** Things that need a founder or counsel decision. Never answer a legal question yourself.
7. **References.** Repo docs (paths and ids) first, then external sources with full URL and the date you checked it.

## Writing rules

- Plain English, short sentences, active voice. Peer to peer. No filler.
- No em dashes, en dashes, curly quotes, ellipsis characters or emoji (house content rules).
- Target 120 to 220 lines per chapter. Agents load these on demand; every line costs context.
- Reference, do not duplicate. If `docs/legal/DELETION_AND_EXPORT_SPEC.md` already specifies something, cite its id (`DATA-REQ-0xx`) and state the engineering rule that makes it hold. Only cite ids you found by grep.
- Mark what you verified (file, line, URL) versus what you assume. Never invent library APIs, prices, statistics, quotes or legal facts.
- External sources: paraphrase. At most one quote per source, under 15 words. Prefer primary sources (the author's own post, talk, paper or official docs).
- Privacy: no real family details anywhere. Examples use the fictional "Asha" family.
- Use the domain glossary: entry (code and DB) = letter (UI); child = book (1:1); `parent` and `contributor` in code = "Co-parent" and "Family" in UI; `date_of_birth`; plan (state) vs Plus (product); `publisher`, not `company`.

## Chapter map and owners

| # | File | Owner | Prefix |
|---|---|---|---|
| 01 | `01-code-and-change.md` | principal-architect | CODE |
| 02 | `02-api-and-contracts.md` | principal-architect | API |
| 03 | `03-database-and-schema.md` | data-steward | DB |
| 04 | `04-data-quality-and-lifecycle.md` | data-steward | DQ |
| 05 | `05-identity-and-access.md` | security-architect | IAM |
| 06 | `06-security-engineering.md` | security-architect | SEC |
| 07 | `07-privacy-engineering.md` | compliance-engineer | PRIV |
| 08 | `08-data-rights-and-legal-requests.md` | compliance-engineer | DSR |
| 09 | `09-ai-assisted-engineering.md` | ai-eng-lead | AIE |
| 10 | `10-logging-and-observability.md` | principal-architect | OBS |

Topic boundaries (cite the other chapter rather than restating it):

- Read and write paths: the API contract side (idempotency, error codes, pagination, versioning) is 02; the database side (RLS, RPCs, transactions, indexes, tombstones) is 03.
- Deletion: the user-facing request process, timelines, verification and proof is 08; the data mechanics (tombstone, purge, ledger, cascade rules) is 03 and the retention schedule is 04.
- Logging: what may never be logged (content-free rule) is 07; log structure, request ids, levels and retention plumbing is 10; security and audit events are 06.
- Identity: who a caller is and what they may do is 05; secrets, keys and supply chain is 06.
- Agents: how AI agents are instructed, reviewed and evaluated is 09; the harness mechanics live in `docs/agents/`.
