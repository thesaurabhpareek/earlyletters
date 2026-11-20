# Crosswalk: ADR ids reserved in the new-scope design pack versus the ids filed

Status: Proposed, 20 Nov 2026, filed with ADRs 0029 to 0035. The ids 0029 to 0035 were assigned by `node scripts/agents/next-id.mjs` in filing order (CR-69 A11) and are not renumbered. Design, tdd and engineering documents, and CR-67 AX-11 and AX-12 in `docs/agents/cto/RULINGS.md`, cite ids reserved earlier in `docs/engineering/plans/inputs/C-platform-quality-delivery.md` section 1.4. Those citations read through this table. A RULINGS erratum for CR-67 is a follow-up for Karma (`docs/agents/**` is founder-only under CR-70).

| Cited as | Subject | Filed id | Status |
|---|---|---|---|
| ADR 0029 | Flags, kill switches, preflight | 0029 | Proposed (same id) |
| ADR 0030 | Requirement traceability v2 | none | Not filed |
| ADR 0031 | One phone, two accounts (`[X4-R1]`; CR-67 AX-12) | none | Not filed |
| ADR 0032 | One notification budget | 0030 | Proposed |
| ADR 0033 | Home slip registry | 0031 | Proposed |
| ADR 0034 | Seal publication | none | CR-67 AX-2 rules no ADR 0034: it is an ADR 0028 amendment |
| ADR 0035 | Undo windows (CR-67 AX-11) | none | Not filed |
| ADR 0036 to 0039 | Typed-word length, printable PDF, export minor, words out of system intelligence | none | Cited but not reserved: CR-67 AX-1 cites 0039 and AX-3 cites 0038. `next-id.mjs` hands out 0036 next, so the clash repeats for each of these unless the filer takes the cited number on purpose |

Filed ids that no earlier citation used for them: 0032 is the on-device sensitive store, 0033 notification privacy, 0034 pure notification selection, 0035 one age function in core. Anyone who reads "ADR 0031", "0032", "0033", "0034" or "0035" in a document dated before 20 Nov 2026 evening opens this table first.
