# Early Letters

Early Letters is a baby memory book that families fill by talking. A parent speaks or types a note or a letter to their child. The app keeps the original, fixes only what the microphone or grammar got wrong, and files each entry by the child's month of age. This repository is the code, the words and the plans for it. Internal codename: `scribe`.

## The one rule

The machine may remove and repair. It may never add meaning.

Every machine edit is checked, stored and reversible, and the original transcript never changes. No feature may write, rewrite or summarise what a person said. The full rules are in [CLAUDE.md](CLAUDE.md).

## What is where

| Folder | What |
|---|---|
| `apps/mobile` | The iOS app (Expo, Expo Router) |
| `packages/` | Shared code and content: core engine, content, design tokens, brand, API contracts, analytics, emails |
| `packs/` | Language rule packs (data, downloaded on demand) |
| `supabase/` | Database migrations, access rules, Edge Functions, tests |
| `experiments/` | Kit for testing speech models on recordings |
| `scripts/` | Repo tooling: brand assets, coverage, guards, release, status and more |
| `docs/` | Architecture, decisions, roadmap, design, legal drafts, agent rules |
| `agents/` | Roster and memory for the agent team |

## Run it

You need Node 22 or newer. From the repo root:

```bash
npm install          # once
npm test             # every workspace
npm run typecheck
npm run test:db      # database access rules
npm run test:functions
npm run mobile       # start the iOS app
npm run experiment   # speech-model test (Mac; see experiments/README.md)
```

## Where to start reading

1. [CLAUDE.md](CLAUDE.md): structure, commands and rules.
2. [docs/ROADMAP.md](docs/ROADMAP.md): the plan and dates. It is the source of truth; this page does not repeat them.
3. [docs/agents/COORDINATION.md](docs/agents/COORDINATION.md): how the founder and agents work here.

To contribute, report a problem or get help, see [CONTRIBUTING.md](CONTRIBUTING.md) and [SUPPORT.md](SUPPORT.md).

## License

All rights reserved. The code is public so it can be read, not reused. See [LICENSE](LICENSE).
