/**
 * Help links (F20-REQ-005, F20-REQ-007; RT-SET-02, SR-C-09): the crisis lines on "If you are struggling" and the
 * Write to us rows in Settings open `tel:` or `mailto:`. Where the device reports it cannot, or the open is refused,
 * the caller gets back the number or address to show as selectable text with a Copy button, in the same tap, so a
 * tap never does nothing. Expected cases are an iPad (no calling), a phone with no SIM, and no Mail account; what iOS
 * actually reports in each is to be confirmed by the S1-23 V-10 device check.
 *
 * Pure: the linker is passed in (react-native `Linking` in the app, a fake in tests), so this runs in Node.
 * Words come from packages/content `helpLinks` (shared by every help row); the lines are packages/content
 * helplines.ts. Nothing is counted, logged or sent (D-034).
 */
import { brand, supportMailto } from '@scribe/brand';
import { en } from '@scribe/content';

/** The two calls this needs from react-native `Linking`. */
export type Linker = {
  canOpenURL(url: string): Promise<boolean>;
  openURL(url: string): Promise<unknown>;
};

/** What a row opens, and what to show if it cannot: a phone number to call or text, or our email address. */
export type HelpTarget = { kind: 'call' | 'text' | 'mail'; url: string; value: string };

export type HelpOpenResult = { kind: 'opened' } | { kind: 'fallback'; target: HelpTarget };

/**
 * A call to a helpline's digits (packages/content helplines.ts). The number to copy, if the call cannot open, is the
 * one the line's words show (`telShown`), so it reads the same in the sheet as on the card.
 */
export const callTarget = (tel: string, shown: string = tel): HelpTarget => ({ kind: 'call', url: `tel:${tel}`, value: shown });

/** A text to a helpline's digits. Opens Messages with the number filled in; the parent writes and sends. */
export const textTarget = (sms: string, shown: string = sms): HelpTarget => ({ kind: 'text', url: `sms:${sms}`, value: shown });

/** Write to us: the support mailbox with a fixed subject and nothing else (LEGAL-REQ-014). */
export const mailTarget = (subject?: string): HelpTarget => ({ kind: 'mail', url: supportMailto(subject), value: brand.support.email });

/**
 * Opens the target, or says what to show instead. Asks `canOpenURL` first (expected to answer false for `tel:` on an
 * iPad), and treats a rejected `openURL` or `canOpenURL` the same way. Never throws.
 *
 * A text skips the question: `sms` is not in the app's LSApplicationQueriesSchemes (app.config.ts), so iOS would
 * answer no for every phone. `openURL` needs no declaration, and a refused open still shows the number to copy.
 */
export async function openHelpTarget(target: HelpTarget, linker: Linker): Promise<HelpOpenResult> {
  try {
    if (target.kind !== 'text' && !(await linker.canOpenURL(target.url))) return { kind: 'fallback', target };
    await linker.openURL(target.url);
    return { kind: 'opened' };
  } catch {
    return { kind: 'fallback', target };
  }
}

/** Whether this device reports it can call (`canOpenURL('tel:')`). null until it has answered. */
export type PhoneAbility = { call: boolean | null };

/** Asks once whether `tel:` can open. A rejected question counts as no. Never throws. */
export async function probePhone(linker: Pick<Linker, 'canOpenURL'>): Promise<PhoneAbility> {
  const call = await linker.canOpenURL('tel:988').then(Boolean, () => false);
  return { call };
}

/**
 * The VoiceOver hint for a crisis row. It promises a call only when the device said it can make one; otherwise (it
 * said no, or has not answered yet) it says what the tap does there: shows the number to call from a phone or copy.
 */
export function rowHint(can: PhoneAbility): string {
  return can.call === true ? en.helpLinks.callHint : en.helpLinks.callHintNoPhone;
}

/** The fallback sheet's words for a target: title, the line under it, the Copy button and what it says once copied. */
export function fallbackWords(kind: HelpTarget['kind']): { title: string; body: string; copy: string; copied: string } {
  const h = en.helpLinks;
  if (kind === 'mail') return { title: h.noMailTitle, body: h.noMailBody, copy: h.copyAddress, copied: h.addressCopied };
  if (kind === 'text') return { title: h.noTextTitle, body: h.noTextBody, copy: h.copyNumber, copied: h.numberCopied };
  return { title: h.noCallTitle, body: h.noPhoneBody, copy: h.copyNumber, copied: h.numberCopied };
}
