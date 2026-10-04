/**
 * usePlan(): the device's Plus state for screens. Built on decide()'s PlanView
 * (packages/core) from StoreKit 2 on this phone; cached, so it renders at once
 * and offline. See plan-store.ts and plan.logic.ts.
 */
import { useEffect, useSyncExternalStore } from 'react';
import type { StoreViewSupport } from '../../../modules/scribe-store';
import { getPlan, refreshPlan, storeViewSupport, subscribePlan } from './plan-store';
import { planLine, plusOn, type PlanLine, type PlanState } from './plan.logic';

export interface UsePlan extends PlanState {
  /** Plus extras are on right now. */
  plusOn: boolean;
  /** One line for the Plan screen. */
  line: PlanLine;
  /** Whether Apple's store view can open on this device. */
  storeSupport: StoreViewSupport;
  refresh: () => Promise<void>;
}

export function usePlan(): UsePlan {
  const plan = useSyncExternalStore(subscribePlan, getPlan, getPlan);
  useEffect(() => {
    // Usually already fresh from startPlus(); cheap, and covers a screen opened before boot finished.
    void refreshPlan();
  }, []);
  const now = new Date().toISOString();
  return { ...plan, plusOn: plusOn(plan, now), line: planLine(plan, now), storeSupport: storeViewSupport(), refresh: refreshPlan };
}
