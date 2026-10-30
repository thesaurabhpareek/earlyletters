/**
 * The confirm before "Sign out of this phone" on a deletion that is scheduled (critics' pass 30 Oct 2026, S3): signing
 * out does not close the request, and the person is told so before she does it. A native alert, like Settings > Account's
 * sign-out; not destructive (nothing is deleted by it). The words are accountDeletionCopy.scheduled.signOutBody with the
 * title and the two buttons of Settings > Account's own confirm.
 */
import { Alert } from 'react-native';
import { accountDeletionCopy as c } from './copy';
import { authCopy } from '@/lib/auth/copy';

export function confirmSignOut(date: string, signOut: () => void): void {
  const a = authCopy.account;
  Alert.alert(a.signOutTitle, c.scheduled.signOutBody.replace('{date}', date), [
    { text: a.cancel, style: 'cancel' },
    { text: a.signOut, onPress: signOut },
  ]);
}
