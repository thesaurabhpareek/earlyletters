/**
 * Native: no fault injection exists. The web preview has its own (launch-fault.web.ts) for the recorded
 * journey flows. Returns true when this launch must pretend the database could not be opened.
 */
export function launchFaultForPreview(): boolean {
  return false;
}
