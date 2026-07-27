"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";

export async function getPricingConfigurations() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("pricing_configurations")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching pricing configs:", error);
    return [];
  }
  return data;
}

export async function createPricingConfiguration(formData: FormData) {
  const { supabase } = await requireAdmin();
  
  const version = formData.get("version") as string;
  if (!version) return { error: "Version is required" };

  const payload = {
    version,
    base_labor_price_per_foot: Number(formData.get("base_labor_price_per_foot") || 0),
    minimum_installation_charge: Number(formData.get("minimum_installation_charge") || 0),
    two_story_multiplier: Number(formData.get("two_story_multiplier") || 1),
    three_story_multiplier: Number(formData.get("three_story_multiplier") || 1),
    complex_roof_multiplier: Number(formData.get("complex_roof_multiplier") || 1),
    moderate_roof_multiplier: Number(formData.get("moderate_roof_multiplier") || 1),
    peak_charge: Number(formData.get("peak_charge") || 0),
    difficult_access_charge: Number(formData.get("difficult_access_charge") || 0),
    accessory_charge: Number(formData.get("accessory_charge") || 0),
    travel_adjustment: Number(formData.get("travel_adjustment") || 0),
    regional_adjustment: Number(formData.get("regional_adjustment") || 0),
    purchasing_allowance_percent: Number(formData.get("purchasing_allowance_percent") || 10),
    estimate_uncertainty_percent: Number(formData.get("estimate_uncertainty_percent") || 5),
    tax_rate: Number(formData.get("tax_rate") || 0),
    jump_extension_fee: Number(formData.get("jump_extension_fee") || 0),
  };

  const { error } = await supabase.from("pricing_configurations").insert(payload);

  if (error) {
    console.error("Error creating pricing config:", error);
    return { error: error.message };
  }

  revalidatePath("/admin/pricing");
  return { success: true };
}

export async function activatePricingConfiguration(id: string) {
  const { supabase } = await requireAdmin();
  
  // Start transaction essentially by deactivating all, then activating one
  await supabase.from("pricing_configurations").update({ active: false }).neq('id', '00000000-0000-0000-0000-000000000000'); // Deactivate all
  
  const { error } = await supabase.from("pricing_configurations").update({ active: true }).eq('id', id);

  if (error) {
    console.error("Error activating pricing config:", error);
    return { error: error.message };
  }

  revalidatePath("/admin/pricing");
  return { success: true };
}
