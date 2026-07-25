import { PRICING_CONFIG } from '@/config/pricing';
import { PropertyDetails, EstimateStatus } from '@/types/quote';

interface CalculationResult {
  estimatedLinearFeet: number | null;
  priceRange: { min: number; max: number } | null;
  status: EstimateStatus;
}

export function calculatePreliminaryEstimate(
  linearFeet: number,
  propertyDetails?: PropertyDetails,
  uncertaintyMultiplier: number = PRICING_CONFIG.rangeUncertainty.preliminary
): CalculationResult {
  if (linearFeet <= 0 || isNaN(linearFeet)) {
    return {
      estimatedLinearFeet: null,
      priceRange: null,
      status: 'incomplete'
    };
  }

  // Start with base price
  let basePrice = linearFeet * PRICING_CONFIG.basePricePerFoot;

  // Apply story multiplier if known
  if (propertyDetails?.stories && propertyDetails.stories in PRICING_CONFIG.storyMultipliers) {
    basePrice *= PRICING_CONFIG.storyMultipliers[propertyDetails.stories as keyof typeof PRICING_CONFIG.storyMultipliers];
  }

  // Apply roof complexity multiplier if known
  if (propertyDetails?.roofComplexity && propertyDetails.roofComplexity in PRICING_CONFIG.roofComplexityMultipliers) {
    basePrice *= PRICING_CONFIG.roofComplexityMultipliers[propertyDetails.roofComplexity as keyof typeof PRICING_CONFIG.roofComplexityMultipliers];
  }

  // Ensure minimum charge
  const rawPrice = Math.max(basePrice, PRICING_CONFIG.minimumCharge);

  // Apply uncertainty range
  const rangeAmount = rawPrice * uncertaintyMultiplier;
  
  // Create a realistic range
  const min = Math.floor(rawPrice - rangeAmount);
  const max = Math.ceil(rawPrice + rangeAmount);

  return {
    estimatedLinearFeet: linearFeet,
    priceRange: { min, max },
    status: 'preliminary'
  };
}
