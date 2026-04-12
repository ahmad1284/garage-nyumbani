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

// Admin session token — persisted in sessionStorage across page reloads
let _adminToken: string | null = null;

export function setAdminToken(token: string | null): void {
  _adminToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      sessionStorage.setItem('admin_token', token);
    } else {
      sessionStorage.removeItem('admin_token');
    }
  }
}

export function getAdminToken(): string | null {
  if (_adminToken) return _adminToken;
  if (typeof window !== 'undefined') {
    _adminToken = sessionStorage.getItem('admin_token');
  }
  return _adminToken;
}

function authHeaders(): HeadersInit {
  const token = getAdminToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function throwIfNotOk(res: Response): Promise<void> {
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      if (body?.error) msg = body.error;
    } catch { /* ignore */ }
    throw new Error(msg);
  }
}

export const storageService = {
  async getBookings(phone?: string): Promise<Booking[]> {
    const url = phone ? `/api/bookings?phone=${encodeURIComponent(phone)}` : '/api/bookings';
    const res = await fetch(url);
    await throwIfNotOk(res);
    return res.json();
  },

  async saveBooking(booking: Omit<Booking, 'id' | 'status' | 'createdAt'>): Promise<Booking> {
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(booking),
    });
    await throwIfNotOk(res);
    return res.json();
  },

  async updateBookingStatus(id: string, status: BookingStatus, mechanic?: string): Promise<void> {
    const res = await fetch(`/api/bookings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ status, ...(mechanic ? { mechanic } : {}) }),
    });
    await throwIfNotOk(res);
  },

  async updateBooking(id: string, updates: Partial<Booking>): Promise<void> {
    const res = await fetch(`/api/bookings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(updates),
    });
    await throwIfNotOk(res);
  },

  async getLogs(): Promise<WhatsAppLog[]> {
    const res = await fetch('/api/logs');
    await throwIfNotOk(res);
    return res.json();
  },

  async addLog(bookingId: string, phone: string, message: string): Promise<void> {
    const res = await fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ bookingId, phone, message }),
    });
    await throwIfNotOk(res);
  },

  async getServiceRecords(): Promise<ServiceRecord[]> {
    const res = await fetch('/api/records');
    await throwIfNotOk(res);
    return res.json();
  },

  async saveServiceRecord(record: Omit<ServiceRecord, 'id'>): Promise<ServiceRecord> {
    const res = await fetch('/api/records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(record),
    });
    await throwIfNotOk(res);
    return res.json();
  },
};
