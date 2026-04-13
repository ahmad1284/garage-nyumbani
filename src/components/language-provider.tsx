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
    heroTitle: "MOBILE GARAGE SERVICE",
    heroSubtitle: "WE ARE A MOBILE GARAGE. WE COME TO YOU AT HOME, OFFICE, OR ROADSIDE EMERGENCIES.",
    bookNow: "BOOK SERVICE",
    checkHistory: "Check History",
    emergency: "EMERGENCY",
    ourServices: "OUR EXPERT SERVICES",
    contactUs: "CONTACT US",
    workingHours: "WORKING HOURS: 24/7 FOR EMERGENCIES",
    bookService: "MAKE YOUR BOOKING",
    name: "FULL NAME",
    phone: "PHONE NUMBER",
    carModel: "CAR MODEL (E.G., TOYOTA IST)",
    serviceType: "SERVICE TYPE",
    location: "YOUR LOCATION (E.G., MPENDAE)",
    date: "DATE & TIME",
    time: "Time",
    submitBooking: "SUBMIT BOOKING",
    admin: "ADMIN LOGIN",
    aiAdvice: "SMART ADVICE",
    aiThinking: "AI IS THINKING...",
    aiAnalyze: "AI SMART ANALYZE",
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
    heroSub: "WE ARE A MOBILE GARAGE. WE COME TO YOU AT HOME, OFFICE, OR ROADSIDE EMERGENCIES.",
    whatsapp: "CHAT ON WHATSAPP",
    servicesTitle: "OUR EXPERT SERVICES",
    noteDistance: "SERVICE AVAILABILITY DEPENDS ON DISTANCE.",
    adminLogin: "ADMIN LOGIN",
    emergencyBadge: "EMERGENCY",
    bookingNumber: "BOOKING NUMBER",
    thankYou: "THANK YOU! YOUR BOOKING IS RECEIVED",
    shareOnWhatsApp: "SEND VIA WHATSAPP",
    callNow: "CALL NOW",
    formTitle: "MAKE YOUR BOOKING",
    labelName: "FULL NAME",
    labelPhone: "PHONE NUMBER",
    labelWhatsapp: "WHATSAPP NUMBER",
    labelCar: "CAR MODEL (E.G., TOYOTA IST)",
    labelService: "SERVICE TYPE",
    labelOtherService: "SPECIFY SERVICE NEEDED",
    labelLocation: "YOUR LOCATION (E.G., MPENDAE)",
    labelDate: "DATE & TIME",
    labelEmergencyCheckbox: "THIS IS AN EMERGENCY",
    submitBtn: "SUBMIT BOOKING",
    helpNow: "NEED HELP RIGHT NOW?",
    backToHome: "BACK TO HOME",
    requestThis: "REQUEST THIS SERVICE",
    searchHistory: "VIEW REPAIR HISTORY",
    searchPlaceholder: "07XXXXXXXX",
    noHistory: "NO HISTORY FOUND FOR THIS NUMBER.",
    nextServiceDue: "INSIGHT: NEXT SERVICE DUE:",
    historyTitle: "VEHICLE MAINTENANCE LOG",
    reminderSent: "REMINDER SENT SUCCESSFULLY!",
    addRecord: "ADD SERVICE RECORD",
    reminders: "SERVICE REMINDERS",
    upcomingServices: "UPCOMING SERVICES (14 DAYS)",
    receiptTitle: "BOOKING RECEIPT",
    printReceipt: "DOWNLOAD/PRINT RECEIPT",
    details: "DETAILS",
    invoiceTitle: "INVOICE",
    generateInvoice: "GENERATE INVOICE",
    labelPrice: "AMOUNT (TZS)",
    labelWorkDone: "WORK COMPLETED",
    totalAmount: "TOTAL",
    workDescription: "WORK DESCRIPTION",
    faqTitle: "FREQUENTLY ASKED QUESTIONS",
    notifyCustomer: "NOTIFY CUSTOMER",
    dueSoon: "DUE SOON",
    labelNotes: "ADDITIONAL NOTES",
  },
  sw: {
    heroTitle: "HUDUMA YA GARAGE INAYOTEMBEA",
    heroSubtitle: "SISI NI GARAGE INAYOTEMBEA. TUNAKUFUATA NYUMBANI, OFISINI AU BARABARANI PALE ULIPOPATA DHARURA.",
    bookNow: "WEKA BOOKING",
    checkHistory: "Angalia Historia",
    emergency: "DHARURA",
    ourServices: "HUDUMA ZETU ZA KIBINGWA",
    contactUs: "WASILIANA NASI",
    workingHours: "MASAA YA KAZI: 24/7 KWA DHARURA",
    bookService: "WEKA BOOKING YAKO",
    name: "JINA KAMILI",
    phone: "NAMBA YA SIMU",
    carModel: "AINA YA GARI (MF: TOYOTA IST)",
    serviceType: "AINA YA HUDUMA",
    location: "ENEO ULIPO (MF: MPENDAE)",
    date: "TAREHE NA MUDA",
    time: "Muda",
    submitBooking: "TUMA BOOKING",
    admin: "INGIA KAMA ADMIN",
    aiAdvice: "USHAURI WA SMART",
    aiThinking: "AI INAFIKIRI...",
    aiAnalyze: "UCHUNGUZI WA AI",
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
    heroSub: "SISI NI GARAGE INAYOTEMBEA. TUNAKUFUATA NYUMBANI, OFISINI AU BARABARANI PALE ULIPOPATA DHARURA.",
    whatsapp: "CHAT WHATSAPP",
    servicesTitle: "HUDUMA ZETU ZA KIBINGWA",
    noteDistance: "HUDUMA HUTEGEMEA UMBALI WA ENEO.",
    adminLogin: "INGIA KAMA ADMIN",
    emergencyBadge: "DHARURA",
    bookingNumber: "NAMBA YA BOOKING",
    thankYou: "ASANTE! BOOKING YAKO IMEPOKELEWA",
    shareOnWhatsApp: "TUMA BOOKING KWA WHATSAPP",
    callNow: "PIGA SIMU SASA",
    formTitle: "WEKA BOOKING YAKO",
    labelName: "JINA KAMILI",
    labelPhone: "NAMBA YA SIMU",
    labelWhatsapp: "NAMBA YA WHATSAPP",
    labelCar: "AINA YA GARI (MF: TOYOTA IST)",
    labelService: "AINA YA HUDUMA",
    labelOtherService: "TAJA HUDUMA UNAYOHITAJI",
    labelLocation: "ENEO ULIPO (MF: MPENDAE)",
    labelDate: "TAREHE NA MUDA",
    labelEmergencyCheckbox: "HII NI DHARURA",
    submitBtn: "TUMA BOOKING",
    helpNow: "UNAHITAJI MSAADA SASA HIVI?",
    backToHome: "RUDI MWANZO",
    requestThis: "CHAGUA HUDUMA HII",
    searchHistory: "ANGALIA HISTORIA YAKO",
    searchPlaceholder: "07XXXXXXXX",
    noHistory: "HATUJAPATA HISTORIA YOYOTE KWA NAMBA HII.",
    nextServiceDue: "MAENDELEO: SERVICE INAYOFUATA:",
    historyTitle: "RIPOTI YA MATENGENEZO YA GARI",
    reminderSent: "UKUMBUSHO UMETUMWA KWA MAFANIKIO!",
    addRecord: "INGIZA TAARIFA ZA SERVICE",
    reminders: "UKUMBUSHO WA SERVICE",
    upcomingServices: "HUDUMA ZINAZOFUATA (SIKU 14)",
    receiptTitle: "STAKABADHI YA BOOKING",
    printReceipt: "PAKUA/CHAPA STAKABADHI",
    details: "MAELEZO",
    invoiceTitle: "INVOICE",
    generateInvoice: "TENGENEZA INVOIS",
    labelPrice: "GHARAMA (TZS)",
    labelWorkDone: "KAZI ILIYOFANYIKA",
    totalAmount: "JUMLA",
    workDescription: "MAELEZO YA KAZI",
    faqTitle: "MASWALI YANAYOULIZWA MARA KWA MARA",
    notifyCustomer: "MJULISHE MTEJA",
    dueSoon: "SIKU CHACHE",
    labelNotes: "MAELEZO YA ZIADA",
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('sw');

  useEffect(() => {
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
