/**
 * Launch recovery screen: the local database could not be opened or updated, so the app cannot show
 * the book. Says what Export does, and offers Try again and Export what is readable.
 * This screen has no action that deletes, resets or rebuilds anything: Export only reads, and Try again only opens again.
 *
 * Every tap on Try again is answered: the button turns busy ("Trying again") for a beat, then either the app opens
 * or one calm line says it did not. The line is announced each time, not only the first. The line is one slot shared
 * with the export's result, so the newest answer is the one on screen. The order of it all (the guard against a second
 * tap, the beat, the open, the check that the screen is still here) lives in launch.logic.ts `createRecoveryActions`,
 * where a test runs it; this file only connects it to React.
 */
import { useEffect, useRef, useState } from 'react';
import { copy } from '@/lib/copy';
import { createRecoveryActions, RECOVERY_START, type LaunchStatus, type RecoveryLine } from '@/lib/resilience/launch.logic';
import { runRecoveryExport } from '@/lib/resilience/recovery-export';
import { PlainScreen } from './plain-screen';

export function LaunchRecovery({ onTryAgain }: { onTryAgain: () => LaunchStatus }) {
  const e = copy.errors.launch;
  const [view, setView] = useState(RECOVERY_START);
  const live = useRef(true);
  const open = useRef(onTryAgain);
  open.current = onTryAgain;
  const [actions] = useState(() =>
    createRecoveryActions({
      wait: (ms) => new Promise<void>((done) => setTimeout(done, ms)),
      open: () => open.current(),
      runExport: runRecoveryExport,
      isLive: () => live.current,
      update: setView,
    }),
  );
  useEffect(
    () => () => {
      live.current = false;
    },
    [],
  );

  const words: Record<RecoveryLine, string | undefined> = { none: undefined, stillClosed: e.stillClosed, exportNothing: e.exportNothing, exportFailed: e.exportFailed };

  return (
    <PlainScreen
      title={e.title}
      body={e.body}
      hint={e.hint}
      note={words[view.line]}
      noteKey={view.round}
      actions={[
        { label: view.trying ? e.tryingAgainButton : e.tryAgainButton, busy: view.trying, onPress: () => void actions.tryAgain() },
        { label: view.exporting ? e.exportingTitle : e.exportButton, kind: 'quiet', busy: view.exporting, onPress: () => void actions.exportReadable() },
      ]}
    />
  );
}
