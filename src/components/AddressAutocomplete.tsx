"use client";

import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { env } from '@/lib/env';
import { Navigation, Loader2, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  const [isLocating, setIsLocating] = useState(false);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);

  useEffect(() => {
    if (!window.google && !document.getElementById('google-maps-script')) {
      const script = document.createElement('script');
      script.id = 'google-maps-script';
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
      
      geocoderRef.current = new window.google.maps.Geocoder();

      const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
        componentRestrictions: { country: 'us' },
        fields: ['formatted_address', 'address_components', 'geometry', 'place_id'],
        types: ['address'],
      });

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        handlePlaceResult(place);
      });
    }
  }, []);

  const handlePlaceResult = (place: google.maps.places.PlaceResult) => {
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
  };

  const locateMe = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }

    setIsLocating(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!geocoderRef.current) {
          setIsLocating(false);
          setError("Google Maps is not loaded yet. Please try again.");
          return;
        }

        const latlng = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        geocoderRef.current.geocode({ location: latlng }, (results, status) => {
          setIsLocating(false);
          if (status === "OK" && results && results[0]) {
            const place = results[0];
            
            // For reverse geocoding, we might not get a perfect "street address" match first,
            // so we find the first one that is a street address or premise
            const bestMatch = results.find(r => r.types.includes('street_address') || r.types.includes('premise')) || place;
            
            if (inputRef.current) {
              inputRef.current.value = bestMatch.formatted_address;
            }
            handlePlaceResult(bestMatch);
          } else {
            setError("Could not find address for your current location.");
          }
        });
      },
      (err) => {
        setIsLocating(false);
        setError("Location access denied or unavailable.");
      },
      { timeout: 10000 }
    );
  };

  return (
    <div className="space-y-3">
      <div className="relative flex items-center shadow-sm rounded-2xl overflow-hidden bg-white border border-slate-300 focus-within:ring-2 focus-within:ring-primary focus-within:border-primary transition-all">
        <div className="pl-5 pr-2 text-slate-400">
          <MapPin className="w-6 h-6" />
        </div>
        <input
          ref={inputRef}
          type="text"
          placeholder="Enter your street address"
          defaultValue={defaultValue}
          className="flex-1 py-6 pr-4 text-xl font-medium outline-none placeholder:text-slate-400 text-slate-900 bg-transparent w-full"
        />
        <Button 
          type="button" 
          variant="ghost" 
          onClick={locateMe}
          disabled={isLocating}
          className="mr-3 h-10 px-4 font-bold text-primary hover:text-primary hover:bg-primary/10 rounded-xl"
        >
          {isLocating ? (
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          ) : (
            <Navigation className="w-5 h-5 mr-2" />
          )}
          Locate Me
        </Button>
      </div>
      {error && (
        <div className="text-sm font-bold text-destructive bg-red-50 p-3 rounded-lg border border-red-100 animate-in fade-in">
          {error}
        </div>
      )}
    </div>
  );
}
