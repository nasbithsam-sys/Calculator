export type EstimationMethod = 'address' | 'photos' | 'map' | 'quick' | 'measurements' | 'video' | 'plan' | 'expert-review';

export type EstimateStatus = 'incomplete' | 'preliminary' | 'ready-for-review' | 'review_submitted' | 'expert_confirmed';

export type ConfidenceLevel = 'low' | 'medium' | 'high' | 'not-calculated';

export interface PropertyDetails {
  address?: string;
  zipCode?: string;
  city?: string;
  state?: string;
  lat?: number;
  lng?: number;
  placeId?: string;
  propertyType?: 'single-family' | 'townhouse' | 'commercial' | 'other';
  propertyCategory?: string;
  stories?: 1 | 2 | 3 | '4+';
  roofComplexity?: 'simple' | 'average' | 'complex' | 'custom';
  coverageType?: string;
  rooflineType?: string;
  gableCount?: number;
  archCount?: number;
  hasDormers?: boolean;
  hasPorch?: boolean;
  hasBalcony?: boolean;
  hasMultipleRoofLevels?: boolean;
  hasDetachedGarage?: boolean;
  hasMultipleStructures?: boolean;
  hasHiddenSections?: boolean;
  hasDifficultCorners?: boolean;
  accessDifficulty?: 'standard' | 'moderate' | 'steep_slope' | 'high_scaffold' | 'extreme';
}

export interface CustomerContact {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  preferredContactMethod?: 'email' | 'phone' | 'text' | 'video';
  videoCallWindow?: string;
  timeZone?: string;
}

export interface FileMetadata {
  id: string;
  name: string;
  size: number;
  type: string;
  createdAt: number;
  storagePath?: string; // Set when finally uploaded to real DB
  displayOrder?: number;
  label?: string;
  notes?: string;
  originalWidth?: number;
  originalHeight?: number;
  annotations?: unknown[]; // Holds lines from photo annotator
  calibrationResult?: {
    isCalibrated?: boolean;
    planesData?: unknown;
    planes?: unknown;
    validationWarning?: string;
  };
  planMetadata?: {
    dimensionsVisible?: boolean;
    scaleVisible?: boolean;
    scaleDetails?: string;
  };
  videoMetadata?: {
    viewLabel?: string;
    referenceMeasurement?: string;
  };
}

export interface InstallationAreas {
  front?: boolean;
  sides?: boolean;
  back?: boolean;
  secondStory?: boolean;
  peaks?: boolean;
}

export interface QuoteData {
  quoteId: string;
  version: string;
  schemaVersion: string;
  pricingVersion: string;
  productCatalogVersion: string;
  
  method: EstimationMethod | null;
  status: EstimateStatus;
  confidence: ConfidenceLevel;
  
  property: PropertyDetails;
  areas: InstallationAreas;
  
  // Lights & Material Requirements
  footageMethod?: string | null;
  footageStatus?: 'preliminary' | 'supported' | 'partially_supported' | 'customer_provided' | 'expert_confirmed' | 'unable_to_calculate' | null;
  estimatedLinearFeet: number | null;
  supportedInstallationFeet: number | null;
  estimatedInstallationFeetMin: number | null;
  estimatedInstallationFeetMax: number | null;
  recommendedPurchasingFeet: number | null;
  recommendedPurchasingFeetMin: number | null;
  recommendedPurchasingFeetMax: number | null;
  projectedUnsupportedFeet: number | null;
  customerProvidedFeet: number | null;
  expertConfirmedFeet: number | null;
  purchasingAllowancePercent: number | null;
  totalSuppliedKitFeet: number | null;
  excessKitFeet: number | null;
  estimationModelVersion: string | null;
  measurementSections: {
    id: string;
    name: string;
    lengthFeet: number;
    order: number;
    type?: string;
    measurementStatus?: string;
  }[];
  
  uploadedPhotos: FileMetadata[];
  uploadedPlans: FileMetadata[];
  uploadedVideos: FileMetadata[];
  
  // Installation Pricing Tier & Complexity
  jobSize?: 'Small' | 'Medium' | 'Large' | 'Extra Large' | null;
  complexityScore?: number | null;
  complexityBand?: 'Low' | 'Moderate' | 'High' | 'Extreme' | null;
  pricingTierCode?: string | null;
  pricingTierName?: string | null;
  installationPriceMin?: number | null;
  installationPriceMax?: number | null;
  installationPricingModelVersion?: string | null;
  requiresExpertReview?: boolean;
  reviewReasons?: string[];
  
  priceRange: {
    min: number;
    max: number;
  } | null;
  
  recommendedKits: ProductRecommendation[]; 
  adjustments?: PriceAdjustment[];
  
  contact: CustomerContact;
  
  expertReviewRequested: boolean;
  customerNotes?: string;
  
  createdAt: number;
  updatedAt: number;
}

export interface ProductRecommendation {
  id: string;
  name: string;
  modelNumber?: string;
  productFamily?: string;
  generation?: string;
  lengthFeet: number;
  quantity: number;
  price: number;
  catalogVersion?: string;
  compatibilityNote?: string;
}

export interface PriceAdjustment {
  name: string;
  amount?: number;
  multiplier?: number;
}
