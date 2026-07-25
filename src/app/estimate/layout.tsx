import { ReactNode } from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Govee Estimate Calculator',
  description: 'Estimate your permanent outdoor lighting needs easily.',
};

export default function EstimateLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/estimate" className="font-semibold text-lg tracking-tight hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 rounded-sm">
            Govee <span className="text-blue-600">Calculator</span>
          </Link>
          <div className="text-xs font-medium bg-slate-100 text-slate-500 px-2 py-1 rounded select-none">
            Preliminary Development
          </div>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
        {children}
      </main>
    </div>
  );
}
