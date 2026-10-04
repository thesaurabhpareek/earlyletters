import { Stack } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { ConfirmSheet } from '@/components/book/confirm-sheet';
import { shelfRow, type ShelfRowView } from '@/components/book/shelf.logic';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ListSection } from '@/components/ui/list-row';
import { UIProvider } from '@/components/ui/provider';
import { Text } from '@/components/ui/text';
import { useToast } from '@/components/ui/toast';
import { track } from '@/lib/analytics/track';
import { eraseDeletedLetter } from '@/lib/capture/erase';
import { copy, fill, pendingCopy } from '@/lib/copy';
import { haptic } from '@/lib/haptics';
import { listDeleted, subscribeTo, undeleteEntry } from '@/lib/store';
import { bookCopy } from '@/components/book/copy';

/**
 * Recently deleted (D-085, debate Q-014): a letter the person deletes waits here for 30 days
 * with its recording, then the launch purge erases it (file first, then the row). Restore puts
 * it back exactly as it was. Erase now ends the wait: the letter and its recording are erased
 * from this phone at once, after one question. Deleted text can still sit in an old iPhone
 * backup, which the privacy policy says.
 *
 * Calm on purpose: no countdown, no count of what is left. Each row says the day it will be
 * erased, once.
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
  const read = useCallback(() => listDeleted(), []);
  const [rows, setRows] = useState(read);
  const [erasing, setErasing] = useState<string | null>(null);
  useEffect(() => subscribeTo('entries', () => setRows(read())), [read]);

  const restore = (id: string, inBook: boolean) => {
    haptic('tap');
    undeleteEntry(id);
    track('letter_deleted', { action: 'restored', destination: inBook ? 'book' : 'private' });
    setRows(read());
    toast.show({ message: d.restoredToast });
  };

  const erase = () => {
    const id = erasing;
    setErasing(null);
    if (!id) return;
    haptic('warning');
    eraseDeletedLetter(id);
    setRows(read());
  };

  return (
    <ScrollView contentContainerClassName="gap-7 px-5 pb-12 pt-4" contentInsetAdjustmentBehavior="automatic">
      <Stack.Screen options={{ title: d.recentlyDeleted }} />
      {rows.length === 0 ? (
        <EmptyState title={d.recentlyDeleted} body={d.shelfEmpty} />
      ) : (
        <>
          <Text variant="subhead" tone="muted">
            {d.shelfHelp}
          </Text>
          <ListSection>
            {rows.map((e) => {
              const v = shelfRow(e);
              return <ShelfRow key={e.id} v={v} onRestore={() => restore(e.id, e.inBook)} onErase={() => setErasing(e.id)} />;
            })}
          </ListSection>
        </>
      )}
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

function ShelfRow({ v, onRestore, onErase }: { v: ShelfRowView; onRestore: () => void; onErase: () => void }) {
  const d = copy.settings.delete;
  const words = v.excerpt ?? (v.words === 'waiting' ? pendingCopy.book.waitingForWords : bookCopy.nobodySpoke);
  const erases = fill(d.erasesOn, { date: v.erasesDate });
  return (
    <View className="gap-3 px-4 py-4" accessible={false}>
      <View accessible accessibilityLabel={`${words}. ${v.letterDate}. ${fill(d.deletedOn, { date: v.deletedDate })}. ${erases}`} className="gap-1">
        <Text variant="body" numberOfLines={3}>
          {words}
        </Text>
        <Text variant="footnote">{v.letterDate}</Text>
        <Text variant="footnote">{fill(d.deletedOn, { date: v.deletedDate })}</Text>
        <Text variant="footnote">{erases}</Text>
      </View>
      <View className="flex-row flex-wrap gap-2">
        <Button variant="secondary" size="md" label={d.restoreButton} onPress={onRestore} />
        <Button variant="destructive" size="md" label={d.eraseNow} onPress={onErase} />
      </View>
    </View>
  );
}
