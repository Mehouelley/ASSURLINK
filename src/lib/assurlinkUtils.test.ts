import { describe, expect, it } from 'vitest';
import { calculateNextYear, formatCurrencyXOF, formatDateFR, normalizeSearch } from './assurlinkUtils';

describe('assurlinkUtils', () => {
  it('formate le montant en XOF', () => {
    expect(formatCurrencyXOF(125000)).toBe('125 000 XOF');
  });

  it('formate une date en français', () => {
    expect(formatDateFR('2026-05-28')).toBe('28/05/2026');
  });

  it('calcule une date à un an', () => {
    expect(calculateNextYear('2026-05-28')).toBe('2027-05-28');
  });

  it('normalise la recherche', () => {
    expect(normalizeSearch('  Assurance Benin  ')).toBe('assurance benin');
  });
});
