"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useQuoteStore } from '@/store/quoteStore';
import { calculateEstimate } from '@/app/actions/calculate';
import { ChevronLeft, Plus, Trash2, GripVertical, Loader2 } from 'lucide-react';
import Link from 'next/link';

const sectionSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Section name is required"),
  lengthFeet: z.string().min(1, "Length is required")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Must be positive")
    .refine((val) => Number(val) <= 1000, "Length is unusually large"),
});

const measurementsSchema = z.object({
  sections: z.array(sectionSchema).min(1, "Please add at least one section"),
});

const COMMON_NAMES = ['Front eave', 'Garage', 'Porch', 'Lower peak', 'Upper peak', 'Left side', 'Right side', 'Rear', 'Other'];

export default function MeasurementsPage() {
  const router = useRouter();
  const { setMethod, setFeet, setCalculationResult, setStatus, setMeasurementSections, quote } = useQuoteStore();
  const [isClient, setIsClient] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setMethod('measurements');
  }, [setMethod]);

  const defaultSections = quote.measurementSections?.length > 0 
    ? quote.measurementSections.map(s => ({ ...s, lengthFeet: String(s.lengthFeet) }))
    : [{ id: Math.random().toString(), name: 'Front eave', lengthFeet: quote.customerProvidedFeet ? String(quote.customerProvidedFeet) : '' }];

  const form = useForm<z.infer<typeof measurementsSchema>>({
    resolver: zodResolver(measurementsSchema),
    defaultValues: {
      sections: defaultSections,
    },
  });

  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: "sections"
  });

  // Watch for live total calculation
  const watchedSections = form.watch("sections");
  const currentTotal = watchedSections.reduce((sum, sec) => sum + (Number(sec.lengthFeet) || 0), 0);

  const onSubmit = async (data: z.infer<typeof measurementsSchema>) => {
    setIsCalculating(true);
    try {
      const totalFeet = data.sections.reduce((sum, sec) => sum + Number(sec.lengthFeet), 0);
      
      const sectionsToSave = data.sections.map((sec, i) => ({
        id: sec.id,
        name: sec.name,
        lengthFeet: Number(sec.lengthFeet),
        order: i
      }));

      const result = await calculateEstimate({
        coverage: "measured",
        stories: quote.property.stories === '4+' ? 4 : Number(quote.property.stories || 1),
        roofComplexity: quote.property.roofComplexity || "average",
        peaks: 0,
        measuredSections: sectionsToSave
      });
      
      if (!result.success) {
        alert(result.error);
        return;
      }
      
      setMeasurementSections(sectionsToSave);
      setFeet(totalFeet, 'customer');
      setFeet(result.estimatedLinearFeet, 'estimated');
      setCalculationResult(result as any);
      setStatus('ready-for-review', 'high'); 

      router.push('/estimate/result');
    } finally {
      setIsCalculating(false);
    }
  };

  if (!isClient) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300 pb-20">
      <div className="flex items-center justify-between mb-8">
        <Button variant="ghost" size="sm" asChild className="-ml-4 text-slate-500 hover:text-slate-900">
          <Link href="/estimate">
            <ChevronLeft className="w-5 h-5 mr-1" />
            Back
          </Link>
        </Button>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">I Know My Measurements</h1>
        <p className="text-slate-500">Enter the exact linear footage where you want permanent lights installed.</p>
      </div>

      <Card className="border-slate-200 shadow-sm border-t-4 border-t-blue-600 overflow-hidden">
        <CardContent className="p-0">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="divide-y divide-slate-100">
              
              <div className="p-4 sm:p-6 space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center bg-white p-4 sm:py-3 sm:px-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-sm transition-all group">
                    <div className="hidden sm:flex flex-col gap-1 items-center justify-center cursor-move text-slate-300 hover:text-blue-500 active:cursor-grabbing">
                      <GripVertical className="w-5 h-5" onClick={() => index > 0 && move(index, index - 1)} />
                    </div>

                    <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4">
                      <FormField
                        control={form.control}
                        name={`sections.${index}.name`}
                        render={({ field }) => (
                          <FormItem className="sm:col-span-8">
                            <FormLabel className="sm:hidden text-xs font-semibold text-slate-500">Section Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. Front eave" {...field} list={`names-${field.name}`} className="font-medium bg-slate-50 border-transparent focus:bg-white transition-colors" />
                            </FormControl>
                            <datalist id={`names-${field.name}`}>
                              {COMMON_NAMES.map(name => <option key={name} value={name} />)}
                            </datalist>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`sections.${index}.lengthFeet`}
                        render={({ field }) => (
                          <FormItem className="sm:col-span-4 relative">
                            <FormLabel className="sm:hidden text-xs font-semibold text-slate-500">Length</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input placeholder="0" type="number" {...field} className="font-semibold pr-8 text-right bg-slate-50 border-transparent focus:bg-white transition-colors" />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium select-none pointer-events-none text-sm">
                                  ft
                                </div>
                              </div>
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex justify-end w-full sm:w-auto mt-2 sm:mt-0">
                      <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)} className="text-slate-400 hover:text-red-500 hover:bg-red-50 w-full sm:w-auto rounded-lg">
                        <Trash2 className="w-4 h-4 sm:mr-0 mr-2" />
                        <span className="sm:hidden">Delete</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 sm:p-6 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => append({ id: Math.random().toString(), name: '', lengthFeet: '' })}
                  className="w-full sm:w-auto bg-white border-dashed border-2 hover:border-solid hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" /> Add another section
                </Button>

                <div className="flex items-center gap-4 bg-white px-6 py-3 rounded-xl border border-slate-200 shadow-sm w-full sm:w-auto justify-between sm:justify-start">
                  <div className="text-sm text-slate-500 font-medium uppercase tracking-wider">Total</div>
                  <div className="text-3xl font-bold text-slate-900">{currentTotal} <span className="text-sm font-medium text-slate-500">ft</span></div>
                </div>
              </div>

              {form.formState.errors.sections?.root && (
                <div className="px-6 py-3 text-sm font-medium text-red-600 bg-red-50 border-y border-red-100">
                  {form.formState.errors.sections.root.message}
                </div>
              )}

              <div className="p-4 sm:p-6 flex flex-col items-center justify-end">
                <div className="text-sm text-slate-500 mb-4 text-center max-w-sm">
                  We add a small purchasing allowance to ensure your installers have enough lights to complete the job.
                </div>
                <Button type="submit" className="w-full sm:w-auto py-6 px-10 text-lg font-semibold bg-slate-900 hover:bg-slate-800 text-white shadow-md hover:shadow-lg transition-all" disabled={fields.length === 0 || isCalculating}>
                  {isCalculating && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
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
