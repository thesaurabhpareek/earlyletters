/**
 * Review (DESIGN_LANGUAGE 12, COMPONENTS 2.19, MOTION 5d and 5e).
 *
 * Shows what was said with every machine edit quietly underlined. Each edit
 * explains itself in plain words and can be put back (withoutEdit). The raw
 * transcript is set once on the draft and never changed. Saving writes the
 * entry locally first, then the success haptic, then the settle animation.
 *
 * Save is one transaction (DATA-REQ-048): the audio is hashed first, then
 * the letter is inserted and the draft removed together. When words are not
 * available (no transcriber, model not ready, failure) the parent can keep
 * the recording as a letter waiting for its words (TDD 03 FM-9). Sample
 * words (development builds) are never saved as a transcript.
 */
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { router, useLocalSearchParams } from 'expo-router';
import { PauseIcon, PlayIcon } from 'phosphor-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, TextInput, View, useColorScheme } from 'react-native';
import Animated, { FadeIn, LinearTransition, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import {
  ENGINE_VERSION,
  applyEdits,
  faithfulClean,
  normalizeChars,
  segments as toSegments,
  withoutEdit,
  type Edit,
  type EditLevel,
  type EditType,
} from '@scribe/core';
import { tokens } from '@scribe/design-tokens';
import { Transcript } from '@/components/capture/transcript';
import { WhoseBookSheet } from '@/components/child/whose-book-sheet';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SafeAreaView } from '@/components/ui/safe-area-view';
import { Text } from '@/components/ui/text';
import { setAudioMode } from '@/lib/audio-mode';
import { ensureAudioHash } from '@/lib/capture/recorder';
import { copy, fill, pendingCopy, plural } from '@/lib/copy';
import { ageText } from '@/lib/dates';
import { haptic } from '@/lib/haptics';
import { useMotion } from '@/lib/motion';
import {
  dictionaryFor,
  getChild,
  getDraft,
  getSetting,
  listChildren,
  saveLetterFromDraft,
  saveVoiceOnlyFromDraft,
  setDraftChild,
  setDraftTranscript,
  setSetting,
  todayISO,
  type Draft,
} from '@/lib/store';
import { getTranscriber, TranscriberUnavailable } from '@/lib/transcribe';

const EDIT_COPY: Record<EditType, keyof typeof copy.review.edits> = {
  filler: 'filler',
  false_start: 'falseStart',
  repeat: 'repeat',
  stt_fix: 'misheardName',
  punctuation: 'punctuation',
  agreement: 'grammarSlip',
  paragraph: 'paragraph',
};

/** waiting: no words for this recording right now (no transcriber, model not ready, or it failed). */
type Phase = 'transcribing' | 'ready' | 'waiting' | 'saved';

export default function Review() {
  const c = tokens[useColorScheme() === 'dark' ? 'dark' : 'light'];
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
  const [waitReason, setWaitReason] = useState<'unavailable' | 'failed'>(draft?.state === 'unrecoverable' ? 'failed' : 'unavailable');
  const [saveFailed, setSaveFailed] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [voiceOnly, setVoiceOnly] = useState(false);
  const [raw, setRaw] = useState<string>(typed ? draft!.typedText! : (draft?.rawTranscript ?? ''));
  const [isSample, setIsSample] = useState(false);
  const [level, setLevel] = useState<EditLevel>(typed ? 'verbatim' : 'clean');
  const [applied, setApplied] = useState<Edit[]>([]);
  const [openEdit, setOpenEdit] = useState<number | null>(null);
  const [restored, setRestored] = useState<{ edit: Edit; index: number } | null>(null);
  const [wash, setWash] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [editing, setEditing] = useState(false);
  const [userText, setUserText] = useState<string | null>(null);
  const [soundsLikeMe, setSoundsLikeMe] = useState<boolean | null>(null);
  const [savedTo, setSavedTo] = useState<'book' | 'private' | null>(null);
  const [firstNote, setFirstNote] = useState(() => !typed && getSetting('review.firstNoteSeen') !== '1');
  const attempt = useRef(0);

  const dictionary = useMemo(
    () => (child ? dictionaryFor({ childName: child.name, childBirthday: child.birthday, signsAs: child.signsAs }) : []),
    [child?.name, child?.signsAs], // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Clean once per raw transcript: the engine proposes, the verifier decides.
  useEffect(() => {
    if (!raw || typed) return;
    setApplied(faithfulClean(raw, { level: 'clean', dictionary }).applied);
  }, [raw, typed, dictionary]);

  // Transcribe a recording that has no transcript yet.
  const transcribe = async () => {
    if (!draft?.audioUri) return;
    const n = ++attempt.current;
    setPhase('transcribing');
    try {
      const t = await getTranscriber();
      if (!t) throw new TranscriberUnavailable('model-missing');
      const res = await t.transcribe({ audioUri: draft.audioUri, durationMs: draft.audioDurationMs, dictionary });
      if (n !== attempt.current) return;
      if (!t.isSample) setDraftTranscript(draft.id, res.raw); // raw is set once, never changed
      setIsSample(t.isSample);
      setRaw(res.raw);
      setPhase('ready');
    } catch (e) {
      if (n !== attempt.current) return;
      setWaitReason(e instanceof TranscriberUnavailable ? 'unavailable' : 'failed');
      setPhase('waiting');
    }
  };

  useEffect(() => {
    if (phase === 'transcribing') transcribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mini player for the recording ("Hear it").
  const player = useAudioPlayer(draft?.audioUri ?? null);
  const playStatus = useAudioPlayerStatus(player);
  const togglePlay = async () => {
    if (playStatus.playing) {
      player.pause();
      await setAudioMode('idle');
    } else {
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
  const marker = restored ? applied.length : null;
  const segs = useMemo(() => {
    const all = restored ? [...applied, { ...restored.edit, replacement: restored.edit.original }] : applied;
    return toSegments(raw, all);
  }, [raw, applied, restored]);
  const cleanedText = useMemo(() => normalizeChars(applyEdits(raw, applied)).trim(), [raw, applied]);
  const finalText = userText ?? cleanedText;

  const putBack = (index: number) => {
    const edit = applied[index];
    const next = withoutEdit(raw, applied, index);
    haptic('tap');
    setApplied(next.applied);
    setRestored({ edit, index });
    setOpenEdit(null);
    setWash(true);
    setTimeout(() => setWash(false), 1600);
  };

  const undoPutBack = () => {
    if (!restored) return;
    haptic('tap');
    const next = [...applied];
    next.splice(restored.index, 0, restored.edit);
    setApplied(next);
    setRestored(null);
  };

  const wordForWord = () => {
    haptic('tap');
    setApplied([]);
    setRestored(null);
    setOpenEdit(null);
    setLevel('verbatim');
  };

  const pickChild = () => {
    if (listChildren().length < 2 || !draft) return;
    haptic('tap');
    setPickerOpen(true);
  };
  const chooseChild = (id: string) => {
    if (!draft) return;
    setDraftChild(draft.id, id);
    setChildId(id);
  };

  // Save: commit, haptic, then animate (MOTION principle 3).
  const settle = useSharedValue(1);
  const settleStyle = useAnimatedStyle(() => ({ transform: [{ scale: 0.9 + 0.1 * settle.value }], opacity: settle.value }));
  const finishSave = (inBook: boolean) => {
    haptic('success');
    setSavedTo(inBook ? 'book' : 'private');
    setPhase('saved');
    settle.value = motion.spring(0, 'gentle');
    setTimeout(() => router.back(), 900); // sequenceMaxMs; a tap skips it
  };

  const saving = useRef(false);
  const save = async (inBook: boolean) => {
    if (!draft || !child || saving.current || isSample) return; // sample words are never saved
    saving.current = true;
    player.pause();
    setSaveFailed(false);
    try {
      const audio = await ensureAudioHash(draft);
      saveLetterFromDraft(
        draft.id,
        {
          id: draft.id,
          kind: 'letter',
          occurredOn: draft.createdAt ? todayISO(new Date(draft.createdAt)) : todayISO(),
          capturedAt: draft.createdAt,
          captureMode,
          editLevel: level,
          promptKey: draft.promptKey,
          engineVersion: ENGINE_VERSION,
          rawTranscript: raw,
          machineEdits: applied,
          finalText,
          inBook,
          soundsLikeMe,
          childId: child.id,
          authorSignsAs: child.signsAs,
          audioUri: draft.audioUri,
          audioDurationMs: draft.audioDurationMs,
          audioSha256: audio.sha256,
          audioBytes: audio.bytes,
        },
        audio.exists,
      );
      finishSave(inBook);
    } catch {
      saving.current = false;
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
      const fresh = getDraft(draft.id) ?? draft;
      saveVoiceOnlyFromDraft(
        { ...fresh, audioSha256: audio.sha256, audioBytes: audio.bytes },
        { childId: child.id, authorSignsAs: child.signsAs, inBook: false, engineVersion: ENGINE_VERSION, audioExists: audio.exists },
      );
      setDraft(fresh);
      setVoiceOnly(true);
      finishSave(false);
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
    return (
      <SafeAreaView className="flex-1 items-center justify-center gap-4 bg-background px-5">
        <Text className="text-center text-lg text-foreground">{copy.errors.generic.body}</Text>
        <Button onPress={() => router.back()}>
          <Text>{copy.common.closeButton}</Text>
        </Button>
      </SafeAreaView>
    );
  }

  const age = ageText(child, todayISO());
  const dateline = age ? `${child.name} · ${age}` : child.name;
  const openE = openEdit !== null ? applied[openEdit] : null;
  const many = listChildren().length > 1;

  if (phase === 'saved') {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background px-5">
        <Pressable onPress={() => router.back()} className="w-full" accessibilityRole="button" accessibilityLabel={copy.common.doneButton}>
          <Animated.View style={settleStyle}>
            <Card className="rounded-3xl border-0 bg-card p-6">
              <Text className="font-serif text-xl leading-8 text-foreground" numberOfLines={4}>
                {voiceOnly ? pendingCopy.book.waitingForWords : finalText}
              </Text>
            </Card>
          </Animated.View>
          <Animated.View entering={FadeIn.delay(250).duration(200)} className="mt-6 items-center" accessibilityLiveRegion="polite">
            <Text className="text-lg text-success">
              {voiceOnly
                ? pendingCopy.review.voiceOnlyToast
                : savedTo === 'book'
                  ? fill(r.destination.addedToast, { child: child.name })
                  : r.destination.privateToast}
            </Text>
          </Animated.View>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center justify-between px-5 pt-2">
        <Button variant="ghost" size="sm" className="-ml-4" onPress={() => router.back()} accessibilityHint={pendingCopy.write.savedOnPhone}>
          <Text className="text-primary">{copy.common.closeButton}</Text>
        </Button>
        {spoken && (
          <Button variant="ghost" size="sm" className="-mr-4" onPress={togglePlay} accessibilityLabel={playStatus.playing ? copy.common.pauseButton : r.playButton}>
            {playStatus.playing ? <PauseIcon color={c.accent} size={20} weight="fill" /> : <PlayIcon color={c.accent} size={20} />}
            <Text className="text-primary">{playStatus.playing ? copy.common.pauseButton : r.playButton}</Text>
          </Button>
        )}
      </View>

      <ScrollView className="flex-1" contentContainerClassName="gap-5 px-5 pb-6 pt-2" keyboardShouldPersistTaps="handled">
        <View className="gap-1">
          <Pressable
            onPress={pickChild}
            disabled={!many}
            accessibilityRole={many ? 'button' : 'text'}
            accessibilityLabel={many ? fill(pendingCopy.review.toChildA11y, { child: child.name }) : undefined}
            className="min-h-11 justify-center">
            <Text className="text-xs font-medium tracking-[1.5px] text-muted-foreground">{dateline.toUpperCase()}</Text>
          </Pressable>
          <Text role="heading" className="font-serif text-3xl leading-10 text-foreground">{r.title}</Text>
          {!typed && phase === 'ready' && <Text className="text-base text-muted-foreground">{r.trustLine}</Text>}
        </View>

        {isSample && (
          <View className="rounded-2xl border border-caution p-3">
            <Text className="text-sm text-caution">{pendingCopy.review.sampleBanner}</Text>
            <Text className="text-sm text-caution">{pendingCopy.review.sampleNotSaved}</Text>
          </View>
        )}

        {firstNote && phase === 'ready' && (
          <Animated.View entering={motion.enter()} layout={LinearTransition.springify().damping(30)}>
            {/* Compact first-time note; "Got it" collapses it for good (review.firstNoteSeen). */}
            <View className="gap-1 rounded-2xl bg-secondary py-3 pl-4 pr-2">
              <View className="flex-row items-center justify-between gap-2">
                <Text className="flex-1 text-base font-semibold text-foreground">{r.firstNote.title}</Text>
                <Button variant="ghost" size="sm" onPress={dismissFirstNote}>
                  <Text className="text-primary">{r.firstNote.dismissButton}</Text>
                </Button>
              </View>
              <Text className="pr-2 text-sm leading-5 text-foreground">{r.firstNote.body}</Text>
            </View>
          </Animated.View>
        )}

        {phase === 'transcribing' && (
          <Card className="items-center gap-2 rounded-3xl border-0 bg-card p-8" accessibilityLiveRegion="polite">
            <Text className="text-lg text-muted-foreground">{copy.tonight.states.transcribing}</Text>
          </Card>
        )}

        {phase === 'waiting' && (
          <Card className="gap-3 rounded-3xl border-0 bg-card p-6" accessibilityLiveRegion="polite">
            <Text role="heading" className="text-lg font-semibold text-foreground">
              {waitReason === 'failed' ? copy.errors.transcriptionFailed.title : pendingCopy.review.waitingTitle}
            </Text>
            <Text className="text-base leading-6 text-foreground">
              {waitReason === 'failed' ? copy.errors.transcriptionFailed.body : pendingCopy.review.waitingBody}
            </Text>
            <View className="flex-row flex-wrap gap-3">
              {waitReason === 'failed' && draft.state !== 'unrecoverable' && (
                <Button variant="secondary" onPress={transcribe}>
                  <Text>{copy.errors.transcriptionFailed.button}</Text>
                </Button>
              )}
              <Button variant="secondary" onPress={() => router.replace({ pathname: '/write', params: { draftId: draft.id } })}>
                <Text>{copy.errors.micDenied.typeButton}</Text>
              </Button>
            </View>
          </Card>
        )}

        {saveFailed && (
          <Text className="text-base text-caution" accessibilityLiveRegion="assertive">
            {copy.errors.generic.body}
          </Text>
        )}

        {phase === 'ready' && (
          <>
            <Animated.View layout={LinearTransition.springify().damping(30)}>
              <Card className="gap-4 rounded-3xl border-0 bg-card p-5">
                {editing ? (
                  <TextInput
                    className="min-h-40 font-serif text-xl leading-8 text-foreground"
                    value={finalText}
                    onChangeText={setUserText}
                    multiline
                    autoFocus
                    textAlignVertical="top"
                    accessibilityLabel={pendingCopy.write.label}
                  />
                ) : showOriginal ? (
                  <View className="gap-2">
                    <Text className="text-xs font-medium tracking-[1.2px] text-muted-foreground">{r.originalLabel.toUpperCase()}</Text>
                    <Text className="font-serif text-xl leading-8 text-foreground" selectable>
                      {raw}
                    </Text>
                  </View>
                ) : userText !== null ? (
                  <Text className="font-serif text-xl leading-8 text-foreground" selectable>
                    {userText}
                  </Text>
                ) : (
                  <Transcript
                    segments={segs}
                    openEdit={openEdit}
                    restoredIndex={wash ? marker : null}
                    onPressEdit={(i) => {
                      if (i >= applied.length) return;
                      haptic('tap');
                      setOpenEdit(openEdit === i ? null : i);
                    }}
                  />
                )}

                {openE && !showOriginal && userText === null && (
                  <Animated.View entering={FadeIn.delay(80).duration(160)} className="gap-2 rounded-2xl bg-muted p-4">
                    <Text className="text-sm font-semibold text-foreground">{r.edits[EDIT_COPY[openE.type]].label}</Text>
                    <Text className="text-base leading-6 text-foreground">{r.edits[EDIT_COPY[openE.type]].explain}</Text>
                    <Text className="text-sm text-muted-foreground">{r.originalLabel}</Text>
                    <Text className="font-serif text-lg text-foreground">"{openE.original.trim()}"</Text>
                    {openE.replacement.trim() !== '' && (
                      <>
                        <Text className="text-sm text-muted-foreground">{r.tidiedLabel}</Text>
                        <Text className="font-serif text-lg text-foreground">"{openE.replacement.trim()}"</Text>
                      </>
                    )}
                    <View className="flex-row gap-3">
                      <Button size="sm" onPress={() => putBack(openEdit!)}>
                        <Text>{r.undoEditButton}</Text>
                      </Button>
                      <Button size="sm" variant="ghost" onPress={() => setOpenEdit(null)}>
                        <Text className="text-muted-foreground">{copy.common.closeButton}</Text>
                      </Button>
                    </View>
                  </Animated.View>
                )}

                {restored && (
                  <View className="flex-row items-center gap-3" accessibilityLiveRegion="polite">
                    <Text className="text-base text-muted-foreground">{pendingCopy.review.putBack}</Text>
                    <Button size="sm" variant="ghost" onPress={undoPutBack}>
                      <Text className="text-primary">{copy.common.undoButton}</Text>
                    </Button>
                    <Button size="sm" variant="ghost" onPress={() => setRestored(null)}>
                      <Text className="text-muted-foreground">{copy.common.closeButton}</Text>
                    </Button>
                  </View>
                )}
              </Card>
            </Animated.View>

            {!typed && userText === null && !editing && (
              <View className="gap-1">
                <Text className="text-base text-muted-foreground">
                  {applied.length === 0 ? r.noChanges : plural(applied.length, pendingCopy.review.changesLabelOne, fill(r.changesLabel, { count: applied.length }))}
                </Text>
                {/* Every edit as a row: the VoiceOver path to the underlines (COMPONENTS 2.19). */}
                {!showOriginal &&
                  applied.map((e, i) => (
                    <Pressable
                      key={`${e.start}-${e.type}`}
                      onPress={() => {
                        haptic('tap');
                        setOpenEdit(openEdit === i ? null : i);
                      }}
                      accessibilityRole="button"
                      accessibilityHint={pendingCopy.review.editA11yHint}
                      className="min-h-11 flex-row items-center gap-2">
                      <Text className="text-sm font-medium text-foreground">{r.edits[EDIT_COPY[e.type]].label}</Text>
                      <Text className="flex-1 text-sm text-muted-foreground" numberOfLines={1}>
                        "{e.original.trim()}"
                      </Text>
                    </Pressable>
                  ))}
                <View className="flex-row flex-wrap gap-x-4">
                  <Button variant="ghost" size="sm" className="px-0" onPress={() => setShowOriginal((v) => !v)}>
                    <Text className="text-primary">{showOriginal ? r.showTidiedButton : r.showOriginalLink}</Text>
                  </Button>
                  {applied.length > 0 && (
                    <Button variant="ghost" size="sm" className="px-0" onPress={wordForWord}>
                      <Text className="text-primary">{r.undoAllButton}</Text>
                    </Button>
                  )}
                </View>
              </View>
            )}

            {!isSample && (
              <Button variant="ghost" size="sm" className="self-start px-0" onPress={() => setEditing((v) => !v)}>
                <Text className="text-primary">{editing ? copy.common.doneButton : pendingCopy.review.editTextButton}</Text>
              </Button>
            )}

            {!typed && (
              <View className="gap-3">
                <Text className="text-lg text-foreground">{r.voiceCheck.question}</Text>
                <View className="flex-row gap-3">
                  {([true, false] as const).map((v) => (
                    <Button
                      key={String(v)}
                      variant={soundsLikeMe === v ? 'default' : 'outline'}
                      className="flex-1"
                      accessibilityState={{ selected: soundsLikeMe === v }}
                      onPress={() => {
                        haptic('tap');
                        setSoundsLikeMe(v);
                      }}>
                      <Text>{v ? r.voiceCheck.yesButton : r.voiceCheck.noButton}</Text>
                    </Button>
                  ))}
                </View>
                {soundsLikeMe === false && <Text className="text-base text-muted-foreground">{r.voiceCheck.noFollowUp}</Text>}
                {soundsLikeMe === true && <Text className="text-base text-muted-foreground">{r.voiceCheck.thanks}</Text>}
              </View>
            )}

            <Text className="text-sm text-muted-foreground">{r.destination.privateHelp}</Text>
          </>
        )}
      </ScrollView>

      {/* Save is always on screen, in the thumb zone (DESIGN_LANGUAGE 1.2): a sticky footer, never at the end of a scroll. */}
      {phase === 'ready' && !isSample && (
        <View className="gap-2 border-t border-border bg-background px-5 pb-2 pt-3">
          <Button size="lg" onPress={() => save(true)} disabled={!finalText.trim() || editing} accessibilityHint={r.destination.title}>
            <Text>{fill(r.destination.addButton, { child: child.name })}</Text>
          </Button>
          <Button variant="secondary" onPress={() => save(false)} disabled={!finalText.trim() || editing}>
            <Text>{r.destination.privateButton}</Text>
          </Button>
        </View>
      )}
      {/* No words to save (or only sample words): keep the recording itself. */}
      {spoken && (phase === 'waiting' || (phase === 'ready' && isSample)) && (
        <View className="gap-2 border-t border-border bg-background px-5 pb-2 pt-3">
          <Button size="lg" onPress={keepRecordingOnly} accessibilityHint={r.destination.privateHelp}>
            <Text>{pendingCopy.review.voiceOnlyButton}</Text>
          </Button>
        </View>
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
