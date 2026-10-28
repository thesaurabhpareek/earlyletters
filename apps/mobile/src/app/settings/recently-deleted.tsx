import { router, Stack } from 'expo-router';
import { TrashIcon } from 'phosphor-react-native/src/icons/Trash';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import Animated, { FadeOut, LinearTransition, ReduceMotion } from 'react-native-reanimated';
import { tokens } from '@scribe/design-tokens';
import { ConfirmSheet } from '@/components/book/confirm-sheet';
import { eraseOutcome, restoredLine, shelfActions, shelfDateLine, shelfRow, type ShelfRowView } from '@/components/book/shelf.logic';
import { ExcerptFade } from '@/components/motion/excerpt-fade';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StateScreen } from '@/components/ui/state-screen';
import { UIProvider } from '@/components/ui/provider';
import { Text } from '@/components/ui/text';
import { useToast } from '@/components/ui/toast';
import { useTheme } from '@/lib/a11y';
import { track } from '@/lib/analytics/track';
import { capabilities } from '@/lib/capabilities';
import { eraseDeletedLetter } from '@/lib/capture/erase';
import { copy, fill, pendingCopy } from '@/lib/copy';
import { haptic } from '@/lib/haptics';
import { useReducedMotion } from '@/lib/motion';
import { getActiveChild, getChild, listDeleted, subscribeTo, undeleteEntry, type DeletedEntry } from '@/lib/store';
import { authorOf } from '@/components/child/child-store';
import { bookCopy } from '@/components/book/copy';

/**
 * Recently deleted (D-085, debate Q-014, EXPERIENCE_PASS S38, S39, S63): a letter the person deletes waits here for
 * 30 days with its recording, then the launch purge erases it (file first, then the row). Restore puts it back exactly
 * as it was. Erase now ends the wait: the letter and its recording are erased for good, after one question.
 *
 * Each card holds the person's words as they are (letterBody, two lines that end in a fade; every word in the
 * accessibility label), who it is from, and one line joining the two dates ("Deleted October 13. Kept here until
 * November 12."). Calm on purpose: no countdown, no count of what is left.
 *
 * Every toast replaces the one on screen (components/ui/toast), so after Erase now no "Back in Asha's book." can sit
 * under "Letter erased.". Restore's toast carries "Open"; Erase now's carries no action, so it may time out. If the
 * recording's file cannot be removed, the letter was not erased and the toast says so ("The letter was not erased. It is still
 * in Recently deleted."); the card stays, with Erase now to try again.
 *
 * A build that syncs shows no Erase now until the server erase exists (S63, F17-REQ-025): the card shows its date
 * line, from the server's deleted_at plus 30 days, and the letter goes at the server purge.
 */
export default function RecentlyDeleted() {
  return (
    <UIProvider>
      <Shelf />
    </UIProvider>
  );
}

function Shelf() {
  const d = copy.settings.delete;
  const toast = useToast();
  const reduced = useReducedMotion();
  const read = useCallback(() => listDeleted(), []);
  const [rows, setRows] = useState(read);
  const [erasing, setErasing] = useState<string | null>(null);
  useEffect(() => subscribeTo('entries', () => setRows(read())), [read]);
  const actions = shelfActions({ sync: capabilities.sync });

  const restore = (e: DeletedEntry) => {
    haptic('tap');
    undeleteEntry(e.id);
    track('letter_deleted', { action: 'restored', destination: e.inBook ? 'book' : 'private' });
    setRows(read());
    const child = (e.childId ? getChild(e.childId) : null) ?? getActiveChild();
    toast.show({
      message: restoredLine(d, child?.name),
      action: { label: d.openButton, testID: 'shelf.open', onPress: () => router.push({ pathname: '/letter/[id]', params: { id: e.id } }) },
    });
  };

  const erase = () => {
    const id = erasing;
    setErasing(null);
    if (!id) return;
    haptic('warning');
    const done = eraseDeletedLetter(id);
    const left = read();
    setRows(left);
    // The recording's file could not be removed: the store keeps the row for another try. Say so (what did not
    // happen, then what is true), so the person is never left to guess whether it worked (P5 critics' pass, S6).
    const outcome = eraseOutcome(done, left.some((r) => r.id === id));
    if (outcome === 'erased') toast.show({ message: d.erasedToast });
    else if (outcome === 'kept') toast.show({ message: d.eraseFailedToast });
  };

  if (rows.length === 0) {
    return (
      <View className="flex-1 bg-background">
        <Stack.Screen options={{ title: d.recentlyDeleted }} />
        {/* No repeated heading: the nav title already says Recently deleted. */}
        <StateScreen kind="empty" art="page" title={d.shelfEmpty} />
      </View>
    );
  }

  const layout = reduced ? undefined : LinearTransition.springify().stiffness(tokens.motion.standard.stiffness).damping(tokens.motion.standard.damping).mass(tokens.motion.standard.mass);
  return (
    <ScrollView contentContainerClassName="gap-4 px-5 pb-12 pt-4" contentInsetAdjustmentBehavior="automatic">
      <Stack.Screen options={{ title: d.recentlyDeleted }} />
      <Text variant="subhead" tone="muted">
        {d.shelfHelp}
      </Text>
      {rows.map((e) => (
        <Animated.View key={e.id} layout={layout} exiting={FadeOut.duration(reduced ? tokens.motion.fadeMs : tokens.motion.exitMs).reduceMotion(ReduceMotion.Never)}>
          <ShelfCard v={shelfRow(e)} from={signatureOf(e)} eraseNow={actions.eraseNow} onRestore={() => restore(e)} onErase={() => setErasing(e.id)} />
        </Animated.View>
      ))}
      <ConfirmSheet
        open={erasing !== null}
        title={d.eraseNowTitle}
        body={d.eraseNowBody}
        confirmLabel={d.eraseNow}
        keepLabel={d.keepButton}
        onKeep={() => setErasing(null)}
        onConfirm={erase}
      />
    </ScrollView>
  );
}

/** "From Mama": the signature frozen with the letter, or its book's for this phone. */
function signatureOf(e: DeletedEntry): string {
  const child = (e.childId ? getChild(e.childId) : null) ?? getActiveChild();
  const signsAs = child ? authorOf(e, child) : (e.authorSignsAs ?? '');
  return signsAs ? fill(copy.book.signature, { signsAs }) : '';
}

function ShelfCard({ v, from, eraseNow, onRestore, onErase }: { v: ShelfRowView; from: string; eraseNow: boolean; onRestore: () => void; onErase: () => void }) {
  const d = copy.settings.delete;
  const { c } = useTheme();
  const note = v.fullText === null;
  const words = v.fullText ?? (v.words === 'waiting' ? pendingCopy.book.waitingForWords : bookCopy.nobodySpoke);
  const dates = shelfDateLine(v, d);
  return (
    <Card radius="md" padding={4} className="gap-3" testID="shelf.card">
      <View accessible accessibilityLabel={[words, note ? null : from, v.letterDate, dates].filter(Boolean).join('. ')} className="gap-2">
        {note ? (
          <Text variant="footnote">{words}</Text>
        ) : (
          <ExcerptFade text={words} lines={2} variant="letterBody" tone="muted" surface={c.surfaceRaised} />
        )}
        {note || !from ? null : (
          <Text variant="labelSmall" tone="muted">
            {from}
          </Text>
        )}
        <Text variant="footnote">{dates}</Text>
      </View>
      <View className="flex-row flex-wrap items-center gap-2">
        <Button variant="secondary" size="md" label={d.restoreButton} onPress={onRestore} testID="shelf.restore" />
        {eraseNow ? <Button variant="destructive" size="md" icon={TrashIcon} label={d.eraseNow} onPress={onErase} testID="shelf.eraseNow" /> : null}
      </View>
    </Card>
  );
}
