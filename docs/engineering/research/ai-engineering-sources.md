# AI-assisted engineering: sources

Annotated bibliography behind chapter 09 (`docs/engineering/09-ai-assisted-engineering.md`, prefix AIE). Owner: `ai-eng-lead`. Every source below was opened in this run on 2026-10-03. Takeaways are paraphrased; each source has at most one direct quote, under 15 words. Refresh at most quarterly (charter standing duty 3).

How sources were read: `x.com` and some vendor pages refused the fetch tool, so posts on X were read as text through the public `api.fxtwitter.com` mirror of the same post id, and pages were fetched with `curl` and stripped to text. Where only a secondary copy could be read, the entry says so.

## Karpathy

**K1. "Vibe coding" post.** Andrej Karpathy, X, 2 Feb 2025. https://x.com/karpathy/status/1886192184808149383 (text read via https://api.fxtwitter.com/karpathy/status/1886192184808149383). Checked 2026-10-03.
- Describes accepting every diff unread and pasting errors back until the app works; he calls it fine for throwaway weekend projects.
- The point for us is the boundary: code we care about is the opposite mode.
- Quote: "forget that the code even exists".
- Supports: AIE-R16, AIE-R18 (we never work in this mode on `develop`).

**K2. "Context engineering" post.** Andrej Karpathy, X, 25 Jun 2025. https://x.com/karpathy/status/1937902205765607626 (text via the fxtwitter mirror). Checked 2026-10-03.
- Too little context and the model underperforms; too much or irrelevant context raises cost and lowers quality.
- Context engineering sits inside a larger layer: splitting problems into control flow, dispatching to models of the right capability, generation and verification flows, guardrails, evals.
- Quote: "filling the context window with just the right information for the next step".
- Supports: AIE-R08, AIE-R09, AIE-R10, AIE-R24.

**K3. "Software Is Changing (Again)", YC AI Startup School keynote.** Andrej Karpathy, June 2025. https://www.youtube.com/watch?v=LCEmiRjPEtQ (title and Y Combinator channel confirmed through YouTube oEmbed; the video itself was not watched). Wording checked against a transcript clipping, https://alexanderweichart.de/3_Resources/Clippings/2026-01-06---Andrej-Karpathy-Software-Is-Changing-(Again), and notes at https://ikyle.me/blog/2025/andrej-karpathy-software-is-changing-again. Both are secondary. The YC library page did not load in this run. Checked 2026-10-03.
- Partial autonomy: the human sets an autonomy slider per task, more for easy work and less for hard work ("Iron Man suits", not robots).
- He does not want a 10,000-line diff; the human is still the bottleneck, so make the generate and verify loop as fast as possible.
- Vague prompts produce the wrong work; being concrete raises the odds the first verification passes.
- Quote: "I always go in small incremental chunks."
- Supports: AIE-R12, AIE-R13, AIE-R21 (autonomy levels).

**K4. Notes from claude coding, January 2026.** Andrej Karpathy, X, 26 Jan 2026. https://x.com/karpathy/status/2015883857489522876 (text via the fxtwitter mirror). Checked 2026-10-03.
- Mistakes are now conceptual: wrong assumptions run without checking, no clarifying questions, no surfaced inconsistencies or trade-offs, too sycophantic.
- Models bloat code and abstractions, leave dead code, and change or delete code and comments orthogonal to the task. Instructions in `CLAUDE.md` alone did not fix this.
- Leverage comes from declarative goals: give success criteria, have it write tests first and pass them, write the naive correct version then optimise while preserving correctness.
- Quote: "Don't tell it what to do, give it success criteria and watch it go."
- Supports: AIE-R05, AIE-R12, AIE-R14, AIE-R15, AIE-R16.

## Anthropic

**A1. Building effective agents.** Anthropic (Erik Schluntz, Barry Zhang), 19 Dec 2024. https://www.anthropic.com/engineering/building-effective-agents. Checked 2026-10-03.
- Prefer the simplest workflow that works; agents trade cost and latency for capability.
- Agents need ground truth from the environment at each step (tool results, code execution), checkpoints for human feedback, and stopping conditions such as an iteration cap.
- Design the agent-computer interface: "poka-yoke" tools so mistakes are hard (absolute paths fixed a class of errors).
- Quote: "finding the simplest solution possible, and only increasing complexity when needed".
- Supports: AIE-R18 (stop conditions), AIE-R24, the plain-code dispatcher (ADR 0014).

**A2. Effective context engineering for AI agents.** Anthropic Applied AI team, 29 Sep 2025. https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents. Checked 2026-10-03.
- Context rot: recall falls as token count grows, so context is a finite attention budget.
- System prompts should sit at the right altitude: neither brittle hardcoded logic nor vague guidance.
- Just-in-time retrieval: keep lightweight identifiers (paths, queries) and load on demand; structured note-taking outside the window (a NOTES file) carries state across resets; sub-agents keep detailed search out of the lead context.
- Quote: "smallest possible set of high-signal tokens".
- Supports: AIE-R08, AIE-R09, AIE-R10, AIE-R07 (memory as structured notes).

**A3. Best practices for Claude Code.** Anthropic docs, undated page. https://code.claude.com/docs/en/best-practices. Checked 2026-10-03.
- Giving the agent a check it can run is the guidance the page stresses most (tests, build exit code, a fixture diff); without one, the human becomes the verification loop.
- Keep `CLAUDE.md` short; if a rule keeps being ignored the file is probably too long; emphasise one line, not many. Hooks are deterministic, instructions are advisory.
- A fresh context reviews better because it is not biased toward code it just wrote (writer and reviewer sessions). After correcting the agent more than twice on the same issue, restart with a better prompt.
- Quote: "Would removing this cause Claude to make mistakes?"
- Supports: AIE-R03, AIE-R04, AIE-R06, AIE-R14, AIE-R18, AIE-R19.

## Instruction file conventions

**C1. AGENTS.md.** agents.md, stewarded by the Agentic AI Foundation (Linux Foundation). https://agents.md/. Checked 2026-10-03.
- A predictable, plain-Markdown file for agent instructions: build and test commands, conventions, PR rules, security notes. Nested files for monorepo packages.
- On conflict the nearest file wins, and explicit user prompts override everything.
- Quote: "The closest AGENTS.md to the edited file wins".
- Supports: AIE-R01, AIE-R02.

**C2. OpenCode rules.** OpenCode docs. https://opencode.ai/docs/rules/. Checked 2026-10-03.
- OpenCode (our default engine, ADR 0015) loads `AGENTS.md`, and falls back to `CLAUDE.md` only when no `AGENTS.md` exists.
- Quote: "only AGENTS.md is used" (when both exist).
- Supports: AIE-R02 (a stray `AGENTS.md` would silently drop the constitution from open-weight runs).

**C3. OpenAI Codex best practices and AGENTS.md guide.** OpenAI developer docs. https://developers.openai.com/codex/learn/best-practices and https://developers.openai.com/codex/guides/agents-md. Checked 2026-10-03.
- A task prompt should state Goal, Context, Constraints and Done when.
- Keep `AGENTS.md` short and accurate; when the agent repeats a mistake, run a retrospective and update the file. Instruction files are concatenated root to leaf, capped at 32 KiB by default.
- Ask the agent to write tests, run the right suites and review the diff before you accept it.
- Quote: "add new rules only after you notice repeated mistakes".
- Supports: AIE-R03, AIE-R05, AIE-R12.
- Not fetched: OpenAI's "Harness engineering" post (`openai.com/index/harness-engineering/` returned 403). It is cited here only through Boeckeler's summary (F2).

## Practitioners

**W1. Here's how I use LLMs to help me write code.** Simon Willison, 11 Mar 2025. https://simonwillison.net/2025/Mar/11/using-llms-for-code/. Checked 2026-10-03.
- Account for training cut-off dates: models do not know newer library versions, so supply current docs or examples.
- Context is king; for production code, give detailed, authoritarian instructions.
- You cannot outsource testing that the code works; mistakes can be inhuman, such as invented methods.
- Quote: "treat it like a digital intern".
- Supports: AIE-R11, AIE-R12, AIE-R14.

**W2. The lethal trifecta for AI agents.** Simon Willison, 16 Jun 2025. https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/. Checked 2026-10-03.
- Private data, untrusted content and external communication together let an attacker steal data through the agent.
- Guardrail products that catch "95%" of attacks are not a defence; remove one leg of the trifecta.
- Quote: "avoid that lethal trifecta combination entirely".
- Supports: AIE-R21, AIE-R22.

**B1. Augmented Coding: Beyond the Vibes.** Kent Beck, Tidy First?, 25 Jun 2025. https://tidyfirst.substack.com/p/augmented-coding-beyond-the-vibes. Checked 2026-10-03.
- Augmented coding cares about the code, its complexity, tests and coverage; vibe coding cares only about behaviour.
- Warning signs: loops, functionality not asked for, and cheating such as disabling or deleting tests.
- His system prompt drives one failing test at a time from a `plan.md`.
- Quote: "disabling or deleting tests".
- Supports: AIE-R15, AIE-R16, AIE-R18.

**F1. Context Engineering for Coding Agents.** Birgitta Boeckeler, martinfowler.com, 5 Feb 2026. https://martinfowler.com/articles/exploring-gen-ai/context-engineering-coding-agents.html. Checked 2026-10-03.
- Splits context into instructions, guidance (rules) and context interfaces (tools, MCP, skills, file search); each configured interface costs context.
- Who loads context matters: the model (non-deterministic), the human, or the agent software at fixed points (deterministic).
- Build rules files up gradually; path-scoped rules keep the always-loaded file small.
- Supports: AIE-R08, AIE-R09, AIE-R10.

**F2. Harness engineering for coding agent users.** Birgitta Boeckeler, martinfowler.com, 2 Apr 2026 (first memo 17 Feb 2026). https://martinfowler.com/articles/harness-engineering.html and https://martinfowler.com/articles/exploring-gen-ai/harness-engineering-memo.html. Checked 2026-10-03.
- A harness has guides (feedforward: instructions, skills) and sensors (feedback: tests, linters, review); either alone fails.
- Computational controls (tests, types, linters) are cheap and reliable and should run on every change; inferential ones (LLM review) are slower and non-deterministic.
- Summarising OpenAI's write-up: when an agent struggles, treat it as a signal and feed the missing tool, guardrail or doc back into the repo; periodic "garbage collection" agents fight doc drift.
- Supports: AIE-R05, AIE-R06, AIE-R07, AIE-R19.

**F3. TDD inside the agent loop: theater or actual value?** Birgitta Boeckeler, martinfowler.com, 10 Aug 2026. https://martinfowler.com/articles/exploring-gen-ai/tdd-in-the-agent-loop.html. Checked 2026-10-03.
- In her small exploratory eval, telling an agent to do TDD inside its own loop made no clear quality difference.
- What still matters: tests whose expected values are not derived from the implementation (tautology), and strong regression tests, checked with mutation testing.
- Watching a test go red proves little when the same agent wrote and ran it.
- Supports: AIE-R14 (tests stated from the requirement), AIE-R17, AIE-R19. It argues against mandating a TDD ritual.

**F4. Humans and Agents in Software Engineering Loops.** Kief Morris, martinfowler.com, 4 Mar 2026. https://martinfowler.com/articles/exploring-gen-ai/humans-and-agents.html. Checked 2026-10-03.
- Humans own the "why loop"; inspecting every generated line makes the human the bottleneck.
- Better: build and tune the loop so agents can judge their own output (shift left), and fix the harness when output is wrong.
- Supports: AIE-R19, AIE-R23, AIE-R24.

**O1. My LLM coding workflow going into 2026.** Addy Osmani, 4 Jan 2026. https://addyosmani.com/blog/ai-coding-workflow/. Checked 2026-10-03.
- Spec and plan before code; break work into small iterative chunks.
- Context packing: give the model the code, constraints and pitfalls up front.
- Review everything, including with a second model; commit often as save points.
- Quote: "Never commit code you can't explain."
- Supports: AIE-R12, AIE-R13, AIE-R19.

**T1. How to Build an Agent.** Thorsten Ball, Amp, 15 Apr 2025. https://ampcode.com/how-to-build-an-agent. Checked 2026-10-03.
- A coding agent is a small loop around a model with a few tools (read, list, edit); the rest is engineering effort.
- Supports: the plain-code harness view in AIE principles (the model is one part; the loop and its checks are ours to engineer).
- Quote: "an LLM, a loop, and enough tokens".

## Research on delivery

**D1. 2025 DORA report: State of AI-assisted Software Development.** Google Cloud DORA, 23 Sep 2025. Google blog summary https://blog.google/technology/developers/dora-report-2025/; InfoQ write-up, 29 Sep 2025, https://www.infoq.com/news/2025/09/dora-state-of-ai-in-dev-2025. The full PDF was not opened. Checked 2026-10-03.
- About 90% of surveyed professionals use AI; AI adoption now correlates with higher delivery throughput, but delivery instability also rises.
- AI amplifies the organisation: strong teams gain, fragmented ones see their weaknesses magnified. Seven capabilities (clear AI policy, healthy data, quality internal platforms, among others) amplify benefits.
- Quote: "mirror and a multiplier".
- Supports: AIE-R23, AIE-R24 (measure instability per agent: reverts and fix-first rates, not just volume).

## Where the sources agree

1. **Verification is the bottleneck and the lever.** Karpathy (K3, K4), Anthropic (A3), Willison (W1), Morris (F4), Osmani (O1) and Codex (C3) all put a runnable check at the centre. Our CI plus the red team is the harness; every rule should end in a check.
2. **Small, concrete tasks with explicit success criteria.** K3, K4, A3, C3 and O1 agree. Codex's "Done when" and Karpathy's success criteria are the same idea.
3. **Context is a budget.** K2, A2, A3 and F1: less, more relevant, loaded just in time. Short instruction files beat long ones (A3, C3).
4. **Instructions alone do not hold.** K4 (CLAUDE.md did not fix the behaviour), A3 (hooks are deterministic, rules advisory), F2 (guides need sensors). Unenforced rules decay.
5. **Independent review.** A3 (fresh context), O1 (second model), K4 (watch them closely). Our red team on a different model family follows this.
6. **Agents cheat and wander.** B1 (disabling tests, unrequested features) and K4 (orthogonal edits) describe the same failure.

## Where they disagree or are uncertain

1. **TDD inside the agent loop.** Karpathy (K4) and Beck (B1) recommend tests first; Boeckeler's small eval (F3) found no clear benefit and recommends mutation testing on regression suites instead. Chapter 09 asks for tests stated from the requirement, first or alongside, and does not mandate red-green ritual.
2. **How close the human stays.** Karpathy (K4) says watch them like a hawk; Morris (F4) says inspecting every line makes the human the bottleneck and the harness should do more. Our setup splits it: the harness checks everything; the founder reviews small PRs plus the red-team verdict.
3. **Autonomy trend.** K4 reports a jump in agent coherence around December 2025, while DORA (D1) finds rising instability alongside rising throughput. We raise autonomy per agent only on measured receipts (AIE-R24), not on general claims.
4. **Model evidence.** Vendor benchmarks for DeepSeek and GLM are self-reported (ADR 0015, HARNESS section 3). None of these sources evaluate open-weight models in a harness like ours; our receipts are the only evidence that counts.
