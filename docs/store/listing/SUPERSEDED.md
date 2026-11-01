# Superseded (1 Nov 2026)

Do not paste from this folder. The 1.0 listing is `docs/store/app-store.md` (generated from
`packages/content/src/store.en.ts`), and every other App Store Connect field is in
`docs/store/app-store-connect-1.0.md`.

`listing.json` cannot carry a banner, so this note stands for it. It differs from the 1.0 listing in its subtitle,
its `journal` keyword, a Productivity secondary category, a Support URL that returns 404, a What's New that Apple does
not show for a first version and a placeholder copyright. It stays only because `packages/content/test/rules.test.ts`
still reads it (its promotional text must equal `store.en.ts`, which this change keeps true). `apple.md` carries a
banner by hand; running `render.mjs` would drop it, so do not re-render. `google-play.md` and `localisation.md` are
drafts for later releases and are not part of 1.0.
