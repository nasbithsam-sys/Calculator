"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useQuoteStore } from '@/store/quoteStore';
import { calculateEstimate } from '@/app/actions/calculate';
import { ChevronLeft, Loader2, ShieldCheck, ArrowRight, Home, Zap, Ruler, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

const quickEstimateSchema = z.object({
  frontageFeet: z.string().min(1, "Required").refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Must be a positive number"),
  stories: z.enum(['1', '2', '3', '4+']),
  coverage: z.enum(['front-only', 'front-sides', 'full-perimeter']),
  roofComplexity: z.enum(['simple', 'average', 'complex']),
  peaks: z.string().min(1, "Required").refine((val) => !isNaN(Number(val)), "Must be a number"),
});

type QuickEstimateFormValues = z.infer<typeof quickEstimateSchema>;

export default function QuickEstimatePage() {
  const router = useRouter();
  const { setMethod, updateProperty, setFeet, setCalculationResult, setStatus } = useQuoteStore();
  const [isClient, setIsClient] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsClient(true);
    setMethod('quick');
  }, [setMethod]);

  const form = useForm<QuickEstimateFormValues>({
    resolver: zodResolver(quickEstimateSchema),
    defaultValues: {
      frontageFeet: '',
      stories: '1',
      coverage: 'front-only',
      roofComplexity: 'average',
      peaks: '1',
    },
    mode: 'onChange',
  });

  const nextStep = async () => {
    let isValid = false;
    if (step === 1) isValid = await form.trigger(['frontageFeet', 'stories']);
    else if (step === 2) isValid = await form.trigger(['coverage']);
    else if (step === 3) isValid = await form.trigger(['roofComplexity', 'peaks']);
    
    if (isValid) {
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    setStep(step - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onSubmit = async (data: QuickEstimateFormValues) => {
    setIsCalculating(true);
    setError(null);
    try {
      const propertyDetails = {
        stories: data.stories === '4+' ? '4+' as const : Number(data.stories) as 1 | 2 | 3,
        roofComplexity: data.roofComplexity,
      };

      updateProperty(propertyDetails);
      
      const result = await calculateEstimate({
        coverage: data.coverage,
        frontageFeet: Number(data.frontageFeet),
        stories: data.stories === '4+' ? 4 : Number(data.stories),
        roofComplexity: data.roofComplexity,
        peaks: Number(data.peaks),
      });
      
      if (!result.success) {
        setError(result.error || "Unable to calculate estimate at this time.");
        return;
      }
      
      setFeet(result.estimatedLinearFeet, 'estimated');
      setCalculationResult(result);
      setStatus('preliminary', 'low');

      router.push('/estimate/result');
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsCalculating(false);
    }
  };

  if (!isClient) return null;

  const formValues = form.getValues();

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in duration-300 pb-20">
      
      {/* Header and Progress */}
      <div className="flex items-center justify-between mb-10">
        {step === 1 ? (
          <Button variant="ghost" size="sm" asChild className="-ml-4 text-slate-500 hover:text-slate-900 focus-ring">
            <Link href="/estimate">
              <ChevronLeft className="w-5 h-5 mr-1" /> Back
            </Link>
          </Button>
        ) : (
          <Button type="button" variant="ghost" size="sm" className="-ml-4 text-slate-500 hover:text-slate-900 focus-ring" onClick={prevStep}>
            <ChevronLeft className="w-5 h-5 mr-1" /> Back
          </Button>
        )}
        <div className="flex items-center gap-2 text-sm font-bold text-primary">
          Step {step} of 4
        </div>
      </div>

      <div className="mb-10 text-center space-y-3">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Quick Estimate</h1>
        <p className="text-lg text-slate-600 font-medium">Answer a few simple questions to receive an immediate price range.</p>
        
        {/* Modern Stepper */}
        <div className="w-full bg-slate-200 h-2 rounded-full mt-8 overflow-hidden">
          <div className="bg-primary h-full rounded-full transition-all duration-500 ease-out" style={{ width: `${(step / 4) * 100}%` }} />
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 bg-white p-6 sm:p-10 rounded-3xl card-shadow">
          
          {/* STEP 1: HOME SIZE */}
          {step === 1 && (
            <div className="space-y-10 animate-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Home className="w-6 h-6" /></div>
                <h2 className="text-2xl font-bold text-slate-900">Home Size</h2>
              </div>
              
              <FormField
                control={form.control}
                name="frontageFeet"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg font-bold text-slate-900">Approximate front width (feet)</FormLabel>
                    <p className="text-slate-500 text-base mb-4">Estimate the straight-line width of the front of your house facing the street.</p>
                    <FormControl>
                      <div className="relative max-w-sm">
                        <Input placeholder="e.g. 50" {...field} type="number" className="pl-5 pr-12 py-7 text-xl font-medium rounded-xl border-slate-300 focus-visible:ring-primary shadow-sm" />
                        <div className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold select-none pointer-events-none">
                          ft
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage className="text-destructive font-medium mt-2" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="stories"
                render={({ field }) => (
                  <FormItem className="space-y-4 pt-6 border-t border-slate-100">
                    <FormLabel className="text-lg font-bold text-slate-900">Number of stories</FormLabel>
                    <FormControl>
                      <RadioGroup onValueChange={field.onChange} value={field.value} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {['1', '2', '3', '4+'].map((val) => (
                          <FormItem key={val}>
                            <FormControl>
                              <RadioGroupItem value={val} className="peer sr-only" />
                            </FormControl>
                            <FormLabel className="flex items-center justify-center w-full p-5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 hover:border-slate-300 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-blue-50 peer-data-[state=checked]:text-primary transition-all font-bold text-xl shadow-sm">
                              {val}
                            </FormLabel>
                          </FormItem>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage className="text-destructive font-medium mt-2" />
                  </FormItem>
                )}
              />

              <Button type="button" onClick={nextStep} className="w-full py-7 text-lg font-bold bg-primary hover:bg-primary/90 text-white rounded-xl mt-8">
                Continue <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          )}

          {/* STEP 2: LIGHTING COVERAGE */}
          {step === 2 && (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-xl"><Zap className="w-6 h-6" /></div>
                <h2 className="text-2xl font-bold text-slate-900">Lighting Coverage</h2>
              </div>
              
              <FormField
                control={form.control}
                name="coverage"
                render={({ field }) => (
                  <FormItem className="space-y-6">
                    <FormLabel className="text-lg font-bold text-slate-900">Where would you like lights installed?</FormLabel>
                    <FormControl>
                      <RadioGroup onValueChange={field.onChange} value={field.value} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        
                        <FormItem>
                          <FormControl><RadioGroupItem value="front-only" className="peer sr-only" /></FormControl>
                          <FormLabel className="flex flex-col p-5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 hover:border-slate-300 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-blue-50 peer-data-[state=checked]:ring-1 peer-data-[state=checked]:ring-primary transition-all h-full shadow-sm">
                            <div className="h-24 w-full flex items-center justify-center mb-4 opacity-70 peer-data-[state=checked]:opacity-100">
                              <svg width="80" height="40" viewBox="0 0 80 40" fill="none" className="text-slate-400 peer-data-[state=checked]:text-primary">
                                <path d="M10 30L40 10L70 30" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M20 23V40M60 23V40" stroke="#CBD5E1" strokeWidth="2" strokeDasharray="4 4" />
                              </svg>
                            </div>
                            <span className="font-bold text-lg text-slate-900 peer-data-[state=checked]:text-primary mb-2">Front Only</span>
                            <span className="text-slate-600 text-sm font-medium leading-relaxed">Typical installation, visible from the street.</span>
                          </FormLabel>
                        </FormItem>

                        <FormItem>
                          <FormControl><RadioGroupItem value="front-sides" className="peer sr-only" /></FormControl>
                          <FormLabel className="flex flex-col p-5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 hover:border-slate-300 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-blue-50 peer-data-[state=checked]:ring-1 peer-data-[state=checked]:ring-primary transition-all h-full shadow-sm">
                            <div className="h-24 w-full flex items-center justify-center mb-4 opacity-70 peer-data-[state=checked]:opacity-100">
                              <svg width="80" height="40" viewBox="0 0 80 40" fill="none" className="text-slate-400 peer-data-[state=checked]:text-primary">
                                <path d="M10 30L40 10L70 30M10 30V40M70 30V40" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M40 10V5" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                              </svg>
                            </div>
                            <span className="font-bold text-lg text-slate-900 peer-data-[state=checked]:text-primary mb-2">Front & Sides</span>
                            <span className="text-slate-600 text-sm font-medium leading-relaxed">Wraps around the visible sides of your property.</span>
                          </FormLabel>
                        </FormItem>

                        <FormItem>
                          <FormControl><RadioGroupItem value="full-perimeter" className="peer sr-only" /></FormControl>
                          <FormLabel className="flex flex-col p-5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 hover:border-slate-300 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-blue-50 peer-data-[state=checked]:ring-1 peer-data-[state=checked]:ring-primary transition-all h-full shadow-sm">
                            <div className="h-24 w-full flex items-center justify-center mb-4 opacity-70 peer-data-[state=checked]:opacity-100">
                              <svg width="80" height="60" viewBox="0 0 80 60" fill="none" className="text-slate-400 peer-data-[state=checked]:text-primary">
                                <rect x="20" y="10" width="40" height="40" stroke="currentColor" strokeWidth="4" rx="2" />
                              </svg>
                            </div>
                            <span className="font-bold text-lg text-slate-900 peer-data-[state=checked]:text-primary mb-2">Full Perimeter</span>
                            <span className="text-slate-600 text-sm font-medium leading-relaxed">All 4 sides of the home (360 degrees).</span>
                          </FormLabel>
                        </FormItem>

                      </RadioGroup>
                    </FormControl>
                    <FormMessage className="text-destructive font-medium mt-2" />
                  </FormItem>
                )}
              />

              <Button type="button" onClick={nextStep} className="w-full py-7 text-lg font-bold bg-primary hover:bg-primary/90 text-white rounded-xl mt-8">
                Continue <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          )}

          {/* STEP 3: ROOFLINE */}
          {step === 3 && (
            <div className="space-y-10 animate-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="p-3 bg-purple-50 text-purple-600 rounded-xl"><Ruler className="w-6 h-6" /></div>
                <h2 className="text-2xl font-bold text-slate-900">Roofline</h2>
              </div>
              
              <FormField
                control={form.control}
                name="roofComplexity"
                render={({ field }) => (
                  <FormItem className="space-y-6">
                    <FormLabel className="text-lg font-bold text-slate-900">How complex is your roofline?</FormLabel>
                    <FormControl>
                      <RadioGroup onValueChange={field.onChange} value={field.value} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        
                        <FormItem>
                          <FormControl><RadioGroupItem value="simple" className="peer sr-only" /></FormControl>
                          <FormLabel className="flex flex-col p-5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-blue-50 peer-data-[state=checked]:ring-1 peer-data-[state=checked]:ring-primary transition-all h-full shadow-sm">
                            <span className="font-bold text-lg text-slate-900 peer-data-[state=checked]:text-primary mb-2">Simple</span>
                            <span className="text-slate-600 text-sm font-medium leading-relaxed">Straight lines, standard height, no dormers.</span>
                          </FormLabel>
                        </FormItem>

                        <FormItem>
                          <FormControl><RadioGroupItem value="average" className="peer sr-only" /></FormControl>
                          <FormLabel className="flex flex-col p-5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-blue-50 peer-data-[state=checked]:ring-1 peer-data-[state=checked]:ring-primary transition-all h-full shadow-sm">
                            <span className="font-bold text-lg text-slate-900 peer-data-[state=checked]:text-primary mb-2">Moderate</span>
                            <span className="text-slate-600 text-sm font-medium leading-relaxed">A few peaks and valleys, typical suburban home.</span>
                          </FormLabel>
                        </FormItem>

                        <FormItem>
                          <FormControl><RadioGroupItem value="complex" className="peer sr-only" /></FormControl>
                          <FormLabel className="flex flex-col p-5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-blue-50 peer-data-[state=checked]:ring-1 peer-data-[state=checked]:ring-primary transition-all h-full shadow-sm">
                            <span className="font-bold text-lg text-slate-900 peer-data-[state=checked]:text-primary mb-2">Complex</span>
                            <span className="text-slate-600 text-sm font-medium leading-relaxed">Multiple levels, steep pitches, many gables.</span>
                          </FormLabel>
                        </FormItem>

                      </RadioGroup>
                    </FormControl>
                    <FormMessage className="text-destructive font-medium mt-2" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="peaks"
                render={({ field }) => (
                  <FormItem className="pt-6 border-t border-slate-100">
                    <FormLabel className="text-lg font-bold text-slate-900">Number of major peaks</FormLabel>
                    <p className="text-slate-500 text-base mb-4">Count the prominent triangular roof sections facing the street.</p>
                    <FormControl>
                      <Input placeholder="e.g. 2" {...field} type="number" className="max-w-xs py-7 text-xl font-medium rounded-xl border-slate-300 focus-visible:ring-primary shadow-sm" />
                    </FormControl>
                    <FormMessage className="text-destructive font-medium mt-2" />
                  </FormItem>
                )}
              />

              <Button type="button" onClick={nextStep} className="w-full py-7 text-lg font-bold bg-primary hover:bg-primary/90 text-white rounded-xl mt-8">
                Review Answers <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          )}

          {/* STEP 4: REVIEW & SUBMIT */}
          {step === 4 && (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><CheckCircle2 className="w-6 h-6" /></div>
                <h2 className="text-2xl font-bold text-slate-900">Review Your Inputs</h2>
              </div>
              
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 space-y-4 shadow-inner">
                <div className="flex justify-between items-center py-2 border-b border-slate-200/60 last:border-0">
                  <span className="text-slate-600 font-medium">Frontage</span>
                  <span className="font-bold text-slate-900 text-lg">{formValues.frontageFeet} ft</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-200/60 last:border-0">
                  <span className="text-slate-600 font-medium">Stories</span>
                  <span className="font-bold text-slate-900 text-lg">{formValues.stories}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-200/60 last:border-0">
                  <span className="text-slate-600 font-medium">Coverage</span>
                  <span className="font-bold text-slate-900 text-lg capitalize">{formValues.coverage.replace('-', ' ')}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-200/60 last:border-0">
                  <span className="text-slate-600 font-medium">Roof Type</span>
                  <span className="font-bold text-slate-900 text-lg capitalize">{formValues.roofComplexity}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-slate-600 font-medium">Peaks</span>
                  <span className="font-bold text-slate-900 text-lg">{formValues.peaks}</span>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-red-900">Calculation Failed</p>
                    <p className="text-red-700 text-sm mt-1">{error}</p>
                    <Button variant="outline" size="sm" className="mt-3 bg-white border-red-200 text-red-700 hover:bg-red-50" onClick={() => setError(null)}>
                      Try Again
                    </Button>
                  </div>
                </div>
              )}

              <Button type="submit" className="w-full py-8 text-xl font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-lg transition-transform active:scale-[0.98]" disabled={isCalculating}>
                {isCalculating ? (
                  <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                ) : (
                  <ShieldCheck className="w-6 h-6 mr-3" />
                )}
                {isCalculating ? 'Calculating Estimate...' : 'Get My Estimate'}
              </Button>
              <p className="text-center text-sm font-medium text-slate-500 pt-2">No commitment required.</p>
            </div>
          )}

        </form>
      </Form>
    </div>
  );
}
