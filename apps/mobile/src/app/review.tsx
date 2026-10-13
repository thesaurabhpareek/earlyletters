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
import { CaretRightIcon } from 'phosphor-react-native/src/icons/CaretRight';
import { CheckIcon } from 'phosphor-react-native/src/icons/Check';
import { PauseIcon } from 'phosphor-react-native/src/icons/Pause';
import { PlayIcon } from 'phosphor-react-native/src/icons/Play';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import Animated, { FadeIn, LinearTransition, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
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
import { Transcript } from '@/components/capture/transcript';
import {
  DEFAULT_VIEW_SETTING,
  countLine,
  fixesInForce,
  rowShows,
  setAsideAtSave,
  showViewControl,
  viewFromSetting,
  type ReviewView,
} from '@/components/capture/review-view.logic';
import { isPreviewAudioPresent } from '@/dev/preview-audio';
import { PlusGate } from '@/components/child/plus-gate';
import { WhoseBookSheet } from '@/components/child/whose-book-sheet';
import { Button, ButtonRow } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TextField } from '@/components/ui/text-field';
import { SafeAreaView } from '@/components/ui/safe-area-view';
import { ModalHeader } from '@/components/ui/screen-header';
import { InlineState, StateScreen } from '@/components/ui/state-screen';
import { Text } from '@/components/ui/text';
import { childIndexOf, fromReminderWithin2h, promptKindOf, track, trackLetterSaved, trackMachineEditsRejected, wordCountOf } from '@/lib/analytics/track';
import { setAudioMode } from '@/lib/audio-mode';
import { ensureAudioHash } from '@/lib/capture/recorder';
import { copy, fill, pendingCopy, plural } from '@/lib/copy';
import { ageText } from '@/lib/dates';
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
  setDraftChild,
  setSetting,
  todayISO,
  type Draft,
} from '@/lib/store';
import { languageFor, requestSpeechFor, requestWords, retryWords, sampleWordsFor, spokenFor, type Job } from '@/lib/transcription-queue';
import { cleanSpoken, spokenEditLevel } from '@/lib/transcription-queue/clean';
import { languageNames, wordsCopy } from '@/lib/transcription-queue/copy';
import type { SpeechLanguage } from '@/lib/models/catalog';
import { planFor } from '@/lib/models/speech-packs';
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

/** Any letter on this phone yet, in any book (hidden books count). */
function hasAnyLetter(): boolean {
  return [...listChildren(), ...listHiddenChildren()].some((c) => listEntriesForChild(c.id).length > 0);
}

/**
 * transcribing: words for this recording are on their way (queued, being written down, waiting for the
 * language download, failed or nobody spoke: WordsStatus shows which). waiting: the file is empty.
 */
type Phase = 'transcribing' | 'ready' | 'waiting' | 'saved';

export default function Review() {
  const c = useTheme().c;
  const inlineFooter = footerPlacement(useIsAccessibilitySize()) === 'inline';
  const r = copy.review;
  const motion = useMotion();
  const { draftId } = useLocalSearchParams<{ draftId: string }>();
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
  const [fieldFocused, setFieldFocused] = useState(false);
  const [userText, setUserText] = useState<string | null>(null);
  const [savedTo, setSavedTo] = useState<'book' | 'private' | null>(null);
  const [firstNote, setFirstNote] = useState(() => !typed && getSetting('review.firstNoteSeen') !== '1');

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
    setPhase('ready');
  }, [phase, draft, job?.phase, job?.outcome]);

  // The calm "could not write it down" card counts as a shown error (error_shown, once per failure).
  useEffect(() => {
    if (job?.phase === 'failed') track('error_shown', { code: 'transcription_failed' });
  }, [job?.phase]);

  const packWait = job?.phase === 'waiting_for_pack';
  const canKeepVoice = packWait || job?.phase === 'failed' || (job?.phase === 'done' && job.outcome === 'no_speech');

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

  // Save: commit, haptic, then animate (MOTION principle 3).
  const settle = useSharedValue(1);
  const settleStyle = useAnimatedStyle(() => ({ transform: [{ scale: 0.9 + 0.1 * settle.value }], opacity: settle.value }));
  // After the very first letter on this phone, someone signed out is offered an account (PRD A F3):
  // the sign-in sheet replaces Review, and "Not now" always works (the app is local-first).
  const auth = useAuth();
  const offerSignIn = useRef(false);
  const left = useRef(false);
  const leave = () => {
    if (left.current) return; // the timer and a tap must not both navigate
    left.current = true;
    if (offerSignIn.current) router.replace({ pathname: '/sign-in', params: { trigger: 'first_letter' } });
    else router.back();
  };
  const finishSave = (inBook: boolean, firstLetter: boolean) => {
    offerSignIn.current = firstLetter && auth.configured && auth.state.status === 'signedOut';
    haptic('success');
    setSavedTo(inBook ? 'book' : 'private');
    setPhase('saved');
    settle.value = motion.spring(0, 'gentle');
    setTimeout(leave, 900); // sequenceMaxMs; a tap skips it
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

  const dismissFirstNote = () => {
    setSetting('review.firstNoteSeen', '1');
    setFirstNote(false);
  };

  if (!draft || !child) {
    // The one state pattern (ui/state-screen); a modal, so Close is the header's, top right.
    return (
      <StateScreen
        kind="error"
        title={copy.errors.generic.title}
        body={copy.errors.generic.body}
        header={<ModalHeader onClose={() => router.back()} />}
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

  const age = ageText(child, todayISO());
  const dateline = age ? `${child.name} · ${age}` : child.name;
  const openE = openEdit !== null ? applied[openEdit] : null;
  const many = listChildren().length > 1;

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
  const footer =
    phase === 'ready' && !isSample
      ? footerShell(
          editing ? (
            <Button size="lg" fullWidth label={copy.common.doneButton} onPress={() => setEditing(false)} testID="review.edit.done" />
          ) : (
            <>
              <Button size="lg" fullWidth onPress={() => save(true)} disabled={!finalText.trim()} accessibilityHint={r.destination.title} testID="review.save.book">
                <Text>{fill(r.destination.addButton, { child: child.name })}</Text>
              </Button>
              <Button variant="quiet" fullWidth onPress={() => save(false)} disabled={!finalText.trim()} testID="review.save.private">
                <Text>{r.destination.privateButton}</Text>
              </Button>
            </>
          ),
        )
      : null;
  // No words to save yet (language still downloading, nobody spoke, a failure) or only sample words: keep the recording itself.
  const keepFooter =
    spoken && (phase === 'waiting' || (phase === 'ready' && isSample) || (phase === 'transcribing' && canKeepVoice))
      ? footerShell(
          <Button size="lg" fullWidth onPress={keepRecordingOnly} accessibilityHint={r.destination.privateHelp} testID="review.keepVoice">
            <Text>{packWait ? wordsCopy.pack.keepButton : pendingCopy.review.voiceOnlyButton}</Text>
          </Button>,
        )
      : null;

  if (phase === 'saved') {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background px-5">
        <Pressable onPress={leave} className="w-full" accessibilityRole="button" accessibilityLabel={copy.common.doneButton}>
          <Animated.View style={settleStyle}>
            <Card className="rounded-3xl border-0 bg-card p-6">
              <Text variant="letterBody" numberOfLines={4}>
                {voiceOnly ? pendingCopy.book.waitingForWords : finalText}
              </Text>
            </Card>
          </Animated.View>
          <Animated.View entering={FadeIn.delay(250).duration(200)} className="mt-6 items-center" accessibilityLiveRegion="polite">
            <Text variant="callout" tone="success">
              {voiceOnly
                ? keptForWords
                  ? wordsCopy.pack.keptToast
                  : pendingCopy.review.voiceOnlyToast
                : savedTo === 'book'
                  ? fill(r.destination.addedToast, { child: child.name })
                  : r.destination.privateToast}
            </Text>
            {secondFree && <Text className="mt-1 text-base text-muted-foreground">{billingCopy.keepGate.secondFreeNote}</Text>}
          </Animated.View>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ModalHeader
        onClose={() => router.back()}
        closeHint={pendingCopy.write.savedOnPhone}
        leading={
          spoken ? (
            <Button variant="quiet" size="sm" className="-ml-4" onPress={togglePlay} accessibilityLabel={playStatus.playing ? copy.common.pauseButton : r.playButton}>
              {playStatus.playing ? <PauseIcon color={c.accent} size={20} weight="fill" /> : <PlayIcon color={c.accent} size={20} />}
              <Text>{playStatus.playing ? copy.common.pauseButton : r.playButton}</Text>
            </Button>
          ) : null
        }
      />

      <ScrollView className="flex-1" contentContainerClassName="gap-5 px-5 pb-6 pt-2" keyboardShouldPersistTaps="handled">
        <View className="gap-1">
          <Pressable
            onPress={pickChild}
            disabled={!many}
            accessibilityRole={many ? 'button' : 'text'}
            accessibilityLabel={many ? fill(pendingCopy.review.toChildA11y, { child: child.name }) : undefined}
            className="min-h-11 justify-center">
            <Text variant="caption" caps tone="muted" style={{ letterSpacing: 1 }}>
              {dateline}
            </Text>
          </Pressable>
          <Text variant="title1" asHeading>
            {r.title}
          </Text>
          {!typed && phase === 'ready' && (
            <Text variant="subhead" tone="default" testID="review.trustLine">
              {r.trustLine}
            </Text>
          )}
        </View>

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
          <Animated.View entering={motion.enter()} layout={LinearTransition.springify().damping(30)}>
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

        {phase === 'transcribing' && (
          <WordsStatus
            job={job}
            download={download}
            language={language}
            languageName={languageNames[language]}
            onRetry={tryAgain}
            onRecordAgain={recordAgain}
            onGetReady={() => void requestSpeechFor(language)}
            onType={() => router.replace({ pathname: '/write', params: { draftId: draft.id } })}
          />
        )}

        {phase === 'waiting' && (
          // The recording file is empty (a take cut off before any audio): nothing to write down.
          <InlineState
            kind="error"
            title={copy.errors.transcriptionFailed.title}
            body={copy.errors.transcriptionFailed.body}
            primary={{ label: copy.errors.micDenied.typeButton, onPress: () => router.replace({ pathname: '/write', params: { draftId: draft.id } }) }}
          />
        )}

        {saveFailed && (
          <Text variant="subhead" tone="caution" accessibilityLiveRegion="assertive">
            {copy.errors.generic.body}
          </Text>
        )}

        {phase === 'ready' && (
          <>
            <Animated.View layout={LinearTransition.springify().damping(30)}>
              <Card className="gap-4 rounded-3xl border-0 bg-card p-5">
                {editing ? (
                  // The letter face inside the design system's focus ring (2 pt, offset 2, radius sm), never a bare TextInput (D-086 5.4).
                  <View
                    style={{
                      borderRadius: tokens.radius.sm,
                      borderWidth: tokens.focusRing.width,
                      borderColor: fieldFocused ? c.focus : 'transparent',
                      padding: tokens.focusRing.offset,
                    }}>
                    <TextField
                      variant="letter"
                      label={pendingCopy.write.label}
                      labelHidden
                      value={finalText}
                      onChangeText={setUserText}
                      onFocus={() => setFieldFocused(true)}
                      onBlur={() => setFieldFocused(false)}
                      multiline
                      autoFocus
                      inputClassName="min-h-40"
                      testID="review.editField"
                    />
                  </View>
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
              </Card>
            </Animated.View>

            {!typed && userText === null && !editing && (
              <View className="gap-3">
                {/* One control, both the view and the choice for this letter. Reversible until save. */}
                {showViewControl(proposed) && <ViewControl view={view} onChange={chooseView} />}
                <Text variant="subhead" testID="review.count" accessibilityLiveRegion="polite">
                  {countText}
                </Text>
                {/* Every fix as a row: the VoiceOver path to the marks (COMPONENTS 2.19). */}
                {view === 'fixes' && applied.length > 0 && (
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

            <Text variant="subhead" tone="muted">{r.destination.privateHelp}</Text>
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

/** Calm, honest status while words are on their way (no spinner, real numbers only). */
function WordsStatus({
  job,
  download,
  language,
  languageName,
  onRetry,
  onRecordAgain,
  onGetReady,
  onType,
}: {
  job: Job | null;
  download: { progress: number | null; hold: 'waiting_for_wifi' | 'no_space' | 'offline' | null };
  language: SpeechLanguage;
  languageName: string;
  onRetry: () => void;
  onRecordAgain: () => void;
  onGetReady: () => void;
  onType: () => void;
}) {
  const type = { label: copy.errors.micDenied.typeButton, onPress: onType, testID: 'review.type' };

  if (job?.phase === 'failed') {
    const canRetry = job.failure !== 'file_missing' && job.failure !== 'unsupported';
    return (
      <InlineState
        kind="error"
        title={copy.errors.transcriptionFailed.title}
        body={copy.errors.transcriptionFailed.body}
        primary={canRetry ? { label: copy.errors.transcriptionFailed.button, onPress: onRetry, testID: 'review.retry' } : type}
        quiet={canRetry ? [type] : undefined}
      />
    );
  }

  if (job?.phase === 'done' && job.outcome === 'no_speech') {
    return (
      <InlineState
        kind="empty"
        title={wordsCopy.noSpeech.title}
        body={wordsCopy.noSpeech.body}
        primary={{ label: wordsCopy.noSpeech.tryAgainButton, onPress: onRetry, testID: 'review.retry' }}
        quiet={[{ label: wordsCopy.noSpeech.recordAgainButton, onPress: onRecordAgain, testID: 'review.recordAgain' }, type]}
      />
    );
  }

  if (job?.phase === 'waiting_for_pack') {
    const p = download.progress;
    const line =
      download.hold === 'waiting_for_wifi'
        ? wordsCopy.pack.waitingForWifi
        : download.hold === 'no_space'
          ? wordsCopy.pack.noSpace
          : p !== null
            ? fill(wordsCopy.pack.progress, { n: Math.floor(p * 100) })
            : null;
    return (
      <InlineState
        kind="loading"
        title={fill(wordsCopy.pack.title, { name: languageName })}
        body={fill(wordsCopy.pack.body, { name: languageName })}
        primary={
          p === null
            ? // Not started yet (or waiting on Wi-Fi or space): one way to start it now, then the way out.
              { label: wordsCopy.waiting.readyButton, onPress: onGetReady, testID: 'review.getReady' }
            : { label: wordsCopy.pack.typeButton, onPress: onType, testID: 'review.type' }
        }
        quiet={p === null ? [{ label: wordsCopy.pack.typeButton, onPress: onType, testID: 'review.type' }] : undefined}>
        {line && <Text variant="subhead" tone="muted">{line}</Text>}
        {p === null && <Text variant="subhead" tone="muted">{fill(wordsCopy.pack.sizeLine, { size: Math.round(planFor([language]).bytes / 1e6) })}</Text>}
        {p !== null && download.hold === null && <ProgressLine value={p} />}
      </InlineState>
    );
  }

  const total = job?.phase === 'running' ? (job.progress?.total ?? 0) : 0;
  const done = job?.progress?.done ?? 0;
  const part = Math.min(total, done + 1);
  const line = total > 1 ? fill(wordsCopy.listening, { n: part, count: total }) : wordsCopy.preparing;
  return (
    <InlineState
      kind="loading"
      title={line}
      accessibilityLabel={total > 1 ? fill(wordsCopy.listeningA11y, { n: part, count: total }) : wordsCopy.preparing}>
      {total > 1 && <ProgressLine value={done / total} />}
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
