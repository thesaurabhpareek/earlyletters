/**
 * Plus gates on this phone, built on decide() (packages/core/src/plan.ts).
 * Replaces the hasPlus() and isJoinedBook() stubs that lived in store.ts.
 */
import type { Decision } from '@scribe/core';
import { listChildren, listHiddenChildren, todayISO, type Child } from '../store';
import { getPlan } from './plan-store';
import { isJoinedBook as joined, plusOn, startBookDecision, type BookFacts, type GateContext } from './plan.logic';

/**
 * Sync (sync_books `created_by_me`, `role`) adds where a book came from. Until
 * it does, every book on this phone was started here.
 */
type ChildOrigin = Child & { createdByMe?: boolean; role?: 'parent' | 'contributor' };

export function bookFactsOf(child: Child): BookFacts {
  const c = child as ChildOrigin;
  const facts: BookFacts = { birthday: c.birthday };
  if (typeof c.createdByMe === 'boolean') facts.createdByMe = c.createdByMe;
  if (c.role === 'parent' || c.role === 'contributor') facts.role = c.role;
  return facts;
}

/** Every book on this phone, hidden ones included (they count as started). */
export function allBookFacts(): BookFacts[] {
  return [...listChildren(), ...listHiddenChildren()].map(bookFactsOf);
}

export function gateContext(now: Date = new Date()): GateContext {
  return { now: now.toISOString(), today: todayISO(now), plan: getPlan().view, books: allBookFacts() };
}

/** Plus is on right now on this phone. */
export function hasPlus(): boolean {
  return plusOn(getPlan(), new Date().toISOString());
}

/** A book this person joined as co-parent. It never uses up the free book. */
export function isJoinedBook(child: Child): boolean {
  return joined(bookFactsOf(child));
}

/** Starting another book after first run (the onboarding batch is always free). */
export function startBookGate(): Decision {
  return startBookDecision(gateContext());
}

/** Whether starting another book shows the Plus gate. Existing books are never affected. */
export function newChildNeedsPlus(): boolean {
  return startBookGate().kind !== 'allow';
}
