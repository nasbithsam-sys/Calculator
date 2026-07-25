"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useQuoteStore } from '@/store/quoteStore';
import { ChevronLeft, Loader2, TriangleAlert, Map as MapIcon, ArrowRight, UserCheck } from 'lucide-react';
import Link from 'next/link';
import { MapEditor, MapSection } from '@/components/MapEditor';
import { calculateEstimate } from '@/app/actions/calculate';

export default function MapPage() {
  const router = useRouter();
  const { setMethod, setStatus, quote, setFeet, setMeasurementSections, setCalculationResult } = useQuoteStore();
  const [isClient, setIsClient] = useState(false);
  const [sections, setSections] = useState<MapSection[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setMethod('map');
  }, [setMethod]);

  const onCalculate = async () => {
    if (sections.length === 0) return;

    // Check for sloped peaks that might need manual adjustment / expert review
    const hasSlopedPeaks = sections.some(s => s.type === 'sloped_peak');
    
    setIsCalculating(true);
    try {
      const totalFeet = sections.reduce((sum, s) => sum + s.lengthFeet, 0);
      const measuredSections = sections.map((s, i) => ({
        id: s.id,
        name: s.name,
        lengthFeet: s.lengthFeet,
        order: i,
        coordinates: s.path,
        type: s.type
      }));

      const result = await calculateEstimate({
        coverage: "measured",
        stories: quote.property.stories === '4+' ? 4 : Number(quote.property.stories || 1),
        roofComplexity: quote.property.roofComplexity || "average",
        peaks: sections.filter(s => s.type === 'sloped_peak').length,
        measuredSections: measuredSections
      });
      
      if (!result.success) {
        alert(result.error);
        return;
      }

      setMeasurementSections(measuredSections);
      setFeet(totalFeet, 'customer');
      setFeet(result.estimatedLinearFeet, 'estimated');
      setCalculationResult(result as any);
      
      if (hasSlopedPeaks) {
        setStatus('preliminary', 'medium');
      } else {
        setStatus('ready-for-review', 'high'); 
      }

      router.push('/estimate/result');
    } finally {
      setIsCalculating(false);
    }
  };

  const onExpertReview = () => {
    const measuredSections = sections.map((s, i) => ({
      id: s.id,
      name: s.name,
      lengthFeet: s.lengthFeet,
      order: i,
      coordinates: s.path,
      type: s.type
    }));
    setMeasurementSections(measuredSections);
    setStatus('ready-for-review', 'not-calculated');
    router.push('/estimate/expert-review');
  };

  if (!isClient) return null;

  const hasSlopedPeaks = sections.some(s => s.type === 'sloped_peak');

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Button variant="ghost" size="sm" asChild className="-ml-4 text-slate-500 hover:text-slate-900">
          <Link href="/estimate/address">
            <ChevronLeft className="w-5 h-5 mr-1" />
            Back
          </Link>
        </Button>
        <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
          Step 2 of 3
        </div>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Mark Your Roofline</h1>
        <p className="text-slate-500">Draw the lighting sections on the aerial map of {quote.property?.address || 'your property'}.</p>
        
        {/* Progress Bar */}
        <div className="w-full bg-slate-200 h-1.5 rounded-full mt-6 overflow-hidden">
          <div 
            className="bg-blue-600 h-full rounded-full transition-all duration-300 ease-out w-2/3"
          />
        </div>
      </div>

      <Card className="border-slate-200 shadow-sm border-t-4 border-t-blue-600 overflow-hidden">
        <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
          <CardTitle className="flex items-center text-lg">
            <MapIcon className="w-5 h-5 mr-2 text-blue-600" />
            Satellite Measurement Tool
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 space-y-4">
          
          <MapEditor 
            initialCenter={quote.property?.lat && quote.property?.lng 
              ? { lat: quote.property.lat, lng: quote.property.lng }
              : { lat: 39.8283, lng: -98.5795 }} // Default to US center if not provided
            onSectionsChange={setSections}
          />

          {hasSlopedPeaks && (
            <div className="bg-orange-50 border border-orange-200 text-orange-800 p-4 rounded-xl flex gap-3 text-sm mx-4 sm:mx-0 shadow-sm">
              <TriangleAlert className="w-6 h-6 shrink-0 text-orange-600 mt-0.5" />
              <div>
                <p className="font-semibold mb-1 text-base text-orange-900">Sloped Peaks Detected</p>
                <p className="text-orange-700">
                  Satellite imagery only measures flat, horizontal distances. Sloped peaks require geometric adjustment to calculate the true physical length. We recommend requesting an Expert Review to finalize this estimate.
                </p>
              </div>
            </div>
          )}

        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-end border-t border-slate-100 p-4 sm:p-6 gap-3 bg-slate-50">
          <Button onClick={onExpertReview} variant="outline" className="w-full sm:w-auto bg-white border-slate-200 hover:bg-slate-50 hover:text-slate-900 shadow-sm text-slate-700 font-medium py-6 px-6">
            <UserCheck className="w-4 h-4 mr-2 text-slate-500" />
            Send for Expert Review
          </Button>
          <Button 
            onClick={onCalculate} 
            className="w-full sm:w-auto py-6 px-10 text-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all"
            disabled={sections.length === 0 || isCalculating}
          >
            {isCalculating && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
            Calculate Estimate
            {!isCalculating && <ArrowRight className="w-5 h-5 ml-2" />}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
