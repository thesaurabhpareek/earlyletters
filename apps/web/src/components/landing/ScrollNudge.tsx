'use client';
/**
 * A quiet "Early access" link at the bottom right. It appears once the visitor has scrolled about 60 percent of
 * a screen, goes away when the sign-up heading or form is arriving (or the email field has focus), and on a click scrolls
 * to the sign-up and puts focus there. It is a real link to #early-access, so it works before the script does.
 *
 * What it does not do: listen to scroll, wheel, touch or keys; scroll by itself; send an event; store anything.
 * Two IntersectionObservers decide when it shows, and nothing runs per frame. The programmatic scroll starts only
 * from a click, tap or Enter, and any touch, wheel or key press during it cancels it natively.
 *
 * Focus after the scroll: on a fine pointer the email field (so the person can type); on a touch screen the
 * sign-up heading instead, because focusing a field opens the keyboard over the form (decision of the founder,
 * HOME_LAYOUT_PROPOSAL section 3.1). Words from site.nudge.
 */
import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { site } from '@/content/site';
import { NOTIFY_INPUT_ID } from '@/components/cta/NotifyForm';
import styles from './ScrollNudge.module.css';

const n = site.nudge;
export const SIGNUP_ID = 'early-access';
export const SIGNUP_HEADING_ID = 'start-title';

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const touch = () => window.matchMedia('(pointer: coarse)').matches;

/** Moves focus to the sign-up once the scroll has ended, but only if the person is still looking at it. */
function focusSignup() {
  const section = document.getElementById(SIGNUP_ID);
  if (!section) return;
  const r = section.getBoundingClientRect();
  if (r.bottom <= 0 || r.top >= window.innerHeight) return; // they scrolled away: do not steal focus
  const field = document.getElementById(NOTIFY_INPUT_ID);
  const heading = document.getElementById(SIGNUP_HEADING_ID);
  const target = !touch() && field ? field : heading;
  target?.focus({ preventScroll: true });
}

export function ScrollNudge() {
  const sentinel = useRef<HTMLSpanElement>(null);
  const [past, setPast] = useState(false); // scrolled past the 60 percent line
  const [arrived, setArrived] = useState(false); // the sign-up heading has reached the upper 75 percent, or is behind us
  const [formNear, setFormNear] = useState(false); // the sign-up form is on screen, or about to be, or behind us
  const [typing, setTyping] = useState(false); // the email field has focus

  useEffect(() => {
    if (!('IntersectionObserver' in window)) return; // stays hidden: the sign-up is still at the end of the page
    const observers: IntersectionObserver[] = [];
    if (sentinel.current) {
      const io = new IntersectionObserver((entries) => {
        const e = entries[entries.length - 1];
        setPast(!e.isIntersecting && e.boundingClientRect.top < 0);
      });
      io.observe(sentinel.current);
      observers.push(io);
    }
    const heading = document.getElementById(SIGNUP_HEADING_ID);
    if (heading) {
      const io = new IntersectionObserver(
        (entries) => {
          const e = entries[entries.length - 1];
          setArrived(e.isIntersecting || e.boundingClientRect.top <= 0);
        },
        { rootMargin: '0px 0px -25% 0px' },
      );
      io.observe(heading);
      observers.push(io);
    }
    // The form itself: hide before it reaches the strip the pill sits in (a phone shows the form well before the heading is high up).
    const form = document.getElementById(NOTIFY_INPUT_ID)?.closest('form');
    if (form) {
      const io = new IntersectionObserver(
        (entries) => {
          const e = entries[entries.length - 1];
          setFormNear(e.isIntersecting || e.boundingClientRect.top <= 0);
        },
        { rootMargin: '0px 0px 100px 0px' },
      );
      io.observe(form);
      observers.push(io);
    }
    const onFocusIn = (e: FocusEvent) => setTyping((e.target as HTMLElement | null)?.id === NOTIFY_INPUT_ID);
    const onFocusOut = () => setTyping(false);
    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('focusout', onFocusOut);
    return () => {
      observers.forEach((o) => o.disconnect());
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('focusout', onFocusOut);
    };
  }, []);

  function onClick(e: MouseEvent<HTMLAnchorElement>) {
    const section = document.getElementById(SIGNUP_ID);
    if (!section) return; // the href still works
    e.preventDefault();
    const instant = reduced();
    section.scrollIntoView({ behavior: instant ? 'auto' : 'smooth', block: 'start' });
    // Focus after the scroll has ended: the scrollend event where it exists, with a timer as the fallback.
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      window.clearTimeout(timer);
      window.removeEventListener('scrollend', finish);
      focusSignup();
    };
    const hasScrollEnd = 'onscrollend' in window;
    if (hasScrollEnd && !instant) window.addEventListener('scrollend', finish, { once: true });
    const timer = window.setTimeout(finish, instant ? 120 : hasScrollEnd ? 2500 : 1000);
  }

  const show = past && !arrived && !formNear && !typing;
  return (
    <>
      <span ref={sentinel} className={styles.sentinel} aria-hidden="true" />
      <a href={`#${SIGNUP_ID}`} className={styles.nudge} data-show={show || undefined} aria-label={n.aria} onClick={onClick}>
        {n.label}
        <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true" focusable="false">
          <path d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z" />
        </svg>
      </a>
    </>
  );
}
