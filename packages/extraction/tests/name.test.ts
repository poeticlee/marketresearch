import { describe, it, expect } from 'vitest';
import { guessName, extractFromPageText } from '../src/extract';

describe('guessName', () => {
  it('picks the first short non-contact chunk', () => {
    expect(guessName('Iwo Road Auto Works. Call +2348012345678 today.')).toBe('Iwo Road Auto Works.');
  });
  it('skips pure phone/email chunks', () => {
    expect(guessName('+2348012345678 autos@example.ng. Iwo Road Auto Works. Open daily.')).toBe('Iwo Road Auto Works.');
  });
  it('falls back safely on empty text', () => {
    expect(guessName('   ')).toBe('Unknown organisation');
  });
  it('extraction uses the cleaned name', () => {
    const [r] = extractFromPageText({
      projectId: 'p', country: 'NG', sourceId: 's', sourceUrl: 'http://x',
      pageText: 'Iwo Road Auto Works. Tel: +2348012345678, mail: autos@example.ng',
    });
    expect(r.name).toBe('Iwo Road Auto Works.');
  });
});
