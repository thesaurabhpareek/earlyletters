# Brand archive

Material kept for its research and licence records but not shipped. Nothing under this folder is referenced by the app (`apps/mobile/test/bundle-assets.test.ts` checks), the website or the emails.

| Folder | What | Record |
|---|---|---|
| `photos/` | Ten open-licence photographs (hands, objects and places, never children) picked on 1 Oct 2026 as a bridge until the commissioned shoot. Moved out of `apps/mobile/assets/` on 15 Oct 2026: no screen used them and they added 1.8 MB to every build | `photos/LICENSES.md`, `docs/design/PHOTOGRAPHY.md` |
| `sounds/` | The synthesizer for the six opt-in paper sounds (`synth.py`) and its licence record. The WAVs are generated, never committed (`*.wav` is gitignored); the setting is not built yet | `sounds/LICENSES.md`, `docs/design/SOUND.md` |

When a feature needs one of these files, copy it into the app and record it there. Do not reference this folder from code.
