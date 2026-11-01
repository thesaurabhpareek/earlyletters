// android: same
/**
 * "Continue with email" (PRD A F4; EXPERIENCE_PASS S53): one labelled field with the email
 * keyboard and AutoFill, and one email holding a link and a code (A-REQ-018). The address stays
 * in memory only (PRD A F6.2).
 *
 * Visual (S53): pushed inside the sheet, with Back. The title, the field (56 pt, `body` size,
 * focused on arrival), the help under it in `footnote`, and "Send link" full width above the
 * keyboard, in the outline style until the text looks like an address. "That email doesn't look
 * quite right." shows on submit only, never while typing, and goes as soon as the person types.
 */
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { authCopy } from '@/lib/auth/copy';
import { looksLikeEmail } from '@/lib/auth/errors.logic';
import type { AuthErrorKind } from '@/lib/auth/machine.logic';
import { getPendingEmail, setPendingEmail } from '@/lib/auth/pending';
import { authErrorMessage } from '@/lib/auth/messages';
import { useAuth, type Outcome } from '@/lib/auth/session-provider';
import { ErrorLine, SheetFrame, SheetTitle } from '@/lib/auth/ui';

export default function EmailStep() {
  const auth = useAuth();
  const e = authCopy.email;
  const [email, setEmail] = useState(getPendingEmail() ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<AuthErrorKind | null>(null);
  // Set before the first await: a second tap (or Return) in the same frame sends no second email.
  const inFlight = useRef(false);
  const value = email.trim();
  const ready = looksLikeEmail(value);

  const send = async () => {
    if (busy || inFlight.current) return;
    if (!ready) {
      setError('invalid_email');
      return;
    }
    inFlight.current = true;
    setBusy(true);
    setError(null);
    let r: Outcome;
    try {
      r = await auth.sendEmailLink(value);
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
    if (r.ok) {
      setPendingEmail(value);
      router.push('/sign-in/code');
    } else if (r.error !== 'cancelled') {
      setError(r.error);
    }
  };

  // The field's own error is the address; anything else (offline, paused) is the sheet's line.
  const fieldError = error === 'invalid_email' ? authErrorMessage(error) : null;
  const sheetError = error && error !== 'invalid_email' ? authErrorMessage(error) : null;

  return (
    <SheetFrame
      // Back stays in place while sending (nothing moves); it waits until the send has an answer.
      onBack={() => {
        if (!busy) router.back();
      }}
      footer={<Button size="lg" fullWidth variant={ready ? 'primary' : 'outline'} loading={busy} disabled={value.length === 0} label={e.send} onPress={() => void send()} />}>
      <SheetTitle>{e.title}</SheetTitle>
      <TextField
        label={e.label}
        helper={e.help}
        error={fieldError}
        value={email}
        onChangeText={(v) => {
          setEmail(v);
          if (error) setError(null);
        }}
        placeholder={e.placeholder}
        keyboardType="email-address"
        textContentType="emailAddress"
        autoComplete="email"
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="send"
        onSubmitEditing={() => void send()}
        editable={!busy}
        inputClassName="min-h-14"
        autoFocus
      />
      <ErrorLine message={sheetError} />
    </SheetFrame>
  );
}
