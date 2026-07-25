import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { QuoteData, EstimationMethod, EstimateStatus, ConfidenceLevel, FileMetadata } from '@/types/quote';

export const QUOTE_SCHEMA_VERSION = '1.0.0';
export const PRICING_VERSION = '1.0.0';
export const PRODUCT_CATALOG_VERSION = '1.0.0';

export interface QuoteStore {
  quote: QuoteData;
  setMethod: (method: EstimationMethod) => void;
  updateProperty: (property: Partial<QuoteData['property']>) => void;
  updateAreas: (areas: Partial<QuoteData['areas']>) => void;
  updateContact: (contact: Partial<QuoteData['contact']>) => void;
  setFeet: (feet: number | null, type: 'estimated' | 'customer') => void;
  setMeasurementSections: (sections: QuoteData['measurementSections']) => void;
  setPriceRange: (range: { min: number; max: number } | null) => void;
  setCalculationResult: (result: { priceRange: { min: number; max: number }, recommendedKits: any[], adjustments: any[], pricingVersion: string, productCatalogVersion: string }) => void;
  setStatus: (status: EstimateStatus, confidence: ConfidenceLevel) => void;
  addPhoto: (photo: FileMetadata) => void;
  updatePhoto: (id: string, updates: Partial<FileMetadata>) => void;
  removePhoto: (id: string) => void;
  addPlan: (plan: FileMetadata) => void;
  removePlan: (id: string) => void;
  resetQuote: () => void;
}

const generateId = () => typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);

const initialQuoteState: QuoteData = {
  quoteId: generateId(),
  version: '1',
  schemaVersion: QUOTE_SCHEMA_VERSION,
  pricingVersion: PRICING_VERSION,
  productCatalogVersion: PRODUCT_CATALOG_VERSION,
  
  method: null,
  status: 'incomplete',
  confidence: 'not-calculated',
  
  property: {},
  areas: {},
  
  estimatedLinearFeet: null,
  customerProvidedFeet: null,
  measurementSections: [],
  
  uploadedPhotos: [],
  uploadedPlans: [],
  
  priceRange: null,
  recommendedKits: [],
  
  contact: {},
  expertReviewRequested: false,
  
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

export const useQuoteStore = create<QuoteStore>()(
  persist(
    (set) => ({
      quote: initialQuoteState,
      
      setMethod: (method) => set((state) => ({
        quote: { ...state.quote, method, updatedAt: Date.now() }
      })),
      
      updateProperty: (property) => set((state) => ({
        quote: { 
          ...state.quote, 
          property: { ...state.quote.property, ...property },
          updatedAt: Date.now()
        }
      })),
      
      updateAreas: (areas) => set((state) => ({
        quote: {
          ...state.quote,
          areas: { ...state.quote.areas, ...areas },
          updatedAt: Date.now()
        }
      })),

      updateContact: (contact) => set((state) => ({
        quote: {
          ...state.quote,
          contact: { ...state.quote.contact, ...contact },
          updatedAt: Date.now()
        }
      })),
      
      setFeet: (feet, type) => set((state) => ({
        quote: {
          ...state.quote,
          ...(type === 'estimated' ? { estimatedLinearFeet: feet } : { customerProvidedFeet: feet }),
          updatedAt: Date.now()
        }
      })),
      
      setMeasurementSections: (sections) => set((state) => ({
        quote: {
          ...state.quote,
          measurementSections: sections,
          updatedAt: Date.now()
        }
      })),
      
      setPriceRange: (range) => set((state) => ({
        quote: {
          ...state.quote,
          priceRange: range,
          updatedAt: Date.now()
        }
      })),
      
      setCalculationResult: (result) => set((state) => ({
        quote: {
          ...state.quote,
          priceRange: result.priceRange,
          recommendedKits: result.recommendedKits,
          adjustments: result.adjustments,
          pricingVersion: result.pricingVersion,
          productCatalogVersion: result.productCatalogVersion,
          updatedAt: Date.now()
        }
      })),
      
      setStatus: (status, confidence) => set((state) => ({
        quote: {
          ...state.quote,
          status,
          confidence,
          updatedAt: Date.now()
        }
      })),
      
      addPhoto: (photo) => set((state) => ({
        quote: {
          ...state.quote,
          uploadedPhotos: [...state.quote.uploadedPhotos, photo],
          updatedAt: Date.now()
        }
      })),
      
      updatePhoto: (id, updates) => set((state) => ({
        quote: {
          ...state.quote,
          uploadedPhotos: state.quote.uploadedPhotos.map(p => p.id === id ? { ...p, ...updates } : p),
          updatedAt: Date.now()
        }
      })),
      
      removePhoto: (id) => set((state) => ({
        quote: {
          ...state.quote,
          uploadedPhotos: state.quote.uploadedPhotos.filter(p => p.id !== id),
          updatedAt: Date.now()
        }
      })),
      
      addPlan: (plan) => set((state) => ({
        quote: {
          ...state.quote,
          uploadedPlans: [...state.quote.uploadedPlans, plan],
          updatedAt: Date.now()
        }
      })),
      
      removePlan: (id) => set((state) => ({
        quote: {
          ...state.quote,
          uploadedPlans: state.quote.uploadedPlans.filter(p => p.id !== id),
          updatedAt: Date.now()
        }
      })),
      
      resetQuote: () => set(() => ({
        quote: { ...initialQuoteState, quoteId: generateId(), createdAt: Date.now(), updatedAt: Date.now() }
      })),
    }),
    {
      name: 'govee-quote-storage',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        quote: {
          ...state.quote,
          contact: {} // Strip sensitive information before saving to localStorage
        } 
      }),
      migrate: (persistedState: unknown, version: number) => {
        if (version === 0) {
          // Future migrations
        }
        return persistedState as QuoteStore;
      },
      onRehydrateStorage: () => (state) => {
        if (state) {
          const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
          if (Date.now() - state.quote.updatedAt > TWENTY_FOUR_HOURS) {
            state.resetQuote();
          }
        }
      }
    }
  )
);
