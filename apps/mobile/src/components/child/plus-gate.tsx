import { BooksIcon } from 'phosphor-react-native/src/icons/Books';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { track } from '@/lib/analytics/track';
import { billingCopy, presentPlusStore, redeemOfferCode, usePlan } from '@/lib/billing';
import { devShortcutsAllowed } from '@/lib/build-env';
import { copy, fill } from '@/lib/copy';
import { haptic } from '@/lib/haptics';
import { useTheme } from '@/lib/a11y';

interface Props {
  /**
   * `keep_letter` (D-082, D-083): shown at the Keep step when the free letters are used up. The only
   * variant today; starting a book and Read together are no longer gated.
   */
  variant?: 'keep_letter';
  /** The book's name, for the title only. Never sent anywhere. */
  childName: string;
  /** Plus was bought once and has ended: the sheet says so instead of selling. */
  lapsed?: boolean;
  /** Letters ever kept, a number for analytics. */
  lettersKept: number;
  /**
   * Leave the letter held: it stays on the phone, untouched, waiting in Tonight. The caller leaves
   * Review. Nothing is kept and nothing is lost.
   */
  onHold: () => void;
  /**
   * Plus is on now (bought in Apple's store view, restored, an Ask to Buy approval arrived, or an offer
   * code). The caller shows the letter again for the person to tap Keep themselves (D-083).
   */
  onPlus: () => void;
  /**
   * Development profile only: lets the founder pass the gate without a StoreKit build (Expo Go).
   * Ignored unless `devShortcutsAllowed` (build profile AND __DEV__).
   */
  onContinueDev?: () => void;
}

/**
 * The Keep gate: says plainly that the letter is safe, then hands over to Apple's own subscription store
 * view (ADR 0013), which shows the plans, prices, any free trial the person is eligible for, Restore and
 * the legal links. This screen never types a price or a trial. Content sits near the top (no floating block).
 */
export function PlusGate({ childName, lapsed = false, lettersKept, onHold, onPlus, onContinueDev }: Props) {
  const c = useTheme().c;
  const k = billingCopy.keepGate;
  const g = billingCopy.gate;
  const plan = usePlan();
  const [opening, setOpening] = useState(false);
  const [offline, setOffline] = useState(false);
  const continued = useRef(false);
  const awaitingCode = useRef(false);

  const carryOn = () => {
    if (continued.current) return;
    continued.current = true;
    haptic('success');
    track('plus_started_from_gate', { letters_kept: Math.min(1000, Math.max(0, lettersKept)) });
    if (awaitingCode.current) track('offer_code_redeemed', {});
    onPlus();
  };

  useEffect(() => {
    if (plan.plusOn) carryOn();
  }, [plan.plusOn]); // eslint-disable-line react-hooks/exhaustive-deps

  const canOpen = plan.storeSupport === 'available';
  const note = plan.storeSupport === 'needs_ios_17' ? g.needsNewerIos : plan.storeSupport === 'unsupported' ? g.unavailable : offline ? k.offline : null;

  const open = async () => {
    haptic('tap');
    setOpening(true);
    setOffline(false);
    try {
      track('plus_offer_viewed', { trigger: 'keep_letter' });
      const outcome = await presentPlusStore();
      if (outcome !== 'busy') track('plus_offer_closed', { trigger: 'keep_letter', outcome });
      if (outcome === 'unavailable') setOffline(true);
      if (outcome === 'purchased') carryOn();
    } finally {
      setOpening(false);
    }
  };

  const redeem = async () => {
    haptic('tap');
    awaitingCode.current = true;
    const outcome = await redeemOfferCode();
    if (outcome !== 'presented') {
      awaitingCode.current = false;
      if (outcome === 'unavailable') setOffline(true);
    }
  };

  return (
    <ScrollView contentContainerClassName="gap-4 px-5 pb-10 pt-8">
      <View accessible={false} className="h-14 w-14 items-center justify-center rounded-full bg-secondary">
        <BooksIcon size={28} color={c.accent} />
      </View>
      <Text role="heading" className="font-serif text-3xl leading-10 text-foreground">
        {fill(k.title, { child: childName })}
      </Text>
      <Text className="text-lg leading-7 text-foreground">{lapsed ? k.lapsedBody : k.body}</Text>
      <Text className="text-base leading-6 text-muted-foreground" accessibilityLiveRegion="polite">
        {k.heldNote}
      </Text>
      <View className="gap-3 pt-4">
        {canOpen && (
          <Button size="lg" onPress={open} disabled={opening} accessibilityHint={opening ? g.opening : undefined}>
            <Text>{k.seePlus}</Text>
          </Button>
        )}
        {note && <Text className="text-center text-sm leading-5 text-muted-foreground">{note}</Text>}
        <Button variant="secondary" onPress={onHold}>
          <Text>{k.holdButton}</Text>
        </Button>
        {canOpen && (
          <Button variant="ghost" onPress={redeem} disabled={opening}>
            <Text className="text-primary">{k.redeemLink}</Text>
          </Button>
        )}
        {devShortcutsAllowed && onContinueDev && (
          <Button variant="outline" onPress={onContinueDev}>
            <Text>{copy.common.continueButton}</Text>
          </Button>
        )}
      </View>
    </ScrollView>
  );
}
