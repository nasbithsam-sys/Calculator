"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300 pb-20">
      {/* Header and Progress */}
      <div className="flex items-center justify-between mb-8">
        <Button variant="ghost" size="sm" asChild className="-ml-4 text-slate-500 hover:text-slate-900">
          <Link href="/estimate">
            <ChevronLeft className="w-5 h-5 mr-1" />
            Back
          </Link>
        </Button>
        <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
          Step 1 of 3
        </div>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Locate Your Property</h1>
        <p className="text-slate-500">Start with your address to load high-resolution satellite imagery.</p>
        
        {/* Progress Bar */}
        <div className="w-full bg-slate-200 h-1.5 rounded-full mt-6 overflow-hidden">
          <div 
            className="bg-blue-600 h-full rounded-full transition-all duration-300 ease-out w-1/3"
          />
        </div>
      </div>

      <Card className="border-slate-200 shadow-sm border-t-4 border-t-blue-600 overflow-hidden">
        <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
          <CardTitle className="flex items-center text-lg">
            <MapPin className="w-5 h-5 mr-2 text-blue-600" />
            Property Address
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={onSubmit} className="space-y-6">
            {!selectedPlace ? (
              <div className="space-y-4">
                <label className="text-base font-semibold leading-none">Enter your US address</label>
                <AddressAutocomplete 
                  onPlaceSelected={(place) => setSelectedPlace(place)}
                  defaultValue={quote.property?.address || ''}
                />
              </div>
            ) : (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 relative overflow-hidden">
                  <div className="absolute right-0 top-0 w-32 h-32 bg-blue-100 rounded-full blur-3xl -mr-16 -mt-16 opacity-50" />
                  
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-white p-1 rounded-full shadow-sm text-green-500">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <h3 className="font-semibold text-blue-900 text-lg">Address Found</h3>
                    </div>
                    
                    <div className="bg-white rounded-lg p-4 border border-blue-100 shadow-sm mb-6">
                      <div className="font-semibold text-slate-900 text-lg">{selectedPlace.address}</div>
                      <div className="text-slate-600">
                        {selectedPlace.city}, {selectedPlace.state} {selectedPlace.zipCode}
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button type="button" variant="outline" onClick={() => setSelectedPlace(null)} className="w-full sm:w-auto bg-white hover:bg-slate-50">
                        Change Address
                      </Button>
                      <Button type="submit" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 shadow-sm flex-1">
                        This is my property
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
