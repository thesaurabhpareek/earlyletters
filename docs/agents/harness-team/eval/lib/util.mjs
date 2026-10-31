// Small helpers shared by the eval harness. Node 22+, no dependencies.
import { spawnSync } from 'node:child_process';

/** Run a command; never throws. Returns { code, stdout, stderr, ms }. */
export function sh(cmd, { cwd, env, timeoutMs = 600_000, input } = {}) {
  const t0 = Date.now();
  const r = spawnSync('bash', ['-c', cmd], {
    cwd,
    env: { ...process.env, ...env },
    encoding: 'utf8',
    timeout: timeoutMs,
    input,
    maxBuffer: 64 * 1024 * 1024,
  });
  return {
    code: r.status ?? (r.signal ? 124 : 1),
    stdout: r.stdout ?? '',
    stderr: (r.stderr ?? '') + (r.error ? `\n${r.error.message}` : ''),
    ms: Date.now() - t0,
  };
}

/** Run git with an argument array (no shell quoting issues). */
export function git(args, { cwd, input } = {}) {
  const r = spawnSync('git', args, { cwd, encoding: 'utf8', input, maxBuffer: 64 * 1024 * 1024 });
  return { code: r.status ?? 1, stdout: r.stdout ?? '', stderr: r.stderr ?? '' };
}

export function gitOk(args, opts) {
  const r = git(args, opts);
  if (r.code !== 0) throw new Error(`git ${args.join(' ')} failed: ${r.stderr.trim()}`);
  return r.stdout;
}

/** Minimal glob to RegExp: ** spans directories, * stays in one segment, {a,b} alternation. */
export function globToRegExp(glob) {
  let re = '';
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === '*') {
      if (glob[i + 1] === '*') {
        i++;
        if (glob[i + 1] === '/') { i++; re += '(?:.*/)?'; } else re += '.*';
      } else re += '[^/]*';
    } else if (c === '?') re += '[^/]';
    else if (c === '{') {
      const end = glob.indexOf('}', i);
      re += '(?:' + glob.slice(i + 1, end).split(',').map((s) => s.replace(/[.+^$()|[\]\\]/g, '\\$&')).join('|') + ')';
      i = end;
    } else re += c.replace(/[.+^$()|[\]\\]/g, '\\$&');
  }
  return new RegExp(`^${re}$`);
}

export const matchesAny = (path, globs = []) => globs.some((g) => globToRegExp(g).test(path));

/** Last n characters of a string, for logs. */
export const tail = (s, n = 2000) => (s.length > n ? '...' + s.slice(-n) : s);
