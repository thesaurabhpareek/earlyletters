/**
 * DEVELOPMENT ONLY, used by the web design preview (store-ready.web.ts).
 * The fictional family "Asha" (CLAUDE.md privacy rules): never real names.
 * Idempotent: does nothing if a child already exists.
 */
import { ENGINE_VERSION, faithfulClean } from '@scribe/core';
import { addChild, createDraft, dictionaryFor, hideChild, listChildren, saveEntry, setDraftTranscript, setSetting, todayISO, uuidv7 } from '@/lib/store';
import { acceptBeforeYouBegin } from '@/lib/age-gate';
import { copy } from '@/lib/copy';
import { PLAN_CACHE_KEY } from '@/lib/billing/config';
import { serializePlanCache } from '@/lib/billing/plan.logic';

const DAY = 864e5;

const LETTERS: { daysAgo: number; promptKey: string | null; raw: string; spoken: boolean; inBook: boolean }[] = [
  {
    daysAgo: 196,
    promptKey: 'opening.any.know',
    raw: 'Asha, you are four days old and um the whole house is quiet. Your Nani made dal and nobody ate it because we were all watching you sleep.',
    spoken: true,
    inBook: true,
  },
  {
    daysAgo: 150,
    promptKey: 'opening.any.laugh',
    raw: 'You laughed today. A real one. It sounded like a like a little hiccup that surprised you as much as it surprised me.',
    spoken: true,
    inBook: true,
  },
  {
    daysAgo: 104,
    promptKey: 'opening.any.smell',
    raw: 'You smell like warm milk and the lavender soap Papa insists on. I could sit here all night.',
    spoken: false,
    inBook: true,
  },
  {
    daysAgo: 61,
    promptKey: 'opening.any.weather',
    raw: 'So it rained all morning so we we sat by the window and you tried to catch the drops on the glass. You were so serious about it.',
    spoken: true,
    inBook: true,
  },
  {
    daysAgo: 23,
    promptKey: 'opening.any.surprise',
    raw: 'You rolled over all by yourself, uh, twice, and then looked at me like you had always known how.',
    spoken: true,
    inBook: false,
  },
  {
    daysAgo: 4,
    promptKey: 'opening.any.ordinary-minute',
    raw: 'Bath time. You splash with your whole body, both hands, both feet, and then you check that I saw.',
    spoken: false,
    inBook: true,
  },
];

export const ASHA_REVIEW_RAW =
  'Asha, um, today you you held the spoon by yourself. You mostly painted your face with it, but you were so so proud. I want you to know that I was too.';

/** `drafts`: a second spoken draft, from yesterday, whose words are ready too (two "Read it back" cards on Tonight). */
export const ASHA_SECOND_DRAFT_RAW =
  'Asha, you sat in the laundry basket today and you would not get out, so Papa folded the towels around you, um, one by one.';

/**
 * `long`: more letters for the Book, typed and in the book, one about every eight days, so the Book runs well past one
 * screen. Fictional family only; short on purpose (the length comes from the number of letters).
 */
const LONG_BOOK = [
  'You grabbed my finger and would not let go, not even in your sleep.',
  'Nani sang the old song tonight and you went quiet, listening, the whole way through.',
  'You found the ceiling fan. You watched it like it was the moon.',
  'Your first proper bath in the big tub. You were furious, then you were not.',
  'You sneezed three times in a row and looked at me as if I had done it.',
  'Papa read you the newspaper out loud. You seemed to agree with most of it.',
  'You held your head up on your own for a long minute and we both cheered.',
  'The neighbours came to meet you. You slept through every one of them.',
  'You discovered your feet and spent the whole evening introducing yourself to them.',
  'A long walk in the park. You watched the leaves the whole way.',
  'You made a new sound today, a little squeak, and then made it forty more times.',
  'You reached for the spoon before it reached you. You are getting quick.',
  'Rain on the window again. You put your hand flat on the glass.',
  'You fell asleep on my chest while I was writing this.',
  'You laughed at the dog shaking off the water, and then the dog laughed too, I think.',
  'You chewed the corner of your book. I suppose that is one way to read it.',
  'Papa did the dishes with you on his hip and you supervised every plate.',
  'You rolled to the edge of the rug and stopped, as if you had planned it.',
  'Your cousin came over and you could not stop staring at her.',
  'You tried mango for the first time. Your whole face said yes.',
  'You clapped, almost. Your hands met in the middle and you were amazed.',
  'You were up three times last night and every time you smiled when you saw me.',
  'You pulled yourself to sitting with my two fingers and looked so pleased.',
  'A quiet evening, the two of us, the lamp on, nothing much at all.',
];

/**
 * `unborn`: Asha is not born yet (no birthday, a due date ten weeks from today) and nothing is written yet, so Tonight
 * reads "Before You" and offers a prompt from the set written for before the birth. The other options are not read.
 * `drafts`: a second spoken draft with its words ready, from yesterday (ASHA_SECOND_DRAFT_RAW), beside the usual one.
 * `long`: the LONG_BOOK letters too, so the Book scrolls a long way.
 * `waiting`: the Review draft has no words yet and one voice-only letter sits
 * in the book, for the "waiting for words" previews (TDD 03 FM-9).
 * `quiet`: one kept recording in which nobody spoke (words came back empty),
 * for the calm "nobody spoke" note on the card and the letter page.
 * `marks`: two quiet-day marks saved the way older builds saved them, holding the template
 * sentence (D-084): one on a day with no letter (listed as "A quiet day"), one on the day of
 * a letter (hidden). The old sentence must never show.
 * `plus`: Plus is on (a cached annual entitlement in device settings, the way the app
 * keeps StoreKit's last answer), so Keep is not gated. Without it this phone is Free,
 * and with 5 letters already it is past the 2 free ones (D-082): Keep shows the gate.
 */
export function seedAsha(
  opts: { waiting?: boolean; quiet?: boolean; marks?: boolean; plus?: boolean; hidden?: boolean; unborn?: boolean; drafts?: boolean; long?: boolean } = {},
): { draftId: string | null } | null {
  if (listChildren().length > 0) return null;
  const now = Date.now();
  const child = opts.unborn
    ? addChild({ name: 'Asha', birthday: null, dueDate: todayISO(new Date(now + 70 * DAY)), signsAs: 'Mama' })
    : addChild({ name: 'Asha', birthday: todayISO(new Date(now - 214 * DAY)), dueDate: null, signsAs: 'Mama' });
  const dictionary = dictionaryFor({ childName: child.name, childBirthday: child.birthday, signsAs: child.signsAs });
  setSetting('ageGate.passed', '1'); // the 18+ gate boolean (PRD-REQ-019, DECISIONS D-026)
  // A seeded dev install has accepted Before you begin, so it opens on the book, not the one-time agreement.
  acceptBeforeYouBegin(copy.beforeBegin.agree, 'first_run.before_you_begin', true);
  // Before the birth nothing is written yet: the letters below are about a born child.
  if (opts.unborn) return { draftId: null };
  if (opts.plus) {
    setSetting(
      PLAN_CACHE_KEY,
      serializePlanCache({
        entitlements: [
          {
            productId: 'plus.annual',
            ownership: 'purchased',
            environment: 'production',
            isTrial: false,
            isUpgraded: false,
            purchasedAt: new Date(now - 30 * DAY).toISOString(),
            expiresAt: new Date(now + 335 * DAY).toISOString(),
          },
        ],
        statuses: [],
        checkedAt: new Date(now).toISOString(),
      }),
    );
  }
  for (const l of LETTERS) {
    const at = new Date(now - l.daysAgo * DAY);
    const clean = l.spoken ? faithfulClean(l.raw, { level: 'clean', dictionary }) : null;
    saveEntry({
      id: uuidv7(at.getTime()),
      kind: 'letter',
      occurredOn: todayISO(at),
      capturedAt: at.toISOString(),
      captureMode: l.spoken ? 'spoken' : 'typed',
      editLevel: l.spoken ? 'clean' : 'verbatim',
      promptKey: l.promptKey,
      engineVersion: ENGINE_VERSION,
      rawTranscript: l.raw,
      machineEdits: clean ? clean.applied : [],
      finalText: clean ? clean.text : l.raw,
      inBook: l.inBook,
      soundsLikeMe: l.spoken ? true : null,
      childId: child.id,
      authorSignsAs: 'Mama',
      audioUri: l.spoken ? 'file:///preview/asha.m4a' : null,
      audioDurationMs: l.spoken ? 42000 : null,
    });
  }
  if (opts.long) {
    LONG_BOOK.forEach((raw, i) => {
      const at = new Date(now - (6 + i * 8) * DAY);
      saveEntry({
        id: uuidv7(at.getTime() + 2),
        kind: 'letter',
        occurredOn: todayISO(at),
        capturedAt: at.toISOString(),
        captureMode: 'typed',
        editLevel: 'verbatim',
        promptKey: null,
        engineVersion: ENGINE_VERSION,
        rawTranscript: raw,
        machineEdits: [],
        finalText: raw,
        inBook: true,
        soundsLikeMe: null,
        childId: child.id,
        authorSignsAs: 'Mama',
        audioUri: null,
        audioDurationMs: null,
      });
    });
  }
  if (opts.drafts) {
    // Made before the usual draft below, so Tonight lists it second (newest first).
    const second = createDraft({
      childId: child.id,
      captureMode: 'spoken',
      promptKey: 'opening.any.ordinary-minute',
      audioUri: 'file:///preview/asha-draft-2.m4a',
      audioDurationMs: 47000,
      createdAt: new Date(now - DAY).toISOString(),
    });
    setDraftTranscript(second.id, ASHA_SECOND_DRAFT_RAW);
  }
  // A spoken draft waiting on Review, so the machine-edit underlines can be seen.
  const draft = createDraft({
    childId: child.id,
    captureMode: 'spoken',
    promptKey: 'opening.any.remember',
    audioUri: 'file:///preview/asha-draft.m4a',
    audioDurationMs: 31000,
  });
  if (opts.waiting) {
    const at = new Date(now - 3 * DAY);
    saveEntry({
      id: uuidv7(at.getTime()),
      kind: 'letter',
      occurredOn: todayISO(at),
      capturedAt: at.toISOString(),
      captureMode: 'spoken',
      editLevel: 'verbatim',
      promptKey: null,
      engineVersion: ENGINE_VERSION,
      rawTranscript: '',
      machineEdits: [],
      finalText: '',
      inBook: false,
      soundsLikeMe: null,
      childId: child.id,
      authorSignsAs: 'Mama',
      audioUri: 'file:///preview/asha-voice.m4a',
      audioDurationMs: 54000,
      transcriptStatus: 'waiting',
    });
  } else setDraftTranscript(draft.id, ASHA_REVIEW_RAW);
  if (opts.quiet) {
    const at = new Date(now - 2 * DAY);
    saveEntry({
      id: uuidv7(at.getTime()),
      kind: 'letter',
      occurredOn: todayISO(at),
      capturedAt: at.toISOString(),
      captureMode: 'spoken',
      editLevel: 'verbatim',
      promptKey: null,
      engineVersion: ENGINE_VERSION,
      rawTranscript: '',
      machineEdits: [],
      finalText: '',
      inBook: false,
      soundsLikeMe: null,
      childId: child.id,
      authorSignsAs: 'Mama',
      audioUri: 'file:///preview/asha-quiet.m4a',
      audioDurationMs: 18000,
      transcriptStatus: null,
    });
  }
  if (opts.marks) {
    for (const daysAgo of [1, 4]) {
      const at = new Date(now - daysAgo * DAY);
      const sentence = 'Today. Not much today. Just Asha, and us, and an ordinary day.';
      saveEntry({
        id: uuidv7(at.getTime() + 1),
        kind: 'not_much',
        occurredOn: todayISO(at),
        capturedAt: at.toISOString(),
        captureMode: 'typed',
        editLevel: 'verbatim',
        promptKey: null,
        engineVersion: ENGINE_VERSION,
        rawTranscript: sentence,
        machineEdits: [],
        finalText: sentence,
        inBook: false,
        soundsLikeMe: null,
        childId: child.id,
        authorSignsAs: 'Mama',
      });
    }
  }
  if (opts.hidden) {
    // A second book, hidden on this phone (Settings, Hidden books): Avi, from the fictional family.
    const avi = addChild({ name: 'Avi', birthday: todayISO(new Date(now - 30 * DAY)), dueDate: null, signsAs: 'Mama' });
    hideChild(avi.id);
  }
  setSetting('preview.draftId', draft.id);
  return { draftId: draft.id };
}
