/**
 * usePlanNoticeCard(): the plan reminder card to show now (F14-REQ-010), on Tonight (request to S10)
 * and in Settings, Plan. Shown whether or not notifications are allowed; "Got it" hides that notice's
 * card for good (its id is kept in device settings, nothing else).
 */
import { useCallback, useState, useSyncExternalStore } from 'react';
import type { PlannedPlanNotice } from '@scribe/core/src/plan-notices';
import { noticeText, type NoticeText } from './plan-notices.logic';
import { cardFor } from './plan-reminders';
import { currentReplanInput, markPlanCardSeen, seenPlanCards } from './plan-reminders.native';
import { getPlan, subscribePlan } from './plan-store';

export interface PlanNoticeCardState {
  notice: PlannedPlanNotice;
  text: NoticeText;
  dismiss: () => void;
}

export function usePlanNoticeCard(): PlanNoticeCardState | null {
  const plan = useSyncExternalStore(subscribePlan, getPlan, getPlan);
  const [, setTick] = useState(0);
  const dismiss = useCallback((id: string) => {
    markPlanCardSeen(id);
    setTick((t) => t + 1);
  }, []);
  const input = { ...currentReplanInput(), plan };
  const notice = cardFor(input, seenPlanCards());
  if (!notice) return null;
  return { notice, text: noticeText(notice, plan.details.period), dismiss: () => dismiss(notice.id) };
}
