"use client";

import { Phone, MessageCircle, MapPin, Facebook, Instagram, Clock } from 'lucide-react';
import { BUSINESS_NAME, PHONE_NUMBER, WHATSAPP_NUMBER, BUSINESS_LOCATION, FACEBOOK_URL, INSTAGRAM_URL, TIKTOK_URL, GOOGLE_MAPS_EMBED_URL } from '@/lib/constants';

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.75a8.28 8.28 0 0 0 4.84 1.55V6.85a4.85 4.85 0 0 1-1.07-.16z" />
    </svg>
  );
}

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Brand + Contact */}
          <div>
            <h3 className="font-display font-bold text-xl mb-4">{BUSINESS_NAME}</h3>
            <p className="text-gray-400 text-sm mb-6">Mobile garage service across Zanzibar. We come to you.</p>
            <div className="space-y-3">
              <a href={`tel:${PHONE_NUMBER}`} className="flex items-center gap-3 text-sm text-gray-300 hover:text-white transition-colors">
                <Phone className="w-4 h-4 text-blue-400 flex-shrink-0" />
                {PHONE_NUMBER}
              </a>
              <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-gray-300 hover:text-white transition-colors">
                <MessageCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                WhatsApp
              </a>
              <div className="flex items-center gap-3 text-sm text-gray-300">
                <MapPin className="w-4 h-4 text-red-400 flex-shrink-0" />
                {BUSINESS_LOCATION}
              </div>
            </div>
          </div>

          {/* Hours + Social */}
          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wider text-gray-400 mb-4">Hours</h3>
            <div className="space-y-2 text-sm text-gray-300 mb-6">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span>Mon – Sat: 8:00 AM – 6:00 PM</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span>Sun / Holidays: Emergency only</span>
              </div>
            </div>
            <h3 className="font-semibold text-sm uppercase tracking-wider text-gray-400 mb-3">Follow Us</h3>
            <div className="flex gap-4">
              <a href={FACEBOOK_URL} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                <Facebook className="w-4 h-4" />
              </a>
              <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
              <a href={TIKTOK_URL} target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                <TikTokIcon className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Map */}
          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wider text-gray-400 mb-4">Location</h3>
            <div className="rounded-2xl overflow-hidden border border-white/10 aspect-video">
              <iframe
                src={GOOGLE_MAPS_EMBED_URL}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Garage Nyumbani Location"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 pt-6 text-center text-sm text-gray-500">
          © {currentYear} {BUSINESS_NAME}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
