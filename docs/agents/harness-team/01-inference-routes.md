# 01 Inference routes: which zero-cost model routes could run the Early Letters agent harness

Harness team, inference-route inventory. Research only (CR-5 freeze until the go/no-go on Mon 9 Nov 2026). No signups, keys, secrets or GitHub writes were made.

- **All vendor pages were read on Sat 31 Oct 2026 (UTC)** with `curl` from this session. Raw copies are in `/tmp/claude-0/-home-claude/2ef9998b-56d5-5d6e-91ae-79b4944c4d2a/scratchpad/harness-team/pages/`.
- **The test applied is D-127 as briefed:** no spend and no payment card. A route that needs a card, a credit purchase or a paid plan to reach usable capacity fails the test, even if the money would never be charged.
- **UNVERIFIED** marks anything this session could not read on a vendor page: a page behind a login, a page that did not load, or a figure only third parties state.
- **What "usable" means for this harness** (from the repo, not from vendors):
  - Each run is up to 80 model steps (`agents/roster.json` `defaults.max_turns: 80`). One step is one model request.
  - The team is 24 agents, with a 30-run daily cap (`docs/agents/HARNESS.md` section 5).
  - OpenCode needs a context of 64K tokens or more ([docs.ollama.com/integrations/opencode](https://docs.ollama.com/integrations/opencode): "OpenCode requires a context length of 64k or higher").
  - So one full run is about 80 requests and probably 1M to 3M input tokens. That is my estimate, not a measurement.

## Summary table

| # | Route | Card? | Free capacity (verified) | Best free models (open weights?) | OpenAI-compatible | From Actions | Prompts used for training (free tier) | Verdict |
|---|---|---|---|---|---|---|---|---|
| 1 | OpenRouter `:free` | No purchase needed for the 50/day tier. Card at signup: UNVERIFIED | 20 RPM, **50 requests/day** (1,000/day only after buying 10 credits, which breaks D-127) | Laguna S 2.1, Inkling, Nemotron 3 Ultra, Gemma 4 31B, North Mini Code (all open-weight). No DeepSeek or GLM free | Yes | Yes (API key secret) | Depends on the provider. Thinking Machines and Poolside do train on prompts | **Top for a proof run.** Fits the harness as it is, but gives about half of one run a day |
| 2 | NVIDIA API Catalog (build.nvidia.com) | **No** ("no credit card required") | Rate limit not documented. About 40 RPM is user-reported: UNVERIFIED | **DeepSeek V4.1 Flash** (the harness default), GLM-5.3 Flash, Kimi K2.6, Nemotron 3 Ultra, Laguna XS 2.1 | Yes | Yes (API key secret) | **Yes**: "User Content and Generated Content to improve NVIDIA products and services, including AI models" | Best models and capacity, but the terms say trial only, "not in production". **Founder or legal reading needed** |
| 3 | Google Gemini API, free tier | **No** (Free tier = "Active project or free trial") | Per-model figures only in AI Studio after login: **UNVERIFIED** | Gemini 3.8 Flash, 3.6 Flash, 3.5 Flash-Lite (closed). **Gemma 4** (open) | Yes | Yes (API key secret) | **Yes, and human reviewers may read it** | Strong, but the closed models conflict with the founder's "open source", and the limits are not verifiable |
| 4 | Local Mac (Ollama or llama.cpp) | No | Bound by Mac RAM. **Founder's Mac specs: UNVERIFIED** | Any open-weight model that fits | Yes (`localhost:11434/v1`) | Only if the Mac is a self-hosted runner, or runs the agent itself | No third party sees anything | Best privacy and terms. Feasibility depends on the Mac |
| 5 | Mistral "Free mode" | **No** ("no credit card required") | Shown only on the Limits page in the console: **UNVERIFIED** | Devstral 2 (open, Modified MIT), Mistral Medium 3.5 (closed). Whether either is in Free mode: UNVERIFIED | Yes (`/v1/chat/completions`) | Yes | Free-mode default: UNVERIFIED. Labs or preview models are trained on | Possible. Needs a console look after signup |
| 6 | Cloudflare Workers AI | Workers Free is the default plan. Card at signup: UNVERIFIED | **10,000 Neurons/day**, about 0.3M gpt-oss-120b input tokens/day. 300 RPM | gpt-oss-120b, qwen3-30b-a3b, qwen3.8-27b (open). **DeepSeek and GLM need a paid plan** | Yes | Yes | **No** ("does not use Customer Content ... to train") | Clean terms, but under one run a day |
| 7 | Groq free | UNVERIFIED | gpt-oss-120b and qwen3.8-27b: 30 RPM, 1K RPD, **8K TPM**, 200K TPD | gpt-oss-120b, gpt-oss-20b, qwen3.8-27b (open) | Yes | Yes | **No** ("not permitted to use Inputs or Outputs for training") | The 8K TPM cap is below one 64K-context request. Not usable |
| x | GitHub Models | n/a | **Retired 30 Jul 2026** | n/a | n/a | No `models` permission exists any more | n/a | **Dead** |
| x | Cerebras | **Yes**: "$5 in free credits after adding a verified payment method" | 5 RPM, 1M TPD, 30-day trial | gpt-oss-120b, qwen-3.8-27b | Yes | Yes | not checked | **Excluded** (needs a card, not permanent) |
| x | Hugging Face Inference Providers | Credits purchase | Free users get **no** monthly credits | n/a | Yes | Yes | not checked | **Excluded** |
| x | Self-host on a GitHub-hosted runner | No | 4 CPU, 16 GB RAM, 14 GB SSD, no GPU, 6 h per job | Only small models fit | Yes | It is Actions | No third party | **Not viable** for agentic coding |

---

## 1. GitHub Models: retired

- **Status.** "As of July 30, 2026, GitHub Models has been fully retired. The playground, model catalog, inference API, and bring your own key (BYOK) are no longer available to any customer."
  - Source: [docs.github.com/en/github-models/use-github-models/prototyping-with-ai-models](https://docs.github.com/en/github-models/use-github-models/prototyping-with-ai-models), read through `docs.github.com/api/article/body?pathname=...`.
  - The billing page says the same: [docs.github.com/en/billing/concepts/product-billing/github-models](https://docs.github.com/en/billing/concepts/product-billing/github-models).
- **Permission.** The `permissions` table in the workflow syntax reference no longer lists `models` at all ([docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax)). `GITHUB_TOKEN` with `models: read` is therefore not a route.
- **The nearest replacement is not usable here.** The same table has `copilot-requests: write`, which "permits a workflow in an **organization-owned** repository to use Copilot CLI with `GITHUB_TOKEN` when the organization's billing policy allows it." This repo is on a personal account. Copilot is also a paid product: out of scope under D-127.
- Card, limits, models, terms, free-tier risk: n/a (the service does not exist).

## 2. OpenRouter free models (`:free`)

**Sources:**
- [openrouter.ai/docs/api-reference/limits](https://openrouter.ai/docs/api-reference/limits) (read as `.md`)
- [openrouter.ai/docs/guides/routing/model-variants/free](https://openrouter.ai/docs/guides/routing/model-variants/free)
- [openrouter.ai/docs/guides/privacy/logging](https://openrouter.ai/docs/guides/privacy/logging)
- [openrouter.ai/docs/guides/privacy/data-collection](https://openrouter.ai/docs/guides/privacy/data-collection)
- [openrouter.ai/terms](https://openrouter.ai/terms) (Last Updated 31 Aug 2026)
- The public model API [openrouter.ai/api/v1/models](https://openrouter.ai/api/v1/models) and per-model `/endpoints`
- Provider terms linked from [openrouter.ai/api/v1/providers](https://openrouter.ai/api/v1/providers)

**Card.**
- No credit purchase is needed for free models. The limits table has a "Less than 10" credits-purchased tier, which includes zero.
- Whether signup itself asks for a card: not stated on the pages read (UNVERIFIED).
- **The 1,000/day tier needs "at least 10" credits purchased (all time). That is spend, so D-127 excludes it.**

**Limits (verbatim table):**

| Credits purchased (all time) | Requests per minute | Requests per day |
|---|---|---|
| Less than 10 | 20 | 50 |
| At least 10 | 20 | 1000 |

- "Making additional accounts or API keys will not affect your rate limits, as we govern capacity globally."
- The terms also forbid "create multiple accounts as a single user, for purposes of bypassing or circumventing use limits".
- Token limits per minute or day for free variants: none are stated. Upstream providers may also return 429.

**Models.** 16 `:free` entries were in the public model list on 31 Oct 2026. None are DeepSeek or GLM, so the current roster models have no free variant. All are described as open-weight. The relevant ones:

| Model id | Size | Context | Tools | Coding and agent strength (vendor or OpenRouter description only; no independent benchmark read) |
|---|---|---|---|---|
| `poolside/laguna-s-2.1:free` | 118B total, 8B active | 262K (32K max output) | yes | "coding agent model ... scoring 70.2% on Terminal-Bench 2.1" (vendor claim) |
| `thinkingmachines/inkling:free` | 975B total, 41B active | 1M | yes | "designed for general-purpose reasoning, coding, agentic and tool-use systems" |
| `nvidia/nemotron-3-ultra-550b-a55b:free` | 550B total, 55B active | 1M | yes | "open frontier-reasoning and orchestration model" |
| `cohere/north-mini-code:free` | 30B total, 3B active | 256K | yes | "Cohere's first agentic coding model" |
| `poolside/laguna-xs-2.1:free` | 33B total, 3B active | 262K | yes | coding agent model |
| `google/gemma-4-31b-it:free` | 31B dense | 262K | yes | "native function" calling |
| `recursive/flint-v1.0:free` | 40B total, 2.5B active | 262K | yes | "built ... for coding agents" |

- There is also a router, `openrouter/free`, which "falls back only to other free models".
- Strength at agentic coding: UNVERIFIED beyond the vendor claims above. A 50-request day is too small to measure it.

**OpenAI-compatible:** yes. **GitHub Actions:** yes, with an API key secret. This is exactly what `.github/workflows/agents.yml` does today (`OPENROUTER_API_KEY`).
- `scripts/agents/run-opencode.mjs:112` already exempts model ids ending `:free` from its "paid model reported zero cost" stop.

**Terms on automated use and training (quotes):**
- OpenRouter itself: "OpenRouter does not store your prompts or responses, *unless* you opt in". Using inputs to improve the product is "Off by default".
- Providers: "Some Models may store or train on your Inputs for improving their own large language models ... Where possible, OpenRouter has opted out of model training with the Models it uses." And: "you can set whether you would like to allow routing to providers that may train on your data ... There are separate settings for paid and free models."
- Thinking Machines (Inkling), the TML Free Research API Tier ToS, last updated 20 Aug 2026 ([thinkingmachines.ai/legal/tml-free-research-api-tier-terms-of-service.pdf](https://thinkingmachines.ai/legal/tml-free-research-api-tier-terms-of-service.pdf)): "You grant us a worldwide, irrevocable, perpetual, royalty-free license to retain ... and otherwise exploit the Customer Content to ... train, fine-tune, evaluate, and improve the Company Models". It also says the models "may not be sufficiently available or suitable for commercial use."
- Poolside (Laguna), Terms of Use, last updated 21 Jul 2026 ([poolside.ai/legal/eula](https://poolside.ai/legal/eula)): "We may use your Content to ... develop the Products ..., including training our models, unless you opt-out. If you access the Products directly through the Site, you may opt-out". Opt-out through OpenRouter: UNVERIFIED.
- The OpenRouter terms read in this session contain no clause against automated or agentic API use. The "robots ... automated technology" clause is about scraping the Site.
- **Practical reading:**
  - Assume prompts to the strongest free models are trained on.
  - The repo is public, so code exposure adds little.
  - Founder journal comments, issue text and anything an agent reads from logs would also be sent. CLAUDE.md already bars real family data from the repo.

**Risk if the free tier changes.** High.
- The free list is short and changes with launches (most entries are from Jul to Oct 2026, judging by the `created` timestamps).
- The daily cap already depends on purchase history.
- Paid fallbacks are billed: "a fallback to a paid model incurs charges even though the first model was `:free`". This is safe here only while the key has a zero credit limit and the account has zero balance.

## 3. NVIDIA API Catalog (build.nvidia.com, NIM hosted endpoints)

**Sources:**
- [build.nvidia.com/llms.txt](https://build.nvidia.com/llms.txt)
- [integrate.api.nvidia.com/v1/models](https://integrate.api.nvidia.com/v1/models) (public list, 85 models)
- [docs.api.nvidia.com/nim/docs/product](https://docs.api.nvidia.com/nim/docs/product)
- NVIDIA API Trial Terms of Service, v. 19 Sep 2025 ([PDF](https://assets.ngc.nvidia.com/products/api-catalog/legal/NVIDIA%20API%20Trial%20Terms%20of%20Service.pdf))

**Card:** **no.** "All models offer a free trial tier with no credit card required. Sign in to generate an API key." (llms.txt FAQ)

**Limits:**
- Not on any vendor page read.
- An NVIDIA developer-forum user reports "Current limit: 40 RPM" ([forum thread](https://forums.developer.nvidia.com/t/request-for-nvidia-nim-api-rate-limit-increase-40-200-rpm-agentic-development-workflow/378941)).
- A relayed moderator reply says the limit "is dependent on model, use-case and the amount of current overall traffic" and "There is no official way to ... receive a rate limit increase on that same tier."
- **All rate figures UNVERIFIED.** Daily or token caps: UNVERIFIED.
- The terms mention "Credits" deducted per use, and "You must have a separate service subscription ... to use the API Service after you have used your available Credits." So a credit balance may apply. Its size is UNVERIFIED.

**Models** (ids from `/v1/models`, all open-weight per their publishers):
- `deepseek-ai/deepseek-v4.1-flash`: the harness's own default; `HARNESS.md` cites DeepSeek's "strong agentic coding results" (vendor-reported).
- `z-ai/glm-5.3-flash`
- `moonshotai/kimi-k2.6`
- `minimaxai/minimax-m3.1-flash`
- `nvidia/nemotron-3-ultra-550b-a55b`
- `nvidia/nemotron-3-super-120b-a12b`
- `poolside/laguna-xs-2.1`
- `openai/gpt-oss-20b`

Tool calling per model: UNVERIFIED (not read per model).

**OpenAI-compatible:** yes. "All NIM model endpoints at `integrate.api.nvidia.com/v1` implement the OpenAI Chat Completions API." OpenCode lists NVIDIA as a built-in provider ([opencode.ai/docs/providers](https://opencode.ai/docs/providers)). **GitHub Actions:** technically yes (API key secret).

**Terms (quotes):**
- 1.2: "NVIDIA will provide you access to the API Service for limited trial purposes only and without use of the API Service or Generated Content in production."
- 1.4: "Unless you purchase a Subscription ..., you may only use the API Service for internal testing and evaluation purposes, not in production."
- 3.3: NVIDIA will collect "(iv) User Content and Generated Content to improve NVIDIA products and services, including AI models."
- Docs FAQ: "NIM access through the NVIDIA Developer Program is for prototyping, research, development and testing purposes only".

**Reading:**
- An unattended agent team that writes code for a shipping product is arguably production use of the output ("Generated Content in production").
- A time-boxed evaluation is arguably "internal testing and evaluation".
- That line is a legal judgment for the founder, not an engineering one.

**Risk if the free tier changes:** high. "The API Services are available for your limited use for a limited time", and the terms take effect "when published".

## 4. Google AI Studio, Gemini API free tier

**Sources:**
- [ai.google.dev/gemini-api/docs/rate-limits](https://ai.google.dev/gemini-api/docs/rate-limits) (read as `.md.txt`)
- [ai.google.dev/gemini-api/docs/pricing](https://ai.google.dev/gemini-api/docs/pricing)
- [ai.google.dev/gemini-api/docs/billing](https://ai.google.dev/gemini-api/docs/billing)
- [ai.google.dev/gemini-api/docs/openai](https://ai.google.dev/gemini-api/docs/openai)
- [ai.google.dev/gemini-api/terms](https://ai.google.dev/gemini-api/terms) ("Effective March 23, 2026")

**Card: no.** The Free tier qualification is "Active project or free trial". Tier 1 is "Set up and link an active billing account".

**Limits:**
- The rate-limits page publishes **no free-tier numbers**. It says "Rate limits depend on a variety of factors ... and can be viewed in Google AI Studio" and "Specified rate limits are not guaranteed".
- RPD resets "at midnight Pacific time" and limits are "per project, not per API key".
- **Per-model RPM, TPM and RPD: UNVERIFIED** (behind the AI Studio login).

**Models on the free tier** (pricing page, "Free of charge" in the Free Tier column):
- Gemini 3.8 Flash ("engineered for long-horizon software engineering, autonomous agents")
- Gemini 3.6 Flash
- Gemini 3.5 Flash-Lite
- Gemma 4 (open-weight)

Not free: Gemini 3.1 Pro Preview and Gemini 4 Argon ("Not available"). The Gemini models are closed-weight; only Gemma is open.

**OpenAI-compatible:** yes, at `https://generativelanguage.googleapis.com/v1beta/openai/`. **GitHub Actions:** yes (API key secret).

**Terms (quotes):**
- "When you use Unpaid Services, including ... the unpaid quota on Gemini API, Google uses the content you submit to the Services and any generated responses to provide, improve, and develop Google products and services and machine learning technologies"
- "human reviewers may read, annotate, and process your API input and output ... **Do not submit sensitive, confidential, or personal information to the Unpaid Services.**"
- Agentic: "you are solely responsible for the actions and tasks performed by the service ... You will not automatically bypass any requests for human confirmation."
- The pricing page's "Used to improve our products" row says Yes for every free model.

**Risk if the free tier changes:** medium to high. The free list is "Limited access to certain models", and prices for the same models double on 1 Jan 2027 (paid side). Free-tier changes are not dated on the pages read.

## 5. Groq

**Sources:**
- [console.groq.com/docs/rate-limits](https://console.groq.com/docs/rate-limits)
- [console.groq.com/docs/models](https://console.groq.com/docs/models)
- [console.groq.com/docs/your-data](https://console.groq.com/docs/your-data)
- [console.groq.com/docs/openai](https://console.groq.com/docs/openai)
- [Groq Services Agreement](https://console.groq.com/docs/legal/services-agreement) ("Last Modified: June 22, 2026")
- groq.com/pricing loaded but is script-rendered, and its text held no plan details.

**Card:** UNVERIFIED (not stated on the pages read).

**Limits.** The rate-limits page table:

| Model | RPM | RPD | TPM | TPD |
|---|---|---|---|---|
| openai/gpt-oss-120b | 30 | 1K | 8K | 200K |
| openai/gpt-oss-20b | 30 | 1K | 8K | 200K |
| qwen/qwen3.8-27b | 30 | 1K | 8K | 200K |

- The page's own wording calls these "the base limits for the Developer plan". The models page lists the Developer plan at "250K TPM 1K RPM" for the same models.
- My reading is that the table shows the free (base) limits. That reading is an inference from the conflict: UNVERIFIED.
- Either way, 8K TPM is far below one 64K-context agent request, and 200K TPD is under one run.

**Models:** gpt-oss-120b, gpt-oss-20b, qwen3.8-27b (open). Llama 3.3 70B, Kimi and MiniMax are "Enterprise / ContactSales".

**OpenAI-compatible:** yes (`https://api.groq.com/openai/v1`). **Actions:** yes.

**Terms:**
- "Groq is not permitted to use Inputs or Outputs for training or fine-tuning any AI Model Services or other models, unless explicitly granted permission or instructed by Customer."
- "By default, Groq does not retain customer data for inference requests."
- Fee-free services may exist "for a limited time or based on usage limits" (5.1).

**Risk:** medium. Terms change with 30 days' notice for material updates. **Verdict: not usable** (TPM cap).

## 6. Cerebras

**Source:** [inference-docs.cerebras.ai/support/rate-limits](https://inference-docs.cerebras.ai/support/rate-limits).

**Card: yes.**
- "New accounts receive $5 in free credits after adding a verified payment method. These credits expire 30 days after they're granted ... If you skip adding a payment method at sign-up, Playground and API access remain inactive."
- "Is there a permanently free tier? No."

**Limits (Free Trial):** gpt-oss-120b and qwen-3.8-27b at 5 RPM, 30K uncached TPM, 1M TPH, 1M TPD.

**Verdict: excluded** under D-127. Training terms were not checked.

## 7. Mistral (Studio / La Plateforme)

**Sources:**
- [docs.mistral.ai/getting-started/quickstarts/studio/activate-and-generate-api-key](https://docs.mistral.ai/getting-started/quickstarts/studio/activate-and-generate-api-key)
- [docs.mistral.ai/admin/billing-usage/usage-limits.md](https://docs.mistral.ai/admin/billing-usage/usage-limits.md)
- [docs.mistral.ai/models/devstral-2-25-12.md](https://docs.mistral.ai/models/devstral-2-25-12.md)
- [legal.mistral.ai/terms/commercial-terms-of-service](https://legal.mistral.ai/terms/commercial-terms-of-service) ("Effective: September 25, 2026")
- **Did not load (404):** help.mistral.ai "Experiment plan" articles 455206 and 450104, and two guessed docs rate-limit URLs. That plan name may be out of date.

**Card: no.** "Free mode: API access is enabled by default with no credit card required. Usage and rate limits apply."

**Limits:**
- "Free mode lets you create API keys and use included monthly usage within the limits shown on the Limits page." Limits are per model, in "Tokens per minute" and "Requests per second".
- **Numbers: UNVERIFIED** (Admin Panel only).

**Models:**
- Devstral 2: "frontier code agents model", 123B, "Open weights ... Modified MIT".
- Mistral Medium 3.5: closed, "optimized for agentic and coding".
- Which of these are in Free mode: UNVERIFIED.

**OpenAI-style:** yes (`https://api.mistral.ai/v1/chat/completions`). **Actions:** yes.

**Terms:**
- "Mistral AI will not use Customer Data or Outputs to train its artificial intelligence models except (a) when you (i) opted-in to training on a Mistral AI Product set to opt-out by default or (ii) have not opted-out of training on a Mistral AI Product set to opt-in by default ... or (d) when Customer uses Labs or Preview Models."
- Whether Free mode is set to train by default: UNVERIFIED.

**Risk:** medium. Material updates take effect "thirty (30) days after notice".

## 8. Cloudflare Workers AI

**Sources:**
- [developers.cloudflare.com/workers-ai/platform/pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/) (last updated 20 Oct 2026)
- [developers.cloudflare.com/workers-ai/platform/limits](https://developers.cloudflare.com/workers-ai/platform/limits/) (17 Sep 2026)
- [developers.cloudflare.com/workers-ai/platform/data-usage](https://developers.cloudflare.com/workers-ai/platform/data-usage/) (16 Oct 2026)
- [developers.cloudflare.com/workers-ai/configuration/open-ai-compatibility](https://developers.cloudflare.com/workers-ai/configuration/open-ai-compatibility/)
- [developers.cloudflare.com/workers/platform/pricing](https://developers.cloudflare.com/workers/platform/pricing/)

**Card.** "By default, users have access to the Workers Free plan." A card at signup: UNVERIFIED.

**Limits:**
- "10,000 Neurons per day at no charge" on Workers Free, reset at 00:00 UTC.
- Text generation is "300 requests per minute, unless the model requires the Workers Paid plan".
- In tokens (my arithmetic from the published neuron rates):
  - gpt-oss-120b: about 314K input tokens/day if output were zero.
  - qwen3-30b-a3b-fp8: about 2.16M input tokens/day.
  - qwen3.8-27b: about 244K input tokens/day.
- That is under one full harness run a day.

**Models:**
- Free: gpt-oss-120b, gpt-oss-20b, qwen3-30b-a3b-fp8, qwen3.8-27b, qwen2.5-coder-32b and Llama 3.x (all open).
- "Some models require a paid billing method. This applies to `@cf/moonshotai/kimi-k2.6`, `@cf/moonshotai/kimi-k2.7-code`, `@cf/zai-org/glm-5.2`, `@cf/zai-org/glm-5.3`, `@cf/zai-org/glm-5.3-flash`, `@cf/deepseek-ai/deepseek-v4-flash-0731`, `@cf/deepseek-ai/deepseek-v4.1-flash-1017`, and `@cf/deepseek-ai/deepseek-v4-pro-0813`."

**OpenAI-compatible:** yes (`/v1/chat/completions`). **Actions:** yes (account ID plus API token). OpenCode lists "Cloudflare Workers AI" as a built-in provider.

**Terms:** "**No training:** Cloudflare does not use Customer Content processed by Workers AI to train AI models." Standard inference has "Zero data retention".

**Risk:** low to medium. The neuron allocation has been stable in wording; prices are per model.

## 9. Hugging Face Inference Providers

**Source:** [huggingface.co/docs/inference-providers/pricing](https://huggingface.co/docs/inference-providers/pricing).

"Free Users | None | - | yes (credits purchase required)". PRO gets $2.00 a month, but PRO is a paid subscription. **Excluded.**

## 10. Self-hosting on a GitHub-hosted runner (Ollama or llama.cpp)

**Sources:**
- [docs.github.com/en/actions/reference/runners/github-hosted-runners](https://docs.github.com/en/actions/reference/runners/github-hosted-runners)
- [docs.github.com/en/actions/reference/limits](https://docs.github.com/en/actions/reference/limits)
- [docs.ollama.com/faq](https://docs.ollama.com/faq)
- Ollama library pages ([ollama.com/library/gpt-oss](https://ollama.com/library/gpt-oss), [gemma4](https://ollama.com/library/gemma4), [qwen3.8](https://ollama.com/library/qwen3.8), [devstral-small-2](https://ollama.com/library/devstral-small-2))
- [llama.cpp README](https://github.com/ggml-org/llama.cpp)

**Runner (public repos):**
- "Use of the standard GitHub-hosted runners is free and unlimited on public repositories."
- `ubuntu-latest`: **4 CPU, 16 GB RAM, 14 GB SSD**, x64. The arm64 runner has the same specs.
- macOS arm64: 3 CPU (M1), 7 GB RAM.
- No GPU (GPU runners are "Larger runners", available on Team and Enterprise only).
- Job limit "6 hours". Concurrency on the Free plan is 20 jobs.

**What fits** (Ollama download sizes, before KV cache):

| Model | Ollama size | Fits 16 GB RAM / 14 GB disk? |
|---|---|---|
| gpt-oss:20b | 14 GB | No in practice: equals the whole listed SSD and leaves about 2 GB of RAM for the OS, the KV cache, Node and the repo |
| qwen3.8 (27B) | 18 GB | No |
| devstral-small-2 | 15 GB | No |
| gemma4:26b / 31b | 16 to 19 / 19 to 20 GB | No |
| gemma4:12b | 7.7 to 8.0 GB | Yes, with little room for a 64K context |
| gemma4:e4b / e2b | 6.6 to 9.5 / 4.6 to 7.5 GB | Yes |

- Ollama's default context is "4096 tokens". Raising it costs RAM ("Required RAM will scale by OLLAMA_NUM_PARALLEL * OLLAMA_CONTEXT_LENGTH"). OpenCode needs 64K or more.

**Speed.** No vendor page gives CPU throughput. My estimate is UNVERIFIED, not measured:
- 4 shared vCPUs would generate single-digit tokens per second on a 12B dense model.
- They would take many minutes to process each 30K to 60K-token agent prompt.
- So one 80-step run would not finish within the 6-hour job limit.
- A measured test needs a workflow run, which is a GitHub write: not done during the freeze.

**Verdict:**
- **Not viable** for agentic coding.
- The models that fit are small, and small models are weak at multi-step tool use. That is a general claim; no benchmark was read.
- **Terms:** no third party; model licences only.
- **Risk:** low (GitHub could change free runner minutes, but the page says "free and unlimited").

## 11. Local on the founder's Mac

**Sources:**
- [docs.ollama.com/api/openai-compatibility](https://docs.ollama.com/api/openai-compatibility) (`base_url='http://localhost:11434/v1/'`)
- [docs.ollama.com/integrations/opencode](https://docs.ollama.com/integrations/opencode) ("ollama launch opencode"; "OpenCode requires a context length of 64k or higher")
- [llama.cpp README](https://github.com/ggml-org/llama.cpp) ("Apple silicon is a first-class citizen - optimized via ARM NEON, Accelerate and Metal frameworks")
- [opencode.ai/docs/providers](https://opencode.ai/docs/providers) (Ollama, llama.cpp and LM Studio providers)

**Card:** no. **Limits:** hardware only. **Terms:** no third party sees prompts; the model licence applies (DeepSeek and GLM weights are MIT per `HARNESS.md` section 3).

**Feasibility hinges on unified memory, which is UNVERIFIED** (no spec in the repo or memory):

| Mac memory | Models that fit (sizes above) |
|---|---|
| 16 GB | Gemma 4 12B class only |
| 32 GB | gpt-oss:20b, qwen3.8 27B, devstral-small-2, gemma4:31b |
| 64 GB or more | Much the same set, with a 64K-plus context |

- Frontier MoE models (DeepSeek V4.x, GLM-5.x) are hundreds of GB. For example, Ollama says qwen3-coder 480B "requires a minimum of 250GB of memory". They do not fit.

**How it would run:**
- Not inside GitHub-hosted Actions.
- Either the Mac becomes a self-hosted runner, which on a public repo lets fork PRs run code on the founder's Mac unless it is locked down: a security decision.
- Or the agent runs locally from a scheduler, like the coordinator session today.
- Either way the Mac must stay on, and agents get GitHub write credentials on it.

**Risk:** low on vendor change; operational risk is on the founder's machine.

---

## Ranked recommendation

1. **OpenRouter `:free`, for a proof run only.**
   - No purchase.
   - It is the route the harness already speaks: same secret name, same provider block in `run-opencode.mjs`, and `:free` already exempt from the zero-cost stop.
   - No terms clause against automated use was found.
   - Capacity is 50 requests a day, which is below one 80-step run. Plan for one agent, `max_turns` around 40, every second day, on `poolside/laguna-s-2.1:free` or `thinkingmachines/inkling:free`, and accept that those providers train on prompts.
   - It proves the pipeline at zero cost. It cannot run a 24-agent team.
2. **NVIDIA API Catalog, if the founder accepts the terms reading.**
   - No card, and the very models the harness was designed around (DeepSeek V4.1 Flash, GLM-5.3 Flash, Kimi K2.6).
   - Likely the most capacity: about 40 RPM, user-reported.
   - Against it: "trial purposes only and without use of the API Service or Generated Content in production" and training on content.
   - This is the best engineering fit and the weakest contractual fit. It is a founder or legal call, not ours.
3. **Gemini free tier (Gemini 3.8 Flash, or Gemma 4 for open weights).** No card and likely more capacity than OpenRouter, but the limits cannot be read without signing in. Prompts are trained on and may be read by humans. The closed models do not match "open source".
4. **Local Mac with Ollama.** Cleanest terms and privacy. Viable only with 32 GB or more of unified memory and the Mac kept on, and even then with mid-size models (about 20B to 30B), not the DeepSeek or GLM class.
5. **Mistral Free mode (Devstral 2).** No card, open weights. Limits and the training default are unverified until someone looks at the console.
6. **Cloudflare Workers AI.** Best stated data terms (no training, zero retention), but 10,000 Neurons a day is less than one run, and DeepSeek and GLM there need a paid plan.
7. **Groq.** Its 8K TPM is below one agent request.

**Excluded:**
- GitHub Models (retired 30 Jul 2026)
- Cerebras (card)
- Hugging Face (purchase)
- GitHub-runner self-hosting (16 GB RAM, 14 GB disk, CPU only)

**Honest bottom line:**
- Within D-127 as briefed (no spend, no card), no route verified today can run the harness at its designed scale (30 runs a day across 24 agents).
- The free routes support a proof of the pipeline or a single slow agent.
- The founder's "There are open source options that are free" is true of the software and the weights. It is not true of hosted inference at agent scale, except NVIDIA's trial, whose terms exclude production use.

## Founder steps for the top route (OpenRouter `:free`), after the go/no-go on Mon 9 Nov

Steps marked **[FOUNDER: account]** or **[FOUNDER: secret]** are his decisions and need his account. Steps marked **[team]** are repo changes the team proposes by PR after the freeze.

1. **[FOUNDER: account]** Create an OpenRouter account at openrouter.ai. Do **not** buy credits: buying 10 or more raises the free cap to 1,000 a day but is spend under D-127. Check whether signup asks for a card; if it does, stop here and report back (unverified today).
2. **[FOUNDER: account]** In Settings > Privacy, decide whether to allow free-model providers that may train on prompts. The strongest free models (Inkling, Laguna) train on prompts by their own terms, so they may be unavailable if this is off. The repo is public, but agent prompts also carry journal comments and issue text.
3. **[FOUNDER: account]** Create one API key with a **credit limit of 0**. A per-key limit is a documented field (`limit`, `limit_remaining`). Name it `earlyletters-agents-free`.
4. **[team, read-only check]** With the key in his hand only, call `GET https://openrouter.ai/api/v1/key` and confirm `free_model_daily_requests.limit` is 50 and `limit_remaining` is 0.
5. **[FOUNDER: secret]** Store the key as the repository Actions secret `OPENROUTER_API_KEY`:
   - Where: github.com/thesaurabhpareek/earlyletters, then Settings > Secrets and variables > Actions > New repository secret.
   - `agents.yml` reads exactly `secrets.OPENROUTER_API_KEY`.
   - It never goes in the repo, a PR, an issue or a log.
6. **[team]** One PR into `develop`:
   - In `agents/roster.json`, set `default_model` to `openrouter/poolside/laguna-s-2.1:free`, red team `openrouter/thinkingmachines/inkling:free`.
   - Lower `max_turns` to fit 50 requests a day.
   - Set one agent active.
   - Confirm OpenCode 1.18.34 accepts these model ids (UNVERIFIED).
   - Never add a paid model to a `models` fallback array.
7. **[FOUNDER: account]** Branch protection on `main` and `develop` before any harness run (D-127 item 4, AF-03, `scripts/release/apply-branch-settings.sh`).
8. **[FOUNDER: account]** Set the repository variable `AGENTS_ENABLED=true` only when he decides to (CR-5). The kill path is `kill-harness.yml`.

If the founder prefers route 2 (NVIDIA), steps 1, 3 and 5 are the same in shape: an NVIDIA account at build.nvidia.com, then a key stored as a new secret, plus a provider change in `run-opencode.mjs`. Before that, he reads terms sections 1.2, 1.4 and 3.3 and decides whether an evaluation run is "internal testing and evaluation".
