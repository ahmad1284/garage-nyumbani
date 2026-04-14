import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ReminderModal } from '@/app/admin/components/reminder-modal';
import AdminDashboard from '@/app/admin/page';
import { storageService } from '@/lib/storage';
import type { ServiceRecord, Booking, WhatsAppLog } from '@/lib/storage';
import { addDays } from 'date-fns';

const mockJsPDF = {
  setFont: jest.fn(), setFontSize: jest.fn(), text: jest.fn(),
  line: jest.fn(), save: jest.fn(), addPage: jest.fn(),
  setPage: jest.fn(), setFillColor: jest.fn(), rect: jest.fn(),
  getNumberOfPages: jest.fn().mockReturnValue(1),
};
jest.mock('jspdf', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => mockJsPDF),
}));
jest.mock('html2canvas', () => jest.fn().mockResolvedValue({ toDataURL: () => 'data:image/png;base64,abc', height: 100, width: 100 }));
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}));
jest.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'light', resolvedTheme: 'light', setTheme: jest.fn() }),
}));
jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
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

// Mock fetch globally for sms-enabled + send endpoints
const mockFetch = jest.fn();
global.fetch = mockFetch;

const nearingRecords: ServiceRecord[] = [
  {
    id: 'r001', customerName: 'Alice', phone: '+255700001111', carModel: 'Toyota Axio',
    serviceType: 'brake-systems',
    serviceDate: new Date().toISOString(),
    nextServiceDate: addDays(new Date(), 5).toISOString(),
    notes: '',
  },
];

const mockBookings: Booking[] = [];
const mockLogs: WhatsAppLog[] = [];

beforeEach(() => {
  jest.clearAllMocks();
  mockJsPDF.getNumberOfPages.mockReturnValue(1);
  (storageService.getBookings as jest.Mock).mockResolvedValue(mockBookings);
  (storageService.getServiceRecords as jest.Mock).mockResolvedValue(nearingRecords);
  (storageService.getLogs as jest.Mock).mockResolvedValue(mockLogs);
  mockFetch.mockResolvedValue({ ok: true, json: async () => ({ enabled: false }) });
});

describe('ReminderModal — SMS button', () => {
  test('SMS button hidden when smsEnabled=false', () => {
    render(
      <ReminderModal
        records={nearingRecords}
        smsEnabled={false}
        onClose={jest.fn()}
        onReminderSent={jest.fn()}
      />
    );
    expect(screen.queryByText(/Send SMS to All/i)).not.toBeInTheDocument();
  });

  test('SMS button visible when smsEnabled=true', () => {
    render(
      <ReminderModal
        records={nearingRecords}
        smsEnabled={true}
        onClose={jest.fn()}
        onReminderSent={jest.fn()}
      />
    );
    expect(screen.getByText(/Send SMS to All/i)).toBeInTheDocument();
  });

  test('SMS button calls /api/reminders/send', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ results: [] }) });
    const onReminderSent = jest.fn();
    render(
      <ReminderModal
        records={nearingRecords}
        smsEnabled={true}
        onClose={jest.fn()}
        onReminderSent={onReminderSent}
      />
    );
    fireEvent.click(screen.getByText(/Send SMS to All/i));
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/reminders/send', expect.objectContaining({ method: 'POST' }));
    });
  });
});

describe('Admin — PDF download button in reminders tab', () => {
  test('Download PDF button renders in reminders tab', async () => {
    render(<AdminDashboard />);
    await waitFor(() => screen.getByText('Cars Nearing Service Due'));
    fireEvent.click(screen.getByRole('button', { name: /^Reminders$/i }));
    expect(screen.getByText('Download PDF')).toBeInTheDocument();
  });

  test('clicking Download PDF calls generateServiceHistoryPDF', async () => {
    render(<AdminDashboard />);
    await waitFor(() => screen.getByText('Cars Nearing Service Due'));
    fireEvent.click(screen.getByRole('button', { name: /^Reminders$/i }));
    fireEvent.click(screen.getByText('Download PDF'));
    expect(mockJsPDF.save).toHaveBeenCalledWith('Service_Records.pdf');
  });
});

describe('/api/reminders/sms-enabled', () => {
  test('admin fetches sms-enabled on login', async () => {
    render(<AdminDashboard />);
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/reminders/sms-enabled');
    });
  });
});
