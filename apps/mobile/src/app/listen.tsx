/**
 * Listening (DESIGN_LANGUAGE 12, MOTION 5b; EXPERIENCE_PASS_2026-10 S11, S12, S13 and 5.8 rows 1 to 4, package P4).
 * Records AAC M4A, mono, 64 kbps, 48 kHz (ADR 0005, ADR 0015; settings in lib/capture/recorder.ts
 * VOICE_RECORDING_OPTIONS) into the app's document directory.
 *
 * Crash-safe (LEGAL-REQ-011, TDD 01 3.4): the draft row is written before the
 * microphone goes live (lib/capture/recorder.ts). Finish, the app going to
 * the background, an audio interruption (call, Siri, alarm) and leaving the
 * screen all stop and keep the take, then Review opens and says why it stopped
 * when it was not Finish. Only "Let it go", confirmed, deletes audio. Never records in the background.
 *
 * Starts only from a tap: Tonight's Speak arms it (lib/resilience/start-intent.ts). Opened any other way
 * (the scribe://listen link, a restored screen) it is Listening at rest (S12): the red circle is the start
 * control, and the microphone is not touched until it is tapped.
 * The screen stays awake only while a take is recording (not paused), and is released when it ends.
 *
 * A room with no lamp (5.2): Tonight's light fades out as Listen covers it and comes back when it leaves
 * (useUnlitRoom, 5.8 rows 1 and 2). Only the voice moves the aura; nothing else on this screen moves after it
 * arrives (S11). The room's rules are pure in components/capture/listen.logic.ts; the three start problems
 * (off, in use, full) in components/capture/mic-state.logic.ts.
 */
import { getRecordingPermissionsAsync, requestRecordingPermissionsAsync, useAudioRecorder, useAudioRecorderState } from 'expo-audio';
import { File, Paths } from 'expo-file-system';
import { router, useLocalSearchParams } from 'expo-router';
import { LockSimpleIcon } from 'phosphor-react-native/src/icons/LockSimple';
import { MicrophoneIcon } from 'phosphor-react-native/src/icons/Microphone';
import { MicrophoneSlashIcon } from 'phosphor-react-native/src/icons/MicrophoneSlash';
import { PencilSimpleIcon } from 'phosphor-react-native/src/icons/PencilSimple';
import { WarningCircleIcon } from 'phosphor-react-native/src/icons/WarningCircle';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Alert, AppState, Linking, Platform, Pressable, ScrollView, View, type Text as RNText } from 'react-native';
import Animated, { useSharedValue } from 'react-native-reanimated';
import { renderTemplate } from '@scribe/core';
import { PROMPTS } from '@scribe/content';
import { tokens } from '@scribe/design-tokens';
import { ListeningAura } from '@/components/capture/listening-aura';
import {
  afterForeground,
  createListenAnnouncer,
  elapsedClock,
  isMicProblem,
  listenRoom,
  maySpeak,
  permissionStep,
  promptLine,
  reviewParams,
  startBlocker,
  stableLabels,
  startFailure,
  type ListenPhase,
  type RoomLabels,
} from '@/components/capture/listen.logic';
import { MIC_ERROR_CODE, micStateView, type MicAction } from '@/components/capture/mic-state.logic';
import { Button, ButtonRow } from '@/components/ui/button';
import { useUnlitRoom } from '@/components/ui/lamp';
import { SafeAreaView } from '@/components/ui/safe-area-view';
import { ModalHeader } from '@/components/ui/screen-header';
import { StateGlyph, StateScreen } from '@/components/ui/state-screen';
import { STATE_LAYOUT } from '@/components/ui/state-screen.logic';
import { Text } from '@/components/ui/text';
import { announce, useFocusOnMount, useIsAccessibilitySize, useTheme } from '@/lib/a11y';
import { setAudioMode } from '@/lib/audio-mode';
import { CAPTURE_HEARTBEAT_MS, closeTake, confirmLive, finishTake, heartbeat, openTake, pauseConfirmed, pauseTake, resetCapture, resumeTake } from '@/lib/speech-gate';
import { copy, fill, pendingCopy } from '@/lib/copy';
import { haptic } from '@/lib/haptics';
import { useMotion, useReducedMotion } from '@/lib/motion';
import { track, trackCaptureDiscarded } from '@/lib/analytics/track';
import { freeBytesFrom } from '@/lib/capture/free-space';
import { VOICE_RECORDING_OPTIONS, abandonTake, beginTake, finalizeTake, type StopReason } from '@/lib/capture/recorder';
import { deleteDraft, getActiveChild, setRecordingProgress } from '@/lib/store';
import { KEEP_AWAKE_TAGS, useKeepAwakeWhile } from '@/lib/resilience/keep-awake';
import { consumeListenStart } from '@/lib/resilience/start-intent';

/** The red circle (MOTION 5b): 120 pt, the aura's disc. The start control sits exactly over it (S12). */
const AURA_SIZE = 240;
const DISC = AURA_SIZE / 2;

/** Free space now, or null when unknown. The web preview has no file system, so it never blocks there. */
function freeBytesNow(): number | null {
  return Platform.OS === 'web' ? null : freeBytesFrom(() => Paths.availableDiskSpace);
}

export default function Listen() {
  const { c } = useTheme();
  const t = copy.tonight.states;
  const p = pendingCopy.listen;
  const motion = useMotion();
  const { promptKey } = useLocalSearchParams<{ promptKey?: string }>();
  const child = getActiveChild();
  const reduced = useReducedMotion();
  // At accessibility text sizes the room scrolls; the clock and "Listening." then sit with Pause and Finish, so the
  // screen always says it is recording, and the prompt is shown whole (P4 critics' pass S5).
  const large = useIsAccessibilitySize();
  const takeId = useRef<string | null>(null);
  const ended = useRef(false);
  const seenLive = useRef(false);
  const lastDuration = useRef(0);
  const [interrupted, setInterrupted] = useState(false);
  const recorder = useAudioRecorder(VOICE_RECORDING_OPTIONS, (s) => {
    // The OS or media services ended the take (TDD 03 FM-1): keep what exists.
    if (s.hasError || s.mediaServicesDidReset) setInterrupted(true);
  });
  const status = useAudioRecorderState(recorder, 50); // 20 Hz metering (MOTION 5b)
  const db = useSharedValue(-160);
  // Read once on mount: was this opened by a tap on Speak? (A ref, so a re-render never re-reads it.)
  const tapped = useRef<boolean | null>(null);
  if (tapped.current === null) tapped.current = consumeListenStart();
  const [phase, setPhase] = useState<ListenPhase>(tapped.current ? 'asking' : 'ready');
  const announcedMinute = useRef(0);
  /** The labels VoiceOver last could hear: they hold still while capturing (listen.logic `stableLabels`, F04-REQ-041). */
  const labelsRef = useRef<RoomLabels | null>(null);
  const mounted = useRef(true);
  useEffect(
    () => () => {
      mounted.current = false;
    },
    [],
  );

  // A room with no lamp over a lit one (5.8 rows 1 and 2): Tonight's light leaves, and returns when Listen does.
  useUnlitRoom();

  useEffect(() => {
    if (isMicProblem(phase)) {
      const code = MIC_ERROR_CODE[phase];
      if (code) track('error_shown', { code });
    }
  }, [phase]);

  // Metering into the UI thread; never setState per frame.
  useEffect(() => {
    db.value = phase === 'recording' && typeof status.metering === 'number' ? status.metering : -160;
  }, [status.metering, phase, db]);

  // VoiceOver never speaks into a take (SR-C-02, F04-REQ-040, B2-21 never waived): without headphones its voice would
  // be in the letter. Every line this screen says goes through the gate in listen.logic, which drops or holds it while
  // the recorder is capturing and speaks a held one once capture has stopped. `recorder.isRecording` reads the native
  // recorder; the polled status can lag, so either one saying "capturing" is enough to stay silent.
  const announcer = useRef(createListenAnnouncer((m) => announce(m))).current;
  const capturingNow = (): boolean => {
    let live = false;
    try {
      live = recorder.isRecording;
    } catch {}
    return live || status.isRecording === true;
  };
  // The app-wide gate (lib/speech-gate.ts), so no toast or other `announce()` anywhere in the app speaks into the take.
  // Its state machine is keyed to this take's token: this screen opens, pauses, resumes, finishes and closes it; a
  // status poll can only confirm ON for the open take (never turn it off, never on after the end). The one way off
  // during a take is a pause the person made, once the recorder has really stopped writing.
  const takeToken = useRef<number | null>(null);
  useEffect(() => {
    const capturing = capturingNow();
    if (capturing) confirmLive(takeToken.current);
    else if (phase === 'paused') pauseConfirmed(takeToken.current);
    announcer.settle({ phase, capturing });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, phase]);
  useEffect(() => () => announcer.clear(), [announcer]);
  // The heartbeat that keeps an open take's ON state from expiring (STALE_CAPTURE_MS). It stops with the screen, so a
  // missed reset can never leave the app silent for more than a few seconds.
  useEffect(() => {
    const id = setInterval(() => heartbeat(takeToken.current), CAPTURE_HEARTBEAT_MS);
    return () => clearInterval(id);
  }, []);

  // Elapsed time once a minute, not every second (COMPONENTS 2.18), offered to the gate: a minute only passes while
  // recording, so it is dropped, and the clock's label carries the time at the next pause (F04-U30).
  useEffect(() => {
    const minute = Math.floor(status.durationMillis / 60000);
    if (phase === 'recording' && minute > announcedMinute.current) {
      announcedMinute.current = minute;
      announcer.say(fill(p.elapsedA11y, { minutes: minute, seconds: 0 }), { phase, capturing: capturingNow() });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status.durationMillis, phase, p.elapsedA11y]);

  // Elapsed time to the draft every 5 s, so a take recovered after a kill has a length.
  useEffect(() => {
    if (status.durationMillis > 0) lastDuration.current = status.durationMillis;
    const id = takeId.current;
    if (id && phase === 'recording' && Math.floor(status.durationMillis / 5000) !== Math.floor((status.durationMillis - 50) / 5000)) {
      setRecordingProgress(id, status.durationMillis);
    }
  }, [status.durationMillis, phase]);

  /** Stop and keep the take, then open Review. Every exit except Discard comes through here. */
  const endTake = async (reason: StopReason) => {
    const id = takeId.current;
    if (!id || ended.current) return;
    ended.current = true;
    const token = takeToken.current;
    finishTake(token); // ON until the recorder has stopped, even from paused
    setPhase('finishing');
    let draft: Awaited<ReturnType<typeof finalizeTake>>;
    try {
      draft = await finalizeTake(recorder, id, reason, lastDuration.current);
    } finally {
      closeTake(token); // the recorder has stopped: the app may speak again (on Review); a late poll cannot undo this
    }
    haptic('press'); // record stop (MOTION 6), after the session ends: iOS mutes haptics while recording
    // Review says why in one honest line when leaving the app or a call ended the take (S14).
    if (draft) router.replace({ pathname: '/review', params: reviewParams(draft.id, reason) });
    else router.back();
  };

  /** `primed`: the person has just read our primer and tapped Continue, so iOS may ask now (SR-C-05). */
  const start = async (primed: boolean) => {
    if (!child) return;
    // Our own short primer first, while iOS has not asked yet (F04-REQ-034); iOS asks only after Continue. The purpose
    // string iOS shows is `permissions.microphone` (counsel's wording, untouched here).
    const current = await getRecordingPermissionsAsync();
    const step = permissionStep(current, primed);
    if (step === 'primer') {
      setPhase('primer');
      return;
    }
    const perm = step === 'ask' ? await requestRecordingPermissionsAsync() : current;
    // Off, then a phone with no room for a take: each says its own cause (S13). Nothing is written for either.
    const blocked = startBlocker({ granted: perm.granted, freeBytes: freeBytesNow() });
    if (blocked) {
      setPhase(blocked);
      return;
    }
    // Haptic before the session activates: iOS mutes haptics while recording.
    haptic('press');
    // Silent from before the audio session and the microphone go live: `starting` is ON, and no status poll can turn
    // it off while the start is in progress.
    const token = openTake();
    takeToken.current = token;
    await setAudioMode('recording');
    const draft = await beginTake(recorder, { childId: child.id, promptKey: promptKey ?? null });
    if (!mounted.current) {
      // The screen went away while the take was starting: keep what exists, as any other exit does. (Unmount already
      // forced the gate off; closing the dead token is a no-op kept for symmetry.)
      ended.current = true;
      void finalizeTake(recorder, draft.id, 'dismiss', 0).finally(() => closeTake(token));
      return;
    }
    takeId.current = draft.id;
    setPhase('recording');
    // The take is live, so the gate drops this: the red circle and the system microphone indicator say it instead.
    announcer.say(t.listening, { phase: 'recording', capturing: capturingNow() });
  };

  /** Whether the microphone is allowed now; null when the system cannot say. */
  const grantedNow = async (): Promise<boolean | null> => {
    try {
      return (await getRecordingPermissionsAsync()).granted;
    } catch {
      return null;
    }
  };

  // `begin` is handed to onPress, which passes an event, so it takes no argument; Continue on the primer has its own.
  const begin = () => startFromTap(false);
  const continueAfterPrimer = () => startFromTap(true);

  const startFromTap = (primed: boolean) => {
    setPhase('asking');
    start(primed).catch(async () => {
      // A take that began ends as an interruption and is kept; before that, a granted microphone is busy, never "off" (S13).
      const failure = startFailure({ takeBegun: takeId.current !== null, granted: await grantedNow() });
      if (failure === 'interrupted') void endTake('interruption');
      else {
        // No take began: the start's token is closed, so the app may speak on the busy or off screen.
        closeTake(takeToken.current);
        await setAudioMode('idle').catch(() => {});
        setPhase(failure);
      }
    });
  };

  useEffect(() => {
    if (tapped.current) begin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Only a live take keeps the screen on. Paused, finishing, and leaving all release it (auto-lock is a privacy control).
  useKeepAwakeWhile(phase === 'recording', KEEP_AWAKE_TAGS.listen);

  // App leaves the foreground: stop and keep (LEGAL-REQ-011, PRD checklist 6.3).
  // `inactive` alone (Control Center, a notification) does nothing; a real
  // interruption is caught below. Back in front with the microphone now on (from Settings): idle Listening (S13).
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'background') void endTake('background');
      if (next === 'active' && phaseRef.current === 'denied') {
        void grantedNow().then((granted) => {
          if (granted) setPhase((now) => afterForeground(now, true));
        });
      }
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Audio interruption: the recorder stops capturing while we think it is live.
  // `recorder.isRecording` reads the native recorder; the polled status does not.
  useEffect(() => {
    if (phase !== 'recording') return;
    let live = false;
    try {
      live = recorder.isRecording;
    } catch {}
    if (live) seenLive.current = true;
    else if (seenLive.current) setInterrupted(true);
  }, [status.durationMillis, phase, recorder]);

  useEffect(() => {
    if (interrupted && (phase === 'recording' || phase === 'paused')) void endTake('interruption');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interrupted, phase]);

  // Leaving the screen any other way keeps the take. A layout effect cleanup
  // runs before the recorder hook releases the native recorder.
  useLayoutEffect(
    () => () => {
      const id = takeId.current;
      if (id && !ended.current) {
        ended.current = true;
        void finalizeTake(recorder, id, 'dismiss', lastDuration.current);
      }
      // Unmount always forces the gate off, whatever state the take was in (Review B on #523): with the screen gone,
      // nothing can keep the app silent. The recorder is being stopped above; the screen leaving is the take's end.
      resetCapture();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const togglePause = () => {
    haptic('tap');
    if (phase === 'recording') {
      pauseTake(takeToken.current); // still ON until the recorder has really stopped (pauseConfirmed)
      recorder.pause();
      seenLive.current = false;
      setPhase('paused');
      // Held until the recorder has really stopped capturing, then spoken once (F04-U30); a quick resume drops it.
      announcer.say(t.paused, { phase: 'paused', capturing: capturingNow() }, 'hold');
    } else if (phase === 'paused') {
      resumeTake(takeToken.current); // silent before the microphone is live again
      recorder.record();
      setPhase('recording');
      // Live again, so the gate drops this.
      announcer.say(t.listening, { phase: 'recording', capturing: capturingNow() });
    }
  };

  const finish = () => endTake('user');

  const discard = () => {
    Alert.alert(p.discardTitle, p.discardBody, [
      { text: p.keepButton, style: 'cancel' },
      {
        text: p.discardConfirm,
        style: 'destructive',
        onPress: async () => {
          const id = takeId.current;
          ended.current = true;
          trackCaptureDiscarded({ mode: 'spoken', stage: 'listening', audioMs: lastDuration.current || null });
          const uri = recorder.uri;
          const token = takeToken.current;
          finishTake(token);
          try {
            if (id) await abandonTake(recorder, id);
            else await setAudioMode('idle').catch(() => {});
          } finally {
            closeTake(token);
          }
          // Only once the person has confirmed (MOTION 6, 5.8 row 2), and after the session has stopped: iOS mutes
          // haptics while recording.
          haptic('warning');
          // The one place audio is deleted: the parent confirmed it.
          if (uri) {
            try {
              new File(uri).delete();
            } catch {}
          }
          if (id) deleteDraft(id);
          router.back();
        },
      },
    ]);
  };

  // "Type instead" carries the prompt over as Write's line (5.8 row 3).
  const typeInstead = () => router.replace({ pathname: '/write', params: promptKey ? { promptKey } : {} });
  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  if (!child) return null;

  if (phase === 'primer') {
    // Our own short note before the iOS question (SR-C-05, F04-REQ-034), in the same one-state layout as the three
    // start problems: nothing is recorded or asked until Continue. Typing stays an equal way (Type instead).
    return <MicPrimer childName={child.name} onContinue={continueAfterPrimer} onType={typeInstead} onClose={close} />;
  }

  if (isMicProblem(phase)) {
    const v = micStateView(phase);
    const run: Record<MicAction, () => void> = { type: typeInstead, settings: () => void Linking.openSettings(), tryAgain: begin };
    // One state layout (S13): the glyph in its soft circle, the cause, one primary and one quiet way, Close top right.
    return (
      <StateScreen
        kind="empty"
        glyph={v.glyph === 'warningCircle' ? WarningCircleIcon : MicrophoneSlashIcon}
        title={v.title}
        body={v.body}
        header={<ModalHeader onClose={close} />}
        primary={{ label: v.primary.label, icon: v.primary.action === 'type' ? PencilSimpleIcon : undefined, onPress: run[v.primary.action], testID: `listen.${phase}.primary` }}
        quiet={[{ label: v.quiet.label, onPress: run[v.quiet.action], testID: `listen.${phase}.quiet` }]}
      />
    );
  }

  const room = listenRoom(phase);
  const quiet = phase === 'recording' && (status.metering ?? -160) < -50 && status.durationMillis > 8000;
  const prompt = promptLine(promptKey, PROMPTS);
  // While iOS asks and the take starts there is nothing to tap, so no hint (5.8 row 1: the room arrives at rest).
  const line = room.line === 'none' ? null : room.line === 'readyHint' ? p.ready.hint : room.line === 'paused' ? t.paused : quiet ? t.stillHere : t.listening;
  // While capturing nothing on this screen changes what VoiceOver reads (07 line 276, F04-REQ-041): the live region is
  // off, and every label (the clock, Finish's hint, the line, Pause / Keep talking) holds still; they catch up once
  // capture stops (listen.logic `stableLabels`).
  const speakable = maySpeak({ phase, capturing: capturingNow() });
  const labels = stableLabels(
    {
      clock: fill(p.elapsedA11y, { minutes: Math.floor(status.durationMillis / 60000), seconds: Math.floor(status.durationMillis / 1000) % 60 }),
      line,
      toggle: p.toggleA11y,
    },
    labelsRef.current,
    speakable,
  );
  labelsRef.current = labels;
  const elapsedA11y = labels.clock;

  // The clock and the room's line: in the room, or pinned with the controls at accessibility sizes (S5).
  const clockAndLine = (
    <View className="items-center gap-1" testID="listen.status">
      {room.clock && (
        // A recording screen is not a timer (S11): headline, tabular figures, textMuted.
        <Text variant="headline" tone="muted" className="text-center" style={{ fontVariant: ['tabular-nums'] }} accessibilityLabel={elapsedA11y}>
          {elapsedClock(status.durationMillis)}
        </Text>
      )}
      <View className="items-center px-8" accessibilityLiveRegion={speakable ? 'polite' : 'none'}>
        {line !== null ? (
          <Text variant="callout" tone={room.line === 'readyHint' ? 'muted' : undefined} className="text-center" accessibilityLabel={labels.line ?? line}>
            {line}
          </Text>
        ) : null}
      </View>
    </View>
  );

  // Design: Voice Memos-simple, Calm-quiet. The glow is the only thing that moves, and
  // only with the voice (MOTION 5b). Controls are static and full strength from frame one (5.8 rule 3).
  // At accessibility text sizes the room scrolls and Pause, Finish and Let it go stay pinned and reachable, as every
  // state screen does (COMPONENTS 2.15a; F04-REQ-019: nothing truncates at AX5; TDD 09 V1: every control reachable).
  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Close only at rest (S12). Otherwise the same header, invisible and inert, so nothing below it moves when the
          take starts, at every text size. */}
      {room.close ? (
        <ModalHeader onClose={close} />
      ) : (
        <View style={{ opacity: 0 }} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" testID="listen.headerSlot">
          <ModalHeader onClose={close} closeDisabled />
        </View>
      )}

      <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false} testID="listen.room">
        <Animated.View entering={motion.enter(2)} className="items-center gap-1.5 px-6 pt-2">
          <Text variant="headline" asHeading className="text-center">
            {fill(p.toChild, { child: child.name })}
          </Text>
          <View className="flex-row items-center gap-1.5">
            <LockSimpleIcon size={14} color={c.textMuted} />
            <Text variant="footnote" className="shrink text-center">
              {p.audience}
            </Text>
          </View>
          {/* The prompt, only when the take started from one (S11): the one literary line, quiet. */}
          {prompt && (
            <Text variant="prompt" tone="muted" numberOfLines={large ? undefined : 3} className="mt-3 text-center" testID="listen.prompt">
              {renderTemplate(prompt, { child: child.name })}
            </Text>
          )}
        </Animated.View>

        <View className="flex-1 items-center justify-center gap-5 py-4">
          <View style={{ alignItems: 'center', justifyContent: 'center' }}>
            <ListeningAura state={room.aura} db={db} reduced={reduced} size={AURA_SIZE} />
            {room.startControl && (
              // The whole red circle starts the take (S12). The aura is decorative, so the button sits over its disc.
              <Pressable
                onPress={begin}
                accessibilityRole="button"
                accessibilityLabel={p.ready.startA11y}
                testID="listen.start"
                hitSlop={tokens.space[2]}
                style={{ position: 'absolute', width: DISC, height: DISC, borderRadius: DISC / 2 }}
              />
            )}
          </View>
          {!large && clockAndLine}
          <View className="items-center gap-1 px-8">
            {room.line === 'listening' && (
              <Text variant="footnote" className="text-center">
                {t.listeningHint}
              </Text>
            )}
          </View>
        </View>
      </ScrollView>

      <View className="gap-2 px-5 pb-4">
        {large && clockAndLine}
        <ButtonRow>
          <Button
            variant="secondary"
            size="lg"
            disabled={!room.controls}
            onPress={togglePause}
            label={phase === 'paused' ? t.resumeButton : copy.common.pauseButton}
            accessibilityLabel={labels.toggle}
          />
          <Button size="lg" disabled={!room.controls} onPress={finish} label={t.stopButton} accessibilityHint={elapsedA11y} />
        </ButtonRow>
        {room.discard ? (
          <Button variant="quiet" onPress={discard} disabled={phase === 'finishing'} className="self-center">
            <Text tone="muted">{p.discardButton}</Text>
          </Button>
        ) : (
          // Its slot stays, holding the same button invisibly, so the controls above never move when a take starts,
          // at every text size (5.8 rule 3).
          <View style={{ opacity: 0 }} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" testID="listen.discardSlot">
            <Button variant="quiet" disabled className="self-center">
              <Text tone="muted">{p.discardButton}</Text>
            </Button>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

/**
 * Our own short note before the iOS microphone question (SR-C-05, F04-REQ-034). The state layout of S13 (glyph in its
 * soft circle, title2, body, Close top right), with one difference from StateScreen: Continue and Type instead are the
 * same variant and size, since typing is an equal way to write (DESIGN_LANGUAGE principle 5). VoiceOver starts on the
 * heading: the red circle that had focus is gone. Nothing is asked or recorded until Continue.
 */
function MicPrimer({ childName, onContinue, onType, onClose }: { childName: string; onContinue: () => void; onType: () => void; onClose: () => void }) {
  const pr = pendingCopy.listen.primer;
  const heading = useRef<RNText>(null);
  useFocusOnMount(heading);
  return (
    <SafeAreaView className="flex-1 bg-background" testID="listen.primer">
      <ModalHeader onClose={onClose} />
      <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: STATE_LAYOUT.gutter }}>
        <View className="items-center gap-4">
          <StateGlyph icon={MicrophoneIcon} />
          <Text ref={heading} variant={STATE_LAYOUT.title} asHeading className="text-center" testID="listen.primer.title">
            {pr.title}
          </Text>
          <Text variant={STATE_LAYOUT.body} tone="muted" className="text-center">
            {fill(pr.body, { child: childName })}
          </Text>
        </View>
      </ScrollView>
      <View className="gap-2 px-5 pb-4">
        <Button variant="secondary" size="lg" fullWidth label={pr.continueButton} onPress={onContinue} testID="listen.primer.continue" />
        <Button variant="secondary" size="lg" fullWidth label={copy.errors.micDenied.typeButton} onPress={onType} testID="listen.primer.type" />
      </View>
    </SafeAreaView>
  );
}
