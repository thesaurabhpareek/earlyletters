# 06 Security engineering (excerpt)

**SEC-R13 (MUST)** A PR touching `supabase/**`, `.github/**` or a path named auth, session or sign-in needs an independent review run, and after two independent passing reviews on the current head and green CI, the coordinator merges it (D-117; the `approve-migration` label of D-041 is no longer used) (BL-122). *Enforced by:* `fence.yml`, pending PR #30; advisory until SEC-R12 makes it a required check.

