import Link from 'next/link';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Image as ImageIcon, Map, Zap, Ruler, FileText, UserCheck } from 'lucide-react';

import { checkApplicationReadiness } from '@/lib/readiness';

export default async function EstimateLandingPage() {
  const readiness = await checkApplicationReadiness();

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="space-y-3 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
          Get Your Permanent Lights Estimate
        </h1>
        <p className="text-lg text-slate-500 max-w-xl mx-auto">
          Choose the easiest way to estimate the lights needed for your home.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <MethodCard 
          href="/estimate/address"
          icon={<MapPin className="w-6 h-6 text-blue-600" />}
          title="Enter My Address"
          description="Let us analyze available property information."
        />
        <MethodCard 
          href="/estimate/photos"
          icon={<ImageIcon className="w-6 h-6 text-blue-600" />}
          title="Upload House Photos"
          description="Upload photos and mark where you want lights."
        />
        <MethodCard 
          href="/estimate/map"
          icon={<Map className="w-6 h-6 text-blue-600" />}
          title="Mark My Roofline"
          description="Draw the lighting sections on an aerial map."
        />
        <MethodCard 
          href="/estimate/quick"
          icon={<Zap className="w-6 h-6 text-blue-600" />}
          title="Quick Estimate"
          description="Answer a few simple questions for an instant price range."
        />
      </div>

      <div className="space-y-4 pt-6 border-t border-slate-200">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
          Other ways to estimate
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SecondaryMethodCard 
            href="/estimate/measurements"
            icon={<Ruler className="w-4 h-4 mr-2 text-slate-500" />}
            title="I Know My Measurements"
          />
          <SecondaryMethodCard 
            href="/estimate/plan"
            icon={<FileText className="w-4 h-4 mr-2 text-slate-500" />}
            title="Upload a Plan or Drawing"
          />
          <SecondaryMethodCard 
            href="/estimate/expert-review"
            icon={<UserCheck className="w-4 h-4 mr-2 text-slate-500" />}
            title="Request Expert Review"
          />
        </div>
      </div>
    </div>
  );
}

function MethodCard({ href, icon, title, description }: { href: string, icon: React.ReactNode, title: string, description: string }) {
  return (
    <Link href={href} className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-xl">
      <Card className="h-full hover:border-blue-600 transition-colors shadow-sm hover:shadow-md cursor-pointer border-slate-200 bg-white">
        <CardHeader>
          <div className="bg-blue-50 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            {icon}
          </div>
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription className="text-slate-500 text-sm">{description}</CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
}

function SecondaryMethodCard({ href, icon, title }: { href: string, icon: React.ReactNode, title: string }) {
  return (
    <Link href={href} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-lg">
      <div className="flex items-center justify-center sm:justify-start p-3 sm:p-4 bg-white border border-slate-200 rounded-lg hover:border-slate-300 hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700 shadow-sm">
        {icon}
        {title}
      </div>
    </Link>
  );
}
