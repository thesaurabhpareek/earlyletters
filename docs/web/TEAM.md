# earlyletters.com: team, ownership and rules

Owner: coordinator. 2026-10-03. Every agent working on `apps/web` reads, in order: `docs/agents/BRIEF-2026-10-03.md`, `CLAUDE.md`, this file, `docs/web/STORYBOARD.md`, then the docs named in its task.

## Decisions already made (founder, 2026-10-03)
- One page that feels like a film; primary action: get the iPhone app.
- **Before the App Store link exists, the action is a one-field "tell me when it's ready" email form.** After approval it becomes the official App Store badge. `src/lib/launch.ts` switches on `NEXT_PUBLIC_APP_STORE_URL`.
- **Visuals are code-driven:** type, paper, light, line drawings, real app UI. No footage, stock, faces, children or AI imagery.
- **The child is Meera** in all site copy (founder's choice). Repo tests and fixtures keep the fictional "Asha" (CLAUDE.md privacy rule).
- Stack: Next.js 16.3.8 (App Router, Turbopack) on Vercel, React 19.2.3, Motion 14 (`motion/react`, MIT) with CSS `position: sticky` scenes and native scroll. No GSAP (non-OSI licence; founder rule prefers permissive licences), no smooth-scroll library unless the stack review proves it is needed.
- Fonts: Literata (variable) and Mukta from `@fontsource` (OFL, self-hosted). Scripts beyond Latin and Devanagari (Chinese, Arabic) are added by the scene owner with OFL fonts, subset to the characters used.

## Ownership (edit only your own files; ask the coordinator for anything else)

| Agent | Role | Owns |
|---|---|---|
| R1 | Design research: Apple-grade and cinematic benchmark | `docs/web/research/R1-benchmark.md` |
| R2 | Product research: competitor sites, message hierarchy, copy audit | `docs/web/research/R2-competitors.md` |
| R3 | Engineering research: stack verification, perf and a11y budget | `docs/web/research/R3-engineering.md` |
| R4 | Launch research: App Store CTA, badge rules, AASA, domains, legal links | `docs/web/research/R4-launch.md` |
| W1, W2, W3 | Brand writers, three lenses on the same storyboard | `docs/web/copy/W1.md`, `W2.md`, `W3.md` |
| BR1 | Brand and claims QA, translation check | `apps/web/test/copy-rules.test.ts`, `docs/web/copy/BR1-audit.md` |
| BR2 | Web identity: wordmark, icons, social image | `apps/web/src/components/brand/**`, `apps/web/src/app/icon.*`, `apple-icon.*`, `opengraph-image.*`, `twitter-image.*`, `apps/web/public/brand/**` |
| BR3 | Microcopy: CTA, form states, footer, 404, legal page chrome, alt text | `docs/web/copy/BR3-microcopy.md` |
| E1 | Web platform | `apps/web/next.config.ts`, `apps/web/src/app/(legal)/**`, `apps/web/src/app/.well-known/**` (or route handlers for AASA), `apps/web/src/app/not-found.tsx`, `apps/web/src/app/robots.ts`, `sitemap.ts`, `apps/web/src/components/site/**`, `apps/web/src/lib/legal/**` |
| E2 | Back end: email capture | `apps/web/src/app/api/notify/**`, `apps/web/src/lib/notify/**`, `apps/web/test/notify.test.ts` |
| E3 | Release: Vercel, CI, launch switch, analytics | `apps/web/src/lib/launch.ts`, `apps/web/src/lib/analytics/**`, `apps/web/vercel.json`, `.github/workflows/web.yml`, `docs/ops/WEBSITE_RUNBOOK.md` |
| E4 | App UI replicas | `apps/web/src/components/app-ui/**` |
| E5 | Line drawings and draw-on | `apps/web/src/components/drawings/**` |
| E6 | Visual QA harness | `apps/web/scripts/**`, `apps/web/test/e2e/**` |
| SC1 | Scenes S01, S02 | `apps/web/src/scenes/S01*`, `S02*` (+ `.module.css`), `apps/web/src/scenes/parts/sc1/**` |
| SC2 | Scene S03 | `S03*`, `parts/sc2/**` |
| SC3 | Scenes S04, S05 | `S04*`, `S05*`, `parts/sc3/**` |
| SC4 | Scene S06 | `S06*`, `parts/sc4/**` |
| SC5 | Scenes S07, S08 | `S07*`, `S08*`, `parts/sc5/**` |
| SC6 | Scenes S09 to S11, header, persistent CTA, email form UI, App Store badge | `S09*`, `S10*`, `S11*`, `parts/sc6/**`, `apps/web/src/components/cta/**` |

Coordinator-owned (request changes in your report): `src/film/**` (Scene contract, Copy, Film, Lab), `src/scenes/index.ts`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`, `src/app/lab/**`, `src/content/site.ts`, `apps/web/package.json`, `tsconfig.json`, `docs/web/STORYBOARD.md`, this file.

## Contracts you build against
- `useScene()` from `src/film/Scene.tsx` gives `{ progress, reduced, id }`. `progress` is a Motion `MotionValue<number>` 0..1 over the pinned scene.
- App UI: `PhoneFrame`, `TonightScreen`, `ListeningScreen`, `ReviewScreen`, `LetterScreen`, `BookScreen` from `src/components/app-ui` with optional MotionValue props (see `screens.tsx`). E4 keeps these names and props; scene owners may request additions.
- Drawings: `Window`, `Lamp`, `Moon`, `Envelope`, `Page` from `src/components/drawings` with optional `draw` MotionValue. E5 may add more (for example `Shoes`, `BedEdge`); scene owners request them.
- Copy: import from `src/content/site.ts`. Need a new string? Add it to your report with the exact text; meanwhile put it in a `copy.ts` inside your own `parts/` folder (the coordinator moves it).
- Email: `submitNotify(email)` from `src/lib/notify/client.ts`.
- Launch mode: `launch.mode` from `src/lib/launch.ts`.

## How to work
- **Next.js 16 differs from older versions.** Read the relevant guide in `node_modules/next/dist/docs/` before using an API. Verify Motion 14 APIs in `node_modules/motion` (types) rather than from memory.
- **Your own dev server:** from `apps/web`, run `NEXT_DIST_DIR=.next-<your-id> npx next dev -p <your port>` in the background. Ports: R* none, SC1 3101, SC2 3102, SC3 3103, SC4 3104, SC5 3105, SC6 3106, E1 3111, E2 3112, E3 3113, E4 3114, E5 3115, E6 3116, BR2 3121. Each scene has an isolated lab page: `/lab/s01` to `/lab/s11`. Next may rewrite `tsconfig.json` includes; ignore that.
- **See what you build:** `node scripts/shoot.mjs --url http://localhost:<port>/lab/s03 --scene --points 0,0.2,0.4,0.6,0.8,1 --sizes 390x844,1440x900 --out /tmp/claude-0/-home-claude/08667071-d80c-5896-b31f-845a0d80d7e1/scratchpad/shots/<id>` and open the PNGs with Read. Add `--reduced` for the reduced-motion pass and `--video` for an mp4 scroll-through. Look at your work at both sizes before you report. Iterate until it is beautiful, not until it compiles.
- **Installing packages:** only with `flock /tmp/scribe-npm.lock npm install <pkg> -w @scribe/web` and only permissive licences (MIT, Apache-2.0, BSD, ISC; OFL for fonts). Report what you added and why.
- **Never commit, push, deploy or change DNS.** The coordinator integrates.
- **Before you report:** `cd apps/web && npx tsc --noEmit` must pass for your files, and your lab page must render with no console errors. Report: files, what you verified, screenshots paths, what you need from others, open issues.
- **Facts versus guesses:** never invent versions, APIs, licences or legal facts. Mark Verified, Inferred, Opinion.

## Quality bar
Apple product pages and the best storytelling sites: generous space, exact type, one idea per frame, motion that means something, perfect on a phone at night. If a frame would not survive a design review at Apple, it is not done.
