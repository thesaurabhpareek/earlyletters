import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { AppState, Linking, ScrollView, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { ChoiceGroup } from '@/components/ui/choice-group';
import { ListSection, ToggleRow } from '@/components/ui/list-row';
import { Text } from '@/components/ui/text';
import { useToast } from '@/components/ui/toast';
import { readLockAbility, setGrace, turnOff, turnOn, useAppLock } from '@/lib/app-lock/controller';
import { appLockCopy } from '@/lib/app-lock/copy';
import { GRACE_CHOICES, type GraceChoice, type LockAbility } from '@/lib/app-lock/machine';
import { haptic } from '@/lib/haptics';

/**
 * Settings > App lock (F1, CISO-1; design.md 2.5; SETTINGS_AND_ACCOUNT.md section 5). One setting, reached from
 * Settings home (and from Privacy once the Privacy page lists it, CDesO-1).
 *
 * - The switch authenticates first, on and off (`turnOnReason`, `turnOffReason`); on plays `success`, off plays
 *   nothing; each change shows a toast, which VoiceOver hears once (`onToast.*`, `offToast`). Cancel leaves it as it was.
 * - "Ask again after" (ChoiceGroup list, native radio state) shows only while the lock is on; 1 minute by default.
 * - No passcode: the switch is disabled with the line saying why. Face ID turned off for the app: the label is
 *   "Lock with passcode", with the line and Open Settings.
 * - Footer: the lock waits for a recording to end, and reminders never show a name while it is on (lib/reminders/prefs.ts).
 * The device is read again when the app comes back to the front (a passcode set or Face ID allowed in iPhone Settings).
 */
export default function AppLockSettings() {
  const lock = useAppLock();
  const toast = useToast();
  const [ability, setAbility] = useState<LockAbility | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let live = true;
    const read = () => void readLockAbility().then((a) => live && setAbility(a));
    read();
    const sub = AppState.addEventListener('change', (s) => s === 'active' && read());
    return () => {
      live = false;
      sub.remove();
    };
  }, []);

  const method = ability?.available ? ability.method : 'passcode';
  const unavailable = ability !== null && !ability.available;
  const faceIdDenied = ability?.available === true && ability.faceIdDenied;

  const onToggle = async (on: boolean) => {
    if (busy || ability === null) return;
    setBusy(true);
    const outcome = on ? await turnOn() : await turnOff();
    setBusy(false);
    if (outcome !== 'ok') return;
    const message = on ? appLockCopy.onToast[method] : appLockCopy.offToast;
    if (on) haptic('success');
    toast.show({ message }); // the toast announces itself once (components/ui/toast.tsx)
  };

  // ChoiceGroup plays its own `tap` and carries the native selected state for VoiceOver.
  const chooseGrace = (g: GraceChoice) => setGrace(g);

  return (
    <>
      <Stack.Screen options={{ title: appLockCopy.pageTitle }} />
      <ScrollView contentContainerClassName="gap-7 px-5 pb-12 pt-4" contentInsetAdjustmentBehavior="automatic">
        <ListSection>
          <ToggleRow
            title={appLockCopy.toggle[method]}
            value={lock.enabled}
            onValueChange={(v) => void onToggle(v)}
            disabled={busy || ability === null || (unavailable && !lock.enabled)}
            testID="appLock.toggle"
          />
        </ListSection>

        {unavailable ? (
          <Text variant="footnote" accessibilityLiveRegion="polite" className="px-4" testID="appLock.noPasscode">
            {appLockCopy.noPasscode}
          </Text>
        ) : null}

        {faceIdDenied ? (
          <View className="gap-2 px-4" testID="appLock.faceIdDenied">
            <Text variant="footnote">{appLockCopy.faceIdDenied}</Text>
            <Button variant="quiet" size="sm" className="self-start" label={appLockCopy.openSettings} onPress={() => void Linking.openSettings()} />
          </View>
        ) : null}

        {lock.enabled ? (
          <ListSection title={appLockCopy.askAfter}>
            <ChoiceGroup
              label={appLockCopy.askAfter}
              layout="list"
              options={GRACE_CHOICES.map((g) => ({ value: g, label: appLockCopy.grace[g] }))}
              value={lock.grace}
              onChange={chooseGrace}
              testID="appLock.grace"
            />
          </ListSection>
        ) : null}

        <View className="gap-2 px-4">
          <Text variant="footnote">{appLockCopy.recordingLine}</Text>
          <Text variant="footnote">{appLockCopy.footer}</Text>
        </View>
      </ScrollView>
    </>
  );
}
