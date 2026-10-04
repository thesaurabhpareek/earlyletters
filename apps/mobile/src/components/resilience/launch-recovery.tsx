/**
 * Launch recovery screen: the local database could not be opened or updated, so the app cannot show
 * the book. Says the letters are safe on the phone, and offers Try again and Export what is readable.
 * Never deletes, resets or rebuilds anything, on its own or by a button: there is no such action here.
 */
import { useEffect, useRef, useState } from 'react';
import { copy } from '@/lib/copy';
import { runRecoveryExport } from '@/lib/resilience/recovery-export';
import { PlainScreen } from './plain-screen';

type Note = 'none' | 'nothing' | 'failed';

export function LaunchRecovery({ onTryAgain }: { onTryAgain: () => void }) {
  const e = copy.errors.launch;
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<Note>('none');
  const live = useRef(true);
  useEffect(
    () => () => {
      live.current = false;
    },
    [],
  );

  const exportReadable = async () => {
    setBusy(true);
    setNote('none');
    const outcome = await runRecoveryExport();
    if (!live.current) return;
    setBusy(false);
    setNote(outcome === 'nothing' ? 'nothing' : outcome === 'failed' ? 'failed' : 'none');
  };

  return (
    <PlainScreen
      title={e.title}
      body={e.body}
      hint={e.hint}
      note={note === 'nothing' ? e.exportNothing : note === 'failed' ? e.exportFailed : undefined}
      actions={[
        { label: e.tryAgainButton, onPress: onTryAgain },
        { label: busy ? e.exportingTitle : e.exportButton, kind: 'quiet', busy, onPress: () => void exportReadable() },
      ]}
    />
  );
}
