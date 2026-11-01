<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="packages/brand/assets/logo/primary/lockup-horizontal-reversed.svg">
    <img src="packages/brand/assets/logo/primary/lockup-horizontal.svg" alt="Early Letters" width="360">
  </picture>
</p>

<p align="center"><strong>It stays in your words.</strong><br>A baby memory book you fill by talking.</p>

<p align="center"><a href="https://earlyletters.com">earlyletters.com</a></p>

---

At the end of the day, you say a few words to your child. A first laugh, a long night, a song you made up in the car. Early Letters keeps it as a letter, in your words and in your voice, and files it by your child's month of age. Over time it becomes a book your child can read, and hear, for years.

> Asha, you laughed at the rain today. Your whole face did it. I wanted to remember the sound.
>
> <sub>Month 9, a Tuesday night</sub>

## What makes it different

- **Your words stay yours.** It never adds a word, and it never rewrites what you said.
- **Only small fixes.** An um, an accidental repeat, a name spelled the way you spell it, a capital letter, a full stop. A microphone can mishear, so you read each letter before you keep it.
- **Every change is marked.** You can see each fix, and put any of them back.
- **Your voice is kept.** Each letter you speak keeps its original recording, unchanged.
- **Speech is written down on your phone.** Letters you type stay exactly as you typed them.
- **Nothing keeps score.** Some days you have a sentence, some days a long letter. Write when you have something to say.

## Who it is for

Parents of babies and young children, from the first weeks to the first years. Usually tired, often holding someone, with a minute to spare. A sentence is plenty.

## Where it is today

Early Letters is in private testing on TestFlight with the founding family. It is not on the App Store yet. The first version is for iPhone, in English.

To follow along, visit [earlyletters.com](https://earlyletters.com). To write to us: hello@earlyletters.com.

## What we believe

**The machine may remove and repair. It may never add meaning.**

That one rule shapes everything here. When speech becomes text, the app may take out an um or a stumble, and set a name to the spelling you gave it. It may never add a word, and no feature may rewrite, summarize or shape what a person said. The first transcript of every recording is never changed. Each fix is stored beside it, checked by one guard that refuses any added word, and can be undone.

**Privacy, said plainly.**

- Your letters and recordings are private. We never sell them, never use them for ads and never use them to train machine learning models.
- We never imitate your voice. Your original recording is always kept exactly as you made it.
- Speech is written down on the phone.
- Version 1.0 has no in-app analytics.
- Export your memory book any time, for free: your letters, your recordings and a PDF of the book.

The [Privacy Policy](https://earlyletters.com/privacy) has the details.

## Built with

Expo and React Native for iOS, speech recognition that runs on the phone (whisper.rn), SQLite on the device, Supabase on the server side, and signed language packs downloaded on demand. One set of design tokens serves the app and the website.

<br>

---

## For contributors and agents

The codename is `scribe`. Code, the database and the bundle ID use it; the public name lives only in [`packages/brand/index.ts`](packages/brand/index.ts).

Read first:

- [`CLAUDE.md`](CLAUDE.md): the rules for anyone, human or AI, changing this repo, and where everything lives.
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) and [`docs/adr/`](docs/adr/): system design and decision records.
- [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md): branches, pull requests and releases.
- [`docs/agents/COORDINATION.md`](docs/agents/COORDINATION.md): how agents work here.
- [`docs/engineering/PRINCIPLES.md`](docs/engineering/PRINCIPLES.md): before any code, schema, API or data change.
- [`packages/content/VOICE.md`](packages/content/VOICE.md): before any word a parent will read.

```bash
npm install            # once, at the repo root
npm test               # every workspace with a test script (Node 22.5+)
npm run test:db        # database access rules, in embedded Postgres
npm run test:functions # Edge Functions and ops scripts (Deno via npx)
npm run typecheck
npm run mobile         # start the iOS app
```

Every change is a pull request into `develop`, and all tests pass before any commit. If a content rule test fails, fix the copy, not the test. Tests and fixtures use only the fictional family "Asha".

Where things stand: the release record is [`docs/release/1.0.0.md`](docs/release/1.0.0.md), and decisions are logged in [`docs/DECISIONS.md`](docs/DECISIONS.md).

This repository is public so the work can be seen. It is not open source: see [`LICENSE`](LICENSE).
