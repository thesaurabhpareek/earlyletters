/**
 * The ops scripts' only contact with the terminal and the disk (Node 22,
 * type stripping: `node scripts/ops/<script>.ts`). Stdout gets counts, check
 * names and file paths only. Anything holding emails or ids goes to a file
 * created with mode 0600 in a path the operator chooses (keep it out of the
 * repo and delete it when the ticket closes).
 */
import { writeFileSync } from 'node:fs';
import process from 'node:process';

export type Args = { flags: Record<string, string | true>; lists: Record<string, string[]> };

/** `--name value`, `--name=value`, bare `--flag`; repeated names collect into `lists`. */
export function parseArgs(argv: string[]): Args {
  const flags: Record<string, string | true> = {};
  const lists: Record<string, string[]> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) continue;
    const eq = a.indexOf('=');
    const name = eq > 0 ? a.slice(2, eq) : a.slice(2);
    let value: string | true = true;
    if (eq > 0) value = a.slice(eq + 1);
    else if (i + 1 < argv.length && !argv[i + 1].startsWith('--')) value = argv[++i];
    flags[name] = value;
    if (typeof value === 'string') (lists[name] ??= []).push(value);
  }
  return { flags, lists };
}

export const env = (name: string): string => (process.env[name] ?? '').trim();

export function print(line = ''): void {
  console.log(line);
}

export function fail(message: string, code = 1): never {
  console.error(message);
  process.exit(code);
}

/** Writes a file only the operator can read. */
export function writePrivate(path: string, text: string): void {
  writeFileSync(path, text, { mode: 0o600 });
}

export const argv = (): string[] => process.argv.slice(2);
export const exit = (code: number): never => process.exit(code);
