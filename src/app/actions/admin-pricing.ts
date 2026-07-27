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
    purchasing_allowance_percent: Number(formData.get("purchasing_allowance_percent") || 15),
    estimate_uncertainty_percent: Number(formData.get("estimate_uncertainty_percent") || 10),
    minimum_installation_charge: Number(formData.get("minimum_installation_charge") || 650),
    tax_rate: Number(formData.get("tax_rate") || 0),
    job_size_thresholds: {
      small: Number(formData.get("threshold_small") || 100),
      medium: Number(formData.get("threshold_medium") || 180),
      large: Number(formData.get("threshold_large") || 280),
    },
    complexity_bands: {
      low: Number(formData.get("band_low") || 20),
      moderate: Number(formData.get("band_moderate") || 45),
      high: Number(formData.get("band_high") || 75),
    },
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
