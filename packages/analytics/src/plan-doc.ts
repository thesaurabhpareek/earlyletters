/**
 * Renders TRACKING_PLAN.md section 3.1 (the event catalogue) from catalog.ts,
 * so the plan can never drift from the code. `npm run plan -w
 * @scribe/analytics` rewrites the block between the markers; a test fails if
 * the file's block differs from this output.
 */
import { EVENTS, GLOBAL_PROPS } from './catalog';
import type { EventSpec, PropSpec } from './schema';

export const PLAN_BEGIN = '<!-- catalogue:begin (generated from packages/analytics/src/catalog.ts by `npm run plan -w @scribe/analytics`; do not edit by hand) -->';
export const PLAN_END = '<!-- catalogue:end -->';

const AREA_ORDER = ['app', 'consent', 'entry', 'children', 'capture', 'languages', 'book', 'family', 'reminders', 'celebrate', 'settings', 'plus', 'errors'];

const esc = (s: string) => s.replace(/\|/g, '\\|');

export function renderProp(name: string, p: PropSpec): string {
  const opt = p.optional ? '?' : '';
  if (p.type === 'enum') return `\`${name}\`${opt} (enum: ${p.values.join(' \\| ')})`;
  if (p.type === 'bool') return `\`${name}\`${opt} (bool)`;
  return `\`${name}\`${opt} (int ${p.min} to ${p.max})`;
}

export function renderCatalogue(): string {
  const entries = Object.entries(EVENTS) as [string, EventSpec][];
  const areas = [...new Set([...AREA_ORDER, ...entries.map(([, e]) => e.area)])].filter((a) => entries.some(([, e]) => e.area === a));
  const out: string[] = [`${entries.length} events. Every event also carries the global properties in 3.2. \`?\` marks an optional property. Every event and property is L2.`, ''];
  for (const area of areas) {
    out.push(`#### ${area}`, '', '| Event | Fires when | Properties (type: allowed values) | Serves |', '|---|---|---|---|');
    for (const [name, e] of entries.filter(([, x]) => x.area === area)) {
      const props = Object.entries(e.props).map(([k, p]) => renderProp(k, p));
      out.push(`| \`${name}\` | ${esc(e.when)} | ${props.length ? props.join('<br>') : '(none)'} | ${e.reqs.join(', ')} |`);
    }
    out.push('');
  }
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
