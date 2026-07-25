"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useQuoteStore } from '@/store/quoteStore';
import { ChevronLeft, Loader2, TriangleAlert } from 'lucide-react';
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
        // If sloped peaks exist, we still calculate but downgrade confidence and suggest review
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
    <div className="space-y-6 animate-in fade-in duration-300 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/estimate/address">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Link>
        </Button>
        <div className="w-1/3">
          <Progress value={66} className="h-2" />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mark Your Roofline</CardTitle>
          <CardDescription>
            Draw the lighting sections on the aerial map of {quote.property?.address || 'your property'}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          
          <MapEditor 
            initialCenter={quote.property?.lat && quote.property?.lng 
              ? { lat: quote.property.lat, lng: quote.property.lng }
              : { lat: 39.8283, lng: -98.5795 }} // Default to US center if not provided
            onSectionsChange={setSections}
          />

          {hasSlopedPeaks && (
            <div className="bg-orange-50 border border-orange-200 text-orange-800 p-4 rounded-lg flex gap-3 text-sm">
              <TriangleAlert className="w-5 h-5 shrink-0 text-orange-600 mt-0.5" />
              <div>
                <p className="font-semibold mb-1">Sloped Peaks Detected</p>
                <p>
                  Satellite imagery only measures flat, horizontal distances. Sloped peaks require geometric adjustment to calculate the true physical length. We recommend requesting an Expert Review to finalize this estimate.
                </p>
              </div>
            </div>
          )}

        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-end border-t border-slate-100 pt-6 gap-3">
          <Button onClick={onExpertReview} variant="outline" className="w-full sm:w-auto text-slate-700">
            Send for Expert Review
          </Button>
          <Button 
            onClick={onCalculate} 
            className="w-full sm:w-auto"
            disabled={sections.length === 0 || isCalculating}
          >
            {isCalculating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Calculate Estimate
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
