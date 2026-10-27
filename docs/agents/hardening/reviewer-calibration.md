# Reviewer calibration: is the red team still discriminating?

Gap: in the first weeks every red-team review ended "fix first" or "founder decision"; none said "ship". A reviewer that never passes anything tells the founder nothing, the same as one that passes everything.

Built (scripts/agents/verdicts.mjs): the board shows the verdict mix over the last 20 red-team reviews and warns when 15 or more in a row carry no "ship". A review counts only if it starts with `<!-- red-team:<sha> -->`, has a `Verdict:` second line, and comes from a trusted identity.

Not built yet: the calibration set. The plan is six patches (3 clean ones from merged PRs, 3 with a seeded defect) with a written answer key, run through the red team now and then to check it passes the clean ones and catches the seeded ones. Four draft patches exist in the qa worktree but have no answer key, so they are not committed. Until the set exists, the board warning is the only signal, and it cannot tell a strict reviewer from a broken one.
