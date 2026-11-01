// web: same (design preview) | android: same code
/**
 * Co-parent sharing, coming soon (founder decision, 3 Oct 2026). v1.0 ships on
 * this phone only, so writing a book together arrives in a later update. This is
 * the one presentation for the Family tab and every invite entry point
 * (lib/family/entry.logic.ts): calm, warm, never a dead end or an error.
 *
 * Pattern: Apple's "what's new" sheets and Calm's feature screens: one line
 * drawing on a soft wash, a quiet status, a serif title, three plain points with
 * glyphs, and no action.
 *
 * - No "Tell me when it's here" (SET-08, 31 Oct 2026): its confirmation promised a note "here" when the
 *   update arrives, and no build keeps that promise yet (the arrival card ships with co-parent sharing, a
 *   later 1.0.x under D-121). The button returns with that card. A day already stored on a phone
 *   (lib/family/coming-soon.logic.ts) is kept for it. One content-free event (coparent_soon_opened) counts
 *   how often the screen is seen; nothing else leaves the phone.
 * - Remote config `flags.familyTeaser = 'quiet'` keeps the drawing and a plain line
 *   about this phone and drops the teaser copy. It cannot turn sharing on.
 *
 * Accessibility: the drawing is decorative; headings in reading order (Family,
 * then the title); each point is one element ("title. body"); the status reads
 * "Coming soon". Text scales with Dynamic Type
 * (display and title caps from tokens only). Reduce Motion: the drawing is shown
 * complete and does not breathe.
 * Motion: the drawing draws once and breathes while focused (MOTION 5h, 5j);
 * controls never animate in (MOTION principle 2).
 */
import { useIsFocused } from 'expo-router';
import { DevicesIcon } from 'phosphor-react-native/src/icons/Devices';
import { HandHeartIcon } from 'phosphor-react-native/src/icons/HandHeart';
import { PenNibIcon } from 'phosphor-react-native/src/icons/PenNib';
import type { Icon } from 'phosphor-react-native';
import { useEffect } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Breathe } from '@/components/motion/breathe';
import { LineArt } from '@/components/ui/line-art';
import { ModalHeader } from '@/components/ui/screen-header';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/lib/a11y';
import { copy, fill } from '@/lib/copy';
import { familyCopy } from '@/lib/family/copy';
import { track } from '@/lib/analytics/track';
import { useRemoteConfig } from '@/lib/remote';

const POINT_ICONS: readonly Icon[] = [PenNibIcon, DevicesIcon, HandHeartIcon];

function StatusChip({ label }: { label: string }) {
  const { c } = useTheme();
  return (
    <View accessible accessibilityLabel={label} className="flex-row items-center gap-2 self-center rounded-full bg-secondary px-3 py-1.5">
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: c.accent }} />
      <Text variant="caption" tone="accent" caps>
        {label}
      </Text>
    </View>
  );
}

function Point({ icon: Glyph, title, body }: { icon: Icon; title: string; body: string }) {
  const { c } = useTheme();
  return (
    <View accessible accessibilityLabel={`${title}. ${body}`} className="flex-row items-start gap-4">
      <View className="h-11 w-11 items-center justify-center rounded-full bg-secondary">
        <Glyph size={22} color={c.accent} />
      </View>
      <View className="flex-1 gap-0.5 pt-0.5">
        <Text variant="headline">{title}</Text>
        <Text variant="subhead" tone="muted">
          {body}
        </Text>
      </View>
    </View>
  );
}

export type CoParentSoonProps = {
  /** 'screen': the Family tab (large "Family" title). 'sheet': an invite route, with Close. */
  presentation: 'screen' | 'sheet';
  /** The open book's name; null before there is a book. */
  childName: string | null;
  onClose?: () => void;
};

export function CoParentSoon({ presentation, childName, onClose }: CoParentSoonProps) {
  const focused = useIsFocused();
  const { familyTeaser } = useRemoteConfig().flags;
  const s = familyCopy.soon;
  const child = childName?.trim() || s.childFallback;
  const quiet = familyTeaser === 'quiet';
  const sheet = presentation === 'sheet';

  // Content-free count of how often the teaser is seen. The tab stays mounted, so this fires each time it comes into focus.
  useEffect(() => {
    if (focused) track('coparent_soon_opened', { surface: sheet ? 'sheet' : 'tab' });
  }, [focused, sheet]);

  const body = (
    <ScrollView
      contentContainerClassName={sheet ? 'px-6 pb-8 pt-4' : 'px-5 pb-14 pt-4'}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}>
      {!sheet && (
        <Text variant="display" asHeading={1}>
          {copy.family.title}
        </Text>
      )}

      <View className={sheet ? 'items-center gap-5' : 'mt-4 items-center gap-5'}>
        <Breathe paused={!focused}>
          <LineArt name="together" width={232} />
        </Breathe>
        {!quiet && <StatusChip label={s.status} />}
        <Text variant="title1" asHeading={sheet ? 1 : 2} className="text-center">
          {fill(quiet ? s.quiet.title : s.title, { child })}
        </Text>
        <Text variant="body" tone="muted" className="max-w-[340px] text-center">
          {fill(quiet ? s.quiet.body : s.lead, { child })}
        </Text>
      </View>

      {!quiet && (
        <>
          <View className="mt-9 gap-6">
            {s.points.map((p, i) => (
              <Point key={p.title} icon={POINT_ICONS[i] ?? PenNibIcon} title={p.title} body={fill(p.body, { child })} />
            ))}
          </View>

          <View className="mt-9 gap-4 border-t border-border pt-6">
            <Text variant="subhead" tone="muted">
              {s.building}
            </Text>
          </View>
        </>
      )}
    </ScrollView>
  );

  if (!sheet) {
    return (
      <SafeAreaView edges={['top']} className="flex-1 bg-background">
        {body}
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* The modal idiom: Close, top right (lib/navigation.logic.ts). */}
      {onClose ? <ModalHeader onClose={onClose} closeLabel={s.close} /> : null}
      {body}
    </SafeAreaView>
  );
}
