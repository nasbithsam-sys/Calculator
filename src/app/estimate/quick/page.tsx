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
import { Progress } from '@/components/ui/progress';
import { useQuoteStore } from '@/store/quoteStore';
import { calculateEstimate } from '@/app/actions/calculate';
import { ChevronLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

const quickEstimateSchema = z.object({
  coverage: z.enum(['front-only', 'front-sides', 'full-perimeter']),
  frontageFeet: z.string().min(1, "Required").refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Must be positive"),
  stories: z.enum(['1', '2', '3', '4+']),
  roofComplexity: z.enum(['simple', 'average', 'complex', 'custom']),
  peaks: z.string().min(1).refine((val) => !isNaN(Number(val)), "Must be a number"),
});

type QuickEstimateFormValues = z.infer<typeof quickEstimateSchema>;

export default function QuickEstimatePage() {
  const router = useRouter();
  const { setMethod, updateProperty, setFeet, setCalculationResult, setStatus } = useQuoteStore();
  const [isClient, setIsClient] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setMethod('quick');
  }, [setMethod]);

  const form = useForm<QuickEstimateFormValues>({
    resolver: zodResolver(quickEstimateSchema),
    defaultValues: {
      coverage: 'front-only',
      frontageFeet: '40',
      stories: '1',
      roofComplexity: 'average',
      peaks: '2',
    },
  });

  const onSubmit = async (data: QuickEstimateFormValues) => {
    setIsCalculating(true);
    try {
      const propertyDetails = {
        stories: data.stories === '4+' ? '4+' as const : Number(data.stories) as 1 | 2 | 3,
        roofComplexity: data.roofComplexity as any,
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
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/estimate">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Link>
        </Button>
        <div className="w-1/3">
          <Progress value={50} className="h-2" />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Estimate</CardTitle>
          <CardDescription>
            Answer a few simple questions for an instant, preliminary price range based on our pricing model.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              
              <FormField
                control={form.control}
                name="coverage"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Lighting Coverage</FormLabel>
                    <FormControl>
                      <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col space-y-2">
                        <FormItem className="flex items-center space-x-3 space-y-0 border p-4 rounded-md">
                          <FormControl><RadioGroupItem value="front-only" /></FormControl>
                          <FormLabel className="font-normal cursor-pointer w-full">Front of House Only (Typical)</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0 border p-4 rounded-md">
                          <FormControl><RadioGroupItem value="front-sides" /></FormControl>
                          <FormLabel className="font-normal cursor-pointer w-full">Front and Sides</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0 border p-4 rounded-md">
                          <FormControl><RadioGroupItem value="full-perimeter" /></FormControl>
                          <FormLabel className="font-normal cursor-pointer w-full">Full Perimeter (All 4 Sides)</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="frontageFeet"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Approx. Width of Front (Feet)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 40" {...field} type="number" />
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
                      <FormLabel>Number of Peaks / Gables</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 2" {...field} type="number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="stories"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Number of Stories</FormLabel>
                    <FormControl>
                      <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-row space-x-4">
                        {['1', '2', '3', '4+'].map((val) => (
                          <FormItem key={val} className="flex items-center space-x-2">
                            <FormControl><RadioGroupItem value={val} /></FormControl>
                            <FormLabel className="font-normal">{val}</FormLabel>
                          </FormItem>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="roofComplexity"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Roof Complexity</FormLabel>
                    <FormControl>
                      <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormItem className="flex items-center space-x-3 space-y-0 rounded-md border p-4 cursor-pointer">
                          <FormControl><RadioGroupItem value="simple" /></FormControl>
                          <FormLabel className="font-normal cursor-pointer w-full">Simple</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0 rounded-md border p-4 cursor-pointer">
                          <FormControl><RadioGroupItem value="average" /></FormControl>
                          <FormLabel className="font-normal cursor-pointer w-full">Average</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0 rounded-md border p-4 cursor-pointer">
                          <FormControl><RadioGroupItem value="complex" /></FormControl>
                          <FormLabel className="font-normal cursor-pointer w-full">Complex</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0 rounded-md border p-4 cursor-pointer">
                          <FormControl><RadioGroupItem value="custom" /></FormControl>
                          <FormLabel className="font-normal cursor-pointer w-full">Custom</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <Button type="submit" className="w-full sm:w-auto" disabled={isCalculating}>
                  {isCalculating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Calculate Estimate
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
