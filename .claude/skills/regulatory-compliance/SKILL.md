---
name: regulatory-compliance
description: Regulatory compliance for Early Letters. Use when a change touches account creation, age (under 18 or under 13), sanctions or embargoed places, consent, privacy promises, children's data, store rules, retention or a new vendor, or when a law or platform rule may have changed. Gives the checks, where the controls live in code, and how to verify a legal fact before relying on it.
---

# Regulatory compliance (Early Letters)

Load this before you review or build anything that a law, a regulator or a store rule could care about. It is procedure and pointers. The facts live in one place each (see "Sources of truth"); do not copy them into prompts or new docs.

You are not a lawyer, and neither is any agent. Everything you produce is engineering triage for the founder and counsel. Label legal readings "engineering reading, confirm with counsel". Never state that something "is compliant" or that a law "does not apply".

## 1. Sources of truth (read these, do not restate them)

| Question | Where the answer lives |
|---|---|
| Which laws we think apply, and the status of each control | `docs/legal/compliance-register.md` (CR-### rows) |
| What the code must do, with acceptance tests | `docs/legal/ENGINEERING_REQUIREMENTS.md` (LEGAL-REQ-###) |
| Open questions for counsel, with defaults and deadlines | `docs/legal/COUNSEL_PACKET.md` (Q#) |
| Founder decisions | `docs/DECISIONS.md` (D-###) |
| What data we hold and how it is classified | `docs/legal/DATA_CLASSIFICATION.md` |
| Deletion, export and legal requests | `docs/legal/DELETION_AND_EXPORT_SPEC.md`, `docs/engineering/08-data-rights-and-legal-requests.md` |
| Privacy engineering rules | `docs/engineering/07-privacy-engineering.md` (PRIV-R##) |
| Facts checked since the register was written | `references/checked-facts.md` in this skill (dated, sourced) |

If you learn something the register does not say, record it in `references/checked-facts.md` with the URL and the date you read it, and open a handoff to `legal` to update the register. Do not edit `docs/legal/**` drafts yourself unless your charter says you own them.

## 2. The account-creation checks

Sign-in is part of v1.0 (D-100), released in stages: the first store build is on-device only, and the server features follow in later 1.0.x releases (D-121). Alpha build 2 already signs people in (D-128). Every path that creates a person in our systems must pass these, in this order. The table says where each one is enforced, so a reviewer can check the code, not the prose.

| # | Check | Rule | Enforced by | Stored |
|---|---|---|---|---|
| 1 | Adults only (18+), neutral question, nothing preselected | D-006, LEGAL-REQ-002, Terms 2.1 | `apps/mobile/src/components/gate/age-gate-screen.tsx` before first run; sign-in agree line (A-REQ-034) | On device: `ageGate.passed` boolean, and `ageGate.stoppedAt` after a No only (D-026). Never a birth date or an age range. |
| 2 | Store age signal (Apple Declared Age Range) where a state requires it | LEGAL-REQ-002, register CR-004, COUNSEL_PACKET Q5 | not yet: no Declared Age Range code on `develop` (31 Oct 2026). The API needs iOS 26 and the app's floor is iOS 17, so older phones give no signal (CCO skill, section 3). | Nothing, when built: used for the decision in memory and dropped. |
| 3 | Terms and Privacy acceptance, versioned | LEGAL-REQ on policy acceptance, `docs/legal/POLICY_VERSIONING.md` | `public.policy_acceptances`, `record_policy_act` | Version, act, surface, time |
| 4 | Not in a blocked country (D-131) | Terms 2.4, register CR-121, D-131 | US-only storefront (Apple); the `before user created` auth hook and the web contribution page (later, D-055) | Daily counts only: day, check, outcome, jurisdiction code. Never the IP. |
| 5 | Not on a US restricted-party list | Terms 2.4 (attestation) | The Terms attestation only. No name screening today: a founder-and-counsel question with a default, see `references/sanctions.md` | Nothing beyond the acceptance |
| 6 | Under-18 or under-13 actual knowledge (a support report, or a store signal saying minor) | LEGAL-REQ-002 last scenario, COUNSEL_PACKET Q5(d) | not yet: there is no underage runbook in `docs/ops/runbooks/` (checked 31 Oct 2026). Gap owned by `regulatory-affairs` with `ops`. | `ops.audit_log` row, content-free, once the runbook exists |

A new sign-up path (a new identity provider, the web contribution page, an invite flow) is not done until it passes all six. Add it to this table in the same PR.

## 3. How to review a change (in order, stop at the first fail)

1. **Does it collect something new?** A new field, SDK, host, header, log line or table. If yes: it needs a DATA_CLASSIFICATION row, a privacy-label check (`docs/legal/app-store-privacy-labels.md`) and a subprocessor check (`docs/legal/subprocessors.md`). Data minimisation first: can we not collect it?
2. **Does it change who can use the product?** Age, place, account type. Re-run section 2 for that path.
3. **Does it change a promise?** Anything a user reads: store listing, site, Terms, Privacy Policy, consent text, in-app copy. Check `docs/reviews/2026-10-claims-inventory.md`. A changed promise is a founder decision (Karma section 3).
4. **Does it touch children's data?** Adults write about a child; the child is a data subject, not a user. Read the COPPA scope notes in the register before saying anything about it.
5. **Is there an audit trail?** Consequential actions (deletion, legal hold, support access, a compliance block) leave a content-free row in `public.audit_events`, `ops.audit_log` or `ops.compliance_check_counts`.
6. **Is there a test?** Every control in section 2 has a test or a `not yet: <id>` line. Grep for it before saying it is enforced.

## 4. Verifying a legal or platform fact

The repo has been wrong before, and so have secondary sources. On 31 Oct 2026 a 2026 sanctions blog said Syria was still comprehensively sanctioned; it was terminated by Executive Order 14312 on 30 June 2025, and OFAC removed 31 CFR part 542 in August 2025.

- Prefer primary sources: the statute or regulation, the regulator's site (ftc.gov, ofac.treasury.gov, federalregister.gov, oag.ca.gov, cppa.ca.gov, capitol.texas.gov), Apple's App Review Guidelines and developer docs.
- Secondary sources (law firm alerts, trackers) are fine for dates and status, labelled as secondary.
- Record every fact you rely on with the URL, the date you read it, and primary or secondary.
- A fact you remember is not a source. If you cannot reach a source, say "unverified" and do not build on it.

## 5. Regulatory watch

`compliance/scripts/regulatory-watch.mjs` (backend PR, branch `feat/db-compliance-gates`) pulls the Federal Register API for the topics in `compliance/scripts/watch-topics.json` and records candidate changes in `ops.regulatory_watch` for triage. It sees federal rules only. State law (age assurance in Texas, Utah, Louisiana, California) needs a state tracker; until one is wired, check the trackers listed in `references/checked-facts.md` monthly and note the date.

## 6. References in this skill

- `references/age-assurance.md`: the 18+ gate, store signals, under-13 handling, what changes on 1 Jan 2027.
- `references/sanctions.md`: why we block places and do not screen names, the jurisdiction list, the open counsel question.
- `references/checked-facts.md`: dated, sourced facts checked since the register was written.
- `compliance/scripts/watch-topics.json` (backend PR): what the regulatory watch searches for.

## Never

- Give legal advice or tell a user, regulator or counsel anything directly.
- Store an IP address, a birth date, an age range or a name to prove a check ran. Store the outcome as a count.
- Put entry text, transcripts, audio or a child's name anywhere a compliance check writes.
- Weaken a gate or a deletion guarantee to ship faster.
