import { ReactNode } from 'react';
import { AppHeader } from '@/components/AppHeader';

export const metadata = {
  title: 'Govee Estimate Calculator',
  description: 'Estimate your permanent outdoor lighting needs easily.',
};

export default function EstimateLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background font-sans text-foreground flex flex-col">
      <AppHeader />
      <main className="flex-1 w-full max-w-[1200px] mx-auto px-4 py-8 sm:py-12">
        {children}
      </main>
      <footer className="border-t border-border bg-slate-50 mt-auto">
        <div className="page-container py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <div className="font-medium">Permanent Lights Estimate Calculator</div>
          <div className="flex items-center gap-4">
            <span>Serving homeowners across the USA</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
