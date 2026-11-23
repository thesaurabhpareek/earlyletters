# Crosswalk: ADR ids reserved in the new-scope design pack versus the ids filed

Status: Proposed, 20 Nov 2026, filed with ADRs 0029 to 0035. The ids 0029 to 0035 were assigned by `node scripts/agents/next-id.mjs` in filing order (CR-69 A11) and are not renumbered. Design, tdd and engineering documents, and CR-67 AX-11 and AX-12 in `docs/agents/cto/RULINGS.md`, cite ids reserved earlier in `docs/engineering/plans/inputs/C-platform-quality-delivery.md` section 1.4. Those citations read through this table. A RULINGS erratum for CR-67 is a follow-up for Karma (`docs/agents/**` is founder-only under CR-70).

| Cited as | Subject | Filed id | Status |
|---|---|---|---|
| ADR 0029 | Flags, kill switches, preflight | 0029 | Proposed (same id) |
| ADR 0030 | Requirement traceability v2 | none | Not filed |
| ADR 0031 | One phone, two accounts (`[X4-R1]`; CR-67 AX-12) | 0038 | Proposed (21 Nov) |
| ADR 0032 | One notification budget | 0030 | Proposed |
| ADR 0033 | Home slip registry | 0031 | Proposed |
| ADR 0034 | Seal publication | none | CR-67 AX-2 rules no ADR 0034: it is an ADR 0028 amendment |
| ADR 0035 | Undo windows (CR-67 AX-11) | none | Not filed |
| ADR 0039 | Words out of system intelligence (Writing Tools; CR-67 AX-1) | 0037 | Proposed (21 Nov) |
| ADR 0038 | Export minor (CR-67 AX-3) | none | Absorbed by ADR 0028 Amendment A5, point 2 (next free minor at merge) |
| ADR 0036 and 0037 as cited before 21 Nov | Typed-word length (E84 and the shared helper in `packages/core` rule the numbers), printable PDF | none | Not the filed 0036 (analytics) and 0037 (Writing Tools). Cited but not reserved: `next-id.mjs` hands out the next number, so the clash repeats unless the filer takes the cited number on purpose |

Filed ids that no earlier citation used for them: 0036 analytics and crash reports through PostHog Cloud only (21 Nov); 0032 is the on-device sensitive store, 0033 notification privacy, 0034 pure notification selection, 0035 one age function in core. Anyone who reads "ADR 0031", "0032", "0033", "0034" or "0035" in a document dated before 20 Nov 2026 evening opens this table first.
