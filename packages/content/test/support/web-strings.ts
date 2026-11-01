/**
 * The words earlyletters.com shows, read from the source of `apps/web` (the site the public reads).
 *
 * `apps/web/src/content/site.ts` is "every word on earlyletters.com" by its own header; the claims test imports it as
 * an object, so its keys are stable dotted paths. Everything else under `apps/web/src` is read here as source: every
 * string literal, template literal and JSX text in every `.ts` and `.tsx` file, so a line typed straight into a scene
 * (S04Exact.tsx, ProofScene.tsx) is read too. Comments and module paths are not copy and are skipped. What is not
 * read, and why, is `WEB_NOT_READ`; a path there that no longer exists fails the claims test.
 */
import { createRequire } from 'node:module';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import type * as TS from 'typescript';
import type { Leaf } from './copy-surfaces';

// Loaded by Node, not through vitest's transform, which takes seconds over the compiler's one large file.
const ts = createRequire(import.meta.url)('typescript') as typeof TS;

export const WEB_SRC = fileURLToPath(new URL('../../../../apps/web/src', import.meta.url));

/** Files and folders under apps/web/src that are not public copy, relative to WEB_SRC. */
export const WEB_NOT_READ: Readonly<Record<string, string>> = {
  'content/site.ts': 'imported whole by the claims test, keyed by its dotted paths',
  'app/lab': 'the scene test pages; production answers /lab with 404 unless ENABLE_LAB=1 (next.config.ts)',
  'film/Lab.tsx': 'the frame only the /lab pages render',
  'scenes/parts/act3/fonts.ts': 'font family names for the browser (for example "Noto Naskh Arabic"), never shown as words',
};

const isTest = (path: string) => /\.test\.tsx?$/.test(path);

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    const rel = relative(WEB_SRC, path);
    if (rel in WEB_NOT_READ) return [];
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.tsx?$/.test(entry.name) && !isTest(entry.name) ? [path] : [];
  });
}

/** Every string a source file holds, in order: literals, template text (substitutions dropped) and JSX text. */
export function stringsIn(file: string, source = readFileSync(file, 'utf8')): string[] {
  const kind = file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, false, kind);
  const out: string[] = [];
  const visit = (node: TS.Node) => {
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) return; // module paths, not copy
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) out.push(node.text);
    else if (ts.isTemplateExpression(node)) out.push([node.head.text, ...node.templateSpans.map((s) => s.literal.text)].join(' '));
    else if (ts.isJsxText(node)) {
      const text = node.text.replace(/\s+/g, ' ').trim();
      if (text) out.push(text);
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return out;
}

/**
 * The web source strings as leaves. The key names the file and the string itself (its first 60 characters), so a row
 * in KNOWN_VIOLATIONS names the exact string and does not move when lines around it do.
 */
export function webSourceLeaves(): Leaf[] {
  return sourceFiles(WEB_SRC).flatMap((file) =>
    stringsIn(file).map((text) => ({ path: `web:${relative(WEB_SRC, file)} "${text.slice(0, 60)}"`, text })),
  );
}

/** Paths in WEB_NOT_READ that no longer exist (the list must not hold stale exclusions). */
export function staleWebExclusions(): string[] {
  return Object.keys(WEB_NOT_READ).filter((rel) => !existsSync(join(WEB_SRC, rel)));
}
