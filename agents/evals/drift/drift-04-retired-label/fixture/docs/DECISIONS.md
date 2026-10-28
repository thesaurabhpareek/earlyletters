# Decisions (excerpt)

### D-041 Environments and the agent fence
- **Status:** Recommended. Proceed: yes.
- **Decision:** `scribe-staging` and `scribe-prod` Supabase projects; migrations applied only by `supabase db push` from CI on a release tag; unattended agent runs paused for `supabase/**` and auth code until CI and branch protection are on; any PR touching them needs an independent review run and the founder's "approve migration" label.
- **Rationale:** TDD 10 risk 6; one project serving as dev and live today (APPLY.md).
- **Owner:** founder (projects), QA (CI). **Date:** 2026-10-03.

### D-117 Blanket approval (founder, 23 Oct 2026), and the coordinator's operating rule under it
- **Decided (founder):** 23 Oct 2026: "Everything is approved. Don't keep asking me to approve things. I give you a blanket approval." This was the founder's reply when asked to approve the alpha queue item by item.
- **Coordinator's operating rule under D-117 (not the founder's words; the founder may reverse any of it):**
  - The coordinator merges the founder-only path classes of D-107: `supabase/**`, auth, payments, `.github/**`, `apps/mobile/eas.json` and `apps/mobile/app.config.ts`, the engine files, and production deploys of the alpha queue. A merge needs two independent passing reviews on the current head and green CI (`npm run test:db` green for database pull requests).
  - Steps that only the founder can perform stay the founder's, as a matter of fact, not of decision: applying migrations to the hosted projects; the Apple, Expo, Supabase and Vercel accounts and their secrets; the signing and escrow keys.
  - Legal text is counsel's to sign, as before.
- **Supersedes in part:** D-107's founder-only merge list; D-107's update names the same classes.
- **Effects:** `supabase/APPLY.md` (files 18, 20, 24 and the backup server file), `docs/ops/DEPLOY.md`, `docs/ops/BACKUP_RUNBOOK.md`, `docs/ops/APP_STORE_CONNECT_SUBSCRIPTIONS.md` and the comment on the `workflow_dispatch` trigger in `.github/workflows/deploy-db.yml` name the process: after two independent passing reviews on the current head, with green CI, the coordinator merges into `develop`, and the founder applies through `deploy-db.yml` (PR #261). The `approve-migration` label (D-041) is no longer used; no workflow reads it. `docs/agents/COORDINATION.md` section 6 still states D-107's rule (follow-up for its owner).
- **Owner:** founder (the approval); coordinator (the operating rule).
