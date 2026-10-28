'use client';
/**
 * The one action before launch: a single email field. Label, hint, consent note, button, and inline
 * success or error in a polite live region. The honeypot field `company` is hidden from people and
 * screen readers. Words from site.notify.
 */
import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { site } from '@/content/site';
import { submitNotify } from '@/lib/notify/client';
import { track } from '@/lib/analytics';
import { tap } from '@/lib/haptics';
import styles from './NotifyForm.module.css';

const c = site.notify;
type State = 'idle' | 'sending' | 'done' | 'already' | 'invalid' | 'rate_limited' | 'server';

export const NOTIFY_INPUT_ID = 'notify-email';

/** `quiet` is the understated variant: a single underlined field with a text button, for pages where this is the only ask. */
export function NotifyForm({ quiet = false, onDone }: { quiet?: boolean; onDone?: () => void }) {
  const hintId = useId();
  const statusId = useId();
  const [state, setState] = useState<State>('idle');
  const doneRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (state === 'done' || state === 'already') {
      doneRef.current?.focus();
      tap('success');
      onDone?.();
    }
  }, [state, onDone]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (state === 'sending') return;
    const form = new FormData(e.currentTarget);
    const email = String(form.get('email') ?? '').trim();
    const company = String(form.get('company') ?? '');
    setState('sending');
    const res = await submitNotify(email, { company });
    track({ name: 'notify_submit', result: res.ok ? 'ok' : res.error });
    setState(res.ok ? (res.already ? 'already' : 'done') : res.error);
  }

  if (state === 'done' || state === 'already') {
    return (
      <div ref={doneRef} tabIndex={-1} role="status" className={styles.success} data-kind={state}>
        <svg className={styles.check} viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="10.5" />
          <path d="M7.2 12.4l3.2 3.2 6.4-6.6" />
        </svg>
        <p className={styles.successTitle}>{state === 'already' ? c.alreadyTitle : c.successTitle}</p>
        <p className={styles.successBody}>{state === 'already' ? c.alreadyBody : c.successBody}</p>
      </div>
    );
  }

  const message = state === 'invalid' ? c.error : state === 'rate_limited' ? c.rateLimited : state === 'server' ? c.server : '';

  // method and action only matter before the script loads or with it off: a native submit then POSTs to the
  // endpoint instead of putting the address in the page URL (history, logs, Referer).
  return (
    <form
      className={`${styles.form} ${quiet ? styles.quiet : ''}`}
      method="post"
      action="/api/notify"
      onSubmit={onSubmit}
      noValidate
    >
      <label htmlFor={NOTIFY_INPUT_ID} className={styles.label}>
        {c.label}
      </label>
      <div className={styles.row}>
        <input
          id={NOTIFY_INPUT_ID}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="off"
          spellCheck={false}
          required
          placeholder={c.placeholder}
          aria-describedby={`${hintId} ${statusId}`}
          aria-invalid={state === 'invalid' || undefined}
          className={styles.input}
        />
        <button type="submit" className={styles.button} aria-disabled={state === 'sending' || undefined}>
          {state === 'sending' ? c.sending : quiet ? c.quietButton : c.button}
        </button>
      </div>
      <div className={styles.honeypot} aria-hidden="true">
        <label htmlFor="notify-company">{c.honeypotLabel}</label>
        <input id="notify-company" name="company" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
      </div>
      <p id={hintId} className={styles.note}>
        {c.note}
      </p>
      <p id={statusId} className={styles.error} role="status" aria-live="polite">
        {message}
      </p>
    </form>
  );
}
