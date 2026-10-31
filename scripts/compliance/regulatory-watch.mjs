#!/usr/bin/env node
// Regulatory watch (CTO ruling CR-22; owner: regulatory-affairs; skill regulatory-compliance section 5).
// Asks the Federal Register API for new documents on the topics in
// scripts/compliance/watch-topics.json and prints what it found.
// Federal only: state law is checked by hand (references/checked-facts.md).
//
//   node scripts/compliance/regulatory-watch.mjs [--since 2026-10-01] [--out watch.json]
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/compliance/regulatory-watch.mjs --record
//
// --record stores the items through public.ops_regwatch_record (idempotent; triage happens there).
// The API is public and free (federalregister.gov/developers); no key. Network failures exit 2 so a
// scheduled run shows as failed instead of reporting "nothing new".
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const TOPICS_PATH = join(ROOT, 'scripts', 'compliance', 'watch-topics.json');
const API = 'https://www.federalregister.gov/api/v1/documents.json';
const FIELDS = ['document_number', 'title', 'publication_date', 'html_url', 'type'];

export function loadTopics(path = TOPICS_PATH) {
  const cfg = JSON.parse(readFileSync(path, 'utf8'));
  if (!Array.isArray(cfg.topics) || !cfg.topics.length) throw new Error('watch-topics.json has no topics');
  for (const t of cfg.topics) {
    if (!/^[a-z0-9-]{1,40}$/.test(t.id ?? '')) throw new Error(`bad topic id: ${t.id}`);
    if (!Array.isArray(t.terms) || !t.terms.length) throw new Error(`topic ${t.id} has no terms`);
    if (!Array.isArray(t.agencies) || !t.agencies.every((a) => /^[a-z0-9-]+$/.test(a))) throw new Error(`topic ${t.id} has bad agencies`);
  }
  return cfg;
}

export function buildUrl(term, agencies, since, perPage = 50) {
  const p = new URLSearchParams();
  p.set('conditions[term]', term);
  for (const a of agencies) p.append('conditions[agencies][]', a);
  p.set('conditions[publication_date][gte]', since);
  p.set('per_page', String(perPage));
  p.set('order', 'newest');
  for (const f of FIELDS) p.append('fields[]', f);
  return `${API}?${p}`;
}

export function normalize(results, topic) {
  return (results ?? [])
    .filter((r) => r && r.document_number && r.title && /^https:\/\//.test(r.html_url ?? ''))
    .map((r) => ({
      source: 'federal_register', external_id: String(r.document_number).slice(0, 120), topic,
      title: String(r.title).slice(0, 500), url: r.html_url,
      published_on: /^\d{4}-\d{2}-\d{2}$/.test(r.publication_date ?? '') ? r.publication_date : null,
      doc_type: r.type ? String(r.type).slice(0, 40) : null,
    }));
}

export function dedupe(items) {
  const seen = new Map();
  for (const i of items) seen.set(`${i.source}|${i.external_id}|${i.topic}`, i);
  return [...seen.values()].sort((a, b) => (b.published_on ?? '').localeCompare(a.published_on ?? '') || a.external_id.localeCompare(b.external_id));
}

export async function watch({ since, topicsPath = TOPICS_PATH, fetchImpl = fetch } = {}) {
  const cfg = loadTopics(topicsPath);
  const from = since ?? new Date(Date.now() - (cfg.lookback_days ?? 14) * 86400e3).toISOString().slice(0, 10);
  const all = [];
  for (const t of cfg.topics) {
    for (const term of t.terms) {
      const res = await fetchImpl(buildUrl(term, t.agencies, from), { headers: { accept: 'application/json' } });
      if (!res.ok) throw new Error(`Federal Register API ${res.status} for ${t.id} / ${term}`);
      const body = await res.json();
      all.push(...normalize(body.results, t.id));
    }
  }
  return { since: from, items: dedupe(all) };
}

export async function record(items, { url, key, fetchImpl = fetch }) {
  const res = await fetchImpl(`${url.replace(/\/$/, '')}/rest/v1/rpc/ops_regwatch_record`, {
    method: 'POST',
    headers: { apikey: key, authorization: `Bearer ${key}`, 'content-type': 'application/json' },
    body: JSON.stringify({ p_items: items }),
  });
  if (!res.ok) throw new Error(`ops_regwatch_record ${res.status}`);
  return Number(await res.json());
}

async function main(argv) {
  const arg = (k) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : undefined; };
  try {
    const { since, items } = await watch({ since: arg('--since') });
    console.log(`Federal Register, since ${since}: ${items.length} item(s)`);
    for (const i of items) console.log(`- [${i.topic}] ${i.published_on ?? '?'} ${i.doc_type ?? ''}: ${i.title} ${i.url}`);
    if (arg('--out')) writeFileSync(arg('--out'), JSON.stringify({ since, items }, null, 2) + '\n');
    if (argv.includes('--record')) {
      const { SUPABASE_URL: url, SUPABASE_SERVICE_ROLE_KEY: key } = process.env;
      if (!url || !key) throw new Error('--record needs SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
      for (let i = 0; i < items.length; i += 500) console.log(`recorded ${await record(items.slice(i, i + 500), { url, key })} new`);
    }
  } catch (e) {
    console.error(`regulatory-watch: ${e.message}`);
    process.exit(2);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main(process.argv.slice(2));
