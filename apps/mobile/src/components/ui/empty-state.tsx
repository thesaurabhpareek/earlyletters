// web: same composition (later) | android: same code
/**
 * EmptyState (COMPONENTS 2.15): the first-run book, an empty month, no family yet.
 * Warm, never an error, never a count of what is missing (Headspace and Calm empty
 * screens: one living element, plain words, one way forward).
 *
 * - The drawing draws once, then breathes opacity 0.85 to 1 over 8 s while the screen is
 *   focused and the app is active (MOTION 5j). Text and action never move.
 * - Reduce Motion: drawn complete, no breath.
 * - Accessibility: the title is a heading; the drawing is decorative.
 * Screen-level only (it reads navigation focus).
 */
import { useIsFocused } from 'expo-router';
import { View } from 'react-native';
import { Breathe } from '@/components/motion/breathe';
import { Button } from '@/components/ui/button';
import { LineArt, type LineArtName } from '@/components/ui/line-art';
import { QuotePair } from '@/components/ui/quote-pair';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

export type EmptyStateProps = {
  /** The opening quotation pair (brand device) leads instead of the drawing. One mark per screen. */
  device?: boolean;
  art?: LineArtName;
  title: string;
  body?: string;
  action?: { label: string; onPress: () => void; variant?: 'primary' | 'secondary' | 'quiet' };
  align?: 'start' | 'center';
  className?: string;
};

export function EmptyState({ device, art, title, body, action, align = 'start', className }: EmptyStateProps) {
  const focused = useIsFocused();
  const center = align === 'center';
  return (
    <View className={cn('gap-4', center && 'items-center', className)}>
      {device ? (
        <QuotePair height={48} style={center ? { alignSelf: 'center' } : undefined} aligned={!center} />
      ) : art ? (
        <Breathe paused={!focused} style={{ alignSelf: center ? 'center' : 'flex-start', marginLeft: center ? 0 : -16 }}>
          <LineArt name={art} width={168} />
        </Breathe>
      ) : null}
      <View className={cn('gap-2', center && 'items-center')}>
        <Text variant="title1" asHeading className={center ? 'text-center' : undefined}>
          {title}
        </Text>
        {body ? (
          <Text variant="body" tone="muted" className={center ? 'text-center' : undefined}>
            {body}
          </Text>
        ) : null}
      </View>
      {action ? (
        <Button
          variant={action.variant ?? 'primary'}
          size="lg"
          label={action.label}
          onPress={action.onPress}
          className={center ? 'self-center' : 'self-start'}
        />
      ) : null}
    </View>
  );
}
