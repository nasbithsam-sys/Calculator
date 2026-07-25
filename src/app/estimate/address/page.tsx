"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useQuoteStore } from '@/store/quoteStore';
import { ChevronLeft } from 'lucide-react';
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
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/estimate">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Link>
        </Button>
        <div className="w-1/3">
          <Progress value={33} className="h-2" />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Enter Your Address</CardTitle>
          <CardDescription>
            Provide your address so we can locate your property on the map.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">Street Address</label>
              <AddressAutocomplete 
                onPlaceSelected={(place) => setSelectedPlace(place)}
                defaultValue={quote.property?.address || ''}
              />
            </div>
            
            <div className="flex justify-end pt-4 border-t border-slate-100">
              <Button type="submit" className="w-full sm:w-auto" disabled={!selectedPlace}>
                Continue to Map
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
