export const PRICING_CONFIG = {
  version: '1.0.0',
  basePricePerFoot: 25.00,
  minimumCharge: 500.00,
  storyMultipliers: {
    1: 1.0,
    2: 1.15,
    3: 1.30,
    '4+': 1.50
  },
  roofComplexityMultipliers: {
    simple: 1.0,
    average: 1.1,
    complex: 1.25,
    custom: 1.4
  },
  additionalAccessories: {
    controller: 150.00,
    powerSupply: 75.00,
  },
  rangeUncertainty: {
    preliminary: 0.15, // +/- 15%
    strong: 0.05,      // +/- 5%
    confirmed: 0.0     // +/- 0%
  }
};
