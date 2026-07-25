"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useQuoteStore } from '@/store/quoteStore';
import { ChevronLeft, MapPin, CheckCircle2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { AddressAutocomplete } from '@/components/AddressAutocomplete';

export default function AddressPage() {
  const router = useRouter();
  const { setMethod, updateProperty, quote } = useQuoteStore();
  const [isClient, setIsClient] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<any>(null);

  useEffect(() => {
    setIsClient(true);
    setMethod('address');
  }, [setMethod]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlace) return;

    updateProperty({
      address: selectedPlace.address,
      zipCode: selectedPlace.zipCode,
      city: selectedPlace.city,
      state: selectedPlace.state,
      lat: selectedPlace.lat,
      lng: selectedPlace.lng,
      placeId: selectedPlace.placeId,
    });
    
    router.push('/estimate/map');
  };

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

        <form onSubmit={onSubmit} className="space-y-8">
          {!selectedPlace ? (
            <div className="space-y-4 animate-in fade-in duration-500">
              <label className="text-lg font-bold text-slate-900 block">Enter your US address</label>
              <AddressAutocomplete 
                onPlaceSelected={(place) => setSelectedPlace(place)}
                defaultValue={quote.property?.address || ''}
              />
              <p className="text-sm font-medium text-slate-500 pt-2">
                We use Google Maps to load the most up-to-date satellite view of your roof.
              </p>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-blue-50/50 border-2 border-blue-100 rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute right-0 top-0 w-32 h-32 bg-blue-100 rounded-full blur-3xl -mr-16 -mt-16 opacity-60 pointer-events-none" />
                
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="bg-emerald-500 p-1.5 rounded-full text-white shadow-sm">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <h3 className="font-extrabold text-slate-900 text-xl">Address Found</h3>
                  </div>
                  
                  <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm mb-6">
                    <div className="font-bold text-slate-900 text-xl mb-1">{selectedPlace.address}</div>
                    <div className="text-slate-600 font-medium">
                      {selectedPlace.city}, {selectedPlace.state} {selectedPlace.zipCode}
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button type="button" variant="outline" onClick={() => setSelectedPlace(null)} className="w-full sm:w-auto bg-white hover:bg-slate-50 border-slate-200 text-slate-700 font-bold py-6 px-6 rounded-xl">
                      Change Address
                    </Button>
                    <Button type="submit" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white font-bold py-6 shadow-md transition-transform active:scale-[0.98] flex-1 rounded-xl">
                      Confirm Address
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
