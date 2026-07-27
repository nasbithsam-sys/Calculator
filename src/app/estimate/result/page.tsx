"use client";

import { Suspense, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuoteStore } from '@/store/quoteStore';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2, ChevronLeft, Info, RefreshCcw, ArrowRight, ShieldCheck, Tag, Zap } from 'lucide-react';
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
    <div className="max-w-[1200px] mx-auto animate-in fade-in duration-300 pb-20 px-4 sm:px-6">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        {!isSubmitted ? (
          <Button variant="ghost" size="sm" asChild className="-ml-4 text-slate-500 hover:text-slate-900 focus-ring">
            <Link href={`/estimate/${method === 'measurements' ? 'measurements' : method === 'quick' ? 'quick' : 'map'}`}>
              <ChevronLeft className="w-5 h-5 mr-1" /> Back
            </Link>
          </Button>
        ) : (
          <div /> // Spacer
        )}
      </div>

      {isSubmitted ? (
        // Submitted State
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Request Received!</h1>
            <p className="text-lg text-slate-600 font-medium">
              We have received your property details. Our experts are on it.
            </p>
          </div>

          <div className="bg-white p-8 rounded-3xl card-shadow border border-slate-200">
            <div className="text-center mb-8 pb-8 border-b border-slate-100">
              <div className="text-slate-500 font-bold uppercase tracking-widest text-sm mb-2">Your Reference Number</div>
              <div className="text-3xl font-black text-emerald-600 tracking-widest font-mono bg-emerald-50 inline-block px-6 py-2 rounded-xl">
                {refNumber || 'PENDING'}
              </div>
            </div>

            <h3 className="font-bold text-xl text-slate-900 mb-6 flex items-center gap-2">
              <Info className="w-6 h-6 text-primary" /> What happens next?
            </h3>
            
            <ul className="space-y-6">
              <li className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0">1</div>
                <div>
                  <h4 className="font-bold text-slate-900">Expert Review</h4>
                  <p className="text-slate-600 font-medium mt-1">Our designers will review your property details and create a custom lighting layout.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0">2</div>
                <div>
                  <h4 className="font-bold text-slate-900">Estimator Follow-up</h4>
                  <p className="text-slate-600 font-medium mt-1">An estimator will review your submission and contact you using your selected method.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0">3</div>
                <div>
                  <h4 className="font-bold text-slate-900">Schedule Installation</h4>
                  <p className="text-slate-600 font-medium mt-1">Once approved, you can book your preferred installation date.</p>
                </div>
              </li>
            </ul>
          </div>

          <div className="text-center">
            <Button onClick={handleReset} variant="outline" className="py-6 px-8 text-lg font-bold border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-xl">
              <RefreshCcw className="w-5 h-5 mr-2" /> Start New Estimate
            </Button>
          </div>
        </div>
      ) : !isCalculated ? (
        // Error State
        <div className="max-w-2xl mx-auto space-y-8 text-center pt-10">
          <div className="w-20 h-20 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
            <AlertCircle className="w-10 h-10" />
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">More Information Needed</h1>
          <p className="text-lg text-slate-600 font-medium max-w-lg mx-auto">
            We couldn&apos;t generate an automatic estimate with the provided details. 
            Please request a manual review from our experts.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
            <Button asChild className="w-full sm:w-auto py-7 px-8 text-lg font-bold bg-primary hover:bg-primary/90 text-white shadow-md active:scale-[0.98] rounded-xl">
              <Link href="/estimate/expert-review">
                Request Expert Review <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button onClick={handleReset} variant="outline" className="w-full sm:w-auto py-7 px-8 text-lg font-bold border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl">
              Start Over
            </Button>
          </div>
        </div>
      ) : (
        // Result State
        <div className="space-y-10">
          
          <div className="text-center space-y-3">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">Your Estimate</h1>
            <p className="text-lg text-slate-600 font-medium">Based on your provided measurements and property details.</p>
          </div>

          <div className="grid lg:grid-cols-[1fr_400px] gap-8">
            
            {/* Left Column: Breakdown */}
            <div className="space-y-8">
              
              {/* The Big Number */}
              <div className="bg-slate-950 text-white p-8 sm:p-12 rounded-3xl card-shadow relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
                
                <div className="flex flex-col sm:flex-row justify-between items-start gap-8 relative z-10">
                  <div>
                    <div className="text-slate-400 font-bold uppercase tracking-widest text-sm mb-3">Preliminary Quote</div>
                    <div className="text-5xl sm:text-6xl font-black tracking-tight flex items-baseline gap-2">
                      ${priceRange.min.toLocaleString()} 
                      <span className="text-3xl text-slate-500 font-bold">–</span> 
                      ${priceRange.max.toLocaleString()}
                    </div>
                  </div>
                  
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 shrink-0 w-full sm:w-auto text-center sm:text-left">
                    <div className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-2">Supported Installation</div>
                    <div className="text-4xl font-bold text-white flex items-baseline justify-center sm:justify-start gap-1">
                      {quote.supportedInstallationFeet ?? estimatedLinearFeet} <span className="text-xl text-slate-400">ft</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Breakdowns */}
              <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 card-shadow space-y-10">
                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                  <Tag className="w-6 h-6 text-primary" /> Estimate Details
                </h2>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    ["Supported installation", quote.supportedInstallationFeet ?? estimatedLinearFeet],
                    ["Recommended purchasing", quote.recommendedPurchasingFeet],
                    ["Total supplied kits", quote.totalSuppliedKitFeet],
                    ["Extra supplied", quote.excessKitFeet],
                  ].map(([label, value]) => (
                    <div key={label} className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</div>
                      <div className="text-2xl font-extrabold text-slate-900 mt-1">
                        {typeof value === "number" ? value : 0} <span className="text-sm text-slate-400">ft</span>
                      </div>
                    </div>
                  ))}
                </div>

                {quote.projectedUnsupportedFeet ? (
                  <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-amber-900">Unsupported sections excluded</div>
                      <p className="text-sm text-amber-800 mt-1">
                        {quote.projectedUnsupportedFeet} ft was marked unresolved or unsupported and is not included in the automated price range.
                      </p>
                    </div>
                  </div>
                ) : null}

                {quote.measurementSections && quote.measurementSections.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-bold text-slate-900 uppercase tracking-wider text-sm border-b border-slate-100 pb-2">Measurements</h3>
                    <div className="space-y-3">
                      {quote.measurementSections.map((sec) => (
                        <div key={sec.id} className="flex justify-between items-center bg-slate-50 p-4 rounded-xl">
                          <span className="text-slate-700 font-medium">{sec.name}</span>
                          <span className="font-bold text-slate-900 bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-sm">{sec.lengthFeet} ft</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {quote.recommendedKits && quote.recommendedKits.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-bold text-slate-900 uppercase tracking-wider text-sm border-b border-slate-100 pb-2">Materials & Kits</h3>
                    <div className="space-y-3">
                      {quote.recommendedKits.map((product, i) => (
                        <div key={`${product.id}-${i}`} className="flex justify-between items-center bg-slate-50 p-4 rounded-xl">
                          <div className="flex items-center gap-4">
                            <div className="bg-blue-100 text-blue-700 font-bold w-10 h-10 rounded-lg flex items-center justify-center shrink-0">
                              x{product.quantity}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900">{product.name}</div>
                              <div className="text-sm font-medium text-slate-500">{product.lengthFeet}ft Kit{product.modelNumber ? ` - ${product.modelNumber}` : ''}</div>
                            </div>
                          </div>
                          <div className="font-bold text-slate-900 text-lg">
                            ${(product.price * product.quantity).toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {quote.adjustments && quote.adjustments.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-bold text-slate-900 uppercase tracking-wider text-sm border-b border-slate-100 pb-2">Installation Factors</h3>
                    <div className="space-y-3">
                      {quote.adjustments.map((adj, i) => (
                        <div key={i} className="flex justify-between items-center p-4">
                          <span className="text-slate-700 font-medium flex items-center gap-2"><Zap className="w-4 h-4 text-orange-500"/> {adj.name}</span>
                          <span className="font-bold text-slate-900">
                            {adj.amount ? `$${adj.amount.toFixed(2)}` : `x${adj.multiplier}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* Right Column: CTA */}
            <div>
              <div className="bg-blue-50 border border-blue-100 rounded-3xl p-8 sticky top-8 card-shadow">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-primary shadow-sm mb-6">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Ready to move forward?</h3>
                <p className="text-slate-600 font-medium mb-8">
                  Lock in this preliminary price by having our experts verify your property details. 
                </p>

                <ul className="space-y-4 mb-8">
                  <li className="flex items-center gap-3 text-slate-700 font-medium">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    Free expert verification
                  </li>
                  <li className="flex items-center gap-3 text-slate-700 font-medium">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    Expert-confirmed pricing before installation
                  </li>
                  <li className="flex items-center gap-3 text-slate-700 font-medium">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    No obligation to purchase
                  </li>
                </ul>

                <Button asChild className="w-full py-7 text-lg font-bold bg-primary hover:bg-primary/90 text-white shadow-md active:scale-[0.98] rounded-xl mb-4">
                  <Link href="/estimate/expert-review">
                    Request Final Quote <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
                
                <Button onClick={handleReset} variant="ghost" className="w-full text-slate-500 hover:text-slate-900 font-bold">
                  Start Over
                </Button>

                <p className="text-xs font-medium text-slate-400 mt-6 text-center leading-relaxed">
                  * This is a preliminary estimate. Final prices may vary based on property inspection, power supply availability, and physical measurement.
                </p>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

export default function ResultPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-[50vh]"><div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-200 border-t-primary"></div></div>}>
      <ResultContent />
    </Suspense>
  );
}
