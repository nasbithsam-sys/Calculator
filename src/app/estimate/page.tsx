import Link from 'next/link';
import { MapPin, Image as ImageIcon, Map, Zap, Ruler, FileText, UserCheck, Clock, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function EstimateLandingPage() {
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
        <Link href="/estimate/address" className="group block relative focus-ring rounded-2xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-blue-800 opacity-100 transition-transform duration-500 group-hover:scale-105" />
          <div className="relative p-1 bg-gradient-to-br from-blue-400/40 to-blue-900/40 rounded-2xl">
            <div className="bg-slate-900 rounded-xl p-8 md:p-10 flex flex-col md:flex-row items-center gap-8 shadow-2xl">
              <div className="bg-blue-600/20 p-6 rounded-2xl border border-blue-500/30 flex-shrink-0">
                <MapPin className="w-16 h-16 text-blue-400" />
              </div>
              <div className="flex-1 text-center md:text-left text-white">
                <div className="inline-block bg-blue-600 text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-4">
                  Recommended
                </div>
                <h2 className="text-3xl font-bold mb-3">Enter My Address</h2>
                <p className="text-slate-300 text-lg mb-6">
                  Enter your address and we’ll open your property in satellite view to measure the exact linear footage needed.
                </p>
                <div className="flex flex-col sm:flex-row items-center gap-4 text-sm font-medium">
                  <div className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-lg text-slate-300 border border-slate-700">
                    <Clock className="w-4 h-4 text-blue-400" /> About 2 minutes
                  </div>
                  <div className="flex items-center gap-2 text-blue-400 group-hover:text-blue-300 transition-colors">
                    Start Satellite Measurement <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Link>
      </section>

      {/* 5. Alternative Primary Methods */}
      <section className="max-w-6xl mx-auto space-y-6">
        <h3 className="text-xl font-bold text-center text-slate-800">Alternative Options</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Quick Estimate */}
          <PrimaryMethodCard 
            href="/estimate/quick"
            icon={<Zap className="w-8 h-8 text-amber-500" />}
            title="Quick Estimate"
            description="Answer a few questions about your home's size and shape to receive an immediate price range."
            steps={['Answer questions', 'Review assumptions', 'Get price range']}
            time="Under 1 minute"
          />

          {/* Upload Photos */}
          <PrimaryMethodCard 
            href="/estimate/photos"
            icon={<ImageIcon className="w-8 h-8 text-purple-500" />}
            title="Upload House Photos"
            description="Take photos of your home, trace where you want lights, and we'll calculate the rest."
            steps={['Upload photos', 'Mark roofline', 'Receive estimate']}
            time="About 3 minutes"
          />

          {/* Map */}
          <PrimaryMethodCard 
            href="/estimate/map"
            icon={<Map className="w-8 h-8 text-emerald-500" />}
            title="Mark My Roofline"
            description="Draw the required lighting sections directly on a high-resolution satellite map."
            steps={['Find location', 'Draw sections', 'Calculate cost']}
            time="About 2 minutes"
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
          />
          <SecondaryMethodCard 
            href="/estimate/plan"
            icon={<FileText className="w-5 h-5 text-slate-600" />}
            title="Upload a Plan or Drawing"
          />
          <SecondaryMethodCard 
            href="/estimate/expert-review"
            icon={<UserCheck className="w-5 h-5 text-slate-600" />}
            title="Request Expert Review"
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
  time
}: { 
  href: string, 
  icon: React.ReactNode, 
  title: string, 
  description: string,
  steps: [string, string, string],
  time: string
}) {
  return (
    <Link 
      href={href} 
      className="group flex flex-col bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-blue-300 hover:shadow-md transition-all duration-200 focus-ring overflow-hidden"
    >
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between mb-4">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 group-hover:scale-110 transition-transform">
            {icon}
          </div>
          <div className="flex items-center text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            {time}
          </div>
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-blue-700 transition-colors">
          {title}
        </h3>
        <p className="text-slate-600 text-sm leading-relaxed mb-4">
          {description}
        </p>
      </div>
      
      {/* 3-step mini preview */}
      <div className="mt-auto bg-slate-50 border-t border-slate-100 p-4">
        <div className="flex items-center justify-between text-xs font-medium text-slate-500">
          <span className="flex-1 text-center">{steps[0]}</span>
          <ArrowRight className="w-3 h-3 text-slate-300 mx-1 flex-shrink-0" />
          <span className="flex-1 text-center">{steps[1]}</span>
          <ArrowRight className="w-3 h-3 text-slate-300 mx-1 flex-shrink-0" />
          <span className="flex-1 text-center text-blue-600">{steps[2]}</span>
        </div>
      </div>
    </Link>
  );
}

function SecondaryMethodCard({ href, icon, title }: { href: string, icon: React.ReactNode, title: string }) {
  return (
    <Link 
      href={href} 
      className="group focus-ring rounded-xl"
    >
      <div className="flex items-center p-4 bg-white border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-sm transition-all text-left gap-4 h-full">
        <div className="bg-slate-100 p-2 rounded-lg group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
          {icon}
        </div>
        <span className="text-sm font-bold text-slate-800 group-hover:text-blue-700 transition-colors">{title}</span>
        <ArrowRight className="w-4 h-4 ml-auto text-slate-300 group-hover:text-blue-500 transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  );
}
