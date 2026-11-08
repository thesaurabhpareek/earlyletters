# Next set of requirements: index and build order (lane C)

Status: draft, 8 Nov 2026. Docs only. Changes no decision. Inputs: `01-customer-needs.md`, `02-benchmark.md`, `04-feasibility.md`, `05-compliance-risk.md` (phase 1 branches), `docs/release/BUILD12-GAP-MAP-2026-11-08.md`, `docs/backlog/READINESS-2026-11-08.md` and the F17 spec (PR #638 branch), read 8 Nov.

Founder facts held: public App Store release (full App Review); build 12 on production servers; server, account, sign-in and security work first; build 11 is English-only alpha; counsel and Apple gates apply. No price is stated anywhere: per the repo source (`packages/content/src/pricing.ts`, D-082), founder to confirm.

## Ids

Requirements carry working labels (NX-01-R1 and so on) and "id: to be assigned". `node scripts/agents/next-id.mjs` ran on 8 Nov and printed BL-740, D-144, ADR 0028; I reserved none. The tool shows BL-621 clashes and the D-139, D-141, D-142 holds from other open PRs, so these files avoid all of them. Each requirement names the existing F##-REQ it refines. Product assigns real ids when it adds backlog rows.

## Every file has

What the person sees and does, then the check (Given, When, Then with numbers, why it fails on old code, tag HYPOTHESIS or EVIDENCE with source), edge cases, offline behaviour, what we never do, copy keys (names only), analytics event names (opt-in, content-free), device rows, dependencies, size, gate, and founder-only decisions with a recommended default. Numbers marked "proposed" are targets, not data.

## Order and reason

| # | Theme | File | Why here | Size | Gate |
|---|---|---|---|---|---|
| 1 | Hosted backend | `01-hosted-backend.md` | Nothing server-side can be proven without it; no hosted project exists as far as the repo shows | M | Founder |
| 2 | Sign-in and session security | `02-sign-in-and-session-security.md` | Needs 1; every account feature stands on it | M | Founder, Apple 4.8 |
| 3 | Adults only, agreement, age signal, region | `03-age-consent-and-region.md` | Must be live before anyone outside the family signs in | M | Counsel |
| 4 | Delete account, erase phone | `04-delete-account-and-erase-phone.md` | Production profile already has deletion on; Apple 5.1.1(v) | M | Apple, founder |
| 5 | Reviewer sign-in and store pack | `05-reviewer-sign-in-and-store-pack.md` | Cannot pass review without it; passwordless needs a designed path | M | Apple, counsel |
| 6 | Recording that behaves | `06-recording-that-behaves.md` | Rank 1 customer need; agents can start now, beside 1 to 5 | M | none |
| 7 | Letters on every phone | `07-letters-on-every-phone.md` | Needs 1 and 2; two-phone proof is the founder's hard constraint | M to L | Founder |
| 8 | Plus and billing trust | `08-plus-and-billing-trust.md` | Needed in the review; the paywall fear is the loudest review theme | S to M | Apple, counsel |
| 9 | Co-parent and shared voice | `09-co-parent-and-shared-voice.md` | 9a after 7; 9b after public release; keep Family hidden at first | S, then XL | Counsel |
| 10 | Reminders that fit | `10-reminders-that-fit.md` | Built; proof and back-off only | S to M | none |
| 11 | Relatives add a hello | `11-relatives-add-a-hello.md` | Demand is evidenced and rivals do it, but riskiest surface; after release | XL | Counsel, security |
| 12 | Names and languages | `12-names-and-languages-as-spoken.md` | Gated by native reviewers; build 12 stays English | L | Reviewers |

Waves: A (themes 1 to 5, with 6 in parallel) is the build 12 path; B (7, 8, 10) is the proof for public release; C (9a, 12) follows; D (9b, 11) after release. Gap map dates are estimates: build 12 in the internal group earliest Fri 13 Nov; public submission earliest Mon 4 Jan 2027 on the CTO's 10 to 15 percent figure, realistic mid-Feb to Mar 2027.

## Not in the top 12, and why

Quick capture from the lock screen (native, L, kill-safety proof), photos and video (video is Stop in compliance), voice-memo import (counsel on others' voices), printed books and Android (Stop), web reader (Stop), sealed letters, search, year page, gifts and lifetime (decide the stance; price not stated here), rating ask and growth levers, support person within a day (customer opportunity 24). They stay candidates in `01-customer-needs.md` section 5.

## Founder-only decisions, all themes

1. Record that build 12 reverses D-121 item 1; add one throwaway rehearsal (default yes).
2. Supabase plan (default Pro with point-in-time recovery; cost unverified).
3. Update channel before freeze (default server-driven now).
4. Google sign-in out of build 12; code length 6.
5. Reviewer sign-in method (default a review mailbox he opens).
6. Co-parent hidden in the first public release.
7. CCO lines for #635 and #520.
8. Confirm Plus prices from the repo source.
9. Counsel scope: Q44, Q46, Q47, Q53, Q54, Q57, Q41.
10. Guest identity for the web (default scoped write-only token, after release).

## What I could not verify

The QE bug-hunt note and the founder's alpha problem list beyond the four named items. Whether any hosted project exists. Code state beyond what the gap map and feasibility files report (I read no app code). Apple's age-range API and the statutes' text. The banned-character scan covers these files only.
