/**
 * Owner: E1 (web platform). The YAML header of a legal document. On its own so the e2e suite can read a
 * document's status without loading the Markdown pipeline.
 */
import { parse as parseYaml } from 'yaml';

export interface Frontmatter {
  title?: string;
  status?: string;
  version?: string;
  lastUpdated?: string;
  effectiveDate?: string;
}

export function splitFrontmatter(source: string): { data: Frontmatter; body: string } {
  const text = source.replace(/^﻿/, '');
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(text);
  if (!match) return { data: {}, body: text };
  const raw = parseYaml(match[1]) as Record<string, unknown> | null;
  const str = (v: unknown) => (v === undefined || v === null ? undefined : String(v));
  return {
    data: {
      title: str(raw?.title),
      status: str(raw?.status),
      version: str(raw?.version),
      lastUpdated: str(raw?.last_updated),
      effectiveDate: str(raw?.effective_date),
    },
    body: text.slice(match[0].length),
  };
}
