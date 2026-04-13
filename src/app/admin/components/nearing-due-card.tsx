"use client";

import React, { useState } from 'react';
import { ServiceRecord } from '@/lib/storage';
import { Calendar, ChevronDown, Phone } from 'lucide-react';
import { format } from 'date-fns';

interface NearingDueCardProps {
  nearingDue: ServiceRecord[];
}

export function NearingDueCard({ nearingDue }: NearingDueCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mb-8 bg-white dark:bg-black rounded-2xl border border-orange-100 dark:border-orange-900/30 shadow-sm overflow-hidden">
      <button
        onClick={() => setExpanded(x => !x)}
        className="w-full flex items-center justify-between p-5 hover:bg-orange-50 dark:hover:bg-orange-900/10 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-orange-500" />
          <span className="font-semibold">Cars Nearing Service Due</span>
          <span className="px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs font-bold">
            {nearingDue.length}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>
      {expanded && (
        <div className="border-t border-orange-100 dark:border-orange-900/30 divide-y divide-gray-100 dark:divide-gray-800">
          {nearingDue.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">No cars due within 14 days.</div>
          ) : nearingDue.map(r => (
            <div key={r.id} className="p-4 flex items-center justify-between gap-4">
              <div>
                <div className="font-medium text-sm">{r.customerName} — {r.carModel}</div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {r.serviceType} · Due: {format(new Date(r.nextServiceDate), 'PP')}
                </div>
              </div>
              <a
                href={`tel:${r.phone}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-medium hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
              >
                <Phone className="w-3.5 h-3.5" /> {r.phone}
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
