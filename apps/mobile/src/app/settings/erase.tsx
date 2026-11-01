import { router, Stack } from 'expo-router';
import { FileTextIcon } from 'phosphor-react-native/src/icons/FileText';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { typedWordMatches } from '@/components/settings/wipe.logic';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { ErrorLine } from '@/lib/auth/ui';
import { useTheme } from '@/lib/a11y';
import { copy } from '@/lib/copy';
import { eraseEverything } from '@/lib/erase-everything';
import { haptic } from '@/lib/haptics';
import { localDeletionAllowed } from '@/lib/store';

const PAGE = 'gap-7 px-5 pb-12 pt-4';

/**
 * Settings > Your data > Erase everything on this phone (BL-387; F17 6.2 F step 1; DATA-REQ-024, F14-REQ-026).
 * Signed out only. Step 1 says what is erased and what stays, with Export everything first. Step 2 asks for the typed
 * word. Then lib/erase-everything.ts removes every book, letter, recording and setting, resets the free-letter count
 * and clears our reminders; the age question comes back by itself (lib/age-gate.ts re-reads its setting), then first
 * run. Nothing goes to Recently deleted and nothing is sent. Device owner authentication (F17 6.2 F) needs
 * expo-local-authentication, which is not in this build: the typed word is the only check (PR note for counsel).
 */
export default function EraseEverything() {
  const e = copy.settings.erase;
  const colors = useTheme().c;
  const [step, setStep] = useState<'review' | 'confirm'>('review');
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState<null | 'incomplete' | 'signed_in'>(null);
  const header = <Stack.Screen options={{ title: e.title }} />;

  if (!localDeletionAllowed()) {
    return (
      <ScrollView contentContainerClassName={PAGE} contentInsetAdjustmentBehavior="automatic">
        {header}
        <Text variant="body">{e.signedIn}</Text>
      </ScrollView>
    );
  }

  if (step === 'confirm') {
    const ready = typedWordMatches(typed, e.typeWord) && !busy;
    const confirm = async () => {
      if (!ready) return;
      haptic('warning');
      setBusy(true);
      const r = await eraseEverything();
      // 'erased': the store is empty and the age question replaces every screen (root layout). Nothing more here.
      if (r !== 'erased') {
        setBusy(false);
        setFailed(r);
      }
    };
    return (
      <ScrollView key="confirm" contentContainerClassName={PAGE} contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled">
        {header}
        <View className="gap-2">
          <Text variant="title2" asHeading>
            {e.confirmHeading}
          </Text>
          <Text variant="body">{e.confirmBody}</Text>
        </View>
        <TextField
          label={e.typeLabel}
          value={typed}
          onChangeText={setTyped}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="off"
          spellCheck={false}
          returnKeyType="done"
          editable={!busy}
          testID="erase.typed"
        />
        {failed ? <ErrorLine message={failed === 'signed_in' ? e.signedIn : e.incomplete} /> : null}
        <View className="gap-2">
          <Button
            variant="destructive"
            size="lg"
            fullWidth
            disabled={!ready}
            loading={busy}
            accessibilityLabel={e.confirmButton}
            className={ready ? 'bg-destructive' : 'border border-input'}
            onPress={() => void confirm()}
            testID="erase.confirm">
            <Text tone={ready ? 'onDestructive' : 'muted'}>{e.confirmButton}</Text>
          </Button>
          <Button variant="quiet" fullWidth disabled={busy} label={e.back} onPress={() => router.back()} testID="erase.keep" />
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView key="review" contentContainerClassName={PAGE} contentInsetAdjustmentBehavior="automatic">
      {header}
      <View className="gap-2">
        <Text variant="title2" asHeading>
          {e.heading}
        </Text>
        <Text variant="body">{e.body}</Text>
        <Text variant="body">{e.freeLetters}</Text>
        <Text variant="subhead" tone="muted">
          {e.speechStays}
        </Text>
        <Text variant="subhead" tone="muted">
          {e.onThisPhone}
        </Text>
      </View>

      <Card variant="raised" radius="md" padding={4}>
        <View className="flex-row items-center gap-3">
          <FileTextIcon size={24} color={colors.accent} />
          <Text variant="headline" asHeading className="flex-1">
            {copy.settings.delete.bookExportFirst}
          </Text>
        </View>
        <Button size="lg" className="self-start" label={copy.settings.export.button} onPress={() => router.push('/settings/export')} testID="erase.export" />
      </Card>

      <View className="gap-2">
        <Button variant="outline" size="lg" fullWidth label={copy.common.continueButton} onPress={() => setStep('confirm')} testID="erase.continue" />
        <Button variant="quiet" fullWidth label={e.back} onPress={() => router.back()} />
      </View>
    </ScrollView>
  );
}
