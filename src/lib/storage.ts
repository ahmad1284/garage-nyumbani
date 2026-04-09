export type BookingStatus = 'New' | 'In Progress' | 'Completed' | 'Cancelled';

export interface Booking {
  id: string;
  customerName: string;
  phone: string;
  carModel: string;
  serviceType: string;
  location: string;
  preferredDate: string;
  preferredTime: string;
  isEmergency: boolean;
  status: BookingStatus;
  createdAt: string;
  mechanic?: string;
  whatsapp?: string;
  price?: number;
  workDone?: string;
  invoiceItems?: { description: string; amount: number }[];
  notes?: string;
}

export interface WhatsAppLog {
  id: string;
  bookingId: string;
  phone: string;
  message: string;
  sentAt: string;
}

export interface ServiceRecord {
  id: string;
  phone: string;
  customerName: string;
  carModel: string;
  serviceType: string;
  serviceDate: string;
  nextServiceDate: string;
  notes: string;
}

const STORAGE_KEYS = {
  BOOKINGS: 'garage_nyumbani_bookings',
  LOGS: 'garage_nyumbani_logs',
  RECORDS: 'garage_nyumbani_records',
};

export const storageService = {
  getBookings: (): Booking[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
    return data ? JSON.parse(data) : [];
  },
  
  saveBooking: (booking: Omit<Booking, 'id' | 'status' | 'createdAt'>): Booking => {
    const bookings = storageService.getBookings();
    const newBooking: Booking = {
      ...booking,
      id: Math.random().toString(36).substr(2, 9),
      status: 'New',
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify([newBooking, ...bookings]));
    return newBooking;
  },

  updateBookingStatus: (id: string, status: BookingStatus, mechanic?: string) => {
    const bookings = storageService.getBookings();
    const updated = bookings.map(b => 
      b.id === id ? { ...b, status, ...(mechanic ? { mechanic } : {}) } : b
    );
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(updated));
  },

  getLogs: (): WhatsAppLog[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(STORAGE_KEYS.LOGS);
    return data ? JSON.parse(data) : [];
  },

  addLog: (bookingId: string, phone: string, message: string) => {
    const logs = storageService.getLogs();
    const newLog: WhatsAppLog = {
      id: Math.random().toString(36).substr(2, 9),
      bookingId,
      phone,
      message,
      sentAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify([newLog, ...logs]));
  },

  getServiceRecords: (): ServiceRecord[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(STORAGE_KEYS.RECORDS);
    return data ? JSON.parse(data) : [];
  },

  updateBooking: (id: string, updates: Partial<Booking>): void => {
    const bookings = storageService.getBookings();
    const updated = bookings.map(b => b.id === id ? { ...b, ...updates } : b);
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(updated));
  },

  saveServiceRecord: (record: Omit<ServiceRecord, 'id'>): ServiceRecord => {
    const records = storageService.getServiceRecords();
    const newRecord: ServiceRecord = {
      ...record,
      id: Math.random().toString(36).substr(2, 9),
    };
    localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify([newRecord, ...records]));
    return newRecord;
  }
};
