"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useQuoteStore } from '@/store/quoteStore';
import { ChevronLeft, MapPin } from 'lucide-react';
import Link from 'next/link';
import { AddressAutocomplete } from '@/components/AddressAutocomplete';

export default function AddressPage() {
  const router = useRouter();
  const { setMethod, updateProperty, quote } = useQuoteStore();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsClient(true);
    setMethod('address');
  }, [setMethod]);

  if (!isClient) return null;

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in duration-300 pb-20">
      
      {/* Header and Progress */}
      <div className="flex items-center justify-between mb-10">
        <Button variant="ghost" size="sm" asChild className="-ml-4 text-slate-500 hover:text-slate-900 focus-ring">
          <Link href="/estimate">
            <ChevronLeft className="w-5 h-5 mr-1" /> Back
          </Link>
        </Button>
        <div className="flex items-center gap-2 text-sm font-bold text-primary">
          Step 1 of 3
        </div>
      </div>

      <div className="mb-10 text-center space-y-3">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Locate Your Property</h1>
        <p className="text-lg text-slate-600 font-medium">Start with your address to load high-resolution satellite imagery.</p>
        
        {/* Modern Stepper */}
        <div className="w-full bg-slate-200 h-2 rounded-full mt-8 overflow-hidden">
          <div className="bg-primary h-full rounded-full transition-all duration-500 ease-out w-1/3" />
        </div>
      </div>

      <div className="bg-white p-6 sm:p-10 rounded-3xl card-shadow">
        
        <div className="flex items-center gap-3 border-b border-slate-100 pb-6 mb-8">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><MapPin className="w-6 h-6" /></div>
          <h2 className="text-2xl font-bold text-slate-900">Property Address</h2>
        </div>

        <div className="space-y-8">
          <div className="space-y-4 animate-in fade-in duration-500">
            <label className="text-lg font-bold text-slate-900 block">Enter your US address</label>
            <AddressAutocomplete 
              onPlaceSelected={(place) => {
                updateProperty({
                  address: place.address,
                  zipCode: place.zipCode,
                  city: place.city,
                  state: place.state,
                  lat: place.lat,
                  lng: place.lng,
                  placeId: place.placeId,
                });
                router.push('/estimate/map');
              }}
              defaultValue={quote.property?.address || ''}
            />
            <p className="text-sm font-medium text-slate-500 pt-2">
              Your address locates the property. You will confirm the roofline sections on the next step. We use Google Maps to load the most up-to-date satellite view of your roof.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
