"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'sw';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Record<string, string>;
}

const translations = {
  en: {
    heroTitle: "Mobile Garage Service",
    heroSubtitle: "We come to you at home, office, or roadside emergencies.",
    bookNow: "Book Service",
    checkHistory: "Check History",
    emergency: "Emergency",
    ourServices: "Our Expert Services",
    contactUs: "Contact Us",
    workingHours: "Working Hours: 24/7 for emergencies",
    bookService: "Make Your Booking",
    name: "Full Name",
    phone: "Phone Number",
    carModel: "Car Model",
    serviceType: "Service Type",
    location: "Location",
    date: "Date",
    time: "Time",
    submitBooking: "Submit Booking",
    admin: "Admin Login",
    aiAdvice: "AI Advice",
    aiThinking: "Analyzing...",
    aiAnalyze: "AI Analyze",
    enterPhone: "Enter your phone number to see past services",
    search: "Search",
    engine: "Engine",
    brakes: "Brakes",
    battery: "Battery",
    ac: "A/C",
    oil: "Oil Change",
    tires: "Tires",
    other: "Other",
    completed: "Completed",
    inprogress: "In Progress",
    cancelled: "Cancelled",
    new: "New",
  },
  sw: {
    heroTitle: "Huduma ya Garage Inayotembea",
    heroSubtitle: "Tunakufuata nyumbani, ofisini au barabarani pale ulipopata dharura.",
    bookNow: "Weka Booking",
    checkHistory: "Angalia Historia",
    emergency: "Dharura",
    ourServices: "Huduma Zetu za Kibingwa",
    contactUs: "Wasiliana Nasi",
    workingHours: "Masaa ya Kazi: 24/7 kwa dharura",
    bookService: "Weka Booking Yako",
    name: "Jina Kamili",
    phone: "Namba ya Simu",
    carModel: "Aina ya Gari",
    serviceType: "Aina ya Huduma",
    location: "Eneo Ulipo",
    date: "Tarehe",
    time: "Muda",
    submitBooking: "Tuma Booking",
    admin: "Ingia kama Admin",
    aiAdvice: "Ushauri wa Smart",
    aiThinking: "AI inafikiri...",
    aiAnalyze: "Uchunguzi wa AI",
    enterPhone: "Ingiza namba yako ya simu kuona historia",
    search: "Tafuta",
    engine: "Injini",
    brakes: "Breki",
    battery: "Betri",
    ac: "Kiyoyozi (A/C)",
    oil: "Kubadilisha Oil",
    tires: "Matairi",
    other: "Nyingine",
    completed: "Imekamilika",
    inprogress: "Inaendelea",
    cancelled: "Imeghairiwa",
    new: "Mpya",
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedLang = localStorage.getItem('garage_lang') as Language;
    if (savedLang && (savedLang === 'en' || savedLang === 'sw')) {
      setLanguage(savedLang);
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('garage_lang', lang);
  };

  const t = translations[language];

  if (!mounted) {
    return null;
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
