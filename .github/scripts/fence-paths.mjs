#!/usr/bin/env node
// Which changed paths the agent fence (D-041) treats as fenced. Self-contained
// on purpose: fence.yml fetches this one file from the trusted base ref through
// the API and runs it, so it must not import anything from the repository.
//
// Fenced:
//   supabase/**   database schema, access rules, tests, config
//   .github/**    CI, guard, fence, CODEOWNERS
//   auth code     anywhere in the repo: any folder name or file stem (the name
//                 up to its first dot) containing an AUTH_WORD that starts at
//                 a word boundary, ignoring case. Names are split into words on
//                 camelCase, `-`, `_`, digits and other punctuation, and a word
//                 run may span words (`Sign`+`In`, `log`+`in`). So `auth/`,
//                 `services/auth/x.ts`, `authentication/useLogin.ts`,
//                 `authState.ts`, `useAuth.ts`, `AppleSignIn.tsx`,
//                 `apple-sign-in.ts`, `accessToken.ts`, `refresh-token.ts`,
//                 `jwt.ts`, `supabaseClient.ts` and Expo Router groups such as
//                 `(auth)/`. Not caught: an auth word buried mid-word in an
//                 all-lowercase name (`useauth.ts`); see .github/README.md.
//
// Not fenced, though a name matches (justified exclusions):
//   docs/**                     prose and decision records; no code runs from it
//   packages/design-tokens/**   colour, type and spacing tokens, not credentials
//   author*, tokeniz*/tokenis*  words that start like auth/token but are not
//                               (authoriz*/authoris* stay fenced)
//
// Usage: printf '%s\n' <paths> | node fence-paths.mjs   (prints the fenced ones)
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export const FENCED_ROOTS = [/^supabase\//, /^\.github\//];

// Compared against runs of words joined without separators, so `signin`
// covers sign-in, sign_in, signIn and SignIn.
export const AUTH_WORDS = [
  'auth', // auth, authentication, authState, authorization
  'reauth',
  'oauth',
  'session',
  'signin', 'signup', 'signout',
  'login', 'logout',
  'passkey',
  'token', // token, accessToken, refresh-token, tokenStore
  'jwt',
  'credential',
  'supabase', // the Supabase client holds auth and session config
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

// Lowercase words of one segment: `AppleSignIn` -> apple, sign, in;
// `refresh-token` -> refresh, token; `JWTToken2` -> jwt, token, 2.
export function words(seg) {
  return seg
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/([A-Za-z])([0-9])|([0-9])([A-Za-z])/g, '$1$3 $2$4')
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map((w) => w.toLowerCase());
}

export function isAuthSegment(seg) {
  const ws = words(seg);
  for (let i = 0; i < ws.length; i++) {
    if (NOT_AUTH_WORDS.some((re) => re.test(ws[i]))) continue;
    const run = ws.slice(i).join('');
    if (AUTH_WORDS.some((w) => run.startsWith(w))) return true;
  }
  return false;
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
