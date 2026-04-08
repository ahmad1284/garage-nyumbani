"use client";

import React, { useState } from 'react';
import { motion } from 'motion/react';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/components/language-provider';
import { useTheme } from 'next-themes';
import { 
  Settings, Wrench, Battery, Wind, Droplet, CircleDashed, 
  AlertTriangle, Search, Calendar, MapPin, Phone, User, Car, Clock,
  Moon, Sun, Globe, ChevronRight, Sparkles, CheckCircle, XCircle, Download, MessageSquare
} from 'lucide-react';
import { storageService, Booking } from '@/lib/storage';
import { toast } from 'sonner';
import { analyzeCarIssue } from './actions';
import jsPDF from 'jspdf';
import { format } from 'date-fns';

const services = [
  { id: 'engine', icon: Settings, color: 'text-blue-500' },
  { id: 'brakes', icon: Wrench, color: 'text-red-500' },
  { id: 'battery', icon: Battery, color: 'text-yellow-500' },
  { id: 'ac', icon: Wind, color: 'text-cyan-500' },
  { id: 'oil', icon: Droplet, color: 'text-amber-700' },
  { id: 'tires', icon: CircleDashed, color: 'text-gray-500' },
  { id: 'other', icon: Sparkles, color: 'text-purple-500' },
];

export default function CustomerLanding() {
  const { t, language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  
  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    carModel: '',
    serviceType: 'engine',
    otherDescription: '',
    location: '',
    preferredDate: '',
    preferredTime: '',
    isEmergency: false,
  });

  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isAiThinking, setIsAiThinking] = useState(false);

  const [searchPhone, setSearchPhone] = useState('');
  const [history, setHistory] = useState<any[] | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);

  const handleAiAnalyze = async () => {
    if (!formData.otherDescription) return;
    setIsAiThinking(true);
    const result = await analyzeCarIssue(formData.otherDescription);
    setAiResponse(result);
    setIsAiThinking(false);
  };

  const handleBook = (e: React.FormEvent) => {
    e.preventDefault();
    const newBooking = storageService.saveBooking(formData);
    setConfirmedBooking(newBooking);
    toast.success(t.thankYou);
    setFormData({
      customerName: '', phone: '', carModel: '', serviceType: 'engine', otherDescription: '',
      location: '', preferredDate: '', preferredTime: '', isEmergency: false
    });
    setAiResponse(null);
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
    const whatsappUrl = `https://wa.me/255700000000?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const bookings = storageService.getBookings();
    const userHistory = bookings.filter(b => b.phone === searchPhone);
    setHistory(userHistory);
    if (userHistory.length === 0) {
      toast.error(t.noHistory);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wrench className="w-6 h-6 text-blue-600" />
            <span className="font-display font-bold text-xl tracking-tight">Garage Nyumbani</span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setLanguage(language === 'en' ? 'sw' : 'en')}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-2 text-sm font-medium"
            >
              <Globe className="w-4 h-4" />
              {language.toUpperCase()}
            </button>
            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <Link href="/admin" className="hidden sm:flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
              {t.admin} <ChevronRight className="w-4 h-4" />
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
            <p className="text-xl text-gray-300 mb-10 max-w-xl">
              {t.heroSubtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a href="#book" className="inline-flex justify-center items-center px-8 py-4 rounded-full bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors">
                {t.bookNow}
              </a>
              <a href="#history" className="inline-flex justify-center items-center px-8 py-4 rounded-full bg-white/10 text-white font-medium hover:bg-white/20 backdrop-blur-sm transition-colors">
                {t.checkHistory}
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Service Catalog */}
      <section className="py-20 bg-gray-50 dark:bg-zinc-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl font-bold mb-12 text-center">{t.ourServices}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {services.map((service, idx) => {
              const Icon = service.icon;
              return (
                <motion.div 
                  key={service.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white dark:bg-black p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col items-center text-center hover:shadow-md transition-shadow"
                >
                  <div className={`p-4 rounded-2xl bg-gray-50 dark:bg-zinc-900 mb-4 ${service.color}`}>
                    <Icon className="w-8 h-8" />
                  </div>
                  <h3 className="font-medium">{t[service.id as keyof typeof t]}</h3>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Booking Form */}
      <section id="book" className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
            <div className="p-8 md:p-12">
              <h2 className="font-display text-3xl font-bold mb-8">{t.bookService}</h2>
              
              <form onSubmit={handleBook} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2"><User className="w-4 h-4"/> {t.name}</label>
                    <input required type="text" value={formData.customerName} onChange={e => setFormData({...formData, customerName: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2"><Phone className="w-4 h-4"/> {t.phone}</label>
                    <input required type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2"><Car className="w-4 h-4"/> {t.carModel}</label>
                    <input required type="text" value={formData.carModel} onChange={e => setFormData({...formData, carModel: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2"><Settings className="w-4 h-4"/> {t.serviceType}</label>
                    <select value={formData.serviceType} onChange={e => setFormData({...formData, serviceType: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none">
                      {services.map(s => <option key={s.id} value={s.id}>{t[s.id as keyof typeof t] || s.id}</option>)}
                    </select>
                  </div>
                  
                  {formData.serviceType === 'other' && (
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-medium flex items-center gap-2"><Sparkles className="w-4 h-4"/> Describe the issue</label>
                      <div className="relative">
                        <textarea 
                          required 
                          rows={3} 
                          value={formData.otherDescription} 
                          onChange={e => setFormData({...formData, otherDescription: e.target.value})} 
                          className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none" 
                          placeholder="E.g. My car makes a weird noise when braking..."
                        />
                        <button 
                          type="button" 
                          onClick={handleAiAnalyze} 
                          disabled={isAiThinking || !formData.otherDescription} 
                          className="absolute right-3 bottom-3 bg-blue-600 p-2 rounded-lg text-white hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center gap-2 text-xs font-medium"
                        >
                          <Sparkles className={`w-3 h-3 ${isAiThinking ? 'animate-spin' : ''}`} /> 
                          {isAiThinking ? 'Analyzing...' : 'AI Analyze'}
                        </button>
                      </div>
                      {aiResponse && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 p-4 rounded-xl mt-2">
                          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 block mb-1 uppercase tracking-wider">AI Advice</span>
                          <p className="text-sm text-gray-700 dark:text-gray-300">{aiResponse}</p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium flex items-center gap-2"><MapPin className="w-4 h-4"/> {t.location}</label>
                    <input required type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2"><Calendar className="w-4 h-4"/> {t.date}</label>
                    <input required type="date" value={formData.preferredDate} onChange={e => setFormData({...formData, preferredDate: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2"><Clock className="w-4 h-4"/> {t.time}</label>
                    <input required type="time" value={formData.preferredTime} onChange={e => setFormData({...formData, preferredTime: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                  </div>

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
                      This is an emergency (Breakdown / Roadside Assistance)
                    </label>
                  </div>
                </div>

                <div className="pt-4">
                  <label className="flex items-center gap-3 p-4 rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/10 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={formData.isEmergency}
                      onChange={e => setFormData({...formData, isEmergency: e.target.checked})}
                      className="w-5 h-5 text-red-600 rounded focus:ring-red-500"
                    />
                    <div className="flex items-center gap-2">
                      <AlertTriangle className={`w-5 h-5 ${formData.isEmergency ? 'text-red-600 animate-pulse' : 'text-red-400'}`} />
                      <span className="font-medium text-red-900 dark:text-red-400">{t.emergency}</span>
                    </div>
                  </label>
                </div>

                <button type="submit" className="w-full py-4 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors mt-8">
                  {t.submitBooking}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* History Lookup */}
      <section id="history" className="py-20 bg-gray-50 dark:bg-zinc-900">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="font-display text-3xl font-bold mb-4">{t.checkHistory}</h2>
            <p className="text-gray-600 dark:text-gray-400">{t.enterPhone}</p>
          </div>

          <form onSubmit={handleSearch} className="flex gap-4 mb-12">
            <input 
              type="tel" 
              value={searchPhone}
              onChange={e => setSearchPhone(e.target.value)}
              placeholder="+255..."
              className="flex-1 px-6 py-4 rounded-full bg-white dark:bg-black border border-gray-200 dark:border-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
            />
            <button type="submit" className="px-8 py-4 rounded-full bg-black dark:bg-white text-white dark:text-black font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors flex items-center gap-2">
              <Search className="w-5 h-5" />
              <span className="hidden sm:inline">{t.search}</span>
            </button>
          </form>

          {history && history.length > 0 && (
            <div className="space-y-4">
              {history.map((booking, idx) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  key={booking.id} 
                  className="bg-white dark:bg-black p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                >
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-medium text-lg">{t[booking.serviceType as keyof typeof t]}</span>
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
                      <AlertTriangle className="w-4 h-4" /> Emergency
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

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
                Booking Confirmed!
              </h3>
              <button onClick={() => setConfirmedBooking(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="text-center">
                <p className="text-gray-600 dark:text-gray-400 mb-2">Your booking ID is</p>
                <div className="text-3xl font-mono font-bold tracking-wider">{confirmedBooking.id.toUpperCase()}</div>
              </div>

              <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                <button 
                  onClick={() => generateReceipt(confirmedBooking)}
                  className="w-full py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl font-medium hover:opacity-90 flex items-center justify-center gap-2 transition-colors"
                >
                  <Download className="w-5 h-5" /> Download Receipt
                </button>
                <button 
                  onClick={() => sendWhatsApp(confirmedBooking)}
                  className="w-full py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 flex items-center justify-center gap-2 transition-colors"
                >
                  <MessageSquare className="w-5 h-5" /> Send WhatsApp Message
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
