"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useQuoteStore } from '@/store/quoteStore';
import { ChevronLeft, Loader2, TriangleAlert, ArrowRight, UserCheck } from 'lucide-react';
import Link from 'next/link';
import { MapEditor, MapSection } from '@/components/MapEditor';
import { calculateEstimate } from '@/app/actions/calculate';

import { Input } from '@/components/ui/input';

export default function MapPage() {
  const router = useRouter();
  const { setMethod, setStatus, quote, setFeet, setMeasurementSections, setCalculationResult } = useQuoteStore();
  const [isClient, setIsClient] = useState(false);
  const [sections, setSections] = useState<MapSection[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [peakRises, setPeakRises] = useState<Record<string, number>>({});

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsClient(true);
    setMethod('map');
  }, [setMethod]);

  const onCalculate = async () => {
    if (sections.length === 0) return;

    setIsCalculating(true);
    setError(null);
    try {
      const measuredSections = sections.map((s, i) => {
        let lengthFeet = s.lengthFeet;
        let measurementStatus: "supported" | "unsupported" = s.type === "horizontal_eave" || s.type === "horizontal_perimeter" ? "supported" : "unsupported";
        if (s.type === 'sloped_peak') {
          const rise = peakRises[s.id] || 0;
          if (rise > 0) {
            lengthFeet = 2 * Math.sqrt(Math.pow(s.lengthFeet / 2, 2) + Math.pow(rise, 2));
            measurementStatus = "supported";
          }
        }
        return {
          id: s.id,
          name: s.name,
          lengthFeet: lengthFeet,
          order: i,
          coordinates: s.path,
          type: s.type,
          measurementStatus,
        };
      });

      const totalFeet = measuredSections
        .filter((section) => section.measurementStatus === "supported")
        .reduce((sum, section) => sum + section.lengthFeet, 0);

      const result = await calculateEstimate({
        coverage: "measured",
        stories: quote.property.stories === '4+' ? 4 : Number(quote.property.stories || 1),
        roofComplexity: quote.property.roofComplexity || "average",
        peaks: sections.filter(s => s.type === 'sloped_peak').length,
        measuredSections: measuredSections
      });
      
      if (!result.success) {
        setError(result.error || "Unable to calculate estimate.");
        return;
      }

      setMeasurementSections(measuredSections);
      setFeet(totalFeet, 'customer');
      setFeet(result.estimatedLinearFeet, 'estimated');
      setCalculationResult(result);
      
      if (sections.some((section) => section.type !== "horizontal_eave" && section.type !== "horizontal_perimeter" && !peakRises[section.id])) {
        setStatus('preliminary', 'medium');
      } else {
        setStatus('ready-for-review', 'high'); 
      }

      router.push('/estimate/result');
    } catch {
      setError("An unexpected error occurred. Please try again.");
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

  const slopedPeaks = sections.filter(s => s.type === 'sloped_peak');
  const hasSlopedPeaks = slopedPeaks.length > 0;
  return (
    <div className="max-w-[1400px] mx-auto animate-in fade-in duration-300 pb-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Button variant="ghost" size="sm" asChild className="-ml-4 text-slate-500 hover:text-slate-900 focus-ring">
          <Link href="/estimate/address">
            <ChevronLeft className="w-5 h-5 mr-1" /> Back
          </Link>
        </Button>
      </div>

      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">Mark Your Roofline</h1>
          <p className="text-lg text-slate-600 font-medium">Draw lighting sections on the satellite map for <span className="font-bold text-slate-800">{quote.property?.address || 'your property'}</span>.</p>
        </div>
        
        {/* Actions for Desktop */}
        <div className="hidden md:flex items-center gap-3">
          <Button onClick={onExpertReview} variant="outline" className="bg-white border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-6 px-6">
            <UserCheck className="w-5 h-5 mr-2 text-slate-500" /> Let an Expert Do It
          </Button>
          <Button 
            onClick={onCalculate} 
            className="py-6 px-8 text-lg font-bold bg-primary hover:bg-primary/90 text-white shadow-md transition-transform active:scale-[0.98]"
            disabled={sections.length === 0 || isCalculating}
          >
            {isCalculating ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : 'Calculate Estimate'}
            {!isCalculating && <ArrowRight className="w-5 h-5 ml-2" />}
          </Button>
        </div>
      </div>

      {hasSlopedPeaks && (
        <div className="mb-6 bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-4 shadow-sm animate-in slide-in-from-top-2">
          <TriangleAlert className="w-6 h-6 shrink-0 text-amber-600 mt-0.5" />
          <div>
            <p className="font-bold text-amber-900 text-lg mb-1">Sloped Peaks Are Not Included in Authoritative Pricing</p>
            <p className="text-amber-800 font-medium leading-relaxed">
              Satellite imagery only measures horizontal width. Sloped peaks require geometric adjustment using the peak rise (height) to calculate the hypotenuse. We recommend requesting an Expert Review to finalize this estimate accurately.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 p-4 rounded-xl flex items-start gap-3 shadow-sm">
          <TriangleAlert className="w-6 h-6 shrink-0 text-red-600 mt-0.5" />
          <div className="text-sm font-bold text-red-800">{error}</div>
        </div>
      )}

      <div className="bg-white p-2 sm:p-4 rounded-3xl card-shadow border border-slate-200">
        <MapEditor 
          initialCenter={quote.property?.lat && quote.property?.lng 
            ? { lat: quote.property.lat, lng: quote.property.lng }
            : { lat: 39.8283, lng: -98.5795 }} // Default to US center
          onSectionsChange={setSections}
        />
      </div>
      
      {hasSlopedPeaks && (
        <div className="mt-8 bg-white p-6 sm:p-8 rounded-3xl card-shadow border border-slate-200">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Calculate Sloped Peaks</h2>
          <p className="text-slate-600 mb-6 font-medium">Enter the rise (height) for each peak to calculate the true length of the sloped roofline using the width drawn on the map.</p>
          <div className="space-y-4">
            {slopedPeaks.map(s => {
              const rise = peakRises[s.id] || 0;
              const width = s.lengthFeet;
              const trueLength = rise > 0 ? 2 * Math.sqrt(Math.pow(width / 2, 2) + Math.pow(rise, 2)) : width;
              return (
                <div key={s.id} className="flex flex-col sm:flex-row sm:items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex-1 font-bold text-slate-900 text-lg">{s.name}</div>
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Width</span>
                      <span className="text-slate-700 font-medium">{width.toFixed(1)} ft</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Rise</span>
                      <div className="relative">
                        <Input 
                          type="number" 
                          min={0}
                          placeholder="0"
                          value={peakRises[s.id] || ''}
                          onChange={(e) => setPeakRises(prev => ({ ...prev, [s.id]: Number(e.target.value) }))}
                          className="w-24 text-center font-bold"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col items-center ml-2 pl-4 border-l border-slate-200">
                      <span className="text-xs font-bold text-primary uppercase tracking-wider mb-1">True Length</span>
                      <span className="font-extrabold text-primary text-xl">{trueLength.toFixed(1)} ft</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Mobile Actions */}
      <div className="md:hidden mt-8 flex flex-col gap-3">
        <Button 
          onClick={onCalculate} 
          className="w-full py-7 text-lg font-bold bg-primary hover:bg-primary/90 text-white shadow-md active:scale-[0.98]"
          disabled={sections.length === 0 || isCalculating}
        >
          {isCalculating ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : 'Calculate Estimate'}
          {!isCalculating && <ArrowRight className="w-5 h-5 ml-2" />}
        </Button>
        <Button onClick={onExpertReview} variant="outline" className="w-full bg-white border-slate-200 text-slate-700 font-bold py-7">
          <UserCheck className="w-5 h-5 mr-2" /> Let an Expert Do It
        </Button>
      </div>

    </div>
  );
}
