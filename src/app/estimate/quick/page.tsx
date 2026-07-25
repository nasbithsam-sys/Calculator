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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuoteStore } from '@/store/quoteStore';
import { calculateEstimate } from '@/app/actions/calculate';
import { ChevronLeft, Loader2, Home, Zap, Ruler, ShieldCheck, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const quickEstimateSchema = z.object({
  coverage: z.enum(['front-only', 'front-sides', 'full-perimeter', 'custom']),
  frontageFeet: z.string().min(1, "Required").refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Must be a positive number"),
  stories: z.enum(['1', '2', '3', '4+']),
  roofComplexity: z.enum(['simple', 'average', 'complex', 'custom']),
  peaks: z.string().min(1, "Required").refine((val) => !isNaN(Number(val)), "Must be a number"),
});

type QuickEstimateFormValues = z.infer<typeof quickEstimateSchema>;

export default function QuickEstimatePage() {
  const router = useRouter();
  const { setMethod, updateProperty, setFeet, setCalculationResult, setStatus } = useQuoteStore();
  const [isClient, setIsClient] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [step, setStep] = useState(1);

  useEffect(() => {
    setIsClient(true);
    setMethod('quick');
  }, [setMethod]);

  const form = useForm<QuickEstimateFormValues>({
    resolver: zodResolver(quickEstimateSchema),
    defaultValues: {
      coverage: 'front-only',
      frontageFeet: '',
      stories: '1',
      roofComplexity: 'average',
      peaks: '',
    },
    mode: 'onChange',
  });

  const nextStep = async () => {
    let isValid = false;
    if (step === 1) {
      isValid = await form.trigger(['frontageFeet', 'stories']);
    } else if (step === 2) {
      isValid = await form.trigger(['coverage']);
    }
    
    if (isValid) {
      setStep(step + 1);
      window.scrollTo(0, 0);
    }
  };

  const prevStep = () => {
    setStep(step - 1);
    window.scrollTo(0, 0);
  };

  const onSubmit = async (data: QuickEstimateFormValues) => {
    setIsCalculating(true);
    try {
      const propertyDetails = {
        stories: data.stories === '4+' ? '4+' as const : Number(data.stories) as 1 | 2 | 3,
        roofComplexity: data.roofComplexity as any,
      };

      updateProperty(propertyDetails);
      
      const result = await calculateEstimate({
        coverage: data.coverage === 'custom' ? 'front-only' : data.coverage, // fallback for custom
        frontageFeet: Number(data.frontageFeet),
        stories: data.stories === '4+' ? 4 : Number(data.stories),
        roofComplexity: data.roofComplexity,
        peaks: Number(data.peaks),
      });
      
      if (!result.success) {
        alert(result.error);
        return;
      }
      
      setFeet(result.estimatedLinearFeet, 'estimated');
      setCalculationResult(result as any);
      setStatus('preliminary', 'low');

      router.push('/estimate/result');
    } finally {
      setIsCalculating(false);
    }
  };

  if (!isClient) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300 pb-10">
      {/* Header and Progress */}
      <div className="flex items-center justify-between mb-8">
        <Button variant="ghost" size="sm" asChild className="-ml-4 text-slate-500 hover:text-slate-900" onClick={(e) => {
          if (step > 1) {
            e.preventDefault();
            prevStep();
          }
        }}>
          {step === 1 ? (
            <Link href="/estimate">
              <ChevronLeft className="w-5 h-5 mr-1" />
              Back
            </Link>
          ) : (
            <button type="button">
              <ChevronLeft className="w-5 h-5 mr-1" />
              Back
            </button>
          )}
        </Button>
        <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
          Step {step} of 3
        </div>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Quick Estimate</h1>
        <p className="text-slate-500">Answer a few simple questions and receive an immediate price range.</p>
        
        {/* Progress Bar */}
        <div className="w-full bg-slate-200 h-1.5 rounded-full mt-6 overflow-hidden">
          <div 
            className="bg-blue-600 h-full rounded-full transition-all duration-300 ease-out"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          
          {step === 1 && (
            <Card className="border-slate-200 shadow-sm animate-in slide-in-from-right-4 duration-300">
              <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
                <CardTitle className="flex items-center text-lg">
                  <Home className="w-5 h-5 mr-2 text-blue-600" />
                  Your Home
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-8">
                <FormField
                  control={form.control}
                  name="frontageFeet"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold">Approximate front width (feet)</FormLabel>
                      <p className="text-sm text-slate-500 mb-3">Estimate the straight-line width of the front of your house.</p>
                      <FormControl>
                        <div className="relative max-w-xs">
                          <Input placeholder="e.g. 50" {...field} type="number" className="pl-4 pr-10 py-6 text-lg" />
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium select-none pointer-events-none">
                            ft
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="stories"
                  render={({ field }) => (
                    <FormItem className="space-y-4">
                      <FormLabel className="text-base font-semibold">Number of stories</FormLabel>
                      <FormControl>
                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {['1', '2', '3', '4+'].map((val) => (
                            <FormItem key={val}>
                              <FormControl>
                                <RadioGroupItem value={val} className="peer sr-only" />
                              </FormControl>
                              <FormLabel className="flex items-center justify-center w-full p-4 bg-white border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 peer-data-[state=checked]:border-blue-600 peer-data-[state=checked]:bg-blue-50 peer-data-[state=checked]:text-blue-700 transition-colors font-semibold text-lg">
                                {val}
                              </FormLabel>
                            </FormItem>
                          ))}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="button" onClick={nextStep} className="w-full py-6 text-lg font-semibold bg-blue-600 hover:bg-blue-700">
                  Continue
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </CardContent>
            </Card>
          )}

          {step === 2 && (
            <Card className="border-slate-200 shadow-sm animate-in slide-in-from-right-4 duration-300">
              <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
                <CardTitle className="flex items-center text-lg">
                  <Zap className="w-5 h-5 mr-2 text-blue-600" />
                  Lighting Coverage
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <FormField
                  control={form.control}
                  name="coverage"
                  render={({ field }) => (
                    <FormItem className="space-y-4">
                      <FormLabel className="text-base font-semibold">Where would you like lights installed?</FormLabel>
                      <FormControl>
                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col space-y-3">
                          
                          <FormItem>
                            <FormControl>
                              <RadioGroupItem value="front-only" className="peer sr-only" />
                            </FormControl>
                            <FormLabel className="flex flex-col p-4 bg-white border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 peer-data-[state=checked]:border-blue-600 peer-data-[state=checked]:ring-1 peer-data-[state=checked]:ring-blue-600 transition-all">
                              <span className="font-semibold text-slate-900 peer-data-[state=checked]:text-blue-700">Front only</span>
                              <span className="text-slate-500 font-normal mt-1">Typical installation, visible from the street</span>
                            </FormLabel>
                          </FormItem>

                          <FormItem>
                            <FormControl>
                              <RadioGroupItem value="front-sides" className="peer sr-only" />
                            </FormControl>
                            <FormLabel className="flex flex-col p-4 bg-white border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 peer-data-[state=checked]:border-blue-600 peer-data-[state=checked]:ring-1 peer-data-[state=checked]:ring-blue-600 transition-all">
                              <span className="font-semibold text-slate-900 peer-data-[state=checked]:text-blue-700">Front and sides</span>
                              <span className="text-slate-500 font-normal mt-1">Wrap around the visible sides of the property</span>
                            </FormLabel>
                          </FormItem>

                          <FormItem>
                            <FormControl>
                              <RadioGroupItem value="full-perimeter" className="peer sr-only" />
                            </FormControl>
                            <FormLabel className="flex flex-col p-4 bg-white border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 peer-data-[state=checked]:border-blue-600 peer-data-[state=checked]:ring-1 peer-data-[state=checked]:ring-blue-600 transition-all">
                              <span className="font-semibold text-slate-900 peer-data-[state=checked]:text-blue-700">Full perimeter</span>
                              <span className="text-slate-500 font-normal mt-1">All 4 sides of the home</span>
                            </FormLabel>
                          </FormItem>
                          
                          <FormItem>
                            <FormControl>
                              <RadioGroupItem value="custom" className="peer sr-only" />
                            </FormControl>
                            <FormLabel className="flex flex-col p-4 bg-white border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 peer-data-[state=checked]:border-blue-600 peer-data-[state=checked]:ring-1 peer-data-[state=checked]:ring-blue-600 transition-all">
                              <span className="font-semibold text-slate-900 peer-data-[state=checked]:text-blue-700">Custom sections</span>
                              <span className="text-slate-500 font-normal mt-1">Specific peaks, patios, or detached garages</span>
                            </FormLabel>
                          </FormItem>

                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="button" onClick={nextStep} className="w-full py-6 text-lg font-semibold bg-blue-600 hover:bg-blue-700">
                  Continue
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </CardContent>
            </Card>
          )}

          {step === 3 && (
            <Card className="border-slate-200 shadow-sm animate-in slide-in-from-right-4 duration-300">
              <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
                <CardTitle className="flex items-center text-lg">
                  <Ruler className="w-5 h-5 mr-2 text-blue-600" />
                  Roof Shape
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-8">
                
                <FormField
                  control={form.control}
                  name="roofComplexity"
                  render={({ field }) => (
                    <FormItem className="space-y-4">
                      <FormLabel className="text-base font-semibold">How complex is your roofline?</FormLabel>
                      <FormControl>
                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          
                          <FormItem>
                            <FormControl>
                              <RadioGroupItem value="simple" className="peer sr-only" />
                            </FormControl>
                            <FormLabel className="flex flex-col p-4 bg-white border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 peer-data-[state=checked]:border-blue-600 peer-data-[state=checked]:ring-1 peer-data-[state=checked]:ring-blue-600 transition-all h-full">
                              <span className="font-semibold text-slate-900 peer-data-[state=checked]:text-blue-700">Simple</span>
                              <span className="text-slate-500 text-sm font-normal mt-1 leading-relaxed">Straight lines, standard height</span>
                            </FormLabel>
                          </FormItem>

                          <FormItem>
                            <FormControl>
                              <RadioGroupItem value="average" className="peer sr-only" />
                            </FormControl>
                            <FormLabel className="flex flex-col p-4 bg-white border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 peer-data-[state=checked]:border-blue-600 peer-data-[state=checked]:ring-1 peer-data-[state=checked]:ring-blue-600 transition-all h-full">
                              <span className="font-semibold text-slate-900 peer-data-[state=checked]:text-blue-700">Moderate</span>
                              <span className="text-slate-500 text-sm font-normal mt-1 leading-relaxed">A few peaks and valleys</span>
                            </FormLabel>
                          </FormItem>

                          <FormItem>
                            <FormControl>
                              <RadioGroupItem value="complex" className="peer sr-only" />
                            </FormControl>
                            <FormLabel className="flex flex-col p-4 bg-white border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 peer-data-[state=checked]:border-blue-600 peer-data-[state=checked]:ring-1 peer-data-[state=checked]:ring-blue-600 transition-all h-full">
                              <span className="font-semibold text-slate-900 peer-data-[state=checked]:text-blue-700">Complex</span>
                              <span className="text-slate-500 text-sm font-normal mt-1 leading-relaxed">Multiple levels, steep pitches, many dormers</span>
                            </FormLabel>
                          </FormItem>
                          
                          <FormItem>
                            <FormControl>
                              <RadioGroupItem value="custom" className="peer sr-only" />
                            </FormControl>
                            <FormLabel className="flex flex-col p-4 bg-white border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 peer-data-[state=checked]:border-blue-600 peer-data-[state=checked]:ring-1 peer-data-[state=checked]:ring-blue-600 transition-all h-full">
                              <span className="font-semibold text-slate-900 peer-data-[state=checked]:text-blue-700">Not sure</span>
                              <span className="text-slate-500 text-sm font-normal mt-1 leading-relaxed">Route me to expert review if needed</span>
                            </FormLabel>
                          </FormItem>

                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="peaks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold">Number of major peaks / gables</FormLabel>
                      <p className="text-sm text-slate-500 mb-3">Count the prominent triangular roof sections facing the street.</p>
                      <FormControl>
                        <Input placeholder="e.g. 2" {...field} type="number" className="max-w-xs py-6 text-lg" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full py-6 text-lg font-semibold bg-slate-900 hover:bg-slate-800 text-white" disabled={isCalculating}>
                  {isCalculating ? (
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  ) : (
                    <ShieldCheck className="w-5 h-5 mr-2" />
                  )}
                  Calculate My Estimate
                </Button>
              </CardContent>
            </Card>
          )}
        </form>
      </Form>
    </div>
  );
}
