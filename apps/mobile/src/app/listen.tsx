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
import { MicrophoneSlashIcon } from 'phosphor-react-native/src/icons/MicrophoneSlash';
import { PencilSimpleIcon } from 'phosphor-react-native/src/icons/PencilSimple';
import { WarningCircleIcon } from 'phosphor-react-native/src/icons/WarningCircle';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Alert, AppState, Linking, Platform, Pressable, ScrollView, View } from 'react-native';
import Animated, { useSharedValue } from 'react-native-reanimated';
import { renderTemplate } from '@scribe/core';
import { PROMPTS } from '@scribe/content';
import { tokens } from '@scribe/design-tokens';
import { ListeningAura } from '@/components/capture/listening-aura';
import { afterForeground, elapsedClock, isMicProblem, listenRoom, promptLine, reviewParams, startBlocker, startFailure, type ListenPhase } from '@/components/capture/listen.logic';
import { MIC_ERROR_CODE, micStateView, type MicAction } from '@/components/capture/mic-state.logic';
import { Button, ButtonRow } from '@/components/ui/button';
import { useUnlitRoom } from '@/components/ui/lamp';
import { SafeAreaView } from '@/components/ui/safe-area-view';
import { ModalHeader } from '@/components/ui/screen-header';
import { StateScreen } from '@/components/ui/state-screen';
import { Text } from '@/components/ui/text';
import { useIsAccessibilitySize, useTheme } from '@/lib/a11y';
import { setAudioMode } from '@/lib/audio-mode';
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

  // Announce elapsed time once a minute, not every second (COMPONENTS 2.18).
  useEffect(() => {
    const minute = Math.floor(status.durationMillis / 60000);
    if (phase === 'recording' && minute > announcedMinute.current) {
      announcedMinute.current = minute;
      AccessibilityInfo.announceForAccessibility(fill(p.elapsedA11y, { minutes: minute, seconds: 0 }));
    }
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
    setPhase('finishing');
    const draft = await finalizeTake(recorder, id, reason, lastDuration.current);
    haptic('press'); // record stop (MOTION 6), after the session ends: iOS mutes haptics while recording
    // Review says why in one honest line when leaving the app or a call ended the take (S14).
    if (draft) router.replace({ pathname: '/review', params: reviewParams(draft.id, reason) });
    else router.back();
  };

  const start = async () => {
    if (!child) return;
    const perm = (await getRecordingPermissionsAsync()).granted ? { granted: true } : await requestRecordingPermissionsAsync();
    // Off, then a phone with no room for a take: each says its own cause (S13). Nothing is written for either.
    const blocked = startBlocker({ granted: perm.granted, freeBytes: freeBytesNow() });
    if (blocked) {
      setPhase(blocked);
      return;
    }
    // Haptic before the session activates: iOS mutes haptics while recording.
    haptic('press');
    await setAudioMode('recording');
    const draft = await beginTake(recorder, { childId: child.id, promptKey: promptKey ?? null });
    if (!mounted.current) {
      // The screen went away while the take was starting: keep what exists, as any other exit does.
      ended.current = true;
      void finalizeTake(recorder, draft.id, 'dismiss', 0);
      return;
    }
    takeId.current = draft.id;
    setPhase('recording');
    AccessibilityInfo.announceForAccessibility(t.listening);
  };

  /** Whether the microphone is allowed now; null when the system cannot say. */
  const grantedNow = async (): Promise<boolean | null> => {
    try {
      return (await getRecordingPermissionsAsync()).granted;
    } catch {
      return null;
    }
  };

  const begin = () => {
    setPhase('asking');
    start().catch(async () => {
      // A take that began ends as an interruption and is kept; before that, a granted microphone is busy, never "off" (S13).
      const failure = startFailure({ takeBegun: takeId.current !== null, granted: await grantedNow() });
      if (failure === 'interrupted') void endTake('interruption');
      else {
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
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const togglePause = () => {
    haptic('tap');
    if (phase === 'recording') {
      recorder.pause();
      seenLive.current = false;
      setPhase('paused');
      AccessibilityInfo.announceForAccessibility(t.paused);
    } else if (phase === 'paused') {
      recorder.record();
      setPhase('recording');
      AccessibilityInfo.announceForAccessibility(t.listening);
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
          if (id) await abandonTake(recorder, id);
          else await setAudioMode('idle').catch(() => {});
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
  const elapsedA11y = fill(p.elapsedA11y, {
    minutes: Math.floor(status.durationMillis / 60000),
    seconds: Math.floor(status.durationMillis / 1000) % 60,
  });
  // While iOS asks and the take starts there is nothing to tap, so no hint (5.8 row 1: the room arrives at rest).
  const line = room.line === 'none' ? null : room.line === 'readyHint' ? p.ready.hint : room.line === 'paused' ? t.paused : quiet ? t.stillHere : t.listening;

  // The clock and the room's line: in the room, or pinned with the controls at accessibility sizes (S5).
  const clockAndLine = (
    <View className="items-center gap-1" testID="listen.status">
      {room.clock && (
        // A recording screen is not a timer (S11): headline, tabular figures, textMuted.
        <Text variant="headline" tone="muted" className="text-center" style={{ fontVariant: ['tabular-nums'] }} accessibilityLabel={elapsedA11y}>
          {elapsedClock(status.durationMillis)}
        </Text>
      )}
      <View className="items-center px-8" accessibilityLiveRegion="polite">
        {line !== null ? (
          <Text variant="callout" tone={room.line === 'readyHint' ? 'muted' : undefined} className="text-center">
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
