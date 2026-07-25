"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useQuoteStore } from '@/store/quoteStore';
import { ChevronLeft, FileText, Trash2, UploadCloud } from 'lucide-react';
import Link from 'next/link';

export default function PlanPage() {
  const router = useRouter();
  const { setMethod, setStatus, quote, addPlan, removePlan } = useQuoteStore();
  const [isClient, setIsClient] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previewsRef = useRef<Record<string, string>>({});
  const [previews, setPreviews] = useState<Record<string, string>>({});

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsClient(true);
    setMethod('plan');
  }, [setMethod]);

  useEffect(() => {
    return () => {
      Object.values(previewsRef.current).forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    
    // Validate size (max 10MB for plans)
    if (file.size > 10 * 1024 * 1024) {
      setError("File is too large. Maximum size is 10MB.");
      return;
    }

    const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
    
    let previewUrl = null;
    if (file.type.startsWith('image/')) {
      previewUrl = URL.createObjectURL(file);
      const newPreviews = { ...previews, [id]: previewUrl };
      setPreviews(newPreviews);
      previewsRef.current = newPreviews;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', 'property-plans');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await res.json();

      if (previewUrl) {
        setPreviews(prev => ({ ...prev, [id]: data.url }));
        previewsRef.current = { ...previewsRef.current, [id]: data.url };
      }

      addPlan({
        id,
        name: file.name,
        size: file.size,
        type: file.type,
        createdAt: Date.now(),
        storagePath: data.path,
      });
    } catch (err: any) {
      setError(err.message || "Failed to upload plan. Please try again.");
      handleRemove(id);
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleRemove = (id: string) => {
    removePlan(id);
    if (previews[id]) {
      if (previews[id].startsWith('blob:')) URL.revokeObjectURL(previews[id]);
      setPreviews(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  const onContinue = () => {
    if (quote.uploadedPlans.length === 0) {
      setError("Please upload at least one plan or drawing.");
      return;
    }
    
    setStatus('ready-for-review', 'not-calculated');
    router.push('/estimate/result');
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
          <CardTitle>Upload a Plan or Drawing</CardTitle>
          <CardDescription>
            Upload architectural plans or drawings of your property for an accurate estimate.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center bg-slate-50 hover:bg-slate-100 transition-colors">
            <input 
              type="file" 
              id="plan-upload" 
              className="hidden" 
              accept="image/jpeg, image/png, image/webp, application/pdf"
              onChange={handleFileChange}
            />
            <label htmlFor="plan-upload" className="cursor-pointer flex flex-col items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 rounded-sm">
              <UploadCloud className="w-10 h-10 text-slate-400 mb-4" />
              <div className="text-sm font-medium text-slate-900 mb-1">Click to upload a plan</div>
              <div className="text-xs text-slate-500">PDF, PNG, JPG up to 10MB</div>
            </label>
          </div>
          
          {error && (
            <div className="text-sm font-medium text-destructive" aria-live="polite">{error}</div>
          )}

          {quote.uploadedPlans.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-slate-900">Uploaded Plans</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {quote.uploadedPlans.map((plan) => (
                  <div key={plan.id} className="relative group rounded-lg overflow-hidden border border-slate-200 aspect-square bg-slate-100">
                    {previews[plan.id] ? (
                      <img src={previews[plan.id]} alt={plan.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-4">
                        <FileText className="w-8 h-8 text-slate-400 mb-2" />
                        <span className="text-xs text-slate-500 text-center truncate w-full" title={plan.name}>{plan.name}</span>
                        {plan.type.startsWith('image/') && <span className="text-[10px] text-orange-500 mt-1 text-center font-medium">Please re-upload</span>}
                      </div>
                    )}
                    <button 
                      onClick={() => handleRemove(plan.id)}
                      className="absolute top-2 right-2 bg-white/90 p-1.5 rounded-md text-slate-600 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity focus-visible:opacity-100"
                      aria-label={`Remove ${plan.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <Button onClick={onContinue} disabled={quote.uploadedPlans.length === 0} className="w-full sm:w-auto">
              Submit for Review
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
