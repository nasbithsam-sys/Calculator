"use server";

import { createClient } from "@/utils/supabase/server";
import type { PriceAdjustment, ProductRecommendation } from "@/types/quote";

export type SectionType =
  | "horizontal_eave"
  | "horizontal_perimeter"
  | "sloped_peak"
  | "hidden_section"
  | "uncertain"
  | "manual";

export type MeasurementStatus = "supported" | "provisional" | "unsupported" | "expert_confirmed";

export interface EstimateSectionInput {
  id?: string;
  name: string;
  lengthFeet: number;
  order?: number;
  type?: SectionType;
  measurementStatus?: MeasurementStatus;
}

export interface CalculateEstimateInput {
  coverage?: string;
  frontageFeet?: number;
  stories?: number | string;
  roofComplexity?: string;
  peaks?: number;
  gableCount?: number;
  archCount?: number;
  hasDormers?: boolean;
  hasPorch?: boolean;
  hasBalcony?: boolean;
  hasMultipleRoofLevels?: boolean;
  hasDetachedGarage?: boolean;
  hasMultipleStructures?: boolean;
  hasHiddenSections?: boolean;
  hasDifficultCorners?: boolean;
  accessDifficulty?: "standard" | "moderate" | "steep_slope" | "high_scaffold" | "extreme";
  measuredSections?: EstimateSectionInput[];
  customerProvidedFeet?: number;
  method?: string;
}

export interface CalculationResult {
  success: boolean;
  footageMethod: string;
  footageStatus: "preliminary" | "supported" | "partially_supported" | "customer_provided" | "expert_confirmed" | "unable_to_calculate";
  estimatedLinearFeet: number;
  supportedInstallationFeet: number;
  estimatedInstallationFeetMin: number;
  estimatedInstallationFeetMax: number;
  projectedUnsupportedFeet: number;
  purchasingAllowancePercent: number;
  recommendedPurchasingFeet: number;
  recommendedPurchasingFeetMin: number;
  recommendedPurchasingFeetMax: number;
  totalSuppliedKitFeet: number;
  excessKitFeet: number;
  
  // Installation Pricing Tier Engine
  jobSize: "Small" | "Medium" | "Large" | "Extra Large";
  complexityScore: number;
  complexityBand: "Low" | "Moderate" | "High" | "Extreme";
  pricingTierCode: string;
  pricingTierName: string;
  installationPriceMin: number;
  installationPriceMax: number;
  installationPricingModelVersion: string;
  requiresExpertReview: boolean;
  reviewReasons: string[];

  priceRange: { min: number; max: number };
  recommendedKits: ProductRecommendation[];
  adjustments: PriceAdjustment[];
  assumptions: string[];
  warnings: string[];
  pricingVersion: string;
  estimationModelVersion: string;
  catalogVersion: string;
  error?: string;
}

interface PricingConfigRow {
  version: string;
  purchasing_allowance_percent?: number | null;
  estimate_uncertainty_percent?: number | null;
  job_size_thresholds?: { small?: number; medium?: number; large?: number } | null;
  complexity_scoring_rules?: Record<string, number> | null;
  complexity_bands?: { low?: number; moderate?: number; high?: number } | null;
  pricing_tier_matrix?: Record<string, { name: string; min: number; max: number }> | null;
}

interface EstimationModelRow {
  version: string;
  config: {
    front_only_multiplier?: number;
    front_sides_multiplier?: number;
    full_perimeter_multiplier?: number;
    peak_addition_feet?: number;
    upper_level_footage_allowance?: number;
    simple_roof_factor?: number;
    moderate_roof_factor?: number;
    complex_roof_factor?: number;
    minimum_reasonable_footage?: number;
    maximum_reasonable_footage?: number;
    uncertainty_percentage?: number;
  } | null;
}

interface ProductRow {
  id: string;
  name: string;
  product_family?: string | null;
  generation?: string | null;
  model_number?: string | null;
  length_feet: number;
  price: number;
  max_connected_length?: number | null;
  catalog_version?: string | null;
  is_active?: boolean | null;
  verification_status?: string | null;
}

const DEFAULT_TIER_MATRIX: Record<string, { name: string; min: number; max: number }> = {
  SMALL_LOW: { name: "Small / Low Complexity", min: 650, max: 950 },
  SMALL_MODERATE: { name: "Small / Moderate Complexity", min: 850, max: 1250 },
  SMALL_HIGH: { name: "Small / High Complexity", min: 1100, max: 1600 },
  SMALL_EXTREME: { name: "Small / Extreme Complexity", min: 1400, max: 2000 },
  MEDIUM_LOW: { name: "Medium / Low Complexity", min: 1100, max: 1550 },
  MEDIUM_MODERATE: { name: "Medium / Moderate Complexity", min: 1400, max: 1950 },
  MEDIUM_HIGH: { name: "Medium / High Complexity", min: 1800, max: 2500 },
  MEDIUM_EXTREME: { name: "Medium / Extreme Complexity", min: 2300, max: 3200 },
  LARGE_LOW: { name: "Large / Low Complexity", min: 1700, max: 2300 },
  LARGE_MODERATE: { name: "Large / Moderate Complexity", min: 2100, max: 2900 },
  LARGE_HIGH: { name: "Large / High Complexity Residential", min: 2700, max: 3800 },
  LARGE_EXTREME: { name: "Large / Extreme Complexity", min: 3500, max: 4800 },
  XL_LOW: { name: "Extra Large / Low Complexity", min: 2500, max: 3500 },
  XL_MODERATE: { name: "Extra Large / Moderate Complexity", min: 3200, max: 4400 },
  XL_HIGH: { name: "Extra Large / High Complexity", min: 4000, max: 5600 },
  XL_EXTREME: { name: "Extra Large / Extreme Complexity", min: 5000, max: 7500 },
};

const EMPTY_RESULT: Omit<CalculationResult, "success" | "error"> = {
  footageMethod: "quick",
  footageStatus: "preliminary",
  estimatedLinearFeet: 0,
  supportedInstallationFeet: 0,
  estimatedInstallationFeetMin: 0,
  estimatedInstallationFeetMax: 0,
  projectedUnsupportedFeet: 0,
  purchasingAllowancePercent: 15,
  recommendedPurchasingFeet: 0,
  recommendedPurchasingFeetMin: 0,
  recommendedPurchasingFeetMax: 0,
  totalSuppliedKitFeet: 0,
  excessKitFeet: 0,
  jobSize: "Small",
  complexityScore: 0,
  complexityBand: "Low",
  pricingTierCode: "SMALL_LOW",
  pricingTierName: "Small / Low Complexity",
  installationPriceMin: 0,
  installationPriceMax: 0,
  installationPricingModelVersion: "v1.0",
  requiresExpertReview: false,
  reviewReasons: [],
  priceRange: { min: 0, max: 0 },
  recommendedKits: [],
  adjustments: [],
  assumptions: [],
  warnings: [],
  pricingVersion: "",
  estimationModelVersion: "",
  catalogVersion: "",
};

function failure(error: string, partial: Partial<CalculationResult> = {}): CalculationResult {
  return {
    ...EMPTY_RESULT,
    ...partial,
    success: false,
    error,
  };
}

function normalizeNumber(value: number | null | undefined, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function isSupportedSection(section: EstimateSectionInput) {
  if (section.measurementStatus === "expert_confirmed" || section.measurementStatus === "supported") return true;
  if (!section.type || section.type === "manual") return true;
  return section.type === "horizontal_eave" || section.type === "horizontal_perimeter";
}

function optimizeProducts(products: ProductRow[], requiredFeet: number, maxSectionFeet: number) {
  const compatibleProducts = products.filter((product) => {
    const maxConnected = normalizeNumber(product.max_connected_length, Number.POSITIVE_INFINITY);
    return product.length_feet > 0 && product.price >= 0 && maxConnected >= maxSectionFeet;
  });

  const productGroups = new Map<string, ProductRow[]>();
  for (const product of compatibleProducts) {
    const key = `${product.product_family || "Standard"}::${product.generation || "v1"}`;
    productGroups.set(key, [...(productGroups.get(key) || []), product]);
  }

  let best: {
    kits: ProductRecommendation[];
    suppliedFeet: number;
    cost: number;
    catalogVersion: string;
  } | null = null;

  for (const groupProducts of productGroups.values()) {
    const largestKit = Math.max(...groupProducts.map((p) => p.length_feet));
    const maxPossible = Math.ceil(requiredFeet + largestKit);
    const dp = Array<number>(maxPossible + 1).fill(Number.POSITIVE_INFINITY);
    const choice = Array<ProductRow | null>(maxPossible + 1).fill(null);

    dp[0] = 0;

    for (let feet = 0; feet <= maxPossible; feet += 1) {
      if (dp[feet] === Number.POSITIVE_INFINITY) continue;
      for (const product of groupProducts) {
        const nextFeet = feet + product.length_feet;
        if (nextFeet <= maxPossible && dp[feet] + product.price < dp[nextFeet]) {
          dp[nextFeet] = dp[feet] + product.price;
          choice[nextFeet] = product;
        }
      }
    }

    for (let suppliedFeet = Math.ceil(requiredFeet); suppliedFeet <= maxPossible; suppliedFeet += 1) {
      if (dp[suppliedFeet] === Number.POSITIVE_INFINITY) continue;

      const counts = new Map<string, ProductRecommendation>();
      let cursor = suppliedFeet;
      while (cursor > 0 && choice[cursor]) {
        const product = choice[cursor];
        if (!product) break;
        const existing = counts.get(product.id);
        if (existing) {
          existing.quantity += 1;
        } else {
          counts.set(product.id, {
            id: product.id,
            name: product.name,
            modelNumber: product.model_number || undefined,
            productFamily: product.product_family || undefined,
            generation: product.generation || undefined,
            lengthFeet: product.length_feet,
            quantity: 1,
            price: product.price,
            catalogVersion: product.catalog_version || undefined,
            compatibilityNote: "Compatible kit family and generation",
          });
        }
        cursor -= product.length_feet;
      }

      const candidate = {
        kits: Array.from(counts.values()),
        suppliedFeet,
        cost: dp[suppliedFeet],
        catalogVersion: groupProducts[0]?.catalog_version || "v1.0",
      };

      if (
        !best ||
        candidate.suppliedFeet < best.suppliedFeet ||
        (candidate.suppliedFeet === best.suppliedFeet && candidate.kits.length < best.kits.length) ||
        (candidate.suppliedFeet === best.suppliedFeet && candidate.kits.length === best.kits.length && candidate.cost < best.cost)
      ) {
        best = candidate;
      }
      break;
    }
  }

  return best;
}

export async function calculateEstimate(input: CalculateEstimateInput): Promise<CalculationResult> {
  const supabase = await createClient();

  const { data: pricingConfig, error: pricingError } = await supabase
    .from("pricing_configurations")
    .select("*")
    .eq("active", true)
    .single<PricingConfigRow>();

  if (pricingError || !pricingConfig) {
    return failure("No active pricing configuration found. Please contact an administrator.");
  }

  const { data: estimationModel, error: modelError } = await supabase
    .from("estimation_models")
    .select("*")
    .eq("is_active", true)
    .single<EstimationModelRow>();

  if (modelError || !estimationModel?.config) {
    return failure("No active estimation model found. Please contact an administrator.", {
      pricingVersion: pricingConfig.version,
    });
  }

  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .eq("verification_status", "verified")
    .returns<ProductRow[]>();

  if (productsError || !products || products.length === 0) {
    return failure("No verified products available in the catalog.", {
      pricingVersion: pricingConfig.version,
      estimationModelVersion: estimationModel.version,
    });
  }

  const assumptions: string[] = [];
  const warnings: string[] = [];
  const reviewReasons: string[] = [];
  const model = estimationModel.config;

  // ENGINE 1: LIGHT & MATERIAL REQUIREMENT ENGINE
  let supportedFeet = 0;
  let projectedUnsupportedFeet = 0;
  let maxSectionFeet = 0;
  let footageMethod = input.method || "quick";
  let footageStatus: CalculationResult["footageStatus"] = "preliminary";

  if (input.measuredSections && input.measuredSections.length > 0) {
    footageMethod = "map_drawing";
    let hasSupported = false;
    let hasUnsupported = false;

    for (const section of input.measuredSections) {
      if (!Number.isFinite(section.lengthFeet) || section.lengthFeet <= 0) continue;
      if (isSupportedSection(section)) {
        supportedFeet += section.lengthFeet;
        maxSectionFeet = Math.max(maxSectionFeet, section.lengthFeet);
        hasSupported = true;
      } else {
        projectedUnsupportedFeet += section.lengthFeet;
        hasUnsupported = true;
      }
    }

    if (hasSupported && hasUnsupported) {
      footageStatus = "partially_supported";
      warnings.push(`${Math.round(projectedUnsupportedFeet)} ft of unresolved sloped peaks/hidden sections were excluded from the supported total.`);
    } else if (hasSupported) {
      footageStatus = "supported";
    } else {
      footageStatus = "unable_to_calculate";
    }
  } else if (input.customerProvidedFeet && input.customerProvidedFeet > 0) {
    footageMethod = "customer_measurements";
    footageStatus = "customer_provided";
    supportedFeet = input.customerProvidedFeet;
    maxSectionFeet = input.customerProvidedFeet;
    assumptions.push("Customer-entered linear footage used as supported installation footage.");
  } else {
    footageMethod = "quick_estimate";
    footageStatus = "preliminary";
    const frontage = input.frontageFeet || normalizeNumber(model.minimum_reasonable_footage, 40);
    const coverageMultiplier =
      input.coverage === "front-sides"
        ? normalizeNumber(model.front_sides_multiplier, 2.0)
        : input.coverage === "full-perimeter"
          ? normalizeNumber(model.full_perimeter_multiplier, 3.5)
          : normalizeNumber(model.front_only_multiplier, 1.0);
    const roofFactor =
      input.roofComplexity === "complex"
        ? normalizeNumber(model.complex_roof_factor, 1.3)
        : input.roofComplexity === "moderate" || input.roofComplexity === "average"
          ? normalizeNumber(model.moderate_roof_factor, 1.1)
          : normalizeNumber(model.simple_roof_factor, 1.0);

    const storiesNum = typeof input.stories === "string" ? (input.stories === "4+" ? 4 : Number(input.stories) || 1) : input.stories || 1;
    const peaksNum = input.peaks || input.gableCount || 0;

    supportedFeet = (frontage * coverageMultiplier + peaksNum * normalizeNumber(model.peak_addition_feet, 15)) * roofFactor;
    if (storiesNum >= 2) supportedFeet += normalizeNumber(model.upper_level_footage_allowance, 0);
    maxSectionFeet = supportedFeet;
    assumptions.push("Quick estimate calculates a preliminary footage range using active versioned formula parameters.");
  }

  const supportedInstallationFeet = Math.round(supportedFeet);
  const uncertaintyPercent = normalizeNumber(
    model.uncertainty_percentage,
    normalizeNumber(pricingConfig.estimate_uncertainty_percent, 10)
  ) / 100;

  const estimatedInstallationFeetMin = Math.max(1, Math.floor(supportedInstallationFeet * (1 - uncertaintyPercent)));
  const estimatedInstallationFeetMax = Math.ceil(supportedInstallationFeet * (1 + uncertaintyPercent));

  const purchasingAllowancePercent = normalizeNumber(pricingConfig.purchasing_allowance_percent, 15);
  const allowanceMultiplier = 1 + purchasingAllowancePercent / 100;

  const recommendedPurchasingFeet = Math.ceil(supportedInstallationFeet * allowanceMultiplier);
  const recommendedPurchasingFeetMin = Math.ceil(estimatedInstallationFeetMin * allowanceMultiplier);
  const recommendedPurchasingFeetMax = Math.ceil(estimatedInstallationFeetMax * allowanceMultiplier);

  const optimized = optimizeProducts(products, recommendedPurchasingFeet, maxSectionFeet || supportedInstallationFeet);

  if (!optimized) {
    return failure("Product selection requires expert review. No compatible verified Govee combination can cover the required length.", {
      footageMethod,
      footageStatus: "unable_to_calculate",
      supportedInstallationFeet,
      estimatedInstallationFeetMin,
      estimatedInstallationFeetMax,
      recommendedPurchasingFeet,
      recommendedPurchasingFeetMin,
      recommendedPurchasingFeetMax,
      projectedUnsupportedFeet: Math.round(projectedUnsupportedFeet),
      requiresExpertReview: true,
      reviewReasons: ["No compatible verified Govee product combination available for maximum continuous section."],
      pricingVersion: pricingConfig.version,
      estimationModelVersion: estimationModel.version,
    });
  }

  // ENGINE 2: INSTALLATION PRICING TIER & COMPLEXITY ENGINE
  const thresholds = pricingConfig.job_size_thresholds || { small: 100, medium: 180, large: 280 };
  let jobSize: CalculationResult["jobSize"] = "Small";

  if (supportedInstallationFeet <= (thresholds.small || 100)) {
    jobSize = "Small";
  } else if (supportedInstallationFeet <= (thresholds.medium || 180)) {
    jobSize = "Medium";
  } else if (supportedInstallationFeet <= (thresholds.large || 280)) {
    jobSize = "Large";
  } else {
    jobSize = "Extra Large";
  }

  reviewReasons.push(`Classified as ${jobSize} job size based on supported installation footage (${supportedInstallationFeet} ft).`);

  // Complexity Scoring
  const rules = pricingConfig.complexity_scoring_rules || {
    two_story_points: 15,
    three_story_points: 35,
    moderate_roof_points: 15,
    complex_roof_points: 30,
    gable_points: 5,
    arch_points: 10,
    dormer_points: 15,
    porch_points: 10,
    balcony_points: 10,
    multiple_levels_points: 15,
    detached_garage_points: 10,
    hidden_sections_points: 15,
    difficult_corners_points: 15,
    difficult_access_points: 20,
  };

  let complexityScore = 0;
  const storiesNum = typeof input.stories === "string" ? (input.stories === "4+" ? 4 : Number(input.stories) || 1) : input.stories || 1;

  if (storiesNum === 2) {
    complexityScore += rules.two_story_points || 15;
    reviewReasons.push(`+${rules.two_story_points || 15} pts: 2-Story structure`);
  } else if (storiesNum >= 3) {
    complexityScore += rules.three_story_points || 35;
    reviewReasons.push(`+${rules.three_story_points || 35} pts: 3+ Story structure`);
  }

  if (input.roofComplexity === "moderate" || input.roofComplexity === "average") {
    complexityScore += rules.moderate_roof_points || 15;
    reviewReasons.push(`+${rules.moderate_roof_points || 15} pts: Moderate roofline complexity`);
  } else if (input.roofComplexity === "complex") {
    complexityScore += rules.complex_roof_points || 30;
    reviewReasons.push(`+${rules.complex_roof_points || 30} pts: Complex roofline structure`);
  }

  const gables = input.gableCount || input.peaks || 0;
  if (gables > 0) {
    const pts = gables * (rules.gable_points || 5);
    complexityScore += pts;
    reviewReasons.push(`+${pts} pts: ${gables} prominent gables/peaks`);
  }

  const arches = input.archCount || 0;
  if (arches > 0) {
    const pts = arches * (rules.arch_points || 10);
    complexityScore += pts;
    reviewReasons.push(`+${pts} pts: ${arches} architectural arches`);
  }

  if (input.hasDormers) {
    complexityScore += rules.dormer_points || 15;
    reviewReasons.push(`+${rules.dormer_points || 15} pts: Dormer windows present`);
  }
  if (input.hasPorch) {
    complexityScore += rules.porch_points || 10;
    reviewReasons.push(`+${rules.porch_points || 10} pts: Covered porch/entryway roofline`);
  }
  if (input.hasBalcony) {
    complexityScore += rules.balcony_points || 10;
    reviewReasons.push(`+${rules.balcony_points || 10} pts: Upper balcony transitions`);
  }
  if (input.hasMultipleRoofLevels) {
    complexityScore += rules.multiple_levels_points || 15;
    reviewReasons.push(`+${rules.multiple_levels_points || 15} pts: Multiple roof elevation levels`);
  }
  if (input.hasDetachedGarage) {
    complexityScore += rules.detached_garage_points || 10;
    reviewReasons.push(`+${rules.detached_garage_points || 10} pts: Detached garage run`);
  }
  if (input.hasHiddenSections) {
    complexityScore += rules.hidden_sections_points || 15;
    reviewReasons.push(`+${rules.hidden_sections_points || 15} pts: Hidden/obscured facade sections`);
  }
  if (input.hasDifficultCorners) {
    complexityScore += rules.difficult_corners_points || 15;
    reviewReasons.push(`+${rules.difficult_corners_points || 15} pts: Tight or acute corner transitions`);
  }

  if (input.accessDifficulty === "steep_slope" || input.accessDifficulty === "high_scaffold" || input.accessDifficulty === "extreme") {
    const pts = rules.difficult_access_points || 20;
    complexityScore += pts;
    reviewReasons.push(`+${pts} pts: High/steep access difficulty (${input.accessDifficulty.replace("_", " ")})`);
  }

  // Assign Complexity Band
  const bands = pricingConfig.complexity_bands || { low: 20, moderate: 45, high: 75 };
  let complexityBand: CalculationResult["complexityBand"] = "Low";

  if (complexityScore < (bands.low || 20)) {
    complexityBand = "Low";
  } else if (complexityScore < (bands.moderate || 45)) {
    complexityBand = "Moderate";
  } else if (complexityScore < (bands.high || 75)) {
    complexityBand = "High";
  } else {
    complexityBand = "Extreme";
  }

  reviewReasons.push(`Assigned ${complexityBand} Complexity Band (Total score: ${complexityScore} pts).`);

  // Map to Pricing Tier Matrix Code
  const jobCodeMap: Record<string, string> = {
    Small: "SMALL",
    Medium: "MEDIUM",
    Large: "LARGE",
    "Extra Large": "XL",
  };

  const tierCode = `${jobCodeMap[jobSize]}_${complexityBand.toUpperCase()}`;
  const tierMatrix = pricingConfig.pricing_tier_matrix || DEFAULT_TIER_MATRIX;
  const tierInfo = tierMatrix[tierCode] || DEFAULT_TIER_MATRIX[tierCode] || {
    name: `${jobSize} / ${complexityBand} Complexity`,
    min: 1000,
    max: 1800,
  };

  const installationPriceMin = tierInfo.min;
  const installationPriceMax = tierInfo.max;

  reviewReasons.push(`Matched Pricing Tier: ${tierInfo.name} ($${installationPriceMin} - $${installationPriceMax}).`);

  // Kit Material Cost
  const kitsPrice = optimized.kits.reduce((sum, kit) => sum + kit.price * kit.quantity, 0);

  // Total Customer Price Range (Installation Labor Tier + Kit Material Cost)
  const totalPriceMin = Math.round(installationPriceMin + kitsPrice);
  const totalPriceMax = Math.round(installationPriceMax + kitsPrice);

  const adjustments: PriceAdjustment[] = [
    { name: `Installation Tier: ${tierInfo.name}`, amount: installationPriceMin },
    { name: `Required Govee Kit Materials (${optimized.kits.length} kit[s])`, amount: kitsPrice },
  ];

  const requiresExpertReview = complexityBand === "Extreme" || projectedUnsupportedFeet > 0 || storiesNum >= 3;

  return {
    success: true,
    footageMethod,
    footageStatus,
    estimatedLinearFeet: supportedInstallationFeet,
    supportedInstallationFeet,
    estimatedInstallationFeetMin,
    estimatedInstallationFeetMax,
    projectedUnsupportedFeet: Math.round(projectedUnsupportedFeet),
    purchasingAllowancePercent,
    recommendedPurchasingFeet,
    recommendedPurchasingFeetMin,
    recommendedPurchasingFeetMax,
    totalSuppliedKitFeet: optimized.suppliedFeet,
    excessKitFeet: Math.max(0, optimized.suppliedFeet - recommendedPurchasingFeet),
    
    // Installation Pricing Tier Engine
    jobSize,
    complexityScore,
    complexityBand,
    pricingTierCode: tierCode,
    pricingTierName: tierInfo.name,
    installationPriceMin,
    installationPriceMax,
    installationPricingModelVersion: "v1.0",
    requiresExpertReview,
    reviewReasons,

    priceRange: {
      min: totalPriceMin,
      max: totalPriceMax,
    },
    recommendedKits: optimized.kits,
    adjustments,
    assumptions,
    warnings,
    pricingVersion: pricingConfig.version,
    estimationModelVersion: estimationModel.version,
    catalogVersion: optimized.catalogVersion,
  };
}

