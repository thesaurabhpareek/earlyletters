/**
 * Launch recovery screen: the local database could not be opened or updated, so the app cannot show
 * the book. Says what Export does, and offers Try again and Export what is readable.
 * Never deletes, resets or rebuilds anything, on its own or by a button: there is no such action here.
 *
 * Every tap on Try again is answered: the button turns busy ("Trying again") for a beat, then either the app opens
 * or one calm line says it did not (launch.logic.ts `RetryView`). The line is announced each time, not only the first.
 */
import { useEffect, useRef, useState } from 'react';
import { copy } from '@/lib/copy';
import { RETRY_BEAT_MS, RETRY_START, retryLineTaken, retryResult, retryTapped, type LaunchStatus } from '@/lib/resilience/launch.logic';
import { runRecoveryExport } from '@/lib/resilience/recovery-export';
import { PlainScreen } from './plain-screen';

type Note = 'none' | 'nothing' | 'failed';

const beat = (ms: number) => new Promise<void>((done) => setTimeout(done, ms));

export function LaunchRecovery({ onTryAgain }: { onTryAgain: () => LaunchStatus }) {
  const e = copy.errors.launch;
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<Note>('none');
  const [retry, setRetry] = useState(RETRY_START);
  const live = useRef(true);
  const tapped = useRef(false); // two taps inside one frame run one retry; the busy state is not drawn yet
  useEffect(
    () => () => {
      live.current = false;
    },
    [],
  );

  const exportReadable = async () => {
    setBusy(true);
    setNote('none');
    setRetry(retryLineTaken);
    const outcome = await runRecoveryExport();
    if (!live.current) return;
    setBusy(false);
    setNote(outcome === 'nothing' ? 'nothing' : outcome === 'failed' ? 'failed' : 'none');
  };

  const tryAgain = async () => {
    if (tapped.current) return;
    tapped.current = true;
    setNote('none');
    setRetry(retryTapped);
    await beat(RETRY_BEAT_MS);
    tapped.current = false;
    if (!live.current) return;
    const status = onTryAgain(); // 'ok' lets the app take over, and this screen goes
    if (!live.current) return;
    setRetry((view) => retryResult(view, status));
  };

  const line = retry.stillClosed ? e.stillClosed : note === 'nothing' ? e.exportNothing : note === 'failed' ? e.exportFailed : undefined;

  return (
    <PlainScreen
      title={e.title}
      body={e.body}
      hint={e.hint}
      note={line}
      noteKey={retry.round}
      actions={[
        { label: retry.trying ? e.tryingAgainButton : e.tryAgainButton, busy: retry.trying, onPress: () => void tryAgain() },
        { label: busy ? e.exportingTitle : e.exportButton, kind: 'quiet', busy, onPress: () => void exportReadable() },
      ]}
    />
  );
}
