import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminDashboard from '@/app/admin/page';
import { storageService, Booking, ServiceRecord, WhatsAppLog, setAdminToken } from '@/lib/storage';
import { addDays } from 'date-fns';

jest.mock('jspdf', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    setFont: jest.fn(), setFontSize: jest.fn(), text: jest.fn(),
    line: jest.fn(), save: jest.fn(), addPage: jest.fn(),
    internal: { pageSize: { getWidth: () => 210, getHeight: () => 297 } },
    addImage: jest.fn(), getNumberOfPages: jest.fn().mockReturnValue(1), setPage: jest.fn(),
  })),
}));
jest.mock('html2canvas', () => jest.fn().mockResolvedValue({ toDataURL: () => 'data:image/png;base64,abc', height: 100, width: 100 }));
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}));
jest.mock('next-themes', () => ({
  useTheme: () => ({ resolvedTheme: 'light', setTheme: jest.fn() }),
}));
jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

// Mock fetch for /api/reminders/sms-enabled
global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ enabled: false }) });
jest.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
jest.mock('@/lib/storage', () => ({
  storageService: {
    getBookings: jest.fn(),
    getServiceRecords: jest.fn(),
    getLogs: jest.fn(),
    updateBookingStatus: jest.fn(),
    addLog: jest.fn(),
    saveServiceRecord: jest.fn(),
    updateBooking: jest.fn(),
    saveManualRecord: jest.fn(),
  },
  setAdminToken: jest.fn(),
  getAdminToken: jest.fn().mockReturnValue('mock-token'),
}));

const mockBookings: Booking[] = [
  {
    id: 'b001', customerName: 'Alice', phone: '+255700001111', whatsapp: '',
    carModel: 'Toyota Axio', serviceType: 'brake-systems', location: 'Zanzibar',
    preferredDate: '2026-04-20', preferredTime: '09:00', isEmergency: false,
    notes: '', status: 'New', createdAt: new Date().toISOString(),
  },
  {
    id: 'b002', customerName: 'Bob', phone: '+255700002222', whatsapp: '',
    carModel: 'Nissan Note', serviceType: 'engine-performance', location: 'Stone Town',
    preferredDate: '2026-04-21', preferredTime: '11:00', isEmergency: false,
    notes: '', status: 'Completed', createdAt: new Date().toISOString(),
  },
];

const mockRecords: ServiceRecord[] = [
  {
    id: 'r001', customerName: 'Alice', phone: '+255700001111', carModel: 'Toyota Axio',
    serviceType: 'brake-systems',
    serviceDate: new Date().toISOString(),
    nextServiceDate: addDays(new Date(), 5).toISOString(), // 5 days — within 14
    notes: '',
  },
  {
    id: 'r002', customerName: 'Charlie', phone: '+255700003333', carModel: 'Suzuki Swift',
    serviceType: 'engine-performance',
    serviceDate: new Date().toISOString(),
    nextServiceDate: addDays(new Date(), 30).toISOString(), // 30 days — outside 14
    notes: '',
  },
];

const mockLogs: WhatsAppLog[] = [
  { id: 'l001', bookingId: 'b001', phone: '+255700001111', message: 'Your mechanic is on the way', sentAt: new Date().toISOString() },
  { id: 'l002', bookingId: 'b002', phone: '+255700002222', message: 'Service complete', sentAt: new Date().toISOString() },
];

beforeEach(() => {
  jest.clearAllMocks();
  (storageService.getBookings as jest.Mock).mockResolvedValue(mockBookings);
  (storageService.getServiceRecords as jest.Mock).mockResolvedValue(mockRecords);
  (storageService.getLogs as jest.Mock).mockResolvedValue(mockLogs);
});

const renderAdmin = () => render(<AdminDashboard />);

describe('Admin Dashboard — Nearing Due Card', () => {
  test('nearing due card shows count badge', async () => {
    renderAdmin();
    await waitFor(() => expect(screen.getByText('Cars Nearing Service Due')).toBeInTheDocument());
    // Only Alice (5 days) is within 14 days — badge shows count 1
    const badge = document.querySelector('.rounded-full.bg-orange-100, .rounded-full.bg-orange-100\\/30');
    const nearingDueSection = screen.getByText('Cars Nearing Service Due').closest('button')!.parentElement!;
    expect(nearingDueSection.textContent).toContain('1');
  });

  test('nearing due card expands to show due records', async () => {
    renderAdmin();
    await waitFor(() => screen.getByText('Cars Nearing Service Due'));
    fireEvent.click(screen.getByText('Cars Nearing Service Due'));
    expect(screen.getByText(/Alice.*Toyota Axio|Toyota Axio.*Alice/)).toBeInTheDocument();
  });

  test('nearing due rows have click-to-call links', async () => {
    renderAdmin();
    await waitFor(() => screen.getByText('Cars Nearing Service Due'));
    fireEvent.click(screen.getByText('Cars Nearing Service Due'));
    const callLink = screen.getByRole('link', { name: /\+255700001111/ });
    expect(callLink).toHaveAttribute('href', 'tel:+255700001111');
  });
});

describe('Admin Bookings Search', () => {
  test('search input renders in bookings tab', async () => {
    renderAdmin();
    await waitFor(() => screen.getByText('Cars Nearing Service Due'));
    fireEvent.click(screen.getByRole('button', { name: /Bookings/i }));
    expect(screen.getByPlaceholderText(/Search by name, phone, car, service/i)).toBeInTheDocument();
  });

  test('filters bookings by customer name', async () => {
    renderAdmin();
    await waitFor(() => screen.getByText('Cars Nearing Service Due'));
    fireEvent.click(screen.getByRole('button', { name: /Bookings/i }));
    const searchInput = screen.getByPlaceholderText(/Search by name, phone, car, service/i);
    fireEvent.change(searchInput, { target: { value: 'Alice' } });
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.queryByText('Bob')).not.toBeInTheDocument();
  });
});

describe('Admin Reminders Search', () => {
  test('search input renders in reminders tab', async () => {
    renderAdmin();
    await waitFor(() => screen.getByText('Cars Nearing Service Due'));
    fireEvent.click(screen.getByRole('button', { name: /^Reminders$/i }));
    expect(screen.getByPlaceholderText(/Search by name, phone, car, service/i)).toBeInTheDocument();
  });

  test('filters records by customer name', async () => {
    renderAdmin();
    await waitFor(() => screen.getByText('Cars Nearing Service Due'));
    fireEvent.click(screen.getByRole('button', { name: /^Reminders$/i }));
    const searchInput = screen.getByPlaceholderText(/Search by name, phone, car, service/i);
    fireEvent.change(searchInput, { target: { value: 'Alice' } });
    expect(screen.getByText(/Alice.*Toyota Axio|Toyota Axio.*Alice/i)).toBeInTheDocument();
    expect(screen.queryByText('Charlie')).not.toBeInTheDocument();
  });
});

describe('Admin Logs Search', () => {
  test('search input renders in logs tab', async () => {
    renderAdmin();
    await waitFor(() => screen.getByText('Cars Nearing Service Due'));
    fireEvent.click(screen.getByRole('button', { name: /Comms Logs/i }));
    expect(screen.getByPlaceholderText(/Search by phone or message/i)).toBeInTheDocument();
  });

  test('filters logs by message', async () => {
    renderAdmin();
    await waitFor(() => screen.getByText('Cars Nearing Service Due'));
    fireEvent.click(screen.getByRole('button', { name: /Comms Logs/i }));
    const searchInput = screen.getByPlaceholderText(/Search by phone or message/i);
    fireEvent.change(searchInput, { target: { value: 'mechanic' } });
    expect(screen.getByText('Your mechanic is on the way')).toBeInTheDocument();
    expect(screen.queryByText('Service complete')).not.toBeInTheDocument();
  });
});
