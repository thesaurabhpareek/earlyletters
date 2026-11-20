/// <reference types="node" />
/**
 * Finds the LATEST definition of a database object by scanning supabase/migrations
 * in sort order and keeping the last one found. Never a line number (E29: a later
 * migration restates a function or view and the old number goes stale).
 * Pure functions over text, so a test can feed a synthetic migration to them.
 */

export type MigrationText = { f: string; text: string };

const stripComments = (s: string): string => s.replace(/--[^\n]*/g, '');

/** The body of the last `create [or replace] function public.<name>(` ... `$$;` in the given files. */
export function latestFunction(files: readonly MigrationText[], name: string): string {
  const re = new RegExp(`create (?:or replace )?function public\\.${name}\\s*\\(`, 'g');
  let body = '';
  for (const { text } of files) {
    let m: RegExpExecArray | null;
    re.lastIndex = 0;
    while ((m = re.exec(text))) {
      const end = text.indexOf('\n$$;', m.index);
      body = text.slice(m.index, end > 0 ? end : undefined);
    }
  }
  return body;
}

/** The text of the last `create [or replace] view public.<name>` up to its closing semicolon (comments removed). */
export function latestView(files: readonly MigrationText[], name: string): string {
  const re = new RegExp(`create (?:or replace )?view public\\.${name}\\b`, 'g');
  let body = '';
  for (const { text } of files) {
    let m: RegExpExecArray | null;
    re.lastIndex = 0;
    while ((m = re.exec(text))) {
      const end = text.indexOf(';', m.index);
      body = stripComments(text.slice(m.index, end > 0 ? end : undefined));
    }
  }
  return body;
}

/** Columns of `new.<col>` in the first parenthesised tuple that `v_content := (` assigns. Empty when the tuple is not found. */
export function contentTupleColumns(fnBody: string): string[] {
  const m = /v_content\s*:=\s*\(([\s\S]*?)\)\s*is distinct from/.exec(stripComments(fnBody));
  if (!m) return [];
  return [...m[1].matchAll(/\bnew\.([a-z_]+)/g)].map((x) => x[1]);
}

/** Columns the view selects from the entries alias `e` (the select list, before `from`). Empty when not found. */
export function viewColumns(viewSql: string, alias = 'e'): string[] {
  const m = /\bselect\b([\s\S]*?)\bfrom\b/i.exec(viewSql);
  if (!m) return [];
  return [...m[1].matchAll(new RegExp(`\\b${alias}\\.([a-z_]+)`, 'g'))].map((x) => x[1]);
}
