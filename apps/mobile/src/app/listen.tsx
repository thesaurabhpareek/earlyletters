/**
 * Listening (DESIGN_LANGUAGE 12, MOTION 5b). Records AAC M4A, mono, 64 kbps
 * (ADR 0005) into the app's document directory, so it stays on this phone.
 *
 * Crash-safe (LEGAL-REQ-011, TDD 01 3.4): the draft row is written before the
 * microphone goes live (lib/capture/recorder.ts). Finish, the app going to
 * the background, an audio interruption (call, Siri, alarm) and leaving the
 * screen all stop and keep the take, then Review opens. Only "Let it go",
 * confirmed, deletes audio. Never records in the background.
 */
import {
  AudioQuality,
  IOSOutputFormat,
  getRecordingPermissionsAsync,
  requestRecordingPermissionsAsync,
  useAudioRecorder,
  useAudioRecorderState,
  type RecordingOptions,
} from 'expo-audio';
import { File } from 'expo-file-system';
import { router, useLocalSearchParams } from 'expo-router';
import { PencilSimpleIcon } from 'phosphor-react-native';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Alert, AppState, Linking, View, useColorScheme } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { tokens } from '@scribe/design-tokens';
import { ListeningAura, type AuraState } from '@/components/capture/listening-aura';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SafeAreaView } from '@/components/ui/safe-area-view';
import { Text } from '@/components/ui/text';
import { setAudioMode } from '@/lib/audio-mode';
import { copy, fill, pendingCopy } from '@/lib/copy';
import { haptic } from '@/lib/haptics';
import { useReducedMotion } from '@/lib/motion';
import { abandonTake, beginTake, finalizeTake, type StopReason } from '@/lib/capture/recorder';
import { deleteDraft, getActiveChild, setRecordingProgress } from '@/lib/store';

/** ADR 0005: AAC-LC, mono, 44.1 kHz, 64 kbps, .m4a. Metering feeds the aura. */
const VOICE: RecordingOptions = {
  extension: '.m4a',
  sampleRate: 44100,
  numberOfChannels: 1,
  bitRate: 64000,
  isMeteringEnabled: true,
  directory: 'document',
  ios: { extension: '.m4a', outputFormat: IOSOutputFormat.MPEG4AAC, audioQuality: AudioQuality.HIGH, sampleRate: 44100 },
  android: { extension: '.m4a', outputFormat: 'mpeg4', audioEncoder: 'aac', sampleRate: 44100 },
  web: { mimeType: 'audio/webm', bitsPerSecond: 64000 },
};

type Phase = 'asking' | 'denied' | 'recording' | 'paused' | 'finishing';

function clock(ms: number): string {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export default function Listen() {
  const c = tokens[useColorScheme() === 'dark' ? 'dark' : 'light'];
  const t = copy.tonight.states;
  const p = pendingCopy.listen;
  const { promptKey } = useLocalSearchParams<{ promptKey?: string }>();
  const child = getActiveChild();
  const reduced = useReducedMotion();
  const takeId = useRef<string | null>(null);
  const ended = useRef(false);
  const seenLive = useRef(false);
  const lastDuration = useRef(0);
  const [interrupted, setInterrupted] = useState(false);
  const recorder = useAudioRecorder(VOICE, (s) => {
    // The OS or media services ended the take (TDD 03 FM-1): keep what exists.
    if (s.hasError || s.mediaServicesDidReset) setInterrupted(true);
  });
  const status = useAudioRecorderState(recorder, 50); // 20 Hz metering (MOTION 5b)
  const db = useSharedValue(-160);
  const [phase, setPhase] = useState<Phase>('asking');
  const announcedMinute = useRef(0);

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
    haptic('press'); // after the session ends: iOS mutes haptics while recording
    if (draft) router.replace({ pathname: '/review', params: { draftId: draft.id } });
    else router.back();
  };

  const start = async () => {
    if (!child) return;
    const perm = (await getRecordingPermissionsAsync()).granted ? { granted: true } : await requestRecordingPermissionsAsync();
    if (!perm.granted) {
      setPhase('denied');
      return;
    }
    // Haptic before the session activates: iOS mutes haptics while recording.
    haptic('press');
    await setAudioMode('recording');
    const draft = await beginTake(recorder, { childId: child.id, promptKey: promptKey ?? null });
    takeId.current = draft.id;
    setPhase('recording');
    AccessibilityInfo.announceForAccessibility(t.listening);
  };

  useEffect(() => {
    start().catch(() => {
      if (takeId.current) void endTake('interruption');
      else setPhase('denied');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // App leaves the foreground: stop and keep (LEGAL-REQ-011, PRD checklist 6.3).
  // `inactive` alone (Control Center, a notification) does nothing; a real
  // interruption is caught below.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'background') void endTake('background');
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
    haptic('warning');
    Alert.alert(p.discardTitle, p.discardBody, [
      { text: p.keepButton, style: 'cancel' },
      {
        text: p.discardConfirm,
        style: 'destructive',
        onPress: async () => {
          const id = takeId.current;
          ended.current = true;
          const uri = recorder.uri;
          if (id) await abandonTake(recorder, id);
          else await setAudioMode('idle').catch(() => {});
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

  const typeInstead = () => router.replace({ pathname: '/write', params: promptKey ? { promptKey } : {} });

  if (!child) return null;

  if (phase === 'denied') {
    const e = copy.errors.micDenied;
    return (
      <SafeAreaView className="flex-1 justify-center bg-background px-5">
        <Card className="gap-4 rounded-3xl border-0 bg-card p-6">
          <Text role="heading" className="font-serif text-2xl text-foreground">{e.title}</Text>
          <Text className="text-lg leading-7 text-foreground">{e.body}</Text>
          <Button size="lg" onPress={typeInstead}>
            <PencilSimpleIcon color={c.onAccent} size={24} />
            <Text>{e.typeButton}</Text>
          </Button>
          <Button variant="ghost" onPress={() => Linking.openSettings()}>
            <Text className="text-primary">{e.settingsButton}</Text>
          </Button>
          <Button variant="ghost" onPress={() => router.back()}>
            <Text className="text-muted-foreground">{copy.common.closeButton}</Text>
          </Button>
        </Card>
      </SafeAreaView>
    );
  }

  const aura: AuraState = phase === 'recording' ? 'listening' : phase === 'paused' ? 'paused' : phase === 'finishing' ? 'processing' : 'idle';
  const quiet = phase === 'recording' && (status.metering ?? -160) < -50 && status.durationMillis > 8000;

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="items-center gap-1 px-5 pt-6">
        <Text role="heading" className="text-lg font-semibold text-foreground">{fill(p.toChild, { child: child.name })}</Text>
        <Text className="text-sm text-muted-foreground">{p.audience}</Text>
      </View>

      <View className="flex-1 items-center justify-center gap-6">
        <ListeningAura state={aura} db={db} reduced={reduced} />
        <Text
          className="text-2xl font-semibold text-foreground"
          style={{ fontVariant: ['tabular-nums'] }}
          accessibilityLabel={fill(p.elapsedA11y, {
            minutes: Math.floor(status.durationMillis / 60000),
            seconds: Math.floor(status.durationMillis / 1000) % 60,
          })}>
          {clock(status.durationMillis)}
        </Text>
        <View className="items-center gap-1 px-8" accessibilityLiveRegion="polite">
          <Text className="text-center text-lg text-foreground">
            {phase === 'paused' ? t.paused : quiet ? t.stillHere : t.listening}
          </Text>
          {phase !== 'paused' && <Text className="text-center text-base text-muted-foreground">{t.listeningHint}</Text>}
        </View>
      </View>

      <View className="gap-3 px-5 pb-4">
        <View className="flex-row gap-3">
          <Button
            variant="secondary"
            size="lg"
            className="flex-1"
            disabled={phase !== 'recording' && phase !== 'paused'}
            onPress={togglePause}
            accessibilityLabel={phase === 'paused' ? t.resumeButton : copy.common.pauseButton}>
            <Text>{phase === 'paused' ? t.resumeButton : copy.common.pauseButton}</Text>
          </Button>
          <Button
            size="lg"
            className="flex-1"
            disabled={phase !== 'recording' && phase !== 'paused'}
            onPress={finish}
            accessibilityLabel={t.stopButton}
            accessibilityHint={fill(p.elapsedA11y, {
              minutes: Math.floor(status.durationMillis / 60000),
              seconds: Math.floor(status.durationMillis / 1000) % 60,
            })}>
            <Text>{t.stopButton}</Text>
          </Button>
        </View>
        <Button variant="ghost" onPress={discard} disabled={phase === 'finishing'}>
          <Text className="text-muted-foreground">{p.discardButton}</Text>
        </Button>
      </View>
    </SafeAreaView>
  );
}
