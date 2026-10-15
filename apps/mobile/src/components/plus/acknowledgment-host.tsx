/**
 * Shows the acknowledgment once after a purchase made in the app (presentPlusStore asks for it).
 * Mounted in Settings, Plan; the root layout should mount it too so a purchase from the Keep sheet
 * shows it as well (request to the coordinator, app/_layout.tsx).
 */
import { useSyncExternalStore } from 'react';
import { acknowledgmentPending, acknowledgmentShown, subscribeAcknowledgment } from '@/lib/billing';
import { AcknowledgmentSheet } from './acknowledgment-sheet';

export function PlusAcknowledgmentHost() {
  const pending = useSyncExternalStore(subscribeAcknowledgment, acknowledgmentPending, acknowledgmentPending);
  return <AcknowledgmentSheet open={pending} onClose={acknowledgmentShown} />;
}
