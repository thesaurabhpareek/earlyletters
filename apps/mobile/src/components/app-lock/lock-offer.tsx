/**
 * The app lock offer at the end of first run, on "The book is open." (CPO-2: offered once, equal weight, off until
 * turned on; design.md 2.3; SETTINGS_AND_ACCOUNT.md section 3).
 *
 * - `Card raised` with two `Button secondary lg` in a ButtonRow: equal weight, never a primary against a quiet one.
 *   ButtonRow stacks them at large text sizes; nothing truncates.
 * - Hidden when the phone has no passcode (the lock could not hold). Until the device answers it renders nothing.
 * - Turn on asks the device first (`appLock.turnOnReason`), so the Face ID permission appears in context. Success: a
 *   `success` haptic and the toast `appLock.onToast.*`, also announced. Cancel: stays off, silent. Face ID turned
 *   off for the app: the passcode is the lock, and the card says so with `appLock.faceIdDenied`.
 * - Either answer closes the card (a cross-fade, swapMs, also the Reduce Motion form). Nothing is asked again.
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
import { announce } from '@/lib/a11y';
import { readLockAbility, turnOn } from '@/lib/app-lock/controller';
import { appLockCopy } from '@/lib/app-lock/copy';
import type { LockAbility } from '@/lib/app-lock/machine';
import { fill } from '@/lib/copy';
import { haptic } from '@/lib/haptics';

const SWAP_IN = FadeIn.duration(tokens.motion.swapMs).reduceMotion(ReduceMotion.Never);
const SWAP_OUT = FadeOut.duration(tokens.motion.swapMs).reduceMotion(ReduceMotion.Never);

export function LockOffer({ child }: { child: string }) {
  const [ability, setAbility] = useState<LockAbility | null>(null);
  const [answered, setAnswered] = useState(false);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  useEffect(() => {
    let live = true;
    void readLockAbility().then((a) => live && setAbility(a));
    return () => {
      live = false;
    };
  }, []);

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
    announce(message);
    setAnswered(true);
  };

  return (
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
          <Button variant="secondary" size="lg" fullWidth label={o.notNow} disabled={busy} onPress={() => setAnswered(true)} testID="appLock.offer.notNow" />
        </ButtonRow>
      </Card>
    </Animated.View>
  );
}
