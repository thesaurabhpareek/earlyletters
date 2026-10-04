// Writes packages/brand/registry.json from registry.ts (the typed source). Run after editing the registry:
//   node packages/brand/scripts/build-registry.mjs
// Node 22.18+ strips the TypeScript types natively; registry.ts imports nothing, so no build step is needed.
// The registry test fails when the JSON is out of date.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const { ASSETS, CONTEXTS, REGISTRY_VERSION } = await import(path.join(HERE, '..', 'registry.ts'));

export function registryJson() {
  return {
    $comment: 'GENERATED from packages/brand/registry.ts by packages/brand/scripts/build-registry.mjs. Do not edit by hand.',
    version: REGISTRY_VERSION,
    assets: ASSETS,
    contexts: CONTEXTS,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const out = path.join(HERE, '..', 'registry.json');
  fs.writeFileSync(out, JSON.stringify(registryJson(), null, 2) + '\n');
  console.log(`wrote ${path.relative(process.cwd(), out)}: ${ASSETS.length} assets, ${Object.keys(CONTEXTS).length} contexts`);
}
