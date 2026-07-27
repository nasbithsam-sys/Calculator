"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useQuoteStore } from '@/store/quoteStore';
import { ChevronLeft, Trash2, UploadCloud, ArrowRight, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

type WalkaroundStep = 'front' | 'sides' | 'rear';
type UploadedVideo = {
  id: string;
  name: string;
  size: number;
  type: string;
  createdAt: number;
  storagePath: string;
  videoMetadata: {
    viewLabel: WalkaroundStep;
  };
};

export default function VideoPage() {
  const router = useRouter();
  const { setMethod, setStatus, setVideos: saveVideosToStore } = useQuoteStore();
  const [isClient, setIsClient] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [videos, setVideos] = useState<Record<WalkaroundStep, UploadedVideo | null>>({
    front: null,
    sides: null,
    rear: null
  });

  const [uploadingState, setUploadingState] = useState<Record<WalkaroundStep, { isUploading: boolean; progress: number }>>({
    front: { isUploading: false, progress: 0 },
    sides: { isUploading: false, progress: 0 },
    rear: { isUploading: false, progress: 0 }
  });

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsClient(true);
    setMethod('video');
  }, [setMethod]);

  const uploadFileChunked = async (file: File, step: WalkaroundStep) => {
    setUploadingState(prev => ({ ...prev, [step]: { isUploading: true, progress: 0 } }));
    setError(null);
    try {
      // 1. Get signed upload URL
      const resUrl = await fetch('/api/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          bucket: 'property-videos',
          contentType: file.type
        })
      });

      if (!resUrl.ok) {
        throw new Error("Failed to get upload URL");
      }

      const { signedUrl, path }: { signedUrl: string; path: string } = await resUrl.json();

      // 2. Perform chunked/streamed PUT upload
      // For simplicity in standard browsers without XHR upload progress, we just PUT it
      // using XHR to track progress
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', signedUrl, true);
        xhr.setRequestHeader('Content-Type', file.type);
        
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100);
            setUploadingState(prev => ({ ...prev, [step]: { isUploading: true, progress } }));
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(xhr.responseText);
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        };

        xhr.onerror = () => reject(new Error("XHR Network Error"));
        xhr.send(file);
      });

      const videoData = {
        id: crypto.randomUUID(),
        name: file.name,
        size: file.size,
        type: file.type,
        // eslint-disable-next-line react-hooks/purity
        createdAt: Date.now(),
        storagePath: path,
        videoMetadata: {
          viewLabel: step,
        },
      };

      setVideos(prev => ({ ...prev, [step]: videoData }));

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to upload video.");
    } finally {
      setUploadingState(prev => ({ ...prev, [step]: { isUploading: false, progress: 0 } }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, step: WalkaroundStep) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    if (!file.type.startsWith('video/')) {
      setError("Please select a valid video file.");
      return;
    }
    
    if (file.size > 200 * 1024 * 1024) {
      setError("File is too large. Maximum size is 200MB.");
      return;
    }

    uploadFileChunked(file, step);
    e.target.value = '';
  };

  const removeVideo = (step: WalkaroundStep) => {
    setVideos(prev => ({ ...prev, [step]: null }));
  };

  const onContinue = () => {
    // Collect videos and store in quote
    const allVideos = Object.values(videos).filter((video): video is UploadedVideo => Boolean(video));
    if (allVideos.length === 0) {
      setError("Please upload at least one video to proceed.");
      return;
    }

    saveVideosToStore(allVideos);
    setStatus('ready-for-review', 'not-calculated');
    router.push('/estimate/expert-review');
  };

  if (!isClient) return null;

  const steps: { key: WalkaroundStep; title: string; desc: string }[] = [
    { key: 'front', title: 'Front of House', desc: 'Walk slowly across the front yard, capturing the full roofline.' },
    { key: 'sides', title: 'Sides', desc: 'Record both sides of the house, showing roof peaks.' },
    { key: 'rear', title: 'Rear / Backyard', desc: 'Capture the back of the house clearly.' }
  ];

  const allUploading = Object.values(uploadingState).some(s => s.isUploading);

  return (
    <div className="max-w-[1200px] mx-auto animate-in fade-in duration-300 pb-20 px-4 sm:px-6">
      <div className="flex items-center justify-between mb-8">
        <Button variant="ghost" size="sm" asChild className="-ml-4 text-slate-500 hover:text-slate-900 focus-ring">
          <Link href="/estimate">
            <ChevronLeft className="w-5 h-5 mr-1" /> Back
          </Link>
        </Button>
      </div>

      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">Video Walkaround</h1>
          <p className="text-lg text-slate-600 font-medium">Record short videos of your property to get an accurate expert estimate.</p>
        </div>
        
        <div className="hidden md:flex items-center gap-3">
          <Button 
            onClick={onContinue} 
            disabled={allUploading || Object.values(videos).filter(Boolean).length === 0}
            className="py-6 px-8 text-lg font-bold bg-primary hover:bg-primary/90 text-white shadow-md transition-transform active:scale-[0.98]"
          >
            {allUploading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : 'Continue'}
            {!allUploading && <ArrowRight className="w-5 h-5 ml-2" />}
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 p-4 rounded-xl flex items-start gap-3 shadow-sm animate-in fade-in">
          <AlertCircle className="w-6 h-6 shrink-0 text-red-600 mt-0.5" />
          <div className="text-sm font-bold text-red-800 leading-relaxed">{error}</div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {steps.map(step => {
          const video = videos[step.key];
          const isUploading = uploadingState[step.key].isUploading;
          const progress = uploadingState[step.key].progress;

          return (
            <div key={step.key} className="bg-white p-6 rounded-3xl card-shadow border border-slate-200 flex flex-col h-full">
              <div className="mb-4">
                <h3 className="text-xl font-bold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-sm text-slate-500">{step.desc}</p>
              </div>

              <div className="flex-1 flex flex-col justify-end">
                {video ? (
                  <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="bg-emerald-100 p-2 rounded-full">
                        <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                      </div>
                      <div className="truncate">
                        <p className="text-sm font-bold text-slate-900 truncate">{video.name}</p>
                        <p className="text-xs text-slate-500">{(video.size / (1024 * 1024)).toFixed(1)} MB</p>
                      </div>
                    </div>
                    <button onClick={() => removeVideo(step.key)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors shrink-0">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <div className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition-colors group ${isUploading ? 'border-primary/50 bg-blue-50/50' : 'border-primary/30 bg-blue-50/30 hover:bg-blue-50/60'}`}>
                    {isUploading ? (
                      <div className="flex flex-col items-center py-4">
                        <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
                        <div className="text-sm font-bold text-slate-900 mb-1">Uploading... {progress}%</div>
                        <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
                          <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <input 
                          type="file" 
                          id={`video-upload-${step.key}`}
                          className="hidden" 
                          accept="video/mp4, video/quicktime, video/webm"
                          onChange={(e) => handleFileChange(e, step.key)}
                        />
                        <label htmlFor={`video-upload-${step.key}`} className="cursor-pointer flex flex-col items-center">
                          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-3 group-hover:scale-105 transition-transform">
                            <UploadCloud className="w-6 h-6 text-primary" />
                          </div>
                          <div className="text-sm font-bold text-slate-900 mb-1">Upload Video</div>
                          <div className="text-xs font-medium text-slate-500">MP4 or MOV up to 200MB</div>
                        </label>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="md:hidden mt-8 flex flex-col gap-3">
        <Button 
          onClick={onContinue} 
          disabled={allUploading || Object.values(videos).filter(Boolean).length === 0}
          className="w-full py-7 text-lg font-bold bg-primary hover:bg-primary/90 text-white shadow-md active:scale-[0.98]"
        >
          {allUploading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : 'Continue'}
          {!allUploading && <ArrowRight className="w-5 h-5 ml-2" />}
        </Button>
      </div>
    </div>
  );
}
