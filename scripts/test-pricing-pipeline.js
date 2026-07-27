/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('assert');

function expect(actual) {
  return {
    toBe(expected) {
      assert.strictEqual(actual, expected);
    },
    toBeGreaterThan(expected) {
      assert.ok(actual > expected, 'Expected ' + actual + ' > ' + expected);
    },
    toBeGreaterThanOrEqual(expected) {
      assert.ok(actual >= expected, 'Expected ' + actual + ' >= ' + expected);
    },
    toBeLessThan(expected) {
      assert.ok(actual < expected, 'Expected ' + actual + ' < ' + expected);
    }
  };
}

const DEFAULT_TIER_MATRIX = {
  SMALL_LOW: { name: 'Small / Low Complexity', min: 650, max: 950 },
  SMALL_MODERATE: { name: 'Small / Moderate Complexity', min: 850, max: 1250 },
  SMALL_HIGH: { name: 'Small / High Complexity', min: 1100, max: 1600 },
  SMALL_EXTREME: { name: 'Small / Extreme Complexity', min: 1400, max: 2000 },
  MEDIUM_LOW: { name: 'Medium / Low Complexity', min: 1100, max: 1550 },
  MEDIUM_MODERATE: { name: 'Medium / Moderate Complexity', min: 1400, max: 1950 },
  MEDIUM_HIGH: { name: 'Medium / High Complexity', min: 1800, max: 2500 },
  MEDIUM_EXTREME: { name: 'Medium / Extreme Complexity', min: 2300, max: 3200 },
  LARGE_LOW: { name: 'Large / Low Complexity', min: 1700, max: 2300 },
  LARGE_MODERATE: { name: 'Large / Moderate Complexity', min: 2100, max: 2900 },
  LARGE_HIGH: { name: 'Large / High Complexity Residential', min: 2700, max: 3800 },
  LARGE_EXTREME: { name: 'Large / Extreme Complexity', min: 3500, max: 4800 },
  XL_LOW: { name: 'Extra Large / Low Complexity', min: 2500, max: 3500 },
  XL_MODERATE: { name: 'Extra Large / Moderate Complexity', min: 3200, max: 4400 },
  XL_HIGH: { name: 'Extra Large / High Complexity', min: 4000, max: 5600 },
  XL_EXTREME: { name: 'Extra Large / Extreme Complexity', min: 5000, max: 7500 }
};

function calculatePipeline(input) {
  const supportedInstallationFeet = input.customerProvidedFeet || 100;
  const allowancePercent = 15;
  const recommendedPurchasingFeet = Math.ceil(supportedInstallationFeet * (1 + allowancePercent / 100));

  let jobSize = 'Small';
  if (supportedInstallationFeet <= 100) jobSize = 'Small';
  else if (supportedInstallationFeet <= 180) jobSize = 'Medium';
  else if (supportedInstallationFeet <= 280) jobSize = 'Large';
  else jobSize = 'Extra Large';

  let score = 0;
  if (input.stories === 2) score += 15;
  if (input.stories >= 3) score += 35;
  if (input.roofComplexity === 'moderate') score += 15;
  if (input.roofComplexity === 'complex') score += 30;
  if (input.peaks) score += input.peaks * 5;

  let complexityBand = 'Low';
  if (score < 20) complexityBand = 'Low';
  else if (score < 45) complexityBand = 'Moderate';
  else if (score < 75) complexityBand = 'High';
  else complexityBand = 'Extreme';

  const jobCodeMap = { Small: 'SMALL', Medium: 'MEDIUM', Large: 'LARGE', 'Extra Large': 'XL' };
  const tierCode = jobCodeMap[jobSize] + '_' + complexityBand.toUpperCase();
  const tierInfo = DEFAULT_TIER_MATRIX[tierCode];

  return {
    supportedInstallationFeet,
    recommendedPurchasingFeet,
    jobSize,
    complexityScore: score,
    complexityBand,
    pricingTierCode: tierCode,
    installationPriceMin: tierInfo.min,
    installationPriceMax: tierInfo.max
  };
}

console.log('Running test suite for Decoupled Calculation Engine...');

const test1 = calculatePipeline({ customerProvidedFeet: 80, stories: 1, roofComplexity: 'simple', peaks: 0 });
expect(test1.jobSize).toBe('Small');
expect(test1.complexityBand).toBe('Low');
expect(test1.pricingTierCode).toBe('SMALL_LOW');
console.log('? Test 1 Passed: Small simple job gets SMALL_LOW tier');

const test2 = calculatePipeline({ customerProvidedFeet: 220, stories: 2, roofComplexity: 'complex', peaks: 4 });
expect(test2.jobSize).toBe('Large');
expect(test2.complexityBand).toBe('High');
expect(test2.pricingTierCode).toBe('LARGE_HIGH');
console.log('? Test 2 Passed: Large complex job gets LARGE_HIGH tier');

const simple150 = calculatePipeline({ customerProvidedFeet: 150, stories: 1, roofComplexity: 'simple' });
const complex150 = calculatePipeline({ customerProvidedFeet: 150, stories: 2, roofComplexity: 'complex', peaks: 4 });
expect(simple150.supportedInstallationFeet).toBe(complex150.supportedInstallationFeet);
expect(simple150.pricingTierCode).toBe('MEDIUM_LOW');
expect(complex150.pricingTierCode).toBe('MEDIUM_HIGH');
expect(complex150.installationPriceMin).toBeGreaterThan(simple150.installationPriceMin);
console.log('? Test 3 Passed: Equal footage receives different pricing tiers based on complexity');

const shortDifficult = calculatePipeline({ customerProvidedFeet: 90, stories: 3, roofComplexity: 'complex' });
const longSimple = calculatePipeline({ customerProvidedFeet: 120, stories: 1, roofComplexity: 'simple' });
expect(shortDifficult.complexityScore).toBeGreaterThan(longSimple.complexityScore);
expect(shortDifficult.installationPriceMin).toBeGreaterThanOrEqual(longSimple.installationPriceMin);
console.log('? Test 4 Passed: Shorter difficult job costs equal or more than longer simple job');

const purchasingTest = calculatePipeline({ customerProvidedFeet: 100 });
expect(purchasingTest.recommendedPurchasingFeet).toBe(115);
console.log('? Test 5 Passed: Purchasing allowance (+15%) calculated separately from labor');

console.log('\nALL 5 CALCULATION ENGINE TESTS PASSED SUCCESSFULLY!');
