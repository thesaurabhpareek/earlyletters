import { router, Stack, useFocusEffect } from 'expo-router';
import { FileTextIcon } from 'phosphor-react-native/src/icons/FileText';
import { useCallback, useRef, useState } from 'react';
import { Alert, BackHandler, Platform, ScrollView, View } from 'react-native';
import { eraseConfirmDialog, eraseNoteKeys, runEraseEverything, type ErasePhase } from '@/components/settings/wipe.logic';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StateScreen } from '@/components/ui/state-screen';
import { Text } from '@/components/ui/text';
import { ErrorLine } from '@/lib/auth/ui';
import { announce, useTheme } from '@/lib/a11y';
import { showSubscriptionNotice } from '@/lib/account-deletion/logic';
import { PLUS_ALPHA } from '@/lib/billing/alpha';
import { usePlan } from '@/lib/billing';
import { copy } from '@/lib/copy';
import { eraseEverything } from '@/lib/erase-everything';
import { haptic } from '@/lib/haptics';
import { localDeletionAllowed } from '@/lib/store';

const PAGE = 'gap-7 px-5 pb-12 pt-4';

/**
 * Settings > Your data > Erase everything on this phone (design 2.12; BL-387; F17 6.2 F; DATA-REQ-024, F14-REQ-026).
 * Signed out only. Step 1 says what is erased and what stays, with Export your book first. Step 2 is the system
 * confirm (wipe.logic.ts eraseConfirmDialog: Keep everything first as cancel, "Erase" second and destructive, never
 * the default) with a warning haptic. Then the Erasing screen, with no way out until the erase ends: no back button,
 * no swipe, and Android's back is held. lib/erase-everything.ts removes every book, letter, recording and setting,
 * resets the free-letter count and clears our reminders; the age question then replaces every screen by itself
 * (lib/age-gate.ts re-reads its setting), and the done line is announced. Nothing goes to Recently deleted and
 * nothing is sent. Device owner authentication before erase (design 2.12, F17 6.2 F) is deferred to the 1 Dec build
 * by the CTO ruling of 8 Nov (the app lock, #640, is in the build; asking it here is the follow-up). The lock itself is
 * reset by the erase (lib/erase-everything.ts).
 */
export default function EraseEverything() {
  const e = copy.settings.erase;
  const colors = useTheme().c;
  const [phase, setPhase] = useState<ErasePhase>('review');
  const [failed, setFailed] = useState<null | 'failed' | 'signed_in'>(null);
  const erasing = phase === 'erasing';
  const erasingRef = useRef(false);
  erasingRef.current = erasing;
  // The same signal as Settings > Delete account's Plus card: Plus that will renew, or not yet known.
  const plusRenews = showSubscriptionNotice(usePlan().details);

  // Android's back does nothing while erasing (the native stack's swipe is off below; this holds the hardware key).
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== 'android') return;
      const sub = BackHandler.addEventListener('hardwareBackPress', () => erasingRef.current);
      return () => sub.remove();
    }, []),
  );

  const header = <Stack.Screen options={{ title: e.title, headerBackVisible: !erasing, gestureEnabled: !erasing }} />;

  if (!localDeletionAllowed() && !erasing) {
    return (
      <ScrollView contentContainerClassName={PAGE} contentInsetAdjustmentBehavior="automatic">
        {header}
        <Text variant="body">{e.signedIn}</Text>
      </ScrollView>
    );
  }

  if (erasing) {
    return (
      <>
        {header}
        <StateScreen kind="loading" title={e.busy} />
      </>
    );
  }

  const askToErase = () => {
    haptic('warning');
    const d = eraseConfirmDialog(e, () => {
      void runEraseEverything({
        erase: () => eraseEverything(),
        setPhase,
        setFailed,
        announceDone: () => announce(e.doneA11y),
      });
    });
    Alert.alert(d.title, d.body, d.buttons);
  };

  const notes = eraseNoteKeys({ alpha: PLUS_ALPHA, plusRenews });

  return (
    <ScrollView key="review" contentContainerClassName={PAGE} contentInsetAdjustmentBehavior="automatic">
      {header}
      <View className="gap-2">
        <Text variant="title2" asHeading>
          {e.heading}
        </Text>
        <Text variant="body">{e.body}</Text>
        {/* One list, one style, so the order drawn is the order VoiceOver reads (wipe.logic.ts eraseNoteKeys). #552, F5:
            no letter limit in alpha and no Plus products there, so the Plus and free-letter lines are left out. */}
        {notes.map((k) => (
          <Text key={k} variant="subhead" tone="muted">
            {e[k]}
          </Text>
        ))}
      </View>

      {/* AX5: Export first, so it comes before the erase button at every size (design 2.12). */}
      <Card variant="raised" radius="md" padding={4}>
        <View className="flex-row items-center gap-3">
          <FileTextIcon size={24} color={colors.accent} />
          <Text variant="headline" asHeading className="flex-1">
            {e.exportFirst}
          </Text>
        </View>
        <Button size="lg" className="self-start" label={e.exportButton} onPress={() => router.push('/settings/export')} testID="erase.export" />
      </Card>

      <View className="gap-2">
        {failed ? <ErrorLine message={failed === 'signed_in' ? e.signedIn : e.failed} /> : null}
        {/* Destructive, not the large button (design 2.12). */}
        <Button variant="destructive" fullWidth label={e.button} onPress={askToErase} testID="erase.continue" />
      </View>
    </ScrollView>
  );
}
