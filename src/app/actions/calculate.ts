"use server";

import { createClient } from "@/utils/supabase/server";

export interface CalculateEstimateInput {
  coverage: string;
  frontageFeet?: number;
  stories: number;
  roofComplexity: string;
  peaks: number;
  measuredSections?: { name: string; lengthFeet: number }[];
  customerProvidedFeet?: number;
}

export interface CalculationResult {
  success: boolean;
  estimatedLinearFeet: number;
  recommendedPurchasingFeet: number;
  priceRange: { min: number; max: number };
  recommendedKits: any[];
  adjustments: any[];
  pricingVersion: string;
  catalogVersion: string;
  error?: string;
}

export async function calculateEstimate(input: CalculateEstimateInput): Promise<CalculationResult> {
  const supabase = await createClient();

  // 1. Load active pricing configuration
  const { data: pricingConfig, error: pricingError } = await supabase
    .from("pricing_configurations")
    .select("*")
    .eq("active", true)
    .single();

  if (pricingError || !pricingConfig) {
    return {
      success: false,
      error: "No active pricing configuration found. Please contact an administrator.",
      estimatedLinearFeet: 0,
      recommendedPurchasingFeet: 0,
      priceRange: { min: 0, max: 0 },
      recommendedKits: [],
      adjustments: [],
      pricingVersion: "",
      catalogVersion: ""
    };
  }

  // 2. Load active verified products
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .eq("verification_status", "verified");

  if (productsError || !products || products.length === 0) {
    return {
      success: false,
      error: "No verified products available in the catalog.",
      estimatedLinearFeet: 0,
      recommendedPurchasingFeet: 0,
      priceRange: { min: 0, max: 0 },
      recommendedKits: [],
      adjustments: [],
      pricingVersion: pricingConfig.version,
      catalogVersion: ""
    };
  }

  // 3. Calculate usable lighting footage
  let baseFeet = 0;
  
  if (input.measuredSections && input.measuredSections.length > 0) {
    baseFeet = input.measuredSections.reduce((sum, s) => sum + s.lengthFeet, 0);
  } else if (input.customerProvidedFeet && input.customerProvidedFeet > 0) {
    baseFeet = input.customerProvidedFeet;
  } else {
    // Quick Estimate Model
    const frontage = input.frontageFeet || 40; // Default assumption if not provided
    
    let coverageMultiplier = 1.0;
    if (input.coverage === "front-sides") coverageMultiplier = 2.0;
    else if (input.coverage === "full-perimeter") coverageMultiplier = 3.5;
    
    baseFeet = frontage * coverageMultiplier;
    
    // Adjust base length based on complexity/peaks (simplified geometric expansion)
    baseFeet += (input.peaks * 15); 
    
    if (input.roofComplexity === "moderate") baseFeet *= 1.1;
    else if (input.roofComplexity === "complex") baseFeet *= 1.3;
  }

  // Ensure minimum footage if required
  if (baseFeet < 10) baseFeet = 10;
  
  const estimatedLinearFeet = Math.round(baseFeet);

  // 4. Apply purchasing allowance
  const allowancePercent = pricingConfig.purchasing_allowance_percent / 100;
  const recommendedPurchasingFeet = Math.ceil(estimatedLinearFeet * (1 + allowancePercent));

  // 5. Recommend valid Govee product combinations
  // Find the largest kit that covers the recommended purchasing feet
  const sortedProducts = [...products].sort((a, b) => b.length_feet - a.length_feet);
  let recommendedKits = [];
  let catalogVersion = "";
  
  if (sortedProducts.length > 0) {
    catalogVersion = sortedProducts[0].catalog_version;
    // Simple greedy bin-packing
    let remaining = recommendedPurchasingFeet;
    
    while (remaining > 0) {
      const kit = sortedProducts.find(p => p.length_feet <= remaining) || sortedProducts[sortedProducts.length - 1];
      
      const existing = recommendedKits.find(k => k.id === kit.id);
      if (existing) {
        existing.quantity += 1;
      } else {
        recommendedKits.push({
          id: kit.id,
          name: kit.name,
          length_feet: kit.length_feet,
          quantity: 1,
          price: kit.price
        });
      }
      remaining -= kit.length_feet;
      if (kit.length_feet >= remaining && remaining > 0) { // Catch-all for last kit to cover remainder
        const existingLast = recommendedKits.find(k => k.id === kit.id);
        if (existingLast) existingLast.quantity += 1;
        else recommendedKits.push({ id: kit.id, name: kit.name, length_feet: kit.length_feet, quantity: 1, price: kit.price });
        break;
      }
    }
  }

  // 6. Calculate individual pricing adjustments
  let adjustments = [];
  
  let basePrice = estimatedLinearFeet * pricingConfig.base_labor_price_per_foot;
  adjustments.push({ name: "Base Labor", amount: basePrice });

  let multiplier = 1.0;
  if (input.stories === 2) {
    multiplier *= pricingConfig.two_story_multiplier;
    adjustments.push({ name: "2-Story Adjustment", multiplier: pricingConfig.two_story_multiplier });
  } else if (input.stories >= 3) {
    multiplier *= pricingConfig.three_story_multiplier;
    adjustments.push({ name: "3-Story Adjustment", multiplier: pricingConfig.three_story_multiplier });
  }

  if (input.roofComplexity === "moderate") {
    multiplier *= pricingConfig.moderate_roof_multiplier;
    adjustments.push({ name: "Moderate Roof", multiplier: pricingConfig.moderate_roof_multiplier });
  } else if (input.roofComplexity === "complex") {
    multiplier *= pricingConfig.complex_roof_multiplier;
    adjustments.push({ name: "Complex Roof", multiplier: pricingConfig.complex_roof_multiplier });
  }

  let finalLabor = basePrice * multiplier;

  const peakCharge = input.peaks * pricingConfig.peak_charge;
  if (peakCharge > 0) {
    finalLabor += peakCharge;
    adjustments.push({ name: "Peak Charges", amount: peakCharge });
  }

  if (finalLabor < pricingConfig.minimum_installation_charge) {
    adjustments.push({ 
      name: "Minimum Installation Charge Adjustment", 
      amount: pricingConfig.minimum_installation_charge - finalLabor 
    });
    finalLabor = pricingConfig.minimum_installation_charge;
  }

  const kitsPrice = recommendedKits.reduce((sum, kit) => sum + (kit.price * kit.quantity), 0);
  
  const totalPrice = finalLabor + kitsPrice;
  
  const uncertainty = pricingConfig.estimate_uncertainty_percent / 100;
  
  return {
    success: true,
    estimatedLinearFeet,
    recommendedPurchasingFeet,
    priceRange: {
      min: Math.round(totalPrice * (1 - uncertainty)),
      max: Math.round(totalPrice * (1 + uncertainty))
    },
    recommendedKits,
    adjustments,
    pricingVersion: pricingConfig.version,
    catalogVersion
  };
}
