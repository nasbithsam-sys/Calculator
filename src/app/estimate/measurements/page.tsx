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
          <CardTitle>I Know My Measurements</CardTitle>
          <CardDescription>
            Enter the exact linear footage where you want permanent lights installed. Add multiple sections to break down the total.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex gap-4 items-start bg-slate-50 p-4 rounded-lg border border-slate-200 group">
                    <div className="flex flex-col gap-1 items-center justify-center pt-2">
                      <button type="button" onClick={() => index > 0 && move(index, index - 1)} disabled={index === 0} className="text-slate-400 hover:text-blue-600 disabled:opacity-30">
                        <GripVertical className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex-1 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`sections.${index}.name`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Section Name</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g. Front eave" {...field} list={`names-${field.name}`} />
                              </FormControl>
                              <datalist id={`names-${field.name}`}>
                                {COMMON_NAMES.map(name => <option key={name} value={name} />)}
                              </datalist>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`sections.${index}.lengthFeet`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Length (feet)</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g. 50" type="number" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="mt-7 text-slate-400 hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => append({ id: Math.random().toString(), name: '', lengthFeet: '' })}
                >
                  <Plus className="w-4 h-4 mr-2" /> Add Section
                </Button>

                <div className="text-right">
                  <div className="text-sm text-slate-500 font-medium uppercase tracking-wider">Total Footage</div>
                  <div className="text-3xl font-bold text-blue-900">{currentTotal} <span className="text-sm font-medium text-slate-500">ft</span></div>
                </div>
              </div>

              {form.formState.errors.sections?.root && (
                <div className="text-sm text-destructive">{form.formState.errors.sections.root.message}</div>
              )}

              <div className="flex justify-end pt-4">
                <Button type="submit" className="w-full sm:w-auto" disabled={fields.length === 0}>
                  View Estimate
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
