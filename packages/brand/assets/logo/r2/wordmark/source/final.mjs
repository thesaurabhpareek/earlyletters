// The wordmark chosen for lockups. Phase 1 recommendation: route A (Signature).
// Phase 4 changes, if the director asks for any, are applied here so routes.mjs keeps the v1 record.
import { ROUTES } from './routes.mjs';
export const FINAL = { master: { ...ROUTES.a.master }, small: { ...ROUTES.a.small } };
