Excerpt of docs/qa/run-sheets/AL-08-server-kill-switch.md as of develop 22db1daa^ (27 Oct 2026). Only lines near the citation are kept.

| Proves | A build made with `EXPO_PUBLIC_SERVER_FEATURES=off` has no server code path: no Supabase client, no sign-in, no sync, co-parent entries show coming soon (`apps/mobile/src/lib/capabilities.ts`, D-100); the kill path in `docs/release/TESTFLIGHT.md` "If something goes wrong" (PR #145) works in the order written, and local recording, reading and export keep working while the server side is stopped (LEGAL-REQ-040, F16-REQ-018 intent). 07 G3 "kill switch drill"; alpha go/no-go check 4 (`docs/release/ALPHA_PLAN.md` section 6.1) |

