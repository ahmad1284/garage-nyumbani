"use client";

import { Phone } from 'lucide-react';
import { PHONE_NUMBER } from '@/lib/constants';

export function CallNowFAB() {
  return (
    <a
      href={`tel:${PHONE_NUMBER}`}
      aria-label="Call Now"
      className="sm:hidden fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-full shadow-lg hover:bg-blue-700 active:scale-95 transition-all"
    >
      {/* Pulse ring */}
      <span className="absolute inset-0 rounded-full bg-blue-600 animate-ping opacity-30" />
      <Phone className="w-5 h-5 relative" />
      <span className="relative text-sm font-semibold">Call Now</span>
    </a>
  );
}
