"use client";

import { Suspense, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuoteStore } from '@/store/quoteStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { recommendKits } from '@/config/products';
import { AlertCircle, CheckCircle2, ChevronLeft, Info, RefreshCcw } from 'lucide-react';
import Link from 'next/link';

import { useSearchParams } from 'next/navigation';

function ResultContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const refNumber = searchParams.get('ref');
  
  const { quote, resetQuote } = useQuoteStore();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsClient(true);
  }, []);

  if (!isClient) return null;

  const { status, priceRange, estimatedLinearFeet, method } = quote;

  const handleReset = () => {
    resetQuote();
    router.push('/estimate');
  };

  const isCalculated = status !== 'incomplete' && priceRange && estimatedLinearFeet !== null && priceRange.min > 0;
  const isSubmitted = status === 'review_submitted' || status === 'expert_confirmed';

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300 pb-20">
      <div className="flex items-center justify-between">
        {!isSubmitted && (
          <Button variant="ghost" size="sm" asChild className="-ml-4 text-slate-500 hover:text-slate-900">
            <Link href={`/estimate/${method === 'measurements' ? 'measurements' : method === 'quick' ? 'quick' : 'map'}`}>
              <ChevronLeft className="w-5 h-5 mr-1" />
              Back
            </Link>
          </Button>
        )}
        <div className="flex items-center gap-2 text-sm font-medium text-slate-500 ml-auto">
          {isSubmitted ? "Complete" : "Step 3 of 3"}
        </div>
      </div>

      <div className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          {isSubmitted ? "Review Requested" : "Your Estimate Result"}
        </h1>
        <p className="text-slate-500 text-lg">
          {isSubmitted ? "We've received your property details." : `Based on the ${method === 'measurements' ? 'measurements' : method === 'map' ? 'satellite measurements' : 'details'} you provided.`}
        </p>
      </div>

      {isSubmitted ? (
        <Card className="border-emerald-200 bg-emerald-50 shadow-sm overflow-hidden">
          <div className="bg-emerald-600 h-2 w-full" />
          <CardHeader className="pt-8">
            <div className="flex items-center space-x-3 text-emerald-700">
              <CheckCircle2 className="w-8 h-8" />
              <CardTitle className="text-2xl">Request Submitted Successfully</CardTitle>
            </div>
            <CardDescription className="text-emerald-700/80 mt-2 text-base">
              Your reference number is <strong className="text-emerald-900 font-bold bg-emerald-100 px-2 py-1 rounded">{refNumber || 'Pending'}</strong>.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-emerald-900 space-y-6">
            <p className="text-lg">
              Thank you for submitting your information. Our experts will review your details, photos, or plans and provide a confirmed, final estimate.
            </p>
            <div className="bg-white p-6 rounded-xl border border-emerald-100 shadow-sm">
              <h4 className="font-semibold text-lg mb-4 flex items-center">
                <Info className="w-5 h-5 mr-2 text-emerald-600" />
                What happens next?
              </h4>
              <ul className="space-y-3 text-slate-700">
                <li className="flex items-start">
                  <span className="bg-emerald-100 text-emerald-700 w-6 h-6 rounded-full flex items-center justify-center font-bold text-sm mr-3 shrink-0 mt-0.5">1</span>
                  <span>An expert will review your property within 1-2 business days.</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-emerald-100 text-emerald-700 w-6 h-6 rounded-full flex items-center justify-center font-bold text-sm mr-3 shrink-0 mt-0.5">2</span>
                  <span>We may reach out if we need further clarification.</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-emerald-100 text-emerald-700 w-6 h-6 rounded-full flex items-center justify-center font-bold text-sm mr-3 shrink-0 mt-0.5">3</span>
                  <span>You will receive an email confirmation with the final quote.</span>
                </li>
              </ul>
            </div>
          </CardContent>
          <CardFooter className="pb-8">
            <Button onClick={handleReset} variant="outline" className="w-full sm:w-auto border-emerald-300 text-emerald-800 hover:bg-emerald-100 bg-white">
              <RefreshCcw className="w-4 h-4 mr-2" />
              Start New Estimate
            </Button>
          </CardFooter>
        </Card>
      ) : !isCalculated ? (
        <Card className="border-orange-200 bg-orange-50 overflow-hidden">
          <div className="bg-orange-500 h-2 w-full" />
          <CardHeader className="pt-8">
            <div className="flex items-center space-x-3 text-orange-700">
              <AlertCircle className="w-8 h-8" />
              <CardTitle className="text-2xl">More Information Needed</CardTitle>
            </div>
            <CardDescription className="text-orange-700/80 text-base">
              We couldn't generate a preliminary estimate with the provided details.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-orange-900 text-base">
            Please ensure you have entered valid positive measurements or selected appropriate property details. If you're unsure, you can upload photos or request an expert review.
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row gap-3 pb-8">
            <Button asChild className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700 text-white font-medium px-6 py-6 text-lg">
              <Link href="/estimate/expert-review">
                Request Expert Review
              </Link>
            </Button>
            <Button onClick={handleReset} variant="outline" className="w-full sm:w-auto border-orange-300 text-orange-800 hover:bg-orange-100 bg-white px-6 py-6 text-lg">
              Start Over
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-8 space-y-8">
            {/* High Contrast Header Card */}
            <Card className="border-slate-800 shadow-xl overflow-hidden bg-slate-900 text-white">
              <CardContent className="p-8 sm:p-10">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                  <div>
                    <div className="text-slate-400 font-medium uppercase tracking-wider text-sm mb-2">Preliminary Estimate</div>
                    <div className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
                      ${priceRange.min.toLocaleString()} – ${priceRange.max.toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-slate-800/80 rounded-xl p-4 sm:p-6 border border-slate-700/50 w-full sm:w-auto">
                    <div className="text-slate-400 font-medium uppercase tracking-wider text-xs mb-1">Total Linear Feet</div>
                    <div className="text-3xl font-bold text-blue-400">
                      {estimatedLinearFeet} <span className="text-lg font-medium text-slate-500">ft</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Breakdown Section */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-900">Estimate Breakdown</h2>
              
              {quote.measurementSections && quote.measurementSections.length > 0 && (
                <Card className="border-slate-200 shadow-sm overflow-hidden">
                  <div className="bg-slate-50 px-6 py-4 border-b border-slate-100">
                    <h3 className="font-semibold text-slate-900">Measured Sections</h3>
                  </div>
                  <CardContent className="p-0">
                    <div className="divide-y divide-slate-100">
                      {quote.measurementSections.map((sec) => (
                        <div key={sec.id} className="flex justify-between items-center p-4 sm:px-6">
                          <span className="text-slate-700 font-medium">{sec.name}</span>
                          <span className="font-semibold text-slate-900 bg-slate-100 px-3 py-1 rounded-full text-sm">{sec.lengthFeet} ft</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {quote.recommendedKits && quote.recommendedKits.length > 0 && (
                <Card className="border-slate-200 shadow-sm overflow-hidden">
                  <div className="bg-slate-50 px-6 py-4 border-b border-slate-100">
                    <h3 className="font-semibold text-slate-900">Required Materials</h3>
                  </div>
                  <CardContent className="p-0">
                    <div className="divide-y divide-slate-100">
                      {quote.recommendedKits.map((product, i) => (
                        <div key={`${product.id}-${i}`} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:px-6 gap-2">
                          <div className="flex items-center gap-4">
                            <div className="bg-blue-50 text-blue-700 font-bold w-10 h-10 rounded-lg flex items-center justify-center shrink-0">
                              x{product.quantity}
                            </div>
                            <div>
                              <div className="font-medium text-slate-900">{product.name}</div>
                              <div className="text-sm text-slate-500">{product.length_feet}ft Kit</div>
                            </div>
                          </div>
                          <div className="font-semibold text-slate-700 sm:text-right">
                            ${(product.price * product.quantity).toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {quote.adjustments && quote.adjustments.length > 0 && (
                <Card className="border-slate-200 shadow-sm overflow-hidden">
                  <div className="bg-slate-50 px-6 py-4 border-b border-slate-100">
                    <h3 className="font-semibold text-slate-900">Installation Factors</h3>
                  </div>
                  <CardContent className="p-0">
                    <div className="divide-y divide-slate-100">
                      {quote.adjustments.map((adj, i) => (
                        <div key={i} className="flex justify-between items-center p-4 sm:px-6">
                          <span className="text-slate-700">{adj.name}</span>
                          <span className="font-medium text-slate-900">
                            {adj.amount ? `$${adj.amount.toFixed(2)}` : `x${adj.multiplier}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          <div className="lg:col-span-4">
            <Card className="border-blue-200 shadow-md bg-blue-50 sticky top-6">
              <CardHeader>
                <CardTitle className="text-xl text-blue-900">Ready to move forward?</CardTitle>
                <CardDescription className="text-blue-700 text-base mt-2">
                  Have our experts review your details to finalize this quote and schedule installation.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-center text-blue-800 text-sm">
                    <CheckCircle2 className="w-5 h-5 mr-3 text-blue-600 shrink-0" />
                    Free expert verification
                  </li>
                  <li className="flex items-center text-blue-800 text-sm">
                    <CheckCircle2 className="w-5 h-5 mr-3 text-blue-600 shrink-0" />
                    Exact pricing guarantee
                  </li>
                  <li className="flex items-center text-blue-800 text-sm">
                    <CheckCircle2 className="w-5 h-5 mr-3 text-blue-600 shrink-0" />
                    No obligation to purchase
                  </li>
                </ul>
              </CardContent>
              <CardFooter className="flex flex-col gap-3">
                <Button asChild className="w-full py-6 text-base font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                  <Link href="/estimate/expert-review">
                    Request Final Quote
                  </Link>
                </Button>
                <Button onClick={handleReset} variant="ghost" className="w-full text-slate-500 hover:text-slate-800">
                  Recalculate Estimate
                </Button>
              </CardFooter>
            </Card>
            
            <div className="text-xs text-slate-400 mt-6 text-center px-4">
              This is a preliminary estimate. Final prices may vary slightly based on property inspection and actual physical measurement.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ResultPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div></div>}>
      <ResultContent />
    </Suspense>
  );
}
