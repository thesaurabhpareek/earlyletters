/**
 * BL-568: what the root layout shows after a fatal throw outside React (a press handler, a timer, a native
 * callback). The same screen, words and buttons as the root error boundary, so a person meets one calm
 * recovery screen whatever broke. Try again clears the fault and the app mounts afresh; Go to Tonight does
 * that and then goes to Tonight. It never shows the error and logs nothing.
 */
import { RootErrorBoundary } from './error-boundary';

/** Never shown or logged: RootErrorBoundary takes an error prop but does not read it. */
const UNREAD = new Error('global_fault');

export function GlobalFaultScreen({ onTryAgain }: { onTryAgain: () => void }) {
  return <RootErrorBoundary error={UNREAD} retry={async () => onTryAgain()} />;
}
