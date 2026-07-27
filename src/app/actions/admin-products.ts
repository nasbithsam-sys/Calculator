"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";

export async function getProducts() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching products:", error);
    return [];
  }
  return data;
}

export async function createProduct(formData: FormData) {
  const { supabase } = await requireAdmin();
  
  const payload = {
    name: formData.get("name") as string,
    product_family: formData.get("product_family") as string,
    generation: formData.get("generation") as string,
    model_number: formData.get("model_number") as string,
    length_feet: Number(formData.get("length_feet") || 0),
    color: formData.get("color") as string,
    max_connected_length: Number(formData.get("max_connected_length") || 0),
    price: Number(formData.get("price") || 0),
    catalog_version: formData.get("catalog_version") as string,
    verification_status: formData.get("verification_status") as string,
    verification_source: formData.get("verification_source") as string,
    is_active: formData.get("is_active") === "true",
    extension_compatibility: formData.get("extension_compatibility") as string,
    included_extensions: Number(formData.get("included_extensions") || 0),
    installation_compatibility: formData.get("installation_compatibility") as string,
  };

  const { error } = await supabase.from("products").insert(payload);

  if (error) {
    console.error("Error creating product:", error);
    return { error: error.message };
  }

  revalidatePath("/admin/products");
  return { success: true };
}

export async function toggleProductStatus(id: string, currentStatus: boolean) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase
    .from("products")
    .update({ is_active: !currentStatus })
    .eq("id", id);

  if (error) {
    console.error("Error toggling product status:", error);
    return { error: error.message };
  }

  revalidatePath("/admin/products");
  return { success: true };
}
