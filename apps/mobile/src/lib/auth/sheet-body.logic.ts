/**
 * Which body the sign-in sheet shows (BL-494 point 1). The trigger picks it, as it always did; a `reason` from the
 * route picks a line for one entry point without a new analytics trigger. Anything else is ignored.
 */
export function signInBody(bodies: { cancel_deletion: string } & Record<string, string>, trigger: string, reason: unknown): string {
  return reason === 'cancel_deletion' ? bodies.cancel_deletion : bodies[trigger];
}
