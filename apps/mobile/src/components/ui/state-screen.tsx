// web: same | android: same
/**
 * StateScreen and InlineState (COMPONENTS 2.15, built on EmptyState): the one pattern for
 * loading, empty, error and not-found states (state-screen.logic.ts holds the rules).
 *
 *   StateScreen   the whole screen is the state (a stale link, a missing draft, microphone off, a
 *                 crash). Art + heading + sentence centred in a scrolling area; the primary action is
 *                 full width at the bottom, a quiet second option beneath it. Pass `header` for the
 *                 modal's Close (ModalHeader). Content scrolls, actions stay put, so nothing clips at AX5.
 *   InlineState   the state of one region inside a screen that has other content (Review while words
 *                 are on their way, a failed transcription). Same words, drawn as a calm card.
 *
 * Loading never spins: the drawing breathes (Breathe, 8 s, off under Reduce Motion) and the region
 * is announced as busy. Error and not-found are the same warm card as empty, never red.
 * Accessibility: heading first; the drawing is decorative; live region polite; actions are buttons
 * with their words as names.
 */
import type { Icon as PhosphorIcon } from 'phosphor-react-native';
import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { Breathe } from '@/components/motion/breathe';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyStateView } from '@/components/ui/empty-state';
import { LineArt, type LineArtName } from '@/components/ui/line-art';
import { SafeAreaView } from '@/components/ui/safe-area-view';
import { actionLayout, STATE_SPEC, stateA11y, type StateAction, type StateKind } from '@/components/ui/state-screen.logic';
import { Text } from '@/components/ui/text';
import { useIsFocused } from 'expo-router';

type ActionWithIcon = StateAction & { icon?: PhosphorIcon };

type Common = {
  kind: StateKind;
  title: string;
  body?: string;
  art?: LineArtName;
  /** The way forward. Omit for loading. */
  primary?: ActionWithIcon;
  /** Quiet options under the primary (Open Settings). */
  quiet?: readonly StateAction[];
};

export type StateScreenProps = Common & {
  /** Top bar for a modal: ModalHeader with Close. Pushed screens leave this out (the native header is there). */
  header?: ReactNode;
};

function Actions({ kind, primary, quiet }: Pick<Common, 'kind' | 'primary' | 'quiet'>) {
  const layout = actionLayout(kind, primary, quiet);
  if (!layout.primary && layout.quiet.length === 0) return null;
  const main = layout.primary as ActionWithIcon | null;
  return (
    <View className="gap-1">
      {main ? <Button size="lg" fullWidth label={main.label} icon={main.icon} onPress={main.onPress} /> : null}
      {layout.quiet.map((a) => (
        <Button key={a.label} variant="quiet" fullWidth label={a.label} onPress={a.onPress} />
      ))}
    </View>
  );
}

/** Screen-level: the drawing breathes only while its screen is focused. */
export function StateScreen(props: StateScreenProps) {
  return <StateScreenView {...props} focused={useIsFocused()} />;
}

/**
 * The same screen without reading navigation: for the root ErrorBoundary, which renders when the
 * navigator itself has crashed and so has no navigation context to read.
 */
export function StateScreenView({ kind, title, body, art, primary, quiet, header, focused = true }: StateScreenProps & { focused?: boolean }) {
  const spec = STATE_SPEC[kind];
  const drawing = art ?? spec.art;
  return (
    <SafeAreaView className="flex-1 bg-background">
      {header}
      <ScrollView className="flex-1" contentContainerClassName="flex-grow justify-center px-6 py-6" showsVerticalScrollIndicator={false}>
        <View {...stateA11y(kind)}>
          {kind === 'loading' ? (
            <View className="gap-4">
              <Breathe paused={!focused} style={{ marginLeft: -16 }}>
                <LineArt name={drawing} width={168} />
              </Breathe>
              <Text variant="title1" asHeading>
                {title}
              </Text>
              {body ? (
                <Text variant="body" tone="muted">
                  {body}
                </Text>
              ) : null}
            </View>
          ) : (
            <EmptyStateView art={drawing} title={title} body={body} focused={focused} />
          )}
        </View>
      </ScrollView>
      <View className="px-5 pb-3 pt-2">
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
};

export function InlineState({ kind, title, body, primary, quiet, children, accessibilityLabel }: InlineStateProps) {
  const spec = STATE_SPEC[kind];
  const focused = useIsFocused();
  return (
    <Card padding={6} radius="xl" className="gap-4" accessibilityLabel={accessibilityLabel} {...stateA11y(kind)}>
      {kind === 'loading' ? (
        <Breathe paused={!focused}>
          <LineArt name={spec.art} width={96} style={{ marginLeft: -8 }} />
        </Breathe>
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
