import { argv, env, exit, guardCrashes, print, printError } from './lib/cli.ts';
import { STOPPED_LINE, watchMain } from './lib/purge-watch.ts';

guardCrashes(STOPPED_LINE, 2);
try {
  const r = await watchMain(argv(), { SUPABASE_URL: env('SUPABASE_URL'), SUPABASE_SERVICE_ROLE_KEY: env('SUPABASE_SERVICE_ROLE_KEY') },
    (url, init) => fetch(url, init));
  for (const line of r.lines) (r.code ? printError : print)(line);
  exit(r.code);
} catch {
  printError(STOPPED_LINE);
  exit(2);
}
