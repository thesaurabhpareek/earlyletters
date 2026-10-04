// web: same (design preview) | android: same code
/**
 * Co-parent sharing, coming soon (founder decision, 3 Oct 2026). v1.0 ships on
 * this phone only, so writing a book together arrives in a later update. This is
 * the one presentation for the Family tab and every invite entry point
 * (lib/family/entry.logic.ts): calm, warm, never a dead end or an error.
 *
 * Pattern: Apple's "what's new" sheets and Calm's feature screens: one line
 * drawing on a soft wash, a quiet status, a serif title, three plain points with
 * glyphs, and one optional action.
 *
 * - "Tell me when it's here" stores a day on this phone (lib/family/coming-soon.logic.ts):
 *   no network, no account. It turns into a quiet confirmation. Two content-free events measure the
 *   teaser (coparent_soon_opened, coparent_soon_notify); nothing else leaves the phone.
 * - Remote config `flags.familyTeaser = 'quiet'` keeps the drawing and a plain line
 *   about this phone and drops the teaser copy. It cannot turn sharing on.
 *
 * Accessibility: the drawing is decorative; headings in reading order (Family,
 * then the title); each point is one element ("title. body"); the status reads
 * "Coming soon"; the confirmation is announced. Text scales with Dynamic Type
 * (display and title caps from tokens only). Reduce Motion: the drawing is shown
 * complete and does not breathe; the confirmation fades.
 * Motion: the drawing draws once and breathes while focused (MOTION 5h, 5j);
 * controls never animate in (MOTION principle 2).
 */
import { useIsFocused } from 'expo-router';
import { CheckCircleIcon } from 'phosphor-react-native/src/icons/CheckCircle';
import { DevicesIcon } from 'phosphor-react-native/src/icons/Devices';
import { HandHeartIcon } from 'phosphor-react-native/src/icons/HandHeart';
import { PenNibIcon } from 'phosphor-react-native/src/icons/PenNib';
import type { Icon } from 'phosphor-react-native';
import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Breathe } from '@/components/motion/breathe';
import { Button } from '@/components/ui/button';
import { LineArt } from '@/components/ui/line-art';
import { Text } from '@/components/ui/text';
import { announce, useTheme } from '@/lib/a11y';
import { copy, fill } from '@/lib/copy';
import { familyCopy } from '@/lib/family/copy';
import { hasRequestedCoParentNotify, requestCoParentNotify } from '@/lib/family/coming-soon.logic';
import { track } from '@/lib/analytics/track';
import { haptic } from '@/lib/haptics';
import { useMotion } from '@/lib/motion';
import { useRemoteConfig } from '@/lib/remote';
import { getSetting, setSetting, subscribe } from '@/lib/store';

const settings = { getSetting, setSetting };
const POINT_ICONS: readonly Icon[] = [PenNibIcon, DevicesIcon, HandHeartIcon];

/** The local "tell me" flag, live (another screen may have set it). */
function useNotifyRequested(): [boolean, () => void] {
  const [requested, setRequested] = useState(() => hasRequestedCoParentNotify(settings));
  useEffect(() => subscribe(() => setRequested(hasRequestedCoParentNotify(settings))), []);
  const request = () => {
    requestCoParentNotify(settings, new Date());
    setRequested(true);
  };
  return [requested, request];
}

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

function NotifyAction() {
  const { c } = useTheme();
  const { enter } = useMotion();
  const [requested, request] = useNotifyRequested();
  const n = familyCopy.soon.notify;

  if (requested) {
    return (
      <Animated.View entering={enter(0)} accessible accessibilityLiveRegion="polite" accessibilityLabel={n.done} className="min-h-14 flex-row items-center gap-3 rounded-2xl bg-secondary px-4 py-3">
        <CheckCircleIcon size={24} color={c.success} weight="fill" />
        <Text variant="callout" className="flex-1">
          {n.done}
        </Text>
      </Animated.View>
    );
  }
  return (
    <Button
      variant="secondary"
      size="lg"
      fullWidth
      label={n.button}
      accessibilityHint={n.hint}
      onPress={() => {
        haptic('success');
        request();
        track('coparent_soon_notify', {}); // content-free: no book, no child, no text
        announce(n.done);
      }}
    />
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
      contentContainerClassName={sheet ? 'px-6 pb-8 pt-10' : 'px-5 pb-14 pt-4'}
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
            <NotifyAction />
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
    <SafeAreaView edges={['bottom']} className="flex-1 bg-background">
      {body}
      {onClose ? (
        <View className="border-t border-border px-6 pb-4 pt-2">
          <Button variant="quiet" size="lg" fullWidth label={s.close} onPress={onClose} />
        </View>
      ) : null}
    </SafeAreaView>
  );
}
