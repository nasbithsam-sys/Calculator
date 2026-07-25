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
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useQuoteStore } from '@/store/quoteStore';
import { ChevronLeft, Loader2, Send } from 'lucide-react';
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
    
    // We pass the full updated quote data
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
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300 pb-20">
      <div className="flex items-center justify-between mb-8">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="-ml-4 text-slate-500 hover:text-slate-900">
          <ChevronLeft className="w-5 h-5 mr-1" />
          Back
        </Button>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Request Expert Review</h1>
        <p className="text-slate-500">Provide your contact details. Our lighting experts will review your property information and provide a confirmed quote.</p>
      </div>

      <Card className="border-slate-200 shadow-sm border-t-4 border-t-blue-600 overflow-hidden">
        <CardContent className="p-0">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="divide-y divide-slate-100">
              
              <div className="p-6 sm:p-8 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700">First Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Jane" className="bg-slate-50 border-slate-200 focus:bg-white" {...field} />
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
                        <FormLabel className="text-slate-700">Last Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Doe" className="bg-slate-50 border-slate-200 focus:bg-white" {...field} />
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
                      <FormLabel className="text-slate-700">Email Address</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="jane@example.com" className="bg-slate-50 border-slate-200 focus:bg-white" {...field} />
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
                      <FormLabel className="text-slate-700">Phone Number</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="(555) 123-4567" className="bg-slate-50 border-slate-200 focus:bg-white" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {error && (
                  <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl text-sm font-medium">
                    {error}
                  </div>
                )}
              </div>
              
              <div className="p-6 sm:p-8 bg-slate-50 flex justify-end">
                <Button type="submit" className="w-full sm:w-auto py-6 px-10 text-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Send className="w-5 h-5 mr-2" />}
                  {isSubmitting ? "Submitting..." : "Send Request"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
