# Brief for the product agents: make the requirement cards exhaustive and lock them (20 Nov 2026)

Status: WORKING-INPUT (record; findings applied in the cards; do not load) | 20 Nov 2026 | Owner: the review role named in the file | Replaces: none | Load when: auditing where a finding came from; otherwise do not load.

You are working as the Early Letters product lead with the Chief Product Officer role (read `.claude/skills/early-letters-cpo/SKILL.md` in full first), in your own git worktree. Edit ONLY the files assigned to you. Commit on your branch (already checked out) with a clear message ending in:

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01WsZfAr14RMFfiXXQyKD8VR

Do NOT push, open PRs, edit BACKLOG.md, BOARD.md, 00-product-frame.md, README.md, VISION.md, 13-engineering-plan.md, 14-test-plan.md, or any file outside your assignment. Do not post to GitHub.

## Why
The founder approved the requirements and asked for them to be "very detailed and clear and covering all scenarios ... clear thorough and exhaustive so engineering knows all details", customer-first, so the harness can assign engineers and engineering never has to debate the why or the what. Three executive review passes (all twelve roles) produced findings. Karma has ruled on the disagreements and the founder-class defaults.

## Read first, in full
1. `/home/claude/review/00-rulings-round2.md` (binding rulings; apply them).
2. The three reviews, the sections for your cards and the cross-cutting sections:
   - `/home/claude/review/r1-product-design-cmo-cbo.md` (CPO, Design, CMO, CBO; FRAME section items apply to every card)
   - `/home/claude/review/r2-privacy-legal-security-data-ai.md` (CPrivO, CCO, CLO, CISO, CDO, CAIO; section 0 X1 to X12 apply to every card)
   - `/home/claude/review/r3-cfo-cto-quality.md` (CFO, CTO, quality; F1 to F17 and per-card engineering detail)
3. `/home/claude/pdf/research-notes.md` (Apple facts read 20 Nov).
4. Your cards as they stand, `docs/product/prd/README.md` (card shape), `CLAUDE.md`, and any code file a finding cites, to confirm the fact before you write it (if a finding is wrong against the code, say so in your report and do not apply it).

## What every card must contain after your edit (the locked card shape)
Status line at the top of the file: `Status: Locked v1.0, 20 Nov 2026 (council round 2). Changes after lock need a PR that lists every changed id.`
For each card, in this order (a section may say "n/a because ..." but may not be missing):
1. Who and when (persona, the moment).
2. Why (the job, what goes wrong today, evidence tag).
3. What, and Not in scope.
4. Happy path (numbered steps).
5. Unhappy paths and edge cases (table).
6. Scenario coverage table: one row each for first use; empty; many (1,000 letters, 300 pictures); offline; slow; failed; interrupted (call, Siri, alarm, the baby); app killed mid-flow; app updated mid-flow; low storage (under 1 GB, under 50 MB); Low Power Mode and low battery; two books; two parents; expecting parent (due date only); multilingual (Devanagari, RTL, CJK); largest text size (AX5 plus Bold Text) on an iPhone SE 3; VoiceOver; Voice Control and Switch Control; Reduce Motion; dark mode and Increase Contrast; plan lapsed; signed out; second account on the same phone; new phone. Each row: the behaviour, or "n/a because ...".
7. Acceptance criteria table: columns `Id | Given, When, Then | Priority | Test title`. Priority is P0 with its RR-4 reason in brackets ((a) a promise, (b) a legal or store duty, (c) the core loop), or P1, or P2. Every row atomic (one behaviour), testable, with a number or an observable state. Keep existing ids stable; add new ids after the last; split a non-atomic row into a and b suffixes. Test titles in the form `[NS-xx-Rn] short title`.
8. Non-functional budgets block: latency (p95 on SE 3), memory, on-device storage, battery, offline behaviour, accessibility, localisation, privacy (log canary). Inherit 06-nfr defaults and state only differences, but every line present.
9. State space (RR-5) table where the card touches sync, accounts or notifications, including: second phone, second account on the same phone, offline, retry after a lost answer, sign out, account deletion, kill switch (`serverFeaturesEnabled()` off) and the card's remote pause, plan lapse.
10. Data and engineering block: fields (existing or new, with file and line when existing), types, classes (L1 to L4), migrations (local and server; server ones must update the `entries` content trigger tuple and `book_entries` view), sync field group, export schema effect, modules and files touched, flags (names) and remote pause keys, error codes, rollout and rollback. Use the CTO pass's paste-ready text where given, after checking it.
11. Data inventory rows (field, class, where, synced, retention clock, deletion path, export, log exclusion) for any new or newly used data.
12. Door lines (Shown, Records, Never, Decline) where consent, sign-in, another adult's data, deletion or sharing is touched; for plain settings, "Records: on the phone only; no PRIV-R21 row, because this is a setting".
13. Threat rows (asset, threat, control, test) where a trust boundary is crossed.
14. The Never line from ruling D3 (no system intelligence donation) and D2 (writing tools off) on every card that stores a parent's words.
15. Design inputs (states to draw, components reused, layout at AX5 on SE 3, motion, dark mode, Smart Invert for pictures).
16. Content inputs (lines as intent; banned words; who approves).
17. Legal, privacy and compliance inputs with current counsel numbers (packet 1.5.0) and "counsel must confirm".
18. `**Label effect.**` line (none, or what changes in the App Store privacy label and when).
19. Claims: what this card lets us say in public and what it forbids.
20. Free or Plus (apply ruling T2).
21. Measures with analytics off (source, x of n reporting rule, fixed question wording).
22. Dependencies and gates (cards, ADRs, counsel, founder words, device runs). No build numbers or dates (ruling T5).
23. Open questions: only those that truly remain, each with an owner and a default that applies if unanswered.

## Rules
- Customer first: who, why and what before how. Plain words.
- Repo content rules: no em dashes, en dashes, curly quotes, ellipsis characters or emoji; never gender the child (`{child}`); no fear, guilt or loss language in any line meant for a parent; never imply the app writes anything; no counts, streaks or badges. Fictional family: Asha.
- Mark numbers you propose as PROPOSED. Mark anything not read in code or a source this session as UNVERIFIED. Legal readings: "counsel must confirm". Never state a price or law from memory.
- No word limit. Be exhaustive and exact, but no padding or repetition.
- Keep every existing id. If you remove a row, keep its id with "Withdrawn 20 Nov: reason".

## Report back
A short list: which findings you applied, which you rejected and why (with the code evidence), new ids added per card, every changed or withdrawn id, open founder or counsel items, and your branch head sha.
