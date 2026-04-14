"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import Link from 'next/link';
import { storageService, Booking, BookingStatus, ServiceRecord, WhatsAppLog, setAdminToken, getAdminToken } from '@/lib/storage';
import { MECHANICS, SERVICES } from '@/lib/constants';
import { InvoiceDocument } from '@/components/invoice-document';
import { NearingDueCard } from '@/app/admin/components/nearing-due-card';
import { ReminderModal } from '@/app/admin/components/reminder-modal';
import { generateServiceHistoryPDF } from '@/lib/admin-pdf-utils';
import {
  LayoutDashboard, Users, FileText, MessageSquare, Download,
  CheckCircle, Clock, XCircle, AlertCircle, Wrench, ChevronLeft, Calendar, Plus, Trash2,
  Search
} from 'lucide-react';
import { toast } from 'sonner';
import { format, isBefore, addDays } from 'date-fns';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface InvoiceItem {
  description: string;
  amount: number;
}

interface CompletionData {
  price: string;
  workDone: string;
  invoiceItems: InvoiceItem[];
}

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [records, setRecords] = useState<ServiceRecord[]>([]);
  const [logs, setLogs] = useState<WhatsAppLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [mechanicName, setMechanicName] = useState('');
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  const [completionData, setCompletionData] = useState<CompletionData>({
    price: '',
    workDone: '',
    invoiceItems: [{ description: '', amount: 0 }],
  });
  const [isManualRecordModalOpen, setIsManualRecordModalOpen] = useState(false);
  const [manualRecord, setManualRecord] = useState({
    customerName: '', phone: '', carModel: '', serviceType: '',
    serviceDate: format(new Date(), 'yyyy-MM-dd'),
    nextServiceDate: format(addDays(new Date(), 90), 'yyyy-MM-dd'),
    notes: ''
  });
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [invoiceBooking, setInvoiceBooking] = useState<Booking | null>(null);
  const [bookingSearch, setBookingSearch] = useState('');
  const [recordSearch, setRecordSearch] = useState('');
  const [logSearch, setLogSearch] = useState('');
  const [reminderModalOpen, setReminderModalOpen] = useState(false);
  const [smsEnabled, setSmsEnabled] = useState(false);

  useEffect(() => {
    // Restore session from sessionStorage on mount
    const token = getAdminToken();
    if (token) setIsAuthenticated(true);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    Promise.all([
      storageService.getBookings(),
      storageService.getServiceRecords(),
      storageService.getLogs(),
    ])
      .then(([b, r, l]) => {
        setBookings(b);
        setRecords(r);
        setLogs(l);
      })
      .catch(() => toast.error('Failed to load data'))
      .finally(() => setIsLoading(false));

    fetch('/api/reminders/sms-enabled')
      .then(r => r.json())
      .then(({ enabled }) => setSmsEnabled(!!enabled))
      .catch(() => {});
  }, [isAuthenticated]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        toast.error('Invalid password');
        return;
      }
      const { token } = await res.json();
      setAdminToken(token);
      setIsAuthenticated(true);
      toast.success('Logged in successfully');
    } catch {
      toast.error('Login failed. Please try again.');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${getAdminToken()}` },
      });
    } catch { /* best effort */ }
    setAdminToken(null);
    setIsAuthenticated(false);
    setBookings([]);
    setRecords([]);
    setLogs([]);
  };

  const handleStatusUpdate = async (id: string, status: BookingStatus, mechanic?: string) => {
    try {
      await storageService.updateBookingStatus(id, status, mechanic);
      const updated = await storageService.getBookings();
      setBookings(updated);
      toast.success(`Booking marked as ${status}`);
      setSelectedBooking(null);

      if (status === 'In Progress' || status === 'Completed') {
        const b = updated.find(x => x.id === id) ?? bookings.find(x => x.id === id);
        if (b) {
          const msg = status === 'In Progress'
            ? `Hello ${b.customerName}, your mechanic ${mechanic} has been assigned and is on the way!`
            : `Hello ${b.customerName}, your service for ${b.carModel} is complete. Thank you for choosing Garage Nyumbani!`;
          try {
            await storageService.addLog(id, b.phone, msg);
            const updatedLogs = await storageService.getLogs();
            setLogs(updatedLogs);
          } catch {
            toast.error('Failed to log WhatsApp message');
          }

          if (status === 'Completed') {
            try {
              await storageService.saveServiceRecord({
                phone: b.phone,
                customerName: b.customerName,
                carModel: b.carModel,
                serviceType: b.serviceType,
                serviceDate: new Date().toISOString(),
                nextServiceDate: addDays(new Date(), 90).toISOString(),
                notes: `Completed booking ${b.id}`
              });
              const updatedRecords = await storageService.getServiceRecords();
              setRecords(updatedRecords);
            } catch {
              toast.error('Failed to save service record');
            }
          }
        }
      }
    } catch {
      toast.error('Failed to update booking status');
    }
  };

  const handleCompleteBooking = async () => {
    if (!selectedBooking) return;
    const price = parseFloat(completionData.price);
    if (isNaN(price) || price < 0) {
      toast.error('Enter a valid price (0 is allowed)');
      return;
    }
    const validItems = completionData.invoiceItems.filter(item => item.description.trim());
    try {
      await storageService.updateBooking(selectedBooking.id, {
        price,
        workDone: completionData.workDone,
        invoiceItems: validItems.length > 0 ? validItems : undefined,
      });
      await handleStatusUpdate(selectedBooking.id, 'Completed', selectedBooking.mechanic);
      setIsCompletionModalOpen(false);
      setCompletionData({ price: '', workDone: '', invoiceItems: [{ description: '', amount: 0 }] });
    } catch {
      toast.error('Failed to complete booking');
    }
  };

  const openCompletionModal = () => {
    setCompletionData({ price: '', workDone: '', invoiceItems: [{ description: '', amount: 0 }] });
    setIsCompletionModalOpen(true);
  };

  const addInvoiceItem = () => {
    setCompletionData(d => ({ ...d, invoiceItems: [...d.invoiceItems, { description: '', amount: 0 }] }));
  };

  const removeInvoiceItem = (idx: number) => {
    setCompletionData(d => ({ ...d, invoiceItems: d.invoiceItems.filter((_, i) => i !== idx) }));
  };

  const updateInvoiceItem = (idx: number, field: keyof InvoiceItem, value: string | number) => {
    setCompletionData(d => ({
      ...d,
      invoiceItems: d.invoiceItems.map((item, i) => i === idx ? { ...item, [field]: value } : item),
    }));
  };

  const sendReminder = async (record: ServiceRecord) => {
    const msg = `Hello ${record.customerName}, it's time for your next ${record.serviceType} service for your ${record.carModel}. Please book an appointment with Garage Nyumbani!`;
    try {
      await storageService.addLog('reminder', record.phone, msg);
      const updatedLogs = await storageService.getLogs();
      setLogs(updatedLogs);
      toast.success(`Reminder sent to ${record.customerName}`);
    } catch {
      toast.error('Failed to send reminder');
    }
  };

  const generateInvoice = async (booking: Booking) => {
    setInvoiceBooking(booking);
    // Wait for React to render the invoice DOM
    await new Promise(r => setTimeout(r, 100));
    if (!invoiceRef.current) return;
    try {
      const canvas = await html2canvas(invoiceRef.current, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = (canvas.height * pageWidth) / canvas.width;
      doc.addImage(imgData, 'PNG', 0, 0, pageWidth, pageHeight);
      doc.save(`Invoice_${booking.id}.pdf`);
      toast.success('Invoice generated successfully');
    } catch {
      toast.error('Failed to generate invoice');
    } finally {
      setInvoiceBooking(null);
    }
  };

  const exportReport = () => {
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Garage Nyumbani - Service Report", 20, 20);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated: ${format(new Date(), 'PPpp')}`, 20, 28);
    let y = 40;
    bookings.forEach((b, i) => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.text(`${i + 1}. ${b.customerName} - ${b.carModel} (${b.status})`, 20, y);
      doc.text(`   Date: ${b.preferredDate} | Type: ${b.serviceType}`, 20, y + 5);
      y += 15;
    });
    doc.save('Service_Report.pdf');
    toast.success('Report exported successfully');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-900 px-4">
        <div className="max-w-md w-full bg-white dark:bg-black p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800">
          <div className="flex justify-center mb-8">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl">
              <Wrench className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <h1 className="font-display text-2xl font-bold text-center mb-8">Admin Access</h1>
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Enter admin password"
              />
            </div>
            <button type="submit" className="w-full py-3 rounded-xl bg-black dark:bg-white text-white dark:text-black font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors">
              Login
            </button>
            <Link href="/" className="block text-center text-sm text-gray-500 hover:text-blue-600 mt-4">
              &larr; Back to Website
            </Link>
          </form>
        </div>
      </div>
    );
  }

  const nearingDue = records.filter(r =>
    isBefore(new Date(r.nextServiceDate), addDays(new Date(), 14))
  );

  const filteredBookings = bookingSearch.trim()
    ? bookings.filter(b => {
        const q = bookingSearch.toLowerCase();
        return b.customerName.toLowerCase().includes(q) ||
               b.phone.includes(q) ||
               b.carModel.toLowerCase().includes(q) ||
               b.serviceType.toLowerCase().includes(q) ||
               b.status.toLowerCase().includes(q);
      })
    : bookings;

  const filteredRecords = recordSearch.trim()
    ? records.filter(r => {
        const q = recordSearch.toLowerCase();
        return r.customerName.toLowerCase().includes(q) ||
               r.phone.includes(q) ||
               r.carModel.toLowerCase().includes(q) ||
               r.serviceType.toLowerCase().includes(q);
      })
    : records;

  const filteredLogs = logSearch.trim()
    ? logs.filter(l => {
        const q = logSearch.toLowerCase();
        return l.phone.includes(q) || l.message.toLowerCase().includes(q);
      })
    : logs;

  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'New').length,
    inProgress: bookings.filter(b => b.status === 'In Progress').length,
    completed: bookings.filter(b => b.status === 'Completed').length,
  };

  const serviceLabel = (serviceType: string) => {
    const s = SERVICES.find(x => x.id === serviceType);
    return s ? s.titleEn : serviceType;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 flex flex-col md:flex-row">
      {/* Hidden invoice render target */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        <div ref={invoiceRef}>
          {invoiceBooking && <InvoiceDocument booking={invoiceBooking} />}
        </div>
      </div>

      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white dark:bg-black border-r border-gray-200 dark:border-gray-800 flex-shrink-0">
        <div className="p-6">
          <div className="flex items-center gap-2 font-display font-bold text-xl mb-8">
            <Wrench className="w-6 h-6 text-blue-600" />
            Garage Admin
          </div>
          <nav className="space-y-2">
            {[
              { id: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard },
              { id: 'bookings', label: 'Bookings', Icon: Users },
              { id: 'reminders', label: 'Reminders', Icon: Calendar },
              { id: 'logs', label: 'Comms Logs', Icon: MessageSquare },
            ].map(({ id, label, Icon }) => (
              <button key={id} onClick={() => setActiveTab(id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === id ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-800'}`}>
                <Icon className="w-5 h-5" /> {label}
              </button>
            ))}
          </nav>
        </div>
        <div className="p-6 mt-auto space-y-3">
          <Link href="/" className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-black dark:hover:text-white transition-colors">
            <ChevronLeft className="w-4 h-4" /> Back to Site
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm font-medium text-red-500 hover:text-red-700 transition-colors"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        <div className="max-w-6xl mx-auto">

          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!isLoading && activeTab === 'dashboard' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="flex justify-between items-center mb-8">
                <h2 className="font-display text-3xl font-bold">Overview</h2>
                <button onClick={exportReport} className="flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg font-medium text-sm hover:opacity-90 transition-opacity">
                  <Download className="w-4 h-4" /> Export Report
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                {[
                  { label: 'Total Bookings', value: stats.total, color: '' },
                  { label: 'Pending (New)', value: stats.pending, color: 'text-yellow-600 dark:text-yellow-500' },
                  { label: 'In Progress', value: stats.inProgress, color: 'text-blue-600 dark:text-blue-500' },
                  { label: 'Completed', value: stats.completed, color: 'text-green-600 dark:text-green-500' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-white dark:bg-black p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                    <div className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-2">{label}</div>
                    <div className={`text-4xl font-display font-bold ${color}`}>{value}</div>
                  </div>
                ))}
              </div>
              <NearingDueCard nearingDue={nearingDue} />
              {nearingDue.length > 0 && (
                <div className="flex justify-end -mt-4 mb-8">
                  <button
                    onClick={() => setReminderModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition-colors"
                  >
                    <MessageSquare className="w-4 h-4" /> Send Reminders ({nearingDue.length})
                  </button>
                </div>
              )}

              <h3 className="font-display text-xl font-bold mb-6">Recent Emergency Bookings</h3>
              <div className="bg-white dark:bg-black rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {bookings.filter(b => b.isEmergency).slice(0, 5).map(b => (
                    <div key={b.id} className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-full">
                          <AlertCircle className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                          <div className="font-medium">{b.customerName} - {b.carModel}</div>
                          <div className="text-sm text-gray-500">{b.location} • {b.phone}</div>
                        </div>
                      </div>
                      <span className="text-sm font-mono text-gray-500">{format(new Date(b.createdAt), 'MMM dd, HH:mm')}</span>
                    </div>
                  ))}
                  {bookings.filter(b => b.isEmergency).length === 0 && (
                    <div className="p-8 text-center text-gray-500">No emergency bookings.</div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {!isLoading && activeTab === 'bookings' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h2 className="font-display text-3xl font-bold mb-6">Booking Management</h2>
              <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={bookingSearch}
                  onChange={e => setBookingSearch(e.target.value)}
                  placeholder="Search by name, phone, car, service..."
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-white dark:bg-black border border-gray-200 dark:border-gray-800 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
              </div>
              <div className="bg-white dark:bg-black rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-zinc-900 border-b border-gray-100 dark:border-gray-800">
                        <th className="p-4 font-medium text-sm text-gray-500">ID / Date</th>
                        <th className="p-4 font-medium text-sm text-gray-500">Customer</th>
                        <th className="p-4 font-medium text-sm text-gray-500">Service</th>
                        <th className="p-4 font-medium text-sm text-gray-500">Status</th>
                        <th className="p-4 font-medium text-sm text-gray-500 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {filteredBookings.map(b => (
                        <tr key={b.id} className="hover:bg-gray-50 dark:hover:bg-zinc-900/50 transition-colors">
                          <td className="p-4">
                            <div className="font-mono text-sm">{b.id.toUpperCase()}</div>
                            <div className="text-xs text-gray-500">{b.preferredDate}</div>
                          </td>
                          <td className="p-4">
                            <div className="font-medium flex items-center gap-2">
                              {b.customerName}
                              {b.isEmergency && <AlertCircle className="w-4 h-4 text-red-500" />}
                            </div>
                            <div className="text-xs text-gray-500">{b.phone}</div>
                          </td>
                          <td className="p-4">
                            <div className="text-sm">{serviceLabel(b.serviceType)}</div>
                            <div className="text-xs text-gray-500">{b.carModel}</div>
                          </td>
                          <td className="p-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              b.status === 'New' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500' :
                              b.status === 'In Progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                              b.status === 'Completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                              'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                              {b.status}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => { setSelectedBooking(b); setMechanicName(''); }}
                              className="text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              Manage
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {!isLoading && activeTab === 'logs' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h2 className="font-display text-3xl font-bold mb-6">Communication Logs</h2>
              <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={logSearch}
                  onChange={e => setLogSearch(e.target.value)}
                  placeholder="Search by phone or message..."
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-white dark:bg-black border border-gray-200 dark:border-gray-800 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
              </div>
              <div className="bg-white dark:bg-black rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6">
                <div className="space-y-6">
                  {filteredLogs.map(log => (
                    <div key={log.id} className="flex gap-4 p-4 bg-gray-50 dark:bg-zinc-900 rounded-xl">
                      <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full h-fit">
                        <MessageSquare className="w-5 h-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{log.phone}</span>
                          <span className="text-xs text-gray-500 font-mono">{format(new Date(log.sentAt), 'PPpp')}</span>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-black p-3 rounded-lg border border-gray-100 dark:border-gray-800 mt-2">
                          {log.message}
                        </p>
                      </div>
                    </div>
                  ))}
                  {logs.length === 0 && (
                    <div className="text-center text-gray-500 py-8">No communication logs found.</div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {!isLoading && activeTab === 'reminders' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-display text-3xl font-bold">Service Reminders</h2>
                <div className="flex gap-3">
                  <button
                    onClick={() => generateServiceHistoryPDF(records)}
                    className="flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg font-medium hover:opacity-90 transition-opacity text-sm"
                  >
                    <Download className="w-4 h-4" /> Download PDF
                  </button>
                  <button onClick={() => setIsManualRecordModalOpen(true)} className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg font-medium hover:opacity-90 transition-opacity">
                    + Add Record
                  </button>
                </div>
              </div>
              <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={recordSearch}
                  onChange={e => setRecordSearch(e.target.value)}
                  placeholder="Search by name, phone, car, service..."
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-white dark:bg-black border border-gray-200 dark:border-gray-800 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
              </div>
              <div className="bg-white dark:bg-black rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6">
                <div className="space-y-4">
                  {filteredRecords.map(record => {
                    const isDue = isBefore(new Date(record.nextServiceDate), new Date());
                    return (
                      <div key={record.id} className={`p-4 rounded-2xl border ${isDue ? 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30' : 'bg-gray-50 dark:bg-zinc-900 border-gray-100 dark:border-gray-800'}`}>
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="font-medium">{record.customerName} - {record.carModel}</div>
                            <div className="text-xs text-gray-500">{record.phone}</div>
                          </div>
                          <div className={`text-xs font-bold ${isDue ? 'text-red-600' : 'text-gray-500'}`}>
                            Due: {format(new Date(record.nextServiceDate), 'PP')}
                          </div>
                        </div>
                        <div className="flex justify-between items-end mt-4">
                          <p className="text-sm text-gray-600 dark:text-gray-400">Last Service: {record.serviceType}</p>
                          <button onClick={() => sendReminder(record)} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
                            Send Reminder
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {records.length === 0 && <div className="text-center text-gray-500 py-8">No service records found.</div>}
                </div>
              </div>
            </motion.div>
          )}

        </div>
      </main>

      {/* Manage Booking Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800"
          >
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
              <h3 className="font-display text-xl font-bold">Manage Booking {selectedBooking.id.toUpperCase()}</h3>
              <button onClick={() => setSelectedBooking(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Customer Details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-500 mb-1">Customer</div>
                  <div className="font-medium">{selectedBooking.customerName}</div>
                  <div>{selectedBooking.phone}</div>
                  {selectedBooking.whatsapp && (
                    <div className="text-green-600 text-xs mt-1">WA: {selectedBooking.whatsapp}</div>
                  )}
                </div>
                <div>
                  <div className="text-gray-500 mb-1">Vehicle & Service</div>
                  <div className="font-medium">{selectedBooking.carModel}</div>
                  <div className="text-sm">{serviceLabel(selectedBooking.serviceType)}</div>
                </div>
              </div>
              {selectedBooking.notes && (
                <div className="text-sm bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800 p-3 rounded-lg">
                  <span className="font-medium text-amber-700 dark:text-amber-400">Notes: </span>
                  {selectedBooking.notes}
                </div>
              )}

              {/* Assign Mechanic (New) */}
              {selectedBooking.status === 'New' && (
                <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                  <label className="block text-sm font-medium">Assign Mechanic</label>
                  <select
                    value={mechanicName}
                    onChange={e => setMechanicName(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                  >
                    <option value="">— Select mechanic —</option>
                    {MECHANICS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <button
                    onClick={() => {
                      if (!mechanicName) return toast.error('Select a mechanic');
                      handleStatusUpdate(selectedBooking.id, 'In Progress', mechanicName);
                    }}
                    className="w-full py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                  >
                    Assign & Start Service
                  </button>
                </div>
              )}

              {/* In Progress */}
              {selectedBooking.status === 'In Progress' && (
                <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-800 dark:text-blue-300">
                    Assigned to: <span className="font-bold">{selectedBooking.mechanic}</span>
                  </div>
                  <button
                    onClick={openCompletionModal}
                    className="w-full py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" /> Mark as Completed
                  </button>
                </div>
              )}

              {/* Completed — generate invoice */}
              {selectedBooking.status === 'Completed' && (
                <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                  {selectedBooking.price !== undefined && (
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Price: <span className="font-semibold">TZS {selectedBooking.price.toLocaleString()}</span>
                    </div>
                  )}
                  {selectedBooking.workDone && (
                    <div className="text-sm text-gray-600 dark:text-gray-400">Work: {selectedBooking.workDone}</div>
                  )}
                  <button
                    onClick={() => generateInvoice(selectedBooking)}
                    className="w-full py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg font-medium hover:opacity-90 flex items-center justify-center gap-2"
                  >
                    <FileText className="w-4 h-4" /> Generate Invoice PDF
                  </button>
                </div>
              )}

              {selectedBooking.status !== 'Cancelled' && selectedBooking.status !== 'Completed' && (
                <div className="pt-4">
                  <button
                    onClick={() => handleStatusUpdate(selectedBooking.id, 'Cancelled')}
                    className="text-sm text-red-600 font-medium hover:underline"
                  >
                    Cancel Booking
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Completion Modal */}
      {isCompletionModalOpen && selectedBooking && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center sticky top-0 bg-white dark:bg-zinc-900">
              <h3 className="font-display text-xl font-bold">Complete Booking</h3>
              <button onClick={() => setIsCompletionModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Price */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Price (TZS) — enter 0 if covered by specialist</label>
                <input
                  type="number"
                  min="0"
                  value={completionData.price}
                  onChange={e => setCompletionData(d => ({ ...d, price: e.target.value }))}
                  placeholder="e.g. 55000"
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              {/* Work Done */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Work Done</label>
                <textarea
                  rows={3}
                  value={completionData.workDone}
                  onChange={e => setCompletionData(d => ({ ...d, workDone: e.target.value }))}
                  placeholder="Describe the work completed..."
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                />
              </div>
              {/* Invoice Line Items */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Invoice Line Items</label>
                  <button type="button" onClick={addInvoiceItem} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium">
                    <Plus className="w-4 h-4" /> Add Item
                  </button>
                </div>
                {completionData.invoiceItems.map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={item.description}
                      onChange={e => updateInvoiceItem(idx, 'description', e.target.value)}
                      placeholder="Description"
                      className="flex-1 px-3 py-2 rounded-lg bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    />
                    <input
                      type="number"
                      min="0"
                      value={item.amount || ''}
                      onChange={e => updateInvoiceItem(idx, 'amount', parseFloat(e.target.value) || 0)}
                      placeholder="Amount"
                      className="w-28 px-3 py-2 rounded-lg bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    />
                    {completionData.invoiceItems.length > 1 && (
                      <button type="button" onClick={() => removeInvoiceItem(idx)} className="text-red-500 hover:text-red-700 p-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                {/* Running total */}
                <div className="text-right text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total: TZS {completionData.invoiceItems.reduce((s, i) => s + (i.amount || 0), 0).toLocaleString()}
                </div>
              </div>

              <button
                onClick={handleCompleteBooking}
                className="w-full py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5" /> Save & Complete
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Manual Record Modal */}
      {isManualRecordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center sticky top-0 bg-white dark:bg-zinc-900">
              <h3 className="font-display text-xl font-bold">Add Service Record</h3>
              <button onClick={() => setIsManualRecordModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                await storageService.saveServiceRecord({
                  ...manualRecord,
                  serviceDate: new Date(manualRecord.serviceDate).toISOString(),
                  nextServiceDate: new Date(manualRecord.nextServiceDate).toISOString(),
                });
                const updatedRecords = await storageService.getServiceRecords();
                setRecords(updatedRecords);
                setIsManualRecordModalOpen(false);
                toast.success('Service record added');
                setManualRecord({
                  customerName: '', phone: '', carModel: '', serviceType: '',
                  serviceDate: format(new Date(), 'yyyy-MM-dd'),
                  nextServiceDate: format(addDays(new Date(), 90), 'yyyy-MM-dd'),
                  notes: ''
                });
              } catch {
                toast.error('Failed to save service record');
              }
            }} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Customer Name', key: 'customerName', type: 'text' },
                  { label: 'Phone', key: 'phone', type: 'tel' },
                  { label: 'Car Model', key: 'carModel', type: 'text' },
                  { label: 'Service Type', key: 'serviceType', type: 'text' },
                  { label: 'Service Date', key: 'serviceDate', type: 'date' },
                  { label: 'Next Due Date', key: 'nextServiceDate', type: 'date' },
                ].map(({ label, key, type }) => (
                  <div key={key} className="space-y-1">
                    <label className="text-sm font-medium">{label}</label>
                    <input
                      required
                      type={type}
                      value={manualRecord[key as keyof typeof manualRecord]}
                      onChange={e => setManualRecord({ ...manualRecord, [key]: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                ))}
                <div className="space-y-1 col-span-2">
                  <label className="text-sm font-medium">Notes</label>
                  <textarea
                    value={manualRecord.notes}
                    onChange={e => setManualRecord({ ...manualRecord, notes: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                    rows={3}
                  />
                </div>
              </div>
              <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 mt-4">
                Save Record
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {reminderModalOpen && nearingDue.length > 0 && (
        <ReminderModal
          records={nearingDue}
          smsEnabled={smsEnabled}
          onClose={() => setReminderModalOpen(false)}
          onReminderSent={async () => {
            try {
              const updatedLogs = await storageService.getLogs();
              setLogs(updatedLogs);
            } catch { /* best effort */ }
          }}
        />
      )}
    </div>
  );
}
