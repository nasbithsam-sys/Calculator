"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useQuoteStore } from '@/store/quoteStore';
import { ChevronLeft, Image as ImageIcon, Trash2, UploadCloud, Edit3 } from 'lucide-react';
import Link from 'next/link';
import PhotoAnnotator, { AnnotationLine } from '@/components/PhotoAnnotator';

export default function PhotosPage() {
  const router = useRouter();
  const { setMethod, setStatus, quote, addPhoto, removePhoto, updatePhoto, setFeet } = useQuoteStore();
  const [isClient, setIsClient] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previewsRef = useRef<Record<string, string>>({});
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [annotatingPhotoId, setAnnotatingPhotoId] = useState<string | null>(null);

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

  const [isUploading, setIsUploading] = useState(false);

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

    const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
    
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

      const data = await res.json();

      // Replace local preview with server signed URL for persistence across reloads
      setPreviews(prev => ({ ...prev, [id]: data.url }));
      previewsRef.current = { ...previewsRef.current, [id]: data.url };

      addPhoto({
        id,
        name: file.name,
        size: file.size,
        type: file.type,
        createdAt: Date.now(),
        annotations: [],
        storagePath: data.path, // We would need to add this to QuoteData type if not already there, but for now we'll just store it if needed
      });
    } catch (err: any) {
      setError(err.message || "Failed to upload photo. Please try again.");
      // Rollback optimistic preview
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

  const onSaveAnnotations = (result: any) => {
    if (annotatingPhotoId) {
      updatePhoto(annotatingPhotoId, { 
        annotations: result.lines,
        calibrationResult: {
          isCalibrated: result.isCalibrated,
          calibrationRatio: result.calibrationRatio,
          validationWarning: result.validationWarning
        }
      } as any);
    }
    setAnnotatingPhotoId(null);
  };

  const onContinue = async () => {
    if (quote.uploadedPhotos.length === 0) {
      setError("Please upload at least one photo.");
      return;
    }
    
    // Check if ALL photos with targets are calibrated
    let totalTargetLengthFeet = 0;
    let allCalibrated = true;
    let hasTargets = false;

    for (const photo of quote.uploadedPhotos) {
      const p = photo as any;
      const targets = p.annotations?.filter((l: any) => l.type === 'target') || [];
      if (targets.length > 0) {
        hasTargets = true;
        if (!p.calibrationResult?.isCalibrated) {
          allCalibrated = false;
        } else {
          // Calculate length for targets in this photo
          targets.forEach((t: any) => {
            totalTargetLengthFeet += t.pixels / p.calibrationResult.calibrationRatio;
          });
        }
      }
    }

    if (hasTargets && allCalibrated) {
      // Scaled calculation
      setIsUploading(true);
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
        
        // Dynamic import because setCalculationResult wasn't in original imports of this file
        useQuoteStore.getState().setCalculationResult(result as any);
        setStatus('preliminary', 'medium');
        router.push('/estimate/result');
      } catch (err: any) {
        setError(err.message || "Failed to calculate.");
      } finally {
        setIsUploading(false);
      }
    } else {
      // Expert Review
      setStatus('ready-for-review', 'not-calculated');
      router.push('/estimate/expert-review');
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
          <CardTitle>Upload House Photos</CardTitle>
          <CardDescription>
            Upload clear photos of the areas where you want permanent lights installed. Click the edit icon to draw lighting lines.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center bg-slate-50 hover:bg-slate-100 transition-colors">
            <input 
              type="file" 
              id="photo-upload" 
              className="hidden" 
              accept="image/jpeg, image/png, image/webp"
              onChange={handleFileChange}
            />
            <label htmlFor="photo-upload" className="cursor-pointer flex flex-col items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 rounded-sm">
              <UploadCloud className="w-10 h-10 text-slate-400 mb-4" />
              <div className="text-sm font-medium text-slate-900 mb-1">Click to upload a photo</div>
              <div className="text-xs text-slate-500">PNG, JPG up to 5MB</div>
            </label>
          </div>
          
          {error && (
            <div className="text-sm font-medium text-destructive" aria-live="polite">{error}</div>
          )}

          {quote.uploadedPhotos.length > 0 && !annotatingPhotoId && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-slate-900">Uploaded Photos</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {quote.uploadedPhotos.map((photo) => (
                  <div key={photo.id} className="relative group rounded-lg overflow-hidden border border-slate-200 aspect-square bg-slate-100">
                    {previews[photo.id] ? (
                      <img src={previews[photo.id]} alt={photo.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-4">
                        <ImageIcon className="w-8 h-8 text-slate-400 mb-2" />
                        <span className="text-xs text-slate-500 text-center truncate w-full" title={photo.name}>{photo.name}</span>
                        <span className="text-[10px] text-orange-500 mt-1 text-center font-medium">Please re-upload</span>
                      </div>
                    )}
                    
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        onClick={() => setAnnotatingPhotoId(photo.id)}
                        className="bg-white p-2 rounded-full text-blue-600 hover:text-blue-700 hover:scale-105 transition-all"
                        aria-label="Annotate photo"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleRemove(photo.id)}
                        className="bg-white p-2 rounded-full text-slate-600 hover:text-destructive hover:scale-105 transition-all"
                        aria-label={`Remove ${photo.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {photo.annotations && photo.annotations.length > 0 && (
                      <div className="absolute bottom-2 left-2 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">
                        Annotated
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {annotatingPhotoId && previews[annotatingPhotoId] && (
            <div className="border rounded-xl p-4 bg-slate-50">
              <PhotoAnnotator 
                imageUrl={previews[annotatingPhotoId]}
                initialLines={(quote.uploadedPhotos.find(p => p.id === annotatingPhotoId)?.annotations as AnnotationLine[]) || []}
                onSave={onSaveAnnotations}
                onCancel={() => setAnnotatingPhotoId(null)}
              />
            </div>
          )}

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <Button onClick={onContinue} disabled={quote.uploadedPhotos.length === 0 || annotatingPhotoId !== null || isUploading} className="w-full sm:w-auto">
              {isUploading ? "Processing..." : "Continue"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
