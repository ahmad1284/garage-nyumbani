"use client";

import React, { useState } from 'react';
import { ServiceRecord } from '@/lib/storage';
import { WHATSAPP_NUMBER } from '@/lib/constants';
import { XCircle, MessageSquare, CheckCircle, ChevronRight, Phone } from 'lucide-react';

interface ReminderModalProps {
  records: ServiceRecord[];
  smsEnabled?: boolean;
  onClose: () => void;
  onReminderSent: (recordId: string) => void;
}

export function ReminderModal({ records, smsEnabled, onClose, onReminderSent }: ReminderModalProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [sent, setSent] = useState<Set<string>>(new Set());
  const [smsSending, setSmsSending] = useState(false);

  const current = records[currentIdx];
  const isDone = currentIdx >= records.length;

  const buildWhatsAppMessage = (record: ServiceRecord) =>
    `Hello ${record.customerName}, it's time for your next *${record.serviceType}* service for your *${record.carModel}*. Please book an appointment with ${WHATSAPP_NUMBER === '255700000000' ? 'Garage Nyumbani' : 'us'}!`;

  const handleWhatsApp = () => {
    if (!current) return;
    const msg = buildWhatsAppMessage(current);
    window.open(`https://wa.me/${current.phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
    setSent(s => new Set([...s, current.id]));
    onReminderSent(current.id);
  };

  const handleNext = () => {
    setCurrentIdx(i => i + 1);
  };

  const handleSmsBatch = async () => {
    setSmsSending(true);
    try {
      const targets = records.map(r => ({
        id: r.id,
        phone: r.phone,
        customerName: r.customerName,
        carModel: r.carModel,
        serviceType: r.serviceType,
      }));
      await fetch('/api/reminders/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targets }),
      });
      records.forEach(r => onReminderSent(r.id));
    } finally {
      setSmsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800">
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
          <h3 className="font-display text-xl font-bold">Send Reminders</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full">
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {isDone ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <p className="font-medium text-lg">All reminders sent!</p>
              <p className="text-gray-500 text-sm mt-1">{sent.size} of {records.length} customers contacted</p>
              <button
                onClick={onClose}
                className="mt-6 px-6 py-2 rounded-xl bg-black dark:bg-white text-white dark:text-black font-medium hover:opacity-90 transition-opacity"
              >
                Done
              </button>
            </div>
          ) : (
            <>
              <div className="text-xs text-gray-400 mb-4">
                {currentIdx + 1} of {records.length}
              </div>
              <div className="bg-gray-50 dark:bg-zinc-800 rounded-2xl p-5 mb-6">
                <div className="font-semibold text-lg mb-1">{current.customerName}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">{current.carModel}</div>
                <div className="text-sm text-gray-500">{current.phone}</div>
                <div className="mt-3 p-3 bg-white dark:bg-zinc-900 rounded-xl text-sm text-gray-700 dark:text-gray-300 border border-gray-100 dark:border-gray-700">
                  {buildWhatsAppMessage(current)}
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleWhatsApp}
                  disabled={sent.has(current.id)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-green-600 text-white font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  {sent.has(current.id) ? 'Sent ✓' : 'Send WhatsApp'}
                </button>
                <button
                  onClick={handleNext}
                  className="flex items-center justify-center gap-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  Skip <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              {smsEnabled && (
                <button
                  onClick={handleSmsBatch}
                  disabled={smsSending}
                  className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  {smsSending ? 'Sending SMS...' : `Send SMS to All (${records.length})`}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
