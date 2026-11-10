/**
 * The lock card in session 3 (NX-31-R14, R29), over the Book. Mounted once in the tabs layout beside the reminder card.
 * Review asks for it through `requestLockOffer()` after the save that made this the lock offer's session and the Book is
 * on screen. The card is `components/app-lock/lock-offer.tsx`: two equal buttons, "Not now" always works, and Settings >
 * Privacy > App lock is the other way in. It counts as this session's one ask once it appears (`noteAsked`), records its
 * answer on the phone only (lib/app-lock/offer.ts), and records nothing if the app is quit first. On a phone with no
 * passcode it never appears and the card waits 30 days. Nothing is sent or tracked. Face ID is the book lock, not how
 * anyone signs in.
 */
import { useEffect, useState } from 'react';
import { Modal, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LockOffer } from '@/components/app-lock/lock-offer';
import { noteLockOfferAnswer } from '@/lib/app-lock/offer';
import { noteAsked, subscribeLockOffer, takeLockOfferRequest } from '@/lib/asks';
import { getActiveChild } from '@/lib/store';
import { childLabel } from '@/lib/copy';

export function LockOfferAsk() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const take = () => {
      if (takeLockOfferRequest()) setOpen(true);
    };
    take();
    return subscribeLockOffer(take);
  }, []);
  const insets = useSafeAreaInsets();
  if (!open) return null;
  const child = childLabel(getActiveChild()?.name);
  return (
    // onRequestClose is required on Android; the card leaves only through one of its answers.
    <Modal visible transparent animationType="fade" onRequestClose={() => {}} accessibilityViewIsModal>
      <View className="flex-1 bg-black/30" importantForAccessibility="no-hide-descendants" accessibilityElementsHidden />
      <View className="px-4" style={{ paddingBottom: insets.bottom + 16 }} testID="lock-offer-ask">
        <LockOffer
          child={child}
          onShown={() => noteAsked()}
          onUnavailable={() => {
            noteLockOfferAnswer('unavailable');
            setOpen(false);
          }}
          onAnswered={(answer) => {
            noteLockOfferAnswer(answer);
            setOpen(false);
          }}
        />
      </View>
    </Modal>
  );
}
