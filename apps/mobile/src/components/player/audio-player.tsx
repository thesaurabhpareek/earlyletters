// web: same component over <audio> later | android: same code; verify TalkBack adjustable gestures (COMPONENTS 2.21)
/**
 * A letter's recording (COMPONENTS 2.21, EXPERIENCE_PASS S27): one pill, not three rows. Elevation 2, 56 pt tall:
 * the play button, "Hear Mama" with the time remaining, and a thin scrubber inside the pill along its foot. Drag
 * along the pill to move through the recording; a tap there plays or pauses, like the button. Nothing loops and
 * nothing animates: the line steps with the time, which reads the same with Reduce Motion on.
 *
 * v1.0 plays only your own recordings from this phone; for anyone else's letter, or a file that is not here, it says
 * where the recording is kept instead (D-073: backup and playback are owner-only).
 *
 * VoiceOver: two elements. The button ("Hear it in Mama's voice, 42 seconds"; "Pause Mama"), then the adjustable
 * position ("Position in the recording, 0:12 of 0:42"), swipe up or down to move 5 seconds.
 */
import { PauseIcon } from 'phosphor-react-native/src/icons/Pause';
import { PlayIcon } from 'phosphor-react-native/src/icons/Play';
import { useMemo, useRef, useState } from 'react';
import { Platform, Pressable, View } from 'react-native';
import { tokens } from '@scribe/design-tokens';
import { Toggle } from '@/components/platform/toggle';
import { Text } from '@/components/ui/text';
import { authorOf, isOwnEntry } from '@/components/child/child-store';
import { copy, fill } from '@/lib/copy';
import {
  availabilityOf,
  chooseSource,
  formatClock,
  handoffPosition,
  listeningCopyFor,
  playerCopy,
  positionAt,
  prefersOriginal,
  progressOf,
  setPrefersOriginal,
  spokenDuration,
  stepPosition,
  useLetterPlayer,
} from '@/lib/player';
import { track } from '@/lib/analytics/track';
import { getActiveChild, getChild, getEntry, type Entry } from '@/lib/store';
import { KEEP_AWAKE_TAGS, useKeepAwakeWhile } from '@/lib/resilience/keep-awake';
import { cn } from '@/lib/utils';
import { useTheme } from '@/lib/a11y';

export interface AudioPlayerProps {
  /** The letter whose recording plays. Typed letters render nothing. */
  entryId: string;
  /** Start as soon as the recording is ready (Read together's "Keep playing"). */
  autoPlay?: boolean;
  onFinish?: () => void;
  /** Read together words for a recording that cannot play here ("Read this one aloud together"). */
  context?: 'letter' | 'readTogether';
  className?: string;
}

/** The pill's height at the default text size (S27); it grows with Dynamic Type, never clips. */
export const PILL_HEIGHT = 56;
/** A finger that moves less than this along the pill is a tap (play or pause), not a drag. */
const TAP_SLOP = 6;

export function AudioPlayer({ entryId, autoPlay, onFinish, context = 'letter', className }: AudioPlayerProps) {
  const entry = useMemo(() => getEntry(entryId), [entryId]);
  if (!entry || entry.captureMode === 'typed') return null;
  const child = (entry.childId ? getChild(entry.childId) : null) ?? getActiveChild();
  const signsAs = child ? authorOf(entry, child) : (entry.authorSignsAs ?? '');
  const availability = availabilityOf(entry, isOwnEntry(entry));

  if (availability === 'otherAuthor') {
    const text = context === 'readTogether' ? copy.readTogether.recordingElsewhere : copy.book.recordingElsewhere;
    return (
      <Text variant="body" tone="muted" className={className} testID="player.elsewhere">
        {fill(text, { signsAs })}
      </Text>
    );
  }
  if (availability !== 'playable') {
    return (
      <Text variant="body" tone="muted" className={className}>
        {context === 'readTogether' ? playerCopy.notOnPhoneReadAloud : playerCopy.notOnPhone}
      </Text>
    );
  }
  return <PlayableRecording entry={entry} signsAs={signsAs} autoPlay={autoPlay} onFinish={onFinish} context={context} className={className} />;
}

function PlayableRecording({
  entry,
  signsAs,
  autoPlay,
  onFinish,
  context,
  className,
}: {
  entry: Entry;
  signsAs: string;
  autoPlay?: boolean;
  onFinish?: () => void;
  context: 'letter' | 'readTogether';
  className?: string;
}) {
  const { c, scheme } = useTheme();
  const listening = useMemo(() => listeningCopyFor(entry), [entry.id, entry.audioUri, entry.audioSha256]); // eslint-disable-line react-hooks/exhaustive-deps
  const [preferOriginal, setPreferOriginal] = useState(prefersOriginal);
  const choice = chooseSource({ originalUri: entry.audioUri!, copy: listening, preferOriginal });
  // Switching between the original and the listening copy keeps the place and the play state.
  const [handoff, setHandoff] = useState<{ at: number; play: boolean } | null>(null);
  const p = useLetterPlayer(choice.uri, {
    fallbackDurationMs: choice.source === 'clearer' ? (listening?.durationMs ?? entry.audioDurationMs) : entry.audioDurationMs,
    autoPlay: handoff ? handoff.play : autoPlay,
    startAt: handoff?.at,
    onFinish,
  });
  // Read together only: the screen stays on while a recording is actually playing, never when idle or paused.
  useKeepAwakeWhile(context === 'readTogether' && p.playing, KEEP_AWAKE_TAGS.readTogether);
  const [width, setWidth] = useState(0);
  const [drag, setDrag] = useState<number | null>(null);
  const startX = useRef<number | null>(null);
  const moved = useRef(false);

  const shown = drag ?? p.position;
  const progress = progressOf(shown, p.duration);
  const remaining = Math.max(0, p.duration - shown);
  const label = p.playing ? copy.readTogether.pauseButton : p.finished ? copy.readTogether.replayButton : fill(copy.book.hearShort, { signsAs });
  const a11yLabel = p.playing
    ? fill(playerCopy.pauseA11y, { signsAs })
    : fill(playerCopy.playA11y, { label: fill(copy.book.hearLink, { signsAs }), duration: spokenDuration(p.duration) });
  const valueText = fill(playerCopy.positionText, { elapsed: formatClock(shown), total: formatClock(p.duration) });
  const at = (x: number) => positionAt(x, width, p.duration);

  const toggle = () => {
    // Only your own recordings play in v1.0, so the author is always you.
    if (!p.playing)
      track('playback_started', {
        surface: context === 'readTogether' ? 'read_together' : 'letter',
        author_relation: 'self',
        version: choice.source === 'original' ? 'original' : 'listening_copy',
      });
    p.toggle();
  };

  const chooseOriginal = (on: boolean) => {
    track('settings_changed', { key: 'listening_copy' });
    setHandoff({ at: handoffPosition(p.position, null), play: p.playing });
    setPreferOriginal(on);
    setPrefersOriginal(on);
  };

  const e = tokens.elevation[2];
  const lifted =
    scheme === 'dark'
      ? { borderWidth: 1, borderColor: c.line }
      : Platform.OS === 'web'
        ? { boxShadow: e.web }
        : { shadowColor: e.shadowColor, shadowOpacity: e.shadowOpacity, shadowRadius: e.shadowRadius, shadowOffset: e.shadowOffset, elevation: e.elevation };

  return (
    <View className={cn('gap-3', className)}>
      <View
        className="flex-row items-center gap-3 rounded-full py-1.5 pl-1.5 pr-5"
        style={[{ minHeight: PILL_HEIGHT, backgroundColor: c.surfaceRaised }, lifted]}
        testID="player.pill">
        <Pressable
          onPress={toggle}
          accessibilityRole="button"
          accessibilityLabel={a11yLabel}
          accessibilityState={{ busy: !p.loaded && !p.error }}
          hitSlop={4}
          testID="player.play"
          className="h-11 w-11 items-center justify-center rounded-full bg-primary active:opacity-80">
          {p.playing ? <PauseIcon size={22} color={c.onAccent} weight="fill" /> : <PlayIcon size={22} color={c.onAccent} weight="fill" />}
        </Pressable>

        <View
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel={playerCopy.scrubLabel}
          accessibilityValue={{ min: 0, max: Math.max(0, Math.round(p.duration)), now: Math.round(shown), text: valueText }}
          accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
          onAccessibilityAction={(ev) => p.seek(stepPosition(p.position, ev.nativeEvent.actionName === 'increment' ? 1 : -1, p.duration))}
          onLayout={(ev) => setWidth(ev.nativeEvent.layout.width)}
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => p.duration > 0}
          onResponderTerminationRequest={() => false}
          onResponderGrant={(ev) => {
            startX.current = ev.nativeEvent.locationX;
            moved.current = false;
          }}
          onResponderMove={(ev) => {
            if (p.duration <= 0) return;
            const x = ev.nativeEvent.locationX;
            if (!moved.current && Math.abs(x - (startX.current ?? x)) < TAP_SLOP) return;
            moved.current = true;
            setDrag(at(x));
          }}
          onResponderRelease={() => {
            if (moved.current && drag !== null) p.seek(drag);
            else toggle();
            setDrag(null);
            startX.current = null;
          }}
          onResponderTerminate={() => {
            setDrag(null);
            startX.current = null;
          }}
          className="min-h-11 flex-1 justify-center"
          testID="player.scrub">
          {/* Children never take the touch, so locationX is always measured on the pill's track. */}
          <View pointerEvents="none" className="flex-row items-baseline gap-3">
            <Text variant="labelSmall" className="flex-1">
              {label}
            </Text>
            <Text variant="footnote" maxFontSizeMultiplier={2} style={{ fontVariant: ['tabular-nums'] }}>
              {formatClock(remaining)}
            </Text>
          </View>
          <View pointerEvents="none" className="absolute bottom-1 left-0 right-0 h-0.5 overflow-hidden rounded-full" style={{ backgroundColor: c.line }}>
            <View className="h-full" style={{ width: `${progress * 100}%`, backgroundColor: c.accent }} />
          </View>
        </View>
      </View>

      {choice.canChoose && (
        <View className="min-h-11 flex-row items-center gap-3">
          <View className="flex-1 gap-0.5">
            <Text variant="subhead">{playerCopy.originalLabel}</Text>
            <Text variant="footnote">{choice.source === 'original' ? playerCopy.originalOn : playerCopy.originalOff}</Text>
          </View>
          <Toggle
            label={playerCopy.originalLabel}
            description={choice.source === 'original' ? playerCopy.originalOn : playerCopy.originalOff}
            value={choice.source === 'original'}
            onValueChange={chooseOriginal}
          />
        </View>
      )}

      {p.error && <Text variant="footnote">{playerCopy.cannotPlay}</Text>}
    </View>
  );
}
