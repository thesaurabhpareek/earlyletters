// node --test scripts/guards/placeholder-scan.test.mjs (wired into the root `npm test` list).
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { appEnvOf, main, placeholders, scanPublisher } from './placeholder-scan.mjs';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const eas = JSON.parse(readFileSync(join(REPO, 'apps/mobile/eas.json'), 'utf8'));
const quiet = () => {};
const brandModule = (publisher) => {
  const f = join(mkdtempSync(join(tmpdir(), 'placeholder-scan-')), 'brand.mjs');
  writeFileSync(f, `export const brand = { name: 'Early Letters', publisher: ${JSON.stringify(publisher)} };\n`);
  return f;
};
const TODO = { kind: 'individual', legalName: 'TODO: individual publisher', domain: 'earlyletters.com' };
const DONE = { kind: 'individual', legalName: 'Individual publisher, named in the legal documents', domain: 'earlyletters.com' };

test('[BL-2125] a TODO publisher value fails a preview and a production build; development is exempt', () => {
  assert.deepEqual(scanPublisher(TODO, 'preview'), ['publisher.legalName']);
  assert.deepEqual(scanPublisher(TODO, 'production'), ['publisher.legalName']);
  assert.deepEqual(scanPublisher(TODO, 'development'), []);
  assert.deepEqual(scanPublisher(DONE, 'production'), []);
  assert.throws(() => scanPublisher(DONE, 'staging'), /unknown app env/);
});

test('[BL-2125] nested publisher values are read too, and only the word TODO counts', () => {
  assert.deepEqual(placeholders({ address: { line1: 'TODO' }, note: 'todos are fine', n: 3 }), ['publisher.address.line1']);
});

test('[BL-2125] each eas.json profile maps to its app env, so testflight counts as preview', () => {
  assert.equal(appEnvOf(eas, 'testflight'), 'preview');
  assert.equal(appEnvOf(eas, 'preview'), 'preview');
  assert.equal(appEnvOf(eas, 'production'), 'production');
  assert.equal(appEnvOf(eas, 'development'), 'development');
  assert.equal(appEnvOf({ build: { a: {} } }, 'a'), 'development');
});

test('[BL-2125] the command fails a planted TODO under preview and passes it under development', async () => {
  const planted = brandModule(TODO);
  assert.equal(await main(['--app-env', 'preview', '--brand', planted], quiet, quiet), 1);
  assert.equal(await main(['--profile', 'production', '--brand', planted], quiet, quiet), 1);
  assert.equal(await main(['--profile', 'development', '--brand', planted], quiet, quiet), 0);
  assert.equal(await main(['--app-env', 'production', '--brand', brandModule(DONE)], quiet, quiet), 0);
});

test('[BL-2125] the real packages/brand passes a development build', async () => {
  assert.equal(await main(['--app-env', 'development'], quiet, quiet), 0);
});

test('[BL-2125] no environment, two of them or an unknown one is exit 2, never a silent development pass', async () => {
  assert.equal(await main([], quiet, quiet), 2);
  assert.equal(await main(['--app-env', 'preview', '--profile', 'preview'], quiet, quiet), 2);
  assert.equal(await main(['--app-env', 'staging'], quiet, quiet), 2);
  assert.equal(await main(['--profile', 'no-such-profile'], quiet, quiet), 2);
});
