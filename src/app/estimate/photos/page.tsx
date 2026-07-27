"use client";

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useQuoteStore } from '@/store/quoteStore';
import { ChevronLeft, Image as ImageIcon, Trash2, UploadCloud, Edit3, ArrowRight, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import PhotoAnnotator, { AnnotationLine, Plane } from '@/components/PhotoAnnotator';

export default function PhotosPage() {
  const router = useRouter();
  const { setMethod, setStatus, quote, addPhoto, removePhoto, updatePhoto, setFeet } = useQuoteStore();
  const [isClient, setIsClient] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previewsRef = useRef<Record<string, string>>({});
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [annotatingPhotoId, setAnnotatingPhotoId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsClient(true);
    setMethod('photos');
  }, [setMethod]);

  // Clean up object URLs strictly on final unmount
  useEffect(() => {
    return () => {
      Object.values(previewsRef.current).forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    
    if (!file.type.startsWith('image/')) {
      setError("Please select a valid image file (JPEG, PNG).");
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      setError("File is too large. Maximum size is 5MB.");
      return;
    }

    const id = crypto.randomUUID();
    
    // Optimistic local preview
    const previewUrl = URL.createObjectURL(file);
    const newPreviews = { ...previews, [id]: previewUrl };
    setPreviews(newPreviews);
    previewsRef.current = newPreviews;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', 'property-photos');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const data: { path: string } = await res.json();

      addPhoto({
        id,
        name: file.name,
        size: file.size,
        type: file.type,
        // eslint-disable-next-line react-hooks/purity
        createdAt: Date.now(),
        annotations: [],
        storagePath: data.path,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to upload photo. Please try again.");
      handleRemove(id);
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleRemove = (id: string) => {
    removePhoto(id);
    if (previews[id]) {
      if (previews[id].startsWith('blob:')) URL.revokeObjectURL(previews[id]);
      setPreviews(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
    if (annotatingPhotoId === id) setAnnotatingPhotoId(null);
  };

  const onSaveAnnotations = (result: {
    lines: AnnotationLine[];
    isCalibrated?: boolean;
    planesData?: unknown;
    planes?: unknown;
    validationWarning?: string;
  }) => {
    if (annotatingPhotoId) {
      updatePhoto(annotatingPhotoId, { 
        annotations: result.lines,
        calibrationResult: {
          isCalibrated: result.isCalibrated,
          planesData: result.planesData,
          planes: result.planes,
          validationWarning: result.validationWarning
        }
      });
    }
    setAnnotatingPhotoId(null);
  };

  const onContinue = async () => {
    if (quote.uploadedPhotos.length === 0) {
      setError("Please upload at least one photo.");
      return;
    }
    
    let totalTargetLengthFeet = 0;
    let allCalibrated = true;
    let hasTargets = false;

    for (const photo of quote.uploadedPhotos) {
      const p = photo as typeof photo & {
        calibrationResult?: { planesData?: Record<string, { isValid?: boolean; calibrationRatio?: number }> };
      };
      const targets = (p.annotations as AnnotationLine[] | undefined)?.filter((line) => line.type === 'target') || [];
      const planesData = p.calibrationResult?.planesData || {};

      if (targets.length > 0) {
        hasTargets = true;
        const invalidTargets = targets.filter((target) => !planesData[target.planeId]?.isValid);
        
        if (invalidTargets.length > 0) {
          allCalibrated = false;
        } else {
          targets.forEach((target) => {
            const ratio = planesData[target.planeId]?.calibrationRatio;
            if (ratio) {
              if (target.pixels) totalTargetLengthFeet += target.pixels / ratio;
            }
          });
        }
      }
    }

    if (hasTargets && allCalibrated) {
      setIsUploading(true);
      setError(null);
      try {
        const { calculateEstimate } = await import('@/app/actions/calculate');
        const result = await calculateEstimate({
          coverage: "photo-measured",
          stories: quote.property?.stories === '4+' ? 4 : Number(quote.property?.stories || 1),
          roofComplexity: quote.property?.roofComplexity || "average",
          peaks: 0,
          customerProvidedFeet: totalTargetLengthFeet
        });

        if (!result.success) {
          setError(result.error || "Calculation failed.");
          return;
        }

        setFeet(totalTargetLengthFeet, 'customer');
        setFeet(result.estimatedLinearFeet, 'estimated');
        
        useQuoteStore.getState().setCalculationResult(result);
        setStatus('preliminary', 'medium');
        router.push('/estimate/result');
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to calculate.");
      } finally {
        setIsUploading(false);
      }
    } else {
      setStatus('ready-for-review', 'not-calculated');
      router.push('/estimate/expert-review');
    }
  };

  if (!isClient) return null;

  return (
    <div className="max-w-[1200px] mx-auto animate-in fade-in duration-300 pb-20 px-4 sm:px-6">
      
      {/* Header and Progress */}
      <div className="flex items-center justify-between mb-8">
        <Button variant="ghost" size="sm" asChild className="-ml-4 text-slate-500 hover:text-slate-900 focus-ring">
          <Link href="/estimate">
            <ChevronLeft className="w-5 h-5 mr-1" /> Back
          </Link>
        </Button>
      </div>

      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">Upload House Photos</h1>
          <p className="text-lg text-slate-600 font-medium">Upload photos of your home. You can optionally draw on them to measure lengths.</p>
        </div>
        
        <div className="hidden md:flex items-center gap-3">
          <Button 
            onClick={onContinue} 
            disabled={quote.uploadedPhotos.length === 0 || annotatingPhotoId !== null || isUploading}
            className="py-6 px-8 text-lg font-bold bg-primary hover:bg-primary/90 text-white shadow-md transition-transform active:scale-[0.98]"
          >
            {isUploading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : 'Continue'}
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

      {annotatingPhotoId && previews[annotatingPhotoId] ? (
        <div className="bg-slate-950 rounded-3xl overflow-hidden card-shadow animate-in slide-in-from-bottom-4 zoom-in-95 duration-300">
          <PhotoAnnotator 
            imageUrl={previews[annotatingPhotoId]}
            initialLines={(quote.uploadedPhotos.find(p => p.id === annotatingPhotoId)?.annotations as AnnotationLine[]) || []}
            initialPlanes={((quote.uploadedPhotos.find(p => p.id === annotatingPhotoId) as typeof quote.uploadedPhotos[number] & { calibrationResult?: { planes?: Plane[] } } | undefined)?.calibrationResult?.planes) || []}
            onSave={onSaveAnnotations}
            onCancel={() => setAnnotatingPhotoId(null)}
          />
        </div>
      ) : (
        <div className="bg-white p-6 sm:p-8 rounded-3xl card-shadow border border-slate-200">
          
          {/* Upload Dropzone */}
          <div className="border-2 border-dashed border-primary/30 rounded-2xl p-10 text-center bg-blue-50/30 hover:bg-blue-50/60 transition-colors mb-8 group">
            <input 
              type="file" 
              id="photo-upload" 
              className="hidden" 
              accept="image/jpeg, image/png, image/webp"
              onChange={handleFileChange}
              disabled={isUploading}
            />
            <label htmlFor="photo-upload" className={`cursor-pointer flex flex-col items-center focus-visible:outline-none ${isUploading ? 'opacity-50' : ''}`}>
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 group-hover:scale-105 transition-transform">
                {isUploading ? <Loader2 className="w-8 h-8 text-primary animate-spin" /> : <UploadCloud className="w-8 h-8 text-primary" />}
              </div>
              <div className="text-lg font-bold text-slate-900 mb-1">{isUploading ? 'Uploading...' : 'Click to upload photos'}</div>
              <div className="text-sm font-medium text-slate-500">PNG or JPG up to 5MB</div>
            </label>
          </div>

          {/* Photo Grid */}
          {quote.uploadedPhotos.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-slate-400" />
                Uploaded Photos <span className="text-slate-400 text-sm font-medium">({quote.uploadedPhotos.length})</span>
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {quote.uploadedPhotos.map((photo) => {
                  const p = photo as typeof photo & { calibrationResult?: { isCalibrated?: boolean } };
                  const isCalibrated = p.calibrationResult?.isCalibrated;
                  
                  return (
                    <div key={photo.id} className="relative group rounded-2xl overflow-hidden border border-slate-200 aspect-square bg-slate-100 shadow-sm transition-all hover:shadow-md">
                      {previews[photo.id] ? (
                        <Image
                          src={previews[photo.id]}
                          alt={photo.name}
                          fill
                          unoptimized
                          sizes="(max-width: 768px) 50vw, 25vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-4">
                          <Loader2 className="w-8 h-8 text-slate-400 animate-spin mb-2" />
                          <span className="text-xs text-slate-500 text-center truncate w-full" title={photo.name}>{photo.name}</span>
                        </div>
                      )}
                      
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[1px]">
                        <button
                          onClick={() => setAnnotatingPhotoId(photo.id)}
                          className="bg-white p-3 rounded-full text-primary hover:text-primary hover:scale-110 transition-all shadow-lg"
                          aria-label="Annotate photo"
                        >
                          <Edit3 className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleRemove(photo.id)}
                          className="bg-white p-3 rounded-full text-slate-600 hover:text-red-600 hover:scale-110 transition-all shadow-lg"
                          aria-label={`Remove ${photo.name}`}
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Status Badges */}
                      <div className="absolute top-3 left-3 flex flex-col gap-1 pointer-events-none">
                        {isCalibrated && (
                          <div className="bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-lg shadow-sm flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Calibrated
                          </div>
                        )}
                        {photo.annotations && photo.annotations.length > 0 && !isCalibrated && (
                          <div className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-lg shadow-sm">
                            Lines Drawn
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mobile Actions */}
      <div className="md:hidden mt-8 flex flex-col gap-3">
        <Button 
          onClick={onContinue} 
          disabled={quote.uploadedPhotos.length === 0 || annotatingPhotoId !== null || isUploading}
          className="w-full py-7 text-lg font-bold bg-primary hover:bg-primary/90 text-white shadow-md active:scale-[0.98]"
        >
          {isUploading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : 'Continue'}
          {!isUploading && <ArrowRight className="w-5 h-5 ml-2" />}
        </Button>
      </div>

    </div>
  );
}
