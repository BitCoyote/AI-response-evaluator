import { describe, expect, it } from 'vitest';
import { getScoreColor } from './utils';

describe('getScoreColor', () => {
  it('returns green for high scores', () => {
    expect(getScoreColor(85)).toBe('bg-emerald-500');
  });

  it('returns amber for medium scores', () => {
    expect(getScoreColor(65)).toBe('bg-amber-500');
  });

  it('returns red for low scores', () => {
    expect(getScoreColor(40)).toBe('bg-red-500');
  });

  it('inverts score when invert is true', () => {
    expect(getScoreColor(20, true)).toBe('bg-emerald-500');
  });
});
