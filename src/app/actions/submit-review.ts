"use server";

import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import { SubmitReviewPayloadSchema, SubmitReviewPayload } from "@/types/schemas";
import { sendExpertReviewEmail } from "@/lib/email";

export async function submitExpertReview(payload: SubmitReviewPayload) {
  // Validate input with Zod
  const validationResult = SubmitReviewPayloadSchema.safeParse(payload);
  
  if (!validationResult.success) {
    return { success: false, error: "Invalid payload format." };
  }

  const data = validationResult.data;

  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return { success: false, error: "Database not configured." };
  }
  
  // Use Service Role to bypass RLS
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  try {
    // Call the strict atomic PostgreSQL transaction via RPC
    const { data: rpcData, error } = await supabase.rpc('submit_review_transaction', {
      p_submission_key: data.submissionKey,
      p_customer_name: data.customerName,
      p_customer_email: data.customerEmail,
      p_customer_phone: data.customerPhone || null,
      p_customer_street: data.customerStreet || null,
      p_customer_zip: data.customerZip || null,
      p_method: data.method,
      p_confidence: data.confidence,
      p_schema_version: data.schemaVersion,
      p_pricing_version: data.pricingVersion,
      p_catalog_version: data.catalogVersion,
      p_estimation_model_version: data.estimationModelVersion || null,
      p_property_type: data.propertyType,
      p_stories: data.stories,
      p_roof_complexity: data.roofComplexity,
      p_estimated_linear_feet: data.estimatedLinearFeet || null,
      p_supported_installation_feet: data.supportedInstallationFeet || null,
      p_recommended_purchasing_feet: data.recommendedPurchasingFeet || null,
      p_total_supplied_kit_feet: data.totalSuppliedKitFeet || null,
      p_excess_kit_feet: data.excessKitFeet || null,
      p_customer_provided_feet: data.customerProvidedFeet || null,
      p_customer_notes: data.customerNotes || null,
      p_contact_preference: data.contactPreference,
      p_video_call_window: data.videoCallWindow || null,
      p_time_zone: data.timeZone || null,
      p_measurement_sections: data.measurementSections || null,
      p_map_geometry: data.mapGeometry || null,
      p_uploaded_photos: data.uploadedPhotos || null,
      p_uploaded_plans: data.uploadedPlans || null,
      p_uploaded_videos: data.uploadedVideos || null,
    });

    if (error) {
      console.error("RPC Error:", error);
      throw error;
    }

    const { referenceNumber } = rpcData;

    const emailStatus = data.customerEmail
      ? await sendExpertReviewEmail({
          to: data.customerEmail,
          referenceNumber,
          name: data.customerName,
        })
      : { success: false, pending: false, error: "No customer email was provided." };

    return { 
      success: true, 
      referenceNumber,
      emailStatus,
    };

  } catch (error: unknown) {
    console.error("Quote Submission Error:", error);
    return { success: false, error: "Failed to submit quote for review." };
  }
}
