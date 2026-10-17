# Documentation index

Start here. This page says which document answers which question. It is kept current by the `reference-docs` agent (`.claude/agents/reference-docs.md`). Status first: server code (sign-in, sync, co-parent sharing, backup) exists on `develop`, but every build profile turns server features and analytics off, and only two migrations are applied live. D-100 (founder; logged 16 Oct) ships server features in v1.0 after the R-17 security gate; the build profiles that turn them on are not on `develop` yet (open PR #145) ([decisions/INDEX.md](decisions/INDEX.md)). Where a document and the code disagree, the [reference pages](reference/README.md) describe what the code does today.

## How it works today (as built)

| Question | Read |
|---|---|
| What runs where, how a letter travels, what leaves the phone | [reference/system.md](reference/system.md) |
| Screens, boot, `src/lib` modules, native modules, build profiles | [reference/mobile-app.md](reference/mobile-app.md) |
| Transcription, language packs, the faithful-edit engine and verifier | [reference/speech-and-languages.md](reference/speech-and-languages.md) |
| Device storage, deletion, export, the server schema | [reference/data-and-storage.md](reference/data-and-storage.md) |
| Supabase, Edge Functions, RPCs, deploys (off in every build profile) | [reference/backend.md](reference/backend.md) |
| Workspaces, exports, dependency rules | [reference/packages.md](reference/packages.md) |
| Plus, StoreKit, the free-letter ledger | [reference/plus-and-billing.md](reference/plus-and-billing.md) |
| CI, release lanes, secrets by name, the agent harness | [reference/operations.md](reference/operations.md) |
| What a word means in code and on screen | [reference/glossary.md](reference/glossary.md) |
| How the reference pages stay true | [reference/README.md](reference/README.md) |
| The original system design (1 to 3 Oct 2026; read its status box first) | [ARCHITECTURE.md](ARCHITECTURE.md) |
| The store API and rules for `src/lib` | [../apps/mobile/src/lib/README.md](../apps/mobile/src/lib/README.md) |
| Repo rules, commands and the constitution | [../CLAUDE.md](../CLAUDE.md) |

## Why we decided

| Question | Read |
|---|---|
| What did we decide, why, and how hard is it to undo? | [decisions/README.md](decisions/README.md) (register format) and [decisions/INDEX.md](decisions/INDEX.md) (generated; being filled) |
| The dated decision log, D-001 onwards | [DECISIONS.md](DECISIONS.md) |
| Why a technical design was chosen (ADR 0001 to 0020, 0022, 0101) | [adr/](adr/) |
| Technical design per area (mobile, sync, audio, security, privacy, performance, quality, payments, accessibility, red team) | [tdd/](tdd/) (TDD 01 to 10) |

## What we are building

| Question | Read |
|---|---|
| What the product must do at launch | [prd/PRD.md](prd/PRD.md) and sections [A](prd/A-entry-and-auth.md), [B](prd/B-first-run-and-family.md), [C](prd/C-habits-pricing-settings.md) |
| The path to App Store submission | [ROADMAP.md](ROADMAP.md) |
| The ordered v1.0 work list (BL ids) | [BACKLOG.md](BACKLOG.md) |
| After v1.0: v1.0.1 to v1.3 | [backlog/FUTURE.md](backlog/FUTURE.md) and the six area files in [backlog/future/](backlog/future/) (file 06 is co-parent sharing) |
| Steps only the founder can take (FT ids) | [FOUNDER_TASKS.md](FOUNDER_TASKS.md) |

## How we work

| Question | Read |
|---|---|
| How agents and threads work together (read before any work) | [agents/COORDINATION.md](agents/COORDINATION.md) |
| The agent team, the harness and its rules | [agents/README.md](agents/README.md), [agents/HARNESS.md](agents/HARNESS.md), [agents/OPERATING_MODEL.md](agents/OPERATING_MODEL.md) |
| How agents talk, open questions, the board, the 3 Oct brief, adding an agent | [agents/AGENT-COMMS.md](agents/AGENT-COMMS.md), [agents/DEBATES.md](agents/DEBATES.md), [agents/BOARD.md](agents/BOARD.md), [agents/BRIEF-2026-10-03.md](agents/BRIEF-2026-10-03.md), [agents/CHARTER_TEMPLATE.md](agents/CHARTER_TEMPLATE.md) |
| Operations: deletion pipeline, deploys, secrets, domains, auth setup, app size, subscriptions setup | [ops/README.md](ops/README.md), [ops/DEPLOY.md](ops/DEPLOY.md), [ops/SECURITY.md](ops/SECURITY.md), [ops/DOMAINS.md](ops/DOMAINS.md), [ops/AUTH_SETUP.md](ops/AUTH_SETUP.md), [ops/APP_SIZE.md](ops/APP_SIZE.md), [ops/APP_STORE_CONNECT_SUBSCRIPTIONS.md](ops/APP_STORE_CONNECT_SUBSCRIPTIONS.md) |
| What to do in an incident or when deletion is stuck | [ops/runbooks/](ops/runbooks/) (incident notification, purge failing, restore drill, stuck deletion, suspected leak) |
| Files served from the website's `.well-known` | [ops/well-known/](ops/well-known/) |
| Applying migrations to the live project by hand | [../supabase/APPLY.md](../supabase/APPLY.md) |
| CI, review rules and branch protection | [../.github/README.md](../.github/README.md) |
| How to test on a real iPhone, and where test evidence goes | [qa/DEVICE_TEST_PLAN.md](qa/DEVICE_TEST_PLAN.md), [qa/evidence/README.md](qa/evidence/README.md) |
| What we measure and how insights come back | [analytics/TRACKING_PLAN.md](analytics/TRACKING_PLAN.md), [analytics/INSIGHTS_LOOP.md](analytics/INSIGHTS_LOOP.md) (analytics is off in every build profile) |

## Legal and privacy

| Question | Read |
|---|---|
| The level of every column, file and event (L1 to L4) | [legal/DATA_CLASSIFICATION.md](legal/DATA_CLASSIFICATION.md) |
| How deletion and export must work | [legal/DELETION_AND_EXPORT_SPEC.md](legal/DELETION_AND_EXPORT_SPEC.md) |
| Legal requirements engineers implement (LEGAL-REQ ids) | [legal/ENGINEERING_REQUIREMENTS.md](legal/ENGINEERING_REQUIREMENTS.md) |
| Retention and governance; policy versions and consent records | [legal/data-policy.md](legal/data-policy.md), [legal/POLICY_VERSIONING.md](legal/POLICY_VERSIONING.md) |
| Published texts (drafts, counsel review pending) | [legal/privacy-policy.md](legal/privacy-policy.md), [legal/terms-of-service.md](legal/terms-of-service.md), [legal/subscription-terms.md](legal/subscription-terms.md), [legal/consumer-health-data-notice.md](legal/consumer-health-data-notice.md), [legal/subprocessors.md](legal/subprocessors.md) |
| What the app and store must disclose; App Store privacy labels | [legal/in-app-disclosures.md](legal/in-app-disclosures.md), [legal/app-store-privacy-labels.md](legal/app-store-privacy-labels.md) |
| Compliance obligations; what counsel is asked | [legal/compliance-register.md](legal/compliance-register.md), [legal/COUNSEL_PACKET.md](legal/COUNSEL_PACKET.md), [legal/memos/](legal/memos/) |

## Brand, design and store

| Question | Read |
|---|---|
| The brand system, email identity and consistency checks | [brand/BRAND_SYSTEM.md](brand/BRAND_SYSTEM.md), [brand/EMAIL_IDENTITY.md](brand/EMAIL_IDENTITY.md), [brand/CONSISTENCY_AUDIT.md](brand/CONSISTENCY_AUDIT.md) |
| How the logo was chosen | [brand/LOGO_R2_BRIEF.md](brand/LOGO_R2_BRIEF.md), [brand/logo-r2/](brand/logo-r2/), [brand/logo-r3/](brand/logo-r3/), [brand/evidence/](brand/evidence/), [brand/activity/](brand/activity/) |
| How every word should sound | [../packages/content/VOICE.md](../packages/content/VOICE.md), [../packages/content/BRAND.md](../packages/content/BRAND.md) |
| Design language, benchmarks, components, motion, sound, photography | [design/DESIGN_LANGUAGE.md](design/DESIGN_LANGUAGE.md), [design/BENCHMARK.md](design/BENCHMARK.md), [design/COMPONENTS.md](design/COMPONENTS.md), [design/COMPONENT_LIBRARY.md](design/COMPONENT_LIBRARY.md), [design/MOTION.md](design/MOTION.md), [design/SOUND.md](design/SOUND.md), [design/PHOTOGRAPHY.md](design/PHOTOGRAPHY.md), [design/CREATIVE.md](design/CREATIVE.md) |
| Emails: catalog, compliance, security, the brief | [emails/CATALOG.md](emails/CATALOG.md), [emails/COMPLIANCE.md](emails/COMPLIANCE.md), [emails/SECURITY.md](emails/SECURITY.md), [emails/BRIEF.md](emails/BRIEF.md) |
| The App Store listing | [store/app-store.md](store/app-store.md) |
| What the website lane needs from us | [web/handoffs/](web/handoffs/) |

## Research and reviews

| Question | Read |
|---|---|
| Market, competitors and benchmarks | [research/COMPETITIVE_RESEARCH.md](research/COMPETITIVE_RESEARCH.md), [research/competitors/](research/competitors/) |
| Parents: behaviour, onboarding, willingness to pay | [research/USER_RESEARCH.md](research/USER_RESEARCH.md) |
| What the text rules know about each language | [research/LANGUAGES.md](research/LANGUAGES.md) |
| Independent reviews (brand, content, customer, design, legal) and the security and privacy review | [reviews/2026-10-03/README.md](reviews/2026-10-03/README.md), [reviews/2026-10-04-security-privacy.md](reviews/2026-10-04-security-privacy.md) |

## Release

| Question | Read |
|---|---|
| How to make the first TestFlight build, and what it lacks | [release/TESTFLIGHT.md](release/TESTFLIGHT.md) |
| How a store release is cut, tagged and submitted (two lanes, release branch, RC tags) | [adr/0022-release-engineering.md](adr/0022-release-engineering.md) (D-089 to D-092) |
| Where v1.0 stands: release record, readiness and dates | [release/1.0.0.md](release/1.0.0.md) |
| What the app really looks like, screen by screen | [release/journey/INDEX.md](release/journey/INDEX.md): generated from the web end-to-end flows; 20 journeys of screenshots, step JSON, critiques and a PDF (about 350 files; do not edit by hand) |
| Release lanes and workflows | [reference/operations.md](reference/operations.md) |
