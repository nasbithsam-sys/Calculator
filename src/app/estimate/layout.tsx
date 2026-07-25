import { ReactNode } from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Govee Estimate Calculator',
  description: 'Estimate your permanent outdoor lighting needs easily.',
};

export default function EstimateLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/estimate" className="font-bold text-xl tracking-tight text-slate-900 hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-sm">
              Govee <span className="text-blue-600">Estimate Calculator</span>
            </Link>
            <span className="hidden md:inline-block text-sm text-slate-500 border-l border-slate-200 pl-4">
              Serving homeowners nationwide
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors focus-visible:outline-none focus-visible:underline">
              Need help?
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-8 sm:py-12">
        {children}
      </main>
    </div>
  );
}
