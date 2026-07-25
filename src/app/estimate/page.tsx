import Link from 'next/link';
import { MapPin, Image as ImageIcon, Map, Zap, Ruler, FileText, UserCheck, Clock, ArrowRight, ShieldCheck, ZapIcon, Sparkles } from 'lucide-react';

export default function EstimateLandingPage() {
  return (
    <div className="space-y-12 animate-in fade-in duration-500 max-w-5xl mx-auto">
      {/* Hero Section */}
      <div className="text-center space-y-6 pt-4">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900">
          Get Your Permanent Lights Estimate
        </h1>
        <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto">
          Choose the easiest way to tell us about your home. Most estimates take only a few minutes.
        </p>
        
        {/* Trust Row */}
        <div className="flex flex-wrap justify-center gap-6 text-sm font-medium text-slate-600 pt-2">
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
            <ZapIcon className="w-4 h-4 text-blue-500" />
            Fast estimate
          </div>
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
            <Sparkles className="w-4 h-4 text-blue-500" />
            Multiple easy options
          </div>
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
            <ShieldCheck className="w-4 h-4 text-blue-500" />
            No obligation
          </div>
        </div>
      </div>

      {/* Main Methods Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <MethodCard 
          href="/estimate/address"
          icon={<MapPin className="w-8 h-8 text-blue-600" />}
          title="Enter My Address"
          description="Start with your property address and continue with available satellite information."
          detail="Best for most homeowners"
          time="About 2 minutes"
        />
        <MethodCard 
          href="/estimate/photos"
          icon={<ImageIcon className="w-8 h-8 text-blue-600" />}
          title="Upload House Photos"
          description="Upload your home photos and mark exactly where you want lights."
          detail="Best for custom rooflines"
          time="About 3 minutes"
        />
        <MethodCard 
          href="/estimate/map"
          icon={<Map className="w-8 h-8 text-blue-600" />}
          title="Mark My Roofline"
          description="Draw the required lighting sections directly on a satellite map."
          detail="Best for accurate horizontal measurements"
          time="About 2–3 minutes"
        />
        <MethodCard 
          href="/estimate/quick"
          icon={<Zap className="w-8 h-8 text-white" />}
          iconBg="bg-blue-600"
          title="Quick Estimate"
          description="Answer a few simple questions and receive an immediate price range."
          detail="Fastest option"
          time="Under 1 minute"
          highlight
        />
      </div>

      {/* Secondary Methods */}
      <div className="space-y-6 pt-10 border-t border-slate-200">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 text-center">
          Other ways to estimate
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SecondaryMethodCard 
            href="/estimate/measurements"
            icon={<Ruler className="w-5 h-5 text-slate-400" />}
            title="I Know My Measurements"
          />
          <SecondaryMethodCard 
            href="/estimate/plan"
            icon={<FileText className="w-5 h-5 text-slate-400" />}
            title="Upload a Plan or Drawing"
          />
          <SecondaryMethodCard 
            href="/estimate/expert-review"
            icon={<UserCheck className="w-5 h-5 text-slate-400" />}
            title="Request Expert Review"
          />
        </div>
      </div>
    </div>
  );
}

function MethodCard({ 
  href, 
  icon, 
  title, 
  description, 
  detail, 
  time,
  highlight = false,
  iconBg = "bg-blue-50"
}: { 
  href: string, 
  icon: React.ReactNode, 
  title: string, 
  description: string,
  detail: string,
  time: string,
  highlight?: boolean,
  iconBg?: string
}) {
  return (
    <Link 
      href={href} 
      className={`group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-2xl transition-all duration-200 hover:-translate-y-1 ${
        highlight 
          ? 'bg-white border-2 border-blue-500 shadow-md hover:shadow-lg' 
          : 'bg-white border border-slate-200 shadow-sm hover:border-slate-300 hover:shadow-md'
      }`}
    >
      <div className="p-6 h-full flex flex-col">
        <div className="flex items-start justify-between mb-4">
          <div className={`${iconBg} w-16 h-16 rounded-xl flex items-center justify-center`}>
            {icon}
          </div>
          <div className="flex items-center text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
            <Clock className="w-3.5 h-3.5 mr-1.5" />
            {time}
          </div>
        </div>
        
        <h3 className="text-xl font-semibold text-slate-900 mb-2 group-hover:text-blue-700 transition-colors">
          {title}
        </h3>
        
        <p className="text-slate-600 mb-4 flex-grow line-clamp-2">
          {description}
        </p>
        
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-auto">
          <span className="text-sm font-medium text-slate-500">
            {detail}
          </span>
          <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors text-slate-400">
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </Link>
  );
}

function SecondaryMethodCard({ href, icon, title }: { href: string, icon: React.ReactNode, title: string }) {
  return (
    <Link 
      href={href} 
      className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-xl"
    >
      <div className="flex flex-col items-center justify-center p-6 bg-white border border-slate-200 rounded-xl hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm transition-all text-center gap-3 h-full">
        <div className="bg-slate-100 p-3 rounded-full">
          {icon}
        </div>
        <span className="text-sm font-semibold text-slate-700">{title}</span>
      </div>
    </Link>
  );
}
