/**
 * Review (DESIGN_LANGUAGE 12, COMPONENTS 2.19, MOTION 5d and 5e).
 *
 * Shows what was said with every machine edit quietly underlined. Each edit
 * explains itself in plain words and can be put back (withoutEdit). The raw
 * transcript is set once on the draft and never changed. Saving writes the
 * entry locally first, then the success haptic, then the settle animation.
 */
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { router, useLocalSearchParams } from 'expo-router';
import { PauseIcon, PlayIcon } from 'phosphor-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, TextInput, View, useColorScheme } from 'react-native';
import Animated, { FadeIn, LinearTransition, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import {
  ENGINE_VERSION,
  ageLabel,
  ageOn,
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
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SafeAreaView } from '@/components/ui/safe-area-view';
import { Text } from '@/components/ui/text';
import { setAudioMode } from '@/lib/audio-mode';
import { copy, fill, pendingCopy } from '@/lib/copy';
import { haptic } from '@/lib/haptics';
import { useMotion } from '@/lib/motion';
import {
  deleteDraft,
  dictionaryFor,
  getChild,
  getDraft,
  getSetting,
  listChildren,
  saveEntry,
  setDraftChild,
  setDraftTranscript,
  setSetting,
  todayISO,
  type Draft,
} from '@/lib/store';
import { getTranscriber } from '@/lib/transcribe';

const EDIT_COPY: Record<EditType, keyof typeof copy.review.edits> = {
  filler: 'filler',
  false_start: 'falseStart',
  repeat: 'repeat',
  stt_fix: 'misheardName',
  punctuation: 'punctuation',
  agreement: 'grammarSlip',
  paragraph: 'paragraph',
};

type Phase = 'transcribing' | 'ready' | 'failed' | 'saved';

export default function Review() {
  const c = tokens[useColorScheme() === 'dark' ? 'dark' : 'light'];
  const r = copy.review;
  const motion = useMotion();
  const { draftId } = useLocalSearchParams<{ draftId: string }>();
  const [draft] = useState<Draft | null>(() => (draftId ? getDraft(draftId) : null));
  const [childId, setChildId] = useState(draft?.childId ?? '');
  const child = childId ? getChild(childId) : null;

  const typed = draft?.typedText != null && draft.typedText.trim().length > 0;
  const spoken = !!draft?.audioUri;
  const captureMode = typed && spoken ? 'mixed' : typed ? 'typed' : 'spoken';

  const [phase, setPhase] = useState<Phase>(typed || draft?.rawTranscript ? 'ready' : 'transcribing');
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
      if (!t) throw new Error('unavailable');
      const res = await t.transcribe({ audioUri: draft.audioUri, durationMs: draft.audioDurationMs, dictionary });
      if (n !== attempt.current) return;
      if (!t.isSample) setDraftTranscript(draft.id, res.raw); // raw is set once, never changed
      setIsSample(t.isSample);
      setRaw(res.raw);
      setPhase('ready');
    } catch {
      if (n === attempt.current) setPhase('failed');
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
    const all = listChildren();
    if (all.length < 2 || !draft) return;
    Alert.alert(
      fill(pendingCopy.listen.toChild, { child: child?.name ?? '' }),
      undefined,
      [
        ...all.map((ch) => ({
          text: ch.name,
          onPress: () => {
            haptic('tap');
            setDraftChild(draft.id, ch.id);
            setChildId(ch.id);
          },
        })),
        { text: copy.common.cancelButton, style: 'cancel' as const },
      ],
    );
  };

  // Save: commit, haptic, then animate (MOTION principle 3).
  const settle = useSharedValue(1);
  const settleStyle = useAnimatedStyle(() => ({ transform: [{ scale: 0.9 + 0.1 * settle.value }], opacity: settle.value }));
  const save = (inBook: boolean) => {
    if (!draft || !child) return;
    player.pause();
    saveEntry({
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
    });
    deleteDraft(draft.id);
    haptic('success');
    setSavedTo(inBook ? 'book' : 'private');
    setPhase('saved');
    settle.value = motion.spring(0, 'gentle');
    setTimeout(() => router.back(), 900); // sequenceMaxMs; a tap skips it
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

  const today = todayISO();
  const age = child.birthday ? ageOn(child.birthday, today) : null;
  const dateline = age && age.days >= 0 ? `${child.name} · ${ageLabel(age)}` : child.name;
  const openE = openEdit !== null ? applied[openEdit] : null;
  const many = listChildren().length > 1;

  if (phase === 'saved') {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background px-5">
        <Pressable onPress={() => router.back()} className="w-full" accessibilityRole="button" accessibilityLabel={copy.common.doneButton}>
          <Animated.View style={settleStyle}>
            <Card className="rounded-3xl border-0 bg-card p-6">
              <Text className="font-serif text-xl leading-8 text-foreground" numberOfLines={4}>
                {finalText}
              </Text>
            </Card>
          </Animated.View>
          <Animated.View entering={FadeIn.delay(250).duration(200)} className="mt-6 items-center" accessibilityLiveRegion="polite">
            <Text className="text-lg text-success">
              {savedTo === 'book' ? fill(r.destination.addedToast, { child: child.name }) : r.destination.privateToast}
            </Text>
          </Animated.View>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center justify-between px-3 pt-2">
        <Button variant="ghost" size="sm" onPress={() => router.back()} accessibilityHint={pendingCopy.write.savedOnPhone}>
          <Text className="text-primary">{copy.common.closeButton}</Text>
        </Button>
        {spoken && (
          <Button variant="ghost" size="sm" onPress={togglePlay} accessibilityLabel={playStatus.playing ? copy.common.pauseButton : r.playButton}>
            {playStatus.playing ? <PauseIcon color={c.accent} size={20} weight="fill" /> : <PlayIcon color={c.accent} size={20} />}
            <Text className="text-primary">{playStatus.playing ? copy.common.pauseButton : r.playButton}</Text>
          </Button>
        )}
      </View>

      <ScrollView contentContainerClassName="gap-5 px-5 pb-10 pt-2" keyboardShouldPersistTaps="handled">
        <View className="gap-1">
          <Pressable onPress={pickChild} disabled={!many} accessibilityRole={many ? 'button' : 'text'} className="min-h-11 justify-center">
            <Text className="text-xs font-medium tracking-[1.5px] text-muted-foreground">{dateline.toUpperCase()}</Text>
          </Pressable>
          <Text role="heading" className="font-serif text-3xl leading-10 text-foreground">{r.title}</Text>
          {!typed && phase === 'ready' && <Text className="text-base text-muted-foreground">{r.trustLine}</Text>}
        </View>

        {isSample && (
          <View className="rounded-2xl border border-caution p-3">
            <Text className="text-sm text-caution">{pendingCopy.review.sampleBanner}</Text>
          </View>
        )}

        {firstNote && phase === 'ready' && (
          <Animated.View entering={motion.enter()} layout={LinearTransition.springify().damping(30)}>
            <Card className="gap-2 rounded-3xl border-0 bg-secondary p-5">
              <Text className="text-lg font-semibold text-foreground">{r.firstNote.title}</Text>
              <Text className="text-base leading-6 text-foreground">{r.firstNote.body}</Text>
              <Button variant="ghost" size="sm" className="self-start" onPress={dismissFirstNote}>
                <Text className="text-primary">{r.firstNote.dismissButton}</Text>
              </Button>
            </Card>
          </Animated.View>
        )}

        {phase === 'transcribing' && (
          <Card className="items-center gap-2 rounded-3xl border-0 bg-card p-8" accessibilityLiveRegion="polite">
            <Text className="text-lg text-muted-foreground">{copy.tonight.states.transcribing}</Text>
          </Card>
        )}

        {phase === 'failed' && (
          <Card className="gap-3 rounded-3xl border-0 bg-card p-6">
            <Text className="text-lg font-semibold text-foreground">{copy.errors.transcriptionFailed.title}</Text>
            <Text className="text-base leading-6 text-foreground">{copy.errors.transcriptionFailed.body}</Text>
            <View className="flex-row flex-wrap gap-3">
              <Button onPress={transcribe}>
                <Text>{copy.errors.transcriptionFailed.button}</Text>
              </Button>
              <Button variant="secondary" onPress={() => router.replace({ pathname: '/write', params: { draftId: draft.id } })}>
                <Text>{copy.errors.micDenied.typeButton}</Text>
              </Button>
            </View>
          </Card>
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
                    maxFontSizeMultiplier={2}
                  />
                ) : showOriginal ? (
                  <View className="gap-2">
                    <Text className="text-xs font-medium tracking-[1.2px] text-muted-foreground">{r.originalLabel.toUpperCase()}</Text>
                    <Text className="font-serif text-xl leading-8 text-foreground" maxFontSizeMultiplier={2} selectable>
                      {raw}
                    </Text>
                  </View>
                ) : userText !== null ? (
                  <Text className="font-serif text-xl leading-8 text-foreground" maxFontSizeMultiplier={2} selectable>
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
                  {applied.length === 0 ? r.noChanges : fill(r.changesLabel, { count: applied.length })}
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

            <Button variant="ghost" size="sm" className="self-start px-0" onPress={() => setEditing((v) => !v)}>
              <Text className="text-primary">{editing ? copy.common.doneButton : pendingCopy.review.editTextButton}</Text>
            </Button>

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

            <View className="gap-3 pt-2">
              <Text className="text-lg font-semibold text-foreground">{r.destination.title}</Text>
              <Button size="lg" onPress={() => save(true)} disabled={!finalText.trim() || editing}>
                <Text>{fill(r.destination.addButton, { child: child.name })}</Text>
              </Button>
              <Button size="lg" variant="secondary" onPress={() => save(false)} disabled={!finalText.trim() || editing}>
                <Text>{r.destination.privateButton}</Text>
              </Button>
              <Text className="text-sm text-muted-foreground">{r.destination.privateHelp}</Text>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
