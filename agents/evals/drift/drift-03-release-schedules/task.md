# Task: make the release schedule agree with itself

The working directory holds a slice of the Early Letters repository as it stood on the morning of Tue 27 Oct 2026. Three files state the release schedule, and they disagree:

- `docs/ROADMAP.md`: the 3 Oct plan (feature freeze Mon 26 Oct, submit to App Review Mon 2 Nov, release planned Mon 16 Nov).
- `docs/release/1.0.0.md`: the release record, which still repeats the roadmap's dates.
- `docs/qa/ALPHA_GO_NO_GO.md`: the QA checklist for the alpha, which carries the coordinator's current proposals.

`docs/DECISIONS.md` (index rows only, in this slice) records why: D-106 turned the release into an alpha first and re-planned submission after it.

Your job is to bring the files into line so that a reader who opens any one of them is not told a date the others have overtaken.

Rules:
- `docs/qa/ALPHA_GO_NO_GO.md` owns the live alpha dates. Do not change its dates or remove its "until the founder confirms" hedge. Dates are proposals until the founder confirms them in the repository; keep that wording wherever you state them.
- Do not invent any date. If the files do not give a date for something, say it has no date yet.
- Do not edit `docs/DECISIONS.md`.
- Do not delete a file or a section to make the conflict disappear; mark what is overtaken and say where the live dates are.
- Content rules for anything you write: no em dashes, en dashes, curly quotes, ellipsis characters or emoji.

The result is graded by code that reads the dates out of the three files.
