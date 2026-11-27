// web: same | android: same
/**
 * The From control on Review (NS-16, A-S07 and A-S09; BL-980). Drawn only when `from.offered` (the
 * EXPO_PUBLIC_SIGN_AS_OTHER flag is on and the letter is not kept yet); otherwise the header keeps its plain
 * "From {signsAs}" text. The words are the PROPOSED rows of docs/design/e2e/A-capture/WORDS.md 7.3, read from
 * `screenStates.from` (packages/content/src/features/screen-states.en.ts).
 *
 * One field, one instruction line and no checkbox (NS-16-R18, ruling D9: an instruction to the parent, not an
 * attestation; nothing is recorded). The field reads nothing from Contacts and suggests only this phone's own typed
 * names (NS-16-R4): no textContentType, autofill or autocorrect. A name over 30 characters is announced and Done is off;
 * Keep refuses it too (NS-16-R6), and then this sheet opens with the same line.
 */
import * as React from 'react';
import { Pressable, View } from 'react-native';
import { screenStates } from '@scribe/content';
import { Button } from '@/components/ui/button';
import { Sheet } from '@/components/ui/sheet';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { checkFromName } from '@/lib/capture/sign-as-other.logic';
import type { FromName } from '@/lib/capture/sign-as-other';
import { copy } from '@/lib/copy';

const w = screenStates.from;

export function FromNameControl({ from, label }: { from: FromName; label: string }) {
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => {
    if (from.refusals > 0) setOpen(true);
  }, [from.refusals]);
  const tooLong = !checkFromName(from.typed).ok;
  return (
    <>
      <Pressable onPress={() => setOpen(true)} accessibilityRole="button" accessibilityLabel={label} accessibilityHint={w.rowHintA11y} className="min-h-11 justify-center" testID="review.sheet.from">
        <Text variant="letterDateline" caps tone="muted">
          {label}
        </Text>
      </Pressable>
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title={w.sheetTitle}
        hideClose
        testID="review.from.sheet"
        footer={<Button label={copy.common.doneButton} disabled={tooLong} onPress={() => setOpen(false)} testID="review.from.done" />}>
        <View className="gap-3 px-5 pb-2">
          <TextField
            label={w.fieldLabel}
            value={from.typed}
            onChangeText={from.setTyped}
            autoCapitalize="words"
            autoCorrect={false}
            autoComplete="off"
            textContentType="none"
            spellCheck={false}
            returnKeyType="done"
            helper={w.fieldHint}
            error={tooLong ? w.tooLong : null}
            testID="review.from.field"
          />
          <Text variant="footnote" tone="muted">
            {w.ask}
          </Text>
          {from.recent.length > 0 ? (
            <View className="gap-2">
              <Text variant="labelSmall" tone="muted" asHeading>
                {w.recentTitle}
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {from.recent.map((name, i) => (
                  <Button key={name} variant="outline" size="sm" label={name} onPress={() => from.setTyped(name)} testID={`review.from.recent.${i}`} />
                ))}
              </View>
            </View>
          ) : null}
          <Button variant="quiet" size="sm" label={w.useMineButton} onPress={() => from.setTyped('')} testID="review.from.useMine" />
        </View>
      </Sheet>
    </>
  );
}
