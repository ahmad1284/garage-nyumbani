
export type ServiceStatus = 'New' | 'In Progress' | 'Completed' | 'Cancelled';

export interface InvoiceItem {
  description: string;
  amount: number;
}

export interface Booking {
  id: string;
  customerName: string;
  phone: string;
  whatsapp: string;
  carModel: string;
  serviceType: string;
  location: string;
  coordinates?: { lat: number; lng: number };
  preferredDateTime: string;
  isEmergency: boolean;
  status: ServiceStatus;
  assignedMechanic?: string;
  notes: string;
  createdAt: string;
  price?: number;
  workDone?: string;
  invoiceItems?: InvoiceItem[];
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

export interface ServiceItem {
  id: string;
  titleSw: string;
  titleEn: string;
  descriptionSw: string;
  descriptionEn: string;
  icon: string;
  price: number;
}

export enum AppView {
  Home = 'home',
  Services = 'services',
  Booking = 'booking',
  Contact = 'contact',
  AdminLogin = 'admin-login',
  AdminDashboard = 'admin-dashboard',
  Success = 'success',
  UserHistory = 'user-history'
}
