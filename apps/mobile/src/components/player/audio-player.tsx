// web: same component over <audio> later | android: same code; verify TalkBack adjustable gestures (COMPONENTS 2.21)
import { PauseIcon } from 'phosphor-react-native/src/icons/Pause';
import { PlayIcon } from 'phosphor-react-native/src/icons/Play';
import { useMemo, useState } from 'react';
import { Pressable, Switch, View, useColorScheme } from 'react-native';
import { tokens } from '@scribe/design-tokens';
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
import { getActiveChild, getChild, getEntry, type Entry } from '@/lib/store';
import { cn } from '@/lib/utils';

export interface AudioPlayerProps {
  /** The letter whose recording plays. Typed letters render nothing. */
  entryId: string;
  /** Start as soon as the recording is ready (Read together's "Play the next one on its own"). */
  autoPlay?: boolean;
  onFinish?: () => void;
  /** Read together words for a recording that cannot play here ("Read this one aloud together"). */
  context?: 'letter' | 'readTogether';
  className?: string;
}

/**
 * A letter's recording (COMPONENTS 2.21). v1.0 plays only your own
 * recordings from this phone; for anyone else's letter, or a file that is
 * not here, it says where the recording is kept instead.
 */
export function AudioPlayer({ entryId, autoPlay, onFinish, context = 'letter', className }: AudioPlayerProps) {
  const entry = useMemo(() => getEntry(entryId), [entryId]);
  if (!entry || entry.captureMode === 'typed') return null;
  const child = (entry.childId ? getChild(entry.childId) : null) ?? getActiveChild();
  const signsAs = child ? authorOf(entry, child) : (entry.authorSignsAs ?? '');
  const availability = availabilityOf(entry, isOwnEntry(entry));

  if (availability === 'otherAuthor') {
    const text = context === 'readTogether' ? copy.readTogether.recordingElsewhere : copy.book.recordingElsewhere;
    return <Text className={cn('text-base text-muted-foreground', className)}>{fill(text, { signsAs })}</Text>;
  }
  if (availability !== 'playable') {
    return (
      <Text className={cn('text-base text-muted-foreground', className)}>
        {context === 'readTogether' ? playerCopy.notOnPhoneReadAloud : playerCopy.notOnPhone}
      </Text>
    );
  }
  return <PlayableRecording entry={entry} signsAs={signsAs} autoPlay={autoPlay} onFinish={onFinish} className={className} />;
}

function PlayableRecording({
  entry,
  signsAs,
  autoPlay,
  onFinish,
  className,
}: {
  entry: Entry;
  signsAs: string;
  autoPlay?: boolean;
  onFinish?: () => void;
  className?: string;
}) {
  const c = tokens[useColorScheme() === 'dark' ? 'dark' : 'light'];
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
  const [width, setWidth] = useState(0);
  const [drag, setDrag] = useState<number | null>(null);

  const shown = drag ?? p.position;
  const progress = progressOf(shown, p.duration);
  const label = p.playing ? copy.readTogether.pauseButton : p.finished ? copy.readTogether.replayButton : fill(copy.book.hearShort, { signsAs });
  const a11yLabel = p.playing
    ? fill(playerCopy.pauseA11y, { signsAs })
    : fill(playerCopy.playA11y, { label: fill(copy.book.hearLink, { signsAs }), duration: spokenDuration(p.duration) });
  const valueText = fill(playerCopy.positionText, { elapsed: formatClock(shown), total: formatClock(p.duration) });
  const at = (x: number) => positionAt(x, width, p.duration);

  const chooseOriginal = (on: boolean) => {
    setHandoff({ at: handoffPosition(p.position, null), play: p.playing });
    setPreferOriginal(on);
    setPrefersOriginal(on);
  };

  return (
    <View className={cn('gap-2', className)}>
      <Pressable
        onPress={p.toggle}
        accessibilityRole="button"
        accessibilityLabel={a11yLabel}
        accessibilityState={{ busy: !p.loaded && !p.error }}
        className="min-h-14 flex-row items-center gap-3 self-start rounded-full bg-secondary py-1.5 pl-1.5 pr-5 active:opacity-80">
        <View className="h-11 w-11 items-center justify-center rounded-full bg-primary">
          {p.playing ? <PauseIcon size={22} color={c.onAccent} weight="fill" /> : <PlayIcon size={22} color={c.onAccent} weight="fill" />}
        </View>
        <Text className="text-base font-medium text-foreground">{label}</Text>
      </Pressable>

      <View
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={playerCopy.scrubLabel}
        accessibilityValue={{ min: 0, max: Math.max(0, Math.round(p.duration)), now: Math.round(shown), text: valueText }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(e) => p.seek(stepPosition(p.position, e.nativeEvent.actionName === 'increment' ? 1 : -1, p.duration))}
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        onStartShouldSetResponder={() => p.duration > 0}
        onMoveShouldSetResponder={() => p.duration > 0}
        onResponderTerminationRequest={() => false}
        onResponderGrant={(e) => setDrag(at(e.nativeEvent.locationX))}
        onResponderMove={(e) => setDrag(at(e.nativeEvent.locationX))}
        onResponderRelease={() => {
          if (drag !== null) p.seek(drag);
          setDrag(null);
        }}
        onResponderTerminate={() => setDrag(null)}
        className="h-11 justify-center">
        {/* Children never take the touch, so locationX is always measured on the track.
            No animation anywhere: the fill steps with the time, which reads the same with Reduce Motion on. */}
        <View pointerEvents="none" className="h-1.5 overflow-hidden rounded-full" style={{ backgroundColor: c.line }}>
          <View className="h-full" style={{ width: `${progress * 100}%`, backgroundColor: c.accent }} />
        </View>
        <View
          pointerEvents="none"
          className="absolute h-4 w-4 rounded-full"
          style={{ left: Math.max(0, Math.min(width - 16, progress * width - 8)), backgroundColor: c.accent }}
        />
      </View>

      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="flex-row justify-between">
        <Text maxFontSizeMultiplier={2} className="text-sm text-muted-foreground" style={{ fontVariant: ['tabular-nums'] }}>
          {formatClock(shown)}
        </Text>
        <Text maxFontSizeMultiplier={2} className="text-sm text-muted-foreground" style={{ fontVariant: ['tabular-nums'] }}>
          {formatClock(p.duration)}
        </Text>
      </View>

      {choice.canChoose && (
        <View className="min-h-11 flex-row items-center gap-3">
          <View className="flex-1 gap-0.5">
            <Text className="text-sm font-medium text-foreground">{playerCopy.originalLabel}</Text>
            <Text className="text-sm leading-5 text-muted-foreground">{choice.source === 'original' ? playerCopy.originalOn : playerCopy.originalOff}</Text>
          </View>
          <Switch
            value={choice.source === 'original'}
            onValueChange={chooseOriginal}
            accessibilityLabel={playerCopy.originalLabel}
            accessibilityHint={choice.source === 'original' ? playerCopy.originalOn : playerCopy.originalOff}
            trackColor={{ true: c.accent }}
          />
        </View>
      )}

      {p.error && <Text className="text-sm text-muted-foreground">{playerCopy.cannotPlay}</Text>}
    </View>
  );
}
