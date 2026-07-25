"use client";

import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { env } from '@/lib/env';

interface PlaceResult {
  address: string;
  streetNumber: string;
  streetName: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  lat: number;
  lng: number;
  placeId: string;
}

interface AddressAutocompleteProps {
  onPlaceSelected: (place: PlaceResult) => void;
  defaultValue?: string;
}

export function AddressAutocomplete({ onPlaceSelected, defaultValue = '' }: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load script if not present
    if (!window.google && !document.getElementById('google-maps-script')) {
      const script = document.createElement('script');
      script.id = 'google-maps-script';
      // Use the browser key
      script.src = `https://maps.googleapis.com/maps/api/js?key=${env.NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY}&libraries=places&v=weekly`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
      
      script.onload = initAutocomplete;
    } else if (window.google) {
      initAutocomplete();
    }

    function initAutocomplete() {
      if (!inputRef.current || !window.google) return;
      
      const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
        componentRestrictions: { country: 'us' },
        fields: ['formatted_address', 'address_components', 'geometry', 'place_id'],
        types: ['address'],
      });

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        
        if (!place.geometry || !place.geometry.location || !place.address_components) {
          setError("Please select a valid address from the dropdown.");
          return;
        }
        
        setError(null);
        
        const addressData: PlaceResult = {
          address: place.formatted_address || '',
          streetNumber: '',
          streetName: '',
          city: '',
          state: '',
          zipCode: '',
          country: '',
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
          placeId: place.place_id || '',
        };
        
        place.address_components.forEach((component: any) => {
          const types = component.types;
          if (types.includes('street_number')) addressData.streetNumber = component.long_name;
          if (types.includes('route')) addressData.streetName = component.long_name;
          if (types.includes('locality')) addressData.city = component.long_name;
          if (types.includes('administrative_area_level_1')) addressData.state = component.short_name;
          if (types.includes('postal_code')) addressData.zipCode = component.long_name;
          if (types.includes('country')) addressData.country = component.short_name;
        });
        
        if (addressData.country !== 'US') {
          setError("Only US addresses are supported.");
          return;
        }

        onPlaceSelected(addressData);
      });
    }
  }, [onPlaceSelected]);

  return (
    <div className="space-y-2">
      <Input
        ref={inputRef}
        type="text"
        placeholder="Enter your street address"
        defaultValue={defaultValue}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
