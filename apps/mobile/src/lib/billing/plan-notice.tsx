/**
 * The plan reminder inside the app (G-15; Q-003 memo section 5): the same
 * reminder as the notification, with what the lock screen leaves out (the
 * cancel-by date and Manage subscription). It works with notifications off.
 * No price (D-083): Apple's subscription screen and receipts show it.
 *
 * - `usePlanNote()`: the note open right now, for Settings, Plan, where it
 *   stays until its date passes.
 * - `PlanNoteBody`: the note's sentences.
 * - `<PlanNoticeHost />`: shows the note once per reminder, on the next open
 *   inside its window, on a calm tab root only (never mid-task). Mounted once
 *   in app/_layout.tsx, inside the 18+ gate.
 */
import { useSegments } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Sheet } from '@/components/ui/sheet';
import { Text } from '@/components/ui/text';
import { isCalmSurface } from '../analytics/ask-sequencer.logic';
import { longDate } from '../dates';
import { getSetting, setSetting } from '../store';
import { manageSubscription } from './actions';
import { billingCopy } from './copy';
import { deviceTimeZone } from './plan-reminders';
import { activePlanNote, noteLines, subjectOf, type PlanNote } from './plan-reminders.logic';
import { usePlan, type UsePlan } from './use-plan';

/** Device setting: ids of plan notes already shown in a sheet (newest last, capped). */
export const PLAN_NOTES_SEEN_KEY = 'plus.notesSeen';
const SEEN_CAP = 24;
const CALM_DELAY_MS = 1500;

export function seenPlanNotes(): string[] {
  try {
    const v = JSON.parse(getSetting(PLAN_NOTES_SEEN_KEY) ?? '[]') as unknown;
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function markSeen(id: string): void {
  try {
    const next = [...seenPlanNotes().filter((x) => x !== id), id].slice(-SEEN_CAP);
    setSetting(PLAN_NOTES_SEEN_KEY, JSON.stringify(next));
  } catch {
    // Shown again next open at worst.
  }
}

/** The note open now for this phone's plan, re-read on foreground. */
export function usePlanNote(plan: UsePlan): PlanNote | null {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => s === 'active' && setTick((t) => t + 1));
    return () => sub.remove();
  }, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => activePlanNote(subjectOf(plan), Date.now(), deviceTimeZone()), [plan.details, plan.checkedAt, tick]);
}

export function PlanNoteBody({ note }: { note: PlanNote }) {
  const lines = noteLines(note, billingCopy.note, { timeZone: deviceTimeZone(), formatDay: (ymd) => longDate(ymd) });
  return (
    <View className="gap-2">
      {lines.map((l, i) => (
        <Text key={i} variant="body">
          {l}
        </Text>
      ))}
    </View>
  );
}

/** Once per reminder, on the next calm open inside its window. */
export function PlanNoticeHost() {
  const plan = usePlan();
  const note = usePlanNote(plan);
  const segments = useSegments() as string[];
  const key = segments.join('/');
  const [open, setOpen] = useState<PlanNote | null>(null);
  const openRef = useRef<PlanNote | null>(null);
  openRef.current = open;

  useEffect(() => {
    if (openRef.current || !note || !isCalmSurface(segments)) return;
    if (seenPlanNotes().includes(note.id)) return;
    const id = setTimeout(() => {
      if (openRef.current) return;
      markSeen(note.id);
      setOpen(note);
    }, CALM_DELAY_MS);
    return () => clearTimeout(id);
  }, [note, key]); // eslint-disable-line react-hooks/exhaustive-deps

  const close = useCallback(() => setOpen(null), []);
  const n = billingCopy.note;
  return (
    <Sheet
      open={open !== null}
      onClose={close}
      title={n.title}
      footer={
        <View className="gap-2">
          <Button
            label={billingCopy.plan.manage}
            onPress={() => {
              close();
              void manageSubscription();
            }}
          />
          <Button variant="quiet" label={n.dismiss} onPress={close} />
        </View>
      }>
      {open ? <PlanNoteBody note={open} /> : null}
    </Sheet>
  );
}
