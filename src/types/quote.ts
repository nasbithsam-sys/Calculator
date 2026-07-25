export type EstimationMethod = 'address' | 'photos' | 'map' | 'quick' | 'measurements' | 'plan' | 'expert-review';

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
  stories?: 1 | 2 | 3 | '4+';
  roofComplexity?: 'simple' | 'average' | 'complex' | 'custom';
}

export interface CustomerContact {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

export interface FileMetadata {
  id: string;
  name: string;
  size: number;
  type: string;
  createdAt: number;
  storagePath?: string; // Set when finally uploaded to real DB
  annotations?: unknown[]; // Holds lines from photo annotator
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
  
  estimatedLinearFeet: number | null;
  customerProvidedFeet: number | null;
  measurementSections: { id: string; name: string; lengthFeet: number; order: number }[];
  
  uploadedPhotos: FileMetadata[];
  uploadedPlans: FileMetadata[];
  
  priceRange: {
    min: number;
    max: number;
  } | null;
  
  recommendedKits: any[]; 
  adjustments?: any[];
  
  contact: CustomerContact;
  
  expertReviewRequested: boolean;
  customerNotes?: string;
  
  createdAt: number;
  updatedAt: number;
}
