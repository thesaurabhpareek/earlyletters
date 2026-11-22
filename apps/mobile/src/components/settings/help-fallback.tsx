/**
 * The help-link fallback (F20-REQ-005, F20-REQ-007; RT-SET-02, SR-C-09). A crisis line or Write to us row that this
 * device reports it cannot open opens this sheet in the same tap (expected on an iPad, with no SIM, or with no Mail
 * account; to be confirmed by the S1-23 V-10 device check):
 * the number or address as selectable text, and one Copy button. Once copied it says so ("Number copied") in place
 * and to VoiceOver. Nothing is counted, logged or sent (D-034).
 *
 * `useHelpLink()` gives a screen `open(target)` for a row's onPress and the `sheet` element to render once.
 * The decision is help-links.logic.ts `openHelpTarget`, tested in Node (test/settings-help.test.ts).
 */
import * as Clipboard from 'expo-clipboard';
import * as React from 'react';
import { Linking, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Sheet } from '@/components/ui/sheet';
import { Text } from '@/components/ui/text';
import { announce } from '@/lib/a11y';
import { fallbackWords, openHelpTarget, probePhone, type HelpTarget, type PhoneAbility } from './help-links.logic';

/** Whether this device reports it can call (canOpenURL), asked once when the page opens; drives the rows' VoiceOver hints. */
export function usePhoneAbility(): PhoneAbility {
  const [can, setCan] = React.useState<PhoneAbility>({ call: null });
  React.useEffect(() => {
    let live = true;
    void probePhone(Linking).then((a) => live && setCan(a));
    return () => {
      live = false;
    };
  }, []);
  return can;
}

export function useHelpLink(): { open: (target: HelpTarget) => void; sheet: React.ReactNode } {
  const [target, setTarget] = React.useState<HelpTarget | null>(null);
  const open = React.useCallback((t: HelpTarget) => {
    void openHelpTarget(t, Linking).then((r) => {
      if (r.kind === 'fallback') setTarget(r.target);
    });
  }, []);
  const sheet = <HelpFallbackSheet target={target} onClose={() => setTarget(null)} />;
  return { open, sheet };
}

export function HelpFallbackSheet({ target, onClose }: { target: HelpTarget | null; onClose: () => void }) {
  const [copied, setCopied] = React.useState(false);
  // Keep the last words while the sheet animates out.
  const [last, setLast] = React.useState<HelpTarget | null>(target);
  React.useEffect(() => {
    if (target) {
      setLast(target);
      setCopied(false);
    }
  }, [target]);
  const shown = target ?? last;
  const words = fallbackWords(shown?.kind ?? 'call');

  const copyIt = async () => {
    if (!shown) return;
    try {
      await Clipboard.setStringAsync(shown.value);
      setCopied(true);
      announce(words.copied);
    } catch {
      // The value stays on screen as selectable text; a long press still copies it.
    }
  };

  return (
    <Sheet open={target !== null} onClose={onClose} title={words.title} testID="help.fallback">
      <View className="gap-4 pb-2">
        <Text variant="body" tone="muted">
          {words.body}
        </Text>
        <Text variant="headline" selectable testID="help.fallback.value">
          {shown?.value ?? ''}
        </Text>
        <Button size="lg" label={words.copy} onPress={() => void copyIt()} testID="help.fallback.copy" />
        {copied ? (
          <Text variant="subhead" tone="muted" accessibilityLiveRegion="polite" testID="help.fallback.copied">
            {words.copied}
          </Text>
        ) : null}
      </View>
    </Sheet>
  );
}
