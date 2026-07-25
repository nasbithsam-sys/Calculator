"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useQuoteStore } from '@/store/quoteStore';
import { ChevronLeft, FileText, Trash2, UploadCloud, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function PlanPage() {
  const router = useRouter();
  const { setMethod, setStatus, quote, addPlan, removePlan } = useQuoteStore();
  const [isClient, setIsClient] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previewsRef = useRef<Record<string, string>>({});
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setMethod('plan');
  }, [setMethod]);

  useEffect(() => {
    return () => {
      Object.values(previewsRef.current).forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

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
    <div className="max-w-[1200px] mx-auto animate-in fade-in duration-300 pb-20 px-4 sm:px-6">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Button variant="ghost" size="sm" asChild className="-ml-4 text-slate-500 hover:text-slate-900 focus-ring">
          <Link href="/estimate">
            <ChevronLeft className="w-5 h-5 mr-1" /> Back
          </Link>
        </Button>
      </div>

      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">Upload Architectural Plans</h1>
          <p className="text-lg text-slate-600 font-medium">Have blueprints or sketches? Upload them here, and our experts will review them to generate an accurate estimate.</p>
        </div>
        
        <div className="hidden md:flex items-center gap-3">
          <Button 
            onClick={onContinue} 
            disabled={quote.uploadedPlans.length === 0 || isUploading}
            className="py-6 px-8 text-lg font-bold bg-primary hover:bg-primary/90 text-white shadow-md transition-transform active:scale-[0.98]"
          >
            {isUploading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : 'Submit for Review'}
            {!isUploading && <ArrowRight className="w-5 h-5 ml-2" />}
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 p-4 rounded-xl flex items-start gap-3 shadow-sm animate-in fade-in">
          <AlertCircle className="w-6 h-6 shrink-0 text-red-600 mt-0.5" />
          <div className="text-sm font-bold text-red-800 leading-relaxed">{error}</div>
        </div>
      )}

      <div className="bg-white p-6 sm:p-8 rounded-3xl card-shadow border border-slate-200">
        
        {/* Upload Dropzone */}
        <div className="border-2 border-dashed border-primary/30 rounded-2xl p-10 text-center bg-blue-50/30 hover:bg-blue-50/60 transition-colors mb-8 group">
          <input 
            type="file" 
            id="plan-upload" 
            className="hidden" 
            accept="image/jpeg, image/png, image/webp, application/pdf"
            onChange={handleFileChange}
            disabled={isUploading}
          />
          <label htmlFor="plan-upload" className={`cursor-pointer flex flex-col items-center focus-visible:outline-none ${isUploading ? 'opacity-50' : ''}`}>
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 group-hover:scale-105 transition-transform">
              {isUploading ? <Loader2 className="w-8 h-8 text-primary animate-spin" /> : <UploadCloud className="w-8 h-8 text-primary" />}
            </div>
            <div className="text-lg font-bold text-slate-900 mb-1">{isUploading ? 'Uploading...' : 'Click to upload plans'}</div>
            <div className="text-sm font-medium text-slate-500">PDF, PNG, or JPG up to 10MB</div>
          </label>
        </div>

        {/* File Grid */}
        {quote.uploadedPlans.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-slate-400" />
              Uploaded Files <span className="text-slate-400 text-sm font-medium">({quote.uploadedPlans.length})</span>
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {quote.uploadedPlans.map((plan) => (
                <div key={plan.id} className="relative group rounded-2xl overflow-hidden border border-slate-200 aspect-square bg-slate-50 shadow-sm transition-all hover:shadow-md">
                  {previews[plan.id] ? (
                    <img src={previews[plan.id]} alt={plan.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-slate-100">
                      <FileText className="w-12 h-12 text-slate-400 mb-3" />
                      <span className="text-sm font-bold text-slate-700 text-center truncate w-full" title={plan.name}>{plan.name}</span>
                      {plan.type === 'application/pdf' && <span className="text-xs text-slate-500 mt-1 font-medium bg-slate-200 px-2 py-0.5 rounded-full">PDF Document</span>}
                    </div>
                  )}
                  
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[1px]">
                    <button 
                      onClick={() => handleRemove(plan.id)}
                      className="bg-white p-3 rounded-full text-slate-600 hover:text-red-600 hover:scale-110 transition-all shadow-lg"
                      aria-label={`Remove ${plan.name}`}
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Mobile Actions */}
      <div className="md:hidden mt-8 flex flex-col gap-3">
        <Button 
          onClick={onContinue} 
          disabled={quote.uploadedPlans.length === 0 || isUploading}
          className="w-full py-7 text-lg font-bold bg-primary hover:bg-primary/90 text-white shadow-md active:scale-[0.98]"
        >
          {isUploading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : 'Submit for Review'}
          {!isUploading && <ArrowRight className="w-5 h-5 ml-2" />}
        </Button>
      </div>

    </div>
  );
}
