// Sketch round S1: the five integrations and the control, first drawings.
import { CONCEPTS as K } from './concepts.mjs';
import { sheet, SCR, C } from './sheet.mjs';
const PAGE_L = { paperTile: C.paper, mark: C.accent, flap: '#EFE6DA', under: C.accent, bg: C.accent, fg: C.paper };
const PAGE_D = { paperTile: '#1E1A17', mark: C.accentDark, flap: '#2C2621', under: '#0E0C0B', bg: '#1E1A17', fg: C.accentDark };
const cands = [K.pure(), K.sheet(), K.opening(), K.envelope(), { ...K.page(), light: PAGE_L, dark: PAGE_D }, K.cutout(), K.folded()];
await sheet(cands, SCR + '/s1.png', { cols: 2 });
