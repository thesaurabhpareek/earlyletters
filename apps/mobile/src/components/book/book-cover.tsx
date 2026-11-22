// web: same (react-native-svg + Reanimated) | android: same
/**
 * BookCover (EXPERIENCE_PASS 5.4): the journey's one object. A paper book with the child's name on it,
 * named in first run (S05), signed (S06), opened (S08), and waiting on the empty Book (S24). It shows
 * the person's own words, nothing else: no image files, no photograph, no invented title.
 *
 *   <BookCover name={name} size="sm" />                                    naming: the name set live
 *   <BookCover name="Asha" signsAs="Mama" size="sm" behindName="Nila" />   twins: a second cover fans behind
 *   <BookCover name="Asha" signsAs="Mama" size="md" state="open" openOnMount />   "The book is open."
 *
 * Look: a 3:4 paper card (`surfaceRaised`, `radius.md`, elevation 1 in light; a 1 pt `line` edge in
 * dark and under Increase Contrast). The registry's small-cut symbol at its head as a book mark. The
 * name in Literata Medium, centred, at most three lines, ending in a fade when it does not fit, never
 * an ellipsis glyph (book-cover.logic.ts sets it with the bundled face's own widths). "From Mama" in
 * Literata Italic on the foot line. Open: the flyleaf, with the name small at the top, one hairline
 * across the middle where the first letter will go, and "From Mama" at the foot.
 *
 * Motion: a new name cross-fades (fadeMs). A new signature cross-fades on the front's foot line on
 * `snappy` (S06: a chip fills the field and the foot line together); the caller passes a typed one after
 * a pause, as it does the name. Opening: the front holds tokens.motion.cover.holdMs, then cross-fades to
 * the flyleaf with a cover.dx shift on `standard` (no 3D flip). Reduce Motion: no cross-fade, and the
 * open state at once. `animate={false}` jumps to the end (a tap that skips).
 *
 * Type on the cover does not grow with Dynamic Type: it is artwork with a measured layout, like the
 * app icon. The same name is always real, scalable text on the screen around it (the name field, the
 * heading), and the cover is hidden from VoiceOver unless given an accessibilityLabel.
 */
import { useEffect, useState } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { FadeIn, FadeOut, ReduceMotion, useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { tokens, type MotionToken } from '@scribe/design-tokens';
import { FadeEdge } from '@/components/motion/excerpt-fade';
import { fadeBox, isRtl } from '@/components/motion/excerpt-fade.logic';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/lib/a11y';
import { copy, fill } from '@/lib/copy';
import { STANDARD_EASING, springConfig, useReducedMotion } from '@/lib/motion';
import {
  FAN,
  SMALL_SYMBOL_ASPECT,
  SMALL_SYMBOL_PATH,
  SMALL_SYMBOL_VIEWBOX,
  coverLineHeight,
  coverMark,
  coverMetrics,
  coverName,
  coverSignature,
  type CoverSize,
  type CoverState,
  type FittedText,
} from './book-cover.logic';

export type BookCoverProps = {
  /** The child's name as typed. Empty: a blank cover. */
  name: string;
  /** What the child calls the writer; the foot line reads "From {signsAs}". */
  signsAs?: string;
  size?: CoverSize;
  state?: CoverState;
  /** With state="open": mount closed, then open (S08's arrival). */
  openOnMount?: boolean;
  /** Twins or more: the next child's name, on a second cover fanned behind this one. */
  behindName?: string;
  /** false: no motion at all, the final state at once (a tap that skips, a list of covers). */
  animate?: boolean;
  /** Expose the cover to VoiceOver as one image with this name. Without it the cover is decorative. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

const M = tokens.motion;

/** How a line of the cover changes: no motion, a fadeMs cross-fade (the name), or one on a spring (the signature). */
type CrossFade = false | 'fade' | MotionToken;

/** No lines: what the foot line holds while there is no signature, so the last one can fade out. */
const NO_LINES: FittedText = { lines: [], fontSize: 0, truncated: false, full: '', broken: false };

export function BookCover({ name, signsAs, size = 'sm', state = 'closed', openOnMount = false, behindName, animate = true, accessibilityLabel, style }: BookCoverProps) {
  const m = coverMetrics(size);
  const fanned = behindName !== undefined;
  const a11y = accessibilityLabel
    ? ({ accessible: true, role: 'img', accessibilityLabel } as const)
    : ({ accessible: false, importantForAccessibility: 'no-hide-descendants', accessibilityElementsHidden: true, 'aria-hidden': true } as const);
  return (
    <View {...a11y} pointerEvents="none" style={[{ width: m.width + (fanned ? FAN.dx + 4 : 0), height: m.height + (fanned ? 6 : 0) }, style]}>
      {fanned ? (
        <View style={{ position: 'absolute', left: FAN.dx, top: 2, transform: [{ rotate: `${FAN.rotateDeg}deg` }] }}>
          <Cover name={behindName} size={size} state="closed" animate={false} />
        </View>
      ) : null}
      <Cover name={name} signsAs={signsAs} size={size} state={state} openOnMount={openOnMount} animate={animate} />
    </View>
  );
}

function Cover({ name, signsAs, size, state, openOnMount = false, animate }: { name: string; signsAs?: string; size: CoverSize; state: CoverState; openOnMount?: boolean; animate: boolean }) {
  const { c, scheme, highContrast } = useTheme();
  const reduced = useReducedMotion();
  const m = coverMetrics(size);
  const still = reduced || !animate;

  // 0 = the front, 1 = the flyleaf.
  const startOpen = state === 'open' && !(openOnMount && !still);
  const p = useSharedValue(startOpen ? 1 : 0);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    const to = state === 'open' ? 1 : 0;
    if (still) {
      p.value = to;
      return;
    }
    const hold = to === 1 ? M.cover.holdMs : 0;
    p.value = withDelay(hold, withTiming(to, { duration: M.enter.durationMs, easing: STANDARD_EASING, reduceMotion: ReduceMotion.Never }));
  }, [state, still, p]);
  const shift = useSharedValue(startOpen ? 1 : 0);
  useEffect(() => {
    const to = state === 'open' ? 1 : 0;
    shift.value = still ? to : withDelay(to === 1 ? M.cover.holdMs : 0, withSpring(to, springConfig('standard')));
  }, [state, still, shift]);
  const front = useAnimatedStyle(() => ({ opacity: 1 - p.value, transform: [{ translateX: -M.cover.dx * shift.value }] }));
  const flyleaf = useAnimatedStyle(() => ({ opacity: p.value, transform: [{ translateX: M.cover.dx * (1 - shift.value) }] }));

  const signature = signsAs ? coverSignature(fill(copy.common.signature, { signsAs }), size) : null;
  const edge = scheme === 'dark' || highContrast;
  const e = tokens.elevation[1];
  const shadow =
    scheme === 'dark'
      ? undefined
      : Platform.OS === 'web'
        ? { boxShadow: e.web }
        : { shadowColor: e.shadowColor, shadowOpacity: e.shadowOpacity, shadowRadius: e.shadowRadius, shadowOffset: e.shadowOffset, elevation: e.elevation };
  const mark = coverMark(scheme);

  return (
    <View
      style={[
        { width: m.width, height: m.height, borderRadius: m.radius, backgroundColor: c.surfaceRaised },
        edge ? { borderWidth: 1, borderColor: c.line } : null,
        shadow,
      ]}>
      <View style={[StyleSheet.absoluteFill, { borderRadius: m.radius, overflow: 'hidden' }]}>
        {/* The front: the book mark at the head, the name, the signature on the foot line. */}
        <Animated.View style={[StyleSheet.absoluteFill, { padding: m.pad, alignItems: 'center' }, front]}>
          <Svg width={m.symbolHeight * SMALL_SYMBOL_ASPECT} height={m.symbolHeight} viewBox={SMALL_SYMBOL_VIEWBOX}>
            <Path d={SMALL_SYMBOL_PATH} fill={mark.fill ?? c.text} />
          </Svg>
          <View style={{ marginTop: m.gap, width: m.textWidth, height: m.name.lines * m.name.lineHeight }}>
            <NameLines key={name} set={coverName(name, size, 'closed')} surface={c.surfaceRaised} crossFade={mounted && !still && 'fade'} />
          </View>
          <FootLine set={signature ?? NO_LINES} size={size} surface={c.surfaceRaised} crossFade={mounted && !still && 'snappy'} />
        </Animated.View>
        {/* The flyleaf: the name small at the top, a hairline where the first letter will go, the signature at the foot. */}
        <Animated.View style={[StyleSheet.absoluteFill, { padding: m.pad, alignItems: 'center' }, flyleaf]}>
          <View style={{ width: m.textWidth, height: m.flyleafName.lines * m.flyleafName.lineHeight }}>
            <NameLines set={coverName(name, size, 'open')} surface={c.surfaceRaised} crossFade={false} />
          </View>
          <View style={{ position: 'absolute', left: m.pad * 1.5, right: m.pad * 1.5, top: m.height / 2, height: StyleSheet.hairlineWidth * 2, backgroundColor: c.line }} />
          {signature ? <FootLine set={signature} size={size} surface={c.surfaceRaised} crossFade={false} /> : null}
        </Animated.View>
      </View>
    </View>
  );
}

/**
 * "From Mama" on the foot line, at the size coverSignature fitted. The lines are keyed by the words, so a new
 * signature fades in over the old one fading out (and a removed one fades out) when `crossFade` is set.
 */
function FootLine({ set, size, surface, crossFade }: { set: FittedText; size: CoverSize; surface: string; crossFade: CrossFade }) {
  const m = coverMetrics(size);
  return (
    <View style={{ position: 'absolute', left: m.signature.inset, right: m.signature.inset, bottom: m.pad, height: m.signature.lineHeight }}>
      <NameLines key={set.full} set={set} italic surface={surface} crossFade={crossFade} />
    </View>
  );
}

/** The entering and exiting fades for a cross-fade: fadeMs, or the spring token's own settle. */
function crossFades(kind: Exclude<CrossFade, false>) {
  if (kind === 'fade') {
    return { entering: FadeIn.duration(M.fadeMs).reduceMotion(ReduceMotion.Never), exiting: FadeOut.duration(M.fadeMs).reduceMotion(ReduceMotion.Never) };
  }
  const s = springConfig(kind);
  return {
    entering: FadeIn.springify().stiffness(s.stiffness).damping(s.damping).mass(s.mass).reduceMotion(ReduceMotion.Never),
    exiting: FadeOut.springify().stiffness(s.stiffness).damping(s.damping).mass(s.mass).reduceMotion(ReduceMotion.Never),
  };
}

/** Lines set by book-cover.logic, centred, with the fade on the last one when the text did not fit. */
function NameLines({ set, italic = false, surface, crossFade }: { set: FittedText; italic?: boolean; surface: string; crossFade: CrossFade }) {
  const fontSize = set.fontSize;
  const lineHeight = coverLineHeight(fontSize, italic);
  if (set.lines.length === 0) return null;
  const box = fadeBox(set.lines.length, lineHeight, isRtl(set.full));
  const fades = crossFade ? crossFades(crossFade) : undefined;
  return (
    <Animated.View entering={fades?.entering} exiting={fades?.exiting} style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]}>
      <Text
        variant={italic ? 'signature' : 'title2'}
        maxFontSizeMultiplier={1}
        style={{ fontSize, lineHeight, letterSpacing: 0, textAlign: 'center' }}>
        {set.lines.join('\n')}
      </Text>
      {set.truncated ? <FadeEdge color={surface} side={box.side} style={{ position: 'absolute', top: box.top, height: box.height, width: `${box.widthPct}%`, [box.side]: 0 }} /> : null}
    </Animated.View>
  );
}
