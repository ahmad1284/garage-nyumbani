"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import Link from 'next/link';
import { storageService, Booking, BookingStatus, ServiceRecord } from '@/lib/storage';
import { 
  LayoutDashboard, Users, FileText, MessageSquare, Download, 
  CheckCircle, Clock, XCircle, AlertCircle, Wrench, ChevronLeft, Calendar
} from 'lucide-react';
import { toast } from 'sonner';
import { format, isBefore, addDays } from 'date-fns';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [records, setRecords] = useState<ServiceRecord[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [mechanicName, setMechanicName] = useState('');
  const [isManualRecordModalOpen, setIsManualRecordModalOpen] = useState(false);
  const [manualRecord, setManualRecord] = useState({
    customerName: '',
    phone: '',
    carModel: '',
    serviceType: '',
    serviceDate: format(new Date(), 'yyyy-MM-dd'),
    nextServiceDate: format(addDays(new Date(), 90), 'yyyy-MM-dd'),
    notes: ''
  });

  useEffect(() => {
    if (isAuthenticated) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBookings(storageService.getBookings());
      setRecords(storageService.getServiceRecords());
    }
  }, [isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin123') {
      setIsAuthenticated(true);
      toast.success('Logged in successfully');
    } else {
      toast.error('Invalid password');
    }
  };

  const handleStatusUpdate = (id: string, status: BookingStatus, mechanic?: string) => {
    storageService.updateBookingStatus(id, status, mechanic);
    setBookings(storageService.getBookings());
    toast.success(`Booking marked as ${status}`);
    setSelectedBooking(null);
    
    // Simulate WhatsApp log if completed or assigned
    if (status === 'In Progress' || status === 'Completed') {
      const b = bookings.find(x => x.id === id);
      if (b) {
        const msg = status === 'In Progress' 
          ? `Hello ${b.customerName}, your mechanic ${mechanic} has been assigned and is on the way!`
          : `Hello ${b.customerName}, your service for ${b.carModel} is complete. Thank you for choosing Garage Nyumbani!`;
        storageService.addLog(id, b.phone, msg);
        
        // If completed, add a service record for future reminders
        if (status === 'Completed') {
          storageService.saveServiceRecord({
            phone: b.phone,
            customerName: b.customerName,
            carModel: b.carModel,
            serviceType: b.serviceType,
            serviceDate: new Date().toISOString(),
            nextServiceDate: addDays(new Date(), 90).toISOString(), // 3 months default
            notes: `Completed booking ${b.id}`
          });
          setRecords(storageService.getServiceRecords());
        }
      }
    }
  };

  const sendReminder = (record: ServiceRecord) => {
    const msg = `Hello ${record.customerName}, it's time for your next ${record.serviceType} service for your ${record.carModel}. Please book an appointment with Garage Nyumbani!`;
    storageService.addLog('reminder', record.phone, msg);
    toast.success(`Reminder sent to ${record.customerName}`);
  };

  const generateInvoice = async (booking: Booking) => {
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("GARAGE NYUMBANI", 20, 20);
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("Mobile Auto Service Zanzibar", 20, 28);
    
    doc.text(`Invoice #: INV-${booking.id.toUpperCase()}`, 140, 20);
    doc.text(`Date: ${format(new Date(), 'MMM dd, yyyy')}`, 140, 28);
    
    doc.line(20, 35, 190, 35);
    
    doc.setFont("helvetica", "bold");
    doc.text("Bill To:", 20, 45);
    doc.setFont("helvetica", "normal");
    doc.text(booking.customerName, 20, 52);
    doc.text(booking.phone, 20, 59);
    doc.text(booking.location, 20, 66);
    
    doc.setFont("helvetica", "bold");
    doc.text("Vehicle Details:", 140, 45);
    doc.setFont("helvetica", "normal");
    doc.text(booking.carModel, 140, 52);
    doc.text(`Service: ${booking.serviceType.toUpperCase()}`, 140, 59);
    
    doc.line(20, 75, 190, 75);
    
    doc.setFont("helvetica", "bold");
    doc.text("Description", 20, 85);
    doc.text("Amount", 160, 85);
    
    doc.line(20, 90, 190, 90);
    
    doc.setFont("helvetica", "normal");
    doc.text(`Standard ${booking.serviceType} service`, 20, 100);
    doc.text("Tsh 150,000", 160, 100);
    
    if (booking.isEmergency) {
      doc.text("Emergency Callout Fee", 20, 110);
      doc.text("Tsh 50,000", 160, 110);
    }
    
    doc.line(20, 130, 190, 130);
    doc.setFont("helvetica", "bold");
    doc.text("Total:", 120, 140);
    doc.text(booking.isEmergency ? "Tsh 200,000" : "Tsh 150,000", 160, 140);
    
    doc.save(`Invoice_${booking.id}.pdf`);
    toast.success('Invoice generated successfully');
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
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(`${i+1}. ${b.customerName} - ${b.carModel} (${b.status})`, 20, y);
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

  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'New').length,
    inProgress: bookings.filter(b => b.status === 'In Progress').length,
    completed: bookings.filter(b => b.status === 'Completed').length,
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white dark:bg-black border-r border-gray-200 dark:border-gray-800 flex-shrink-0">
        <div className="p-6">
          <div className="flex items-center gap-2 font-display font-bold text-xl mb-8">
            <Wrench className="w-6 h-6 text-blue-600" />
            Garage Admin
          </div>
          <nav className="space-y-2">
            <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'dashboard' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-800'}`}>
              <LayoutDashboard className="w-5 h-5" /> Dashboard
            </button>
            <button onClick={() => setActiveTab('bookings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'bookings' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-800'}`}>
              <Users className="w-5 h-5" /> Bookings
            </button>
            <button onClick={() => setActiveTab('reminders')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'reminders' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-800'}`}>
              <Calendar className="w-5 h-5" /> Reminders
            </button>
            <button onClick={() => setActiveTab('logs')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'logs' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-800'}`}>
              <MessageSquare className="w-5 h-5" /> Comms Logs
            </button>
          </nav>
        </div>
        <div className="p-6 mt-auto">
          <Link href="/" className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-black dark:hover:text-white transition-colors">
            <ChevronLeft className="w-4 h-4" /> Back to Site
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          
          {activeTab === 'dashboard' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="flex justify-between items-center mb-8">
                <h2 className="font-display text-3xl font-bold">Overview</h2>
                <button onClick={exportReport} className="flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg font-medium text-sm hover:opacity-90 transition-opacity">
                  <Download className="w-4 h-4" /> Export Report
                </button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <div className="bg-white dark:bg-black p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                  <div className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-2">Total Bookings</div>
                  <div className="text-4xl font-display font-bold">{stats.total}</div>
                </div>
                <div className="bg-white dark:bg-black p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                  <div className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-2">Pending (New)</div>
                  <div className="text-4xl font-display font-bold text-yellow-600 dark:text-yellow-500">{stats.pending}</div>
                </div>
                <div className="bg-white dark:bg-black p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                  <div className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-2">In Progress</div>
                  <div className="text-4xl font-display font-bold text-blue-600 dark:text-blue-500">{stats.inProgress}</div>
                </div>
                <div className="bg-white dark:bg-black p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                  <div className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-2">Completed</div>
                  <div className="text-4xl font-display font-bold text-green-600 dark:text-green-500">{stats.completed}</div>
                </div>
              </div>

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

          {activeTab === 'bookings' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h2 className="font-display text-3xl font-bold mb-8">Booking Management</h2>
              
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
                      {bookings.map(b => (
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
                            <div className="text-sm">{b.serviceType}</div>
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
                              onClick={() => setSelectedBooking(b)}
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

          {activeTab === 'logs' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h2 className="font-display text-3xl font-bold mb-8">Communication Logs</h2>
              <div className="bg-white dark:bg-black rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden p-6">
                <div className="space-y-6">
                  {storageService.getLogs().map(log => (
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
                  {storageService.getLogs().length === 0 && (
                    <div className="text-center text-gray-500 py-8">No communication logs found.</div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'reminders' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="flex justify-between items-center mb-8">
                <h2 className="font-display text-3xl font-bold">Service Reminders</h2>
                <button 
                  onClick={() => setIsManualRecordModalOpen(true)}
                  className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg font-medium hover:opacity-90 transition-opacity"
                >
                  + Add Record
                </button>
              </div>
              <div className="bg-white dark:bg-black rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden p-6">
                <div className="space-y-4">
                  {records.map(record => {
                    const isDue = isBefore(new Date(record.nextServiceDate), new Date());
                    return (
                      <div key={record.id} className={`p-4 rounded-2xl border ${isDue ? 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30' : 'bg-gray-50 dark:bg-zinc-900 border-gray-100 dark:border-gray-800'}`}>
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="font-medium">{record.customerName} - {record.carModel}</div>
                            <div className="text-xs text-gray-500">{record.phone}</div>
                          </div>
                          <div className="text-right">
                            <div className={`text-xs font-bold ${isDue ? 'text-red-600' : 'text-gray-500'}`}>
                              Due: {format(new Date(record.nextServiceDate), 'PP')}
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-between items-end mt-4">
                          <p className="text-sm text-gray-600 dark:text-gray-400">Last Service: {record.serviceType}</p>
                          <button 
                            onClick={() => sendReminder(record)}
                            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Send Reminder
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {records.length === 0 && (
                    <div className="text-center text-gray-500 py-8">No service records found.</div>
                  )}
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
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-500 mb-1">Customer</div>
                  <div className="font-medium">{selectedBooking.customerName}</div>
                  <div>{selectedBooking.phone}</div>
                </div>
                <div>
                  <div className="text-gray-500 mb-1">Vehicle & Service</div>
                  <div className="font-medium">{selectedBooking.carModel}</div>
                  <div className="capitalize">{selectedBooking.serviceType}</div>
                </div>
              </div>

              {selectedBooking.status === 'New' && (
                <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                  <label className="block text-sm font-medium">Assign Mechanic</label>
                  <input 
                    type="text" 
                    value={mechanicName}
                    onChange={e => setMechanicName(e.target.value)}
                    placeholder="Enter mechanic name"
                    className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <button 
                    onClick={() => {
                      if(!mechanicName) return toast.error('Enter mechanic name');
                      handleStatusUpdate(selectedBooking.id, 'In Progress', mechanicName);
                    }}
                    className="w-full py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                  >
                    Assign & Start Service
                  </button>
                </div>
              )}

              {selectedBooking.status === 'In Progress' && (
                <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-800 dark:text-blue-300 mb-4">
                    Assigned to: <span className="font-bold">{selectedBooking.mechanic}</span>
                  </div>
                  <button 
                    onClick={() => handleStatusUpdate(selectedBooking.id, 'Completed')}
                    className="w-full py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" /> Mark as Completed
                  </button>
                </div>
              )}

              {selectedBooking.status === 'Completed' && (
                <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-800">
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
      {/* Manual Record Modal */}
      {isManualRecordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800 max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center sticky top-0 bg-white dark:bg-zinc-900">
              <h3 className="font-display text-xl font-bold">Add Service Record</h3>
              <button onClick={() => setIsManualRecordModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              storageService.saveServiceRecord({
                ...manualRecord,
                serviceDate: new Date(manualRecord.serviceDate).toISOString(),
                nextServiceDate: new Date(manualRecord.nextServiceDate).toISOString(),
              });
              setRecords(storageService.getServiceRecords());
              setIsManualRecordModalOpen(false);
              toast.success('Service record added');
              setManualRecord({
                customerName: '', phone: '', carModel: '', serviceType: '',
                serviceDate: format(new Date(), 'yyyy-MM-dd'),
                nextServiceDate: format(addDays(new Date(), 90), 'yyyy-MM-dd'),
                notes: ''
              });
            }} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Customer Name</label>
                  <input required type="text" value={manualRecord.customerName} onChange={e => setManualRecord({...manualRecord, customerName: e.target.value})} className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Phone</label>
                  <input required type="tel" value={manualRecord.phone} onChange={e => setManualRecord({...manualRecord, phone: e.target.value})} className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Car Model</label>
                  <input required type="text" value={manualRecord.carModel} onChange={e => setManualRecord({...manualRecord, carModel: e.target.value})} className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Service Type</label>
                  <input required type="text" value={manualRecord.serviceType} onChange={e => setManualRecord({...manualRecord, serviceType: e.target.value})} className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Service Date</label>
                  <input required type="date" value={manualRecord.serviceDate} onChange={e => setManualRecord({...manualRecord, serviceDate: e.target.value})} className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Next Due Date</label>
                  <input required type="date" value={manualRecord.nextServiceDate} onChange={e => setManualRecord({...manualRecord, nextServiceDate: e.target.value})} className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div className="space-y-1 col-span-2">
                  <label className="text-sm font-medium">Notes</label>
                  <textarea value={manualRecord.notes} onChange={e => setManualRecord({...manualRecord, notes: e.target.value})} className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 focus:ring-2 focus:ring-blue-500 outline-none" rows={3} />
                </div>
              </div>
              <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 mt-4">
                Save Record
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
