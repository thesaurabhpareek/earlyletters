/**
 * Review (DESIGN_LANGUAGE 12, COMPONENTS 2.19, MOTION 5d and 5e).
 *
 * Shows what was said with every machine edit marked: removed words struck
 * through, changed words dotted. Each fix explains itself in plain words and
 * can be put back (withoutEdit). One control, "With small fixes | Exactly as
 * said", is both the view and the choice for this letter until it is saved;
 * choosing Exactly as said keeps the fixes in state, so it is reversible
 * (D-086, review-view.logic.ts). The raw
 * transcript is set once on the draft and never changed. Saving writes the
 * entry locally first, then the success haptic, then the settle animation.
 *
 * Save is one transaction (DATA-REQ-048): the audio is hashed first, then
 * the letter is inserted and the draft removed together. When words are not
 * available (no transcriber, model not ready, failure) the parent can keep
 * the recording as a letter waiting for its words (TDD 03 FM-9). Sample
 * words (development builds) are never saved as a transcript.
 *
 * The Keep gate (D-082, D-083): the first 2 letters are free, then keeping another needs
 * Plus. It runs here, at the Keep buttons (spoken, typed, or a voice kept without words),
 * after the recording is hashed and BEFORE anything is saved. When Plus is needed, the
 * sheet opens and nothing is written: the draft stays exactly where it is, so a closed
 * sheet, a kill or no network never loses a letter. After Plus starts, this same Review
 * shows again and the person taps Keep themselves.
 *
 * Words come from the transcription queue (src/lib/transcription-queue),
 * never from a transcriber called here, so reopening Review never starts a
 * second job (TDD 03 FM-18). Progress is honest: "Part 2 of 5" from the
 * queue, or the language download's own percentage. While the author's
 * language is still downloading, the voice can be kept now and its words
 * follow when the phone is ready (ADR 0015).
 */
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { router, useLocalSearchParams } from 'expo-router';
import { CaretDownIcon } from 'phosphor-react-native/src/icons/CaretDown';
import { CaretRightIcon } from 'phosphor-react-native/src/icons/CaretRight';
import { CheckIcon } from 'phosphor-react-native/src/icons/Check';
import { PauseIcon } from 'phosphor-react-native/src/icons/Pause';
import { PlayIcon } from 'phosphor-react-native/src/icons/Play';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { InputAccessoryView, Platform, Pressable, ScrollView, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import {
  ENGINE_VERSION,
  applyEdits,
  describeEdit,
  finalText as languageFinalText,
  normalizeChars,
  segments as toSegments,
  toNFC,
  withoutEdit,
  type Edit,
  type EditKind,
  type EditLevel,
  type RejectedEdit,
} from '@scribe/core';
import { tokens } from '@scribe/design-tokens';
import { LetterSheet } from '@/components/capture/letter-sheet';
import { SavedMoment } from '@/components/capture/saved-moment';
import { Transcript } from '@/components/capture/transcript';
import { monthFor } from '@/components/book/chapters';
import {
  DEFAULT_VIEW_SETTING,
  arrivalParams,
  countLine,
  letterHeader,
  savePrimaryLabel,
  savedMoment,
  signInAfterLandingMs,
  fixesInForce,
  rowShows,
  setAsideAtSave,
  showViewControl,
  viewFromSetting,
  type ReviewView,
} from '@/components/capture/review-view.logic';
import { clockOf } from '@/components/tonight/draft-card.logic';
import {
  lengthA11y,
  progressClock,
  recordingKept,
  stopLine,
  takeFile,
  waitingHints,
  wordsActionLabel,
  wordsCard,
  type WordsAction,
  type WordsCard,
} from '@/components/capture/words-state.logic';
import { isPreviewAudioPresent } from '@/dev/preview-audio';
import { PlusGate } from '@/components/child/plus-gate';
import { WhoseBookSheet } from '@/components/child/whose-book-sheet';
import { Button, ButtonRow } from '@/components/ui/button';
import { useUnlitRoom } from '@/components/ui/lamp';
import { TextField } from '@/components/ui/text-field';
import { SafeAreaView } from '@/components/ui/safe-area-view';
import { ModalHeader } from '@/components/ui/screen-header';
import { InlineState, StateScreen } from '@/components/ui/state-screen';
import { Text } from '@/components/ui/text';
import { childIndexOf, fromReminderWithin2h, promptKindOf, track, trackLetterSaved, trackMachineEditsRejected, wordCountOf } from '@/lib/analytics/track';
import { setAudioMode } from '@/lib/audio-mode';
import { consumeKeep } from '@/lib/capture/keep-intent';
import { ensureAudioHash } from '@/lib/capture/recorder';
import { copy, fill, pendingCopy, plural } from '@/lib/copy';
import { devShortcutsAllowed } from '@/lib/build-env';
import { haptic } from '@/lib/haptics';
import { languageCleanOptions, rulesForLanguage } from '@/lib/language';
import { useAuth } from '@/lib/auth/session-provider';
import { afterLetterKept, billingCopy, freeLettersAllowance, hasPlus, keepLetterGate, type KeepGate } from '@/lib/billing';
import { useMotion } from '@/lib/motion';
import {
  dictionaryFor,
  getChild,
  getDraft,
  getSetting,
  listChildren,
  listEntriesForChild,
  listHiddenChildren,
  saveLetterFromDraft,
  saveVoiceOnlyFromDraft,
  setActiveChildId,
  setDraftChild,
  setSetting,
  todayISO,
  type Draft,
} from '@/lib/store';
import { languageFor, requestWords, retryWords, sampleWordsFor, spokenFor, startSpeechDownload } from '@/lib/transcription-queue';
import { showReviewAsk } from '@/lib/models/speech-consent.logic';
import { speechAskFor, speechDownloadChoice } from '@/lib/models/speech-consent';
import { formatBytes } from '@/lib/packs/copy';
import { cleanSpoken, spokenEditLevel } from '@/lib/transcription-queue/clean';
import { useSpeechDownload, useWordsJob } from '@/lib/transcription-queue/use-words';
import { useIsAccessibilitySize, useTheme } from '@/lib/a11y';
import { footerPlacement } from '@/lib/review-layout.logic';

/** Labels per edit; `script` is a punctuation edit that only wrote characters in the author's script (core describeEdit). */
const EDIT_COPY: Record<EditKind, keyof typeof copy.review.edits> = {
  filler: 'filler',
  false_start: 'falseStart',
  repeat: 'repeat',
  stt_fix: 'misheardName',
  punctuation: 'punctuation',
  agreement: 'grammarSlip',
  paragraph: 'paragraph',
  script: 'script',
};

/** The keyboard's accessory bar while the letter is being changed (S18, iOS). */
const EDIT_ACCESSORY_ID = 'review.edit.accessory';

/** Any letter on this phone yet, in any book (hidden books count). */
function hasAnyLetter(): boolean {
  return [...listChildren(), ...listHiddenChildren()].some((c) => listEntriesForChild(c.id).length > 0);
}

/**
 * transcribing: words for this recording are on their way (queued, being written down, waiting for the
 * language download, failed or nobody spoke: WordsStatus shows which). waiting: the take is unrecoverable, either
 * empty (no bytes) or with sound the phone could not open (words-state.logic `takeFile`).
 */
type Phase = 'transcribing' | 'ready' | 'waiting' | 'saved';

export default function Review() {
  const c = useTheme().c;
  const inlineFooter = footerPlacement(useIsAccessibilitySize()) === 'inline';
  const r = copy.review;
  const motion = useMotion();
  // A room with no lamp (5.2): the light underneath leaves while Review is up and returns after (5.8 rows 4 and 4a).
  useUnlitRoom();
  const { draftId, stopped } = useLocalSearchParams<{ draftId: string; stopped?: string }>();
  const [draft, setDraft] = useState<Draft | null>(() => (draftId ? getDraft(draftId) : null));
  const [childId, setChildId] = useState(draft?.childId ?? '');
  const child = childId ? getChild(childId) : null;

  const typed = draft?.typedText != null && draft.typedText.trim().length > 0;
  const spoken = !!draft?.audioUri;
  const captureMode = typed && spoken ? 'mixed' : typed ? 'typed' : 'spoken';

  const [phase, setPhase] = useState<Phase>(
    typed || draft?.rawTranscript ? 'ready' : draft?.state === 'unrecoverable' ? 'waiting' : 'transcribing',
  );
  const language = draft ? languageFor(draft.id) : 'en';
  const job = useWordsJob(phase === 'transcribing' ? draft?.id : null);
  const download = useSpeechDownload(phase === 'transcribing' && job?.phase === 'waiting_for_pack' ? language : null);
  const [saveFailed, setSaveFailed] = useState(false);
  // Set when the Keep step needs Plus: the letter is held, not saved (see the header).
  const [gate, setGate] = useState<KeepGate | null>(null);
  // The calm line on the saved card after the second free letter (once: the count passes it once).
  const [secondFree, setSecondFree] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [voiceOnly, setVoiceOnly] = useState(false);
  const [keptForWords, setKeptForWords] = useState(false);
  const [raw, setRaw] = useState<string>(typed ? draft!.typedText! : (draft?.rawTranscript ?? ''));
  const [isSample, setIsSample] = useState(false);
  const [level] = useState<EditLevel>(typed ? 'verbatim' : spokenEditLevel(language));
  const [applied, setApplied] = useState<Edit[]>([]);
  const [openEdit, setOpenEdit] = useState<number | null>(null);
  const [restored, setRestored] = useState<{ edit: Edit; index: number } | null>(null);
  const [wash, setWash] = useState(false);
  // How this letter reads: with the small fixes, or exactly as said. Starts from the Settings default (Word for word switch).
  const [view, setView] = useState<ReviewView>(() => (typed ? 'fixes' : viewFromSetting(getSetting(DEFAULT_VIEW_SETTING))));
  // How many fixes the machine proposed for this letter (the view control and the zero wordings read it).
  const [proposed, setProposed] = useState(0);
  const [editing, setEditing] = useState(false);
  const [userText, setUserText] = useState<string | null>(null);
  const [wordsArrived, setWordsArrived] = useState(false);
  const [savedTo, setSavedTo] = useState<'book' | 'private' | null>(null);
  const [firstNote, setFirstNote] = useState(() => !typed && getSetting('review.firstNoteSeen') !== '1');
  // The fix rows fold behind one disclosure row; every mark is also tappable in the letter (S17).
  const [fixesOpen, setFixesOpen] = useState(false);
  // Read once on mount: did Write's "Add to the book" or "Keep private" send this typed letter here a moment ago? (S20)
  const keepIntent = useRef<{ inBook: boolean } | null | undefined>(undefined);
  if (keepIntent.current === undefined) keepIntent.current = consumeKeep(draftId);
  // While that one Keep runs, the sheet holds still; once the Plus sheet opens or the save does not work, this is the
  // ordinary Review for the letter (the person taps Keep themselves after Plus starts, as everywhere else).
  const [keeping, setKeeping] = useState(() => keepIntent.current !== null && typed);

  const dictionary = useMemo(
    () => (child ? dictionaryFor({ childName: child.name, childBirthday: child.birthday, signsAs: child.signsAs }) : []),
    [child?.name, child?.signsAs], // eslint-disable-line react-hooks/exhaustive-deps
  );

  // The recording's language with the author's script (Chinese) and its installed text-rules pack (ADR 0014).
  const letterLanguage = useMemo(() => spokenFor(language), [language]);
  const rules = useMemo(() => rulesForLanguage(letterLanguage), [letterLanguage]);
  const labelOf = (e: Edit) => r.edits[EDIT_COPY[describeEdit(e, rules)]];

  // Clean once per raw transcript, in the recording's language: the engine proposes, the verifier decides.
  // What the verifier refused is counted once at save (machine_edit_rejected: type, source, reason only).
  const rejected = useRef<RejectedEdit[]>([]);
  const reverted = useRef(0);
  useEffect(() => {
    if (!raw || typed) return;
    const result = cleanSpoken(raw, dictionary, language, undefined, languageCleanOptions(letterLanguage));
    rejected.current = result.rejected;
    setApplied(result.applied);
    setProposed(result.applied.length);
  }, [raw, typed, dictionary, language, letterLanguage]);

  // Ask the queue for words (idempotent: a reopened Review joins the same job).
  useEffect(() => {
    if (phase === 'transcribing' && draft?.audioUri) requestWords(draft.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Words arrived: the queue set the draft's raw transcript once (or, in development, sample words).
  useEffect(() => {
    if (phase !== 'transcribing' || !draft || job?.phase !== 'done' || job.outcome !== 'ok') return;
    const samplePart = sampleWordsFor(draft.id);
    const stored = getDraft(draft.id)?.rawTranscript ?? null;
    const words = stored ?? samplePart?.raw ?? null;
    if (!words) return;
    setIsSample(!stored && !!samplePart);
    setRaw(toNFC(words)); // the queue stores NFC; sample words get the same form
    setWordsArrived(true); // the letter fades in once, never word by word (MOTION 5c)
    setPhase('ready');
  }, [phase, draft, job?.phase, job?.outcome]);

  // The calm "could not write it down" card counts as a shown error (error_shown, once per failure).
  useEffect(() => {
    if (job?.phase === 'failed') track('error_shown', { code: 'transcription_failed' });
  }, [job?.phase]);

  // S14: how long the words have been on their way, and since the last sign of progress (a new part or phase).
  // Re-read once a second while they are being written down; "Read it back later", once offered, stays.
  const writingNow = phase === 'transcribing' && (!job || job.phase === 'queued' || job.phase === 'running');
  const shownAt = useRef(Date.now());
  const progressKey = `${job?.phase ?? 'none'}:${job?.progress?.done ?? 0}`;
  const progress = useRef({ key: progressKey, at: Date.now() });
  progress.current = progressClock(progress.current, progressKey, Date.now());
  const laterOffered = useRef(false);
  const [, setWaitTick] = useState(0);
  useEffect(() => {
    if (!writingNow) return;
    const id = setInterval(() => setWaitTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [writingNow]);

  const tryAgain = () => {
    if (!draft) return;
    haptic('tap');
    // retryWords also re-listens to a take where nobody spoke; requestWords joins a job that is already there.
    if (job?.phase === 'failed' || (job?.phase === 'done' && job.outcome === 'no_speech')) retryWords(draft.id);
    else requestWords(draft.id);
  };

  // "Record again": the take stays as a draft, untouched (the only path that deletes audio is a confirmed Discard).
  const recordAgain = () => {
    haptic('tap');
    router.replace({ pathname: '/listen', params: draft?.promptKey ? { promptKey: draft.promptKey } : {} });
  };

  // Mini player for the recording ("Hear it").
  // The web design preview's seeded recordings cannot load in a browser (always false on a phone).
  const player = useAudioPlayer(draft?.audioUri && !isPreviewAudioPresent(draft.audioUri) ? draft.audioUri : null);
  const playStatus = useAudioPlayerStatus(player);
  const togglePlay = async () => {
    if (playStatus.playing) {
      player.pause();
      await setAudioMode('idle');
    } else {
      track('review_action', { action: 'play_back' });
      track('playback_started', { surface: 'review', author_relation: 'self', version: 'original' });
      await setAudioMode('playback');
      if (playStatus.didJustFinish || playStatus.currentTime >= playStatus.duration) player.seekTo(0);
      player.play();
    }
  };
  useEffect(() => {
    if (playStatus.didJustFinish) setAudioMode('idle').catch(() => {});
  }, [playStatus.didJustFinish]);
  useEffect(() => () => void setAudioMode('idle').catch(() => {}), []);

  // Display: the person's words plus edits; a just-restored span is marked as an identity edit.
  // In "Exactly as said" no fix is in force; the fixes themselves stay in `applied`, so the choice is reversible.
  const inForce = useMemo(() => fixesInForce(view, applied), [view, applied]);
  const marker = restored && view === 'fixes' ? applied.length : null;
  const segs = useMemo(() => {
    const all = restored && view === 'fixes' ? [...applied, { ...restored.edit, replacement: restored.edit.original }] : inForce;
    return toSegments(raw, all, typed ? undefined : rules);
  }, [raw, applied, inForce, restored, view, typed, rules]);
  // Typed text keeps the house character rule only (unchanged); spoken text uses its language's final-text rule.
  const cleanedText = useMemo(() => (typed ? normalizeChars(applyEdits(raw, inForce)).trim() : languageFinalText(raw, inForce, rules)), [raw, inForce, typed, rules]);
  const finalText = userText ?? cleanedText;

  const putBack = (index: number) => {
    const edit = applied[index];
    const next = withoutEdit(raw, applied, index, rules);
    haptic('tap');
    reverted.current++;
    track('machine_edit_reverted', { edit_type: edit.type, source: edit.source });
    setApplied(next.applied);
    setRestored({ edit, index });
    setOpenEdit(null);
    setWash(true);
    setTimeout(() => setWash(false), 1600);
  };

  const undoPutBack = () => {
    if (!restored) return;
    haptic('tap');
    reverted.current = Math.max(0, reverted.current - 1);
    const next = [...applied];
    next.splice(restored.index, 0, restored.edit);
    setApplied(next);
    setRestored(null);
  };

  /** The view control. Reversible: nothing is discarded by choosing Exactly as said. */
  const chooseView = (next: ReviewView) => {
    if (next === view) return;
    haptic('tap');
    if (next === 'exact') track('review_action', { action: 'show_exactly_said' });
    setView(next);
    setRestored(null);
    setOpenEdit(null);
    setWash(false);
  };

  const pickChild = () => {
    if (listChildren().length < 2 || !draft) return;
    haptic('tap');
    setPickerOpen(true);
  };
  const chooseChild = (id: string) => {
    if (!draft) return;
    track('review_action', { action: 'change_child' });
    setDraftChild(draft.id, id);
    setChildId(id);
  };

  // Save: commit, haptic, then animate (MOTION principle 3). The saved moment (components/capture/saved-moment.tsx)
  // files the letter into its month and then lands on the Book (S21, 5.8 row 5).
  // After the very first letter on this phone, someone signed out is offered an account (PRD A F3): the sign-in
  // sheet rises over the Book once the letter is seen in its place, never in place of Review (5.8 row 5b), and
  // "Not now" always works (the app is local-first).
  const auth = useAuth();
  const offerSignIn = useRef(false);
  const left = useRef(false);
  const land = () => {
    if (left.current || !draft || !child) return; // the timer and a tap must not both navigate
    left.current = true;
    // The Book, on the book the letter was kept in (Review can move a draft to another book), on the new letter:
    // one navigation selects the Book tab under Review and Review dissolves away over it, so Tonight is never seen
    // between them. The Book reads and clears `arrived` (P5); `secondFree` asks it for the second-free toast (D-082).
    setActiveChildId(child.id);
    router.navigate({ pathname: '/book', params: arrivalParams({ entryId: draft.id, secondFree }) });
    if (offerSignIn.current) {
      setTimeout(() => router.push({ pathname: '/sign-in', params: { trigger: 'first_letter' } }), signInAfterLandingMs(motion.reduced));
    }
  };
  const finishSave = (inBook: boolean, firstLetter: boolean) => {
    offerSignIn.current = firstLetter && auth.configured && auth.state.status === 'signedOut';
    haptic('success');
    setSavedTo(inBook ? 'book' : 'private');
    setPhase('saved');
  };

  // Development profile only (Expo Go has no StoreKit): lets the founder pass the sheet.
  const devPass = useRef(false);
  /** True when the Keep sheet opened instead: the caller returns without saving. Never throws. */
  const keepNeedsPlus = async (): Promise<boolean> => {
    if (devPass.current) return false;
    const g = await keepLetterGate();
    if (g.decision.kind === 'allow') return false;
    track('keep_gate_shown', {
      letters_kept: Math.min(1000, g.lettersKept),
      allowance: Math.min(100, Math.max(2, g.allowance)),
      lapsed: g.decision.lapsed ? 1 : 0,
    });
    setGate(g);
    return true;
  };

  /** After the letter is saved: copy the count to the Keychain, and note the moment the free letters are used. */
  const noteKept = async () => {
    const kept = await afterLetterKept();
    const allowance = freeLettersAllowance();
    if (!hasPlus() && kept === allowance) {
      track('free_allowance_reached', { allowance: Math.min(100, allowance) });
      if (allowance === 2) setSecondFree(true);
    }
  };

  const saving = useRef(false);
  const save = async (inBook: boolean) => {
    if (!draft || !child || saving.current || isSample) return; // sample words are never saved
    saving.current = true;
    player.pause();
    setSaveFailed(false);
    try {
      const audio = await ensureAudioHash(draft);
      if (await keepNeedsPlus()) {
        saving.current = false; // held: the draft is untouched
        return;
      }
      const firstLetter = !hasAnyLetter();
      saveLetterFromDraft(
        draft.id,
        {
          id: draft.id,
          kind: 'letter',
          occurredOn: draft.createdAt ? todayISO(new Date(draft.createdAt)) : todayISO(),
          capturedAt: draft.createdAt,
          captureMode,
          editLevel: view === 'exact' ? 'verbatim' : level,
          promptKey: draft.promptKey,
          engineVersion: ENGINE_VERSION,
          rawTranscript: raw,
          machineEdits: inForce,
          finalText,
          inBook,
          soundsLikeMe: null, // "Does this sound like you?" is not asked in v1.0 (D-086); the field stays null
          childId: child.id,
          authorSignsAs: child.signsAs,
          audioUri: draft.audioUri,
          audioDurationMs: draft.audioDurationMs,
          audioSha256: audio.sha256,
          audioBytes: audio.bytes,
        },
        audio.exists,
      );
      trackLetterSaved({
        mode: typed ? 'typed' : 'spoken',
        inBook,
        childIndex: childIndexOf(child.id),
        role: 'parent',
        promptKind: promptKindOf(draft.promptKey),
        audioMs: draft.audioDurationMs,
        wordCount: wordCountOf(finalText),
        machineEdits: inForce.length,
        editsReverted: reverted.current + setAsideAtSave(view, applied),
        editsRejected: typed ? undefined : rejected.current.length,
        engine: typed ? 'none' : 'on_device',
        fromNotificationWithin2h: fromReminderWithin2h(),
      });
      if (!typed && rejected.current.length > 0) trackMachineEditsRejected(rejected.current);
      await noteKept();
      finishSave(inBook, firstLetter);
    } catch {
      saving.current = false;
      track('error_shown', { code: 'save_failed' });
      setSaveFailed(true); // the draft is intact; nothing was half-saved
    }
  };

  /** Keep the recording as a letter waiting for its words (private until the parent adds it). */
  const keepRecordingOnly = async () => {
    if (!draft || !child || saving.current) return;
    saving.current = true;
    player.pause();
    setSaveFailed(false);
    try {
      const audio = await ensureAudioHash(draft);
      if (await keepNeedsPlus()) {
        saving.current = false; // held: the draft is untouched
        return;
      }
      const firstLetter = !hasAnyLetter();
      const fresh = getDraft(draft.id) ?? draft;
      saveVoiceOnlyFromDraft(
        { ...fresh, audioSha256: audio.sha256, audioBytes: audio.bytes },
        { childId: child.id, authorSignsAs: child.signsAs, inBook: false, engineVersion: ENGINE_VERSION, audioExists: audio.exists },
      );
      trackLetterSaved({
        mode: 'spoken',
        inBook: false,
        childIndex: childIndexOf(child.id),
        role: 'parent',
        promptKind: promptKindOf(fresh.promptKey),
        audioMs: fresh.audioDurationMs,
        wordCount: 0,
        machineEdits: 0,
        editsReverted: 0,
        engine: 'pending',
        fromNotificationWithin2h: fromReminderWithin2h(),
      });
      setDraft(fresh);
      setKeptForWords(phase === 'transcribing' && job?.outcome !== 'no_speech');
      setVoiceOnly(true);
      await noteKept();
      finishSave(false, firstLetter);
    } catch {
      saving.current = false;
      setSaveFailed(true);
    }
  };

  useEffect(() => {
    if (gate || saveFailed) setKeeping(false);
  }, [gate, saveFailed]);

  /** The person's choice of where the letter goes; "Try again" after a failed save keeps it where they chose (S17). */
  const lastDestination = useRef(true);
  const keepTo = (inBook: boolean) => {
    lastDestination.current = inBook;
    void save(inBook);
  };

  // A typed letter keeping from Write (S20, 5.8 row 5a): the person already chose where it goes, so the one Keep step
  // runs at once, with no "Read it back" screen. Only Write's tap arms it, for this draft (lib/capture/keep-intent.ts).
  useEffect(() => {
    const intent = keepIntent.current;
    if (intent && phase === 'ready' && typed) keepTo(intent.inBook);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dismissFirstNote = () => {
    setSetting('review.firstNoteSeen', '1');
    setFirstNote(false);
  };

  if (!draft || !child) {
    // Opened with nothing to read back (a stale link, S23): not an error, nothing to try again. The page drawing,
    // still; one way on to the book; Close in the header.
    return (
      <StateScreen
        kind="notFound"
        title={r.noDraft.title}
        header={<ModalHeader onClose={() => (router.canGoBack() ? router.back() : router.replace('/'))} />}
        primary={{ label: r.noDraft.button, onPress: () => router.navigate('/book'), testID: 'review.noDraft.book' }}
      />
    );
  }

  const line = countLine({ view, applied: applied.length, proposed, hasFixRules: spokenEditLevel(language) === 'clean' });
  const countText =
    line === 'count'
      ? plural(applied.length, pendingCopy.review.changesLabelOne, fill(r.changesLabel, { count: applied.length }))
      : line === 'afterUndo'
        ? r.noChangesAfterUndo
        : line === 'none'
          ? r.noChanges
          : r.noChangesNoRules; // 'noRules', and 'exact' (Exactly as said: the words are untouched)

  // The letter sheet's header (S17): the month it files into, from the day it was said.
  const occurredOn = draft.createdAt ? todayISO(new Date(draft.createdAt)) : todayISO();
  const month = monthFor(child, occurredOn);
  const header = letterHeader({ childName: child.name, signsAs: child.signsAs, month });
  const openE = openEdit !== null ? applied[openEdit] : null;
  const many = listChildren().length > 1;

  // Review before the words are there (S14 to S16): one card, one primary, at most one quiet action.
  const ask = job?.phase === 'waiting_for_pack' ? speechAskFor(language) : null;
  const hints = waitingHints({ elapsedMs: Date.now() - shownAt.current, sinceProgressMs: Date.now() - progress.current.at, laterOffered: laterOffered.current });
  // An unrecoverable take is empty only with no bytes (Tonight's rule); with bytes it is a kept recording the phone
  // could not open (the launch sweep's unplayable take), never "Nothing was recorded".
  const file = takeFile(draft);
  if (writingNow && hints.later) laterOffered.current = true;
  const card =
    phase === 'transcribing' || phase === 'waiting'
      ? wordsCard({
          emptyFile: file === 'empty',
          unreadable: file === 'unreadable',
          job,
          download: {
            ask: showReviewAsk({ choice: speechDownloadChoice(), progress: download.progress, hold: download.hold }),
            progress: download.progress,
            hold: download.hold,
            lowSpace: ask?.kind === 'low_space',
            // The size comes from this phone's plan, never a typed number (D-087).
            size: ask ? formatBytes(ask.bytes) : '',
            mb: ask ? Math.round(ask.bytes / 1e6) : 0,
            neededSize: ask ? formatBytes(ask.neededBytes) : '',
          },
          hints,
          playing: playStatus.playing,
        })
      : null;
  // No sound to hear: the file is empty or missing (S16), so "Hear it" is not offered.
  const hasSound = spoken && file !== 'empty' && !(job?.phase === 'failed' && job.failure === 'file_missing');
  // "Everything before that is kept." only above a recording that was kept (S16).
  const stopNote = stopLine({ stopped, recoveredAt: draft.recoveredAt, spoken, kept: recordingKept(card) });
  const runWordsAction: Record<WordsAction, () => void> = {
    retry: tryAgain,
    keep: () => void keepRecordingOnly(),
    type: () => router.replace({ pathname: '/write', params: { draftId: draft.id } }),
    // The person writes the words for this recording; the app never fills them in (S16).
    write: () => router.replace({ pathname: '/write', params: { draftId: draft.id } }),
    recordAgain,
    download: () => void startSpeechDownload(language),
    // Cellular data for this download only, on this tap only; the Wi-Fi default stays (D-087).
    cellular: () => void startSpeechDownload(language, { allowCellularOnce: true }),
    // Review closes; the queue carries on, and Tonight shows the recording waiting for its words (S14).
    later: () => (router.canGoBack() ? router.back() : router.replace('/')),
  };

  if (gate && gate.decision.kind === 'offer' && phase !== 'saved') {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <PlusGate
          variant="keep_letter"
          childName={child.name}
          lapsed={gate.decision.lapsed}
          lettersKept={gate.lettersKept}
          onHold={() => {
            track('letter_held', { letters_kept: Math.min(1000, gate.lettersKept) });
            router.back(); // the draft stays: Tonight shows "A letter is waiting"
          }}
          onPlus={() => setGate(null)} // the same Review again; the person taps Keep
          onContinueDev={
            devShortcutsAllowed
              ? () => {
                  devPass.current = true;
                  setGate(null);
                }
              : undefined
          }
        />
      </SafeAreaView>
    );
  }

  // One primary (56 pt), one quiet 44 pt: the footer is about 100 pt, not 130 (QA journey J06-01). While the
  // letter is being edited the footer is just "Done", so the only way out of the most committing task is a primary.
  const footerShell = (children: ReactNode) => (
    <View className={inlineFooter ? 'gap-1 pt-2' : 'gap-1 border-t border-border bg-background px-5 pb-2 pt-3'}>{children}</View>
  );
  // "Add to Asha's book" (primary; "Add to the book" when the name makes it long) and "Keep private" (quiet). A save
  // that did not work keeps the letter, says so directly above the primary, and the primary reads "Try again" (S17).
  const footer =
    phase === 'ready' && !isSample
      ? footerShell(
          editing ? (
            <Button size="lg" fullWidth label={copy.common.doneButton} onPress={() => setEditing(false)} testID="review.edit.done" />
          ) : (
            <>
              {saveFailed && (
                <Text variant="subhead" tone="caution" accessibilityLiveRegion="assertive" className="pb-1 text-center" testID="review.saveFailed">
                  {r.saveFailed}
                </Text>
              )}
              <Button size="lg" fullWidth onPress={() => keepTo(saveFailed ? lastDestination.current : true)} disabled={!finalText.trim()} testID="review.save.book">
                <Text>{savePrimaryLabel({ childName: child.name, saveFailed })}</Text>
              </Button>
              {!saveFailed && (
                <Button variant="quiet" fullWidth onPress={() => keepTo(false)} disabled={!finalText.trim()} testID="review.save.private">
                  <Text>{r.destination.privateButton}</Text>
                </Button>
              )}
            </>
          ),
        )
      : null;
  // Sample words (development builds) are never saved: the footer keeps the recording itself. Every other state that
  // can keep the recording carries "Keep the recording" in its own card (S15, S16), so there is never a second one here.
  const keepFooter =
    spoken && phase === 'ready' && isSample
      ? footerShell(
          <Button size="lg" fullWidth onPress={keepRecordingOnly} testID="review.keepVoice">
            <Text>{pendingCopy.review.voiceOnlyButton}</Text>
          </Button>,
        )
      : null;

  // The saved moment (S21), and, for a typed letter keeping from Write (S20), the same sheet holding still while the
  // one Keep step runs: the moment starts from exactly what the person saw.
  const keepingFromWrite = keeping && phase === 'ready' && !saveFailed && !gate;
  if (phase === 'saved' || keepingFromWrite) {
    const moment = savedMoment({ kind: voiceOnly ? 'voice' : savedTo === 'private' ? 'private' : 'book', childName: child.name, month, keptForWords });
    return (
      <SafeAreaView className="flex-1 bg-background">
        <SavedMoment
          header={header}
          words={voiceOnly ? pendingCopy.book.waitingForWords : finalText}
          chip={moment.chip}
          lock={moment.lock}
          line={moment.line}
          committed={phase === 'saved'}
          onDone={land}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ModalHeader
        onClose={() => router.back()}
        closeHint={pendingCopy.write.savedOnPhone}
        leading={
          editing ? (
            // Done sits in the header while editing (S18), and above the keyboard on iOS.
            <Button variant="quiet" size="sm" className="-ml-4" label={copy.common.doneButton} onPress={() => setEditing(false)} testID="review.edit.doneHeader" />
          ) : hasSound ? (
            <Button variant="quiet" size="sm" className="-ml-4" onPress={togglePlay} accessibilityLabel={playStatus.playing ? copy.common.pauseButton : r.playButton}>
              {playStatus.playing ? <PauseIcon color={c.accent} size={20} weight="fill" /> : <PlayIcon color={c.accent} size={20} />}
              <Text>{playStatus.playing ? copy.common.pauseButton : r.playButton}</Text>
            </Button>
          ) : null
        }
      />

      <ScrollView className="flex-1" contentContainerClassName="gap-5 px-5 pb-6 pt-2" keyboardShouldPersistTaps="handled">
        {/* The title, then the letter on its sheet. No reassurance line: the marks speak for themselves (S17). */}
        <Text variant="title1" asHeading>
          {r.title}
        </Text>

        {isSample && (
          <View className="rounded-2xl border border-caution p-3">
            <Text variant="subhead" tone="caution">
              {pendingCopy.review.sampleBanner}
            </Text>
            <Text variant="subhead" tone="caution">
              {pendingCopy.review.sampleNotSaved}
            </Text>
          </View>
        )}

        {firstNote && phase === 'ready' && (
          <Animated.View entering={motion.enter()} layout={motion.layout()}>
            {/* Compact first-time note; "Got it" collapses it for good (review.firstNoteSeen). */}
            <View className="gap-1 bg-secondary py-3 pl-4 pr-2" style={{ borderRadius: tokens.radius.lg }} testID="review.firstNote">
              <View className="flex-row items-center justify-between gap-2">
                <Text variant="headline" className="flex-1">
                  {r.firstNote.title}
                </Text>
                <Button variant="quiet" size="sm" label={r.firstNote.dismissButton} onPress={dismissFirstNote} testID="review.firstNote.dismiss" />
              </View>
              <Text variant="subhead" className="pr-2">
                {r.firstNote.body}
              </Text>
            </View>
          </Animated.View>
        )}

        {/* Why the take stopped early (S14): leaving the app, a call or an alert, or the app closing. One honest line. */}
        {stopNote && (
          <Text variant="footnote" tone="muted" accessibilityLiveRegion="polite" testID="review.stopLine">
            {stopNote}
          </Text>
        )}

        {card && (
          // The words are on their way, or they did not come (S14 to S16). The card enters just after Listen dissolves in (5.8 row 4).
          <Animated.View entering={motion.enter(3)}>
            <WordsStatus card={card} size={ask ? formatBytes(ask.bytes) : ''} lengthMs={draft.audioDurationMs} run={runWordsAction} />
          </Animated.View>
        )}

        {/* A keep that did not work before the words were there: the words are safe first (VOICE), then what happened. */}
        {saveFailed && phase !== 'ready' && (
          <Text variant="subhead" tone="caution" accessibilityLiveRegion="assertive">
            {r.saveFailed}
          </Text>
        )}

        {phase === 'ready' && (
          <>
            {/* The letter on its sheet (S17), arriving with one fade when its words have just come (MOTION 5c). */}
            <Animated.View layout={motion.layout()} entering={wordsArrived ? FadeIn.duration(tokens.motion.swapMs) : undefined}>
              <LetterSheet
                header={header}
                editing={editing}
                onChangeBook={many ? pickChild : undefined}
                changeLabel={fill(pendingCopy.review.toChildA11y, { child: child.name })}>
                {editing ? (
                  // Edit in place on the same sheet (S18): no inner box, the caret in the letter face; the sheet's edge
                  // is the accent line. The system draws Full Keyboard Access's own focus ring.
                  <TextField
                    variant="letter"
                    label={pendingCopy.write.label}
                    labelHidden
                    value={finalText}
                    onChangeText={setUserText}
                    multiline
                    autoFocus
                    inputClassName="min-h-40"
                    inputAccessoryViewID={Platform.OS === 'ios' ? EDIT_ACCESSORY_ID : undefined}
                    testID="review.editField"
                  />
                ) : userText !== null ? (
                  <Text variant="letterBody" selectable>
                    {userText}
                  </Text>
                ) : (
                  <Transcript
                    segments={segs}
                    edits={view === 'fixes' ? applied : undefined}
                    openEdit={openEdit}
                    restoredIndex={wash ? marker : null}
                    onPressEdit={(i) => {
                      if (i >= applied.length) return;
                      haptic('tap');
                      setOpenEdit(openEdit === i ? null : i);
                    }}
                  />
                )}

                {openE && view === 'fixes' && userText === null && (
                  <Animated.View entering={FadeIn.delay(80).duration(160)} className="gap-2 rounded-2xl bg-muted p-4" testID="review.card">
                    <Text variant="labelSmall">{labelOf(openE).label}</Text>
                    <Text variant="subhead">{labelOf(openE).explain}</Text>
                    {/* You said / Now it reads: before and after, in the parent's own words (D-086). */}
                    {openE.original.trim() !== '' && (
                      <>
                        <Text variant="footnote">{r.cardYouSaid}</Text>
                        <Text className="font-serif text-lg text-foreground">"{openE.original.trim()}"</Text>
                      </>
                    )}
                    {openE.replacement.trim() !== '' ? (
                      <>
                        <Text variant="footnote">{r.cardNowReads}</Text>
                        <Text className="font-serif text-lg text-foreground">"{openE.replacement.trim()}"</Text>
                      </>
                    ) : (
                      <Text variant="footnote">{r.cardTakenOut}</Text>
                    )}
                    <ButtonRow>
                      <Button size="sm" onPress={() => putBack(openEdit!)} testID="review.card.putBack">
                        <Text>{r.undoEditButton}</Text>
                      </Button>
                      <Button size="sm" variant="quiet" onPress={() => setOpenEdit(null)}>
                        <Text tone="muted">{copy.common.closeButton}</Text>
                      </Button>
                    </ButtonRow>
                  </Animated.View>
                )}

                {restored && (
                  <View className="flex-row flex-wrap items-center gap-x-2" accessibilityLiveRegion="polite">
                    <Text variant="subhead" tone="muted">{pendingCopy.review.putBack}</Text>
                    <Button size="sm" variant="quiet" onPress={undoPutBack}>
                      <Text>{copy.common.undoButton}</Text>
                    </Button>
                    <Button size="sm" variant="quiet" onPress={() => setRestored(null)}>
                      <Text tone="muted">{copy.common.closeButton}</Text>
                    </Button>
                  </View>
                )}
              </LetterSheet>
            </Animated.View>

            {!typed && userText === null && !editing && (
              <View className="gap-3">
                {/* One control, both the view and the choice for this letter. Reversible until save. */}
                {showViewControl(proposed) && <ViewControl view={view} onChange={chooseView} />}
                {line === 'count' ? (
                  // "2 small fixes": one disclosure row; the rows fold behind it, since every mark is tappable in the letter (S17).
                  <Pressable
                    onPress={() => {
                      haptic('tap');
                      setFixesOpen((o) => !o);
                    }}
                    accessibilityRole="button"
                    accessibilityState={{ expanded: fixesOpen }}
                    accessibilityLiveRegion="polite"
                    className="min-h-12 flex-row items-center justify-between gap-3"
                    testID="review.count">
                    <Text variant="subhead">{countText}</Text>
                    {fixesOpen ? <CaretDownIcon size={16} color={c.textMuted} weight="bold" /> : <CaretRightIcon size={16} color={c.textMuted} weight="bold" />}
                  </Pressable>
                ) : (
                  <Text variant="subhead" testID="review.count" accessibilityLiveRegion="polite">
                    {countText}
                  </Text>
                )}
                {/* Every fix as a row: the VoiceOver path to the marks (COMPONENTS 2.19). */}
                {view === 'fixes' && applied.length > 0 && fixesOpen && (
                  <View>
                    {applied.map((e, i) => (
                      <FixRow
                        key={`${e.start}-${e.type}`}
                        label={labelOf(e).label}
                        shows={rowShows(e)}
                        open={openEdit === i}
                        onPress={() => {
                          haptic('tap');
                          setOpenEdit(openEdit === i ? null : i);
                        }}
                      />
                    ))}
                  </View>
                )}
              </View>
            )}

            {!isSample && !editing && (
              <Button
                variant="quiet"
                size="sm"
                className="-ml-4 self-start"
                testID="review.edit"
                onPress={() => {
                  track('review_action', { action: 'edit_text' });
                  setEditing(true);
                }}>
                <Text>{pendingCopy.review.editTextButton}</Text>
              </Button>
            )}

            {/* Dynamic Type at accessibility sizes: the actions scroll with the letter instead of pinning over it. */}
            {inlineFooter ? footer : null}
          </>
        )}
        {inlineFooter ? keepFooter : null}
      </ScrollView>

      {/* Save is always on screen, in the thumb zone (DESIGN_LANGUAGE 1.2): a sticky footer, never at the end of a scroll.
          At accessibility text sizes it moves into the scroll instead, so the letter keeps the screen. */}
      {!inlineFooter && footer}
      {!inlineFooter && keepFooter}

      {/* Done above the keyboard while editing (S18, iOS). */}
      {Platform.OS === 'ios' && (
        <InputAccessoryView nativeID={EDIT_ACCESSORY_ID}>
          <View className="flex-row justify-end border-t border-border bg-background px-5 py-1">
            <Button variant="quiet" size="sm" label={copy.common.doneButton} onPress={() => setEditing(false)} testID="review.edit.doneAccessory" />
          </View>
        </InputAccessoryView>
      )}

      <WhoseBookSheet
        visible={pickerOpen}
        books={listChildren()}
        selectedId={child.id}
        onSelect={chooseChild}
        onClose={() => setPickerOpen(false)}
      />
    </SafeAreaView>
  );
}

/**
 * "With small fixes | Exactly as said" (COMPONENTS 2.19, D-086 5.4). Full width under the card, 44 pt tall, pill
 * shaped. Selected: accentSoft fill, accent edge (stroke.selected) and a check, so it never relies on colour alone.
 */
function ViewControl({ view, onChange }: { view: ReviewView; onChange: (v: ReviewView) => void }) {
  const { c } = useTheme();
  const r = copy.review;
  const options: { value: ReviewView; label: string }[] = [
    { value: 'fixes', label: r.view.fixes },
    { value: 'exact', label: r.view.exact },
  ];
  return (
    <View className="flex-row gap-2" accessibilityRole="radiogroup" accessibilityLabel={r.view.a11y} testID="review.view">
      {options.map((o) => {
        const selected = view === o.value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected, checked: selected }}
            accessibilityLabel={o.label}
            testID={`review.view.${o.value}`}
            className="min-h-11 flex-1 flex-row items-center justify-center gap-1.5 px-3 py-2"
            style={{
              borderRadius: tokens.radius.pill,
              backgroundColor: selected ? c.accentSoft : 'transparent',
              borderWidth: selected ? tokens.stroke.selected : tokens.stroke.control,
              borderColor: selected ? c.accent : c.controlBorder,
            }}>
            {selected && <CheckIcon size={16} color={c.accent} weight="bold" />}
            <Text variant="labelSmall" numberOfLines={2} style={{ textAlign: 'center' }}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** One fix as a row: what happened, then what it was. 48 pt tall, a chevron, the VoiceOver path to the marks. */
function FixRow({ label, shows, open, onPress }: { label: string; shows: ReturnType<typeof rowShows>; open: boolean; onPress: () => void }) {
  const { c } = useTheme();
  const detail =
    shows.kind === 'change' ? fill(copy.review.rowChange, { a: shows.from, b: shows.to }) : shows.kind === 'mark' ? '' : shows.text;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={detail ? `${label}, ${detail}` : label}
      accessibilityHint={pendingCopy.review.editA11yHint}
      accessibilityState={{ expanded: open }}
      testID="review.fixRow"
      className="min-h-12 flex-row items-center gap-3 py-1">
      <Text variant="labelSmall">{label}</Text>
      <Text
        variant="footnote"
        className="flex-1"
        numberOfLines={1}
        style={shows.kind === 'struck' ? { textDecorationLine: 'line-through' } : undefined}>
        {detail}
      </Text>
      <CaretRightIcon size={16} color={c.textMuted} weight="bold" />
    </Pressable>
  );
}

/** Where each action's testID comes from (e2e flows and journey steps read them). */
const WORDS_TEST_ID: Record<WordsAction, string> = {
  retry: 'review.retry',
  keep: 'review.keepVoice',
  type: 'review.type',
  write: 'review.write',
  recordAgain: 'review.recordAgain',
  download: 'review.getReady',
  cellular: 'review.mobileData',
  later: 'review.later',
};

/**
 * Review before the words are there (S14 to S16), one calm card: no spinner, real numbers only. While the words are
 * written down the moon breathes (still while "Hear it" plays) over the recording's length; every other state holds
 * its drawing still. One primary, at most one quiet action (components/capture/words-state.logic.ts).
 */
function WordsStatus({ card, size, lengthMs, run }: { card: WordsCard; size: string; lengthMs: number | null; run: Record<WordsAction, () => void> }) {
  const action = (a: WordsAction | null) => (a ? { label: wordsActionLabel(a, size), onPress: run[a], testID: WORDS_TEST_ID[a] } : undefined);
  const primary = action(card.primary);
  const quiet = action(card.quiet);
  const length = card.state === 'writing' ? clockOf(lengthMs) : null;
  return (
    <InlineState
      kind={card.kind}
      art={card.art}
      still={card.still}
      title={card.title}
      body={card.body}
      primary={primary}
      quiet={quiet ? [quiet] : undefined}>
      {length && (
        <Text variant="footnote" style={{ fontVariant: ['tabular-nums'] }} accessibilityLabel={lengthA11y(lengthMs) ?? undefined}>
          {length}
        </Text>
      )}
      {card.note && <Text variant="footnote">{card.note}</Text>}
      {card.bar !== undefined && <ProgressLine value={card.bar} />}
    </InlineState>
  );
}

/** A thin, determinate line: progress the parent can trust. */
function ProgressLine({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, Math.round(value * 100)));
  return (
    <View
      className="h-1 w-full overflow-hidden rounded-full bg-muted"
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: pct }}>
      <View className="h-1 rounded-full bg-primary" style={{ width: `${pct}%` }} />
    </View>
  );
}
