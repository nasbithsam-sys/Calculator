import { describe, it, expect } from 'vitest';
import { calculatePreliminaryEstimate } from '../lib/pricing/calculateEstimate';
import { recommendKits } from '../config/products';

describe('calculatePreliminaryEstimate', () => {
  it('returns incomplete status when footage is <= 0', () => {
    const result = calculatePreliminaryEstimate(0);
    expect(result.status).toBe('incomplete');
    expect(result.estimatedLinearFeet).toBeNull();
    expect(result.priceRange).toBeNull();
  });

  it('calculates standard base price without multipliers', () => {
    const result = calculatePreliminaryEstimate(100, undefined, 0.15);
    // 100 * $25 = $2500. Range: +/- 15% -> 2500 * 0.15 = 375
    // Min = 2500 - 375 = 2125
    // Max = 2500 + 375 = 2875
    expect(result.status).toBe('preliminary');
    expect(result.priceRange?.min).toBe(2125);
    expect(result.priceRange?.max).toBe(2875);
  });

  it('enforces minimum charge', () => {
    const result = calculatePreliminaryEstimate(10, undefined, 0.0);
    // 10 * 25 = 250, but min charge is 500
    expect(result.priceRange?.min).toBe(500);
    expect(result.priceRange?.max).toBe(500);
  });

  it('applies story and complexity multipliers', () => {
    const result = calculatePreliminaryEstimate(100, { stories: 2, roofComplexity: 'complex' }, 0.0);
    // 100 * 25 = 2500
    // Stories=2 -> 1.15
    // Complexity=complex -> 1.25
    // 2500 * 1.15 * 1.25 = 3593.75
    expect(result.priceRange?.min).toBe(3593); // Math.floor(3593.75)
    expect(result.priceRange?.max).toBe(3594); // Math.ceil(3593.75)
  });
});

describe('recommendKits', () => {
  it('returns empty array for <= 0 feet', () => {
    expect(recommendKits(0)).toEqual([]);
  });

  it('returns a 150ft kit for 150 feet', () => {
    const kits = recommendKits(150);
    expect(kits.length).toBe(1);
    expect(kits[0].lengthFeet).toBe(150);
    expect(kits[0].dataStatus).toBe('sample');
  });

  it('combines kits for custom lengths', () => {
    const kits = recommendKits(200);
    expect(kits.length).toBe(2);
    // Should be one 150 and one 50 based on our simplistic logic
    const totalLength = kits.reduce((sum, k) => sum + k.lengthFeet, 0);
    expect(totalLength).toBe(200);
  });
});
