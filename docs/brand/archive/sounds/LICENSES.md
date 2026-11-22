# Sound licenses

Every file here is synthesized by `synth.py` in this folder. No third-party samples, recordings or packs are used, so no attribution is required and no license terms flow from anyone else. Spec: `docs/design/SOUND.md`.

Date checked: 2026-10-01. License: original work owned by the Early Letters project (same terms as this repository).

| File | Title | Creator | Source | License | Attribution required |
|---|---|---|---|---|---|
| `record_start.wav` | Nib down | Early Letters (synth.py) | `synth.py`, `SOUNDS["record_start"]` | Original, project-owned | No |
| `record_stop.wav` | Nib lifts | Early Letters (synth.py) | `synth.py`, `SOUNDS["record_stop"]` | Original, project-owned | No |
| `sealed.wav` | Sealed | Early Letters (synth.py) | `synth.py`, `SOUNDS["sealed"]` | Original, project-owned | No |
| `page_turn.wav` | Page turn | Early Letters (synth.py) | `synth.py`, `SOUNDS["page_turn"]` | Original, project-owned | No |
| `invite_accepted.wav` | A letter arriving | Early Letters (synth.py) | `synth.py`, `SOUNDS["invite_accepted"]` | Original, project-owned | No |
| `gentle_error.wav` | Not yet | Early Letters (synth.py) | `synth.py`, `SOUNDS["gentle_error"]` | Original, project-owned | No |

## Sources considered and not used

| Source | License found | Why not used |
|---|---|---|
| [Kenney, Interface Sounds](https://kenney.nl/assets/interface-sounds) | CC0 ([deed](https://creativecommons.org/publicdomain/zero/1.0/)), no attribution required | License is fine; timbre is game-like clicks, not paper and ink. Acceptable fallback if synthesis is ever dropped. |
| [Sonniss GDC bundle](https://sonniss.com/gameaudiogdc) ([license](https://sonniss.com/gdc-bundle-license/)) | Royalty-free, commercial use and mobile apps allowed, no attribution; not as standalone files; AI/ML training prohibited | App bundles expose files that can be extracted as standalone files; certainty not perfect, so synthesis preferred. |
| freesound.org | Per-file (CC0, CC-BY, CC-BY-NC mixed) | Not needed; synthesis removes per-file license tracking. |

If a third-party file is ever added, add a row with title, creator, URL, license name and URL, date checked, and attribution requirement. CC-BY-NC, "personal use" or unclear licenses are not allowed.
