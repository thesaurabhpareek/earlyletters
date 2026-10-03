# earlyletters.com: team, ownership and rules

Owner: coordinator. 2026-10-03. Every agent working on `apps/web` reads, in order: `docs/agents/BRIEF-2026-10-03.md`, `CLAUDE.md`, this file, `docs/web/STORYBOARD.md`, then the docs named in its task.

Token discipline (the plan has a usage limit that stopped wave 1): read only what your task needs, prefer targeted reads, and keep screenshot reviews to the frames that matter.

## Decisions already made (founder, 2026-10-03)
- One page that feels like a film; primary action: get the iPhone app.
- **Before the App Store link exists, the action is a one-field "tell me when it's ready" email form.** After approval it becomes the official App Store badge. `src/lib/launch.ts` switches on `NEXT_PUBLIC_APP_STORE_URL`.
- **Visuals are code-driven:** type, paper, light, line drawings, real app UI. No footage, stock, faces, children or AI imagery.
- **The child is Meera** in all site copy (founder's choice). Repo tests and fixtures keep the fictional "Asha" (CLAUDE.md privacy rule).
- Stack: Next.js 16.3.8 (App Router, Turbopack) on Vercel, React 19.2.3, Motion 14 (`motion/react`, MIT) with CSS `position: sticky` scenes and native scroll. No GSAP (non-OSI licence; founder rule prefers permissive licences), no smooth-scroll library unless the stack review proves it is needed.
- Fonts: Literata (variable) and Mukta from `@fontsource` (OFL, self-hosted). Scripts beyond Latin and Devanagari (Chinese, Arabic) are added by the scene owner with OFL fonts, subset to the characters used.

## Ownership (edit only your own files; ask the coordinator for anything else)

Crew v2 (2026-10-03, after wave 1 stopped on the usage limit). Fewer agents, each owning a whole act.

| Agent | Role | Port | Owns |
|---|---|---|---|
| ACT1 | Night act: S01 evening, S02 a minute, S03 just talk | 3101 | `src/scenes/S01*`, `S02*`, `S03*` (+ `.module.css`), `src/scenes/parts/act1/**`, `src/components/app-ui/PhoneFrame.tsx`, `app-ui/screens/Tonight.tsx`, `app-ui/screens/Listening.tsx`, `src/components/drawings/Window.tsx`, `Lamp.tsx`, `Moon.tsx`, `Bed.tsx` |
| ACT2 | Paper act: S04 exactly, S05 your voice, S06 the book | 3102 | `S04*`, `S05*`, `S06*`, `src/scenes/parts/act2/**`, `app-ui/screens/Review.tsx`, `app-ui/screens/Book.tsx`, `drawings/Page.tsx` |
| ACT3 | Dusk and close: S07 to S11, header, persistent CTA, email form UI, App Store badge, skip link | 3103 | `S07*` to `S11*`, `src/scenes/parts/act3/**`, `app-ui/screens/Letter.tsx`, `drawings/ReadingLamp.tsx`, `Shoes.tsx`, `Envelope.tsx`, `src/components/cta/**` |
| AT | Atmosphere: light, grain, paper texture, rendered assets | 3104 | `src/components/atmosphere/**`, `public/textures/**`, `scripts/atmosphere/**` |
| E1 | Web platform: legal pages, AASA, headers, robots, sitemap, 404, footer | 3111 | `next.config.ts`, `src/app/(legal)/**`, `src/app/.well-known/**`, `src/app/not-found.tsx`, `src/app/robots.ts`, `src/app/sitemap.ts`, `src/components/site/**`, `src/lib/legal/**` |
| E2 | Email capture back end | 3112 | `src/app/api/notify/**`, `src/lib/notify/**`, `test/notify.test.ts` |
| E3 | Release: Vercel config, CI, launch switch, analytics, runbook | 3113 | `src/lib/launch.ts`, `src/lib/analytics/**`, `vercel.json`, `.github/workflows/web.yml`, `docs/ops/WEBSITE_RUNBOOK.md` |
| BR1 | Brand and claims QA, translation check | none | `test/copy-rules.test.ts`, `docs/web/copy/BR1-audit.md` |

Paths above are under `apps/web/` unless they start with `docs/` or `.github/`. Barrels (`app-ui/index.ts`, `drawings/index.ts`, `drawings/types.ts`, `app-ui/screens/types.ts`) are coordinator-owned: you may add optional props to a type you own by reporting it, never rename.

Coordinator-owned (request changes in your report): `src/film/**` (Scene contract, Copy, Film, Lab), `src/scenes/index.ts`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`, `src/app/lab/**`, `src/content/site.ts`, `apps/web/package.json`, `tsconfig.json`, `docs/web/STORYBOARD.md`, this file.

## Contracts you build against
- `useScene()` from `src/film/Scene.tsx` gives `{ progress, reduced, id }`. `progress` is a Motion `MotionValue<number>` 0..1 over the pinned scene.
- App UI: `PhoneFrame`, `TonightScreen`, `ListeningScreen`, `ReviewScreen`, `LetterScreen`, `BookScreen` from `src/components/app-ui` with optional MotionValue props (see `app-ui/screens/types.ts`). Owners keep these names and props.
- Drawings: `Window`, `Lamp`, `Moon`, `Envelope`, `Page`, `Shoes`, `ReadingLamp`, `Bed` from `src/components/drawings` with optional `draw` MotionValue (see `drawings/types.ts`). All drawings share one hand: single weight, round caps, gentle human irregularity.
- Atmosphere: `LampLight`, `Grain`, `PaperTexture`, `Vignette` from `src/components/atmosphere` (AT is making them beautiful; use them rather than inventing your own light).
- Copy: import from `src/content/site.ts`. Need a new string? Add it to your report with the exact text; meanwhile put it in a `copy.ts` inside your own `parts/` folder (the coordinator moves it).
- Email: `submitNotify(email)` from `src/lib/notify/client.ts`.
- Launch mode: `launch.mode` from `src/lib/launch.ts`.

## How to work
- **Next.js 16 differs from older versions.** Read the relevant guide in `node_modules/next/dist/docs/` before using an API. Verify Motion 14 APIs in `node_modules/motion` (types) rather than from memory.
- **Your own dev server:** from `apps/web`, run `NEXT_DIST_DIR=.next-<your-id> npx next dev -p <your port>` in the background (ports in the table). Each scene has an isolated lab page: `/lab/s01` to `/lab/s11`. Next may rewrite `tsconfig.json` includes; ignore that. Stop your dev server before you report.
- **See what you build:** `node scripts/shoot.mjs --url http://localhost:<port>/lab/s03 --scene --points 0,0.2,0.4,0.6,0.8,1 --sizes 390x844,1440x900 --out /tmp/claude-0/-home-claude/08667071-d80c-5896-b31f-845a0d80d7e1/scratchpad/shots/<id>` and open the PNGs with Read. Add `--reduced` for the reduced-motion pass and `--video` for an mp4 scroll-through. Look at your work at both sizes before you report. Iterate until it is beautiful, not until it compiles.
- **Installing packages:** only with `flock /tmp/scribe-npm.lock npm install <pkg> -w @scribe/web` and only permissive licences (MIT, Apache-2.0, BSD, ISC; OFL for fonts). Report what you added and why.
- **Never commit, push, deploy or change DNS.** The coordinator integrates.
- **Before you report:** `cd apps/web && npx tsc --noEmit` must pass for your files, and your lab page must render with no console errors. Report: files, what you verified, screenshots paths, what you need from others, open issues.
- **Facts versus guesses:** never invent versions, APIs, licences or legal facts. Mark Verified, Inferred, Opinion.

## Quality bar
Apple product pages and the best storytelling sites: generous space, exact type, one idea per frame, motion that means something, perfect on a phone at night. If a frame would not survive a design review at Apple, it is not done.
