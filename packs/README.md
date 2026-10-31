# packs

Language rule packs. They are data, downloaded on demand. They are never code.

## What is in it

| Path | What |
|---|---|
| `text-rules/<lang>.json` | Text-rules pack for one language: ar, en, es, fr, hi, pt, zh |
| `text-rules/en.json` | Reference data checked against the pack bundled in the app. It is not published |
| `text-rules/tools/zh-data.mjs` | Regenerates the Chinese data tables from OpenCC and pinyin-data files you download first |

English ships inside the app. Every other language downloads when an author picks it.

## Commands

Packs have no tests of their own. The engine tests in `packages/core` read them.

```bash
npm test -w @scribe/core
npx tsx scripts/packs/publish.ts release    # validate, canonicalise, hash and sign (needs the signing key)
```

Publishing is covered in `docs/ops/PACKS_HOSTING.md`.

## Rules

`docs/adr/0014-languages-and-phonetics.md` (packs as data) and `docs/adr/0016-lean-app-and-server-driven-content.md` (on-demand download, signed manifest).

## Do not

- Do not put executable code in a pack. App Store guideline 2.5.2 forbids downloading it.
- Do not mark a language's word tables as signed off without a native speaker.
- Do not commit the signing key.
- Do not drop the attribution carried inside a pack.
