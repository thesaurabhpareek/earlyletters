# Roadmap: the 30-day path to App Store submission
Owner: lead PM (coordinator merges). **Version 2.1, 3 Oct 2026 (evening)**, by the backlog-consolidation PM. Supersedes 2.0 of the same day: same target, reconciled with what the 3 Oct waves actually built (`docs/BACKLOG.md` v1.0, checked in code), the security review (`docs/reviews/2026-10-04-security-privacy.md`), legal-alignment's Q-003 memo, and one ordered founder list (`docs/FOUNDER_TASKS.md`). After v1.0: `docs/backlog/FUTURE.md`. Who is doing what right now: `docs/agents/BOARD.md`.
**Target: submit to App Review in the week of Mon 2 Nov 2026 (Mon 2 Nov at the earliest, Fri 6 Nov at the latest). Release on approval, planned for Mon 16 Nov, with 9 to 20 Nov as the buffer for one rejection cycle.** The 30 days run from Mon 5 Oct to Wed 4 Nov.

| 3 | Mon 19 to Fri 23 Oct | Daily C1 fixes; store screenshots from the release build (BL-340); review notes and demo account (BL-341) | FT-32 to FT-38: **C1 from Mon 19**, daily triage, counsel comments (Fri 23), per-language go or no-go (Fri 23), trademark opinion if needed, check the support resources, insurance quotes, screenshot review | C1 families recording; crash-free sessions 99.5% or more |
| 4 | Mon 26 to Fri 30 Oct | **Feature freeze Mon 26.** Fixes only; release PR to `main`; `release/1.0` cut; first RC tag `ios-v1.0.0-rc.1` (ADR 0022; `ios-v1.0.0` follows release) | FT-39 to FT-44: release-candidate device checks, C1 exit review (Thu 29), counsel sign-off and 1.0.0 policy versions (Thu 29), D-031 Hindi script (Fri 30), listing and privacy answers (Fri 30), approve the release | Release candidate built; listing complete |
| Submit | Mon 2 to Fri 6 Nov | Answer App Review questions within a day | FT-45: submit with manual release | In review |
| Buffer | 9 to 20 Nov | One rejection cycle | Release on approval (planned Mon 16 Nov) | Live in the US App Store |

C1 exit criteria (Thu 29 Oct): zero open S0 or S1; crash-free sessions 99.8% or more; no fidelity complaint traced to an engine edit; the co-parent flow done without help.

Thu 15  Beta App Review submitted (security fixes BL-330, BL-347, BL-322, BL-331 in the build)
Fri 16  FT-22 device spikes done
Mon 19  FT-32 C1 starts
Fri 23  FT-33 counsel comments; FT-34 language go or no-go
Mon 26  feature freeze (BL-342 in)
Thu 29  FT-40 C1 exit; FT-41 counsel sign-off
Fri 30  FT-43 listing; RC that passed FT-39 chosen (ios-v1.0.0 is tagged after release, ADR 0022)
Mon 2   FT-45 submit
