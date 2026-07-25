"use server";

import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import { QuoteData } from "@/types/quote";
import { sendExpertReviewEmail } from "@/lib/email"; // To be created

const submitReviewSchema = z.object({
  quoteData: z.any(), // In a real app, strict validation of the entire QuoteData here
});

export async function submitExpertReview(payload: { quoteData: QuoteData }) {
  const result = submitReviewSchema.safeParse(payload);
  
  if (!result.success) {
    return { success: false, error: "Invalid payload" };
  }

  const { quoteData } = payload;
  
  // Use Service Role to bypass RLS for internal application logic
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return { success: false, error: "Database not configured." };
  }
  
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  try {
    // 1. Create or Update Customer
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .insert({
        name: quoteData.contact.firstName + " " + quoteData.contact.lastName,
        email: quoteData.contact.email,
        phone: quoteData.contact.phone,
        preferred_contact_method: 'email', // Add to QuoteData later if needed
        street: quoteData.property.address,
        zip: quoteData.property.zipCode,
      })
      .select('id')
      .single();

    if (customerError) throw customerError;

    // 2. Generate secure Reference Number and Create Quote with Retry
    let referenceNumber = '';
    let quote: any = null;
    let quoteError = null;
    const maxRetries = 3;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      referenceNumber = `EST-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      
      const { data, error } = await supabase
        .from('quotes')
        .insert({
          reference_number: referenceNumber,
          customer_id: customer.id,
          method: quoteData.method,
          status: 'review_submitted',
          confidence: quoteData.confidence,
          schema_version: quoteData.schemaVersion,
          pricing_version: quoteData.pricingVersion,
          catalog_version: quoteData.productCatalogVersion,
          estimated_linear_feet: quoteData.estimatedLinearFeet,
          customer_provided_feet: quoteData.customerProvidedFeet,
          property_type: quoteData.property.propertyType,
          stories: quoteData.property.stories?.toString(),
          roof_complexity: quoteData.property.roofComplexity,
          estimated_price_min: quoteData.priceRange?.min,
          estimated_price_max: quoteData.priceRange?.max,
        })
        .select('id')
        .single();
        
      if (!error) {
        quote = data;
        quoteError = null;
        break; // Success
      }
      
      if (error.code === '23505') {
        // Unique violation, retry
        quoteError = error;
        continue;
      }
      
      // Other error, throw
      throw error;
    }

    if (quoteError) throw quoteError;

    // 4. Save Measurement Sections
    if (quoteData.measurementSections && quoteData.measurementSections.length > 0) {
      const sections = quoteData.measurementSections.map(s => ({
        quote_id: quote.id,
        section_name: s.name,
        length_feet: s.lengthFeet,
        display_order: s.order
      }));
      await supabase.from('quote_measurements').insert(sections);
    }

    // 4b. Save Map Drawings
    if (quoteData.method === 'map' && quoteData.measurementSections) {
      await supabase.from('quote_map_drawings').insert({
        quote_id: quote.id,
        provider: 'google',
        geometry_json: JSON.stringify(quoteData.measurementSections)
      });
    }

    // 4c. Save Uploaded Photos and Annotations
    if (quoteData.uploadedPhotos && quoteData.uploadedPhotos.length > 0) {
      for (const [index, photo] of quoteData.uploadedPhotos.entries()) {
        const { data: fileData, error: fileError } = await supabase.from('uploaded_files').insert({
          quote_id: quote.id,
          file_type: 'photo',
          storage_path: photo.storagePath || '',
          original_name: photo.name,
          mime_type: photo.type,
          size_bytes: photo.size,
          display_order: index
        }).select('id').single();

        if (fileData && photo.annotations && photo.annotations.length > 0) {
          await supabase.from('image_annotations').insert({
            file_id: fileData.id,
            schema_version: '1.0',
            original_image_width: 1000, // placeholder
            original_image_height: 1000,
            points: JSON.stringify(photo.annotations)
          });
        }
      }
    }

    // 5. Create Expert Review Request
    await supabase.from('expert_reviews').insert({
      quote_id: quote.id,
      notes: quoteData.customerNotes || "Expert review requested.",
      status: 'pending'
    });

    // 6. Send transactional email
    if (quoteData.contact.email) {
      await sendExpertReviewEmail({
        to: quoteData.contact.email,
        referenceNumber,
        name: quoteData.contact.firstName
      });
    }

    return { 
      success: true, 
      referenceNumber 
    };

  } catch (error: unknown) {
    console.error("Quote Submission Error:", error);
    return { success: false, error: "Failed to submit quote for review." };
  }
}
