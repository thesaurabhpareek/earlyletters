# Evidence

Dated, content-free records that a control was checked on a real system, kept so the founder can show what was true on a given day. A record says what was read, when (UTC), by whom and what it showed. It never holds a letter, a child's name, an email address, an access token or a key.

- One file per check, named `<topic>-<yyyy-mm-dd>.md`.
- Start from the template for that topic (`TEMPLATE-*.md` here).
- A value nobody read yet says `NOT RUN`, not a guess.
- Added by BL-603 (SEC-10). Other items may add their own templates.

| Topic | Template | Runbook |
|---|---|---|
| What Supabase logs on staging, for how long, and who can read it | `TEMPLATE-supabase-logs-staging.md` | `docs/ops/runbooks/supabase-logs-readback.md` |
