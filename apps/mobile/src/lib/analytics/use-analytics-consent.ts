/** Current analytics choice for screens, updated when the sheet or Settings changes it. */
import { useEffect, useState } from 'react';
import type { ConsentStatus } from '@scribe/analytics';
import { analyticsConsent, subscribeConsent } from './index';

export function useAnalyticsConsent(): ConsentStatus {
  const [status, setStatus] = useState<ConsentStatus>(analyticsConsent);
  useEffect(() => {
    const refresh = () => setStatus(analyticsConsent());
    refresh();
    return subscribeConsent(refresh);
  }, []);
  return status;
}
