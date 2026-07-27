import { NextResponse } from 'next/server';
import { submitExpertReview } from '@/app/actions/submit-review';
import type { QuoteData } from '@/types/quote';

const sectionTypes = new Set(["horizontal_eave", "horizontal_perimeter", "sloped_peak", "hidden_section", "uncertain", "manual"]);
const measurementStatuses = new Set(["supported", "provisional", "unsupported", "expert_confirmed"]);

function sanitizeSections(sections: QuoteData["measurementSections"]) {
  return sections.map((section) => ({
    id: section.id,
    name: section.name,
    lengthFeet: section.lengthFeet,
    order: section.order,
    type: section.type && sectionTypes.has(section.type) ? section.type as "horizontal_eave" | "horizontal_perimeter" | "sloped_peak" | "hidden_section" | "uncertain" | "manual" : undefined,
    measurementStatus: section.measurementStatus && measurementStatuses.has(section.measurementStatus)
      ? section.measurementStatus as "supported" | "provisional" | "unsupported" | "expert_confirmed"
      : undefined,
  }));
}

function sanitizeFiles(files: QuoteData["uploadedPhotos"]) {
  return files.map((file, index) => ({
    id: file.id,
    name: file.name,
    size: file.size,
    type: file.type,
    storagePath: file.storagePath,
    label: file.label,
    notes: file.notes,
    originalWidth: file.originalWidth,
    originalHeight: file.originalHeight,
    displayOrder: file.displayOrder ?? index,
    annotations: (file.annotations || []).flatMap((annotation) => {
      const candidate = annotation as {
        id?: unknown;
        points?: unknown;
        color?: unknown;
        type?: unknown;
        planeId?: unknown;
        realLength?: unknown;
        pixels?: unknown;
      };
      if (
        typeof candidate.id !== "string" ||
        !Array.isArray(candidate.points) ||
        typeof candidate.color !== "string" ||
        (candidate.type !== "reference" && candidate.type !== "target") ||
        typeof candidate.planeId !== "string"
      ) {
        return [];
      }
      const annotationType: "reference" | "target" = candidate.type;
      return [{
        id: candidate.id,
        points: candidate.points.filter((point): point is number => typeof point === "number"),
        color: candidate.color,
        type: annotationType,
        planeId: candidate.planeId,
        realLength: typeof candidate.realLength === "number" ? candidate.realLength : undefined,
        pixels: typeof candidate.pixels === "number" ? candidate.pixels : undefined,
      }];
    }),
    planMetadata: file.planMetadata,
    videoMetadata: file.videoMetadata,
  }));
}

export async function POST(request: Request) {
  try {
    const payload: { quoteData?: QuoteData } = await request.json();
    const quoteData = payload.quoteData;

    if (!quoteData) {
      return NextResponse.json({ success: false, error: "Quote data is required" }, { status: 400 });
    }
    
    const result = await submitExpertReview({
      submissionKey: quoteData.quoteId,
      customerName: [quoteData.contact.firstName, quoteData.contact.lastName].filter(Boolean).join(" "),
      customerEmail: quoteData.contact.email || "",
      customerPhone: quoteData.contact.phone,
      customerStreet: quoteData.property.address,
      customerZip: quoteData.property.zipCode,
      method: quoteData.method || "expert-review",
      confidence: quoteData.confidence,
      schemaVersion: quoteData.schemaVersion,
      pricingVersion: quoteData.pricingVersion,
      catalogVersion: quoteData.productCatalogVersion,
      estimationModelVersion: quoteData.estimationModelVersion || undefined,
      propertyType: quoteData.property.propertyType || "single-family",
      stories: String(quoteData.property.stories || "1"),
      roofComplexity: quoteData.property.roofComplexity || "average",
      estimatedLinearFeet: quoteData.estimatedLinearFeet,
      supportedInstallationFeet: quoteData.supportedInstallationFeet,
      recommendedPurchasingFeet: quoteData.recommendedPurchasingFeet,
      totalSuppliedKitFeet: quoteData.totalSuppliedKitFeet,
      excessKitFeet: quoteData.excessKitFeet,
      customerProvidedFeet: quoteData.customerProvidedFeet,
      customerNotes: quoteData.customerNotes,
      contactPreference: quoteData.contact.preferredContactMethod || "email",
      videoCallWindow: quoteData.contact.videoCallWindow,
      timeZone: quoteData.contact.timeZone,
      measurementSections: sanitizeSections(quoteData.measurementSections),
      mapGeometry: quoteData.method === "map" ? sanitizeSections(quoteData.measurementSections) : undefined,
      uploadedPhotos: sanitizeFiles(quoteData.uploadedPhotos),
      uploadedPlans: sanitizeFiles(quoteData.uploadedPlans),
      uploadedVideos: sanitizeFiles(quoteData.uploadedVideos),
    });
    
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error("API Route Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
