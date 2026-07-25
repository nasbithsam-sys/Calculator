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
    </div>
  );
}
