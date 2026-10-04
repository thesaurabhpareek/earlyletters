'use client';
/**
 * The one action before launch: a single email field. Label, hint, consent note, button, and inline
 * success or error in a polite live region. The honeypot field `company` is hidden from people and
 * screen readers. Words from site.notify.
 */
import { useId, useState, type FormEvent } from 'react';
import { site } from '@/content/site';
import { submitNotify } from '@/lib/notify/client';
import { track } from '@/lib/analytics';
import styles from './NotifyForm.module.css';

const c = site.notify;
type State = 'idle' | 'sending' | 'done' | 'invalid' | 'rate_limited' | 'server';

export const NOTIFY_INPUT_ID = 'notify-email';

/** `quiet` is the understated variant: a single underlined field with a text button, for pages where this is the only ask. */
export function NotifyForm({ quiet = false }: { quiet?: boolean }) {
  const hintId = useId();
  const statusId = useId();
  const [state, setState] = useState<State>('idle');

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (state === 'sending') return;
    const form = new FormData(e.currentTarget);
    const email = String(form.get('email') ?? '').trim();
    const company = String(form.get('company') ?? '');
    setState('sending');
    const res = await submitNotify(email, { company });
    track({ name: 'notify_submit', result: res.ok ? 'ok' : res.error });
    setState(res.ok ? 'done' : res.error);
  }

  if (state === 'done') {
    return (
      <p className={styles.success} role="status">
        {c.success}
      </p>
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
        <button type="submit" className={styles.button} disabled={state === 'sending'}>
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
