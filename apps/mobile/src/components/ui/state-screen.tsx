// web: same | android: same
/**
 * StateScreen and InlineState (COMPONENTS 2.15a): the one pattern for loading, empty, error and
 * not-found states (state-screen.logic.ts holds the rules).
 *
 *   StateScreen   the whole screen is the state (a stale link, a missing draft, microphone off, a
 *                 crash). A centred block with 20 pt gutters: the picture, the heading in title2, one
 *                 sentence in body; the primary action is full width at the bottom, a quiet second
 *                 option beneath it. Pass `header` for the modal's Close (ModalHeader). Content scrolls,
 *                 actions stay put, so nothing clips at AX5.
 *   InlineState   the state of one region inside a screen that has other content (Review while words
 *                 are on their way, a failed transcription). Same words, drawn as a calm card.
 *
 * The picture is one of three slots (EXPERIENCE_PASS S13, S23, S37, S49):
 *   art       a line drawing (the kind's default: page, envelope, moon), shown complete
 *   glyph     a Phosphor icon in a 72 pt accentSoft circle, Light weight, textMuted (MicrophoneSlash)
 *   drawing   anything the screen brings (the book cover, the held letter)
 *
 * Motion: the block arrives with one 200 ms fade, which is also its Reduce Motion form. Loading
 * never spins: its drawing breathes (Breathe, 8 s, off under Reduce Motion) and the region is
 * announced as busy. Nothing else moves: no lamp, no draw-on, no breath in the hard moments.
 * Error and not-found are the same warm block as empty, never red.
 * Accessibility: heading first; the picture is decorative; live region polite; actions are buttons
 * with their words as names.
 */
import type { Icon as PhosphorIcon } from 'phosphor-react-native';
import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import Animated, { FadeIn, ReduceMotion } from 'react-native-reanimated';
import { tokens } from '@scribe/design-tokens';
import { Breathe } from '@/components/motion/breathe';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LineArt, type LineArtName } from '@/components/ui/line-art';
import { SafeAreaView } from '@/components/ui/safe-area-view';
import { actionLayout, STATE_LAYOUT, STATE_SPEC, stateA11y, stateVisual, type StateAction, type StateKind } from '@/components/ui/state-screen.logic';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/lib/a11y';
import { STANDARD_EASING } from '@/lib/motion';
import { useIsFocused } from 'expo-router';

type ActionWithIcon = StateAction & { icon?: PhosphorIcon };

type Common = {
  kind: StateKind;
  title: string;
  body?: string;
  /** A line drawing; the kind's default when no other picture is given. */
  art?: LineArtName;
  /** A Phosphor glyph in a soft circle, in place of the drawing (MicrophoneSlash, WarningCircle). */
  glyph?: PhosphorIcon;
  /** The way forward. Omit for loading. */
  primary?: ActionWithIcon;
  /** Quiet options under the primary (Open Settings). */
  quiet?: readonly StateAction[];
};

export type StateScreenProps = Common & {
  /** Top bar for a modal: ModalHeader with Close. Pushed screens leave this out (the native header is there). */
  header?: ReactNode;
  /** The screen's own picture in place of a drawing or glyph (the book cover, the held letter). */
  drawing?: ReactNode;
};

/** The one entrance: a token-length fade. It is also the Reduce Motion form, so it always runs. */
const ARRIVE = FadeIn.duration(tokens.motion.fadeMs).easing(STANDARD_EASING).reduceMotion(ReduceMotion.Never);

function Actions({ kind, primary, quiet }: Pick<Common, 'kind' | 'primary' | 'quiet'>) {
  const layout = actionLayout(kind, primary, quiet);
  if (!layout.primary && layout.quiet.length === 0) return null;
  const main = layout.primary as ActionWithIcon | null;
  return (
    <View className="gap-1">
      {main ? <Button size="lg" fullWidth label={main.label} icon={main.icon} onPress={main.onPress} testID={main.testID} /> : null}
      {layout.quiet.map((a) => (
        <Button key={a.label} variant="quiet" fullWidth label={a.label} onPress={a.onPress} testID={a.testID} />
      ))}
    </View>
  );
}

/** The glyph slot: a Phosphor icon, Light weight, in a 72 pt accentSoft circle (S13). */
export function StateGlyph({ icon: Glyph }: { icon: PhosphorIcon }) {
  const { c } = useTheme();
  const g = STATE_LAYOUT.glyph;
  return (
    <View accessible={false} importantForAccessibility="no-hide-descendants" aria-hidden style={{ width: g.circle, height: g.circle, borderRadius: g.circle / 2, backgroundColor: c.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
      <Glyph size={g.size} weight={g.weight} color={c.textMuted} />
    </View>
  );
}

/** Screen-level: the loading drawing breathes only while its screen is focused. */
export function StateScreen(props: StateScreenProps) {
  return <StateScreenView {...props} focused={useIsFocused()} />;
}

/**
 * The same screen without reading navigation, for any caller outside a navigator. (The root crash screen is
 * components/resilience/error-boundary.tsx, which stays plain React Native so it still draws when providers fail.)
 */
export function StateScreenView({ kind, title, body, art, glyph, drawing, primary, quiet, header, focused = true }: StateScreenProps & { focused?: boolean }) {
  const visual = stateVisual(kind, { art, glyph, drawing });
  const L = STATE_LAYOUT;
  const picture =
    visual.slot === 'drawing' ? (
      drawing
    ) : visual.slot === 'glyph' && glyph ? (
      <StateGlyph icon={glyph} />
    ) : visual.breathes ? (
      <Breathe paused={!focused}>
        <LineArt name={visual.art} width={L.artWidth} animate={visual.drawsOn} />
      </Breathe>
    ) : (
      <LineArt name={visual.art} width={L.artWidth} animate={visual.drawsOn} />
    );
  return (
    <SafeAreaView className="flex-1 bg-background">
      {header}
      <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: L.gutter, paddingVertical: tokens.space[6] }} showsVerticalScrollIndicator={false}>
        <Animated.View entering={ARRIVE} {...stateA11y(kind)} style={{ alignItems: 'center', gap: tokens.space[4] }}>
          {picture}
          <View style={{ alignItems: 'center', gap: tokens.space[2] }}>
            <Text variant={L.title} asHeading style={{ textAlign: 'center' }}>
              {title}
            </Text>
            {body ? (
              <Text variant={L.body} tone="muted" style={{ textAlign: 'center' }}>
                {body}
              </Text>
            ) : null}
          </View>
        </Animated.View>
      </ScrollView>
      <View style={{ paddingHorizontal: L.gutter, paddingBottom: tokens.space[3], paddingTop: tokens.space[2] }}>
        <Actions kind={kind} primary={primary} quiet={quiet} />
      </View>
    </SafeAreaView>
  );
}

export type InlineStateProps = Common & {
  /** Extra content under the sentence: a progress line while loading. */
  children?: ReactNode;
  /** Spoken name when the visible text is not enough (loading with a count). */
  accessibilityLabel?: string;
  /**
   * Loading's drawing holds still (Review while "Hear it" plays, S14). Every other kind's drawing, when `art` names
   * one, is always still: in the hard moments nothing moves (EXPERIENCE_PASS S16).
   */
  still?: boolean;
};

export function InlineState({ kind, title, body, art, glyph, primary, quiet, children, accessibilityLabel, still = false }: InlineStateProps) {
  const spec = STATE_SPEC[kind];
  const focused = useIsFocused();
  // Loading always has its drawing (breathing unless held still); other kinds show one only when `art` names it (S16).
  const drawing = kind === 'loading' ? (art ?? spec.art) : art;
  return (
    <Card padding={6} radius="xl" className="gap-4" accessibilityLabel={accessibilityLabel} {...stateA11y(kind)}>
      {glyph ? (
        <StateGlyph icon={glyph} />
      ) : drawing && kind === 'loading' ? (
        <Breathe paused={!focused || still}>
          <LineArt name={drawing} width={96} style={{ marginLeft: -8 }} />
        </Breathe>
      ) : drawing ? (
        <LineArt name={drawing} width={96} animate={false} style={{ marginLeft: -8 }} />
      ) : null}
      <View className="gap-1.5">
        <Text variant="headline" asHeading>
          {title}
        </Text>
        {body ? <Text variant="callout">{body}</Text> : null}
      </View>
      {children}
      <Actions kind={kind} primary={primary} quiet={quiet} />
    </Card>
  );
}
