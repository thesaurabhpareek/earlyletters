// Builds docs/release/journey/INDEX.md from the step files the flows wrote. Run after `npm run e2e:web:journey -w @scribe/mobile`:
//   npm run e2e:web:index -w @scribe/mobile   (node apps/mobile/e2e-web/support/build-index.mjs)
// Reads steps/*.json only, so it works on a fresh clone: the screenshots it links to are generated output (gitignored).
//
// It REFUSES to write INDEX.md (exit 1, naming the steps) when any step it reads has no `shot`. A run without
// JOURNEY_SHOTS=1 rewrites that flow's step files without `shot` and `full`, and an index built from them has no
// Screen links: that is how 144 links were lost on 13 Oct 2026. The safe procedure is in docs/release/journey/README.md.
//
// Options:
//   --text-only   write the index anyway, from steps with no screenshots, under a banner that says so. For reading the
//                 text of a local run. Never commit the result.
//   --dir <path>  read <path>/steps and write <path>/INDEX.md instead of docs/release/journey (the unit test uses this)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// The heading of each journey, after its code. The code (J01, J21, ...) is read from the step ids, never typed here, so a
// heading cannot disagree with the steps under it. A journey with no entry here still gets a heading and a warning.
// (smoke.flow.ts records J00-open under 'first-run', so a journey's code is the one most of its steps carry.)
const TITLES = {
  'first-run': 'First run: age question, promise, child, signature, first letter',
  'under-18': 'Under 18: the stop screen and the way back',
  'children-and-books': 'More than one child, the switcher, and the Plus gate for a new book',
  'tonight-and-prompts': 'Tonight, prompts, and the usage-sharing ask',
  'voice-capture': 'Speaking a letter: listening, pause, mic denied, offline, very short, long',
  'review-and-edits': 'Review: tidy-ups, put back, word for word, edit, save or keep private',
  'typed-letter': 'Typing a letter: write, autosave, draft, review, save',
  'quiet-day': 'A quiet day: "Not much today"',
  'the-book': 'The Book: empty, one letter, many, waiting for words, nobody spoke',
  'letter-detail': 'A letter: original words, reading size, private, delete and undo, not found',
  'read-together': 'Read together: free tries, the Plus gate, empty',
  plus: 'Plus: the Plan screen and restore',
  reminders: 'Reminders',
  'recordings-and-language': 'Recordings and spoken language',
  export: 'Export',
  'settings-and-help': 'Settings, privacy, appearance, help, licences',
  'family-coming-soon': 'Family: co-parent sharing is coming soon',
  'dark-mode': 'Dark mode',
  errors: 'Errors: unknown route',
  crash: 'Crash (fault injected)',
  'co-parent-sharing': 'Two parents: invite, join, and the Family tab (server features on)',
  'sign-in': 'Sign in and Account (server features on)',
};

const MAX_NAMED = 20;

/** The code most of a journey's steps carry (ties go to the lowest): J01 for 'first-run', which also holds smoke's J00-open. */
function journeyCode(list) {
  const counts = new Map();
  for (const s of list) {
    const c = s.id.split('-')[0];
    counts.set(c, (counts.get(c) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0];
}

function main(argv) {
  let textOnly = false;
  let out = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../docs/release/journey');
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--text-only') textOnly = true;
    else if (argv[i] === '--dir' && argv[i + 1]) out = path.resolve(argv[++i]);
    else {
      console.error(`build-index: unknown argument "${argv[i]}". Usage: build-index.mjs [--text-only] [--dir <path>]`);
      return 2;
    }
  }

  const stepsDir = path.join(out, 'steps');
  if (!fs.existsSync(stepsDir)) {
    console.error(`build-index: no steps folder at ${stepsDir}. Run the flows first (npm run e2e:web:journey -w @scribe/mobile).`);
    return 1;
  }
  const steps = fs
    .readdirSync(stepsDir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(fs.readFileSync(path.join(stepsDir, f), 'utf8')))
    .sort((a, b) => a.id.localeCompare(b.id));
  if (steps.length === 0) {
    console.error(`build-index: ${stepsDir} has no step files. Run the flows first (npm run e2e:web:journey -w @scribe/mobile).`);
    return 1;
  }

  // The guard. A step with no `shot` was written by a run without JOURNEY_SHOTS=1 (or is left over from an older run).
  const noShot = steps.filter((s) => !s.shot);
  if (noShot.length > 0 && !textOnly) {
    const named = noShot.slice(0, MAX_NAMED).map((s) => s.id);
    const more = noShot.length > MAX_NAMED ? `, and ${noShot.length - MAX_NAMED} more` : '';
    console.error(
      [
        `build-index: refusing to write INDEX.md. ${noShot.length} of ${steps.length} steps have no \`shot\` field:`,
        `  ${named.join(' ')}${more}`,
        'They come from a run without JOURNEY_SHOTS=1, or are left over from an older run. An index built from them has no Screen links',
        'and describes screens that may not exist any more. Nothing was written.',
        'Safe procedure (docs/release/journey/README.md): remove steps/, then run `npm run e2e:web:journey -w @scribe/mobile` on a fresh',
        'web export (E2E_WEB_REBUILD=1), then this script. Only the journey-record pull request commits steps/ and INDEX.md.',
        'To read the text of a local run anyway (never commit it): node apps/mobile/e2e-web/support/build-index.mjs --text-only',
      ].join('\n'),
    );
    return 1;
  }

  const byJourney = new Map();
  for (const s of steps) {
    if (!byJourney.has(s.journey)) byJourney.set(s.journey, []);
    byJourney.get(s.journey).push(s);
  }
  const order = [...byJourney.keys()].sort((a, b) => byJourney.get(a)[0].id.localeCompare(byJourney.get(b)[0].id));
  const shots = steps.filter((s) => s.shot).length;
  const fulls = steps.filter((s) => s.full).length;
  const esc = (t) => String(t ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');

  let md = '';
  if (noShot.length > 0) {
    md += `> **TEXT ONLY. Do not commit this file.** Written with \`--text-only\`: ${noShot.length} of ${steps.length} steps have no screenshot, so their Screen cells are empty. Regenerate with the safe procedure in \`README.md\` before it goes anywhere.\n\n`;
  }
  md += `# Early Letters v1.0: customer journey, as the app really renders it

Generated from the web end-to-end flows (\`apps/mobile/e2e-web/*.flow.ts\`) by \`apps/mobile/e2e-web/support/build-index.mjs\`, which reads \`steps/*.json\` only. The flows drive the real app, exported for web in three builds (\`apps/mobile/e2e-web/support/global-setup.ts\`), in Chromium emulating an iPhone 17 Pro (402 x 874 CSS px at 3x). Nothing here is a mock-up: every screen is a screenshot of the running app, and \`text\` in each step JSON is the visible text read from the page.

- Builds, and which journeys use which:
  - **Server features off**, a clean phone (\`EXPO_PUBLIC_SERVER_FEATURES=off\`: on this phone only, no accounts, no sync). J01, J02, J03, J05 and J07 run entirely on it; other journeys begin some of their steps with a first run on it.
  - **Server features off, seeded** (\`EXPO_PUBLIC_WEB_PREVIEW=1\`, \`?seed=asha\`): the fictional family Asha with letters filled in, because the web build has no speech model and cannot produce words from a recording. J04, J06 and J08 to J20 use it. They are the real screens with data filled in; each such step says so.
  - **Server features on, against a mock server** (\`apps/mobile/e2e-web/support/mock-server.ts\`: no real server, no real email, no real Apple account). J21, J22, and the Account step of J16.
- Journeys: **${order.length}**, steps: **${steps.length}** (happy ${steps.filter((s) => s.kind === 'happy').length}, unhappy ${steps.filter((s) => s.kind === 'unhappy').length}), screenshots: **${shots}**, plus **${fulls}** full-length captures of scrolling screens (\`<id>-full.png\`).
- Files: \`steps/<id>.json\` (id, journey, kind, title, note, from, route, viewport, safeArea, scrolls, text, lines) and this index are tracked. \`screens/<id>.png\`, \`screens/<id>-full.png\` and the PDF are generated output and are not committed: the Screen links below resolve after a local run or inside the packed zip (\`apps/mobile/e2e-web/support/pack-journey.sh\`), not on GitHub. See \`README.md\` next to this file.
- Regenerate: not by hand on a feature branch. \`README.md\` has the safe procedure: a fresh web export, \`JOURNEY_SHOTS=1\`, \`steps/\` removed first. This generator refuses to write when a step has no screenshot, and only the journey-record pull request commits \`steps/\` and this index. \`npm run e2e:web:pack -w @scribe/mobile\` zips the record, screens and PDF into one artifact.
- Safe areas: a browser applies 0 to the top and bottom insets. Each step records \`safeArea.appliedOnWeb\` and the iPhone 17 Pro nominal insets (top 62, bottom 34) the device frame should keep clear.

`;
  const untitled = [];
  for (const j of order) {
    const list = byJourney.get(j);
    const code = journeyCode(list);
    if (!TITLES[j]) untitled.push(`${code} ${j}`);
    md += `## ${code} ${TITLES[j] ?? j}\n\n| Step | Kind | What the person sees and does | From | Screen |\n|---|---|---|---|---|\n`;
    for (const s of list) {
      const img = s.shot ? `[png](${s.shot})${s.full ? ` [full](${s.full})` : ''}` : '';
      md += `| ${s.id} | ${s.kind} | **${esc(s.title)}.** ${esc(s.note)} | ${s.from ?? ''} | ${img} |\n`;
    }
    md += '\n';
  }

  md += `## Not capturable on web

These exist in the iOS app and could not be shown by the web build. Where a closest honest state was captured, the step note says so.

- **Native permission alerts** (microphone, notifications): iOS shows its own alert; Chromium auto-grants the fake microphone. Mic denied is simulated by refusing \`getUserMedia\` (J05-04).
- **Real speech and level metering**: the browser's fake microphone is a steady tone, there is no speech model and no level meter, so recordings never get words on web (Review stays on "Writing down what you said") and the "still here" quiet line is not reliable. Review with words (J06) uses the seeded family Asha. A silent recording, a recording where nobody spoke and a transcription failure are shown only through seeded data (J09-05, J10-10) or not at all.
- **Audio playback** ("Hear it", the letter player, Read together voices, autoplay): native audio; the players render but playback is not exercised.
- **Alert dialogs**: "Let it go" (discard a recording), "Hide this book", "Cancel invite", the Sign out confirm use native \`Alert\`, which does nothing on web.
- **Native pickers**: birthday and due date (including the 305-day limit and no future birthday) and the reminder time are iOS pickers; web shows a date pill or nothing. Future-date and very-old-date validation could not be driven.
- **StoreKit**: buying, the Apple store view, Manage subscription, restore success, trial, grace and an active Plus state. Web shows Plus as not available on this device (J03-08, J11-05, J12).
- **Add a child form** (empty name error, long name): it sits behind the Plus gate for a second book, which cannot be passed without StoreKit. The empty-name and long-name rules are shown in first run instead (J01-05, J01-06).
- **Notifications**: the priming sheet, the schedule, delivery and tapping a reminder. Web lands on the "notifications are off" state (J13-02).
- **Export success**: building the ZIP and the iOS share sheet need the file system; web shows the failure card (J15-02).
- **Spoken language and Storage settings screens, language pack downloads**: these use \`expo-file-system\`, which throws on web (\`this.validatePath is not a function\`) and leaves a blank page, so they are not captured. The language picker sheet in first run (J01-12) and the Recordings screen (J14-01) are.
- **Sharing sheets and external links**: Terms, Privacy Policy and the Help mail open Safari or Mail.
- **Haptics, VoiceOver announcements, Dynamic Type, Large Content Viewer, keyboard autocorrect.**
- **Interruptions and recovery**: a phone call or Siri during recording, the app going to the background, a kill mid-recording and the launch sweep that keeps stray takes.
- **iOS chrome**: status bar, Dynamic Island, home indicator and real safe areas (web insets are 0; see \`safeArea\` in each step).
- **A real server**: sign-in, Account, invites and joining are captured against a mock server (J21, J22), so a real email link or code, Sign in with Apple, a real sync and a second real phone are not. With server features off, co-parent entry points show "coming soon" (J17).
- **Real family data**: never used; only the fictional family Asha.
`;
  fs.writeFileSync(path.join(out, 'INDEX.md'), md);
  for (const u of untitled) console.error(`build-index: warning: no title for journey "${u}"; add it to TITLES in build-index.mjs`);
  if (noShot.length > 0) console.error(`build-index: --text-only: ${noShot.length} of ${steps.length} steps have no screenshot. Do not commit this INDEX.md.`);
  console.log(`INDEX.md: ${order.length} journeys, ${steps.length} steps, ${shots} screenshots, ${fulls} full`);
  return 0;
}

process.exitCode = main(process.argv.slice(2));
