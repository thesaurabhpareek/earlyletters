/**
 * Renders TRACKING_PLAN.md section 3.1 (the event catalogue) from catalog.ts,
 * so the plan can never drift from the code. `npm run plan -w
 * @scribe/analytics` rewrites the block between the markers; a test fails if
 * the file's block differs from this output.
 */
import { GLOBAL_PROPS, HELD_EVENTS } from './catalog';
import { REGISTRY, type RegistryRow } from './registry';
import type { EventSpec, PropSpec } from './schema';

export const PLAN_BEGIN = '<!-- catalogue:begin (generated from packages/analytics/src/catalog.ts by `npm run plan -w @scribe/analytics`; do not edit by hand) -->';
export const PLAN_END = '<!-- catalogue:end -->';

const esc = (s: string) => s.replace(/\|/g, '\\|');

export function renderProp(name: string, p: PropSpec): string {
  const opt = p.optional ? '?' : '';
  if (p.type === 'enum') return `\`${name}\`${opt} (enum: ${p.values.join(' \\| ')})`;
  if (p.type === 'bool') return `\`${name}\`${opt} (bool)`;
  return `\`${name}\`${opt} (int ${p.min} to ${p.max})`;
}

export function renderCatalogue(): string {
  const entries = Object.entries(REGISTRY) as [string, RegistryRow][];
  const stages = ['basics', 'activation', 'capture', 'keep', 'return', 'plus'] as const;
  const out: string[] = [
    `${entries.length} sendable events (registry: packages/analytics/src/registry.ts). Every event names the one decision it informs. Every event also carries the global properties in 3.2. \`?\` marks an optional property. Every event and property is L2.`,
    '',
  ];
  for (const stage of stages) {
    const rows = entries.filter(([, x]) => x.stage === stage);
    if (rows.length === 0) continue;
    out.push(`#### ${stage}`, '', '| Event | Fires when | Properties (type: allowed values) | Decision it informs | Serves |', '|---|---|---|---|---|');
    for (const [name, e] of rows) {
      const props = Object.entries(e.props).map(([k, p]) => renderProp(k, p));
      out.push(`| \`${name}\` | ${esc(e.when)} | ${props.length ? props.join('<br>') : '(none)'} | ${esc(e.decision)} | ${e.reqs.join(', ')} |`);
    }
    out.push('');
  }
  const held = Object.keys(HELD_EVENTS).sort();
  out.push(
    `Held, not sendable (${held.length}; typed in catalog.ts for call sites that still exist, dropped and counted at run time until each is registered with a decision or removed): ${held.map((h) => `\`${h}\``).join(', ')}.`,
    '',
  );
  out.push('Global properties: ' + Object.entries(GLOBAL_PROPS).map(([k, p]) => renderProp(k, p)).join(', ') + '.');
  return out.join('\n');
}

/** Replaces the generated block in a plan document. Throws if the markers are missing. */
export function withRenderedCatalogue(doc: string): string {
  const a = doc.indexOf(PLAN_BEGIN);
  const b = doc.indexOf(PLAN_END);
  if (a < 0 || b < a) throw new Error('TRACKING_PLAN.md: catalogue markers missing');
  return `${doc.slice(0, a + PLAN_BEGIN.length)}\n${renderCatalogue()}\n${doc.slice(b)}`;
}
