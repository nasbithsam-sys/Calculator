"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
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
import { ChevronLeft, Loader2, Send, ShieldCheck, MapPin, Image as ImageIcon, FileText, Video as VideoIcon, Ruler } from 'lucide-react';

const contactSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  preference: z.enum(['email', 'phone', 'text', 'video'], { message: "Please select a contact preference" }),
  videoWindow: z.string().optional(),
}).refine(data => {
  if (data.preference === 'video' && !data.videoWindow) {
    return false;
  }
  return true;
}, {
  message: "Please select a time window for the video call",
  path: ["videoWindow"]
});

export default function ExpertReviewPage() {
  const router = useRouter();
  const { quote, setStatus, updateContact } = useQuoteStore();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => setIsClient(true), 0);
    return () => window.clearTimeout(timeout);
  }, []);

  const form = useForm<z.infer<typeof contactSchema>>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      firstName: quote.contact?.firstName || '',
      lastName: quote.contact?.lastName || '',
      email: quote.contact?.email || '',
      phone: quote.contact?.phone || '',
      preference: 'email',
      videoWindow: '',
    },
  });

  const watchPreference = useWatch({ control: form.control, name: "preference" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (data: z.infer<typeof contactSchema>) => {
    setIsSubmitting(true);
    setError(null);
    const contact = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      preferredContactMethod: data.preference === "video" ? "video" as const : data.preference,
      videoCallWindow: data.videoWindow,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
    updateContact(contact);
    
    const updatedQuote = { ...quote, contact: { ...quote.contact, ...contact } };
    
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
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 animate-in fade-in duration-300 pb-20">
      
      <div className="flex items-center justify-between mb-10">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="-ml-4 text-slate-500 hover:text-slate-900 focus-ring">
          <ChevronLeft className="w-5 h-5 mr-1" /> Back
        </Button>
      </div>

      <div className="mb-10 text-center space-y-3">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Request Expert Review</h1>
        <p className="text-lg text-slate-600 font-medium max-w-xl mx-auto">
          Our lighting designers will manually review the data below and prepare a confirmed quote.
        </p>
      </div>

      <div className="grid lg:grid-cols-[1fr_400px] gap-8">
        
        {/* Left Column: Huge Summary */}
        <div className="space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-3xl card-shadow border border-slate-200">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 border-b border-slate-100 pb-4">Data Summary</h2>
            
            <div className="space-y-6">
              {/* Address / Property Details */}
              {quote.property?.address && (
                <div className="flex items-start gap-4">
                  <div className="bg-blue-50 p-3 rounded-xl text-blue-600 shrink-0">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">Property Address</h3>
                    <p className="text-slate-600 mt-1">{quote.property.address}</p>
                    <div className="flex gap-4 mt-2 text-sm text-slate-500">
                      <span>Stories: {quote.property.stories || '1'}</span>
                      <span>Roof: {quote.property.roofComplexity || 'Average'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Photos */}
              {quote.uploadedPhotos && quote.uploadedPhotos.length > 0 && (
                <div className="flex items-start gap-4 border-t border-slate-100 pt-6">
                  <div className="bg-purple-50 p-3 rounded-xl text-purple-600 shrink-0">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                  <div className="w-full">
                    <h3 className="font-bold text-slate-900 text-lg">Uploaded Photos ({quote.uploadedPhotos.length})</h3>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {quote.uploadedPhotos.map((photo, i) => (
                        <div key={photo.id || i} className="bg-slate-100 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 truncate max-w-[200px]">
                          {photo.name}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Plans */}
              {quote.uploadedPlans && quote.uploadedPlans.length > 0 && (
                <div className="flex items-start gap-4 border-t border-slate-100 pt-6">
                  <div className="bg-orange-50 p-3 rounded-xl text-orange-600 shrink-0">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="w-full">
                    <h3 className="font-bold text-slate-900 text-lg">Architectural Plans ({quote.uploadedPlans.length})</h3>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {quote.uploadedPlans.map((plan, i) => (
                        <div key={plan.id || i} className="bg-slate-100 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 truncate max-w-[200px]">
                          {plan.name}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Videos */}
              {quote.uploadedVideos && quote.uploadedVideos.length > 0 && (
                <div className="flex items-start gap-4 border-t border-slate-100 pt-6">
                  <div className="bg-red-50 p-3 rounded-xl text-red-600 shrink-0">
                    <VideoIcon className="w-6 h-6" />
                  </div>
                  <div className="w-full">
                    <h3 className="font-bold text-slate-900 text-lg">Walkaround Videos ({quote.uploadedVideos.length})</h3>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {quote.uploadedVideos.map((video, i) => (
                        <div key={video.id || i} className="bg-slate-100 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 truncate max-w-[200px]">
                          {video.name}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Measurements */}
              {(quote.customerProvidedFeet || quote.estimatedLinearFeet) && (
                <div className="flex items-start gap-4 border-t border-slate-100 pt-6">
                  <div className="bg-emerald-50 p-3 rounded-xl text-emerald-600 shrink-0">
                    <Ruler className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">Measurements</h3>
                    {quote.customerProvidedFeet ? (
                      <p className="text-slate-600 mt-1">Provided Linear Feet: <span className="font-bold">{Math.round(quote.customerProvidedFeet)} ft</span></p>
                    ) : (
                      <p className="text-slate-600 mt-1">Estimated Linear Feet: <span className="font-bold">{quote.estimatedLinearFeet ? Math.round(quote.estimatedLinearFeet) : 'N/A'} ft</span></p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Contact Form */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl card-shadow border border-slate-200 h-fit">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><Send className="w-5 h-5" /></div>
            <h2 className="text-xl font-bold text-slate-900">Contact Preferences</h2>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700 font-bold text-sm">First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Jane" className="bg-slate-50/50 h-11 rounded-xl border-slate-200 focus:bg-white focus:border-primary" {...field} />
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
                      <FormLabel className="text-slate-700 font-bold text-sm">Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" className="bg-slate-50/50 h-11 rounded-xl border-slate-200 focus:bg-white focus:border-primary" {...field} />
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
                    <FormLabel className="text-slate-700 font-bold text-sm">Email Address</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="jane@example.com" className="bg-slate-50/50 h-11 rounded-xl border-slate-200 focus:bg-white focus:border-primary" {...field} />
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
                    <FormLabel className="text-slate-700 font-bold text-sm">Phone Number</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="(555) 123-4567" className="bg-slate-50/50 h-11 rounded-xl border-slate-200 focus:bg-white focus:border-primary" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="preference"
                render={({ field }) => (
                  <FormItem className="space-y-3 pt-2">
                    <FormLabel className="text-slate-700 font-bold text-sm">How would you like us to contact you?</FormLabel>
                    <FormControl>
                      <div className="grid grid-cols-2 gap-3">
                        {['email', 'text', 'phone', 'video'].map((pref) => (
                          <label key={pref} className={`flex items-center justify-center p-3 border rounded-xl cursor-pointer transition-colors ${field.value === pref ? 'bg-primary/10 border-primary text-primary font-bold' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                            <input 
                              type="radio" 
                              name="preference" 
                              value={pref} 
                              className="hidden" 
                              checked={field.value === pref}
                              onChange={(e) => field.onChange(e.target.value)}
                            />
                            {pref.charAt(0).toUpperCase() + pref.slice(1)} {pref === 'video' ? ' Call' : ''}
                          </label>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {watchPreference === 'video' && (
                <FormField
                  control={form.control}
                  name="videoWindow"
                  render={({ field }) => (
                    <FormItem className="animate-in fade-in slide-in-from-top-2">
                      <FormLabel className="text-slate-700 font-bold text-sm">Preferred Time Window</FormLabel>
                      <FormControl>
                        <select 
                          className="w-full bg-slate-50/50 h-11 rounded-xl border border-slate-200 px-3 focus:bg-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                          {...field}
                        >
                          <option value="">Select a time</option>
                          <option value="morning">Morning (9AM - 12PM)</option>
                          <option value="afternoon">Afternoon (12PM - 4PM)</option>
                          <option value="evening">Evening (4PM - 7PM)</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl text-sm font-bold flex items-start gap-3">
                  <div className="mt-0.5"><ShieldCheck className="w-5 h-5"/></div>
                  <div>{error}</div>
                </div>
              )}
              
              <div className="pt-4 mt-2">
                <Button type="submit" className="w-full py-6 text-lg font-bold bg-primary hover:bg-primary/90 text-white shadow-md transition-transform active:scale-[0.98] rounded-xl" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : 'Send Request'}
                </Button>
              </div>
            </form>
          </Form>
        </div>

      </div>
    </div>
  );
}
