/* eslint-disable @typescript-eslint/no-require-imports */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyMatrix() {
  const tierMatrix = {
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

  const thresholds = { small: 100, medium: 180, large: 280 };
  const scoringRules = {
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
    difficult_access_points: 20
  };
  const bands = { low: 20, moderate: 45, high: 75 };

  const { error } = await supabase
    .from('pricing_configurations')
    .update({
      job_size_thresholds: thresholds,
      complexity_scoring_rules: scoringRules,
      complexity_bands: bands,
      pricing_tier_matrix: tierMatrix
    })
    .eq('active', true);

  if (error) {
    console.error('Error applying matrix:', error);
  } else {
    console.log('Successfully updated active pricing config with matrix!');
  }
}

applyMatrix();
