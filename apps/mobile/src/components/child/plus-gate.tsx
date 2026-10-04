import type { Decision } from '@scribe/core';
import { BooksIcon } from 'phosphor-react-native/src/icons/Books';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ScrollView, View, useColorScheme } from 'react-native';
import { tokens } from '@scribe/design-tokens';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { track } from '@/lib/analytics/track';
import { billingCopy, presentPlusStore, usePlan } from '@/lib/billing';
import { devShortcutsAllowed } from '@/lib/build-env';
import { copy } from '@/lib/copy';
import { haptic } from '@/lib/haptics';

interface Props {
  onNotNow: () => void;
  /**
   * Plus is on now (bought in Apple's store view, restored, or an Ask to Buy
   * approval arrived while this was open). The caller carries on.
   */
  onPlus?: () => void;
  /**
   * Development profile only: lets the founder pass the gate without a
   * StoreKit build (Expo Go). Ignored unless `devShortcutsAllowed` (build
   * profile AND __DEV__), so no preview or store build can show it.
   */
  onContinueDev?: () => void;
  /** Defaults are the second-book gate (PRD C 4.1, C-REQ-023). */
  title?: string;
  body?: string;
  keepNote?: string;
  icon?: ReactNode;
  /**
   * The plan engine's decision (lib/billing). An offer shows the button that
   * opens Apple's store view; a quiet decision (a birthday, a contributor)
   * explains without selling. Defaults to an offer.
   */
  decision?: Decision;
  /** What asked for Plus, for `plus_offer_viewed` (analytics only). */
  trigger?: 'second_child' | 'read_together';
}

/**
 * The Plus gate: says what this needs, then hands over to Apple's own
 * subscription store view (ADR 0013), which shows the plans, prices, any free
 * trial, Restore and the legal links. Content sits near the top (no floating block).
 */
export function PlusGate({ onNotNow, onPlus, onContinueDev, title, body, keepNote, icon, decision, trigger = 'second_child' }: Props) {
  const c = tokens[useColorScheme() === 'dark' ? 'dark' : 'light'];
  const x = copy.childrenExtra;
  const g = billingCopy.gate;
  const plan = usePlan();
  const [opening, setOpening] = useState(false);
  const continued = useRef(false);

  const carryOn = () => {
    if (continued.current) return;
    continued.current = true;
    haptic('success');
    onPlus?.();
  };

  useEffect(() => {
    if (plan.plusOn) carryOn();
  }, [plan.plusOn]); // eslint-disable-line react-hooks/exhaustive-deps

  const offer = !decision || decision.kind === 'offer';
  const canOpen = offer && plan.storeSupport === 'available';
  const note = !offer
    ? decision?.kind === 'quiet' && decision.reason === 'birthday'
      ? g.birthday
      : decision?.kind === 'quiet' && decision.reason === 'contributor'
        ? g.contributor
        : null
    : plan.storeSupport === 'needs_ios_17'
      ? g.needsNewerIos
      : plan.storeSupport === 'unsupported'
        ? g.unavailable
        : null;

  const open = async () => {
    haptic('tap');
    setOpening(true);
    try {
      track('plus_offer_viewed', { trigger });
      const outcome = await presentPlusStore();
      if (outcome !== 'busy') track('plus_offer_closed', { trigger, outcome });
      if (outcome === 'purchased') carryOn();
    } finally {
      setOpening(false);
    }
  };

  return (
    <ScrollView contentContainerClassName="gap-4 px-5 pb-10 pt-8">
      <View accessible={false} className="h-14 w-14 items-center justify-center rounded-full bg-secondary">
        {icon ?? <BooksIcon size={28} color={c.accent} />}
      </View>
      <Text role="heading" className="font-serif text-3xl leading-10 text-foreground">
        {title ?? x.plusGateTitle}
      </Text>
      <Text className="text-lg leading-7 text-foreground">{body ?? copy.children.add.plusNote}</Text>
      <Text className="text-base leading-6 text-muted-foreground">{keepNote ?? copy.children.add.keepNote}</Text>
      <View className="gap-3 pt-4">
        {canOpen && (
          <Button size="lg" onPress={open} disabled={opening} accessibilityHint={opening ? g.opening : undefined}>
            <Text>{x.plusCta}</Text>
          </Button>
        )}
        {note && <Text className="text-center text-sm leading-5 text-muted-foreground">{note}</Text>}
        <Button variant="ghost" onPress={onNotNow}>
          <Text className="text-primary">{copy.common.notNowButton}</Text>
        </Button>
        {devShortcutsAllowed && onContinueDev && (
          <Button variant="outline" onPress={onContinueDev}>
            <Text>{copy.common.continueButton}</Text>
          </Button>
        )}
      </View>
    </ScrollView>
  );
}
