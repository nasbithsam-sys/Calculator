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
        <div className="space-y-12">
          
          <div className="text-center space-y-3">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">Your Estimate Summary</h1>
            <p className="text-lg text-slate-600 font-medium">Light requirements and installation pricing are calculated using separate authoritative engines.</p>
          </div>

          <div className="grid lg:grid-cols-[1fr_380px] gap-8 items-start">
            
            {/* Left Column: Two Distinct Sections */}
            <div className="space-y-10">
              
              {/* SECTION 1: ESTIMATED LIGHTS REQUIRED */}
              <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 card-shadow space-y-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-100">
                  <div>
                    <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-3 py-1 rounded-full mb-2">
                      Section 1
                    </div>
                    <h2 className="text-3xl font-extrabold text-slate-900 flex items-center gap-2">
                      <Zap className="w-7 h-7 text-amber-500" /> Estimated Lights Required
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status:</span>
                    <span className="bg-slate-900 text-white text-xs font-bold px-3 py-1 rounded-lg uppercase tracking-wider">
                      {quote.footageStatus || 'supported'}
                    </span>
                  </div>
                </div>

                {/* Footage Grid */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Supported Installation</div>
                    <div className="text-3xl font-extrabold text-slate-900 mt-1">
                      {quote.supportedInstallationFeet ?? estimatedLinearFeet} <span className="text-base text-slate-400 font-bold">ft</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Range: {quote.estimatedInstallationFeetMin ?? estimatedLinearFeet}–{quote.estimatedInstallationFeetMax ?? estimatedLinearFeet} ft
                    </div>
                  </div>

                  <div className="bg-blue-50/70 border border-blue-200 p-5 rounded-2xl">
                    <div className="text-xs font-bold uppercase tracking-wider text-blue-800">Purchasing Footage</div>
                    <div className="text-3xl font-extrabold text-blue-950 mt-1">
                      {quote.recommendedPurchasingFeet ?? estimatedLinearFeet} <span className="text-base text-blue-500 font-bold">ft</span>
                    </div>
                    <div className="text-xs text-blue-700 font-medium mt-1">
                      Includes +{quote.purchasingAllowancePercent ?? 15}% allowance
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Supplied Kits</div>
                    <div className="text-3xl font-extrabold text-slate-900 mt-1">
                      {quote.totalSuppliedKitFeet ?? quote.recommendedPurchasingFeet ?? 0} <span className="text-base text-slate-400 font-bold">ft</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">Exact fit product combination</div>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Excess Supplied</div>
                    <div className="text-3xl font-extrabold text-slate-900 mt-1">
                      {quote.excessKitFeet ?? 0} <span className="text-base text-slate-400 font-bold">ft</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">Unused cut segments</div>
                  </div>
                </div>

                {quote.projectedUnsupportedFeet ? (
                  <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-amber-900">Unresolved / Unsupported Sections Excluded</div>
                      <p className="text-sm text-amber-800 mt-1">
                        {quote.projectedUnsupportedFeet} ft of sloped peaks or hidden sections were marked unresolved and excluded from automated light purchasing requirements.
                      </p>
                    </div>
                  </div>
                ) : null}

                {/* Recommended Govee Product Kits */}
                {quote.recommendedKits && quote.recommendedKits.length > 0 && (
                  <div className="space-y-4 pt-2">
                    <h3 className="font-bold text-slate-900 uppercase tracking-wider text-sm border-b border-slate-100 pb-2">
                      Verified Recommended Govee Kits
                    </h3>
                    <div className="space-y-3">
                      {quote.recommendedKits.map((product, i) => (
                        <div key={`${product.id}-${i}`} className="flex flex-col sm:flex-row justify-between sm:items-center bg-slate-50 p-5 rounded-2xl border border-slate-200/80 gap-4">
                          <div className="flex items-center gap-4">
                            <div className="bg-blue-600 text-white font-black text-lg w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                              x{product.quantity}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 text-lg">{product.name}</div>
                              <div className="text-sm font-medium text-slate-500 flex flex-wrap gap-x-3 gap-y-1 mt-0.5">
                                <span>{product.lengthFeet}ft Kit</span>
                                {product.modelNumber && <span>• Model {product.modelNumber}</span>}
                                {product.productFamily && <span>• Family: {product.productFamily}</span>}
                              </div>
                              {product.compatibilityNote && (
                                <div className="text-xs text-emerald-700 font-semibold mt-1">✓ {product.compatibilityNote}</div>
                              )}
                            </div>
                          </div>
                          <div className="font-extrabold text-slate-900 text-xl text-right">
                            ${(product.price * product.quantity).toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 2: ESTIMATED INSTALLATION PRICE */}
              <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 card-shadow space-y-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-100">
                  <div>
                    <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-3 py-1 rounded-full mb-2">
                      Section 2
                    </div>
                    <h2 className="text-3xl font-extrabold text-slate-900 flex items-center gap-2">
                      <Tag className="w-7 h-7 text-purple-600" /> Estimated Installation Price
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-purple-100 text-purple-800 text-xs font-extrabold px-3 py-1.5 rounded-lg border border-purple-200 uppercase tracking-wider">
                      {quote.pricingTierName || 'Standard Residential'}
                    </span>
                  </div>
                </div>

                {/* Installation Price Range Card */}
                <div className="bg-slate-950 text-white p-8 sm:p-10 rounded-3xl relative overflow-hidden shadow-xl">
                  <div className="absolute top-0 right-0 w-72 h-72 bg-purple-600/20 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
                  
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative z-10">
                    <div>
                      <div className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-2">Total Installation & Materials Price</div>
                      <div className="text-4xl sm:text-5xl font-black tracking-tight text-white flex items-baseline gap-2">
                        ${priceRange.min.toLocaleString()} 
                        <span className="text-2xl text-slate-500 font-bold">–</span> 
                        ${priceRange.max.toLocaleString()}
                      </div>
                    </div>
                    
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 shrink-0 text-left">
                      <div className="text-slate-400 font-bold uppercase tracking-widest text-[11px] mb-1">Labor Pricing Tier</div>
                      <div className="text-xl font-bold text-purple-200">
                        {quote.pricingTierName || "Standard Tier"}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        Labor Range: ${quote.installationPriceMin || priceRange.min} – ${quote.installationPriceMax || priceRange.max}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-white/10 text-xs text-slate-400 font-medium leading-relaxed">
                    * Installation price is strictly classified by <strong>Job Size Category</strong> and <strong>Roofline Complexity</strong>—never calculated as a per-foot labor rate.
                  </div>
                </div>

                {/* Job Classification Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-center">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Job Size</div>
                    <div className="text-xl font-extrabold text-slate-900 mt-1">{quote.jobSize || 'Medium'}</div>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-center">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Complexity Band</div>
                    <div className="text-xl font-extrabold text-purple-700 mt-1">{quote.complexityBand || 'Moderate'}</div>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-center">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Complexity Score</div>
                    <div className="text-xl font-extrabold text-slate-900 mt-1">{quote.complexityScore || 25} pts</div>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-center">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Stories / Type</div>
                    <div className="text-xl font-extrabold text-slate-900 mt-1">{quote.property.stories || 1} Story</div>
                  </div>
                </div>

                {/* Classification Explanations */}
                {quote.reviewReasons && quote.reviewReasons.length > 0 && (
                  <div className="space-y-4 pt-2">
                    <h3 className="font-bold text-slate-900 uppercase tracking-wider text-sm border-b border-slate-100 pb-2">
                      Reasons for Classification
                    </h3>
                    <div className="bg-slate-50 border border-slate-200/80 p-5 rounded-2xl space-y-2">
                      {quote.reviewReasons.map((reason, i) => (
                        <div key={i} className="flex items-center gap-3 text-sm text-slate-700 font-medium">
                          <div className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
                          <span>{reason}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* Right Column: Persistent Action CTA */}
            <div>
              <div className="bg-blue-50 border border-blue-100 rounded-3xl p-8 sticky top-8 card-shadow">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-primary shadow-sm mb-6">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Ready for Expert Review?</h3>
                <p className="text-slate-600 font-medium mb-8 text-sm leading-relaxed">
                  Have an estimator confirm your property classification, verify lighting layout, and finalize your installation date. 
                </p>

                <ul className="space-y-4 mb-8">
                  <li className="flex items-center gap-3 text-slate-700 font-medium text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    Free expert verification
                  </li>
                  <li className="flex items-center gap-3 text-slate-700 font-medium text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    Confirmed pricing tier before booking
                  </li>
                  <li className="flex items-center gap-3 text-slate-700 font-medium text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    No obligation to purchase
                  </li>
                </ul>

                <Button asChild className="w-full py-7 text-lg font-bold bg-primary hover:bg-primary/90 text-white shadow-md active:scale-[0.98] rounded-xl mb-4">
                  <Link href="/estimate/expert-review">
                    Request Final Review <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
                
                <Button onClick={handleReset} variant="ghost" className="w-full text-slate-500 hover:text-slate-900 font-bold">
                  Start Over
                </Button>

                <p className="text-xs font-medium text-slate-400 mt-6 text-center leading-relaxed">
                  * Preliminary estimate based on selected job size and roofline complexity. Final pricing confirmed upon estimator review.
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
