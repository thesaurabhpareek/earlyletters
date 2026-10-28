# Brief (c): D-117, who merges the founder-class paths

Status: open, not decided. Needed by Mon 2 Nov, before the proposed freeze (Tue 3 Nov, 5:00 AM PT), because freeze-week fixes on these paths merge under whichever rule stands.
Default if unanswered: the coordinator's rule stays in force, as recorded, with nothing in GitHub enforcing it.

## Question
D-117 records the founder's words "Everything is approved". Under them, the coordinator wrote its own operating rule. Confirm that rule, amend it, or reverse it?

## Evidence
- The founder's words and the coordinator's rule are recorded separately ([DECISIONS.md:809 to 817](../../DECISIONS.md#L809)). The rule ([:812](../../DECISIONS.md#L812)): the coordinator merges `supabase/**`, auth, payments, `.github/**`, `apps/mobile/eas.json`, `apps/mobile/app.config.ts`, the engine files and production deploys of the alpha queue, after two independent passing reviews on the current head and green CI. The entry says the founder may reverse any of it.
- The two reviews are lens reviews the coordinator starts, from the same model family (retro IMP-36).
- `develop` has no branch protection, and neither branch requires status checks or human review (retro spot-check 3 and 4). The rule is prose only.
- 34 of the 93 first-parent commits on `develop` dated 23 Oct or later touch `supabase/**`, `.github/**`, `eas.json` or `app.config.ts` (`git log`, 28 Oct). This is a lower bound: auth, payments and engine paths are not counted, and some 23 Oct commits may predate D-117.
- Before D-117, a founder-only merge waited 7.2 days (#178, retro panel 02).

## Options
| Option | What it changes | Cost or risk |
|---|---|---|
| 1. Confirm as written | Nothing | No human checkpoint on database, CI or billing merges |
| 2. Confirm, plus a weekly skim and branch protection | The founder reads a generated list of founder-class merges each week (retro R1-03 builds it) and applies protection with required checks (Wave 0 item 8) | About 15 minutes a week plus 20 minutes once. A bad merge can sit up to a week before a human sees it |
| 3. Narrow | The founder merges `supabase/migrations/**` and `.github/workflows/**`; the coordinator merges the rest | Founder time per merge in freeze week; the 7-day wait can return |
| 4. Reverse to D-107's founder-only list | The founder merges every founder-class PR | Largest delay; the alpha queue slows |

## Recommendation (a recommendation, not a decision)
Option 2. It keeps merges moving in freeze week and gives the founder a deliberate, cheap look at every sensitive merge.
