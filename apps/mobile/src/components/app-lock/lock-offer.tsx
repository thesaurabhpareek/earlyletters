/**
 * The app lock offer (CPO-2: equal weight, off until turned on; design.md 2.3; SETTINGS_AND_ACCOUNT.md section 3). Offered
 * in session 3, the third session that ended in a kept letter, over the Book (NX-31-R14; lib/app-lock/offer.logic.ts,
 * components/asks/lock-offer-ask.tsx). It is not on "The book is open." any more: the first night is for the letter.
 * Face ID here locks the book on this phone; it is not how anyone signs in, and the card never says it is.
 *
 * - `Card raised` with two `Button secondary lg` in a ButtonRow: equal weight, never a primary against a quiet one.
 *   ButtonRow stacks them at large text sizes; nothing truncates.
 * - Hidden when the phone has no passcode (the lock could not hold). Until the device answers it renders nothing.
 * - Turn on asks the device first (`appLock.turnOnReason`), so the Face ID permission appears in context. Success: a
 *   `success` haptic and the toast `appLock.onToast.*` (the toast announces itself once, with the faceIdDenied line when it applies). Cancel: stays off, silent. Face ID turned
 *   off for the app: the passcode is the lock, and the card says so with `appLock.faceIdDenied`.
 * - Either answer closes the card (a cross-fade, swapMs, also the Reduce Motion form) and tells `onAnswered`, which records
 *   it. Quitting before an answer records nothing. Cancelling the Face ID sheet is not an answer: the card stays, with no error.
 *   `onShown` fires once when the card appears; `onUnavailable` when the phone cannot hold a lock (no passcode).
 * - VoiceOver: title (heading), body, Turn on, Not now.
 */
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeIn, FadeOut, ReduceMotion } from 'react-native-reanimated';
import { tokens } from '@scribe/design-tokens';
import { Button, ButtonRow } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { useToast } from '@/components/ui/toast';
import { readLockAbility, turnOn } from '@/lib/app-lock/controller';
import { appLockCopy } from '@/lib/app-lock/copy';
import type { LockAbility } from '@/lib/app-lock/machine';
import { fill } from '@/lib/copy';
import { haptic } from '@/lib/haptics';

const SWAP_IN = FadeIn.duration(tokens.motion.swapMs).reduceMotion(ReduceMotion.Never);
const SWAP_OUT = FadeOut.duration(tokens.motion.swapMs).reduceMotion(ReduceMotion.Never);

export type LockOfferAnswer = 'turnedOn' | 'notNow';

export function LockOffer({
  child,
  onAnswered,
  onShown,
  onUnavailable,
}: {
  child: string;
  onAnswered?: (answer: LockOfferAnswer) => void;
  onShown?: () => void;
  onUnavailable?: () => void;
}) {
  const [ability, setAbility] = useState<LockAbility | null>(null);
  const [answered, setAnswered] = useState(false);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  useEffect(() => {
    let live = true;
    void readLockAbility().then((a) => {
      if (!live) return;
      setAbility(a);
      if (a.available) onShown?.();
      else onUnavailable?.();
    });
    return () => {
      live = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!ability || !ability.available || answered) return null;
  const method = ability.method;
  const o = appLockCopy.offer;

  const onTurnOn = async () => {
    if (busy) return;
    setBusy(true);
    const outcome = await turnOn();
    setBusy(false);
    if (outcome !== 'ok') return; // Cancel: stays off, no error
    haptic('success');
    const message = appLockCopy.onToast[method];
    toast.show({ message: ability.faceIdDenied ? `${message} ${appLockCopy.faceIdDenied}` : message });
    setAnswered(true);
    onAnswered?.('turnedOn');
  };

  return (
    // The one fade on a card with controls (MOTION principle 2 says controls do not animate in): it arrives after an
    // async device read, so it cross-fades in at swapMs rather than popping in mid-step; also the Reduce Motion form.
    <Animated.View entering={SWAP_IN} exiting={SWAP_OUT} className="self-stretch" testID="appLock.offer">
      <Card variant="raised">
        <View className="gap-2">
          <Text variant="headline" asHeading={2}>
            {fill(o.title, { child })}
          </Text>
          <Text variant="subhead" tone="muted">
            {o.body[method]}
          </Text>
          {ability.faceIdDenied ? (
            <Text variant="footnote" tone="muted" testID="appLock.offer.faceIdDenied">
              {appLockCopy.faceIdDenied}
            </Text>
          ) : null}
        </View>
        <ButtonRow>
          <Button variant="secondary" size="lg" fullWidth label={o.turnOn[method]} loading={busy} onPress={() => void onTurnOn()} testID="appLock.offer.turnOn" />
          <Button variant="secondary" size="lg" fullWidth label={o.notNow} disabled={busy} onPress={() => {
              setAnswered(true);
              onAnswered?.('notNow');
            }} testID="appLock.offer.notNow" />
        </ButtonRow>
      </Card>
    </Animated.View>
  );
}
