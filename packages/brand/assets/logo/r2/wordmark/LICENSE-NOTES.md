# Wordmark round 2: license notes

| Font | Used for | Source | License |
| --- | --- | --- | --- |
| Literata (variable, opsz 7 to 72, wght 200 to 900) | Routes A, B, C and all small cuts. Static cuts made with the fontTools instancer at opsz 12, 24, 36, 72 | google/fonts `ofl/literata/Literata[opsz,wght].ttf`, sha256 `b41138c9...6f274440` (pinned in `source/fonts.py`) | SIL OFL 1.1, Copyright 2017 The Literata Project Authors. No Reserved Font Name |
| EB Garamond (variable, wght 400 to 800) | Route D, including its `t_t` ligature glyph | google/fonts `ofl/ebgaramond/EBGaramond[wght].ttf`, sha256 `ef9512f9...e5369027` (pinned in `source/fonts.py`) | SIL OFL 1.1, Copyright 2017 The EB Garamond Project Authors. No Reserved Font Name |
| Mukta | Live UI text in `presentation.html` only, never in a logo file | `@fontsource/mukta` in node_modules | SIL OFL 1.1 |

Why the variable fonts and not `@fontsource/literata`: the fontsource static files are the opsz 12 (text) instance only (checked: its `l` matches the opsz 12 wght 500 instance to within one unit). The display optical sizes that make the wordmark finer exist only in the variable font. The build downloads the pinned file into `source/.cache/` (git-ignored) and refuses to run if the hash changes. No font file is committed or shipped.

Outlining is permitted: the OFL governs the Font Software, not artwork made with it (OFL FAQ 1.1, 1.2). Every SVG here is filled paths only, and the outlines are edited (shared tt crossbar with a re-drawn bracket, raised first t, optical spacing that discards the font's kerning), which makes them logo artwork. The OFL grants no trademark rights and none are needed; clearing "Early Letters" as a trademark is separate.
