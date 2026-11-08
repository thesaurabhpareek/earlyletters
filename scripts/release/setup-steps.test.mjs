// Validates docs/release/setup-steps.json (RS-05). Run: node --test scripts/release/setup-steps.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { REGISTRY_PATH, PROBES, EXPO_PROJECT_ID } from './setup-state.mjs';

const raw = readFileSync(REGISTRY_PATH, 'utf8');
const reg = JSON.parse(raw);
const steps = reg.steps;
const ids = steps.map((s) => s.id);

// Every step id in the setup record's section 3 on 1 Nov 2026 (Chains A to D, hygiene). A new S-id there
// must be added both here and to the registry.
const LEDGER_IDS = [
  'S-00', 'S-01', 'S-02', 'S-03', 'S-04', 'S-04b', 'S-05', 'S-06', 'S-07', 'S-08', 'S-09', 'S-10', 'S-11',
  'S-12', 'S-12b', 'S-13', 'S-14', 'S-15', 'S-16', 'S-17', 'S-18', 'S-21',
  'S-31', 'S-32', 'S-33', 'S-34', 'S-35', 'S-36', 'S-37', 'S-38', 'S-39', 'S-40', 'S-41', 'S-42', 'S-43', 'S-44', 'S-45', 'S-46',
  'S-50', 'S-51', 'S-52', 'S-53', 'S-54', 'S-55',
];

test('ids are unique and well formed', () => {
  assert.equal(new Set(ids).size, ids.length, `duplicate ids: ${ids.filter((x, i) => ids.indexOf(x) !== i)}`);
  for (const id of ids) assert.match(id, /^(S-\d{2}[a-z]?|GH-\d{2})$/, id);
});

test('every step id of the setup record is present', () => {
  const missing = LEDGER_IDS.filter((id) => !ids.includes(id));
  assert.deepEqual(missing, []);
});

test('every depends resolves, and no step depends on itself', () => {
  for (const s of steps) {
    assert.ok(Array.isArray(s.depends), `${s.id}: depends must be a list`);
    for (const d of s.depends) {
      assert.ok(ids.includes(d), `${s.id} depends on unknown ${d}`);
      assert.notEqual(d, s.id, `${s.id} depends on itself`);
    }
  }
});

test('fields use the registry enums', () => {
  const e = reg.enums;
  for (const s of steps) {
    assert.ok(e.owner.includes(s.owner), `${s.id}: owner ${s.owner}`);
    assert.ok(s.wall === null || e.wall.includes(s.wall), `${s.id}: wall ${s.wall}`);
    assert.ok(e.blocks.includes(s.blocks), `${s.id}: blocks ${s.blocks}`);
    assert.ok(e.recurrence.includes(s.recurrence), `${s.id}: recurrence ${s.recurrence}`);
    assert.ok(e.ledgerStatus.includes(s.ledger?.status), `${s.id}: ledger.status`);
    assert.match(s.ledger.date, /^\d{4}-\d{2}-\d{2}$/, `${s.id}: ledger.date`);
    assert.equal(typeof s.title, 'string');
    assert.equal(typeof s.minutes, 'number', `${s.id}: minutes`);
    assert.match(s.link, /^https:\/\//, `${s.id}: link must be a public https URL`);
  }
});

test('every step has a probe that exists, or attest: true', () => {
  for (const s of steps) {
    assert.ok(Boolean(s.probe) !== Boolean(s.attest), `${s.id}: exactly one of probe or attest`);
    if (s.probe) assert.equal(typeof PROBES[s.probe], 'function', `${s.id}: no probe named ${s.probe}`);
    if (s.attest) assert.equal(s.attest, true);
  }
});

test('every founder step has a wall or minutes, and a probe or attest', () => {
  for (const s of steps.filter((x) => x.owner === 'founder')) {
    assert.ok(s.wall || s.minutes > 0, `${s.id}: founder step needs a wall or minutes`);
    assert.ok(s.probe || s.attest, `${s.id}: founder step needs a probe or attest`);
  }
});

test('open founder steps carry a queue position', () => {
  for (const s of steps.filter((x) => x.owner === 'founder' && x.ledger.status === 'open')) {
    assert.equal(typeof s.queue, 'number', `${s.id}: queue`);
  }
});

test('no string looks like an email or a personal identifier', () => {
  const strings = [];
  const walk = (v) => {
    if (typeof v === 'string') strings.push(v);
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === 'object') Object.entries(v).forEach(([k, x]) => { strings.push(k); walk(x); });
  };
  walk(reg);
  const uuid = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
  for (const s of strings) {
    assert.doesNotMatch(s, /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/, `email-like: ${s}`);
    assert.doesNotMatch(s, /gmail|icloud\.com|outlook\.com|yahoo\./i, `personal mail domain: ${s}`);
    assert.doesNotMatch(s, /\bteam_[A-Za-z0-9]{8,}/, `vendor team id: ${s}`);
    assert.doesNotMatch(s, /\bprj_[A-Za-z0-9]{8,}/, `vendor project id: ${s}`);
    assert.doesNotMatch(s, /\(?\b\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}\b/, `phone-like number: ${s}`);
    assert.doesNotMatch(s, /\b[0-9a-f]{32}\b/i, `zone or account id: ${s}`);
    for (const u of s.match(uuid) ?? []) assert.equal(u, EXPO_PROJECT_ID, `only the public Expo project id may appear: ${u}`);
  }
});

test('the registry follows the content rules (no em or en dashes, curly quotes, ellipsis characters)', () => {
  assert.doesNotMatch(raw, /[\u2013\u2014\u2018\u2019\u201C\u201D\u2026]/);
});
