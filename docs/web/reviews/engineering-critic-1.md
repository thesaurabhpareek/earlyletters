# Engineering critic review 1: earlyletters.com scroll film

Reviewer role: staff front-end engineer (motion pages, Core Web Vitals on iPhone), accessibility and performance critic.
Branch `feat/web-scroll-film` at `f997363`. Date 2026-10-03. Source was read and measured, never edited.
Paths below are relative to `apps/web/src/` unless they start with `docs/`.

## Verdict

The scene mechanism is sound. Across 2,783 live-state checks and 12 viewport sizes it never disagreed with the geometry, there is no per-frame React state, listeners are cleaned up, and LCP is fast. The problems are around it:

1. One call, `document.elementsFromPoint`, run twice per scroll frame, is the largest piece of first-party scroll cost and is what pushes a 4x throttled phone over the 33 ms line.
2. The conversion path (email form) cannot be reached by keyboard or screen reader in the normal flow, and the skip link drops focus.
3. The film's words only exist for assistive tech once you have scrolled past them.
4. Anchors, reduced motion, and the end card contrast each have a concrete failure with a small fix.

Seven P0 items, eight P1, a short P2 list. Every P0 has an exact fix below.

## Method and limits

- Production build on port 3190 (`NEXT_DIST_DIR=.next-critic`), `playwright-core` with Chromium from `/opt/pw-browsers`, run headless. Headless uses SwiftShader software GL, so GPU timing is not representative of an iPhone. JS, style and layout cost is representative once multiplied by CPU throttling.
- Mobile run: 390x844, DPR 2, touch/mobile emulation, `Emulation.setCPUThrottlingRate` 4. Desktop run: 1440x900, DPR 1, no throttle.
- Scrolling: CDP `Input.synthesizeScrollGesture` with wheel events (touch gestures did not cover the full distance reliably; every scene reached progress 1.0 in the final runs). 900 px/s mobile, 1200 px/s desktop. Frame pacing from a `requestAnimationFrame` recorder, per scene by section id.
- Both scroll paths measured: Motion's native ViewTimeline path (`window.ViewTimeline` present) and the JS `scrollInfo` fallback (what Safari would use until it ships ViewTimeline).
- Not verified here: real iPhone GPU and memory, real Safari behaviour (including `scrollend`), Vercel cache headers, INP (no real input). Loopback network except the one 4G run.
- Scripts (ephemeral, not in the repo): `/tmp/claude-0/-home-claude-earlyletters/08667071-d80c-5896-b31f-845a0d80d7e1/scratchpad/critic/` (`measure.mjs`, `audit.mjs`, `a11y.mjs`, `edge.mjs`, `fixes.mjs`, `ios.mjs`, `prof.mjs`). Screenshots in `shots/` there.

## Measured numbers

### Load (390x844, 4x CPU, DPR 2, 3 runs)

| Metric | Value |
|---|---|
| LCP | 492 ms median (404, 492, 504); element is the hero `h1` "Early Letters" (text, no image) |
| FCP | 208 to 504 ms |
| LCP with Slow 4G + 4x CPU | 796 and 964 ms |
| CLS at load | 0 (total over the whole scroll 0.0525, from one late text reflow; 4G run 0.0191) |
| Long tasks at load | 6 to 7 per run, TBT 317 to 489 ms (4G run: 7 tasks, 543 to 587 ms) |
| JS transfer | 223,076 B over 10 scripts (694,674 B decoded) |
| Transfer at load | 463,622 B in 24 requests. Scrolling the whole page adds 82,729 B (10 RSC prefetches, 34 requests, 546,351 B total; see P1-2) |
| By type, whole page | Document 15.2 KB, CSS 14.4 KB (4 files), JS 223.1 KB, images 58.3 KB (2 textures), fonts 152.6 KB (7 files), `Fetch` 82.7 KB (only after the footer scrolls into view) |
| Heap | 8.1 to 9.1 MB |

### Scroll (390x844, 4x CPU, whole page, 3 runs; JS-scroll path in brackets)

| Metric | Value |
|---|---|
| Frames over 16.7 ms | 26.4% (31.9%) |
| Frames over 33 ms | 5.3% (6.8%) |
| p50 / p95 / p99 frame | 16.7 / 49.9 / 66.7 ms (16.7 / 50 / 100) |
| Long tasks during scroll | 1 to 3 per run (1 to 6), longest 199 to 259 ms |
| Same page, no CPU throttle | 1.9% over 16.7 ms, 1.0% over 33 ms, 0 long tasks |

Per scene at 4x CPU (frames over 16.7 / over 33 ms, main-thread script ms for the sweep):

| Scene | Dist px | Over 16.7 | Over 33 | Script ms | React commits |
|---|---|---|---|---|---|
| evening | 1688 | 30.7% | 7.6% | 438 | 1 |
| a-minute | 1266 | 56.0% | 14.9% | 319 | 2 |
| just-talk | 2110 | 48.3% | 15.7% | 526 | 1 |
| exactly | 1688 | 11.9% | 0.7% | 410 | 7 |
| your-voice | 844 | 19.4% | 2.2% | 173 | 0 |
| the-book | 1688 | 19.9% | 2.2% | 407 | 1 |
| years-later | 1688 | 33.8% | 5.8% | 430 | 2 |
| languages | 1266 | 6.7% | 0.0% | 268 | 1 |
| private | 844 | 31.5% | 0.8% | 246 | 2 |
| pricing | 422 | 19.7% | 1.4% | 110 | 2 |
| start | 169 | 7.7% | 3.8% | 44 | 0 |

### Desktop (1440x900, no throttle, DPR 1)

LCP 224 ms median (188 to 324). CLS at load 0.0157 (font swap), 0 in one run; total 0.04 to 0.06. Frames over 16.7 ms 5.2%, over 33 ms 3.7%. Zero long tasks during scroll. The stalls are not JS: the trace shows `CrGpuMain` tasks up to 135 ms (SwiftShader) in a-minute, just-talk and the end, so treat the desktop tail as a harness artefact.

---

## P0: must fix

### P0-1. `elementsFromPoint` on every scroll frame, twice

- Where: `components/cta/useTone.ts:14-21` (`useToneAt`), called at `components/cta/Header.tsx:17` (top band) and `:46` (bottom band, the phone pill). Each scroll event schedules a rAF that hit-tests the whole stack of 11 pinned stages.
- Evidence: CPU profile at 4x, 390x844 (`prof.json`): `elementsFromPoint` is the largest first-party self time in every scene: 112 ms (evening), 136 (just-talk), 172 (the-book), 138 (years-later) per sweep. A/B with `Document.prototype.elementsFromPoint` stubbed to return `[]` (tone stays night, so the few tone-change re-renders go too; they are not per-frame):
  - frames over 16.7 ms: 32.8% to 25.8%
  - frames over 33 ms: 8.1% to 4.8%
  - p95 50.0 to 33.4 ms, p99 100 to 83.4 ms
  - long tasks during scroll: 2 to 4 per run (106 to 218 ms) to 0
  - script ms per scene: the-book 498 to 249, just-talk 498 to 320, years-later 498 to 243, evening 494 to 364
- Why: hit testing forces a style and layout flush and walks a deep paint stack of overlapping sticky stages with many absolutely positioned layers. It runs at scroll rate, which on iPhone is also display rate.
- Fix: derive tone from geometry. Cache section tops on resize, then pick the scene with a number compare. No layout read per frame. Share one store between header and pill.

```ts
// useTone.ts, replace the body of useToneAt's effect
const sections = Array.from(document.querySelectorAll<HTMLElement>('main > section[data-tone]'));
let tops: number[] = [];
let bottoms: number[] = [];
const measure = () => {
  const sy = window.scrollY;
  tops = sections.map((s) => s.getBoundingClientRect().top + sy);
  bottoms = sections.map((s, i) => tops[i] + s.offsetHeight);
  read();
};
const read = () => {
  const sy = window.scrollY;
  const y = sy + (band === 'top' ? 32 : window.innerHeight - 40);
  let idx = -1;
  for (let i = 0; i < tops.length; i++) if (tops[i] <= sy + 0.5) idx = i; // same rule as Scene.tsx:73
  setTone(idx >= 0 && y < bottoms[idx] ? (sections[idx].dataset.tone as Tone) : 'night');
};
measure();
window.addEventListener('scroll', read, { passive: true }); // read() does no layout, no rAF needed
window.addEventListener('resize', measure);
const ro = new ResizeObserver(measure); // fonts, late layout
ro.observe(document.body);
// cleanup: remove both listeners, ro.disconnect()
```

`setTone` with an equal string bails out of rendering, so there is no re-render cost between boundaries. Re-run `measure.mjs` afterwards; expect the numbers in the A/B above.

### P0-2. The email form is unreachable by keyboard, and the skip link loses focus

- Where: `components/cta/goToStart.ts:9-13`, `film/Scene.module.css:26-28`, `components/cta/Header.tsx:71-83` (skip link), `components/cta/Header.module.css:81-83` (header action hidden under 900 px).
- Evidence (`a11y.json`, real keyboard events):
  - Tab order from the top at 390: skip link, `hello@`, Privacy, Terms, Consumer health data, Subprocessors, Delete your account, then out of the page. At 1440: skip link, header button, `hello@`, legal links. The email input and submit button are never in the sequence (their stage is `visibility:hidden` until pinned).
  - Pressing Enter on "Skip the film": smooth scroll takes about 1.55 s to land (`scrollend`), but `goToStart` focuses after a fixed 900 ms (`goToStart.ts:13`). At 900 ms scrollY is 13,047 of the 13,673 target and `#start` still has `data-live=false`, so `input.focus()` is a silent no-op. `document.activeElement` was still the skip link at 1.5, 2.5 and 4 s, in every run at 390 and 1440. A keyboard user lands at the end with focus on the link they pressed.
  - Focus ring is fine everywhere else (2 px, 3 px offset, visible on all 8 stops).
- Fix: focus when the scroll has finished and the stage is live, with a timeout fallback for browsers without `scrollend`.

```ts
// goToStart.ts
const input = () => document.getElementById(NOTIFY_INPUT_ID) as HTMLInputElement | null;
const focusInput = () => input()?.focus({ preventScroll: true });
if (reduce) { focusInput(); return; }
let done = false;
const finish = () => {
  if (done) return;
  done = true;
  window.clearTimeout(timer);
  window.removeEventListener('scrollend', finish);
  requestAnimationFrame(focusInput); // data-live has flipped in the same frame as the crossing (checked, see "What passed")
};
window.addEventListener('scrollend', finish, { once: true });
const timer = window.setTimeout(finish, 2200);
```

Also compute `top` from the stable `svh` height in P1-3 rather than `innerHeight` (`goToStart.ts:9`). Keep `SkipLink` as is: it already has a real `href="#start"` for no-JS.

### P0-3. The film's content is invisible to screen readers until scrolled past

- Where: `film/Scene.module.css:26-28` (`.stage[data-live='false'] { visibility: hidden }`), set by `film/Scene.tsx:66-69`.
- Evidence (`ariaSnapshot` at load, 390 and 1440): headings exposed are `h1 Early Letters` and `h2 Meera is asleep.` only (2 of 12). The 11 labelled `<section>` regions are exposed with nothing inside. After scrolling to the bottom all 12 headings appear, because passed stages stay live. The only way for a VoiceOver or NVDA user to hear scene 2 to 11 is to scroll with a gesture the screen reader does not do by itself.
- Fix (tested): hide not-yet-live stages visually, not from the accessibility tree.

```css
/* Scene.module.css */
.stage[data-live='false'] { opacity: 0; pointer-events: none; }  /* was visibility: hidden */
.stage[data-live='false'] * { animation-play-state: paused; }     /* keep hidden stages idle */
```

  With this, a heading query at load returns all 12 and the second Tab from the top reaches the form button (scrollY 13,575). That Tab lands where the form is still at opacity 0, so pair it with a focus handler in `Scene` that moves the pinned scene to its resting frame when focus enters a stage that is not at rest:

```tsx
// Scene.tsx, on the <section>
onFocusCapture={() => {
  const el = ref.current; if (!el) return;
  const vh = window.innerHeight, h = el.offsetHeight;
  const top = el.getBoundingClientRect().top + window.scrollY;
  const target = top + rest * (h - vh);                 // `rest` prop, default 0.5; start uses 1
  if (Math.abs(window.scrollY - target) > 8) window.scrollTo({ top: target });
}}
```

  Check on a device that keeping 11 stages at `opacity:0` (instead of `visibility:hidden`) does not raise layer memory on iPhone; if it does, add `content-visibility: auto` plus `contain-intrinsic-size: 100svh` to the stage so offscreen stages are skipped but remain in the accessibility tree.

### P0-4. Anchors land on a blank frame

- Where: every `Scene` id is a public anchor (`film/Scene.tsx:45`). Linked in code: `#evening` (header mark) and `#start` (skip link `href`, no-JS and open-in-new-tab). `/#start` is also the obvious link for email and social.
- Evidence (`edge.json`): `/#start` at 390 lands at scrollY 13,504 (max 14,056), section top 0, stage live, but the `h2`, input, button and honeypot all compute to opacity 0.00 (screenshot `shots/hash-start-390.png`: header wordmark on an empty dark frame). Same at 1440 (14,400). `/#a-minute` and `/#years-later`: `h2` opacity 0.00. Reason: the browser aligns the section top, which is progress 0, where the reveal values have not started.
- Fix (tested for `#start`): land each anchor at the scene's resting progress with a negative `scroll-margin-top`.

```css
/* Scene.module.css */
.scene {
  scroll-margin-top: calc(var(--scene-rest, 0.35) * (var(--scene-length, 2) - 1) * -100svh);
}
```

  `Scene` gets `rest?: number` (default 0.35) and writes `--scene-rest`. For `start` use `rest={1}`, which is `-20svh` for its length of 1.2: measured result at 390 is scrollY 13,673, section top -169, input opacity 1. Pick `rest` per scene from the `useStage(restAt)` values already in each scene.

### P0-5. Reduced motion: a missing headline, clipped content, a pill over the content

- Where and evidence (`audit-*-reduced.json`):
  - Scene 3 headline "Just talk." and its support line are absent: the reduced-motion headline list has 10 of 11 scenes. `scenes/S03Talk.tsx:49` is `useStage(0.5)`, but `headOpacity` (`:68`) and `supOpacity` (`:70`) are back to 0 by progress 0.38 (narrow) and 0.42 (wide). The scene rests on a frame with no headline.
  - Content is clipped by the stage: `.frame` is `position:absolute; inset:0; overflow:hidden` (`film/stage.module.css:5-9`) and the reduced `.stage` only gets `min-height: 100svh` (`film/Scene.module.css:54-59`). Absolutely positioned children cannot grow it. Worst case, scene 8: `.list { margin-top: 34svh }` (`scenes/S08Languages.module.css:68-77`) runs 314 px past the frame at 390x844 and 255 px at 320x568. Scenes 6 and 7 are clipped too; scenes 2 and 5 on short viewports.
  - The fixed bottom pill covers content: at 390, the Arabic line in scene 8 sits under it (1,052 px2 overlap); in motion mode the scene 7 letter text overlaps it for 4 sampled frames (2,395 px2).
- Fix:
  1. `S03Talk.tsx:49` to `useStage(0.3)`. At 0.3 `headOpacity` and `supOpacity` are 1 on both layouts. Re-run `audit.mjs --reduced` to confirm the phone does not cover the copy.
  2. Let the stage grow in reduced motion: add `--reduced-min-height` per scene and use it.
  ```css
  /* Scene.module.css, inside the existing reduced-motion block */
  .stage { min-height: var(--reduced-min-height, 100svh); }   /* stage keeps overflow:hidden for the backgrounds */
  /* stage.module.css, new reduced-motion block */
  .frame { overflow: visible; }
  ```
  Set `--reduced-min-height` per scene through the `Scene` `style` prop. For scene 8, the list's bottom edge minus the stage's bottom edge is the number to add (314 px at 390x844). Measure the others the same way.
  3. Give `main` bottom padding in reduced mode: `padding-bottom: calc(env(safe-area-inset-bottom) + 96px)`, and hide the pill over scene 7 in motion mode (`useInView('years-later', 0.5)` joins `hero` and `end` in `CtaPill`).

### P0-6. End card contrast fails on the one conversion element

- Where: `components/cta/NotifyForm.module.css:12` (label), `:79` (hint `.note`), `:37-39` (placeholder). They sit on the S11 amber lamp pool.
- Evidence (pixel-sampled behind the text at full reveal, relative-luminance formula):

| Text | Style | 390 | 1440 | Needs |
|---|---|---|---|---|
| "Your email" label | `--night-ink-muted` `#b3aa9e`, 15px/500 | 3.07 | 2.31 | 4.5 |
| Hint note | same colour, 14px | 2.96 | 2.47 | 4.5 |
| Placeholder | ink at 42% | about 3.5 | about 3.5 | 4.5 |
| Support line | S11 | n/a | 4.29 | 4.5 |

  Mid-reveal (progress 0.2) the same label measures 4.15 at 1440. The pool brightens as the card settles, so the text gets worse exactly when it is read.
- Fix: changing the text colour alone cannot reach 4.5 on the brightest part of the pool (the background luminance there is about 0.15, so the text would need to be nearly white). Darken what sits behind the form and lift the text.

```css
.form {                                    /* scrim behind label, row and hint */
  padding: 20px;
  border-radius: 28px;
  background: color-mix(in srgb, var(--night) 78%, transparent);
}
.label, .note { color: color-mix(in srgb, var(--night-ink) 88%, transparent); }
.input::placeholder { color: color-mix(in srgb, var(--night-ink) 64%, transparent); }
```

  Or cap the end lamp's peak opacity behind the card. Re-measure with `endcontrast.mjs`; the target is at least 4.5 for label, hint, placeholder and the support line. (`.row` already has an 88% raised background, so the input text itself passes.)

### P0-7. After submit the form disappears, focus is lost, the confirmation may not be announced

- Where: `components/cta/NotifyForm.tsx:35-41` (success branch), `:65` (`disabled` while sending), `:76-78` (error live region).
- Evidence (`a11y.json`, mocked `/api/notify`): during send `document.activeElement` is `BODY` (the focused submit button was disabled, then unmounted). After success the form is gone and focus is `BODY`; the confirmation is a new `<p role="status">` inserted already populated, which many screen readers do not announce. Error paths are good: focus stays in the input, `aria-invalid="true"`, and the persistent polite region (`id=statusId`) is wired through `aria-describedby`.
- Fix:

```tsx
const doneRef = useRef<HTMLParagraphElement>(null);
useEffect(() => { if (state === 'done') doneRef.current?.focus(); }, [state]);
// success branch: focusable, no role (the focus move is the announcement)
<p ref={doneRef} tabIndex={-1} className={styles.success}>{c.success}</p>
// submit button: keep it focusable while sending
<button type="submit" aria-disabled={state === 'sending'} ...>
// onSubmit: if (state === 'sending') return;   (already there)
```

---

## P1: should fix

### P1-1. Mobile frame pacing has little headroom (after P0-1 expect about 26% and 5%)

At 4x CPU the page runs 26.4% of frames over 16.7 ms and 5.3% over 33 ms (p95 49.9 ms). Worst scenes: a-minute 56% / 14.9%, just-talk 48% / 15.7%, years-later 34% / 5.8%, evening 31% / 7.6%. The same page without throttling is 1.9% and 1.0%, so a current iPhone should be fine and a 3-year-old one will show it. After P0-1 these are the remaining contributors, by evidence:

- Per-word MotionValues: `components/app-ui/screens/Listening.tsx:21-23`, 2 `useTransform` per word (about 60 words, so about 120 subscriptions, 61 to 64 text layout events per sweep). Replace with one value and CSS:
  ```tsx
  // one MotionValue writes --w on the transcript; each word sets style={{'--i': i}}
  .word {
    --k: clamp(0, calc((var(--w) - var(--i)) / 0.7), 1);
    opacity: var(--k);
    transform: translateY(calc((1 - var(--k)) * 3px));
  }
  ```
  One style write per frame instead of about 120 subscriptions. Check the result in Safari: if it rejects unitless division inside `clamp`, multiply by `1.4286` instead.
- Cover carousel: `scenes/S06Book.tsx:43-53`, 4 transforms for each of 24 covers, about 96 MotionValues, all recomputed every frame though only about 7 covers are inside `d <= 3`. Render a window of covers and update the window start only when the integer month changes (about 15 React commits per sweep, not per frame).
- `mask-image` on a moving transcript: `Listening.tsx:129-130`. iOS Safari repaints masked scrolling content poorly. Replace by an overlay element with a `linear-gradient(var(--paper-or-night), transparent)` on top.
- `backdrop-filter: blur(6px)` on the form row: `NotifyForm.module.css:21`. The row is already 88% opaque, so the blur is invisible and costs a backdrop layer. Delete it.
- SVG `pathLength` writes: 72 to 113 style invalidations per sweep in S01 and S07. Acceptable on desktop; on iPhone prefer `strokeDashoffset` with a constant `pathLength=1`.
- Large lamp layers: `components/atmosphere` LampLight pools are 971x971 px on a 390 screen, 90 to 190 vmax, with `breathe` (`atmosphere.module.css:21-23`). They are compositor-only (scale and opacity) and paused when off-screen (`visibility.ts`), so the steady cost is memory (about 32 MB each in the LayerTree). Cap at 2 pools per stage on phones.
- Load: 6 to 7 long tasks and TBT 317 to 489 ms at 4x. Everything ships in one 695 KB (decoded) bundle. `next/dynamic` the heavy mock-up parts used after the first screen (`Listening`, `PaperLetter`, `S06 Cover`).

### P1-2. The footer prefetches five legal pages when it scrolls into view: 82.7 KB

- Where: `components/site/Footer.tsx:35` renders `next/link` `<Link>`; in production it prefetches the RSC payload as soon as the link is in the viewport.
- Evidence: whole-page transfer is 546,351 B against 463,622 B at load. The difference, 82,729 B, is exactly 10 `Fetch` requests for `/privacy` (24.7 KB), `/terms` (27.0 KB), `/health-privacy` (9.6 KB), `/subprocessors` (11.1 KB) and `/delete-account` (4.3 KB), each preceded by a small probe. They arrive on the last screen, where the user is about to submit the form, on a phone connection. The footer is also the worst-paced section in the sweep (30.6% over 16.7 ms, 16.7% over 33 ms, 12 frames, small sample).
- Fix: `<Link prefetch={false} ...>` for the footer links. They are not on the conversion path.

### P1-3. iOS URL bar: dark strip under paper scenes, and the phone jumps once

- Where: all stage heights use `svh` (`film/Scene.module.css:4,20`) while JS reads `innerHeight`: `scenes/parts/act3/viewport.ts:11`, `components/cta/goToStart.ts:9`, `components/cta/useTone.ts:14`.
- Evidence (`ios.json`, 924 px visual viewport emulating a collapsed toolbar over a stage of 844): the 80 px under paper scenes (exactly, your-voice, the-book) shows `body` `rgb(22,20,18)` below `rgb(251,248,243)`. When `innerHeight` changes 844 to 924, `useViewport` repositions the phone by 48 to 51 px (a-minute top 249 to 297, just-talk 274 to 325), one visible nudge the first time the user scrolls on an iPhone.
- Fix: (a) read a stable height from CSS instead of `innerHeight`: observe a `position:fixed; height:100svh; width:0` probe with `ResizeObserver` in `viewport.ts`; `svh` does not change when the toolbar collapses. (b) Paint the strip. Sections must not paint (`Scene.module.css:7-12`), so set the document background from the tone under the bottom edge: `useToneAt('bottom')` writes `document.documentElement.dataset.tone`, and `html[data-tone='paper'] { background: var(--paper) }` (dusk and night likewise). Test on a device.

### P1-4. No JavaScript means a 14,900 px blank column

- Evidence (`ios.json`, JS disabled): `h1` visible, all 11 scene `h2` and the form compute to opacity 0 (initial MotionValue values are the progress-0 values), page height 14,900 px (9,667 under reduced motion). The only conversion action also needs JS (`fetch` in `submitNotify`).
- Fix: `@media (prefers-reduced-motion: reduce), (scripting: none)` for the reduced layout block in `Scene.module.css:46`, and `<form method="post" action="/api/notify">` so the form degrades. Server-render each scene at its rest value rather than progress 0.

### P1-5. Phone mock-up screens are read as real content

- Evidence: the in-phone UI (Tonight, Listening, Letter, times, labels, fake buttons) is real text in the accessibility tree and repeats the narrative. 76 to 77 elements are `aria-hidden` already; the mock-ups are not among them.
- Fix: `PhoneFrame` gets `role="img"` with a one-line `aria-label` (what the screen shows), children `aria-hidden`.

### P1-6. Analytics is not mounted

- `lib/analytics/WebAnalytics.tsx:6-8` says to mount `<WebAnalytics />` once in the root layout; `app/layout.tsx:26` is `<body>{children}</body>`. `track()` calls (`cta_click`, `notify_submit`) go nowhere. Mount it, and confirm no entry text or child name is in any event (CLAUDE.md privacy rule; the current events carry none).

### P1-7. Hero: the "y" in "Early" meets the tagline at 1440

- Evidence: `shots/crop-hero-1440.png`: the descender hook of the "y" touches the "T" of "The baby memory book...". Bounding boxes overlap by 12,002 px2 at 1440 in motion and reduced modes; at 390 the gap is clear. `design-critic-1` item 1 covers the same frame as P0.
- Fix: `scenes/S01Evening.module.css:12-20` add `padding-bottom: 0.14em` to `.h1` (or raise `.line` margin to `calc(0.9em + 0.08 * clamp(60px, 13vw, 176px))`). Check by eye at 1280, 1440, 1920.

### P1-8. Other contrast and legibility

- S06 meta line "12 letters, from Papa and Mama": 3.28 mean, 1.73 at the 5th percentile (fades over a changing background, `p=0.2`). S07 "Papa" in the phone: 3.54 at 10.8 px.
- Text in the phone mock-ups is 7 to 10 px (for example "Speak" 8.5 px, "Finish" 9.4 px). The audit sampled 1.03 to 1.18 behind these labels, which looks like a sampling artefact (dark label on an amber button on a transformed layer); confirm by eye. Do not treat as real until confirmed.

---

## P2: polish

- S06 cover numerals and labels (`numeral` 1.59 to 2.32:1, `Month 25..28` 3.97 to 4.05:1) are decorative fades but are real text in the tree (`aria-hidden` false). Mark covers `aria-hidden`.
- Bounding-box overlaps that are near touches, not collisions (confirm by eye): S01 dateline against headline, S07 "Years from now" against the headline (1,142 px2), S03 "Listening." against "The house is quiet, Papa." inside the phone.
- Fonts: 7 files, 152.6 KB at load. Devanagari, Chinese and Arabic subsets (33.9 KB) are fetched at load because the S08 lines are in the DOM. No `preload` for the LCP font (Literata Latin variable, 53.3 KB). Three Mukta weights, 65 KB. Desktop CLS 0.0157 at load is the font swap (good, but one more reason to preload). Mount S08's non-Latin lines when the scene is within two screens.
- Textures `/textures/grain-v1.webp` (22.8 KB) and `paper-v1.webp` (35.5 KB) are served `Cache-Control: public, max-age=0` locally. The names are versioned, so set `public, max-age=31536000, immutable` in `next.config.ts` headers (check what Vercel actually sends).
- `useInView` creates 21 thresholds and is called four times (header, pill, evening, start): `components/cta/useTone.ts:46`. Two thresholds, or compute from cached tops after P0-1.
- `film/Film.tsx:15`: `key={SceneComponent.name}` depends on function names surviving minification. Use `key={index}` or an exported `id`.
- Refresh mid-page at 4x: the headline sits at opacity 0 for about 250 ms after load (190 ms: 0, 443 ms: 1) until hydration sets the values. Render SSR values for the current scroll, or accept.
- LayerTree shows the root at 390x14,900 and `section#just-talk` at 390x11,946 as single layers (nominal 199 MB and 160 MB; tile-backed, so not resident). Find why S03 is its own composited layer and drop the `will-change` if it is one.
- `role="status"` already implies `aria-live="polite"` (`NotifyForm.tsx:76`); harmless.

---

## What passed

- Scene reveal contract (`film/Scene.tsx:61-78`): 2,783 checks of `data-live` against `getBoundingClientRect().top <= 0.5` while stepping 97 px down and 131 px up, plus 108 fractional offsets from -1.2 to +1.4 px around each cut: 0 mismatches. Reveal flips in the same rAF as the crossing (no frame with a hidden pinned stage). Resize across 12 sizes (320x568 to 1920x1080 and 844x390 landscape) while pinned: 0 mismatches, 0 horizontal overflow, 0 page errors.
- Hooks: no rules-of-hooks violations found. `useStage` is unconditional, `useResting` uses `useSyncExternalStore` (hydration-safe), `useViewport` is rAF-throttled and resize-only.
- Hydration: production console had no hydration warnings; the only message was an unused-preload CSS warning (`2t63rtch5ozij.css`, 1.5 KB; harmless).
- No per-frame React state: commits per sweep are 0 to 7 per scene, all discrete (`PaperLetter` `NameFix` and `Removal` through `queueMicrotask`: 7 in scene 4). 0 commits in your-voice, start and footer.
- Cleanup: `ResizeObserver.disconnect` in `Listening.tsx:54-56`, resize listener removed in `Scene.tsx:76-77`, rAF cancelled in `useTone.ts`, Motes canvas loop paused off-screen.
- Structure: one `h1`, 11 scene `h2` (all exposed once past), `header` / `main` / `footer`, 11 labelled regions, skip link is the first Tab stop with a visible 2 px focus ring on every stop (8 of 8).
- Form wiring: label `for`, `type=email`, `inputMode=email`, `autocomplete=email`, `required`, 17 px (no iOS zoom), hint and status in `aria-describedby`, `aria-invalid` on error, honeypot `tabindex=-1` inside an `aria-hidden` wrapper, focus stays on the input after errors.
- Speed: LCP 492 ms (4x CPU) and 224 ms (desktop); CLS 0 at load on mobile; JS 223 KB transferred.
- Native ViewTimeline and the JS scroll fallback both work and are close (26.4% vs 31.9% frames over 16.7 ms), so Safari without ViewTimeline is not a cliff.

## Housekeeping

- Server on port 3190 stopped; `apps/web/.next-critic` deleted. Other `.next-*` directories belong to other work and were not touched.
- `next build` added `.next-critic/...` globs to `apps/web/tsconfig.json`; reverted with `git checkout -- apps/web/tsconfig.json` (the file is unchanged from HEAD). Nothing staged, committed or pushed. This review file is the only repository change from this pass.
