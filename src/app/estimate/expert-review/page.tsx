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
import { useQuoteStore } from '@/store/quoteStore';
import { ChevronLeft, Loader2, Send, ShieldCheck, Clock, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

const contactSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Please enter a valid phone number"),
});

export default function ExpertReviewPage() {
  const router = useRouter();
  const { quote, setStatus, updateContact } = useQuoteStore();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const form = useForm<z.infer<typeof contactSchema>>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      firstName: quote.contact?.firstName || '',
      lastName: quote.contact?.lastName || '',
      email: quote.contact?.email || '',
      phone: quote.contact?.phone || '',
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (data: z.infer<typeof contactSchema>) => {
    setIsSubmitting(true);
    setError(null);
    updateContact(data);
    
    const updatedQuote = { ...quote, contact: { ...quote.contact, ...data } };
    
    try {
      const response = await fetch('/api/quotes/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quoteData: updatedQuote })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setStatus('review_submitted', 'not-calculated');
        router.push('/estimate/result?ref=' + result.referenceNumber);
      } else {
        setError(result.error || "Failed to submit request.");
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isClient) return null;

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in duration-300 pb-20">
      
      <div className="flex items-center justify-between mb-10">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="-ml-4 text-slate-500 hover:text-slate-900 focus-ring">
          <ChevronLeft className="w-5 h-5 mr-1" /> Back
        </Button>
      </div>

      <div className="mb-10 text-center space-y-3">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Request Expert Review</h1>
        <p className="text-lg text-slate-600 font-medium max-w-xl mx-auto">
          Our lighting designers will manually review your property and prepare a confirmed quote.
        </p>
      </div>

      <div className="grid md:grid-cols-[1fr_300px] gap-8">
        
        {/* Main Form Area */}
        <div className="bg-white p-6 sm:p-10 rounded-3xl card-shadow border border-slate-200">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-6 mb-8">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Send className="w-6 h-6" /></div>
            <h2 className="text-2xl font-bold text-slate-900">Your Contact Details</h2>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700 font-bold">First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Jane" className="bg-slate-50/50 h-12 rounded-xl border-slate-200 focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary transition-all text-lg" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700 font-bold">Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" className="bg-slate-50/50 h-12 rounded-xl border-slate-200 focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary transition-all text-lg" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700 font-bold">Email Address</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="jane@example.com" className="bg-slate-50/50 h-12 rounded-xl border-slate-200 focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary transition-all text-lg" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700 font-bold">Phone Number</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="(555) 123-4567" className="bg-slate-50/50 h-12 rounded-xl border-slate-200 focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary transition-all text-lg" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl text-sm font-bold flex items-start gap-3">
                  <div className="mt-0.5"><ShieldCheck className="w-5 h-5"/></div>
                  <div>{error}</div>
                </div>
              )}
              
              <div className="pt-6 border-t border-slate-100 mt-8">
                <Button type="submit" className="w-full py-7 text-lg font-bold bg-primary hover:bg-primary/90 text-white shadow-md transition-transform active:scale-[0.98] rounded-xl" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : 'Send Request'}
                </Button>
              </div>
            </form>
          </Form>
        </div>

        {/* Trust Signals Sidebar */}
        <div className="space-y-4">
          <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200">
            <div className="flex items-center gap-3 mb-4 text-slate-900">
              <Clock className="w-6 h-6 text-primary" />
              <h3 className="font-bold text-lg">Fast Turnaround</h3>
            </div>
            <p className="text-sm font-medium text-slate-600">
              Most reviews are completed within 24 business hours by our design team.
            </p>
          </div>

          <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200">
            <div className="flex items-center gap-3 mb-4 text-slate-900">
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              <h3 className="font-bold text-lg">Human Verified</h3>
            </div>
            <ul className="text-sm font-medium text-slate-600 space-y-3">
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0"/>
                Accurate geometric measurements
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0"/>
                Optimal power supply placement
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0"/>
                Confirmed pricing guarantee
              </li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
}
