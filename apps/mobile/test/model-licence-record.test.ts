/**
 * [FR-AIS-09] [FR-AIS-10] Every model file the phone can download has a
 * licence record, and the record agrees with the catalog. BL-1357.
 *
 * The record is markdown at `MODEL_LICENCE_RECORD_PATH` (test/helpers/licence-records.ts).
 * It sits under docs/ops/proposed/ until the exec review (D-172); moving it to
 * docs/legal/model-licences.md changes that one constant and nothing else.
 *
 * Failure modes this guards: a model added to `catalog.ts` as default or
 * candidate with no licence record (a store build could ship weights nobody
 * read the licence of); a file swapped or re-quantised so its bytes or hash
 * no longer match what the record describes; a non-permissive licence (the
 * catalog header rule: MIT, Apache-2.0, BSD or ISC only).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { MODEL_LICENCE_RECORD_PATH, parseModelLicenceRecords, type ModelLicenceRecords } from './helpers/licence-records';
import { SPEECH_MODELS, type SpeechModel } from '../src/lib/models/catalog';

/** Repo-relative path of the licence record (test/helpers/licence-records.ts, the one line to change when the file moves to docs/legal/). */
export { MODEL_LICENCE_RECORD_PATH };

const ROOT = join(__dirname, '..', '..', '..');

/** SPDX ids of the licences the catalog header accepts (MIT, Apache-2.0, BSD, ISC). */
export const ACCEPTED_LICENCES = ['MIT', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause', 'ISC'] as const;

/** The fields FR-AIS-09 requires in every record, by the names the record uses. */
export const RECORD_FIELDS = [
  'Status',
  'Licence',
  'Licence URL',
  'Date read',
  'Card read',
  'Training-data terms (counsel Q9)',
  'Size in bytes',
  'SHA-256',
  'Pinned upstream revision',
  'Build licence',
  'Hosting origin',
] as const;

type ModelFacts = Pick<SpeechModel, 'id' | 'bytes' | 'sha256' | 'licence' | 'status' | 'source'>;
export type LicenceRecords = ModelLicenceRecords;

/** Records keyed by catalog id; the parser lives in test/helpers/licence-records.ts, which FR-LEG-13's check (test/licences.test.ts) shares. */
export const parseLicenceRecords: (markdown: string) => LicenceRecords = parseModelLicenceRecords;

const leadingLicence = (s: string) => /^([A-Za-z0-9.-]+)/.exec(s)?.[1] ?? '';

/** Every way the records disagree with the catalog. Empty means the record is complete and true to it. */
export function licenceRecordProblems(models: readonly ModelFacts[], records: LicenceRecords): string[] {
  const problems: string[] = [];
  const accepted = ACCEPTED_LICENCES as readonly string[];
  for (const m of models) {
    if (m.status !== 'default' && m.status !== 'candidate') continue;
    if (!accepted.includes(m.licence)) problems.push(`${m.id}: catalog licence ${m.licence} is not accepted`);
    const r = records.get(m.id);
    if (!r) {
      problems.push(`${m.id}: no licence record`);
      continue;
    }
    for (const f of RECORD_FIELDS) if (!r.get(f)) problems.push(`${m.id}: record field "${f}" is missing or empty`);
    const bytes = Number((r.get('Size in bytes') ?? '').replace(/[,_\s]/g, ''));
    if (bytes !== m.bytes) problems.push(`${m.id}: record bytes ${r.get('Size in bytes')} differ from catalog ${m.bytes}`);
    if ((r.get('SHA-256') ?? '').toLowerCase() !== m.sha256) problems.push(`${m.id}: record SHA-256 differs from catalog`);
    const licence = r.get('Licence') ?? '';
    if (!accepted.includes(licence)) problems.push(`${m.id}: record licence "${licence}" is not accepted`);
    if (licence !== m.licence) problems.push(`${m.id}: record licence "${licence}" differs from catalog ${m.licence}`);
    const build = leadingLicence(r.get('Build licence') ?? '');
    if (!accepted.includes(build)) problems.push(`${m.id}: build licence "${build}" is not accepted`);
    if (r.get('Status') !== m.status) problems.push(`${m.id}: record status "${r.get('Status')}" differs from catalog ${m.status}`);
    const revision = r.get('Pinned upstream revision') ?? '';
    if (!revision.includes(m.source.revision) || !revision.includes(m.source.sha256)) {
      problems.push(`${m.id}: record revision does not name the catalog source revision and source hash`);
    }
  }
  return problems;
}

const catalog = (): ModelFacts[] => Object.values(SPEECH_MODELS);
const records = () => parseLicenceRecords(readFileSync(join(ROOT, MODEL_LICENCE_RECORD_PATH), 'utf8'));

describe('[FR-AIS-09] every default or candidate model file has a licence record that matches the catalog', () => {
  it('[FR-AIS-09] the record exists and has a record for every default or candidate catalog id', () => {
    const r = records();
    const shipped = catalog().filter((m) => m.status === 'default' || m.status === 'candidate');
    expect(shipped.length).toBeGreaterThan(0);
    expect(shipped.filter((m) => !r.has(m.id)).map((m) => m.id)).toEqual([]);
  });

  it('[FR-AIS-09] each record has every field, the catalog bytes and hash, and an accepted licence', () => {
    expect(licenceRecordProblems(catalog(), records())).toEqual([]);
  });

  it('[FR-AIS-09] a catalog entry with no record is caught', () => {
    const extra: ModelFacts = { ...SPEECH_MODELS['speech-model.whisper-small-q5_1'], id: 'speech-model.not-recorded' as SpeechModel['id'], status: 'candidate' };
    expect(licenceRecordProblems([...catalog(), extra], records())).toContain('speech-model.not-recorded: no licence record');
  });

  it('[FR-AIS-09] a catalog hash or size that differs from the record is caught', () => {
    const vad = SPEECH_MODELS['speech-model.silero-vad-v6.2.0'];
    const swapped = { ...vad, sha256: '0'.repeat(64), bytes: vad.bytes + 1 };
    const problems = licenceRecordProblems([swapped], records());
    expect(problems).toContain('speech-model.silero-vad-v6.2.0: record SHA-256 differs from catalog');
    expect(problems.some((p) => p.includes('record bytes'))).toBe(true);
  });

  it('[FR-AIS-09] a licence outside MIT, Apache-2.0, BSD or ISC is caught, in the catalog or in the record', () => {
    const gpl = { ...SPEECH_MODELS['speech-model.whisper-small-q5_1'], licence: 'GPL-3.0' as SpeechModel['licence'] };
    expect(licenceRecordProblems([gpl], records())).toContain('speech-model.whisper-small-q5_1: catalog licence GPL-3.0 is not accepted');
    const r = records();
    r.get('speech-model.whisper-small-q5_1')!.set('Licence', 'CC-BY-NC-4.0');
    expect(licenceRecordProblems(catalog(), r)).toContain('speech-model.whisper-small-q5_1: record licence "CC-BY-NC-4.0" is not accepted');
  });
});

describe('[FR-AIS-10] the record states the five catalog models as of 20 Nov', () => {
  const expected = [
    { id: 'speech-model.whisper-large-v3-turbo-q5_0', licence: 'MIT', bytes: '574041195', status: 'default' },
    { id: 'speech-model.whisper-small-q5_1', licence: 'MIT', bytes: '190085487', status: 'default' },
    { id: 'speech-model.silero-vad-v6.2.0', licence: 'MIT', bytes: '885098', status: 'default' },
    { id: 'speech-model.whisper-hindi-small-q5_1', licence: 'Apache-2.0', bytes: '190085487', status: 'default' },
    { id: 'speech-model.belle-whisper-turbo-zh-q5_0', licence: 'Apache-2.0', bytes: '574041195', status: 'candidate' },
  ];

  it('[FR-AIS-10] licence, bytes and status of each of the five models', () => {
    const r = records();
    expect(expected.map((e) => ({ id: e.id, licence: r.get(e.id)?.get('Licence'), bytes: r.get(e.id)?.get('Size in bytes'), status: r.get(e.id)?.get('Status') }))).toEqual(expected);
  });

  it('[FR-AIS-10] the Hindi model is built from vasista22/whisper-hindi-small and its training data waits on counsel (Q9)', () => {
    const hindi = records().get('speech-model.whisper-hindi-small-q5_1')!;
    expect(hindi.get('Pinned upstream revision')).toContain('vasista22/whisper-hindi-small');
    const q9 = hindi.get('Training-data terms (counsel Q9)')!;
    expect(q9.startsWith('open')).toBe(true);
    for (const corpus of ['GramVaani', 'ULCA', 'Shrutilipi', 'FLEURS']) expect(q9).toContain(corpus);
  });
});
