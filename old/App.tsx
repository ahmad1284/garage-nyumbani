import React, { useState, useEffect, useRef, forwardRef } from 'react';
import { toCanvas } from 'html-to-image';
import { 
  Search, 
  Calendar, 
  User, 
  Car, 
  Wrench, 
  History, 
  Bell, 
  MessageCircle, 
  FileText, 
  Download, 
  Trash2, 
  Plus, 
  ArrowLeft, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  MapPin, 
  Phone, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  Sparkles, 
  Zap, 
  ShieldCheck, 
  ArrowRight, 
  ExternalLink, 
  Printer, 
  Share2, 
  Filter, 
  MoreVertical, 
  LayoutDashboard, 
  ClipboardList, 
  Send, 
  Info, 
  HelpCircle, 
  Star, 
  Shield, 
  Smartphone, 
  Mail, 
  Globe, 
  Moon, 
  Sun,
  Siren,
  Lock,
  Eye,
  XCircle,
  Search as SearchIcon, 
  Calendar as CalendarIcon, 
  User as UserIcon, 
  Car as CarIcon, 
  Wrench as WrenchIcon, 
  History as HistoryIcon, 
  Bell as BellIcon, 
  MessageCircle as WhatsAppIcon, 
  FileText as InvoiceIcon, 
  Download as DownloadIcon, 
  Trash2 as TrashIcon, 
  Plus as PlusIcon, 
  ArrowLeft as ArrowLeftIcon, 
  ChevronRight as ChevronRightIcon, 
  CheckCircle2 as CheckCircleIcon, 
  AlertCircle as AlertIcon, 
  Clock as ClockIcon, 
  MapPin as MapPinIcon, 
  Phone as PhoneIcon, 
  Settings as SettingsIcon, 
  LogOut as LogOutIcon, 
  Eye as EyeIcon,
  XCircle as XCircleIcon,
  Menu as MenuIcon, 
  X as XIcon, 
  Sparkles as SparklesIcon, 
  Zap as BoltIcon, 
  ShieldCheck as ShieldCheckIcon, 
  ArrowRight as ArrowRightIcon, 
  ExternalLink as ExternalLinkIcon, 
  Printer as PrinterIcon, 
  Share2 as ShareIcon, 
  Filter as FilterIcon, 
  MoreVertical as MoreIcon, 
  LayoutDashboard as DashboardIcon, 
  ClipboardList as LogsIcon, 
  Send as SendIcon, 
  Info as InfoIcon, 
  HelpCircle as HelpIcon, 
  Star as StarIcon, 
  Shield as ShieldIcon, 
  Smartphone as SmartphoneIcon, 
  Mail as MailIcon, 
  Globe as GlobeIcon, 
  Sun as SunIcon,
  Siren as SirenIcon,
  Lock as LockIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { AppView, Booking, ServiceStatus, ServiceRecord, InvoiceItem, ServiceItem } from './types';
import { UI_STRINGS, BUSINESS_NAME, SERVICES, PHONE_NUMBER, WHATSAPP_NUMBER, BUSINESS_LOCATION, FAQ_ITEMS } from './constants';
import { storageService } from './services/storageService';
import { analyzeCarIssue } from './services/geminiService';
import { generateBookingId, createWhatsAppLink } from './utils';

type Language = 'sw' | 'en';

const Logo = ({ className = "w-10 h-10" }: { className?: string }) => (
  <motion.div 
    whileHover={{ 
      rotateY: 180,
      scale: 1.1,
      transition: { duration: 0.6 }
    }}
    style={{ perspective: 1000 }}
    className={`${className} bg-primary rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-primary/20 cursor-pointer`}
  >
    <CarIcon className="w-6 h-6" />
  </motion.div>
);

const MECHANICS = [
  'JUMA BAKARI',
  'SAID HAMAD',
  'ALI KHAMIS',
  'MWINYI HASSAN',
  'SULEIMAN RASHID'
];

// --- Utilities ---
const getServiceIcon = (id: string) => {
  switch (id) {
    case 'scheduled-maintenance': return <CalendarIcon className="w-12 h-12" />;
    case 'engine-performance': return <WrenchIcon className="w-12 h-12" />;
    case 'engine-noise-diagnosis': return <AlertIcon className="w-12 h-12" />;
    case 'tire-recovery': return <CarIcon className="w-12 h-12" />;
    case 'brake-systems': return <ShieldCheckIcon className="w-12 h-12" />;
    case 'suspension-steering': return <SettingsIcon className="w-12 h-12" />;
    case 'climate-control': return <SunIcon className="w-12 h-12" />;
    case 'electrical-diagnostics': return <BoltIcon className="w-12 h-12" />;
    default: return <SparklesIcon className="w-12 h-12" />;
  }
};

const downloadAsPdf = async (element: HTMLElement | null, filename: string) => {
  if (!element) return;
  try {
    const canvas = await toCanvas(element, { pixelRatio: 2, skipFonts: true });
    const imgData = canvas.toDataURL('image/jpeg', 1.0);
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a5' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgProps = pdf.getImageProperties(imgData);
    const imgWidth = pageWidth;
    const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
    const yOffset = imgHeight < pageHeight ? (pageHeight - imgHeight) / 2 : 0;
    pdf.addImage(imgData, 'JPEG', 0, yOffset, imgWidth, imgHeight);
    pdf.save(`${filename}.pdf`);
  } catch (err) {
    console.error('PDF generation failed:', err);
    alert('Failed to generate PDF.');
  }
};

const formatCurrency = (val: number | string) => {
  if (!val) return '0';
  const num = typeof val === 'string' ? parseFloat(val.replace(/,/g, '')) : val;
  if (isNaN(num)) return '0';
  return num.toLocaleString('en-US');
};

/**
 * Redesigned Modern Modal
 */
const Modal = ({ isOpen, onClose, title, children, maxWidth = "max-w-md" }: { isOpen: boolean, onClose: () => void, title: string, children?: React.ReactNode, maxWidth?: string }) => {
  useEffect(() => {
    if (isOpen) { document.body.style.overflow = 'hidden'; } else { document.body.style.overflow = 'auto'; }
    return () => { document.body.style.overflow = 'auto'; };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md" 
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20, rotateX: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20, rotateX: 10 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            style={{ perspective: 1000 }}
            className={`bg-white dark:bg-gray-900 w-full ${maxWidth} rounded-[2rem] sm:rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[90vh]`}
          >
            <div className="px-6 py-5 sm:px-8 sm:py-7 border-b border-gray-100 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50/80">
              <h3 className="font-black text-base sm:text-xl tracking-tight text-black dark:text-gray-100 uppercase">{title}</h3>
              <button type="button" onClick={onClose} className="group w-10 h-10 flex items-center justify-center bg-white dark:bg-gray-900 hover:bg-black rounded-2xl transition-all duration-300 shadow-xl border border-gray-100 active:scale-90"><svg className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6 6 18M6 6l12 12"/></svg></button>
            </div>
            <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// --- Receipt & Invoice Components ---
const BookingInvoice = forwardRef<HTMLDivElement, { lang: Language, booking: Booking }>(({ lang, booking }, ref) => {
  const s = UI_STRINGS[lang];
  return (
    <div ref={ref} className="bg-white dark:bg-gray-900 p-12 relative font-sans w-[148mm] mx-auto max-w-full text-black dark:text-gray-100 shadow-none border-none uppercase overflow-hidden" style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
      <div className="flex justify-between items-start mb-16 border-b-4 border-blue-600 pb-8">
        <div>
          <h2 className="text-4xl font-black text-blue-700 tracking-tighter mb-2">{BUSINESS_NAME}</h2>
          <div className="text-[10px] font-bold text-gray-400 space-y-0.5 tracking-widest"><p>{BUSINESS_LOCATION}</p><p>TEL: {PHONE_NUMBER}</p></div>
        </div>
        <div className="text-right">
          <div className="bg-blue-700 text-white px-8 py-3 text-2xl font-black mb-3 tracking-widest rounded-xl">{s.invoiceTitle}</div>
          <div className="space-y-1"><p className="text-xs font-black text-gray-300">NO: <span className="text-black dark:text-gray-100">{booking.id}</span></p><p className="text-xs font-black text-gray-300">DATE: <span className="text-black dark:text-gray-100">{new Date().toLocaleDateString()}</span></p></div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-10 mb-16">
        <div className="p-6 bg-blue-50/50 rounded-3xl border border-blue-100 flex flex-col justify-between">
          <div><p className="text-[9px] font-black text-blue-700 uppercase tracking-widest mb-4 opacity-50">BILL TO CUSTOMER</p><p className="text-lg font-black text-black dark:text-gray-100 leading-tight mb-1">{booking.customerName}</p><p className="text-sm font-bold text-blue-600">{booking.phone}</p></div>
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mt-4 border-t border-blue-100 pt-4 uppercase">{booking.location}</p>
        </div>
        <div className="p-6 bg-gray-50 dark:bg-gray-800/50 rounded-3xl border border-gray-100 flex flex-col justify-between">
          <div><p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-4">VEHICLE LOG</p><p className="text-lg font-black text-black dark:text-gray-100 leading-tight mb-1">{booking.carModel}</p></div>
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mt-4 border-t border-gray-200 pt-4 uppercase">{booking.serviceType}</p>
        </div>
      </div>
      <table className="w-full text-left mb-16">
        <thead><tr className="border-b-2 border-gray-100"><th className="py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">{s.workDescription}</th><th className="py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">PRICE (TZS)</th></tr></thead>
        <tbody className="divide-y divide-gray-100">
          {booking.invoiceItems && booking.invoiceItems.length > 0 ? booking.invoiceItems.map((item, idx) => (<tr key={idx}><td className="py-4 font-bold text-sm text-gray-700 uppercase">{item.description}</td><td className="py-4 text-right font-black text-sm">{formatCurrency(item.amount)}</td></tr>)) : <tr><td className="py-8 align-top"><p className="text-base font-black text-black dark:text-gray-100 mb-3">{booking.serviceType}</p><p className="text-[11px] text-gray-600 dark:text-gray-300 font-bold leading-relaxed">{booking.workDone || 'STANDARD MOBILE SERVICE LABOR & PARTS'}</p></td><td className="py-8 text-right align-top"><p className="text-xl font-black text-black dark:text-gray-100">{formatCurrency(booking.price || 0)}</p></td></tr>}
        </tbody>
      </table>
      <div className="flex justify-end pt-8 border-t-2 border-gray-900"><div className="w-72 space-y-4"><div className="flex justify-between items-center bg-blue-700 text-white p-6 rounded-[2rem] shadow-2xl transform translate-x-4"><span className="text-xs font-black uppercase tracking-widest opacity-80">{s.totalAmount}</span><span className="text-2xl font-black">{formatCurrency(booking.price || 0)} TZS</span></div></div></div>
      <div className="mt-32 text-center"><p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.6em] mb-2">QUALITY ASSURED BY GARAGE NYUMBANI</p></div>
    </div>
  );
});

const AdminDashboard = ({ lang, onLogout, onBackToSite }: { lang: Language, onLogout: () => void, onBackToSite: () => void }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'bookings' | 'reminders' | 'logs' | 'whatsapp'>('dashboard');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [records, setRecords] = useState<ServiceRecord[]>([]);
  const [reminders, setReminders] = useState<ServiceRecord[]>([]);
  const [waLogs, setWaLogs] = useState<any[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [autoSend, setAutoSend] = useState(localStorage.getItem('garage_auto_send') === 'true');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assigningBooking, setAssigningBooking] = useState<Booking | null>(null);
  const [viewingBooking, setViewingBooking] = useState<Booking | null>(null);
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [recordData, setRecordData] = useState({ serviceDate: '', nextDate: '', notes: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterServiceType, setFilterServiceType] = useState('ALL');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [sortField, setSortField] = useState<'customerName' | 'serviceDate' | 'serviceType'>('serviceDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [isSendingAll, setIsSendingAll] = useState(false);
  const [openActionMenu, setOpenActionMenu] = useState<string | null>(null);
  const invoiceRef = useRef<HTMLDivElement>(null);
  const s = UI_STRINGS[lang];

  const filteredAndSortedRecords = records
    .filter(r => {
      const matchesSearch = (r.customerName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
                           (r.carModel?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                           (r.serviceType?.toLowerCase() || '').includes(searchTerm.toLowerCase());
      const matchesServiceType = filterServiceType === 'ALL' || r.serviceType === filterServiceType;
      const recordDate = new Date(r.serviceDate);
      const matchesStartDate = !filterStartDate || recordDate >= new Date(filterStartDate);
      const matchesEndDate = !filterEndDate || recordDate <= new Date(filterEndDate);
      return matchesSearch && matchesServiceType && matchesStartDate && matchesEndDate;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortField === 'customerName') {
        comparison = a.customerName.localeCompare(b.customerName);
      } else if (sortField === 'serviceDate') {
        comparison = new Date(a.serviceDate).getTime() - new Date(b.serviceDate).getTime();
      } else if (sortField === 'serviceType') {
        comparison = a.serviceType.localeCompare(b.serviceType);
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

  useEffect(() => { 
    refreshData();
    fetchWaLogs();
  }, []);

  useEffect(() => {
    if (autoSend && reminders.length > 0) {
      const urgent = reminders.filter(r => {
        const daysLeft = Math.ceil((new Date(r.nextServiceDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        return daysLeft <= 2;
      });
      if (urgent.length > 0) {
        console.log("Auto-sending urgent reminders...");
        // In a real app, we'd avoid multiple calls on every render, but here we can trigger it once
      }
    }
  }, [reminders, autoSend]);

  const toggleAutoSend = () => {
    const next = !autoSend;
    setAutoSend(next);
    localStorage.setItem('garage_auto_send', String(next));
    showToast(next ? 'Auto-send enabled' : 'Auto-send disabled', 'info');
  };

  const refreshData = () => {
    const allBookings = storageService.getBookings();
    const allRecords = storageService.getServiceRecords();
    setBookings(allBookings);
    setRecords(allRecords.sort((a, b) => new Date(b.serviceDate).getTime() - new Date(a.serviceDate).getTime()));
    const now = new Date();
    const twoWeeksLater = new Date();
    twoWeeksLater.setDate(now.getDate() + 14);
    const upcoming = allRecords.filter(r => {
      const due = new Date(r.nextServiceDate);
      return due >= now && due <= twoWeeksLater;
    });
    setReminders(upcoming.sort((a,b) => new Date(a.nextServiceDate).getTime() - new Date(b.nextServiceDate).getTime()));
  };

  const fetchWaLogs = async () => {
    try {
      const res = await fetch('/api/whatsapp/logs');
      if (res.ok) {
        const data = await res.json();
        setWaLogs(data);
      }
    } catch (err) {
      console.error("Failed to fetch WA logs", err);
    }
  };

  const [isManualRecordModalOpen, setIsManualRecordModalOpen] = useState(false);

  const exportServiceLogs = () => {
    try {
      const doc = new jsPDF();
      const tableColumn = ["ID", "Customer", "Car Model", "Service Type", "Date", "Next Service", "Notes"];
      const tableRows: any[] = [];

      filteredAndSortedRecords.forEach(record => {
        const recordData = [
          record.id,
          record.customerName,
          record.carModel,
          record.serviceType,
          new Date(record.serviceDate).toLocaleDateString(),
          new Date(record.nextServiceDate).toLocaleDateString(),
          record.notes || "N/A"
        ];
        tableRows.push(recordData);
      });

      doc.setFontSize(18);
      doc.setTextColor(0, 102, 204);
      doc.text("Garage Nyumbani - Service History Logs", 14, 15);
      
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22);
      doc.text(`Total Records: ${filteredAndSortedRecords.length}`, 14, 27);

      (doc as any).autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 35,
        theme: 'grid',
        styles: { fontSize: 7, cellPadding: 2, font: 'helvetica', overflow: 'linebreak' },
        headStyles: { fillColor: [0, 102, 204], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        columnStyles: {
          0: { cellWidth: 15 },
          1: { cellWidth: 30 },
          2: { cellWidth: 30 },
          3: { cellWidth: 30 },
          4: { cellWidth: 20 },
          5: { cellWidth: 20 },
          6: { cellWidth: 'auto' }
        }
      });

      doc.save(`service_logs_${new Date().toISOString().split('T')[0]}.pdf`);
      showToast(lang === 'sw' ? 'Ripoti imepakuliwa!' : 'Report downloaded successfully!');
    } catch (err) {
      console.error("Export failed", err);
      showToast(lang === 'sw' ? 'Imeshindwa kupakua ripoti' : 'Failed to download report', 'error');
    }
  };

  const handleManualRecordSave = (formData: any) => {
    if (!formData.customerName || !formData.phone || !formData.carModel) {
      showToast(lang === 'sw' ? 'Tafadhali jaza taarifa zote' : 'Please fill all required fields', 'error');
      return;
    }

    storageService.saveServiceRecord({
      id: Math.random().toString(36).substr(2, 9),
      phone: formData.phone,
      customerName: formData.customerName,
      carModel: formData.carModel,
      serviceType: formData.serviceType,
      serviceDate: formData.serviceDate,
      nextServiceDate: formData.nextDate,
      notes: formData.notes + " (CALL-IN BOOKING)"
    });
    
    refreshData();
    setIsManualRecordModalOpen(false);
    showToast(lang === 'sw' ? 'Rekodi ya simu imehifadhiwa!' : 'Call-in record saved successfully!');
  };

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleUpdateStatus = (id: string, status: ServiceStatus) => {
    if (status === 'Completed') {
      const booking = bookings.find(b => b.id === id);
      if (booking) {
        handleAddRecord(booking);
        return;
      }
    }
    storageService.updateBookingStatus(id, status);
    refreshData();
    showToast(`${lang === 'sw' ? 'Hali imebadilishwa kuwa' : 'Status updated to'} ${status}`);
  };

  const handleAssignMechanic = (mechanic: string) => {
    if (assigningBooking) {
      storageService.assignMechanic(assigningBooking.id, mechanic);
      refreshData();
      setIsAssignModalOpen(false);
      setAssigningBooking(null);
      showToast(lang === 'sw' ? `Fundi ${mechanic} amepangiwa na kazi inaanza!` : `Mechanic ${mechanic} assigned and work is in progress!`);
    }
  };

  const openInvoiceGenerator = (booking: Booking) => {
    setSelectedBooking(booking);
    setInvoiceItems(booking.invoiceItems || [{ description: 'LABOR & PARTS', amount: booking.price || 0 }]);
    setIsInvoiceModalOpen(true);
  };

  const addInvoiceItem = () => setInvoiceItems([...invoiceItems, { description: '', amount: 0 }]);
  const removeInvoiceItem = (idx: number) => setInvoiceItems(invoiceItems.filter((_, i) => i !== idx));
  const updateInvoiceItem = (idx: number, field: keyof InvoiceItem, value: any) => {
    const next = [...invoiceItems];
    next[idx] = { ...next[idx], [field]: value };
    setInvoiceItems(next);
  };

  const saveInvoice = () => {
    if (selectedBooking) {
      const total = invoiceItems.reduce((acc, item) => acc + (parseFloat(item.amount as any) || 0), 0);
      const workDoneText = invoiceItems.map(i => i.description).join(', ');
      const updatedBooking = { ...selectedBooking, price: total, workDone: workDoneText, invoiceItems: invoiceItems };
      const all = storageService.getBookings();
      const idx = all.findIndex(b => b.id === selectedBooking.id);
      if (idx !== -1) { all[idx] = updatedBooking; localStorage.setItem('garage_nyumbani_bookings', JSON.stringify(all)); }
      refreshData();
      setIsInvoiceModalOpen(false);
      showToast(lang === 'sw' ? 'Invois imehifadhiwa!' : 'Invoice saved successfully!');
    }
  };

  const handleAddRecord = (booking: Booking) => {
    setSelectedBooking(booking);
    const today = new Date().toISOString().split('T')[0];
    const nextDate = new Date();
    nextDate.setMonth(nextDate.getMonth() + 3);
    setRecordData({ serviceDate: today, nextDate: nextDate.toISOString().split('T')[0], notes: '' });
    setIsRecordModalOpen(true);
  };

  const saveRecord = () => {
    if (selectedBooking) {
      storageService.saveServiceRecord({
        id: Math.random().toString(36).substr(2, 9),
        phone: selectedBooking.phone,
        customerName: selectedBooking.customerName,
        carModel: selectedBooking.carModel,
        serviceType: selectedBooking.serviceType,
        serviceDate: recordData.serviceDate || new Date().toISOString(),
        nextServiceDate: recordData.nextDate,
        notes: recordData.notes
      });
      refreshData();
      setIsRecordModalOpen(false);
      showToast(lang === 'sw' ? 'Ripoti ya service imeongezwa!' : 'Service record added!');
    }
  };

  const sendWhatsAppApiReminder = async (record: ServiceRecord) => {
    const daysLeft = Math.ceil((new Date(record.nextServiceDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    let msg = "";
    if (daysLeft > 0) {
      msg = lang === 'sw' 
        ? `Habari ${record.customerName}, Service yako ya ${record.serviceType} kwa gari ${record.carModel} inakaribia! Imebaki siku ${daysLeft}. Karibu Garage Nyumbani!` 
        : `Hello ${record.customerName}, your ${record.serviceType} service for ${record.carModel} is due in ${daysLeft} days! Book now with Garage Nyumbani.`;
    } else {
      msg = lang === 'sw'
        ? `Habari ${record.customerName}, Service yako ya ${record.serviceType} kwa gari ${record.carModel} imeshafika muda wake! Karibu Garage Nyumbani.`
        : `Hello ${record.customerName}, your ${record.serviceType} service for ${record.carModel} is now due! Book your maintenance with Garage Nyumbani today.`;
    }

    try {
      const res = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: record.phone,
          message: msg,
          customerName: record.customerName
        })
      });

      if (res.ok) {
        showToast(lang === 'sw' ? 'Ujumbe wa WhatsApp umetumwa!' : 'WhatsApp reminder sent via API!');
        fetchWaLogs();
      } else {
        throw new Error("API failed");
      }
    } catch (err) {
      console.error(err);
      showToast(lang === 'sw' ? 'Imeshindwa kutuma WhatsApp' : 'Failed to send WhatsApp via API', 'error');
      // Fallback to manual link if API fails
      const waLink = `https://wa.me/${record.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`;
      window.open(waLink, '_blank');
    }
  };

  const sendAllDueReminders = async () => {
    const due = reminders.filter(r => {
      const daysLeft = Math.ceil((new Date(r.nextServiceDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      return daysLeft <= 7;
    });

    if (due.length === 0) {
      showToast(lang === 'sw' ? 'Hakuna service zinazohitaji taarifa' : 'No services due for reminders', 'info');
      return;
    }

    if (!confirm(lang === 'sw' ? `Tuma jumbe ${due.length} za WhatsApp sasa?` : `Send ${due.length} WhatsApp reminders now?`)) return;

    setIsSendingAll(true);
    for (const record of due) {
      await sendWhatsAppApiReminder(record);
      // Small delay between messages
      await new Promise(r => setTimeout(r, 500));
    }
    setIsSendingAll(false);
    showToast(lang === 'sw' ? 'Jumbe zote zimetumwa!' : 'All reminders sent successfully!');
  };

  const filteredBookings = bookings.filter(b => 
    (b.customerName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
    (b.phone || '').includes(searchTerm) || 
    (b.carModel?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (b.serviceType?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (b.status?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (b.location?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const filteredReminders = reminders.filter(r => 
    (r.customerName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
    (r.carModel?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (r.serviceType?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (r.phone || '').includes(searchTerm) ||
    (r.notes?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const filteredWaLogs = waLogs.filter(log => 
    (log.customerName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
    (log.phone || '').includes(searchTerm) || 
    (log.message?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const totalInvoice = invoiceItems.reduce((acc, item) => acc + (parseFloat(item.amount as any) || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-800/50 pb-20">
      {toast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[150] animate-in fade-in slide-in-from-top-4">
          <div className={`px-8 py-4 rounded-2xl shadow-2xl font-black text-[10px] sm:text-xs tracking-widest text-white uppercase flex items-center gap-3 ${toast.type === 'error' ? 'bg-red-600' : toast.type === 'info' ? 'bg-blue-600' : 'bg-green-500'}`}>
            {toast.message}
          </div>
        </div>
      )}

      {/* Admin Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-line dark:border-gray-800 px-6 py-4 md:py-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-20 pointer-events-none" />
        <div className="max-w-7xl mx-auto flex flex-col lg:grid lg:grid-cols-12 justify-between items-start lg:items-center gap-8 relative z-10">
          <div className="lg:col-span-4 flex items-center gap-6">
            <Logo className="w-14 h-14 sm:w-20 sm:h-20 drop-shadow-2xl" />
            <div>
              <h2 className="text-2xl sm:text-5xl font-display font-black tracking-tighter text-black dark:text-white uppercase leading-none">Admin Console</h2>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">System Online</p>
                </div>
                <span className="text-gray-200">|</span>
                <button onClick={onBackToSite} className="text-[9px] font-black uppercase tracking-widest text-primary hover:underline flex items-center gap-1">
                  <ArrowLeftIcon className="w-3 h-3" /> Back to Site
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 w-full">
            <div className="relative group">
              <SearchIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-primary transition-colors" />
              <input 
                type="text" 
                placeholder="GLOBAL SEARCH: BOOKINGS, RECORDS, CUSTOMERS..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-14 pr-6 py-5 bg-gray-50 dark:bg-gray-800/50 border border-line dark:border-gray-800 rounded-2xl text-xs font-black outline-none focus:border-primary transition-all shadow-inner focus:bg-white dark:bg-gray-900 focus:ring-8 focus:ring-primary/5 uppercase tracking-widest placeholder:text-gray-300"
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black dark:text-white"
                >
                  <XIcon className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          <div className="lg:col-span-3 flex items-center justify-end gap-4 w-full">
            <button 
              onClick={onLogout} 
              className="w-full sm:w-auto bg-black text-white px-8 py-4 rounded-xl font-black text-[11px] tracking-widest hover:bg-primary-dark transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-3 uppercase ring-4 ring-black/5"
            >
              <LogOutIcon className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>
      </div>

      {/* Admin Navigation */}
      <div className="bg-white dark:bg-gray-900 border-b border-line dark:border-gray-800 sticky top-0 z-[100] shadow-xl backdrop-blur-xl bg-white dark:bg-gray-900/90 dark:bg-gray-900/90">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-3">
            {[
              { id: 'dashboard', label: lang === 'sw' ? 'MCHANGANUO' : 'DASHBOARD', icon: <DashboardIcon className="w-4 h-4" /> },
              { id: 'bookings', label: lang === 'sw' ? 'MAOMBI' : 'BOOKINGS', icon: <BellIcon className="w-4 h-4" /> },
              { id: 'reminders', label: lang === 'sw' ? 'VIKUMBUSHO' : 'REMINDERS', icon: <ClockIcon className="w-4 h-4" /> },
              { id: 'logs', label: lang === 'sw' ? 'RIPOTI' : 'SERVICE LOGS', icon: <LogsIcon className="w-4 h-4" /> },
              { id: 'whatsapp', label: lang === 'sw' ? 'WHATSAPP' : 'WA HISTORY', icon: <WhatsAppIcon className="w-4 h-4" /> }
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-3 py-4 px-8 rounded-2xl transition-all relative group whitespace-nowrap ${activeTab === tab.id ? 'bg-black text-white shadow-2xl shadow-black/20' : 'text-gray-400 hover:text-black dark:text-white hover:bg-gray-50 dark:bg-gray-800/50'}`}
              >
                <span className={`transition-colors ${activeTab === tab.id ? 'text-white' : 'text-gray-400 group-hover:text-primary'}`}>{tab.icon}</span>
                <span className="text-[11px] font-black uppercase tracking-widest">{tab.label}</span>
                {activeTab === tab.id && (
                  <motion.div 
                    layoutId="activeTab"
                    className="absolute -bottom-3 left-8 right-8 h-1 bg-primary rounded-full"
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8 sm:space-y-12 overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, x: 50, rotateY: 10 }}
              animate={{ opacity: 1, x: 0, rotateY: 0 }}
              exit={{ opacity: 0, x: -50, rotateY: -10 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              style={{ perspective: 1000 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
                <div className="card p-8 flex flex-col justify-between relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full translate-x-8 -translate-y-8 group-hover:scale-150 transition-transform duration-700" />
                  <div className="flex justify-between items-start mb-6 relative z-10">
                    <div className="bg-primary-light p-4 rounded-2xl text-primary shadow-lg shadow-primary/10"><BellIcon className="w-6 h-6" /></div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 bg-gray-50 dark:bg-gray-800/50 px-3 py-1 rounded-full border border-line dark:border-gray-800">Lifetime</span>
                  </div>
                  <div className="relative z-10">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Total Bookings</p>
                    <h4 className="text-4xl font-display font-black text-black dark:text-white tracking-tighter">{filteredBookings.length}</h4>
                  </div>
                  <div className="mt-6 h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden relative z-10">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      className="bg-primary h-full shadow-lg shadow-primary/30"
                    />
                  </div>
                </div>

                <div className="card p-8 flex flex-col justify-between relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-full translate-x-8 -translate-y-8 group-hover:scale-150 transition-transform duration-700" />
                  <div className="flex justify-between items-start mb-6 relative z-10">
                    <div className="bg-orange-50 p-4 rounded-2xl text-orange-600 shadow-lg shadow-orange-500/10"><ClockIcon className="w-6 h-6" /></div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-orange-600 bg-orange-50 px-3 py-1 rounded-full border border-orange-100">Action Required</span>
                  </div>
                  <div className="relative z-10">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Pending Reminders</p>
                    <h4 className="text-4xl font-display font-black text-black dark:text-white tracking-tighter">{filteredReminders.length}</h4>
                  </div>
                  <div className="mt-6 h-1.5 w-full bg-orange-50 rounded-full overflow-hidden border border-orange-100 relative z-10">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((filteredReminders.length / 10) * 100, 100)}%` }}
                      className="bg-orange-500 h-full shadow-lg shadow-orange-500/30"
                    />
                  </div>
                </div>

                <div className="card p-8 flex flex-col justify-between relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/5 rounded-full translate-x-8 -translate-y-8 group-hover:scale-150 transition-transform duration-700" />
                  <div className="flex justify-between items-start mb-6 relative z-10">
                    <div className="bg-green-50 p-4 rounded-2xl text-green-600 shadow-lg shadow-green-500/10"><WhatsAppIcon className="w-6 h-6" /></div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-100">Automated</span>
                  </div>
                  <div className="relative z-10">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">WA Messages Sent</p>
                    <h4 className="text-4xl font-display font-black text-black dark:text-white tracking-tighter">{filteredWaLogs.length}</h4>
                  </div>
                  <div className="mt-6 h-1.5 w-full bg-green-50 rounded-full overflow-hidden border border-green-100 relative z-10">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((filteredWaLogs.length / 20) * 100, 100)}%` }}
                      className="bg-green-500 h-full shadow-lg shadow-green-500/30"
                    />
                  </div>
                </div>

                <div className="bg-black p-8 rounded-3xl shadow-2xl flex flex-col justify-between group relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-white dark:bg-gray-900/5 rounded-full translate-x-8 -translate-y-8 group-hover:scale-150 transition-transform duration-700" />
                  <div className="flex justify-between items-start mb-6 relative z-10">
                    <div className="bg-white dark:bg-gray-900/10 p-4 rounded-2xl text-white shadow-lg shadow-white/5"><BoltIcon className="w-6 h-6" /></div>
                    <div className={`w-3 h-3 rounded-full shadow-lg ${autoSend ? 'bg-green-400 animate-pulse shadow-green-400/50' : 'bg-red-400 shadow-red-400/50'}`} />
                  </div>
                  <div className="relative z-10">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Auto-Reminders</p>
                    <h4 className={`text-2xl font-display font-black tracking-widest ${autoSend ? 'text-green-400' : 'text-red-400'}`}>{autoSend ? 'ACTIVE' : 'DISABLED'}</h4>
                  </div>
                  <button onClick={toggleAutoSend} className="mt-8 bg-white dark:bg-gray-900/10 hover:bg-white dark:bg-gray-900 text-white hover:text-black dark:text-white text-[10px] font-black py-4 px-6 rounded-xl transition-all uppercase tracking-widest active:scale-95 relative z-10 border border-white/5">
                    Toggle Status
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="card p-10 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full translate-x-24 -translate-y-24 group-hover:scale-150 transition-transform duration-1000" />
                  <div className="flex justify-between items-center mb-10 relative z-10">
                    <h3 className="text-2xl font-display font-black text-black dark:text-white uppercase tracking-tight flex items-center gap-4">
                      <span className="bg-primary-light p-3 rounded-2xl text-primary shadow-lg shadow-primary/10"><BellIcon className="w-6 h-6" /></span>
                      Recent Activity
                    </h3>
                    <button onClick={() => setActiveTab('bookings')} className="text-[10px] font-black uppercase tracking-widest text-white hover:bg-gray-800 bg-black px-4 py-2 rounded-xl border border-black transition-all">View All</button>
                  </div>
                  <div className="space-y-4">
                    {filteredBookings.slice(-5).reverse().map(b => (
                      <div 
                        key={b.id} 
                        className="flex items-center gap-4 p-5 hover:bg-gray-50 dark:bg-gray-800/50 rounded-2xl transition-all border border-transparent hover:border-line dark:border-gray-800 group"
                      >
                        <div 
                          onClick={() => { setViewingBooking(b); setIsDetailModalOpen(true); }}
                          className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center text-gray-400 font-black group-hover:bg-primary group-hover:text-white transition-all text-sm cursor-pointer"
                        >
                          {b.customerName?.charAt(0) || '?'}
                        </div>
                        <div 
                          onClick={() => { setViewingBooking(b); setIsDetailModalOpen(true); }}
                          className="flex-grow cursor-pointer"
                        >
                          <div className="flex justify-between items-start">
                            <p className="text-xs font-black text-black dark:text-white uppercase tracking-tight">{b.customerName} booked {b.serviceType}</p>
                            <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">{new Date(b.createdAt).toLocaleDateString()}</span>
                          </div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase mt-1 tracking-wider">{b.carModel} • <span className="text-primary">{b.status}</span></p>
                        </div>
                        <div className="relative">
                          <button 
                            onClick={(e) => { e.stopPropagation(); setOpenActionMenu(openActionMenu === b.id ? null : b.id); }}
                            className="bg-black text-white p-3 rounded-xl hover:bg-gray-800 transition-all shadow-lg active:scale-95"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          {openActionMenu === b.id && (
                            <div className="absolute top-full right-0 w-48 mt-2 bg-white dark:bg-gray-900 border border-line dark:border-gray-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                              {(b.status === 'New' || b.status === 'In Progress') && (
                                <button 
                                  onClick={() => { setAssigningBooking(b); setIsAssignModalOpen(true); setOpenActionMenu(null); }}
                                  className="w-full px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest bg-black text-white hover:bg-gray-800 transition-colors flex items-center gap-3 border-b border-line dark:border-gray-800"
                                >
                                  <WrenchIcon className="w-4 h-4" /> Assign
                                </button>
                              )}
                              {b.status === 'In Progress' && (
                                <button 
                                  onClick={() => { handleAddRecord(b); setOpenActionMenu(null); }}
                                  className="w-full px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest hover:bg-green-600 hover:text-white transition-colors flex items-center gap-3 border-b border-line dark:border-gray-800"
                                >
                                  <CheckCircleIcon className="w-4 h-4" /> Complete
                                </button>
                              )}
                              <button 
                                onClick={() => { setViewingBooking(b); setIsDetailModalOpen(true); setOpenActionMenu(null); }}
                                className="w-full px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-colors flex items-center gap-3 border-b border-line dark:border-gray-800"
                              >
                                <EyeIcon className="w-4 h-4" /> Details
                              </button>
                              {(b.status !== 'Cancelled' && b.status !== 'Completed') && (
                                <button 
                                  onClick={() => { handleUpdateStatus(b.id, 'Cancelled'); setOpenActionMenu(null); }}
                                  className="w-full px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-colors flex items-center gap-3"
                                >
                                  <XCircleIcon className="w-4 h-4" /> Cancel
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card p-10 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/5 rounded-full translate-x-24 -translate-y-24 group-hover:scale-150 transition-transform duration-1000" />
                  <div className="flex justify-between items-center mb-10 relative z-10">
                    <h3 className="text-2xl font-display font-black text-black dark:text-white uppercase tracking-tight flex items-center gap-4">
                      <span className="bg-orange-50 p-3 rounded-2xl text-orange-600 shadow-lg shadow-orange-500/10"><SparklesIcon className="w-6 h-6" /></span>
                      Service Records
                    </h3>
                    <button onClick={() => setActiveTab('reminders')} className="text-[10px] font-black uppercase tracking-widest text-orange-600 hover:underline bg-orange-50 px-4 py-2 rounded-xl border border-orange-100">View History</button>
                  </div>
                  <div className="space-y-4">
                    {filteredAndSortedRecords.slice(0, 5).map(r => (
                      <div 
                        key={r.id} 
                        className="flex items-start gap-4 p-4 hover:bg-gray-50 dark:bg-gray-800/50 rounded-xl transition-all border border-transparent hover:border-line dark:border-gray-800 group"
                      >
                        <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600 font-black text-sm">
                          {r.customerName?.charAt(0) || '?'}
                        </div>
                        <div className="flex-grow">
                          <div className="flex justify-between items-start">
                            <p className="text-xs font-bold text-black dark:text-white uppercase">{r.customerName} - {r.serviceType}</p>
                            <span className="text-[9px] font-bold text-gray-300 uppercase tracking-wider">{new Date(r.serviceDate).toLocaleDateString()}</span>
                          </div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">{r.carModel}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card p-10 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-green-500/5 rounded-full translate-x-24 -translate-y-24 group-hover:scale-150 transition-transform duration-1000" />
                  <div className="flex justify-between items-center mb-10 relative z-10">
                    <h3 className="text-2xl font-display font-black text-black dark:text-white uppercase tracking-tight flex items-center gap-4">
                      <span className="bg-green-50 p-3 rounded-2xl text-green-600 shadow-lg shadow-green-500/10"><WhatsAppIcon className="w-6 h-6" /></span>
                      Latest Messages
                    </h3>
                    <button onClick={() => setActiveTab('whatsapp')} className="text-[10px] font-black uppercase tracking-widest text-green-600 hover:underline bg-green-50 px-4 py-2 rounded-xl border border-green-100">Logs</button>
                  </div>
                  <div className="space-y-4">
                    {filteredWaLogs.slice(0, 5).map(log => (
                      <div key={log.id} className="flex items-start gap-4 p-4 hover:bg-gray-50 dark:bg-gray-800/50 rounded-xl transition-all border border-transparent hover:border-line dark:border-gray-800">
                        <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
                          <WhatsAppIcon className="w-5 h-5" />
                        </div>
                        <div className="flex-grow">
                          <div className="flex justify-between items-start">
                            <p className="text-xs font-bold text-black dark:text-white uppercase">Sent to {log.customerName}</p>
                            <span className="text-[9px] font-bold text-gray-300 uppercase tracking-wider">{new Date(log.timestamp).toLocaleTimeString()}</span>
                          </div>
                          <p className="text-[10px] font-bold text-gray-400 line-clamp-1 mt-1 italic">"{log.message}"</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'bookings' && (
            <motion.div 
              key="bookings"
              initial={{ opacity: 0, x: 50, rotateY: 10 }}
              animate={{ opacity: 1, x: 0, rotateY: 0 }}
              exit={{ opacity: 0, x: -50, rotateY: -10 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              style={{ perspective: 1000 }}
              className="space-y-8"
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-4 bg-white dark:bg-gray-900 p-2 rounded-2xl border border-line dark:border-gray-800 shadow-sm">
                  <button onClick={() => setSearchTerm('')} className="px-6 py-3 micro-label text-gray-400 hover:text-black dark:text-white transition-all">Clear</button>
                  <div className="h-8 w-px bg-line" />
                  <span className="px-6 py-3 micro-label text-primary">{filteredBookings.length} Active</span>
                </div>
              </div>

              <div className="space-y-8">
                <div className="flex items-center justify-between border-b border-line dark:border-gray-800 pb-6">
                  <h3 className="text-3xl font-display font-black text-black dark:text-white uppercase tracking-tight">Active Bookings</h3>
                  <div className="flex items-center gap-3">
                    <span className="bg-black text-white px-6 py-2 rounded-full text-[10px] font-black tracking-widest">{filteredBookings.length} Total</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-6">
                  {filteredBookings.slice().reverse().map(booking => (
                    <div key={booking.id} className="card p-8 sm:p-10 group relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-primary-light/20 rounded-full translate-x-16 -translate-y-16 group-hover:scale-150 transition-transform duration-700" />
                      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-10 relative z-10">
                        <div className="lg:col-span-8 space-y-6">
                          <div className="flex flex-wrap items-center gap-4">
                            <span className={`text-[10px] font-black px-5 py-2 rounded-full uppercase tracking-widest shadow-sm ${booking.status === 'Completed' ? 'bg-green-100 text-green-600' : booking.status === 'In Progress' ? 'bg-primary-light text-primary' : booking.status === 'Cancelled' ? 'bg-red-100 text-red-600' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'}`}>{booking.status}</span>
                            {booking.isEmergency && <span className="bg-red-600 text-white text-[10px] font-black px-5 py-2 rounded-full uppercase tracking-widest animate-pulse shadow-lg shadow-red-500/30">Emergency</span>}
                            <span className="text-[11px] font-bold text-gray-300 tracking-widest">ID: {booking.id}</span>
                          </div>
                          <h3 className="text-2xl sm:text-4xl font-display font-black text-black dark:text-white uppercase leading-tight group-hover:text-primary transition-colors">{booking.serviceType}</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <div className="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-2xl border border-line dark:border-gray-800">
                              <p className="micro-label text-primary mb-2">Customer</p>
                              <p className="text-sm font-black text-black dark:text-white uppercase">{booking.customerName}</p>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-2xl border border-line dark:border-gray-800">
                              <p className="micro-label text-primary mb-2">Vehicle</p>
                              <p className="text-sm font-black text-black dark:text-white uppercase">{booking.carModel}</p>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-2xl border border-line dark:border-gray-800">
                              <p className="micro-label text-primary mb-2">Location</p>
                              <p className="text-sm font-black text-black dark:text-white uppercase">{booking.location}</p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-4 mt-8">
                            <a href={`tel:${booking.phone}`} className="bg-red-600 text-white font-black py-4 px-10 rounded-xl flex items-center gap-4 text-xs transition-all shadow-xl hover:bg-red-700 active:scale-95 uppercase tracking-widest"><PhoneIcon className="w-5 h-5" /> Call Client</a>
                            <a href={createWhatsAppLink(booking)} target="_blank" rel="noopener noreferrer" className="bg-green-600 text-white font-black py-4 px-10 rounded-xl flex items-center gap-4 text-xs transition-all shadow-xl hover:bg-green-700 active:scale-95 uppercase tracking-widest"><WhatsAppIcon className="w-5 h-5" /> WhatsApp</a>
                          </div>
                        </div>
                        <div className="lg:col-span-4 flex flex-col justify-center gap-6 bg-gray-50 dark:bg-gray-800/50 p-8 rounded-3xl border border-line dark:border-gray-800">
                          <div className="relative">
                            <button 
                              onClick={() => setOpenActionMenu(openActionMenu === booking.id ? null : booking.id)}
                              className="w-full bg-black text-white py-4 rounded-[20px] font-black text-[10px] uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 hover:bg-gray-800 transition-all active:scale-95"
                            >
                              <MoreVertical className="w-4 h-4" /> Action
                            </button>
                            {openActionMenu === booking.id && (
                              <div className="absolute top-full left-0 w-full mt-2 bg-white dark:bg-gray-900 border border-line dark:border-gray-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                {(booking.status === 'New' || booking.status === 'In Progress') && (
                                  <button 
                                    onClick={() => { setAssigningBooking(booking); setIsAssignModalOpen(true); setOpenActionMenu(null); }}
                                    className="w-full px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest bg-black text-white hover:bg-gray-800 transition-colors flex items-center gap-3 border-b border-line dark:border-gray-800"
                                  >
                                    <WrenchIcon className="w-4 h-4" /> Assign Mechanic
                                  </button>
                                )}
                                {booking.status === 'In Progress' && (
                                  <button 
                                    onClick={() => { handleAddRecord(booking); setOpenActionMenu(null); }}
                                    className="w-full px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest hover:bg-green-600 hover:text-white transition-colors flex items-center gap-3 border-b border-line dark:border-gray-800"
                                  >
                                    <CheckCircleIcon className="w-4 h-4" /> Mark Completed
                                  </button>
                                )}
                                <button 
                                  onClick={() => { setViewingBooking(booking); setIsDetailModalOpen(true); setOpenActionMenu(null); }}
                                  className="w-full px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-colors flex items-center gap-3 border-b border-line dark:border-gray-800"
                                >
                                  <EyeIcon className="w-4 h-4" /> View Details
                                </button>
                                {(booking.status !== 'Cancelled' && booking.status !== 'Completed') && (
                                  <button 
                                    onClick={() => { handleUpdateStatus(booking.id, 'Cancelled'); setOpenActionMenu(null); }}
                                    className="w-full px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-colors flex items-center gap-3"
                                  >
                                    <XCircleIcon className="w-4 h-4" /> Cancel Booking
                                  </button>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="space-y-2">
                            <label className="micro-label text-primary ml-2">Update Status</label>
                            <select value={booking.status} onChange={(e) => handleUpdateStatus(booking.id, e.target.value as ServiceStatus)} className="w-full bg-white dark:bg-gray-900 border border-line dark:border-gray-800 rounded-xl px-6 py-4 font-black text-xs outline-none focus:border-primary shadow-sm uppercase appearance-none cursor-pointer transition-all">
                              <option value="New">New Request</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Completed">Completed</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <button 
                              onClick={() => openInvoiceGenerator(booking)} 
                              className="bg-black border border-line dark:border-gray-800 text-white py-5 rounded-xl font-black text-[10px] hover:bg-primary transition-all shadow-sm flex flex-col items-center justify-center gap-2 active:scale-95 uppercase tracking-widest"
                            >
                              <InvoiceIcon className="w-6 h-6" /> Invoice
                            </button>
                            <motion.button 
                              whileHover={{ scale: 1.02, backgroundColor: "#1a1a1a" }}
                              whileTap={{ scale: 0.98, backgroundColor: "#333333" }}
                              onClick={() => handleAddRecord(booking)} 
                              className="bg-black text-white py-5 rounded-[20px] font-black text-[10px] shadow-xl flex flex-col items-center justify-center gap-2 uppercase tracking-widest"
                            >
                              <PlusIcon className="w-6 h-6" /> Record
                            </motion.button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'reminders' && (
            <motion.div 
              key="reminders"
              initial={{ opacity: 0, x: 50, rotateY: 10 }}
              animate={{ opacity: 1, x: 0, rotateY: 0 }}
              exit={{ opacity: 0, x: -50, rotateY: -10 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              style={{ perspective: 1000 }}
              className="space-y-12"
            >
              <section className="bg-black p-8 sm:p-16 rounded-3xl shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white dark:bg-gray-900/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none group-hover:scale-110 transition-transform duration-1000" />
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 mb-12 relative z-10">
                  <div className="flex items-center gap-6">
                    <div className="bg-white dark:bg-gray-900/10 p-5 rounded-2xl text-white shadow-2xl ring-4 ring-white/5"><BellIcon className="w-8 h-8" /></div>
                    <div>
                      <h3 className="text-3xl sm:text-5xl font-display font-black text-white uppercase tracking-tight">{s.upcomingServices}</h3>
                      <p className="text-white/40 micro-label mt-1">Proactive Customer Care</p>
                    </div>
                  </div>
                  <motion.button 
                    whileHover={{ scale: 1.02, backgroundColor: "#1a1a1a" }}
                    whileTap={{ scale: 0.98, backgroundColor: "#333333" }}
                    onClick={sendAllDueReminders} 
                    disabled={isSendingAll}
                    className="w-full lg:w-auto bg-black text-white px-10 py-5 rounded-xl font-black text-xs tracking-widest uppercase shadow-2xl transition-all flex items-center justify-center gap-4 disabled:opacity-50"
                  >
                    <WhatsAppIcon className="w-6 h-6" /> {isSendingAll ? 'Sending...' : 'Send All Reminders'}
                  </motion.button>
                </div>
                
                {filteredReminders.length === 0 ? (
                  <div className="bg-white dark:bg-gray-900/5 border border-dashed border-white/10 p-20 rounded-3xl text-center relative z-10">
                    <p className="text-white/20 font-black uppercase tracking-widest">No upcoming services due</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 relative z-10">
                    {filteredReminders.map(record => {
                      const daysLeft = Math.ceil((new Date(record.nextServiceDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                      const urgencyColor = daysLeft <= 3 ? 'bg-red-500' : daysLeft <= 7 ? 'bg-orange-500' : 'bg-green-500';
                      return (
                        <div key={record.id} className="bg-white dark:bg-gray-900/5 backdrop-blur-xl p-8 rounded-3xl border border-white/10 shadow-2xl flex flex-col justify-between hover:bg-white dark:bg-gray-900/10 transition-all group/card">
                          <div>
                            <div className="flex justify-between items-start mb-6">
                              <span className={`text-[9px] font-black text-white px-4 py-2 rounded-lg uppercase tracking-widest shadow-lg ${urgencyColor} ${daysLeft <= 3 ? 'animate-pulse' : ''}`}>
                                {daysLeft <= 0 ? 'Due Now' : `Due in ${daysLeft} Days`}
                              </span>
                              <span className="text-[10px] font-bold text-white/30 tracking-widest">{new Date(record.nextServiceDate).toLocaleDateString()}</span>
                            </div>
                            <h4 className="font-display font-black text-white text-xl uppercase leading-tight group-hover/card:text-primary transition-colors">{record.customerName}</h4>
                            <p className="text-[11px] font-bold text-white/40 mt-2 tracking-wider uppercase">{record.carModel}</p>
                            <div className="h-px bg-white dark:bg-gray-900/5 my-6 w-full" />
                            <p className="text-[10px] font-black text-primary uppercase tracking-widest">{record.serviceType}</p>
                          </div>
                          <motion.button 
                            whileHover={{ scale: 1.02, backgroundColor: "#16a34a", color: "#ffffff" }}
                            whileTap={{ scale: 0.98, backgroundColor: "#14532d" }}
                            onClick={() => sendWhatsAppApiReminder(record)} 
                            className="mt-10 w-full bg-white dark:bg-gray-900 text-black dark:text-white py-5 rounded-xl font-black text-[10px] transition-all flex items-center justify-center gap-4 uppercase tracking-widest shadow-xl"
                          >
                            <WhatsAppIcon className="w-6 h-6" /> {s.notifyCustomer}
                          </motion.button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </motion.div>
          )}

          {activeTab === 'logs' && (
            <motion.div 
              key="logs"
              initial={{ opacity: 0, x: 50, rotateY: 10 }}
              animate={{ opacity: 1, x: 0, rotateY: 0 }}
              exit={{ opacity: 0, x: -50, rotateY: -10 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              style={{ perspective: 1000 }}
              className="space-y-8"
            >
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-line dark:border-gray-800 pb-8">
                <div>
                  <h3 className="text-3xl font-display font-black text-black dark:text-white uppercase tracking-tight">Service History</h3>
                  <p className="micro-label mt-2">Archive of all completed maintenance</p>
                </div>
                <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                  <button 
                    onClick={() => setIsManualRecordModalOpen(true)}
                    style={{ backgroundColor: '#0066cc' }}
                    className="text-white px-6 py-3 rounded-xl text-xs font-black flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg active:scale-95 uppercase tracking-widest"
                  >
                    <PlusIcon className="w-4 h-4" /> Record Call-In
                  </button>
                  <button 
                    onClick={exportServiceLogs}
                    className="bg-black text-white px-6 py-3 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-gray-800 transition-all shadow-lg active:scale-95"
                  >
                    <DownloadIcon className="w-4 h-4" /> Export PDF
                  </button>
                  <div className="bg-primary-light text-primary px-4 py-3 rounded-xl text-xs font-black whitespace-nowrap tracking-wider border border-primary/10">
                    {filteredAndSortedRecords.length} RECORDS
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl border border-line dark:border-gray-800 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="micro-label ml-1">Service Type</label>
                    <select 
                      value={filterServiceType}
                      onChange={(e) => setFilterServiceType(e.target.value)}
                      className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-line dark:border-gray-800 rounded-xl text-xs font-medium outline-none focus:border-primary transition-all shadow-sm appearance-none"
                    >
                      <option value="ALL">ALL SERVICES</option>
                      {SERVICES.map(s => (
                        <option key={s.id} value={lang === 'sw' ? s.titleSw : s.titleEn}>
                          {lang === 'sw' ? s.titleSw : s.titleEn}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="micro-label ml-1">Start Date</label>
                    <input 
                      type="date" 
                      value={filterStartDate}
                      onChange={(e) => setFilterStartDate(e.target.value)}
                      className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-line dark:border-gray-800 rounded-xl text-xs font-medium outline-none focus:border-primary transition-all shadow-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="micro-label ml-1">End Date</label>
                    <input 
                      type="date" 
                      value={filterEndDate}
                      onChange={(e) => setFilterEndDate(e.target.value)}
                      className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-line dark:border-gray-800 rounded-xl text-xs font-medium outline-none focus:border-primary transition-all shadow-sm"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-line dark:border-gray-800/50">
                  <div className="flex items-center gap-2">
                    <span className="micro-label">Sort By:</span>
                    <select 
                      value={sortField}
                      onChange={(e) => setSortField(e.target.value as any)}
                      className="px-3 py-1.5 bg-white dark:bg-gray-900 border border-line dark:border-gray-800 rounded-lg text-[10px] font-bold outline-none focus:border-primary transition-all"
                    >
                      <option value="serviceDate">DATE</option>
                      <option value="customerName">CUSTOMER</option>
                      <option value="serviceType">SERVICE</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="micro-label">Order:</span>
                    <button 
                      onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                      className="px-3 py-1.5 bg-white dark:bg-gray-900 border border-line dark:border-gray-800 rounded-lg text-[10px] font-bold hover:bg-gray-100 dark:bg-gray-800 transition-all flex items-center gap-2"
                    >
                      {sortDirection === 'asc' ? 'ASCENDING' : 'DESCENDING'}
                      <FilterIcon className={`w-3 h-3 transition-transform ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                  <button 
                    onClick={() => {
                      setSearchTerm('');
                      setFilterServiceType('ALL');
                      setFilterStartDate('');
                      setFilterEndDate('');
                      setSortField('serviceDate');
                      setSortDirection('desc');
                    }}
                    className="ml-auto text-[10px] font-black text-primary hover:underline uppercase tracking-widest"
                  >
                    Reset Filters
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {filteredAndSortedRecords.map(record => {
                  const daysLeft = Math.ceil((new Date(record.nextServiceDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                  return (
                    <div key={record.id} className="bg-white dark:bg-gray-900 border border-line dark:border-gray-800 p-6 rounded-2xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 hover:border-primary/20 transition-all shadow-sm group">
                      <div className="flex-grow space-y-3">
                        <div className="flex items-center gap-3">
                          <span className="bg-black text-white text-[8px] font-black px-3 py-1 rounded-md uppercase tracking-widest">ID: {record.id}</span>
                          <span className={`text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-md ${daysLeft <= 0 ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                            {daysLeft <= 0 ? `Overdue ${Math.abs(daysLeft)} Days` : `Due in ${daysLeft} Days`}
                          </span>
                        </div>
                        <h4 className="text-xl font-display font-bold text-black dark:text-white group-hover:text-primary transition-colors">{record.customerName}</h4>
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] text-gray-400 font-bold uppercase tracking-wider">
                          <span className="flex items-center gap-1.5"><BoltIcon className="w-3.5 h-3.5 text-primary" /> {record.carModel}</span>
                          <span className="flex items-center gap-1.5"><SparklesIcon className="w-3.5 h-3.5 text-primary" /> {record.serviceType}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 pt-4 max-w-sm">
                          <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-line dark:border-gray-800">
                            <p className="micro-label mb-1">Last Service</p>
                            <p className="text-xs font-bold text-black dark:text-white data-value">{new Date(record.serviceDate).toLocaleDateString()}</p>
                          </div>
                          <div className="bg-primary-light/30 p-3 rounded-xl border border-primary/10">
                            <p className="micro-label text-primary/60 mb-1">Next Service</p>
                            <p className="text-xs font-bold text-primary data-value">{new Date(record.nextServiceDate).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row lg:flex-col gap-2 w-full lg:w-auto shrink-0">
                        <motion.button 
                          whileHover={{ scale: 1.02, backgroundColor: "#16a34a" }}
                          whileTap={{ scale: 0.98, backgroundColor: "#14532d" }}
                          onClick={() => sendWhatsAppApiReminder(record)} 
                          className="w-full lg:w-48 bg-green-600 text-white px-6 py-3.5 rounded-xl font-bold text-[11px] flex items-center justify-center gap-2 shadow-md uppercase tracking-wider transition-all"
                        >
                          <WhatsAppIcon className="w-4 h-4" /> Send Reminder
                        </motion.button>
                        <button className="w-full lg:w-48 bg-white dark:bg-gray-900 border border-line dark:border-gray-800 text-gray-500 dark:text-gray-400 px-6 py-3.5 rounded-xl font-bold text-[11px] flex items-center justify-center gap-2 hover:bg-gray-50 dark:bg-gray-800/50 active:scale-95 transition-all uppercase tracking-wider">
                          <InvoiceIcon className="w-4 h-4" /> View Invoice
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {activeTab === 'whatsapp' && (
            <motion.div 
              key="whatsapp"
              initial={{ opacity: 0, x: 50, rotateY: 10 }}
              animate={{ opacity: 1, x: 0, rotateY: 0 }}
              exit={{ opacity: 0, x: -50, rotateY: -10 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              style={{ perspective: 1000 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between border-b border-line dark:border-gray-800 pb-8">
                <div>
                  <h3 className="text-3xl font-display font-black text-black dark:text-white uppercase tracking-tight">Communication Logs</h3>
                  <p className="micro-label mt-2">WhatsApp API message history</p>
                </div>
                <div className="flex items-center gap-4">
                  <button onClick={fetchWaLogs} className="bg-white dark:bg-gray-900 border border-line dark:border-gray-800 p-3 rounded-xl hover:bg-gray-50 dark:bg-gray-800/50 transition-all shadow-sm active:scale-95 group">
                    <SparklesIcon className="w-5 h-5 text-primary group-hover:rotate-180 transition-transform duration-700" />
                  </button>
                  <div className="bg-primary-light text-primary px-6 py-3 rounded-xl text-xs font-black tracking-widest border border-primary/10">
                    {filteredWaLogs.length} MESSAGES
                  </div>
                </div>
              </div>
              
              {waLogs.length === 0 ? (
                <div className="bg-gray-50 dark:bg-gray-800/50 border border-dashed border-line dark:border-gray-800 p-32 rounded-3xl text-center">
                  <div className="bg-white dark:bg-gray-900 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                    <WhatsAppIcon className="w-10 h-10 text-gray-200" />
                  </div>
                  <p className="font-black text-gray-300 uppercase tracking-widest text-sm">No messages sent yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {filteredWaLogs.slice().reverse().map(log => (
                    <div key={log.id} className="card p-8 group relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-1 h-full bg-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="flex flex-col md:flex-row justify-between gap-8">
                        <div className="flex-grow space-y-6">
                          <div className="flex items-center gap-4">
                            <span className="bg-green-50 text-green-600 px-4 py-1.5 rounded-lg text-[9px] font-black tracking-widest uppercase border border-green-100">DELIVERED</span>
                            <span className="text-[11px] font-bold text-gray-300 uppercase tracking-widest">{new Date(log.timestamp).toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="w-14 h-14 bg-black rounded-xl flex items-center justify-center text-white font-black text-xl shadow-xl group-hover:bg-green-600 transition-colors">
                              {log.customerName?.charAt(0) || '?'}
                            </div>
                            <div>
                              <h4 className="text-xl font-display font-black text-black dark:text-white uppercase tracking-tight">{log.customerName || 'Unknown Client'}</h4>
                              <p className="text-xs font-bold text-primary tracking-widest mt-1">{log.phone}</p>
                            </div>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl border border-line dark:border-gray-800 relative group-hover:bg-white dark:bg-gray-900 transition-all">
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-300 leading-relaxed italic">"{log.message}"</p>
                          </div>
                        </div>
                        <div className="flex flex-col justify-center items-center md:items-end gap-4 shrink-0">
                          <div className="text-center md:text-right">
                            <p className="micro-label text-primary mb-1">Status</p>
                            <p className="text-xs font-black text-green-600 uppercase">Verified by API</p>
                          </div>
                          <div className="h-px w-16 bg-line hidden md:block" />
                          <button className="bg-gray-50 dark:bg-gray-800/50 text-gray-300 p-3 rounded-xl hover:bg-red-50 hover:text-red-500 transition-all active:scale-90">
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AssignMechanicModal 
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        onAssign={handleAssignMechanic}
        booking={assigningBooking}
        lang={lang}
      />

      <Modal isOpen={isInvoiceModalOpen} onClose={() => setIsInvoiceModalOpen(false)} title="Invoice Generator" maxWidth="max-w-3xl">
        <div className="space-y-8">
          <div className="space-y-6">
            <div className="flex justify-between items-end border-b border-line dark:border-gray-800 pb-4">
              <span className="micro-label text-primary">Invoice Items</span>
              <button onClick={addInvoiceItem} className="bg-black text-white px-4 py-2 rounded-xl text-[10px] font-black flex items-center gap-2 transition-all active:scale-95 shadow-lg">
                <PlusIcon className="w-3 h-3" /> Add Line Item
              </button>
            </div>
            <div className="space-y-3">
              {invoiceItems.map((item, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row gap-3 items-center bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-line dark:border-gray-800 animate-in slide-in-from-right-4">
                  <input 
                    placeholder="Description..." 
                    className="flex-grow bg-white dark:bg-gray-900 px-5 py-3 rounded-xl border border-line dark:border-gray-800 focus:border-primary outline-none font-bold text-xs shadow-sm uppercase" 
                    value={item.description} 
                    onChange={(e) => updateInvoiceItem(idx, 'description', e.target.value.toUpperCase())} 
                  />
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <input 
                      type="number" 
                      placeholder="Price" 
                      className="w-full sm:w-32 bg-white dark:bg-gray-900 px-5 py-3 rounded-xl border border-line dark:border-gray-800 focus:border-primary outline-none font-black text-xs text-right shadow-sm" 
                      value={item.amount} 
                      onChange={(e) => updateInvoiceItem(idx, 'amount', e.target.value)} 
                    />
                    <button onClick={() => removeInvoiceItem(idx)} className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all">
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-black text-white p-8 rounded-3xl flex justify-between items-center shadow-2xl">
            <span className="micro-label text-white/40">Grand Total</span>
            <span className="text-3xl font-display font-black data-value">{formatCurrency(totalInvoice)} TZS</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <motion.button 
              whileHover={{ scale: 1.02, backgroundColor: "#1a1a1a" }}
              whileTap={{ scale: 0.98, backgroundColor: "#333333" }}
              onClick={saveInvoice} 
              className="flex-grow bg-[#000000] text-white py-5 rounded-xl font-black text-xs shadow-xl transition-all uppercase tracking-widest"
            >
              Save Invoice
            </motion.button>
            <button onClick={() => { if (selectedBooking) downloadAsPdf(invoiceRef.current, `Invoice-${selectedBooking.id}`); }} className="flex-grow bg-[#dee0e6] border border-line dark:border-gray-800 text-black dark:text-white py-5 rounded-xl font-black text-xs hover:bg-gray-200 transition-all flex items-center justify-center gap-3 active:scale-95 uppercase tracking-widest">
              <DownloadIcon className="w-5 h-5" /> Export PDF
            </button>
          </div>
          <div className="hidden">
            <div style={{ position: 'absolute', left: '-9999px' }}>
              <BookingInvoice ref={invoiceRef} lang={lang} booking={selectedBooking ? { ...selectedBooking, price: totalInvoice, invoiceItems } : {} as Booking} />
            </div>
          </div>
        </div>
      </Modal>
      <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title="Booking Details" maxWidth="max-w-3xl">
        {viewingBooking && (
          <div className="space-y-10 p-2">
            <div className="flex justify-between items-start border-b border-line dark:border-gray-800 pb-8">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <span className={`text-[10px] font-black px-5 py-2 rounded-full uppercase tracking-widest shadow-sm ${viewingBooking.status === 'Completed' ? 'bg-green-100 text-green-600' : viewingBooking.status === 'In Progress' ? 'bg-primary-light text-primary' : viewingBooking.status === 'Cancelled' ? 'bg-red-100 text-red-600' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'}`}>{viewingBooking.status}</span>
                  {viewingBooking.isEmergency && <span className="bg-red-600 text-white text-[10px] font-black px-5 py-2 rounded-full uppercase tracking-widest animate-pulse shadow-lg shadow-red-500/30">Emergency</span>}
                </div>
                <h3 className="text-3xl sm:text-5xl font-display font-black text-black dark:text-white uppercase tracking-tight leading-tight">{viewingBooking.serviceType}</h3>
                <p className="text-[11px] font-bold text-gray-300 tracking-widest uppercase">Booking ID: {viewingBooking.id}</p>
              </div>
              <div className="hidden sm:flex bg-primary-light p-4 rounded-2xl text-primary">
                <Logo className="w-12 h-12" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-8">
                <div className="bg-gray-50 dark:bg-gray-800/50 p-8 rounded-3xl border border-line dark:border-gray-800">
                  <p className="micro-label text-primary mb-6">Client Information</p>
                  <div className="space-y-6">
                    <div>
                      <p className="micro-label text-gray-400 mb-1">Name</p>
                      <p className="text-lg font-black text-black dark:text-white uppercase">{viewingBooking.customerName}</p>
                    </div>
                    <div>
                      <p className="micro-label text-gray-400 mb-1">Phone Number</p>
                      <p className="text-lg font-black text-primary data-value">{viewingBooking.phone}</p>
                    </div>
                    <div>
                      <p className="micro-label text-gray-400 mb-1">Location</p>
                      <p className="text-lg font-black text-black dark:text-white uppercase">{viewingBooking.location}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-800/50 p-8 rounded-3xl border border-line dark:border-gray-800">
                  <p className="micro-label text-primary mb-4">Vehicle Details</p>
                  <p className="text-lg font-black text-black dark:text-white uppercase">{viewingBooking.carModel}</p>
                </div>

                {viewingBooking.assignedMechanic && (
                  <div className="bg-green-50 p-8 rounded-3xl border border-green-100 shadow-sm">
                    <p className="micro-label text-green-600 mb-4">Assigned Mechanic</p>
                    <div className="flex items-center gap-4">
                      <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl text-green-600 shadow-xl"><UserIcon className="w-6 h-6" /></div>
                      <p className="text-lg font-black text-black dark:text-white uppercase">{viewingBooking.assignedMechanic}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-8">
                <div className="bg-primary-light/30 p-8 rounded-3xl border border-primary/10">
                  <p className="micro-label text-primary mb-6">Appointment Schedule</p>
                  <div className="flex items-center gap-4">
                    <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl text-primary shadow-xl"><BellIcon className="w-6 h-6" /></div>
                    <div>
                      <p className="text-lg font-black text-black dark:text-white data-value">{new Date(viewingBooking.preferredDateTime).toLocaleDateString()}</p>
                      <p className="text-xs font-bold text-primary data-value">{new Date(viewingBooking.preferredDateTime).toLocaleTimeString()}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-black text-white p-8 rounded-3xl shadow-2xl">
                  <p className="micro-label text-white/40 mb-6">Financial Summary</p>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="micro-label text-white/20 mb-1">Estimated Price</p>
                      <p className="text-3xl font-display font-black data-value">{formatCurrency(viewingBooking.price || 0)} TZS</p>
                    </div>
                    <motion.button 
                      whileHover={{ scale: 1.1, backgroundColor: "#ffffff", color: "#000000" }}
                      whileTap={{ scale: 0.9, backgroundColor: "#f3f4f6" }}
                      onClick={() => { setIsDetailModalOpen(false); openInvoiceGenerator(viewingBooking); }} 
                      className="bg-white dark:bg-gray-900/10 text-white p-4 rounded-xl transition-all shadow-lg"
                    >
                      <InvoiceIcon className="w-6 h-6" />
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <motion.a 
                whileHover={{ scale: 1.02, backgroundColor: "#dc2626" }}
                whileTap={{ scale: 0.98, backgroundColor: "#991b1b" }}
                href={`tel:${viewingBooking.phone}`} 
                className="flex-grow bg-red-600 text-white py-6 rounded-xl font-black text-xs text-center shadow-xl transition-all tracking-widest uppercase"
              >
                Call Client
              </motion.a>
              <motion.a 
                whileHover={{ scale: 1.02, backgroundColor: "#16a34a" }}
                whileTap={{ scale: 0.98, backgroundColor: "#14532d" }}
                href={createWhatsAppLink(viewingBooking)} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex-grow bg-green-600 text-white py-6 rounded-xl font-black text-xs text-center shadow-xl transition-all tracking-widest uppercase"
              >
                WhatsApp Chat
              </motion.a>
              <motion.button 
                whileHover={{ scale: 1.02, backgroundColor: "#1a1a1a" }}
                whileTap={{ scale: 0.98, backgroundColor: "#333333" }}
                onClick={() => { setIsDetailModalOpen(false); handleAddRecord(viewingBooking); }} 
                className="flex-grow bg-black text-white py-6 rounded-xl font-black text-xs shadow-xl transition-all tracking-widest uppercase"
              >
                Add Service Record
              </motion.button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={isRecordModalOpen} onClose={() => setIsRecordModalOpen(false)} title={s.addRecord} maxWidth="max-w-xl">
        <div className="space-y-8 p-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="micro-label text-primary ml-2">Service Date</label>
              <input 
                type="date" 
                value={recordData.serviceDate} 
                onChange={(e) => setRecordData({ ...recordData, serviceDate: e.target.value })} 
                className="w-full p-5 bg-gray-50 dark:bg-gray-800/50 border border-line dark:border-gray-800 rounded-2xl font-black text-black dark:text-white outline-none focus:border-primary text-xs sm:text-sm shadow-sm transition-all" 
              />
            </div>
            <div className="space-y-3">
              <label className="micro-label text-primary ml-2">Next Service Date</label>
              <input 
                type="date" 
                value={recordData.nextDate} 
                onChange={(e) => setRecordData({ ...recordData, nextDate: e.target.value })} 
                className="w-full p-5 bg-primary-light border border-primary/10 rounded-2xl font-black text-primary outline-none focus:border-primary text-xs sm:text-sm shadow-sm transition-all" 
              />
            </div>
          </div>
          <div className="space-y-3">
            <label className="micro-label text-primary ml-2">Service Notes</label>
            <textarea 
              value={recordData.notes} 
              onChange={(e) => setRecordData({ ...recordData, notes: e.target.value.toUpperCase() })} 
              className="w-full p-6 bg-gray-50 dark:bg-gray-800/50 border border-line dark:border-gray-800 rounded-3xl font-bold text-xs text-black dark:text-white outline-none focus:border-primary min-h-[160px] resize-none shadow-sm transition-all" 
              placeholder="DESCRIBE WORK DONE, PARTS REPLACED, ETC..." 
            />
          </div>
          <motion.button 
            whileHover={{ scale: 1.02, backgroundColor: "#1a1a1a" }}
            whileTap={{ scale: 0.98, backgroundColor: "#333333" }}
            onClick={saveRecord} 
            className="w-full bg-black text-white py-6 rounded-xl font-black text-xs sm:text-sm shadow-2xl transition-all uppercase tracking-widest"
          >
            Save to Service History
          </motion.button>
        </div>
      </Modal>

      <ManualRecordModal 
        isOpen={isManualRecordModalOpen} 
        onClose={() => setIsManualRecordModalOpen(false)} 
        onSave={handleManualRecordSave} 
        lang={lang} 
        services={SERVICES} 
      />
    </div>
  );
};

const ManualRecordModal = ({ isOpen, onClose, onSave, lang, services }: { isOpen: boolean, onClose: () => void, onSave: (record: any) => void, lang: Language, services: any[] }) => {
  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    carModel: '',
    serviceType: services[0]?.titleEn || '',
    serviceDate: new Date().toISOString().split('T')[0],
    nextDate: new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString().split('T')[0],
    notes: ''
  });

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={lang === 'sw' ? 'Rekodi Service ya Simu' : 'Record Call-In Service'} maxWidth="max-w-2xl">
      <div className="space-y-6 p-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="micro-label text-primary ml-2">Customer Name</label>
            <input 
              type="text" 
              value={formData.customerName} 
              onChange={(e) => setFormData({ ...formData, customerName: e.target.value.toUpperCase() })} 
              className="w-full p-4 bg-gray-50 dark:bg-gray-800/50 border border-line dark:border-gray-800 rounded-xl font-bold text-xs outline-none focus:border-primary" 
              placeholder="CLIENT NAME"
            />
          </div>
          <div className="space-y-2">
            <label className="micro-label text-primary ml-2">Phone Number</label>
            <input 
              type="text" 
              value={formData.phone} 
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })} 
              className="w-full p-4 bg-gray-50 dark:bg-gray-800/50 border border-line dark:border-gray-800 rounded-xl font-bold text-xs outline-none focus:border-primary" 
              placeholder="07XX XXX XXX"
            />
          </div>
          <div className="space-y-2">
            <label className="micro-label text-primary ml-2">Car Model</label>
            <input 
              type="text" 
              value={formData.carModel} 
              onChange={(e) => setFormData({ ...formData, carModel: e.target.value.toUpperCase() })} 
              className="w-full p-4 bg-gray-50 dark:bg-gray-800/50 border border-line dark:border-gray-800 rounded-xl font-bold text-xs outline-none focus:border-primary" 
              placeholder="VEHICLE DETAILS"
            />
          </div>
          <div className="space-y-2">
            <label className="micro-label text-primary ml-2">Service Type</label>
            <select 
              value={formData.serviceType} 
              onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })} 
              className="w-full p-4 bg-gray-50 dark:bg-gray-800/50 border border-line dark:border-gray-800 rounded-xl font-bold text-xs outline-none focus:border-primary"
            >
              {services.map(s => (
                <option key={s.id} value={lang === 'sw' ? s.titleSw : s.titleEn}>
                  {(lang === 'sw' ? s.titleSw : s.titleEn).toUpperCase()}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="micro-label text-primary ml-2">Service Date</label>
            <input 
              type="date" 
              value={formData.serviceDate} 
              onChange={(e) => setFormData({ ...formData, serviceDate: e.target.value })} 
              className="w-full p-4 bg-gray-50 dark:bg-gray-800/50 border border-line dark:border-gray-800 rounded-xl font-bold text-xs outline-none focus:border-primary" 
            />
          </div>
          <div className="space-y-2">
            <label className="micro-label text-primary ml-2">Next Service Date</label>
            <input 
              type="date" 
              value={formData.nextDate} 
              onChange={(e) => setFormData({ ...formData, nextDate: e.target.value })} 
              className="w-full p-4 bg-primary-light border border-primary/10 rounded-xl font-bold text-primary outline-none focus:border-primary" 
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="micro-label text-primary ml-2">Service Notes</label>
          <textarea 
            value={formData.notes} 
            onChange={(e) => setFormData({ ...formData, notes: e.target.value.toUpperCase() })} 
            className="w-full p-4 bg-gray-50 dark:bg-gray-800/50 border border-line dark:border-gray-800 rounded-xl font-bold text-xs outline-none focus:border-primary min-h-[100px] resize-none" 
            placeholder="DESCRIBE WORK DONE..." 
          />
        </div>
        <motion.button 
          whileHover={{ scale: 1.02, backgroundColor: "#1a1a1a" }}
          whileTap={{ scale: 0.98, backgroundColor: "#333333" }}
          onClick={() => onSave(formData)} 
          className="w-full bg-black text-white py-5 rounded-xl font-black text-xs shadow-xl transition-all uppercase tracking-widest"
        >
          Save Manual Record
        </motion.button>
      </div>
    </Modal>
  );
};

const CalendarModal = ({ isOpen, onClose, onSelect, lang }: { isOpen: boolean, onClose: () => void, onSelect: (date: string) => void, lang: Language }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState('09:00');

  if (!isOpen) return null;

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleString(lang === 'sw' ? 'sw-TZ' : 'en-US', { month: 'long' });

  const days = [];
  const totalDays = daysInMonth(year, month);
  const startDay = firstDayOfMonth(year, month);

  // Padding for start of month
  for (let i = 0; i < startDay; i++) {
    days.push(<div key={`pad-${i}`} className="h-10 w-10" />);
  }

  for (let d = 1; d <= totalDays; d++) {
    const dateObj = new Date(year, month, d);
    const isToday = new Date().toDateString() === dateObj.toDateString();
    const isSelected = selectedDate?.toDateString() === dateObj.toDateString();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isPast = dateObj < today;

    days.push(
      <button
        key={d}
        disabled={isPast}
        onClick={() => setSelectedDate(new Date(year, month, d))}
        className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
          isSelected ? 'bg-blue-600 text-white shadow-lg scale-110' : 
          isToday ? 'text-blue-600 border border-blue-600' : 
          isPast ? 'text-gray-200 cursor-not-allowed' : 'text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:bg-gray-800'
        }`}
      >
        {d}
      </button>
    );
  }

  const handleConfirm = () => {
    if (selectedDate) {
      const finalDate = new Date(selectedDate);
      const [hours, minutes] = selectedTime.split(':');
      finalDate.setHours(parseInt(hours), parseInt(minutes));
      
      if (finalDate < new Date()) {
        alert(lang === 'sw' ? 'Tafadhali chagua muda wa baadaye' : 'Please select a future time');
        return;
      }

      onSelect(finalDate.toISOString().slice(0, 16));
      onClose();
    }
  };

  const dayNames = lang === 'sw' ? ['J', 'D', 'T', 'K', 'A', 'I', 'S'] : ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-black text-black dark:text-gray-100 uppercase tracking-tight">{monthName} {year}</h2>
            <div className="flex gap-2">
              <button onClick={() => setCurrentDate(new Date(year, month - 1))} className="p-2 hover:bg-gray-100 dark:bg-gray-800 rounded-full transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7"/></svg>
              </button>
              <button onClick={() => setCurrentDate(new Date(year, month + 1))} className="p-2 hover:bg-gray-100 dark:bg-gray-800 rounded-full transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7"/></svg>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-4 text-center">
            {dayNames.map(d => (
              <div key={d} className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 text-center mb-8">
            {days}
          </div>

          <div className="space-y-4">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">SELECT TIME</label>
            <input 
              type="time" 
              value={selectedTime} 
              onChange={(e) => setSelectedTime(e.target.value)}
              className="w-full p-4 bg-gray-50 dark:bg-gray-800/50 border-2 border-gray-100 rounded-2xl font-black text-sm outline-none focus:border-blue-600 transition-all"
            />
          </div>

          <div className="mt-8 flex gap-4">
            <button onClick={onClose} className="flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-gray-400 hover:bg-gray-50 dark:bg-gray-800/50 transition-all active:ring-2 active:ring-gray-200">CANCEL</button>
            <button 
              onClick={handleConfirm} 
              disabled={!selectedDate}
              className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-600/20 hover:bg-blue-700 transition-all disabled:opacity-50 active:ring-2 active:ring-offset-2 active:ring-blue-600"
            >
              CONFIRM
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const BookingForm = ({ lang, initialEmergency, preSelectedService, onSuccess }: { lang: Language, initialEmergency: boolean, preSelectedService?: string, onSuccess: (b: Booking) => void }) => {
  const s = UI_STRINGS[lang];
  const otherServiceTitle = (lang === 'sw' ? SERVICES[SERVICES.length - 1].titleSw : SERVICES[SERVICES.length - 1].titleEn).toUpperCase();
  const defaultService = (lang === 'sw' ? SERVICES[0].titleSw : SERVICES[0].titleEn).toUpperCase();
  const [formData, setFormData] = useState({ name: '', phone: '', whatsapp: '', car: '', service: preSelectedService || defaultService, otherDescription: '', location: '', datetime: '', isEmergency: initialEmergency });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  useEffect(() => { if (preSelectedService) setFormData(prev => ({...prev, service: preSelectedService.toUpperCase()})); }, [preSelectedService]);

  const validateField = (field: string, value: string) => {
    let error = '';
    const phoneRegex = /^(?:\+255|0)[67]\d{8}$/;
    switch(field) {
      case 'name': if (value.trim().length < 3) error = lang === 'sw' ? 'JINA LINALOHITAJIKA' : 'NAME REQUIRED'; break;
      case 'phone': case 'whatsapp': if (!phoneRegex.test(value.replace(/\s/g, ''))) error = lang === 'sw' ? 'NAMBA SIYO SAHIHI' : 'INVALID NUMBER'; break;
      case 'car': if (value.trim().length < 2) error = lang === 'sw' ? 'TAJA GARI' : 'ENTER CAR'; break;
      case 'location': if (value.trim().length < 2) error = lang === 'sw' ? 'TAJA ENEO' : 'ENTER LOCATION'; break;
      case 'datetime': if (!value) error = lang === 'sw' ? 'CHAGUA MUDA' : 'SELECT TIME'; break;
      case 'otherDescription': if (formData.service.toUpperCase() === otherServiceTitle && value.trim().length < 5) error = lang === 'sw' ? 'ELEZEA TATIZO' : 'DESCRIBE ISSUE'; break;
    }
    return error;
  };

  const handleInputChange = (field: string, value: string) => {
    const uppercased = value.toUpperCase();
    setFormData(prev => ({ ...prev, [field]: uppercased }));
    const error = validateField(field, uppercased);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const handleBlur = (field: string) => { setTouched(prev => ({ ...prev, [field]: true })); setErrors(prev => ({ ...prev, [field]: validateField(field, formData[field as keyof typeof formData] as string) })); };

  const handleAiAnalyze = async () => { if (!formData.otherDescription) return; setIsAiThinking(true); const result = await analyzeCarIssue(formData.otherDescription); setAiResponse(result); setIsAiThinking(false); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    ['name', 'phone', 'whatsapp', 'car', 'location', 'datetime'].forEach(f => { const err = validateField(f, (formData as any)[f]); if (err) newErrors[f] = err; });
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); setTouched(Object.keys(formData).reduce((acc, f) => ({ ...acc, [f]: true }), {})); return; }
    setIsConfirmOpen(true);
  };

  const handleFinalSubmit = () => {
    const serviceFinal = formData.service.toUpperCase() === otherServiceTitle ? `${formData.service.toUpperCase()}: ${formData.otherDescription.toUpperCase()}` : formData.service.toUpperCase();
    const newBooking: Booking = { id: generateBookingId(), customerName: formData.name.toUpperCase(), phone: formData.phone.toUpperCase(), whatsapp: formData.whatsapp.toUpperCase(), carModel: formData.car.toUpperCase(), serviceType: serviceFinal, location: formData.location.toUpperCase(), preferredDateTime: formData.datetime, isEmergency: formData.isEmergency, status: 'New', notes: '', createdAt: new Date().toISOString() };
    storageService.saveBooking(newBooking);
    onSuccess(newBooking);
    setIsConfirmOpen(false);
  };

  const getInputClasses = (field: string) => `w-full px-4 py-3 border border-slate-200 rounded-xl font-bold text-sm outline-none transition-all shadow-sm uppercase ${touched[field] && errors[field] ? 'border-red-500 bg-red-50 ring-2 ring-red-100' : 'bg-slate-50 border-slate-200 focus:border-blue-600 focus:bg-white dark:bg-gray-900 focus:ring-4 focus:ring-blue-50'}`;

  return (
    <div className="max-w-2xl mx-auto uppercase">
      <div className="bg-white dark:bg-gray-900 p-6 sm:p-12 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-gray-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-50 rounded-full translate-x-24 -translate-y-24 pointer-events-none" />
        
        <div className="text-center mb-10 relative z-10">
          <h2 className="text-2xl sm:text-4xl font-display font-black mb-3 tracking-tight text-slate-900 uppercase leading-none">{s.formTitle}</h2>
          <p className="text-[8px] sm:text-[9px] font-bold text-blue-600 tracking-[0.4em] uppercase">MOBILE SERVICE NETWORK</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          {Object.keys(errors).some(k => touched[k] && errors[k]) && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl text-center font-black text-[9px] uppercase tracking-widest animate-in fade-in slide-in-from-top-2">
              {lang === 'sw' ? 'TAFADHALI JAZA SEHEMU ZOTE ZILIZOASHIRIWA' : 'PLEASE FILL ALL HIGHLIGHTED FIELDS'}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 ml-3 uppercase tracking-wider">{s.labelName}</label>
              <input required className={getInputClasses('name')} value={formData.name} onChange={e => handleInputChange('name', e.target.value)} onBlur={() => handleBlur('name')} />
              {touched.name && errors.name && <p className="text-[8px] font-black text-red-500 mt-1 ml-3 uppercase">{errors.name}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 ml-3 uppercase tracking-wider">{s.labelCar}</label>
              <input required className={getInputClasses('car')} value={formData.car} onChange={e => handleInputChange('car', e.target.value)} onBlur={() => handleBlur('car')} />
              {touched.car && errors.car && <p className="text-[8px] font-black text-red-500 mt-1 ml-3 uppercase">{errors.car}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 ml-3 uppercase tracking-wider">{s.labelPhone}</label>
              <input required className={getInputClasses('phone')} value={formData.phone} onChange={e => handleInputChange('phone', e.target.value)} onBlur={() => handleBlur('phone')} />
              {touched.phone && errors.phone && <p className="text-[8px] font-black text-red-500 mt-1 ml-3 uppercase">{errors.phone}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 ml-3 uppercase tracking-wider">{s.labelWhatsapp}</label>
              <input required className={getInputClasses('whatsapp')} value={formData.whatsapp} onChange={e => handleInputChange('whatsapp', e.target.value)} onBlur={() => handleBlur('whatsapp')} />
              {touched.whatsapp && errors.whatsapp && <p className="text-[8px] font-black text-red-500 mt-1 ml-3 uppercase">{errors.whatsapp}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 ml-3 uppercase tracking-wider">{s.labelLocation}</label>
              <input required className={getInputClasses('location')} value={formData.location} onChange={e => handleInputChange('location', e.target.value)} onBlur={() => handleBlur('location')} />
              {touched.location && errors.location && <p className="text-[8px] font-black text-red-500 mt-1 ml-3 uppercase">{errors.location}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 ml-3 uppercase tracking-wider">{s.labelService}</label>
              <select className={getInputClasses('service')} value={formData.service} onChange={e => handleInputChange('service', e.target.value)}>{SERVICES.map(sv => <option key={sv.id} value={(lang === 'sw' ? sv.titleSw : sv.titleEn).toUpperCase()}>{(lang === 'sw' ? sv.titleSw : sv.titleEn).toUpperCase()}</option>)}</select>
            </div>
          </div>
          {formData.service.toUpperCase() === otherServiceTitle && (
            <div className="animate-in slide-in-from-top-4 space-y-3">
              <label className="text-[10px] font-black text-slate-500 ml-3 uppercase tracking-wider">{s.labelOtherService}</label>
              <div className="relative">
                <textarea required className={getInputClasses('otherDescription') + " min-h-[100px] resize-none"} rows={3} value={formData.otherDescription} onChange={e => handleInputChange('otherDescription', e.target.value)} onBlur={() => handleBlur('otherDescription')} />
                <button type="button" onClick={handleAiAnalyze} disabled={isAiThinking || !formData.otherDescription} className="absolute right-3 bottom-3 bg-slate-900 p-2.5 rounded-lg text-white hover:bg-slate-800 transition-all shadow-lg active:scale-95 disabled:opacity-30 flex items-center gap-2 text-[8px] font-black uppercase"><SparklesIcon className={`w-3 h-3 ${isAiThinking ? 'animate-spin' : ''}`} /> {isAiThinking ? s.aiThinking : s.aiAnalyze}</button>
              </div>
              {touched.otherDescription && errors.otherDescription && <p className="text-[8px] font-black text-red-500 mt-1 ml-3 uppercase">{errors.otherDescription}</p>}
              {aiResponse && (<div className="bg-blue-50 border border-blue-100 p-5 rounded-2xl animate-in slide-in-from-left-4"><span className="text-[9px] font-black text-blue-600 block mb-1 uppercase tracking-widest">{s.aiAdvice}</span><p className="text-xs font-bold text-slate-700 uppercase leading-relaxed">{aiResponse}</p></div>)}
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 ml-3 uppercase tracking-wider">{s.labelDate}</label>
            <div className="relative">
              <div 
                onClick={() => setIsCalendarOpen(true)}
                className={getInputClasses('datetime') + " cursor-pointer flex items-center justify-between"}
              >
                <span>{formData.datetime ? new Date(formData.datetime).toLocaleString() : s.labelDate}</span>
                <CalendarIcon className="w-4 h-4 text-blue-600" />
              </div>
              {touched.datetime && errors.datetime && <p className="text-[8px] font-black text-red-500 mt-1 ml-3 uppercase">{errors.datetime}</p>}
            </div>
          </div>

          <CalendarModal 
            isOpen={isCalendarOpen} 
            onClose={() => setIsCalendarOpen(false)} 
            onSelect={(val) => handleInputChange('datetime', val)}
            lang={lang}
          />
          
          <div className="flex items-center gap-4 p-5 bg-slate-50 border border-slate-200 rounded-2xl group cursor-pointer hover:bg-slate-100 transition-all active:scale-[0.99]" onClick={() => setFormData({...formData, isEmergency: !formData.isEmergency})}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${formData.isEmergency ? 'bg-red-100' : 'bg-white dark:bg-gray-900'}`}>
              <div className={`w-3 h-3 rounded-full transition-all ${formData.isEmergency ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)] animate-pulse' : 'bg-slate-200'}`} />
            </div>
            <div className="flex flex-col">
              <span className={`text-sm font-black uppercase tracking-widest ${formData.isEmergency ? 'text-slate-900' : 'text-slate-400'}`}>{s.labelEmergencyCheckbox}</span>
              <span className="text-[7px] font-bold text-red-500 uppercase tracking-[0.2em] mt-0.5">PRIORITY DISPATCH ENABLED</span>
            </div>
          </div>

          <motion.button 
            whileHover={{ scale: 1.02, backgroundColor: "#1a1a1a" }}
            whileTap={{ scale: 0.98 }}
            type="submit" 
            className="w-full bg-black text-white py-5 rounded-2xl font-black text-sm shadow-xl shadow-black/20 transition-all flex items-center justify-center gap-3 uppercase tracking-[0.2em] disabled:opacity-50"
          >
            {s.submitBtn} <ArrowRightIcon className="w-5 h-5" />
          </motion.button>
        </form>
      </div>

      <ConfirmationModal 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleFinalSubmit}
        details={formData}
        lang={lang}
      />
    </div>
  );
};

const ServiceCard: React.FC<{ service: ServiceItem, lang: Language, onBook: (s: string) => void }> = ({ service, lang, onBook }) => {
  const [expanded, setExpanded] = useState(false);
  const s = UI_STRINGS[lang];

  const getServiceDetails = (id: string) => {
    const details: Record<string, { sw: string[], en: string[] }> = {
      'scheduled-maintenance': {
        sw: ['Ukaguzi wa pointi 25', 'Kubadilisha Oil & Filter', 'Kusafisha Engine', 'Ukaguzi wa Maji'],
        en: ['25-Point Safety Check', 'Oil & Filter Change', 'Engine Bay Cleaning', 'Fluid Level Top-up']
      },
      'engine-performance': {
        sw: ['Uchunguzi wa Kompyuta', 'Kusafisha Spark Plugs', 'Kurekebisha Timing', 'Ukaguzi wa Fuel Pump'],
        en: ['Computer Diagnostics', 'Spark Plug Cleaning', 'Timing Adjustment', 'Fuel Pump Inspection']
      },
      'tire-recovery': {
        sw: ['Kuziba Panja Popote', 'Kubadilisha Matairi', 'Ukaguzi wa Presha', 'Urari wa Matairi'],
        en: ['On-site Puncture Repair', 'Tire Replacement', 'Pressure Monitoring', 'Wheel Balancing']
      }
    };
    return details[id] || { 
      sw: ['Huduma ya Kitaalamu', 'Vifaa vya Kisasa', 'Mafundi Waliofuzu', 'Dhamana ya Kazi'],
      en: ['Professional Service', 'Modern Equipment', 'Certified Mechanics', 'Work Warranty']
    };
  };

  const extraDetails = getServiceDetails(service.id);

  return (
    <motion.div 
      layout
      whileHover={{ 
        y: -10,
        transition: { duration: 0.4, ease: "circOut" }
      }}
      className="group relative bg-white dark:bg-gray-900 rounded-[2.5rem] overflow-hidden shadow-xl border border-gray-100 h-full flex flex-col transition-all duration-500"
    >
      {/* Background Graphic Text */}
      <div className="absolute top-10 right-[-20px] opacity-[0.03] select-none pointer-events-none">
        <span className="text-[180px] font-graphic uppercase leading-none">{service.id.charAt(0)}</span>
      </div>

      <div className="p-8 relative z-10 flex-grow">
        <div className="flex justify-between items-start mb-6">
          <motion.div 
            whileHover={{ rotate: 360, scale: 1.1 }}
            transition={{ duration: 0.8, type: "spring" }}
            className="w-14 h-14 bg-blue-50 text-primary rounded-2xl flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-lg shadow-blue-100 group-hover:shadow-primary/40"
          >
            {getServiceIcon(service.id)}
          </motion.div>
        </div>

        <h3 className="text-lg font-black text-gray-900 dark:text-gray-100 mb-3 uppercase tracking-tighter group-hover:text-primary transition-colors">
          {lang === 'sw' ? service.titleSw : service.titleEn}
        </h3>
        
        <p className="text-gray-500 dark:text-gray-400 font-medium leading-relaxed mb-6 text-xs">
          {lang === 'sw' ? service.descriptionSw : service.descriptionEn}
        </p>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-6"
            >
              <div className="space-y-3 pt-2 border-t border-gray-50">
                {(lang === 'sw' ? extraDetails.sw : extraDetails.en).map((detail, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-gray-600 dark:text-gray-300 font-bold uppercase text-[9px] tracking-widest">
                    <CheckCircleIcon className="w-3 h-3 text-green-500" />
                    <span>{detail}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!expanded && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-gray-400 font-bold uppercase text-[8px] tracking-[0.3em]">
              <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></div>
              <span>Professional Equipment</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400 font-bold uppercase text-[8px] tracking-[0.3em]">
              <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></div>
              <span>Certified Mechanics</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-8 pt-0 relative z-10">
        <div className="flex gap-4">
          <motion.button 
            whileHover={{ scale: 1.02, backgroundColor: "#1a1a1a" }}
            whileTap={{ scale: 0.98, backgroundColor: "#333333" }}
            onClick={() => onBook(lang === 'sw' ? service.titleSw : service.titleEn)} 
            className="flex-grow bg-black text-white font-black py-3.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-3 text-[10px] uppercase tracking-widest shadow-xl"
          >
            <span>{s.requestThis}</span>
            <BoltIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.05, backgroundColor: "#f9fafb" }}
            whileTap={{ scale: 0.95, backgroundColor: "#f3f4f6" }}
            onClick={() => setExpanded(!expanded)} 
            className={`w-12 h-12 flex items-center justify-center rounded-2xl border transition-all duration-300 ${expanded ? 'rotate-180 text-black dark:text-gray-100 border-black bg-gray-50 dark:bg-gray-800/50' : 'rotate-0 text-gray-400 border-gray-200'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7"/></svg>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

// --- Added HistorySearch Component ---
const HistorySearch = ({ lang, onSearch }: { lang: Language, onSearch: (phone: string) => void }) => {
  const [phone, setPhone] = useState('');
  const s = UI_STRINGS[lang];
  return (
    <div id="history-search" className="bg-white dark:bg-gray-950 py-12 px-6">
      <div className="max-w-lg mx-auto relative group">
        <div className="bg-gray-900 h-14 sm:h-[64px] rounded-full p-1.5 sm:p-2 flex items-center shadow-2xl border border-gray-800 transition-all group-focus-within:border-primary group-focus-within:ring-4 group-focus-within:ring-primary/10">
          <div className="pl-4 sm:pl-6 text-gray-500 dark:text-gray-400 shrink-0">
            <SearchIcon className="w-4 h-4 sm:w-5 h-5" />
          </div>
          <input 
            type="text" 
            placeholder={s.searchPlaceholder} 
            value={phone} 
            onChange={(e) => setPhone(e.target.value)} 
            className="flex-grow bg-transparent text-white px-2 sm:px-4 font-black outline-none uppercase text-[10px] sm:text-sm placeholder:text-gray-600 dark:text-gray-300 tracking-wider min-w-0"
          />
          <motion.button 
            whileHover={{ scale: 1.02, backgroundColor: "#0052a3" }}
            whileTap={{ scale: 0.98, backgroundColor: "#004080" }}
            onClick={() => onSearch(phone)} 
            className="bg-[#0066cc] text-white h-full px-5 sm:px-10 rounded-full font-black transition-all uppercase text-[9px] sm:text-[11px] tracking-widest shadow-lg flex items-center justify-center shrink-0"
          >
            {lang === 'sw' ? 'TAFUTA' : 'SEARCH'}
          </motion.button>
        </div>
      </div>
    </div>
  );
};

// --- Added UserHistory Component ---
const UserHistory = ({ lang, phone, onBack }: { lang: Language, phone: string, onBack: () => void }) => {
  const [data, setData] = useState<any>(null);
  const s = UI_STRINGS[lang];

  useEffect(() => {
    setData(storageService.getDataByPhone(phone));
  }, [phone]);

  const exportUserLogs = () => {
    if (!data) return;
    const doc = new jsPDF();
    const tableColumn = ["Date", "Car Model", "Service Type", "Cost (TZS)", "Notes"];
    const tableRows: any[] = [];

    // Combine records and bookings for the report
    const allEntries = [
      ...data.records.map((r: any) => ({ ...r, date: r.serviceDate, cost: 0 })), // records don't have cost in mock data but we'll show 0 or N/A
      ...data.bookings.filter((b: any) => b.status === 'Completed').map((b: any) => ({ 
        date: b.createdAt, 
        carModel: b.carModel, 
        serviceType: b.serviceType, 
        cost: b.price || 0, 
        notes: b.workDone || b.notes 
      }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    allEntries.forEach((entry: any) => {
      const row = [
        new Date(entry.date).toLocaleDateString(),
        entry.carModel,
        entry.serviceType,
        (entry.cost || 0).toLocaleString(),
        entry.notes || "N/A"
      ];
      tableRows.push(row);
    });

    (doc as any).autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2, font: 'helvetica' },
      headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 245, 245] }
    });

    doc.setFontSize(22);
    doc.setTextColor(0, 0, 0);
    doc.text("GARAGE NYUMBANI", 14, 15);
    doc.setFontSize(12);
    doc.text("OFFICIAL SERVICE HISTORY REPORT", 14, 22);
    doc.setDrawColor(0, 0, 0);
    doc.line(14, 25, 196, 25);
    
    doc.setFontSize(10);
    doc.text(`Customer Phone: ${phone}`, 14, 32);
    doc.text(`Report Generated: ${new Date().toLocaleString()}`, 14, 37);
    doc.text(`Total Investment: ${(data.summary.totalSpend || 0).toLocaleString()} TZS`, 140, 32);
    
    doc.save(`service_history_${phone}.pdf`);
  };

  if (!data) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-800/50 py-12 sm:py-20 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-12">
        <motion.button 
          whileHover={{ scale: 1.02, backgroundColor: "#1a1a1a" }}
          whileTap={{ scale: 0.98, backgroundColor: "#333333" }}
          onClick={onBack} 
          className="group flex items-center gap-3 bg-black text-white border border-black px-6 py-3.5 rounded-xl font-black text-[10px] tracking-widest uppercase transition-all shadow-xl"
        >
          <ArrowLeftIcon className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> {s.backToHome}
        </motion.button>
        
        <div className="bg-white dark:bg-gray-900 p-8 sm:p-12 rounded-[2.5rem] border border-line dark:border-gray-800 shadow-2xl space-y-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 border-b border-line dark:border-gray-800 pb-10">
              <div className="space-y-4">
                <div className="bg-primary-light w-16 h-16 rounded-2xl flex items-center justify-center text-primary shadow-xl">
                  <HistoryIcon className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-4xl sm:text-6xl font-display font-black tracking-tight text-black dark:text-white uppercase leading-none">{s.historyTitle}</h2>
                  <p className="micro-label mt-3 text-primary">Account: {phone}</p>
                </div>
              </div>
              {(data.records.length > 0 || data.bookings.length > 0) && (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
                  <motion.button 
                    whileHover={{ scale: 1.05, backgroundColor: "#1a1a1a" }}
                    whileTap={{ scale: 0.95, backgroundColor: "#333333" }}
                    onClick={exportUserLogs}
                    className="bg-black text-white px-8 py-4 rounded-xl text-[10px] font-black tracking-widest uppercase flex items-center justify-center gap-3 transition-all shadow-xl"
                  >
                    <DownloadIcon className="w-4 h-4" /> Download Full Report
                  </motion.button>
                </div>
              )}
            </div>
          
          {data.records.length === 0 && data.bookings.length === 0 ? (
            <div className="bg-gray-50 dark:bg-gray-800/50 p-20 rounded-[2rem] text-center border border-dashed border-line dark:border-gray-800 flex flex-col items-center">
              <div className="bg-white dark:bg-gray-900 w-24 h-24 rounded-full flex items-center justify-center mb-8 shadow-sm">
                <SearchIcon className="w-12 h-12 text-gray-200" />
              </div>
              <h3 className="text-2xl font-display font-black text-black dark:text-white uppercase mb-2">No Results Found</h3>
              <p className="font-bold text-gray-400 uppercase tracking-widest text-[10px] mb-8 max-w-xs mx-auto">
                We couldn't find any service history for the phone number: <span className="text-primary">{phone}</span>
              </p>
              <motion.button 
                whileHover={{ scale: 1.05, backgroundColor: "#1a1a1a" }}
                whileTap={{ scale: 0.95, backgroundColor: "#333333" }}
                onClick={onBack}
                className="bg-black text-white px-10 py-4 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all shadow-xl"
              >
                Try Another Number
              </motion.button>
            </div>
          ) : (
          <div className="space-y-12">
            {data.records.length > 0 && (
              <div className="space-y-6">
                <h3 className="micro-label text-primary ml-2">Verified Service Records</h3>
                <div className="grid grid-cols-1 gap-6">
                  {data.records.map((r: ServiceRecord) => (
                    <div key={r.id} className="card p-8 group relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-1 h-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="flex flex-col md:flex-row justify-between gap-8">
                        <div className="space-y-6">
                          <div className="flex items-center gap-4">
                            <span className="bg-primary-light text-primary px-4 py-1.5 rounded-lg text-[9px] font-black tracking-widest uppercase border border-primary/10">Verified</span>
                            <span className="text-[11px] font-bold text-gray-300 uppercase tracking-widest data-value">{new Date(r.serviceDate).toLocaleDateString()}</span>
                          </div>
                          <div>
                            <h4 className="text-2xl font-display font-black text-black dark:text-white uppercase tracking-tight">{r.serviceType}</h4>
                            <p className="text-xs font-bold text-primary tracking-widest mt-1 uppercase">{r.carModel}</p>
                          </div>
                          {r.notes && (
                            <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl border border-line dark:border-gray-800 group-hover:bg-white dark:bg-gray-900 transition-all">
                              <p className="text-sm font-medium text-gray-600 dark:text-gray-300 leading-relaxed italic">"{r.notes}"</p>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col justify-center items-center md:items-end gap-4 shrink-0">
                          <div className="text-center md:text-right">
                            <p className="micro-label text-primary mb-1">Next Service Due</p>
                            <p className="text-lg font-black text-black dark:text-white data-value">{new Date(r.nextServiceDate).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.bookings.length > 0 && (
              <div className="space-y-6">
                <h3 className="micro-label text-primary ml-2">Recent Bookings & Invoices</h3>
                <div className="grid grid-cols-1 gap-6">
                  {data.bookings.map((b: Booking) => (
                    <div key={b.id} className="card p-8 group relative overflow-hidden border-l-4 border-l-gray-200">
                      <div className="flex flex-col md:flex-row justify-between gap-8">
                        <div className="space-y-4">
                          <div className="flex items-center gap-4">
                            <span className={`px-4 py-1.5 rounded-lg text-[9px] font-black tracking-widest uppercase border ${
                              b.status === 'Completed' ? 'bg-green-50 text-green-600 border-green-100' : 
                              b.status === 'Cancelled' ? 'bg-red-50 text-red-600 border-red-100' : 
                              'bg-blue-50 text-blue-600 border-blue-100'
                            }`}>
                              {b.status}
                            </span>
                            <span className="text-[11px] font-bold text-gray-300 uppercase tracking-widest data-value">{new Date(b.createdAt).toLocaleDateString()}</span>
                          </div>
                          <div>
                            <h4 className="text-2xl font-display font-black text-black dark:text-white uppercase tracking-tight">{b.serviceType}</h4>
                            <p className="text-xs font-bold text-primary tracking-widest mt-1 uppercase">{b.carModel}</p>
                          </div>
                          {b.workDone && (
                            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-line dark:border-gray-800">
                              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Work Done</p>
                              <p className="text-sm text-gray-600 dark:text-gray-300">{b.workDone}</p>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col justify-center items-center md:items-end gap-4 shrink-0">
                          <div className="bg-gray-50 dark:bg-gray-800/50 px-4 py-2 rounded-lg text-[9px] font-black text-gray-400 uppercase tracking-widest">
                            REF: {b.id}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          )}
        </div>
      </div>
    </div>
  );
};

const App = () => {
  const [lang, setLang] = useState<Language>('sw');
  const [view, setView] = useState<AppView>(AppView.Home);
  const [userPhone, setUserPhone] = useState('');
  const [currentBooking, setCurrentBooking] = useState<Booking | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [preSelectedService, setPreSelectedService] = useState<string | undefined>();
  const [initialEmergency, setInitialEmergency] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const s = UI_STRINGS[lang];

  useEffect(() => { storageService.seedMockData(); }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [view]);

  const handleAdminLogin = (e: React.FormEvent) => { e.preventDefault(); if (adminPassword === '123') { setIsAdmin(true); setView(AppView.AdminDashboard); setAdminPassword(''); } else alert('Password Wrong / Nywila siyo sahihi'); };

  const renderView = () => {
    switch (view) {
      case AppView.Home:
        return (
          <>
            {/* Hero Section */}
            <section className="relative min-h-[75vh] flex items-center py-20 overflow-hidden bg-black">
              {/* Background Image */}
              <div className="absolute inset-0 z-0">
                <img 
                  src="https://images.unsplash.com/photo-1597386601945-8980df52c3dc?q=80&w=1632&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" 
                  alt="Close up of a speedometer on a car" 
                  className="w-full h-full object-cover opacity-70 contrast-125 saturate-125"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent"></div>
                <div className="absolute inset-0 bg-black/20"></div>
              </div>

              {/* Animated Background Graphics */}
              <div className="absolute inset-0 z-0 opacity-20">
                <motion.div 
                  animate={{ 
                    scale: [1, 1.2, 1],
                    rotate: [0, 90, 0],
                    x: [0, 100, 0],
                    y: [0, -50, 0]
                  }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-primary/20 rounded-full blur-[120px]"
                />
                <motion.div 
                  animate={{ 
                    scale: [1, 1.3, 1],
                    rotate: [0, -120, 0],
                    x: [0, -150, 0],
                    y: [0, 100, 0]
                  }}
                  transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                  className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] bg-blue-900/20 rounded-full blur-[150px]"
                />
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
              </div>

              <div className="container-custom px-6 relative z-10 w-full">
                <div className="max-w-4xl">
                  <motion.div
                    initial={{ opacity: 0, x: -100 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, ease: "circOut" }}
                  >
                    <span className="inline-block px-4 py-1.5 bg-primary text-white text-[10px] font-black uppercase tracking-[0.5em] rounded-full mb-8">
                      Zanzibar's #1 Mobile Garage
                    </span>
                  </motion.div>

                  <h1 className="text-4xl md:text-[80px] font-graphic text-white leading-[0.9] uppercase mb-6 tracking-tighter">
                    <motion.span 
                      initial={{ opacity: 0, y: 100 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8, delay: 0.4 }}
                      className="block text-primary"
                    >
                      {lang === 'sw' ? 'GARAGE' : 'MOBILE'}
                    </motion.span>
                    <motion.span 
                      initial={{ opacity: 0, y: 100 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8, delay: 0.6 }}
                      className="block"
                    >
                      {lang === 'sw' ? 'INAYOTEMBEA' : 'GARAGE'}
                    </motion.span>
                  </h1>

                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1, delay: 1 }}
                    className="text-lg md:text-xl text-white/60 font-medium max-w-xl mb-10 leading-relaxed uppercase tracking-tight"
                  >
                    {s.heroSub}
                  </motion.p>

                  <motion.div 
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 1.2 }}
                    className="flex flex-wrap gap-6"
                  >
                    <button 
                      onClick={() => { setView(AppView.Booking); setPreSelectedService(undefined); setInitialEmergency(true); }} 
                      className="group relative overflow-hidden bg-red-600 hover:bg-red-700 text-white font-black py-6 px-14 rounded-2xl transition-all duration-500 flex items-center gap-4 text-xl shadow-2xl shadow-red-600/40 active:scale-95 animate-emergency"
                    >
                      <SirenIcon className="w-6 h-6 group-hover:rotate-12 transition-transform" /> 
                      <span>{s.emergency}</span>
                    </button>

                    <button 
                      onClick={() => setView(AppView.Booking)} 
                      className="group bg-black hover:bg-gray-800 text-white font-black py-6 px-14 rounded-2xl transition-all duration-500 flex items-center gap-4 text-xl active:scale-95 shadow-2xl shadow-black/20"
                    >
                      <BoltIcon className="w-6 h-6 group-hover:scale-110 transition-transform" />
                      <span>{s.bookNow}</span>
                    </button>
                  </motion.div>
                </div>
              </div>
            </section>

            <HistorySearch lang={lang} onSearch={(phone) => { setUserPhone(phone); setView(AppView.UserHistory); }} />

            {/* Quick Booking Banner */}
            <section className="bg-primary py-16 px-6 overflow-hidden relative">
              {/* Marquee Background */}
              <motion.div 
                animate={{ x: [-500, 500] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 opacity-10 pointer-events-none flex items-center"
              >
                <div className="text-[120px] font-graphic text-white whitespace-nowrap uppercase leading-none">
                  FAST • EXPERT • 24/7 • MOBILE • FAST • EXPERT • 24/7 • MOBILE • FAST • EXPERT • 24/7 • MOBILE
                </div>
              </motion.div>
              
              <div className="container-custom flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                <div className="text-white space-y-3 max-w-2xl text-center md:text-left">
                  <h3 className="text-3xl md:text-5xl font-graphic uppercase tracking-tighter leading-none">
                    {lang === 'sw' ? 'UNAHITAJI MSAADA WA HARAKA?' : 'NEED IMMEDIATE ASSISTANCE?'}
                  </h3>
                  <p className="text-white/80 font-black uppercase text-[8px] tracking-[0.5em]">
                    {lang === 'sw' ? 'Wataalamu wetu wapo tayari kukuhudumia popote ulipo.' : 'Our experts are ready to serve you wherever you are.'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-4 justify-center">
                  <motion.button 
                    whileHover={{ scale: 1.05, rotate: 2, backgroundColor: "#1a1a1a" }}
                    whileTap={{ scale: 0.95, backgroundColor: "#333333" }}
                    onClick={() => { setView(AppView.Booking); setInitialEmergency(true); }}
                    className="bg-black text-white px-8 py-4 rounded-xl font-black uppercase tracking-[0.2em] text-sm transition-all shadow-xl"
                  >
                    {s.bookNow}
                  </motion.button>
                  <motion.a 
                    whileHover={{ scale: 1.05, rotate: -2, backgroundColor: "#0a0a0a" }}
                    whileTap={{ scale: 0.95, backgroundColor: "#1a1a1a" }}
                    href={`tel:${PHONE_NUMBER}`}
                    className="bg-gray-950 text-white px-8 py-4 rounded-xl font-black uppercase tracking-[0.2em] text-sm transition-all shadow-xl flex items-center gap-3"
                  >
                    <PhoneIcon className="w-5 h-5" /> {s.callNow}
                  </motion.a>
                </div>
              </div>
            </section>

            {/* Why Choose Us Section - APM Style */}
            <section className="py-20 bg-gray-50 dark:bg-gray-800/50 overflow-hidden">
              <div className="container-custom px-6">
                <motion.div 
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="text-center mb-16"
                >
                  <h2 className="text-3xl md:text-5xl font-graphic text-gray-900 dark:text-gray-100 uppercase tracking-tighter">
                    {lang === 'sw' ? 'KWANINI UTUCHAGUE SISI?' : 'WHY CHOOSE US?'}
                  </h2>
                  <div className="w-20 h-1.5 bg-primary mx-auto mt-4 rounded-full"></div>
                </motion.div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { titleEn: 'Mobile Service', titleSw: 'Huduma inayotembea', descEn: 'We come to your home, office or roadside.', descSw: 'Tunakufuata nyumbani, ofisini au barabarani.', icon: <BoltIcon className="w-8 h-8" /> },
                    { titleEn: 'Expert Mechanics', titleSw: 'Mafundi Bingwa', descEn: 'Certified technicians with years of experience.', descSw: 'Mafundi waliofuzu na wenye uzoefu wa miaka mingi.', icon: <SparklesIcon className="w-8 h-8" /> },
                    { titleEn: 'Fair Pricing', titleSw: 'Bei Rafiki', descEn: 'Transparent pricing with no hidden costs.', descSw: 'Bei wazi bila gharama zilizofichwa.', icon: <InvoiceIcon className="w-8 h-8" /> },
                    { titleEn: '24/7 Support', titleSw: 'Msaada 24/7', descEn: 'Emergency roadside assistance anytime.', descSw: 'Msaada wa dharura barabarani wakati wowote.', icon: <SirenIcon className="w-8 h-8" /> }
                  ].map((item, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, y: 50 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      whileHover={{ y: -10, scale: 1.02 }}
                      className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-lg border border-gray-100 group transition-all duration-500"
                    >
                      <div className="w-16 h-16 bg-blue-50 text-primary rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-all duration-500 transform group-hover:rotate-12">
                        {item.icon}
                      </div>
                      <h3 className="text-lg font-black text-gray-900 dark:text-gray-100 mb-3 uppercase tracking-tight">
                        {lang === 'sw' ? item.titleSw : item.titleEn}
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 font-medium leading-relaxed text-xs">
                        {lang === 'sw' ? item.descSw : item.descEn}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>
            
            {/* Services Section */}
            <section id="services" className="py-20 bg-white dark:bg-gray-950 overflow-hidden">
              <div className="container-custom px-6">
                <motion.div 
                  initial={{ opacity: 0, x: -50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="flex flex-col md:flex-row justify-between items-end gap-8 mb-16"
                >
                  <div className="max-w-2xl">
                    <h2 className="text-4xl md:text-6xl font-graphic text-gray-900 dark:text-gray-100 uppercase tracking-tighter leading-none">{s.servicesTitle}</h2>
                    <p className="text-primary font-black tracking-[0.4em] mt-4 uppercase text-[10px]">{s.noteDistance}</p>
                  </div>
                </motion.div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                  {SERVICES.map((service, i) => (
                    <motion.div
                      key={service.id}
                      initial={{ opacity: 0, y: 100 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1, duration: 0.6 }}
                    >
                      <ServiceCard service={service} lang={lang} onBook={(svc) => { setPreSelectedService(svc); setView(AppView.Booking); }} />
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>

            {/* Reviews Section */}
            <section className="py-32 bg-gray-950 overflow-hidden relative">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,#0066cc,transparent_70%)]"></div>
              </div>
              <div className="container-custom px-6 relative z-10">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  className="text-center mb-24"
                >
                  <h2 className="text-4xl md:text-7xl font-graphic text-white uppercase tracking-tighter">
                    {lang === 'sw' ? 'MAONI YA WATEJA WETU' : 'CUSTOMER REVIEWS'}
                  </h2>
                  <div className="w-32 h-2 bg-primary mx-auto mt-6 rounded-full"></div>
                </motion.div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                  {[
                    { name: 'Said Juma', role: 'Toyota Harrier Owner', textEn: 'Amazing service! They came to my house and fixed my engine issues in no time. Highly recommended.', textSw: 'Huduma nzuri sana! Walikuja nyumbani kwangu na kurekebisha matatizo ya engine yangu kwa muda mfupi. Nawapendekeza sana.', rating: 5 },
                    { name: 'Fatma Ali', role: 'Honda Fit Owner', textEn: 'Very professional and fair prices. I love that I don’t have to drive to a garage anymore.', textSw: 'Wataalamu sana na bei zao ni rafiki. Napenda ukweli kwamba sihitaji tena kuendesha gari kwenda garage.', rating: 5 },
                    { name: 'John Doe', role: 'Nissan Patrol Owner', textEn: 'The emergency roadside assistance saved me when I had a flat tire at night. Thank you!', textSw: 'Msaada wa dharura barabarani uliniokoa nilipopata panja usiku. Asante!', rating: 5 }
                  ].map((review, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, x: i % 2 === 0 ? -50 : 50 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.2 }}
                      whileHover={{ y: -10 }}
                      className="bg-white dark:bg-gray-900/5 backdrop-blur-xl p-10 rounded-[3rem] border border-white/10 space-y-6 group transition-all duration-500"
                    >
                      <div className="flex text-yellow-400">
                        {[...Array(review.rating)].map((_, i) => (
                          <motion.span 
                            key={i}
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                          >
                            <SparklesIcon className="w-6 h-6 fill-current" />
                          </motion.span>
                        ))}
                      </div>
                      <p className="text-white/70 italic font-medium text-lg leading-relaxed">
                        "{lang === 'sw' ? review.textSw : review.textEn}"
                      </p>
                      <div className="pt-6 border-t border-white/10">
                        <h4 className="font-black text-white text-xl uppercase tracking-tight">{review.name}</h4>
                        <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mt-1">{review.role}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>

            {/* FAQ Section */}
            <section className="py-16 bg-gray-50 dark:bg-gray-800/50">
              <div className="container-custom px-6 max-w-4xl">
                <div className="text-center mb-16">
                  <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-gray-100 uppercase tracking-tight">{s.faqTitle}</h2>
                  <div className="w-16 h-1 bg-primary mx-auto mt-4 rounded-full"></div>
                </div>
                <div className="space-y-4">
                  {FAQ_ITEMS.map(faq => (
                    <details key={faq.id} className="group bg-white dark:bg-gray-900 rounded-xl border border-gray-200 open:border-primary transition-all shadow-sm">
                      <summary className="p-6 font-bold text-gray-900 dark:text-gray-100 uppercase cursor-pointer list-none flex justify-between items-center">
                        {lang === 'sw' ? faq.qSw : faq.qEn}
                        <span className="text-primary group-open:rotate-180 transition-transform">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7"/></svg>
                        </span>
                      </summary>
                      <div className="px-6 pb-6 text-gray-600 dark:text-gray-300 font-medium leading-relaxed">
                        {lang === 'sw' ? faq.aSw : faq.aEn}
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            </section>
          </>
        );
      case AppView.Booking:
        return (
          <div className="py-12 md:py-20 bg-gray-50 dark:bg-gray-800/50 min-h-screen">
            <div className="max-w-4xl mx-auto px-6">
              <button 
                onClick={() => setView(AppView.Home)} 
                className="mb-8 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:bg-gray-800/50 text-black dark:text-white border border-line dark:border-gray-800 font-black text-[10px] tracking-widest flex items-center gap-3 uppercase px-6 py-3 rounded-xl transition-all active:scale-95 shadow-lg group"
              >
                <span className="group-hover:-translate-x-1 transition-transform">←</span> {s.backToHome}
              </button>
              <BookingForm lang={lang} initialEmergency={initialEmergency} preSelectedService={preSelectedService} onSuccess={(b) => { setCurrentBooking(b); setView(AppView.Success); }} />
            </div>
          </div>
        );
      case AppView.Success:
        return currentBooking ? (
          <div className="py-12 md:py-20 px-6 text-center max-w-2xl mx-auto flex flex-col items-center justify-center min-h-screen uppercase">
             <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-8"><svg className="w-12 h-12" fill="none" stroke="currentColor" strokeWidth="4" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></div>
             <h2 className="text-4xl font-black mb-4">{s.thankYou}</h2>
             <p className="text-gray-500 dark:text-gray-400 font-bold mb-12">{s.bookingNumber}: {currentBooking.id}</p>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
               <a href={createWhatsAppLink(currentBooking)} target="_blank" rel="noopener noreferrer" className="bg-green-600 text-white p-5 rounded-2xl font-black flex items-center justify-center gap-3 transition-all hover:bg-green-700 active:scale-95 shadow-lg shadow-green-600/20"><WhatsAppIcon /> {s.shareOnWhatsApp}</a>
               <button onClick={() => setView(AppView.Home)} className="bg-black text-white p-5 rounded-2xl font-black transition-all hover:bg-gray-800 active:scale-95 shadow-lg">{s.backToHome}</button>
             </div>
          </div>
        ) : null;
      case AppView.UserHistory:
        return <UserHistory lang={lang} phone={userPhone} onBack={() => setView(AppView.Home)} />;
      case AppView.AdminLogin:
        return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-800/50 px-6 overflow-hidden">
            <motion.div 
              initial={{ opacity: 0, scale: 0.8, rotateX: -20 }}
              animate={{ opacity: 1, scale: 1, rotateX: 0 }}
              transition={{ type: "spring", damping: 20, stiffness: 100 }}
              style={{ perspective: 1000 }}
              className="w-full max-w-md"
            >
              <motion.form 
                onSubmit={handleAdminLogin}
                whileHover={{ rotateY: 5, rotateX: -5, scale: 1.02 }}
                transition={{ type: "spring", damping: 15 }}
                className="bg-white dark:bg-gray-900 p-12 rounded-3xl shadow-2xl w-full space-y-10 border border-line dark:border-gray-800 relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary-light/20 rounded-full translate-x-16 -translate-y-16 group-hover:scale-150 transition-transform duration-700" />
                
                <div className="relative z-10 text-center space-y-4">
                  <div className="bg-primary-light w-20 h-20 rounded-2xl flex items-center justify-center mx-auto text-primary shadow-xl">
                    <Logo className="w-12 h-12" />
                  </div>
                  <h2 className="text-3xl font-display font-black text-black dark:text-white uppercase tracking-tight">{s.adminLogin}</h2>
                  <p className="micro-label">Authorized personnel only</p>
                </div>

                <div className="relative z-10 space-y-6">
                  <div className="space-y-2">
                    <label className="micro-label text-primary ml-2">Access Key</label>
                    <div className="relative group/input">
                      <LockIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within/input:text-primary transition-colors w-5 h-5" />
                      <input 
                        type="password" 
                        placeholder="••••" 
                        value={adminPassword} 
                        autoFocus
                        onChange={(e) => {
                          const val = e.target.value;
                          setAdminPassword(val);
                          if (val === '123') {
                            setIsAdmin(true);
                            setView(AppView.AdminDashboard);
                            setAdminPassword('');
                          }
                        }} 
                        className="w-full pl-14 pr-6 py-5 bg-gray-50 dark:bg-gray-800/50 border border-line dark:border-gray-800 rounded-2xl outline-none focus:border-primary focus:bg-white dark:bg-gray-900 font-black text-xl tracking-[0.5em] text-center shadow-inner transition-all placeholder:text-gray-200" 
                      />
                    </div>
                  </div>
                  <motion.button 
                    type="submit"
                    whileHover={{ scale: 1.02, backgroundColor: "#1a1a1a" }}
                    whileTap={{ scale: 0.98, backgroundColor: "#333333" }}
                    className="w-full bg-black text-white py-4 rounded-xl font-black text-[10px] transition-all shadow-xl uppercase tracking-widest flex items-center justify-center gap-3 group/btn"
                  >
                    Authenticate
                    <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </motion.button>
                </div>

                <div className="relative z-10 pt-4 border-t border-line dark:border-gray-800 text-center">
                  <button onClick={() => setView(AppView.Home)} className="text-[10px] font-black text-gray-400 hover:text-primary transition-colors uppercase tracking-widest">
                    Return to Main Site
                  </button>
                </div>
              </motion.form>
            </motion.div>
          </div>
        );
      case AppView.AdminDashboard:
        return isAdmin ? <AdminDashboard lang={lang} onLogout={() => { setIsAdmin(false); setView(AppView.Home); }} onBackToSite={() => setView(AppView.Home)} /> : <div className="min-h-screen flex items-center justify-center"><p className="font-black">REDIRECTING...</p></div>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] font-sans overflow-x-hidden selection:bg-primary selection:text-white transition-colors duration-300">
      {/* Top Bar - APM Style */}
      <div className="bg-gray-900 text-white py-1.5 px-6 hidden md:block">
        <div className="container-custom flex justify-between items-center text-[11px] font-bold tracking-widest uppercase">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <PhoneIcon className="w-3 h-3 text-primary" />
              <span>{PHONE_NUMBER}</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-3 h-3 text-primary" fill="currentColor" viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
              <span>INFO@GARAGENYUMBANI.COM</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-3 h-3 text-primary" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
            <span>{BUSINESS_LOCATION}</span>
          </div>
        </div>
      </div>

      <nav className="sticky top-0 left-0 right-0 z-[80] bg-white dark:bg-gray-900/95 dark:bg-gray-950/95 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 px-6 py-2">
        <div className="container-custom flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView(AppView.Home)}>
            <Logo className="w-10 h-10" />
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tight text-gray-900 dark:text-gray-100 dark:text-white leading-none">{BUSINESS_NAME}</span>
              <span className="text-[9px] font-bold text-primary tracking-[0.2em] uppercase mt-0.5">Mobile Auto Care</span>
            </div>
          </div>
          <div className="flex items-center gap-4 md:gap-8">
            <div className="hidden md:flex items-center gap-6 text-[11px] font-black uppercase tracking-widest text-gray-600 dark:text-gray-300 dark:text-gray-300">
              <button onClick={() => setView(AppView.Home)} className="hover:text-primary transition-colors">Home</button>
              <button onClick={() => setView(AppView.Booking)} className="hover:text-primary transition-colors">Booking</button>
              <button onClick={() => { const el = document.getElementById('services'); el?.scrollIntoView({behavior: 'smooth'}); }} className="hover:text-primary transition-colors">Services</button>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden w-9 h-9 flex items-center justify-center bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-300 border border-gray-100 rounded-md hover:bg-gray-100 dark:bg-gray-800 transition-all active:scale-90"
              >
                {isMenuOpen ? <XIcon className="w-4 h-4" /> : <MenuIcon className="w-4 h-4" />}
              </button>
              <button 
                onClick={() => {
                  setView(AppView.Home);
                  setTimeout(() => {
                    const el = document.getElementById('history-search');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                }}
                className="w-9 h-9 flex items-center justify-center bg-blue-50 text-primary border border-blue-100 rounded-md hover:bg-blue-100 transition-all active:scale-90"
              >
                <SearchIcon className="w-4 h-4" />
              </button>
              <motion.button 
                whileHover={{ scale: 1.05, backgroundColor: "#000000", color: "#ffffff", borderColor: "#000000" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setLang(lang === 'sw' ? 'en' : 'sw')} 
                className="bg-gray-100 border border-gray-200 px-3 py-1.5 rounded-md font-bold text-[10px] transition-all uppercase"
              >
                {lang === 'sw' ? 'EN' : 'SW'}
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.05, backgroundColor: "#000000", color: "#ffffff" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setView(AppView.AdminLogin)} 
                className="w-9 h-9 flex items-center justify-center bg-gray-900 text-white rounded-md transition-all"
              >
                <BoltIcon className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-x-0 top-[73px] z-[70] bg-white dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800 shadow-2xl md:hidden"
          >
            <div className="p-6 space-y-4">
              <button 
                onClick={() => { setView(AppView.Home); setIsMenuOpen(false); }}
                className="w-full text-left py-3 border-b border-gray-50 dark:border-gray-800 font-black text-xs uppercase tracking-widest text-gray-900 dark:text-gray-100 dark:text-white flex items-center justify-between group"
              >
                Home
                <ArrowRightIcon className="w-4 h-4 text-gray-300 dark:text-gray-600 dark:text-gray-300 group-hover:text-primary transition-colors" />
              </button>
              <button 
                onClick={() => { setView(AppView.Booking); setIsMenuOpen(false); }}
                className="w-full text-left py-3 border-b border-gray-50 dark:border-gray-800 font-black text-xs uppercase tracking-widest text-gray-900 dark:text-gray-100 dark:text-white flex items-center justify-between group"
              >
                Booking
                <ArrowRightIcon className="w-4 h-4 text-gray-300 dark:text-gray-600 dark:text-gray-300 group-hover:text-primary transition-colors" />
              </button>
              <button 
                onClick={() => { 
                  setView(AppView.Home); 
                  setIsMenuOpen(false);
                  setTimeout(() => {
                    const el = document.getElementById('services');
                    el?.scrollIntoView({behavior: 'smooth'});
                  }, 100);
                }}
                className="w-full text-left py-3 border-b border-gray-50 dark:border-gray-800 font-black text-xs uppercase tracking-widest text-gray-900 dark:text-gray-100 dark:text-white flex items-center justify-between group"
              >
                Services
                <ArrowRightIcon className="w-4 h-4 text-gray-300 dark:text-gray-600 dark:text-gray-300 group-hover:text-primary transition-colors" />
              </button>
              <div className="pt-4 flex items-center justify-between">
                <button 
                  onClick={() => { setLang(lang === 'sw' ? 'en' : 'sw'); setIsMenuOpen(false); }}
                  className="bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-lg font-bold text-[10px] uppercase tracking-widest"
                >
                  Language: {lang === 'sw' ? 'English' : 'Kiswahili'}
                </button>
                <button 
                  onClick={() => { setView(AppView.AdminLogin); setIsMenuOpen(false); }}
                  className="bg-gray-900 text-white px-4 py-2 rounded-lg font-bold text-[10px] uppercase tracking-widest"
                >
                  Admin
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="">{renderView()}</main>

      <footer className="bg-gray-900 text-white pt-16 pb-10 px-6">
        <div className="container-custom grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Logo className="w-8 h-8" />
              <h3 className="text-xl font-black tracking-tight uppercase">{BUSINESS_NAME}</h3>
            </div>
            <p className="text-sm font-medium text-gray-400 leading-relaxed">
              We bring the professional garage experience directly to your doorstep. Reliable, fast, and expert mobile auto services across Zanzibar.
            </p>
          </div>
          
          <div className="space-y-6">
            <h4 className="text-sm font-black uppercase tracking-widest text-primary">Quick Links</h4>
            <ul className="space-y-3 text-sm font-medium text-gray-400">
              <li><button onClick={() => setView(AppView.Home)} className="hover:text-white transition-colors">Home</button></li>
              <li><button onClick={() => setView(AppView.Booking)} className="hover:text-white transition-colors">Book a Service</button></li>
              <li><button onClick={() => setView(AppView.UserHistory)} className="hover:text-white transition-colors">Service History</button></li>
              <li><button onClick={() => setView(AppView.AdminLogin)} className="hover:text-white transition-colors">Admin Login</button></li>
            </ul>
          </div>

          <div className="space-y-6">
            <h4 className="text-sm font-black uppercase tracking-widest text-primary">Our Services</h4>
            <ul className="space-y-3 text-sm font-medium text-gray-400">
              {SERVICES.slice(0, 4).map(s => (
                <li key={s.id}><button onClick={() => { setPreSelectedService(lang === 'sw' ? s.titleSw : s.titleEn); setView(AppView.Booking); }} className="hover:text-white transition-colors uppercase text-[10px]">{lang === 'sw' ? s.titleSw : s.titleEn}</button></li>
              ))}
            </ul>
          </div>

          <div className="space-y-6">
            <h4 className="text-sm font-black uppercase tracking-widest text-primary">{s.contactUs}</h4>
            <div className="space-y-4">
              <a href={`tel:${PHONE_NUMBER}`} className="flex items-start gap-4 group transition-all hover:translate-x-1">
                <div className="w-10 h-10 bg-white dark:bg-gray-900/5 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                  <PhoneIcon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase">Call Us</p>
                  <p className="text-sm font-bold group-hover:text-primary transition-colors">{PHONE_NUMBER}</p>
                </div>
              </a>
              <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer" className="flex items-start gap-4 group transition-all hover:translate-x-1">
                <div className="w-10 h-10 bg-white dark:bg-gray-900/5 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-green-500/20 transition-colors">
                  <WhatsAppIcon className="w-4 h-4 text-primary group-hover:text-green-500" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase">WhatsApp</p>
                  <p className="text-sm font-bold group-hover:text-green-500 transition-colors">Chat with us</p>
                </div>
              </a>
            </div>
          </div>
        </div>
        <div className="container-custom border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
          <p>© {new Date().getFullYear()} {BUSINESS_NAME}. All rights reserved.</p>
          <p>Designed for Zanzibar Excellence</p>
        </div>
      </footer>

      <a href={`tel:${PHONE_NUMBER}`} className="fixed bottom-8 right-8 z-[90] bg-red-600 text-white w-16 h-16 rounded-full flex items-center justify-center shadow-2xl shadow-red-600/40 animate-bounce sm:hidden active:ring-4 active:ring-red-500/50"><PhoneIcon className="w-6 h-6" /></a>
    </div>
  );
};

const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  details, 
  lang 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  onConfirm: () => void, 
  details: any, 
  lang: Language 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/90 backdrop-blur-xl"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/10 dark:border-gray-800"
      >
        <div className="p-8 sm:p-12 space-y-8">
          <div className="text-center space-y-2">
            <h3 className="text-3xl font-black text-gray-900 dark:text-gray-100 uppercase tracking-tighter leading-none">
              {lang === 'sw' ? 'HAKIKISHA MAOMBI' : 'CONFIRM BOOKING'}
            </h3>
            <p className="text-[10px] font-bold text-primary tracking-[0.3em] uppercase">Review your details before submission</p>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl border border-gray-100 space-y-4">
              <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Service</span>
                <span className="text-xs font-black text-gray-900 dark:text-gray-100 uppercase">{details.service}</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Date & Time</span>
                <span className="text-xs font-black text-gray-900 dark:text-gray-100 uppercase">{details.datetime ? new Date(details.datetime).toLocaleString() : 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Location</span>
                <span className="text-xs font-black text-gray-900 dark:text-gray-100 uppercase">{details.location}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Emergency</span>
                <span className={`text-xs font-black uppercase ${details.isEmergency ? 'text-red-600' : 'text-green-600'}`}>
                  {details.isEmergency ? (lang === 'sw' ? 'NDIYO' : 'YES') : (lang === 'sw' ? 'HAPANA' : 'NO')}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button 
              onClick={onConfirm}
              className="w-full bg-primary text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:bg-primary-dark transition-all active:scale-95"
            >
              {lang === 'sw' ? 'THIBITISHA MAOMBI' : 'CONFIRM & SUBMIT'}
            </button>
            <button 
              onClick={onClose}
              className="w-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-gray-200 transition-all active:scale-95"
            >
              {lang === 'sw' ? 'RUDI NYUMA' : 'GO BACK'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const AssignMechanicModal = ({ 
  isOpen, 
  onClose, 
  onAssign, 
  booking, 
  lang 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  onAssign: (mechanic: string) => void, 
  booking: Booking | null, 
  lang: Language 
}) => {
  const [selectedMechanic, setSelectedMechanic] = useState('');
  
  useEffect(() => {
    if (isOpen) setSelectedMechanic('');
  }, [isOpen]);

  if (!isOpen || !booking) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl overflow-hidden shadow-2xl"
      >
        <div className="p-8 space-y-6">
          <div className="text-center">
            <h3 className="text-2xl font-black text-black dark:text-white uppercase tracking-tight">Assign Mechanic</h3>
            <p className="text-[10px] font-bold text-primary tracking-widest uppercase mt-1">Select personnel for this task</p>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-line dark:border-gray-800">
              <p className="micro-label text-primary mb-1">Booking ID</p>
              <p className="text-xs font-black text-black dark:text-white uppercase">{booking.id}</p>
            </div>
            
            <div className="space-y-2">
              <label className="micro-label ml-2">Available Mechanics</label>
              <select 
                value={selectedMechanic} 
                onChange={(e) => setSelectedMechanic(e.target.value)}
                className="w-full bg-white dark:bg-gray-900 border-2 border-line dark:border-gray-800 rounded-xl px-6 py-4 font-black text-xs outline-none focus:border-primary transition-all uppercase"
              >
                <option value="">Select Mechanic</option>
                {MECHANICS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button 
              disabled={!selectedMechanic}
              onClick={() => onAssign(selectedMechanic)}
              className="w-full bg-black text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-gray-800 transition-all disabled:opacity-50 active:scale-95"
            >
              Assign & Start
            </button>
            <button 
              onClick={onClose}
              className="w-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all active:scale-95"
            >
              Cancel
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default App;
