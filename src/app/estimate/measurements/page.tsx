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
import { useQuoteStore } from '@/store/quoteStore';
import { calculateEstimate } from '@/app/actions/calculate';
import { ChevronLeft, Plus, Trash2, GripVertical, Loader2, AlertCircle, PlusCircle, Calculator } from 'lucide-react';
import Link from 'next/link';

const sectionSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name required"),
  lengthFeet: z.string().min(1, "Required")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Must be positive")
    .refine((val) => Number(val) <= 1000, "Max 1000ft"),
});

const measurementsSchema = z.object({
  sections: z.array(sectionSchema).min(1, "Please add at least one section to calculate an estimate."),
});

const COMMON_NAMES = ['Front Eave', 'Garage', 'Porch', 'Lower Peak', 'Upper Peak', 'Left Side', 'Right Side', 'Rear'];

export default function MeasurementsPage() {
  const router = useRouter();
  const { setMethod, setFeet, setCalculationResult, setStatus, setMeasurementSections, quote } = useQuoteStore();
  const [isClient, setIsClient] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true);
    setMethod('measurements');
  }, [setMethod]);

  const defaultSections = quote.measurementSections?.length > 0 
    ? quote.measurementSections.map(s => ({ ...s, lengthFeet: String(s.lengthFeet) }))
    : [{ id: Math.random().toString(), name: 'Front Eave', lengthFeet: quote.customerProvidedFeet ? String(quote.customerProvidedFeet) : '' }];

  const form = useForm<z.infer<typeof measurementsSchema>>({
    resolver: zodResolver(measurementsSchema),
    defaultValues: {
      sections: defaultSections,
    },
    mode: 'onChange'
  });

  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: "sections"
  });

  const watchedSections = form.watch("sections");
  const currentTotal = watchedSections.reduce((sum, sec) => sum + (Number(sec.lengthFeet) || 0), 0);
  const estimatedPurchasing = Math.ceil(currentTotal * 1.15); // Simple visual hint of 15% overage

  const addCommonSection = (name: string) => {
    append({ id: Math.random().toString(), name, lengthFeet: '' });
  };

  const onSubmit = async (data: z.infer<typeof measurementsSchema>) => {
    setIsCalculating(true);
    setError(null);
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
        setError(result.error || "Unable to calculate estimate.");
        return;
      }
      
      setMeasurementSections(sectionsToSave);
      setFeet(totalFeet, 'customer');
      setFeet(result.estimatedLinearFeet, 'estimated');
      setCalculationResult(result as any);
      setStatus('ready-for-review', 'high'); 

      router.push('/estimate/result');
    } catch (e) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsCalculating(false);
    }
  };

  if (!isClient) return null;

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in duration-300 pb-32 lg:pb-12">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Button variant="ghost" size="sm" asChild className="-ml-4 text-slate-500 hover:text-slate-900 focus-ring">
          <Link href="/estimate">
            <ChevronLeft className="w-5 h-5 mr-1" /> Back
          </Link>
        </Button>
      </div>

      <div className="mb-10 text-center lg:text-left">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-3">I Know My Measurements</h1>
        <p className="text-lg text-slate-600 font-medium">Enter the exact linear footage for each section of your home.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* LEFT: Editor */}
          <div className="w-full lg:flex-1 space-y-6">
            
            {/* Quick Add Chips */}
            <div className="bg-white p-6 rounded-2xl border border-border shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">Quick Add Section</h3>
              <div className="flex flex-wrap gap-2">
                {COMMON_NAMES.map(name => (
                  <button 
                    key={name}
                    type="button"
                    onClick={() => addCommonSection(name)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 text-sm font-semibold rounded-lg border border-transparent hover:border-blue-200 transition-colors focus-ring"
                  >
                    <PlusCircle className="w-4 h-4" /> {name}
                  </button>
                ))}
              </div>
            </div>

            {/* List */}
            <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
              <div className="bg-slate-50 px-6 py-4 border-b border-border flex items-center justify-between">
                <h2 className="font-bold text-slate-900 text-lg">Measured Sections</h2>
                <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded-md">{fields.length} sections</span>
              </div>
              
              <div className="divide-y divide-slate-100 p-2 sm:p-4">
                {fields.length === 0 && (
                  <div className="p-8 text-center text-slate-500 font-medium">
                    No sections added yet. Click above to add.
                  </div>
                )}
                
                {fields.map((field, index) => (
                  <div key={field.id} className="flex flex-col sm:flex-row gap-4 items-start sm:items-center p-4 hover:bg-slate-50 transition-colors rounded-xl group relative">
                    <div className="hidden sm:flex flex-col items-center justify-center cursor-move text-slate-300 hover:text-primary active:cursor-grabbing px-1">
                      <GripVertical className="w-5 h-5" onClick={() => index > 0 && move(index, index - 1)} />
                    </div>

                    <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-12 gap-4">
                      <FormField
                        control={form.control}
                        name={`sections.${index}.name`}
                        render={({ field }) => (
                          <FormItem className="sm:col-span-7">
                            <FormLabel className="sm:hidden text-xs font-bold text-slate-500 uppercase tracking-wider">Section Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. Front Eave" {...field} className="font-bold text-slate-900 bg-white shadow-sm border-slate-300 focus-visible:ring-primary h-12" />
                            </FormControl>
                            <FormMessage className="text-destructive font-medium text-xs mt-1" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`sections.${index}.lengthFeet`}
                        render={({ field }) => (
                          <FormItem className="sm:col-span-5 relative">
                            <FormLabel className="sm:hidden text-xs font-bold text-slate-500 uppercase tracking-wider">Length</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input placeholder="0" type="number" {...field} className="font-bold text-lg pr-10 text-right bg-white shadow-sm border-slate-300 focus-visible:ring-primary h-12" />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold select-none pointer-events-none">
                                  ft
                                </div>
                              </div>
                            </FormControl>
                            <FormMessage className="text-destructive font-medium text-xs mt-1 absolute -bottom-5 right-0" />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="absolute top-2 right-2 sm:relative sm:top-auto sm:right-auto text-slate-400 hover:text-destructive hover:bg-red-50 rounded-lg shrink-0">
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-slate-50 border-t border-border">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => append({ id: Math.random().toString(), name: '', lengthFeet: '' })}
                  className="w-full border-dashed border-2 bg-transparent hover:border-primary hover:bg-primary/5 hover:text-primary transition-colors font-bold py-6"
                >
                  <Plus className="w-5 h-5 mr-2" /> Add Custom Section
                </Button>
              </div>
            </div>
          </div>

          {/* RIGHT / BOTTOM: Persistent Total */}
          <div className="w-full lg:w-[380px] shrink-0 fixed bottom-0 left-0 right-0 z-30 lg:sticky lg:top-24 bg-white lg:bg-transparent border-t lg:border-0 border-slate-200 p-4 lg:p-0 shadow-[0_-4px_20px_rgb(0,0,0,0.05)] lg:shadow-none">
            <div className="bg-white lg:rounded-3xl lg:border border-border lg:shadow-xl lg:p-8 flex flex-col gap-6 max-w-6xl mx-auto">
              
              <div className="hidden lg:block text-center pb-6 border-b border-slate-100">
                <div className="inline-flex p-3 bg-blue-50 text-primary rounded-2xl mb-4"><Calculator className="w-8 h-8" /></div>
                <h3 className="text-2xl font-extrabold text-slate-900">Estimate Summary</h3>
              </div>

              <div className="flex items-end justify-between lg:flex-col lg:items-start lg:gap-2">
                <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Installation Footage</span>
                <div className="text-3xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
                  {currentTotal} <span className="text-lg lg:text-2xl text-slate-400 font-bold ml-1">ft</span>
                </div>
              </div>

              <div className="hidden lg:flex items-start gap-3 bg-amber-50 p-4 rounded-xl border border-amber-100">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <span className="font-bold text-amber-900 block mb-1">Purchasing Footage (~{estimatedPurchasing} ft)</span>
                  <span className="text-amber-800">We automatically add a ~15% allowance to ensure installers have enough cut segments to navigate peaks and jumps.</span>
                </div>
              </div>

              {error && (
                <div className="hidden lg:flex items-start gap-3 bg-red-50 p-4 rounded-xl border border-red-100">
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div className="text-sm text-red-800 font-medium">{error}</div>
                </div>
              )}

              {form.formState.errors.sections?.root && (
                <div className="hidden lg:block text-sm font-bold text-destructive">
                  {form.formState.errors.sections.root.message}
                </div>
              )}

              <Button type="submit" className="w-full py-7 lg:py-8 text-lg font-bold bg-primary hover:bg-primary/90 text-white rounded-xl shadow-lg transition-transform active:scale-[0.98]" disabled={fields.length === 0 || isCalculating}>
                {isCalculating && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
                Calculate Cost
              </Button>
            </div>
          </div>

        </form>
      </Form>
    </div>
  );
}
