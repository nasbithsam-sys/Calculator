import { env } from '../env';

export interface AddressSuggestion {
  text: string;
  id: string;
}

export interface GeocodedAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
  lat: number;
  lng: number;
  country: string;
}

// In production, this would call Mapbox or Google Maps Places API.
export async function searchAddress(query: string): Promise<AddressSuggestion[]> {
  if (!query) return [];
  
  if (!env.NEXT_PUBLIC_MAPBOX_TOKEN) {
    // Mock behavior while pending credentials
    return [
      { text: `${query} (Mock API Pending Keys)`, id: 'mock-1' },
      { text: `123 Main St, Mock City, ST`, id: 'mock-2' }
    ];
  }
  
  // Real implementation will go here
  return [];
}

export async function geocodeAddress(id: string): Promise<GeocodedAddress | null> {
  if (!env.NEXT_PUBLIC_MAPBOX_TOKEN) {
    // Mock behavior while pending credentials
    return {
      street: '123 Main St',
      city: 'Mock City',
      state: 'ST',
      zip: '12345',
      lat: 40.7128,
      lng: -74.0060,
      country: 'US'
    };
  }
  
  // Real implementation will go here
  return null;
}
