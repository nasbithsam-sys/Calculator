"use server";

import { createClient } from "@/utils/supabase/server";
import type { PriceAdjustment, ProductRecommendation } from "@/types/quote";

type SectionType =
  | "horizontal_eave"
  | "horizontal_perimeter"
  | "sloped_peak"
  | "hidden_section"
  | "uncertain"
  | "manual";

type MeasurementStatus = "supported" | "provisional" | "unsupported" | "expert_confirmed";

export interface EstimateSectionInput {
  id?: string;
  name: string;
  lengthFeet: number;
  order?: number;
  type?: SectionType;
  measurementStatus?: MeasurementStatus;
}

export interface CalculateEstimateInput {
  coverage: string;
  frontageFeet?: number;
  stories: number;
  roofComplexity: string;
  peaks: number;
  measuredSections?: EstimateSectionInput[];
  customerProvidedFeet?: number;
}

export interface CalculationResult {
  success: boolean;
  estimatedLinearFeet: number;
  supportedInstallationFeet: number;
  estimatedInstallationFeetMin: number;
  estimatedInstallationFeetMax: number;
  recommendedPurchasingFeet: number;
  recommendedPurchasingFeetMin: number;
  recommendedPurchasingFeetMax: number;
  projectedUnsupportedFeet: number;
  totalSuppliedKitFeet: number;
  excessKitFeet: number;
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
  base_labor_price_per_foot: number;
  minimum_installation_charge: number;
  two_story_multiplier?: number | null;
  three_story_multiplier?: number | null;
  complex_roof_multiplier?: number | null;
  moderate_roof_multiplier?: number | null;
  peak_charge?: number | null;
  purchasing_allowance_percent?: number | null;
  estimate_uncertainty_percent?: number | null;
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
    missing_input_behavior?: "error" | "use_minimum";
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
  extension_compatibility?: string | null;
  included_extensions?: number | null;
  is_active?: boolean | null;
  verification_status?: string | null;
}

const EMPTY_RESULT: Omit<CalculationResult, "success" | "error"> = {
  estimatedLinearFeet: 0,
  supportedInstallationFeet: 0,
  estimatedInstallationFeetMin: 0,
  estimatedInstallationFeetMax: 0,
  recommendedPurchasingFeet: 0,
  recommendedPurchasingFeetMin: 0,
  recommendedPurchasingFeetMax: 0,
  projectedUnsupportedFeet: 0,
  totalSuppliedKitFeet: 0,
  excessKitFeet: 0,
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
    const key = `${product.product_family || "unknown"}::${product.generation || "unknown"}`;
    productGroups.set(key, [...(productGroups.get(key) || []), product]);
  }

  let best: {
    kits: ProductRecommendation[];
    suppliedFeet: number;
    cost: number;
    catalogVersion: string;
  } | null = null;

  for (const groupProducts of productGroups.values()) {
    const largestKit = Math.max(...groupProducts.map((product) => product.length_feet));
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
        catalogVersion: groupProducts[0]?.catalog_version || "",
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
  const model = estimationModel.config;
  let supportedFeet = 0;
  let projectedUnsupportedFeet = 0;
  let maxSectionFeet = 0;

  if (input.measuredSections && input.measuredSections.length > 0) {
    for (const section of input.measuredSections) {
      if (!Number.isFinite(section.lengthFeet) || section.lengthFeet <= 0) continue;
      if (isSupportedSection(section)) {
        supportedFeet += section.lengthFeet;
        maxSectionFeet = Math.max(maxSectionFeet, section.lengthFeet);
      } else {
        projectedUnsupportedFeet += section.lengthFeet;
      }
    }
    if (projectedUnsupportedFeet > 0) {
      warnings.push("Unsupported or unresolved sections were excluded from automated pricing.");
    }
  } else if (input.customerProvidedFeet && input.customerProvidedFeet > 0) {
    supportedFeet = input.customerProvidedFeet;
    maxSectionFeet = input.customerProvidedFeet;
    assumptions.push("Customer-provided total measurement was treated as supported installation footage.");
  } else {
    if (!input.frontageFeet && model.missing_input_behavior === "error") {
      return failure("Front width is required for the active quick-estimate model.", {
        pricingVersion: pricingConfig.version,
        estimationModelVersion: estimationModel.version,
      });
    }

    const frontage = input.frontageFeet || normalizeNumber(model.minimum_reasonable_footage, 0);
    const coverageMultiplier =
      input.coverage === "front-sides"
        ? normalizeNumber(model.front_sides_multiplier, 1)
        : input.coverage === "full-perimeter"
          ? normalizeNumber(model.full_perimeter_multiplier, 1)
          : normalizeNumber(model.front_only_multiplier, 1);
    const roofFactor =
      input.roofComplexity === "complex"
        ? normalizeNumber(model.complex_roof_factor, 1)
        : input.roofComplexity === "moderate" || input.roofComplexity === "average"
          ? normalizeNumber(model.moderate_roof_factor, 1)
          : normalizeNumber(model.simple_roof_factor, 1);

    supportedFeet = (frontage * coverageMultiplier + input.peaks * normalizeNumber(model.peak_addition_feet, 0)) * roofFactor;
    if (input.stories >= 2) supportedFeet += normalizeNumber(model.upper_level_footage_allowance, 0);
    maxSectionFeet = supportedFeet;
    assumptions.push("Quick estimate uses the active versioned estimation model and is not an exact measurement.");
  }

  const minReasonable = normalizeNumber(model.minimum_reasonable_footage, 0);
  const maxReasonable = normalizeNumber(model.maximum_reasonable_footage, Number.POSITIVE_INFINITY);
  supportedFeet = Math.max(supportedFeet, minReasonable);

  if (!Number.isFinite(supportedFeet) || supportedFeet <= 0) {
    return failure("No supported footage was provided for automated pricing.", {
      pricingVersion: pricingConfig.version,
      estimationModelVersion: estimationModel.version,
      projectedUnsupportedFeet: Math.round(projectedUnsupportedFeet),
    });
  }

  if (supportedFeet > maxReasonable) {
    warnings.push("Estimated footage exceeds the active model's normal range and should be reviewed by an expert.");
  }

  const supportedInstallationFeet = Math.round(supportedFeet);
  const uncertaintyPercent = normalizeNumber(
    model.uncertainty_percentage,
    normalizeNumber(pricingConfig.estimate_uncertainty_percent, 0)
  ) / 100;
  const estimatedInstallationFeetMin = Math.max(1, Math.floor(supportedInstallationFeet * (1 - uncertaintyPercent)));
  const estimatedInstallationFeetMax = Math.ceil(supportedInstallationFeet * (1 + uncertaintyPercent));

  const allowancePercent = normalizeNumber(pricingConfig.purchasing_allowance_percent, 0) / 100;
  const recommendedPurchasingFeet = Math.ceil(supportedInstallationFeet * (1 + allowancePercent));
  const recommendedPurchasingFeetMin = Math.ceil(estimatedInstallationFeetMin * (1 + allowancePercent));
  const recommendedPurchasingFeetMax = Math.ceil(estimatedInstallationFeetMax * (1 + allowancePercent));

  const optimized = optimizeProducts(products, recommendedPurchasingFeet, maxSectionFeet || supportedInstallationFeet);
  if (!optimized) {
    return failure("No compatible product combination can cover the recommended purchasing footage.", {
      estimatedLinearFeet: supportedInstallationFeet,
      supportedInstallationFeet,
      estimatedInstallationFeetMin,
      estimatedInstallationFeetMax,
      recommendedPurchasingFeet,
      recommendedPurchasingFeetMin,
      recommendedPurchasingFeetMax,
      projectedUnsupportedFeet: Math.round(projectedUnsupportedFeet),
      pricingVersion: pricingConfig.version,
      estimationModelVersion: estimationModel.version,
    });
  }

  const adjustments: PriceAdjustment[] = [];
  const basePrice = supportedInstallationFeet * pricingConfig.base_labor_price_per_foot;
  adjustments.push({ name: "Base labor", amount: basePrice });

  let multiplier = 1;
  if (input.stories === 2) {
    const storyMultiplier = normalizeNumber(pricingConfig.two_story_multiplier, 1);
    multiplier *= storyMultiplier;
    adjustments.push({ name: "Two-story adjustment", multiplier: storyMultiplier });
  } else if (input.stories >= 3) {
    const storyMultiplier = normalizeNumber(pricingConfig.three_story_multiplier, 1);
    multiplier *= storyMultiplier;
    adjustments.push({ name: "Three-story adjustment", multiplier: storyMultiplier });
  }

  if (input.roofComplexity === "moderate" || input.roofComplexity === "average") {
    const roofMultiplier = normalizeNumber(pricingConfig.moderate_roof_multiplier, 1);
    multiplier *= roofMultiplier;
    adjustments.push({ name: "Moderate roof adjustment", multiplier: roofMultiplier });
  } else if (input.roofComplexity === "complex") {
    const roofMultiplier = normalizeNumber(pricingConfig.complex_roof_multiplier, 1);
    multiplier *= roofMultiplier;
    adjustments.push({ name: "Complex roof adjustment", multiplier: roofMultiplier });
  }

  let finalLabor = basePrice * multiplier;
  const peakCharge = input.peaks * normalizeNumber(pricingConfig.peak_charge, 0);
  if (peakCharge > 0) {
    finalLabor += peakCharge;
    adjustments.push({ name: "Peak review allowance", amount: peakCharge });
  }

  const minimumCharge = normalizeNumber(pricingConfig.minimum_installation_charge, 0);
  if (finalLabor < minimumCharge) {
    adjustments.push({ name: "Minimum installation charge", amount: minimumCharge - finalLabor });
    finalLabor = minimumCharge;
  }

  const kitsPrice = optimized.kits.reduce((sum, kit) => sum + kit.price * kit.quantity, 0);
  const totalPrice = finalLabor + kitsPrice;
  const priceUncertainty = normalizeNumber(pricingConfig.estimate_uncertainty_percent, 0) / 100;

  return {
    success: true,
    estimatedLinearFeet: supportedInstallationFeet,
    supportedInstallationFeet,
    estimatedInstallationFeetMin,
    estimatedInstallationFeetMax,
    recommendedPurchasingFeet,
    recommendedPurchasingFeetMin,
    recommendedPurchasingFeetMax,
    projectedUnsupportedFeet: Math.round(projectedUnsupportedFeet),
    totalSuppliedKitFeet: optimized.suppliedFeet,
    excessKitFeet: Math.max(0, optimized.suppliedFeet - recommendedPurchasingFeet),
    priceRange: {
      min: Math.round(totalPrice * (1 - priceUncertainty)),
      max: Math.round(totalPrice * (1 + priceUncertainty)),
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
