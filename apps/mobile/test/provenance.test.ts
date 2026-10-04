import { describe, expect, it } from 'vitest';
import { provenanceKey } from '../src/lib/provenance';

const spoken = { captureMode: 'spoken' };

describe('provenance (D-086): "exactly as said" only when it is true', () => {
  it('calls untouched spoken words exactly as said', () => {
    expect(provenanceKey({ ...spoken, rawTranscript: 'Asha laughed today', finalText: 'Asha laughed today' })).toBe('spokenExact');
  });

  it('calls a letter with a punctuation fix "with small fixes", even at verbatim level', () => {
    // A Hindi-style letter kept at the verbatim level still carries added full stops: not "exactly as said".
    expect(provenanceKey({ ...spoken, rawTranscript: 'Asha laughed today', finalText: 'Asha laughed today.' })).toBe('spokenFixed');
  });

  it('calls a letter with a taken-out um "with small fixes"', () => {
    expect(provenanceKey({ ...spoken, rawTranscript: 'She um laughed', finalText: 'She laughed' })).toBe('spokenFixed');
  });

  it('ignores only surrounding space when comparing', () => {
    expect(provenanceKey({ ...spoken, rawTranscript: ' She laughed ', finalText: 'She laughed' })).toBe('spokenExact');
  });

  it('never calls typed words spoken', () => {
    expect(provenanceKey({ captureMode: 'typed', rawTranscript: 'We went out', finalText: 'We went out' })).toBe('typed');
    expect(provenanceKey({ captureMode: 'mixed', rawTranscript: 'We went out', finalText: 'We went out' })).toBe('typed');
  });
});
