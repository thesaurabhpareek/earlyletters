#!/usr/bin/env node
// Which changed paths the agent fence (D-041) treats as fenced. Self-contained
// on purpose: fence.yml fetches this one file from the trusted base ref through
// the API and runs it, so it must not import anything from the repository.
//
// Fenced:
//   supabase/**   database schema, access rules, tests, config
//   .github/**    CI, guard, fence, CODEOWNERS
//   auth code     anywhere in the repo: any folder name or file stem (the name
//                 up to its first dot) that starts with one of AUTH_WORDS,
//                 ignoring case. So `auth/`, `services/auth/x.ts`,
//                 `authentication/useLogin.ts`, `authState.ts`, `login.ts`,
//                 `session.ts`, `sign-in.tsx`, `passkey.ts`, `token.ts`,
//                 and Expo Router groups such as `(auth)/`.
//
// Not fenced, though a name matches (justified exclusions, NOT_AUTH):
//   docs/**                     prose and decision records; no code runs from it
//   packages/design-tokens/**   colour, type and spacing tokens, not credentials
//   author*, tokeniz*/tokenis*  words that start like auth/token but are not
//                               (authoriz*/authoris* stay fenced)
//
// Usage: printf '%s\n' <paths> | node fence-paths.mjs   (prints the fenced ones)
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export const FENCED_ROOTS = [/^supabase\//, /^\.github\//];

export const AUTH_WORDS = [
  'auth', // auth, authentication, authState, authorization
  'oauth',
  'session',
  'sign-in', 'signin', 'sign_in',
  'sign-up', 'signup', 'sign_up',
  'sign-out', 'signout', 'sign_out',
  'login', 'log-in', 'log_in',
  'logout', 'log-out', 'log_out',
  'passkey',
  'token',
  'credential',
];

export const NOT_AUTH_PATHS = [/^docs\//, /^packages\/design-tokens\//];
export const NOT_AUTH_WORDS = [/^author(?!i[sz])/i, /^tokeni[sz]/i];

// Folder names and the file stem (text before the first dot), with surrounding
// punctuation removed so Expo Router names such as `(auth)`, `[session]` and
// `_login` count, as do dotfiles.
export function segments(path) {
  const parts = path.split('/').filter(Boolean);
  if (parts.length === 0) return [];
  const file = parts.pop().replace(/^\.+/, '');
  const stem = file.split('.')[0];
  return [...parts, stem].map((s) => s.replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9]+$/g, '')).filter(Boolean);
}

export function isAuthSegment(seg) {
  const s = seg.toLowerCase();
  if (NOT_AUTH_WORDS.some((re) => re.test(s))) return false;
  return AUTH_WORDS.some((w) => s.startsWith(w));
}

export function isFenced(path) {
  const p = path.replace(/^\.\//, '');
  if (FENCED_ROOTS.some((re) => re.test(p))) return true;
  if (NOT_AUTH_PATHS.some((re) => re.test(p))) return false;
  return segments(p).some(isAuthSegment);
}

export function fencedPaths(paths) {
  return paths.filter((p) => p && isFenced(p));
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const paths = readFileSync(0, 'utf8').split('\n').map((l) => l.trim()).filter(Boolean);
  for (const p of fencedPaths(paths)) console.log(p);
}
