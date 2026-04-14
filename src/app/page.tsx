"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/components/language-provider';
import { useTheme } from 'next-themes';
import { Footer } from '@/components/footer';
import { CallNowFAB } from '@/components/call-now-fab';
import {
  Wrench, AlertTriangle, Search, Calendar, MapPin, Phone, User, Car, Clock,
  Moon, Sun, Monitor, Globe, ChevronRight, Sparkles, CheckCircle, XCircle, Download,
  MessageSquare, ChevronDown, MessageCircle
} from 'lucide-react';
import { storageService, Booking } from '@/lib/storage';
import { SERVICES, FAQ_ITEMS, PHONE_NUMBER, WHATSAPP_NUMBER, BUSINESS_NAME, BUSINESS_LOCATION } from '@/lib/constants';
import { toast } from 'sonner';
import { analyzeCarIssue } from './actions';
import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { generateHistoryPDF } from '@/lib/pdf-utils';

export default function CustomerLanding() {
  const { t, language, setLanguage } = useLanguage();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);
  const themeDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (themeDropdownRef.current && !themeDropdownRef.current.contains(e.target as Node)) {
        setThemeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    whatsapp: '',
    carModel: '',
    serviceType: SERVICES[0].id,
    otherDescription: '',
    location: '',
    preferredDate: '',
    preferredTime: '',
    isEmergency: false,
    notes: '',
  });

  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [searchPhone, setSearchPhone] = useState('');
  const [history, setHistory] = useState<Booking[] | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);
  const [expandedService, setExpandedService] = useState<string | null>(null);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const handleAiAnalyze = async () => {
    if (!formData.otherDescription) return;
    setIsAiThinking(true);
    const result = await analyzeCarIssue(formData.otherDescription);
    setAiResponse(result);
    setIsAiThinking(false);
  };

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    const { otherDescription, ...bookingData } = formData;
    try {
      const newBooking = await storageService.saveBooking(bookingData);
      setConfirmedBooking(newBooking);
      toast.success(t.thankYou);
      setFormData({
        customerName: '', phone: '', whatsapp: '', carModel: '',
        serviceType: SERVICES[0].id, otherDescription: '',
        location: '', preferredDate: '', preferredTime: '', isEmergency: false, notes: '',
      });
      setAiResponse(null);
    } catch {
      toast.error('Failed to submit booking. Please try again.');
    }
  };

  const generateReceipt = (booking: Booking) => {
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("GARAGE NYUMBANI", 20, 20);
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("Booking Receipt", 20, 28);
    doc.text(`Booking ID: ${booking.id.toUpperCase()}`, 140, 20);
    doc.text(`Date: ${format(new Date(booking.createdAt), 'MMM dd, yyyy')}`, 140, 28);
    doc.line(20, 35, 190, 35);
    doc.setFont("helvetica", "bold");
    doc.text("Customer Details:", 20, 45);
    doc.setFont("helvetica", "normal");
    doc.text(booking.customerName, 20, 52);
    doc.text(booking.phone, 20, 59);
    doc.text(booking.location, 20, 66);
    doc.setFont("helvetica", "bold");
    doc.text("Service Details:", 140, 45);
    doc.setFont("helvetica", "normal");
    doc.text(booking.carModel, 140, 52);
    doc.text(`Service: ${booking.serviceType.toUpperCase()}`, 140, 59);
    doc.text(`Date: ${booking.preferredDate} ${booking.preferredTime}`, 140, 66);
    doc.line(20, 75, 190, 75);
    doc.setFont("helvetica", "bold");
    doc.text("Status:", 20, 85);
    doc.setFont("helvetica", "normal");
    doc.text(booking.status.toUpperCase(), 40, 85);
    doc.save(`Receipt_${booking.id}.pdf`);
    toast.success('Receipt downloaded successfully');
  };

  const sendWhatsApp = (booking: Booking) => {
    const message = `Hello Garage Nyumbani, I have just booked a service.\n\nBooking ID: ${booking.id.toUpperCase()}\nName: ${booking.customerName}\nCar: ${booking.carModel}\nService: ${booking.serviceType}\nDate: ${booking.preferredDate} ${booking.preferredTime}\nLocation: ${booking.location}\n\nPlease confirm my booking.`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const userHistory = await storageService.getBookings(searchPhone);
      setHistory(userHistory);
      if (userHistory.length === 0) toast.error(t.noHistory);
    } catch {
      toast.error('Failed to load booking history. Please try again.');
    }
  };

  const selectedService = SERVICES.find(s => s.id === formData.serviceType);

  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wrench className="w-6 h-6 text-blue-600" />
            <span className="font-display font-bold text-xl tracking-tight">{BUSINESS_NAME}</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setLanguage(language === 'en' ? 'sw' : 'en')}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-2 text-sm font-medium"
            >
              <Globe className="w-4 h-4" />
              {language.toUpperCase()}
            </button>
            <div ref={themeDropdownRef} className="relative">
              <button
                onClick={() => setThemeDropdownOpen(o => !o)}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Theme selector"
              >
                {theme === 'system' ? <Monitor className="w-5 h-5" /> : resolvedTheme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </button>
              {themeDropdownOpen && (
                <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg py-1 z-50">
                  {([
                    { value: 'light', label: 'Light', Icon: Sun },
                    { value: 'dark',  label: 'Dark',  Icon: Moon },
                    { value: 'system',label: 'System',Icon: Monitor },
                  ] as const).map(({ value, label, Icon }) => (
                    <button
                      key={value}
                      onClick={() => { setTheme(value); setThemeDropdownOpen(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors ${theme === value ? 'font-semibold text-blue-600 dark:text-blue-400' : ''}`}
                    >
                      <Icon className="w-4 h-4" /> {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Link href="/admin" className="hidden sm:flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
              {t.adminLogin} <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1597386601945-8980df52c3dc?q=80&w=2070&auto=format&fit=crop"
            alt="Speedometer"
            fill
            className="object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-transparent dark:from-black dark:via-black/80 dark:to-black/40" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-2xl"
          >
            <h1 className="font-display text-5xl lg:text-7xl font-bold text-white uppercase tracking-tight leading-tight mb-6">
              {t.heroTitle}
            </h1>
            <p className="text-xl text-gray-300 mb-10 max-w-xl">{t.heroSub}</p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a href="#book" className="inline-flex justify-center items-center px-8 py-4 rounded-full bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors">
                {t.bookNow}
              </a>
              <a href="#history" className="inline-flex justify-center items-center px-8 py-4 rounded-full bg-white/10 text-white font-medium hover:bg-white/20 backdrop-blur-sm transition-colors">
                {t.searchHistory}
              </a>
            </div>

          </motion.div>
        </div>
        {/* Marquee - full width */}
        <div className="relative z-10 mt-8 overflow-hidden bg-white/10 backdrop-blur-sm py-2">
          <div className="marquee-track text-white/80 text-sm font-medium" aria-label="24/7 Service ticker">
            {[...Array(4)].map((_, i) => (
              <span key={i} className="px-6 whitespace-nowrap">
                24/7 Service &nbsp;•&nbsp; Zanzibar Nzima &nbsp;•&nbsp; Huduma ya Dharura &nbsp;•&nbsp; Mobile Garage &nbsp;•&nbsp;
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* History Lookup */}
      <motion.section
        id="history"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="py-20 bg-gray-50 dark:bg-zinc-900"
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="font-display text-3xl font-bold mb-4">{t.searchHistory}</h2>
            <p className="text-gray-600 dark:text-gray-400">{t.enterPhone}</p>
          </div>
          <form onSubmit={handleSearch} className="flex gap-4 mb-12">
            <input
              type="tel"
              value={searchPhone}
              onChange={e => setSearchPhone(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="flex-1 px-6 py-4 rounded-full bg-white dark:bg-black border border-gray-200 dark:border-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
            />
            <button type="submit" className="px-8 py-4 rounded-full bg-black dark:bg-white text-white dark:text-black font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors flex items-center gap-2">
              <Search className="w-5 h-5" />
              <span className="hidden sm:inline">{t.search}</span>
            </button>
          </form>
          {history && history.length > 0 && (
            <div className="space-y-4">
              <div className="flex justify-end mb-4">
                <button
                  onClick={() => generateHistoryPDF(history, searchPhone)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-black dark:bg-white text-white dark:text-black text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  {language === 'sw' ? 'Pakua PDF' : 'Download PDF'}
                </button>
              </div>
              {history.map((booking, idx) => {
                const service = SERVICES.find(s => s.id === booking.serviceType);
                const serviceLabel = service ? (language === 'sw' ? service.titleSw : service.titleEn) : booking.serviceType;
                return (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    key={booking.id}
                    className="bg-white dark:bg-black p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-medium text-lg">{serviceLabel}</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          booking.status === 'Completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                          booking.status === 'In Progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                          booking.status === 'Cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                          'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                        }`}>
                          {t[booking.status.toLowerCase().replace(' ', '') as keyof typeof t] || booking.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                        {booking.preferredDate} • {booking.carModel}
                      </div>
                    </div>
                    {booking.isEmergency && (
                      <div className="flex items-center gap-1 text-red-500 text-sm font-medium">
                        <AlertTriangle className="w-4 h-4" /> {t.emergencyBadge}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </motion.section>

      {/* Service Catalog */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="py-20 bg-gray-50 dark:bg-zinc-900"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl font-bold mb-4 text-center">{t.servicesTitle}</h2>
          <p className="text-center text-gray-500 dark:text-gray-400 mb-12 text-sm">{t.noteDistance}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICES.map((service, idx) => {
              const isExpanded = expandedService === service.id;
              return (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white dark:bg-black rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden"
                >
                  {/* Card image header */}
                  <div
                    className="relative h-40 overflow-hidden"
                    style={{ background: service.fallbackBg }}
                  >
                    <Image
                      src={service.imageUrl}
                      alt={service.titleEn}
                      fill
                      className="object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/30" />
                  </div>
                  <button
                    onClick={() => setExpandedService(isExpanded ? null : service.id)}
                    className="w-full p-6 flex items-start gap-4 text-left hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm leading-tight mb-1">
                        {language === 'sw' ? service.titleSw : service.titleEn}
                      </h3>
                      {service.price > 0 ? (
                        <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">
                          TZS {service.price.toLocaleString()}
                        </p>
                      ) : (
                        <p className="text-gray-400 text-sm">{language === 'sw' ? 'Wasiliana nasi' : 'Contact for pricing'}</p>
                      )}
                    </div>
                    <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-6 pt-0 border-t border-gray-100 dark:border-gray-800">
                          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mt-4">
                            {language === 'sw' ? service.descriptionSw : service.descriptionEn}
                          </p>
                          <a
                            href="#book"
                            onClick={() => setFormData(f => ({ ...f, serviceType: service.id }))}
                            className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                          >
                            {t.requestThis} <ChevronRight className="w-3 h-3" />
                          </a>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.section>

      {/* Booking Form */}
      <section id="book" className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
            <div className="p-8 md:p-12">
              <h2 className="font-display text-3xl font-bold mb-8">{t.formTitle}</h2>

              <form onSubmit={handleBook} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2"><User className="w-4 h-4"/> {t.labelName}</label>
                    <input required type="text" value={formData.customerName} onChange={e => setFormData({...formData, customerName: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                  </div>
                  {/* Phone */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2"><Phone className="w-4 h-4"/> {t.labelPhone}</label>
                    <input required type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                  </div>
                  {/* WhatsApp */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2"><MessageCircle className="w-4 h-4"/> {t.labelWhatsapp} <span className="text-gray-400 font-normal text-xs">({language === 'sw' ? 'Si lazima' : 'Optional'})</span></label>
                    <input type="tel" value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                  </div>
                  {/* Car Model */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2"><Car className="w-4 h-4"/> {t.labelCar}</label>
                    <input required type="text" value={formData.carModel} onChange={e => setFormData({...formData, carModel: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                  </div>
                  {/* Service Type */}
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium">{t.labelService}</label>
                    <select value={formData.serviceType} onChange={e => setFormData({...formData, serviceType: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none">
                      {SERVICES.map(s => (
                        <option key={s.id} value={s.id}>
                          {language === 'sw' ? s.titleSw : s.titleEn}
                        </option>
                      ))}
                    </select>
                    {selectedService && selectedService.price > 0 && (
                      <p className="text-xs text-blue-600 dark:text-blue-400 ml-1">
                        {language === 'sw' ? 'Bei ya awali' : 'Starting from'}: TZS {selectedService.price.toLocaleString()}
                      </p>
                    )}
                  </div>

                  {/* Other description + AI (only for other-specialist) */}
                  {formData.serviceType === 'other-specialist' && (
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-medium flex items-center gap-2"><Sparkles className="w-4 h-4"/> {t.labelOtherService}</label>
                      <div className="relative">
                        <textarea
                          rows={3}
                          value={formData.otherDescription}
                          onChange={e => setFormData({...formData, otherDescription: e.target.value})}
                          className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                        />
                        <button
                          type="button"
                          onClick={handleAiAnalyze}
                          disabled={isAiThinking || !formData.otherDescription}
                          className="absolute right-3 bottom-3 bg-blue-600 p-2 rounded-lg text-white hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center gap-2 text-xs font-medium"
                        >
                          <Sparkles className={`w-3 h-3 ${isAiThinking ? 'animate-spin' : ''}`} />
                          {isAiThinking ? t.aiThinking : t.aiAnalyze}
                        </button>
                      </div>
                      {aiResponse && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 p-4 rounded-xl mt-2">
                          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 block mb-1 uppercase tracking-wider">{t.aiAdvice}</span>
                          <p className="text-sm text-gray-700 dark:text-gray-300">{aiResponse}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Location */}
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium flex items-center gap-2"><MapPin className="w-4 h-4"/> {t.labelLocation}</label>
                    <input required type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                  </div>
                  {/* Notes */}
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      {t.labelNotes} <span className="text-gray-400 font-normal text-xs">({language === 'sw' ? 'Si lazima' : 'Optional'})</span>
                    </label>
                    <textarea rows={2} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none" />
                  </div>
                  {/* Date */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2"><Calendar className="w-4 h-4"/> {t.labelDate}</label>
                    <input required type="date" value={formData.preferredDate} onChange={e => setFormData({...formData, preferredDate: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2"><Clock className="w-4 h-4"/> {t.time}</label>
                    <input required type="time" value={formData.preferredTime} onChange={e => setFormData({...formData, preferredTime: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                  </div>

                  {/* Emergency checkbox (single) */}
                  <div className="md:col-span-2 flex items-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30">
                    <input
                      type="checkbox"
                      id="emergency"
                      checked={formData.isEmergency}
                      onChange={e => setFormData({...formData, isEmergency: e.target.checked})}
                      className="w-5 h-5 text-red-600 rounded border-red-300 focus:ring-red-500"
                    />
                    <label htmlFor="emergency" className="text-sm font-medium text-red-800 dark:text-red-400 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      {t.labelEmergencyCheckbox}
                    </label>
                  </div>
                </div>

                <button type="submit" className="w-full py-4 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors mt-8">
                  {t.submitBtn}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="py-20 bg-gray-50 dark:bg-zinc-900"
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl font-bold mb-12 text-center">{t.faqTitle}</h2>
          <div className="space-y-4">
            {FAQ_ITEMS.map(item => {
              const isOpen = expandedFaq === item.id;
              return (
                <div key={item.id} className="bg-white dark:bg-black rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                  <button
                    onClick={() => setExpandedFaq(isOpen ? null : item.id)}
                    className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors"
                  >
                    <span className="font-medium text-sm">
                      {language === 'sw' ? item.qSw : item.qEn}
                    </span>
                    <ChevronDown className={`w-5 h-5 text-gray-400 flex-shrink-0 ml-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-5 pt-0 border-t border-gray-100 dark:border-gray-800">
                          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mt-4">
                            {language === 'sw' ? item.aSw : item.aEn}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </motion.section>

      {/* Booking Confirmation Modal */}
      {confirmedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800"
          >
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
              <h3 className="font-display text-xl font-bold flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-green-500" />
                {t.thankYou}
              </h3>
              <button onClick={() => setConfirmedBooking(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="text-center">
                <p className="text-gray-600 dark:text-gray-400 mb-2">{t.bookingNumber}</p>
                <div className="text-3xl font-mono font-bold tracking-wider">{confirmedBooking.id.toUpperCase()}</div>
              </div>
              <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                <button
                  onClick={() => generateReceipt(confirmedBooking)}
                  className="w-full py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl font-medium hover:opacity-90 flex items-center justify-center gap-2 transition-colors"
                >
                  <Download className="w-5 h-5" /> {t.printReceipt}
                </button>
                <button
                  onClick={() => sendWhatsApp(confirmedBooking)}
                  className="w-full py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 flex items-center justify-center gap-2 transition-colors"
                >
                  <MessageSquare className="w-5 h-5" /> {t.shareOnWhatsApp}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      <Footer />
      <CallNowFAB />
    </div>
  );
}
