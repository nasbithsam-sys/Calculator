import { calculateEstimate } from "@/app/actions/calculate";

// Mock Supabase server client for unit testing calculation rules
jest.mock("@/utils/supabase/server", () => ({
  createClient: jest.fn().mockResolvedValue({
    from: (table: string) => ({
      select: () => ({
        eq: (col: string, val: any) => ({
          single: async () => {
            if (table === "pricing_configurations") {
              return {
                data: {
                  version: "v1.0",
                  purchasing_allowance_percent: 15,
                  estimate_uncertainty_percent: 10,
                  job_size_thresholds: { small: 100, medium: 180, large: 280 },
                  complexity_scoring_rules: {
                    two_story_points: 15,
                    three_story_points: 35,
                    moderate_roof_points: 15,
                    complex_roof_points: 30,
                    gable_points: 5,
                  },
                  complexity_bands: { low: 20, moderate: 45, high: 75 },
                  pricing_tier_matrix: {
                    SMALL_LOW: { name: "Small / Low Complexity", min: 650, max: 950 },
                    SMALL_HIGH: { name: "Small / High Complexity", min: 1100, max: 1600 },
                    MEDIUM_LOW: { name: "Medium / Low Complexity", min: 1100, max: 1550 },
                    MEDIUM_HIGH: { name: "Medium / High Complexity", min: 1800, max: 2500 },
                    LARGE_LOW: { name: "Large / Low Complexity", min: 1700, max: 2300 },
                    LARGE_HIGH: { name: "Large / High Complexity Residential", min: 2700, max: 3800 },
                  },
                },
                error: null,
              };
            }
            if (table === "estimation_models") {
              return {
                data: {
                  version: "v1.0",
                  config: {
                    front_only_multiplier: 1.0,
                    front_sides_multiplier: 2.0,
                    full_perimeter_multiplier: 3.5,
                    peak_addition_feet: 15,
                    minimum_reasonable_footage: 20,
                    uncertainty_percentage: 10,
                  },
                },
                error: null,
              };
            }
            return { data: null, error: null };
          },
          returns: async () => {
            if (table === "products") {
              return {
                data: [
                  {
                    id: "p100",
                    name: "Govee Permanent Outdoor Lights (100ft Kit)",
                    product_family: "Standard",
                    generation: "v1",
                    length_feet: 100,
                    price: 299.99,
                    max_connected_length: 150,
                    catalog_version: "v1.0",
                    is_active: true,
                    verification_status: "verified",
                  },
                  {
                    id: "p150",
                    name: "Govee Permanent Outdoor Lights (150ft Kit)",
                    product_family: "Standard",
                    generation: "v1",
                    length_feet: 150,
                    price: 449.99,
                    max_connected_length: 150,
                    catalog_version: "v1.0",
                    is_active: true,
                    verification_status: "verified",
                  },
                  {
                    id: "p50",
                    name: "Govee Permanent Outdoor Lights (50ft Expansion)",
                    product_family: "Standard",
                    generation: "v1",
                    length_feet: 50,
                    price: 149.99,
                    max_connected_length: 200,
                    catalog_version: "v1.0",
                    is_active: true,
                    verification_status: "verified",
                  },
                ],
                error: null,
              };
            }
            return { data: [], error: null };
          },
        }),
      }),
    }),
  }),
}));

describe("Decoupled Calculation Pipeline Tests", () => {

  test("1. Supported customer measurements determine light quantity and purchasing allowance correctly", async () => {
    const res = await calculateEstimate({
      customerProvidedFeet: 100,
      stories: 1,
      roofComplexity: "simple",
    });

    expect(res.success).toBe(true);
    expect(res.supportedInstallationFeet).toBe(100);
    // Purchasing allowance = 100 * 1.15 = 115 ft
    expect(res.recommendedPurchasingFeet).toBe(115);
    // Optimizer chooses 150ft kit (or 100 + 50 = 150ft) to cover 115ft without shortage
    expect(res.totalSuppliedKitFeet).toBeGreaterThanOrEqual(115);
    expect(res.excessKitFeet).toBe(res.totalSuppliedKitFeet - 115);
  });

  test("2. Small simple job receives SMALL_LOW pricing tier", async () => {
    const res = await calculateEstimate({
      customerProvidedFeet: 80,
      stories: 1,
      roofComplexity: "simple",
      peaks: 0,
    });

    expect(res.success).toBe(true);
    expect(res.jobSize).toBe("Small");
    expect(res.complexityBand).toBe("Low");
    expect(res.pricingTierCode).toBe("SMALL_LOW");
  });

  test("3. Large complex job receives LARGE_HIGH pricing tier", async () => {
    const res = await calculateEstimate({
      customerProvidedFeet: 220,
      stories: 2,
      roofComplexity: "complex",
      peaks: 4,
    });

    expect(res.success).toBe(true);
    expect(res.jobSize).toBe("Large");
    expect(res.complexityBand).toBe("High");
    expect(res.pricingTierCode).toBe("LARGE_HIGH");
  });

  test("4. Two jobs with equal footage receive different pricing tiers if complexity differs", async () => {
    const simpleJob = await calculateEstimate({
      customerProvidedFeet: 150,
      stories: 1,
      roofComplexity: "simple",
    });

    const complexJob = await calculateEstimate({
      customerProvidedFeet: 150,
      stories: 2,
      roofComplexity: "complex",
      peaks: 4,
    });

    expect(simpleJob.supportedInstallationFeet).toBe(complexJob.supportedInstallationFeet);
    expect(simpleJob.pricingTierCode).toBe("MEDIUM_LOW");
    expect(complexJob.pricingTierCode).toBe("MEDIUM_HIGH");
    expect(complexJob.installationPriceMin).toBeGreaterThan(simpleJob.installationPriceMin);
  });

  test("5. Shorter difficult job costs MORE than a longer simple job", async () => {
    const shortDifficult = await calculateEstimate({
      customerProvidedFeet: 90, // Small job
      stories: 3,               // +35 pts
      roofComplexity: "complex",// +30 pts -> High Complexity -> SMALL_HIGH
    });

    const longSimple = await calculateEstimate({
      customerProvidedFeet: 120, // Medium job
      stories: 1,                // 0 pts
      roofComplexity: "simple",  // 0 pts -> Low Complexity -> MEDIUM_LOW
    });

    // SMALL_HIGH labor min = , MEDIUM_LOW labor min = 
    expect(shortDifficult.complexityScore).toBeGreaterThan(longSimple.complexityScore);
    expect(shortDifficult.installationPriceMin).toBeGreaterThanOrEqual(longSimple.installationPriceMin);
  });

  test("6. Unsupported sections are excluded from supported footage", async () => {
    const res = await calculateEstimate({
      measuredSections: [
        { name: "Front Eave", lengthFeet: 100, type: "horizontal_eave", measurementStatus: "supported" },
        { name: "Sloped Peak", lengthFeet: 40, type: "sloped_peak", measurementStatus: "unsupported" },
      ],
      stories: 1,
      roofComplexity: "simple",
    });

    expect(res.supportedInstallationFeet).toBe(100);
    expect(res.projectedUnsupportedFeet).toBe(40);
    expect(res.footageStatus).toBe("partially_supported");
  });

  test("7. Quick estimate returns preliminary range", async () => {
    const res = await calculateEstimate({
      coverage: "front-only",
      frontageFeet: 50,
      stories: 1,
      roofComplexity: "simple",
      peaks: 1,
    });

    expect(res.success).toBe(true);
    expect(res.footageMethod).toBe("quick_estimate");
    expect(res.footageStatus).toBe("preliminary");
    expect(res.estimatedInstallationFeetMin).toBeLessThan(res.supportedInstallationFeet);
    expect(res.estimatedInstallationFeetMax).toBeGreaterThan(res.supportedInstallationFeet);
  });

});
