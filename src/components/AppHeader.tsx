"use client";

import Link from 'next/link';
import { useState } from 'react';
import { HelpCircle, Phone, Mail, UserCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function AppHeader() {
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Read configured contact methods from env if they were to exist
  const phone = process.env.NEXT_PUBLIC_SUPPORT_PHONE;
  const email = process.env.NEXT_PUBLIC_SUPPORT_EMAIL;

  return (
    <header className="bg-background border-b border-border sticky top-0 z-40 shadow-sm">
      <div className="page-container h-16 flex items-center justify-between">
        
        {/* Brand */}
        <div className="flex items-center gap-4">
          <Link href="/estimate" className="font-bold text-xl tracking-tight text-slate-900 hover:text-primary transition-colors focus-ring rounded-sm flex items-center gap-2">
            {/* Custom roofline/light SVG representation */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary">
              <path d="M3 10L12 3L21 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="5" cy="11.5" r="1.5" fill="currentColor" />
              <circle cx="12" cy="6" r="1.5" fill="currentColor" />
              <circle cx="19" cy="11.5" r="1.5" fill="currentColor" />
            </svg>
            Permanent Lights <span className="text-primary font-extrabold hidden sm:inline">Estimate</span>
          </Link>
          <span className="hidden md:inline-block text-sm text-slate-500 border-l border-border pl-4 font-medium">
            Serving homeowners across the USA
          </span>
        </div>

        {/* Actions */}
        <div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium"
            onClick={() => setIsHelpOpen(true)}
          >
            <HelpCircle className="w-4 h-4 mr-2" />
            Need help?
          </Button>
        </div>
      </div>

      {/* Help Panel / Bottom Sheet */}
      {isHelpOpen && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-end sm:justify-center animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsHelpOpen(false)} />
          <div className="relative bg-background w-full sm:w-[400px] h-full sm:h-auto sm:rounded-2xl shadow-2xl p-6 animate-in slide-in-from-right sm:slide-in-from-bottom-4 duration-300 flex flex-col">
            
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900">How can we help?</h2>
              <Button variant="ghost" size="icon" onClick={() => setIsHelpOpen(false)} className="rounded-full">
                <X className="w-5 h-5 text-slate-500" />
              </Button>
            </div>

            <div className="space-y-6 flex-grow overflow-y-auto">
              
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <h3 className="font-semibold text-slate-900 mb-2">Not sure which method to use?</h3>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li><strong className="text-slate-900">Address:</strong> Best starting point, uses satellite data.</li>
                  <li><strong className="text-slate-900">Photos:</strong> Best for unusual or complex rooflines.</li>
                  <li><strong className="text-slate-900">Quick Estimate:</strong> Fastest way to get a price range.</li>
                </ul>
              </div>

              <div className="space-y-3">
                <Button asChild variant="outline" className="w-full justify-start py-6 text-base font-medium shadow-sm hover:border-primary/50 hover:bg-primary/5">
                  <Link href="/estimate/expert-review" onClick={() => setIsHelpOpen(false)}>
                    <UserCheck className="w-5 h-5 mr-3 text-primary" />
                    Request Expert Review
                  </Link>
                </Button>
                
                {phone && (
                  <Button asChild variant="outline" className="w-full justify-start py-6 text-base font-medium shadow-sm hover:border-primary/50 hover:bg-primary/5">
                    <a href={`tel:${phone}`}>
                      <Phone className="w-5 h-5 mr-3 text-primary" />
                      Call us: {phone}
                    </a>
                  </Button>
                )}
                
                {email && (
                  <Button asChild variant="outline" className="w-full justify-start py-6 text-base font-medium shadow-sm hover:border-primary/50 hover:bg-primary/5">
                    <a href={`mailto:${email}`}>
                      <Mail className="w-5 h-5 mr-3 text-primary" />
                      Email support
                    </a>
                  </Button>
                )}
              </div>

            </div>
          </div>
        </div>
      )}
    </header>
  );
}
