/**
 * Hands the invite link to the system share sheet (React Native Share, the
 * iOS activity view): Messages, WhatsApp, Mail, AirDrop, Copy. The link sits
 * at the end of the message so every app keeps it intact. Nothing is logged.
 */
import { Share } from 'react-native';
import { fill } from '../copy';
import { familyCopy } from './copy';

export type ShareResult = 'shared' | 'dismissed';

export async function shareInviteLink(url: string, child: string, signsAs: string | null): Promise<ShareResult> {
  const c = familyCopy.create;
  const text = signsAs ? fill(c.shareMessageNamed, { child, signsAs }) : fill(c.shareMessage, { child });
  const res = await Share.share({ message: `${text} ${url}`, title: fill(c.shareTitle, { child }) });
  return res.action === Share.dismissedAction ? 'dismissed' : 'shared';
}
