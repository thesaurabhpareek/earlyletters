// Builds docs/release/journey/INDEX.md from the step files the flows wrote. Run after `npm run e2e:web:journey -w @scribe/mobile`:
//   node apps/mobile/e2e-web/support/build-index.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../docs/release/journey');
const steps = fs
  .readdirSync(path.join(OUT, 'steps'))
  .filter((f) => f.endsWith('.json'))
  .map((f) => JSON.parse(fs.readFileSync(path.join(OUT, 'steps', f), 'utf8')))
  .sort((a, b) => a.id.localeCompare(b.id));

const TITLES = {
  'first-run': 'J01 First run: age question, promise, child, signature, first letter',
  'under-18': 'J02 Under 18: the stop screen and the way back',
  'children-and-books': 'J03 More than one child, the switcher, and the Plus gate for a new book',
  'tonight-and-prompts': 'J04 Tonight, prompts, and the usage-sharing ask',
  'voice-capture': 'J05 Speaking a letter: listening, pause, mic denied, offline, very short, long',
  'review-and-edits': 'J06 Review: tidy-ups, put back, word for word, edit, save or keep private',
  'typed-letter': 'J07 Typing a letter: write, autosave, draft, review, save',
  'quiet-day': 'J08 A quiet day: "Not much today"',
  'the-book': 'J09 The Book: empty, one letter, many, waiting for words, nobody spoke',
  'letter-detail': 'J10 A letter: original words, reading size, private, delete and undo, not found',
  'read-together': 'J11 Read together: free tries, the Plus gate, empty',
  plus: 'J12 Plus: the Plan screen and restore',
  reminders: 'J13 Reminders',
  'recordings-and-language': 'J14 Recordings and spoken language',
  export: 'J15 Export',
  'settings-and-help': 'J16 Settings, privacy, appearance, help, licences',
  'family-coming-soon': 'J17 Family: co-parent sharing is coming soon',
  'dark-mode': 'J18 Dark mode',
  errors: 'J19 Errors: unknown route',
  crash: 'J20 Crash (fault injected)',
};

const byJourney = new Map();
for (const s of steps) {
  if (!byJourney.has(s.journey)) byJourney.set(s.journey, []);
  byJourney.get(s.journey).push(s);
}
const order = [...byJourney.keys()].sort((a, b) => byJourney.get(a)[0].id.localeCompare(byJourney.get(b)[0].id));
const shots = steps.filter((s) => s.shot).length;
const fulls = steps.filter((s) => s.full).length;
const esc = (t) => String(t ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');

let md = `# Early Letters v1.0: customer journey, as the app really renders it

Generated from the web end-to-end flows (\`apps/mobile/e2e-web/*.flow.ts\`), run against the real v1.0 app exported for web with
\`EXPO_PUBLIC_SERVER_FEATURES=off\` (on this phone only, no accounts, no sync). Chromium emulating an iPhone 17 Pro
(402 x 874 CSS px at 3x). Nothing here is a mock-up: every screen is a screenshot of the running app, and \`text\` in each step JSON is the
visible text read from the page.

- Journeys: **${order.length}**, steps: **${steps.length}** (happy ${steps.filter((s) => s.kind === 'happy').length}, unhappy ${steps.filter((s) => s.kind === 'unhappy').length}), screenshots: **${shots}**, plus **${fulls}** full-length captures of scrolling screens (\`<id>-full.png\`).
- Files: \`steps/<id>.json\` (id, journey, kind, title, note, from, route, viewport, safeArea, scrolls, text, lines), \`screens/<id>.png\`, \`screens/<id>-full.png\`.
- Regenerate: \`npm run e2e:web:journey -w @scribe/mobile\` then \`node apps/mobile/e2e-web/support/build-index.mjs\`.
- Seeded steps use the fictional family Asha (the web preview switch \`EXPO_PUBLIC_WEB_PREVIEW=1\`, \`?seed=asha\`), because the web build has no speech model and cannot produce words from a recording. They are the real screens with data filled in; each such step says so.
- Safe areas: a browser applies 0 to the top and bottom insets. Each step records \`safeArea.appliedOnWeb\` and the iPhone 17 Pro nominal insets (top 62, bottom 34) the device frame should keep clear.

`;
for (const j of order) {
  const list = byJourney.get(j);
  md += `## ${TITLES[j] ?? j}\n\n| Step | Kind | What the person sees and does | From | Screen |\n|---|---|---|---|---|\n`;
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
- **Alert dialogs**: "Let it go" (discard a recording), "Hide this book", "Cancel invite" use native \`Alert\`, which does nothing on web.
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
- **Accounts, sign-in, sync, invites, delete account**: off by design in v1.0 (\`EXPO_PUBLIC_SERVER_FEATURES=off\`); the screens exist in the code but are not offered. Co-parent entry points show "coming soon" (J17).
- **Real family data**: never used; only the fictional family Asha.
`;
fs.writeFileSync(path.join(OUT, 'INDEX.md'), md);
console.log(`INDEX.md: ${order.length} journeys, ${steps.length} steps, ${shots} screenshots, ${fulls} full`);
