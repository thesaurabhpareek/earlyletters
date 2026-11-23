/** Rewrites the generated catalogue block in docs/analytics/TRACKING_PLAN.md (section 3.1). */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { IDS_DOC_PATH, renderIdsDoc, withRenderedCatalogue } from '../src/plan-doc';

const file = resolve(__dirname, '../../../docs/analytics/TRACKING_PLAN.md');
const before = readFileSync(file, 'utf8');
const after = withRenderedCatalogue(before);
if (after !== before) writeFileSync(file, after);
console.log(after === before ? 'TRACKING_PLAN.md catalogue already current' : 'TRACKING_PLAN.md catalogue updated');

const idsFile = resolve(__dirname, '../../..', IDS_DOC_PATH);
const idsBefore = existsSync(idsFile) ? readFileSync(idsFile, 'utf8') : '';
const idsAfter = renderIdsDoc();
if (idsAfter !== idsBefore) writeFileSync(idsFile, idsAfter);
console.log(idsAfter === idsBefore ? 'ids.md already current' : 'ids.md updated');
