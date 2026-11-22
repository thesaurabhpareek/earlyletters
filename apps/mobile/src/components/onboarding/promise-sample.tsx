// web: same | android: same
/**
 * The promise specimen (EXPERIENCE_PASS S04): show a small fix instead of describing one. "For example", then a
 * fictional sentence the real engine has cleaned (promise-sample.logic.ts), with each small fix marked the Review way:
 * the words it took out stay in place, in `textMuted`, under a 1.5 pt `editMark` strike. A tap on a mark puts the
 * words back; "Put back." with Undo then stands in for the hint under the card until Undo.
 *
 * Type: the UI sans (`callout`), never the letter face: these are the app's own words, not a letter (VOICE), and
 * the sample is unsigned.
 * Motion (MOTION 5d, 5.5 "strike draw", "put back"): once the title has entered, each strike draws across its words
 * (400 ms, M3 easing, 120 ms apart). Put back: the strike and the muted words go out over 120 ms, the words come back
 * in over 160 ms with a 1.6 s `accentSoft` wash, and the `tap` (selection) haptic. Undo reverses it. Reduce Motion:
 * strikes complete from the first frame, and put back is one 200 ms fade.
 * Accessibility: the sentence is one element that reads every word in order, each mark said as "Taken out: um,";
 * putting a mark back is one of its actions (VoiceOver: swipe up or down), and so is Undo. Each mark is a 44 pt
 * target for touch.
 */
import { useEffect, useMemo, useState } from 'react';
import { Pressable, View, useWindowDimensions, type AccessibilityActionEvent } from 'react-native';
import Animated, { FadeIn, ReduceMotion, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { tokens } from '@scribe/design-tokens';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { announce, useTheme } from '@/lib/a11y';
import { copy, fill, pendingCopy } from '@/lib/copy';
import { haptic } from '@/lib/haptics';
import { STANDARD_EASING, useReducedMotion } from '@/lib/motion';
import { promiseSample, putBackFix, sampleA11yLabel, undoPutBack, type SamplePiece } from './promise-sample.logic';

const M = tokens.motion;
/** The strike draws across its words this long, the next one this much later (EXPERIENCE_PASS 5.5). */
const STRIKE = { drawMs: 400, apartMs: 120 } as const;
/** Put back: out, then in (MOTION 5d). */
const PUT_BACK = { outMs: 120, inMs: 160 } as const;
/** The sample's type: the UI sans, never the letter face. */
const TYPE = tokens.type.callout;

export function PromiseSample() {
  const p = copy.onboarding.promise;
  const sample = useMemo(() => promiseSample(p.sampleRaw), [p.sampleRaw]);
  // The fixes put back, in the order they were put back (Undo returns the last one).
  const [putBack, setPutBack] = useState<number[]>([]);
  const last = putBack.length ? putBack[putBack.length - 1] : null;
  const { fontScale } = useWindowDimensions();
  // A word space in the sample's face at the reader's text size (callout is uncapped Dynamic Type).
  const space = Math.round(TYPE.fontSize * fontScale * 0.25);

  const markText = (edit: number) => sample.pieces.find((x): x is Extract<SamplePiece, { kind: 'mark' }> => x.kind === 'mark' && x.edit === edit)?.text ?? '';

  const putBackMark = (edit: number) => {
    if (putBack.includes(edit)) return;
    haptic('tap');
    setPutBack((all) => putBackFix(all, edit));
    announce(`${pendingCopy.review.putBack} ${markText(edit)}`);
  };
  const undo = () => {
    if (last === null) return;
    haptic('tap');
    setPutBack(undoPutBack);
  };

  const marks = sample.pieces.filter((x): x is Extract<SamplePiece, { kind: 'mark' }> => x.kind === 'mark');
  const actions = [
    ...marks.filter((m) => !putBack.includes(m.edit)).map((m) => ({ name: `putBack:${m.edit}`, label: `${copy.review.undoEditButton}: ${m.text}` })),
    ...(last !== null ? [{ name: 'undo', label: copy.common.undoButton }] : []),
  ];
  const onAction = (e: AccessibilityActionEvent) => {
    const name = e.nativeEvent.actionName;
    if (name === 'undo') undo();
    else if (name.startsWith('putBack:')) putBackMark(Number(name.slice('putBack:'.length)));
  };

  return (
    <View className="gap-2">
      <Card variant="raised" radius="md" padding={4} className="gap-2">
        <Text variant="caption" caps tone="muted">
          {p.sampleLabel}
        </Text>
        <View
          accessible
          accessibilityRole="text"
          accessibilityLabel={sampleA11yLabel(sample, putBack, (words) => fill(copy.review.removedWordsA11y, { name: words }))}
          accessibilityActions={actions}
          onAccessibilityAction={onAction}
          testID="promise.sample"
          className="flex-row flex-wrap"
          style={{ columnGap: space }}>
          {sample.pieces.map((piece, i) => {
            if (piece.kind === 'word') {
              return (
                <Text key={i} variant="callout">
                  {piece.text}
                </Text>
              );
            }
            const order = marks.findIndex((m) => m.edit === piece.edit);
            return <Mark key={i} text={piece.text} order={order} back={putBack.includes(piece.edit)} onPress={() => putBackMark(piece.edit)} />;
          })}
        </View>
      </Card>
      {/* Under the card: the hint, or "Put back. Undo" in its place. One height for both, so nothing below moves. */}
      <View className="min-h-11 justify-center" accessibilityLiveRegion="polite">
        {last !== null ? (
          <Animated.View key="putBack" entering={FadeIn.duration(M.swapMs).reduceMotion(ReduceMotion.Never)} className="flex-row flex-wrap items-center gap-x-1">
            <Text variant="footnote">{pendingCopy.review.putBack}</Text>
            <Button variant="quiet" size="sm" label={copy.common.undoButton} onPress={undo} className="-ml-2" testID="promise.undo" />
          </Animated.View>
        ) : (
          <Animated.View key="hint" entering={FadeIn.duration(M.swapMs).reduceMotion(ReduceMotion.Never)}>
            <Text variant="footnote">{p.sampleHint}</Text>
          </Animated.View>
        )}
      </View>
    </View>
  );
}

/**
 * One mark: the words an edit took out, struck through in place. 44 pt for touch (hitSlop around the words); the
 * sentence's own element carries its name and actions for VoiceOver, so the mark itself is not a separate stop.
 */
function Mark({ text, order, back, onPress }: { text: string; order: number; back: boolean; onPress: () => void }) {
  const { c } = useTheme();
  const reduced = useReducedMotion();
  const { fontScale } = useWindowDimensions();
  const lineHeight = TYPE.lineHeight * fontScale;
  // 0 = not drawn yet, 1 = drawn across the words.
  const draw = useSharedValue(reduced ? 1 : 0);
  // 1 = taken out (muted, struck), 0 = put back (plain words).
  const out = useSharedValue(back ? 0 : 1);
  const wash = useSharedValue(0);

  useEffect(() => {
    if (reduced) {
      draw.value = 1;
      return;
    }
    // After the title and body have entered (enter.durationMs), one strike after another.
    draw.value = withDelay(M.enter.durationMs + order * STRIKE.apartMs, withTiming(1, { duration: STRIKE.drawMs, easing: STANDARD_EASING, reduceMotion: ReduceMotion.Never }));
  }, [reduced, order, draw]);

  useEffect(() => {
    const t = (to: number, ms: number) => withTiming(to, { duration: reduced ? M.fadeMs : ms, easing: STANDARD_EASING, reduceMotion: ReduceMotion.Never });
    out.value = back ? t(0, PUT_BACK.outMs) : t(1, PUT_BACK.inMs);
    if (back) {
      // The words just put back carry the accentSoft wash, fading over newMarkMs (MOTION 5d).
      wash.value = 1;
      wash.value = withDelay(PUT_BACK.inMs, withTiming(0, { duration: M.newMarkMs - PUT_BACK.inMs, reduceMotion: ReduceMotion.Never }));
    } else wash.value = 0;
  }, [back, reduced, out, wash]);

  const mutedStyle = useAnimatedStyle(() => ({ opacity: out.value }));
  const plainStyle = useAnimatedStyle(() => ({ opacity: 1 - out.value }));
  const washStyle = useAnimatedStyle(() => ({ opacity: wash.value }));
  const strikeStyle = useAnimatedStyle(() => ({ opacity: out.value, transform: [{ scaleX: draw.value }] }));
  // 44 pt each way: the slop comes from the measured words, so a short mark ("um,") still reaches 44 pt wide.
  const [width, setWidth] = useState(0);
  const pad = Math.max(0, (tokens.target.min - lineHeight) / 2);
  const side = Math.max(8, Math.ceil((tokens.target.min - width) / 2));

  return (
    <Pressable
      onPress={back ? undefined : onPress}
      disabled={back}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      hitSlop={{ top: pad, bottom: pad, left: side, right: side }}
      accessible={false}
      testID={back ? undefined : 'promise.mark'}>
      <Animated.View pointerEvents="none" style={[{ position: 'absolute', top: 0, bottom: 0, left: -2, right: -2, borderRadius: 4, backgroundColor: c.accentSoft }, washStyle]} />
      {/* The plain words sit underneath and set the size; the muted, struck copy lies over them while taken out. */}
      <Animated.View style={plainStyle}>
        <Text variant="callout">{text}</Text>
      </Animated.View>
      <Animated.View pointerEvents="none" style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }, mutedStyle]}>
        <Text variant="callout" tone="muted">
          {text}
        </Text>
      </Animated.View>
      <Animated.View
        pointerEvents="none"
        style={[
          { position: 'absolute', left: 0, right: 0, top: Math.round(lineHeight * 0.54), height: tokens.stroke.editMark, backgroundColor: c.editMark, transformOrigin: 'left' },
          strikeStyle,
        ]}
      />
    </Pressable>
  );
}
