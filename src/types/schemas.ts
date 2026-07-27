import { z } from "zod";

export const FileMetadataSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  size: z.number().nonnegative(),
  type: z.string(),
  storagePath: z.string().optional(),
  displayOrder: z.number().optional().default(0),
  label: z.string().optional(),
  notes: z.string().optional(),
  originalWidth: z.number().positive().optional(),
  originalHeight: z.number().positive().optional(),
  annotations: z.array(z.object({
    id: z.string(),
    points: z.array(z.number()).min(4),
    color: z.string(),
    type: z.enum(["reference", "target"]),
    planeId: z.string(),
    realLength: z.number().optional(),
    pixels: z.number().optional(),
  })).optional(),
  calibrationResult: z.object({
    isCalibrated: z.boolean().optional(),
    planesData: z.record(z.string(), z.object({
      calibrationRatio: z.number().optional(),
      isValid: z.boolean().optional(),
      warning: z.string().optional(),
    })).optional(),
    planes: z.array(z.object({
      id: z.string(),
      name: z.string(),
      referenceLengthFeet: z.string(),
    })).optional(),
    validationWarning: z.string().optional(),
  }).optional(),
  planMetadata: z.object({
    dimensionsVisible: z.boolean().optional(),
    scaleVisible: z.boolean().optional(),
    scaleDetails: z.string().optional(),
  }).optional(),
  videoMetadata: z.object({
    viewLabel: z.string().optional(),
    referenceMeasurement: z.string().optional(),
  }).optional(),
});

export const MeasurementSectionSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  lengthFeet: z.number().positive(),
  order: z.number().int(),
  type: z.string().optional(),
  measurementStatus: z.string().optional(),
});

export const MapGeometrySchema = z.array(z.object({
  id: z.string().optional(),
  name: z.string(),
  lengthFeet: z.number().nonnegative(),
  order: z.number().int().optional(),
  type: z.enum(["horizontal_eave", "horizontal_perimeter", "sloped_peak", "hidden_section", "uncertain", "manual"]).optional(),
  measurementStatus: z.enum(["supported", "provisional", "unsupported", "expert_confirmed"]).optional(),
  coordinates: z.array(z.object({
    lat: z.number(),
    lng: z.number(),
  })).optional(),
})).optional();

export const SubmitReviewPayloadSchema = z.object({
  submissionKey: z.string().min(8),
  customerName: z.string().min(1, "Name is required"),
  customerEmail: z.string().email("Invalid email"),
  customerPhone: z.string().optional(),
  customerStreet: z.string().optional(),
  customerZip: z.string().optional(),
  method: z.enum(['address', 'photos', 'map', 'quick', 'measurements', 'video', 'plan', 'expert-review']),
  confidence: z.string(),
  schemaVersion: z.string(),
  pricingVersion: z.string(),
  catalogVersion: z.string(),
  estimationModelVersion: z.string().optional(),
  propertyType: z.string(),
  stories: z.string(),
  roofComplexity: z.string(),
  estimatedLinearFeet: z.number().nullable().optional(),
  supportedInstallationFeet: z.number().nullable().optional(),
  recommendedPurchasingFeet: z.number().nullable().optional(),
  totalSuppliedKitFeet: z.number().nullable().optional(),
  excessKitFeet: z.number().nullable().optional(),
  customerProvidedFeet: z.number().nullable().optional(),
  jobSize: z.string().nullable().optional(),
  complexityScore: z.number().nullable().optional(),
  complexityBand: z.string().nullable().optional(),
  pricingTierCode: z.string().nullable().optional(),
  pricingTierName: z.string().nullable().optional(),
  installationPriceMin: z.number().nullable().optional(),
  installationPriceMax: z.number().nullable().optional(),
  installationPricingModelVersion: z.string().nullable().optional(),
  customerNotes: z.string().optional(),
  contactPreference: z.enum(["email", "phone", "text", "video"]),
  videoCallWindow: z.string().optional(),
  timeZone: z.string().optional(),
  measurementSections: z.array(MeasurementSectionSchema).optional(),
  mapGeometry: MapGeometrySchema,
  uploadedPhotos: z.array(FileMetadataSchema).optional(),
  uploadedPlans: z.array(FileMetadataSchema).optional(),
  uploadedVideos: z.array(FileMetadataSchema).optional(),
}).refine((data) => data.contactPreference !== "video" || Boolean(data.videoCallWindow), {
  message: "Video-call time window is required when video call is selected",
  path: ["videoCallWindow"],
});

export type SubmitReviewPayload = z.infer<typeof SubmitReviewPayloadSchema>;
