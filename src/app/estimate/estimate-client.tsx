'use client';

import Link from 'next/link';
import { MapPin, Image as ImageIcon, Map as MapIcon, Zap, Ruler, FileText, UserCheck, Clock, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import type { ApplicationReadiness } from '@/lib/readiness';

export default function EstimateClient({ readiness }: { readiness: ApplicationReadiness }) {
  const methods = readiness.methods;

  return (
    <div className="space-y-12 animate-in fade-in duration-500 pb-16">
      
      {/* 1 & 2. Compact Hero with Roofline Illustration */}
      <section className="text-center max-w-3xl mx-auto space-y-6 pt-4 px-4">
        <div className="flex justify-center mb-6 text-primary">
          {/* Purpose-built roofline-light illustration */}
          <svg width="64" height="40" viewBox="0 0 64 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 24L32 4L60 24" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="12" cy="18" r="3" fill="currentColor" className="text-accent" />
            <circle cx="22" cy="11" r="3" fill="currentColor" className="text-accent" />
            <circle cx="32" cy="4" r="3" fill="currentColor" className="text-accent" />
            <circle cx="42" cy="11" r="3" fill="currentColor" className="text-accent" />
            <circle cx="52" cy="18" r="3" fill="currentColor" className="text-accent" />
          </svg>
        </div>
        <h1 className="text-4xl md:text-[52px] leading-tight font-extrabold tracking-tight text-slate-900">
          Get Your Permanent Lights Estimate
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto font-medium">
          Choose the easiest way to show us your home. You can receive an estimate using an address, photos, measurements, or a satellite map.
        </p>
        
        {/* 3. Short Trust Row */}
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm font-semibold text-slate-700 pt-4">
          <div className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-primary" /> Takes only a few minutes</div>
          <div className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-primary" /> Multiple estimate options</div>
          <div className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-primary" /> No obligation</div>
          <div className="flex items-center gap-1.5"><UserCheck className="w-4 h-4 text-primary" /> Expert review available</div>
        </div>
      </section>

      {/* 4. Featured Recommended Method (Address) */}
      <section className="max-w-4xl mx-auto">
        <FeaturedMethodCard 
          available={methods.addressAvailable}
          reason="Requires Google Maps API key to be configured in environment variables."
        />
      </section>

      {/* 5. Alternative Primary Methods */}
      <section className="max-w-6xl mx-auto space-y-6">
        <h3 className="text-xl font-bold text-center text-slate-800">Alternative Options</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <PrimaryMethodCard 
            href="/estimate/quick"
            icon={<Zap className="w-8 h-8 text-amber-500" />}
            title="Quick Estimate"
            description="Answer a few questions about your home's size and shape to receive an immediate price range."
            steps={['Answer questions', 'Review assumptions', 'Get price range']}
            time="Under 1 minute"
            available={methods.quickAvailable}
            reason="Requires active pricing configuration in admin settings."
          />

          <PrimaryMethodCard 
            href="/estimate/photos"
            icon={<ImageIcon className="w-8 h-8 text-purple-500" />}
            title="Upload House Photos"
            description="Take photos of your home, trace where you want lights, and we'll calculate the rest."
            steps={['Upload photos', 'Mark roofline', 'Receive estimate']}
            time="About 3 minutes"
            available={methods.photosAvailable}
            reason="Requires storage bucket and email provider setup."
          />

          <PrimaryMethodCard 
            href="/estimate/map"
            icon={<MapIcon className="w-8 h-8 text-emerald-500" />}
            title="Mark My Roofline"
            description="Draw the required lighting sections directly on a high-resolution satellite map."
            steps={['Find location', 'Draw sections', 'Calculate cost']}
            time="About 2 minutes"
            available={methods.mapAvailable}
            reason="Requires Maps API key and active pricing configuration."
          />
        </div>
      </section>

      {/* 6. Compact Additional Methods */}
      <section className="max-w-4xl mx-auto pt-8 border-t border-border">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 text-center mb-6">
          More ways to get an estimate
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SecondaryMethodCard 
            href="/estimate/measurements"
            icon={<Ruler className="w-5 h-5 text-slate-600" />}
            title="I Know My Measurements"
            available={methods.measurementsAvailable}
            reason="Requires pricing and verified products."
          />
          <SecondaryMethodCard 
            href="/estimate/plan"
            icon={<FileText className="w-5 h-5 text-slate-600" />}
            title="Upload a Plan or Drawing"
            available={methods.planAvailable}
            reason="Requires storage bucket and email provider setup."
          />
          <SecondaryMethodCard 
            href="/estimate/expert-review"
            icon={<UserCheck className="w-5 h-5 text-slate-600" />}
            title="Request Expert Review"
            available={true}
            reason=""
          />
        </div>
      </section>

      {/* 7. Method Comparison Help */}
      <section className="max-w-3xl mx-auto bg-blue-50/50 border border-blue-100 rounded-2xl p-6 sm:p-8 mt-12 text-center">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Not sure which method to use?</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-sm text-left max-w-2xl mx-auto">
          <div className="flex items-start gap-3">
            <span className="bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded text-xs mt-0.5 shrink-0">FASTEST</span>
            <span className="text-slate-700"><strong className="text-slate-900">Quick Estimate</strong> gets you a baseline range immediately.</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded text-xs mt-0.5 shrink-0">CONTROL</span>
            <span className="text-slate-700"><strong className="text-slate-900">Satellite Map</strong> gives you total control over measuring.</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="bg-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded text-xs mt-0.5 shrink-0">CUSTOM</span>
            <span className="text-slate-700"><strong className="text-slate-900">Photos</strong> is best if your home has unusual shapes or deep porches.</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded text-xs mt-0.5 shrink-0">EXACT</span>
            <span className="text-slate-700"><strong className="text-slate-900">Measurements</strong> is perfect if you already walked your house with a tape.</span>
          </div>
        </div>
      </section>

    </div>
  );
}

function PrimaryMethodCard({ 
  href, 
  icon, 
  title, 
  description,
  steps,
  time,
  available,
  reason
}: { 
  href: string, 
  icon: React.ReactNode, 
  title: string, 
  description: string,
  steps: [string, string, string],
  time: string,
  available: boolean,
  reason: string
}) {
  const [showReason, setShowReason] = useState(false);

  return (
    <Link 
      href={available ? href : '#'} 
      onClick={(e) => {
        if (!available) {
          e.preventDefault();
          setShowReason(true);
        }
      }}
      className={`group flex flex-col bg-white border rounded-2xl shadow-sm transition-all duration-200 focus-ring overflow-hidden ${
        available 
          ? 'border-slate-200 hover:border-blue-300 hover:shadow-md' 
          : 'border-slate-200 opacity-75 hover:border-slate-300'
      }`}
    >
      <div className="p-6 pb-4 relative">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-xl border transition-transform ${available ? 'bg-slate-50 border-slate-100 group-hover:scale-110' : 'bg-slate-100 border-slate-200 grayscale opacity-70'}`}>
            {icon}
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              {time}
            </div>
            {!available && (
              <div className="flex items-center text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 gap-1">
                <AlertCircle className="w-3 h-3" /> Needs Setup
              </div>
            )}
          </div>
        </div>
        <h3 className={`text-lg font-bold mb-2 transition-colors ${available ? 'text-slate-900 group-hover:text-blue-700' : 'text-slate-700'}`}>
          {title}
        </h3>
        <p className="text-slate-600 text-sm leading-relaxed mb-4">
          {description}
        </p>
        
        {showReason && !available && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800 animate-in fade-in zoom-in-95">
            {reason}
          </div>
        )}
      </div>
      
      {/* 3-step mini preview */}
      <div className={`mt-auto border-t p-4 ${available ? 'bg-slate-50 border-slate-100' : 'bg-slate-100 border-slate-200'}`}>
        <div className="flex items-center justify-between text-xs font-medium text-slate-500">
          <span className="flex-1 text-center">{steps[0]}</span>
          <ArrowRight className={`w-3 h-3 mx-1 flex-shrink-0 ${available ? 'text-slate-300' : 'text-slate-300'}`} />
          <span className="flex-1 text-center">{steps[1]}</span>
          <ArrowRight className={`w-3 h-3 mx-1 flex-shrink-0 ${available ? 'text-slate-300' : 'text-slate-300'}`} />
          <span className={`flex-1 text-center ${available ? 'text-blue-600' : 'text-slate-500'}`}>{steps[2]}</span>
        </div>
      </div>
    </Link>
  );
}

function FeaturedMethodCard({ available, reason }: { available: boolean; reason: string; }) {
  const [showReason, setShowReason] = useState(false);
  
  return (
    <Link 
      href={available ? "/estimate/address" : "#"} 
      onClick={(e) => {
        if (!available) {
          e.preventDefault();
          setShowReason(true);
        }
      }}
      className={`group block relative focus-ring rounded-2xl overflow-hidden ${!available ? 'opacity-90' : ''}`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br transition-transform duration-500 ${available ? 'from-blue-600 to-blue-800 opacity-100 group-hover:scale-105' : 'from-slate-600 to-slate-800 opacity-100'}`} />
      <div className={`relative p-1 bg-gradient-to-br rounded-2xl ${available ? 'from-blue-400/40 to-blue-900/40' : 'from-slate-400/40 to-slate-900/40'}`}>
        <div className="bg-slate-900 rounded-xl p-8 md:p-10 flex flex-col md:flex-row items-center gap-8 shadow-2xl relative">
          <div className={`p-6 rounded-2xl border flex-shrink-0 ${available ? 'bg-blue-600/20 border-blue-500/30' : 'bg-slate-600/20 border-slate-500/30 grayscale opacity-70'}`}>
            <MapPin className={`w-16 h-16 ${available ? 'text-blue-400' : 'text-slate-400'}`} />
          </div>
          <div className="flex-1 text-center md:text-left text-white">
            <div className="flex flex-col md:flex-row items-center gap-3 mb-4">
              <div className={`inline-block text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full ${available ? 'bg-blue-600' : 'bg-slate-700'}`}>
                Recommended
              </div>
              {!available && (
                <div className="flex items-center text-xs font-bold text-amber-200 bg-amber-900/50 px-3 py-1 rounded-full border border-amber-700/50 gap-1.5">
                  <AlertCircle className="w-4 h-4" /> Needs Setup
                </div>
              )}
            </div>
            
            <h2 className="text-3xl font-bold mb-3">Enter My Address</h2>
            <p className="text-slate-300 text-lg mb-6">
              Enter your address and we’ll open your property in satellite view to measure the exact linear footage needed.
            </p>
            
            {showReason && !available && (
              <div className="mb-6 p-4 bg-amber-900/30 border border-amber-700/50 rounded-lg text-sm text-amber-100 animate-in fade-in zoom-in-95">
                {reason}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center gap-4 text-sm font-medium">
              <div className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-lg text-slate-300 border border-slate-700">
                <Clock className={`w-4 h-4 ${available ? 'text-blue-400' : 'text-slate-400'}`} /> About 2 minutes
              </div>
              <div className={`flex items-center gap-2 transition-colors ${available ? 'text-blue-400 group-hover:text-blue-300' : 'text-slate-400'}`}>
                Start Satellite Measurement <ArrowRight className={`w-4 h-4 transition-transform ${available ? 'group-hover:translate-x-1' : ''}`} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

function SecondaryMethodCard({ href, icon, title, available, reason }: { href: string, icon: React.ReactNode, title: string, available: boolean, reason: string }) {
  const [showReason, setShowReason] = useState(false);
  
  return (
    <Link 
      href={available ? href : '#'} 
      onClick={(e) => {
        if (!available) {
          e.preventDefault();
          setShowReason(true);
        }
      }}
      className={`group focus-ring rounded-xl ${!available ? 'opacity-75' : ''}`}
    >
      <div className={`flex flex-col p-4 bg-white border rounded-xl transition-all h-full ${available ? 'border-slate-200 hover:border-blue-300 hover:shadow-sm' : 'border-slate-200 hover:border-slate-300'}`}>
        <div className="flex items-center text-left gap-4">
          <div className={`p-2 rounded-lg transition-colors ${available ? 'bg-slate-100 group-hover:bg-blue-50 group-hover:text-blue-600' : 'bg-slate-100 text-slate-400 grayscale'}`}>
            {icon}
          </div>
          <div className="flex-1 flex flex-col gap-1">
            <div className="flex items-center justify-between gap-2">
              <span className={`text-sm font-bold transition-colors ${available ? 'text-slate-800 group-hover:text-blue-700' : 'text-slate-700'}`}>{title}</span>
              {!available && (
                <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
              )}
            </div>
          </div>
          <ArrowRight className={`w-4 h-4 ml-auto transition-transform ${available ? 'text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1' : 'text-slate-200'}`} />
        </div>
        {showReason && !available && (
          <div className="mt-3 p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 animate-in fade-in zoom-in-95">
            {reason}
          </div>
        )}
      </div>
    </Link>
  );
}
