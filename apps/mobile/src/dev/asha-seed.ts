/**
 * DEVELOPMENT ONLY, used by the web design preview (store-ready.web.ts).
 * The fictional family "Asha" (CLAUDE.md privacy rules): never real names.
 * Idempotent: does nothing if a child already exists.
 */
import { ENGINE_VERSION, faithfulClean } from '@scribe/core';
import { addChild, createDraft, dictionaryFor, listChildren, saveEntry, setDraftTranscript, setSetting, todayISO, uuidv7 } from '@/lib/store';

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

/**
 * `waiting`: the Review draft has no words yet and one voice-only letter sits
 * in the book, for the "waiting for words" previews (TDD 03 FM-9).
 * `quiet`: one kept recording in which nobody spoke (words came back empty),
 * for the calm "no words in this one" note on the card and the letter page.
 * `marks`: two quiet-day marks saved the way older builds saved them, holding the template
 * sentence (D-084): one on a day with no letter (listed as "A quiet day"), one on the day of
 * a letter (hidden). The old sentence must never show.
 */
export function seedAsha(opts: { waiting?: boolean; quiet?: boolean; marks?: boolean } = {}): { draftId: string } | null {
  if (listChildren().length > 0) return null;
  const now = Date.now();
  const child = addChild({ name: 'Asha', birthday: todayISO(new Date(now - 214 * DAY)), dueDate: null, signsAs: 'Mama' });
  const dictionary = dictionaryFor({ childName: child.name, childBirthday: child.birthday, signsAs: child.signsAs });
  setSetting('ageGate.passed', '1'); // the 18+ gate boolean (PRD-REQ-019, DECISIONS D-026)
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
  setSetting('preview.draftId', draft.id);
  return { draftId: draft.id };
}
