// WEB PREVIEW ONLY (BL-464). metro.config.js swaps this file in for expo-sqlite's web worker import of
// ./wa-sqlite/AccessHandlePoolVFS, for the web platform only; its ./AccessHandlePoolVFS import resolves to the
// installed file. Native never loads it. Why: sqlite-pool-capacity.js.
import { AccessHandlePoolVFS as Upstream } from './AccessHandlePoolVFS';
import { withFullPool } from './sqlite-pool-capacity';

export const AccessHandlePoolVFS = withFullPool(Upstream);
