"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuoteStore } from '@/store/quoteStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { recommendKits } from '@/config/products';
import { AlertCircle, CheckCircle2, ChevronLeft, Info, RefreshCcw } from 'lucide-react';
import Link from 'next/link';

import { useSearchParams } from 'next/navigation';

export default function ResultPage() {
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
  const recommendedProducts = isCalculated ? recommendKits(estimatedLinearFeet!) : [];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        {!isSubmitted && (
          <Button variant="ghost" size="sm" asChild className="-ml-2">
            <Link href={`/estimate/${method === 'measurements' ? 'measurements' : method === 'quick' ? 'quick' : ''}`}>
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Link>
          </Button>
        )}
        <div className="w-1/3 ml-auto">
          <Progress value={100} className="h-2" />
        </div>
      </div>

      <div className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          {isSubmitted ? "Review Requested" : "Your Estimate Result"}
        </h1>
        <p className="text-slate-500">
          {isSubmitted ? "We've received your property details." : `Based on the ${method === 'measurements' ? 'measurements' : 'details'} you provided.`}
        </p>
      </div>

      {isSubmitted ? (
        <Card className="border-green-200 bg-green-50 shadow-sm">
          <CardHeader>
            <div className="flex items-center space-x-2 text-green-700">
              <CheckCircle2 className="w-6 h-6" />
              <CardTitle className="text-xl">Request Submitted Successfully</CardTitle>
            </div>
            <CardDescription className="text-green-700/80 mt-2 text-base">
              Your reference number is <strong className="text-green-900">{refNumber || 'Pending'}</strong>.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-green-800 space-y-4">
            <p>
              Thank you for submitting your information. Our experts will review your details, photos, or plans and provide a confirmed, final estimate.
            </p>
            <div className="bg-white/50 p-4 rounded-lg border border-green-100">
              <h4 className="font-semibold mb-2">What happens next?</h4>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>An expert will review your property within 1-2 business days.</li>
                <li>We may reach out if we need further clarification.</li>
                <li>You will receive an email confirmation with the final quote.</li>
              </ul>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleReset} variant="outline" className="w-full sm:w-auto border-green-300 text-green-800 hover:bg-green-100">
              <RefreshCcw className="w-4 h-4 mr-2" />
              Start New Estimate
            </Button>
          </CardFooter>
        </Card>
      ) : !isCalculated ? (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <div className="flex items-center space-x-2 text-orange-700">
              <AlertCircle className="w-5 h-5" />
              <CardTitle>More Information Needed</CardTitle>
            </div>
            <CardDescription className="text-orange-600/80">
              We couldn&apos;t generate a preliminary estimate with the provided details.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-orange-800 text-sm">
            Please ensure you have entered valid positive measurements or selected appropriate property details. If you&apos;re unsure, you can upload photos or request an expert review.
          </CardContent>
          <CardFooter className="flex gap-3">
            <Button asChild className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700">
              <Link href="/estimate/expert-review">
                Request Expert Review
              </Link>
            </Button>
            <Button onClick={handleReset} variant="outline" className="w-full sm:w-auto border-orange-300 text-orange-800 hover:bg-orange-100">
              Start Over
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card className="border-blue-100 shadow-sm">
            <CardHeader className="bg-blue-50/50 rounded-t-xl border-b border-blue-100">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl sm:text-3xl text-blue-900">
                    ${priceRange.min.toLocaleString()} – ${priceRange.max.toLocaleString()}
                  </CardTitle>
                  <CardDescription className="text-blue-700 mt-1 flex items-center">
                    <Info className="w-4 h-4 mr-1 inline" />
                    Preliminary Estimate
                  </CardDescription>
                </div>
                <div className="text-right">
                  <div className="text-3xl sm:text-4xl font-bold text-slate-700">
                    {estimatedLinearFeet}<span className="text-lg font-medium text-slate-500 ml-1">ft</span>
                  </div>
                  <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">Estimated Length</div>
                </div>
              </div>
            </CardHeader>
            
            {quote.measurementSections && quote.measurementSections.length > 0 && (
              <CardContent className="pt-6 border-b border-blue-100">
                <h3 className="font-semibold text-slate-900 mb-4">Measurement Breakdown</h3>
                <div className="space-y-2">
                  {quote.measurementSections.map((sec) => (
                    <div key={sec.id} className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-100">
                      <span className="text-sm text-slate-700">{sec.name}</span>
                      <span className="text-sm font-semibold text-slate-900">{sec.lengthFeet} ft</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}

            {quote.recommendedKits && quote.recommendedKits.length > 0 && (
              <CardContent className="pt-6 border-b border-blue-100">
                <h3 className="font-semibold text-slate-900 mb-4">Recommended Kits</h3>
                <div className="space-y-3">
                  {quote.recommendedKits.map((product, i) => (
                    <div key={`${product.id}-${i}`} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50 gap-2">
                      <div>
                        <div className="font-medium text-slate-900 text-sm">{product.name} x {product.quantity}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{product.length_feet}ft Kit</div>
                      </div>
                      <div className="text-sm font-semibold text-slate-700">
                        ${(product.price * product.quantity).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}

            {quote.adjustments && quote.adjustments.length > 0 && (
              <CardContent className="pt-6">
                <h3 className="font-semibold text-slate-900 mb-4">Estimated Labor & Adjustments</h3>
                <div className="space-y-2">
                  {quote.adjustments.map((adj, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-slate-600">{adj.name}</span>
                      <span className="text-slate-900 font-medium">
                        {adj.amount ? `$${adj.amount.toFixed(2)}` : `x${adj.multiplier}`}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}

            <CardFooter className="bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row gap-3 pt-6 rounded-b-xl">
              <Button asChild className="w-full sm:w-auto">
                <Link href="/estimate/expert-review">
                  Request Expert Confirmation
                </Link>
              </Button>
              <Button onClick={handleReset} variant="outline" className="w-full sm:w-auto">
                <RefreshCcw className="w-4 h-4 mr-2" />
                Start Over
              </Button>
            </CardFooter>
          </Card>
          
          <div className="text-xs text-slate-500 text-center max-w-lg mx-auto">
            This is a preliminary estimate. Prices and recommended lengths may vary after expert review and actual physical measurement of the property.
          </div>
        </div>
      )}
    </div>
  );
}
