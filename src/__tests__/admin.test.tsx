import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminDashboard from '@/app/admin/page';
import { MECHANICS } from '@/lib/constants';

// Mock jsPDF
jest.mock('jspdf', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    setFont: jest.fn(), setFontSize: jest.fn(), text: jest.fn(),
    line: jest.fn(), save: jest.fn(), addPage: jest.fn(),
    internal: { pageSize: { getWidth: () => 210 } },
    addImage: jest.fn(),
  })),
}));

// Mock html2canvas
jest.mock('html2canvas', () => jest.fn().mockResolvedValue({
  toDataURL: () => 'data:image/png;base64,mock',
  width: 794, height: 1123,
}));

// Mock next/link
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

// Mock sonner
jest.mock('sonner', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

// Mock motion
jest.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
  },
}));

// Mock invoice document
jest.mock('@/components/invoice-document', () => ({
  InvoiceDocument: () => <div data-testid="invoice-document">Invoice</div>,
}));

const MOCK_BOOKING = {
  id: 'b1',
  customerName: 'Test',
  phone: '0700',
  carModel: 'Toyota',
  serviceType: 'brake-systems',
  location: 'Mpendae',
  preferredDate: '2026-04-10',
  preferredTime: '10:00',
  isEmergency: false,
  status: 'New' as const,
  createdAt: '2026-04-01T00:00:00.000Z',
};

const MOCK_BOOKING_IN_PROGRESS = { ...MOCK_BOOKING, status: 'In Progress' as const, mechanic: 'Ali Hassan' };

// Mock storageService
jest.mock('@/lib/storage', () => {
  const actual = jest.requireActual('@/lib/storage');
  return {
    ...actual,
    storageService: {
      getBookings: jest.fn().mockResolvedValue([]),
      getServiceRecords: jest.fn().mockResolvedValue([]),
      getLogs: jest.fn().mockResolvedValue([]),
      updateBookingStatus: jest.fn().mockResolvedValue(undefined),
      updateBooking: jest.fn().mockResolvedValue(undefined),
      addLog: jest.fn().mockResolvedValue(undefined),
      saveServiceRecord: jest.fn().mockResolvedValue({ id: 'r1' }),
    },
    setAdminToken: jest.fn(),
    getAdminToken: jest.fn().mockReturnValue(null),
  };
});

// Silence sessionStorage errors in test env
const sessionStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(global, 'sessionStorage', { value: sessionStorageMock, writable: true });

const mockLoginFetch = (success = true) => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: success,
    json: jest.fn().mockResolvedValue(success ? { token: 'test-token' } : { error: 'Invalid password' }),
  } as unknown as Response);
};

const login = async (password = 'correct-password') => {
  const input = screen.getByPlaceholderText('Enter admin password');
  fireEvent.change(input, { target: { value: password } });
  fireEvent.submit(input.closest('form')!);
  await waitFor(() => screen.getByText('Overview'));
};

import { storageService } from '@/lib/storage';

beforeEach(() => {
  jest.clearAllMocks();
  sessionStorageMock.clear();
  mockLoginFetch(true);
  (storageService.getBookings as jest.Mock).mockResolvedValue([]);
  (storageService.getServiceRecords as jest.Mock).mockResolvedValue([]);
  (storageService.getLogs as jest.Mock).mockResolvedValue([]);
});

describe('AdminDashboard — Phase 3', () => {
  describe('Login', () => {
    test('shows login form when not authenticated', () => {
      render(<AdminDashboard />);
      expect(screen.getByText('Admin Access')).toBeInTheDocument();
    });

    test('shows dashboard after successful login', async () => {
      render(<AdminDashboard />);
      await login();
      expect(screen.getByText('Overview')).toBeInTheDocument();
    });

    test('shows error on bad password', async () => {
      mockLoginFetch(false);
      const { toast } = require('sonner');
      render(<AdminDashboard />);
      const input = screen.getByPlaceholderText('Enter admin password');
      fireEvent.change(input, { target: { value: 'wrong' } });
      fireEvent.submit(input.closest('form')!);
      await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Invalid password'));
    });
  });

  describe('Mechanics dropdown', () => {
    test('mechanics dropdown shows all mechanics', async () => {
      (storageService.getBookings as jest.Mock).mockResolvedValue([MOCK_BOOKING]);
      render(<AdminDashboard />);
      await login();

      fireEvent.click(screen.getByText('Bookings'));
      await waitFor(() => screen.getByText('Manage'));
      fireEvent.click(screen.getByText('Manage'));

      const select = screen.getByRole('combobox');
      MECHANICS.forEach(m => {
        expect(select.innerHTML).toContain(m);
      });
    });

    test('no free-text mechanic input', async () => {
      (storageService.getBookings as jest.Mock).mockResolvedValue([MOCK_BOOKING]);
      render(<AdminDashboard />);
      await login();
      fireEvent.click(screen.getByText('Bookings'));
      await waitFor(() => screen.getByText('Manage'));
      fireEvent.click(screen.getByText('Manage'));

      const textInputs = screen.queryAllByPlaceholderText(/mechanic name/i);
      expect(textInputs).toHaveLength(0);
    });
  });

  describe('Booking detail shows whatsapp and notes', () => {
    test('shows whatsapp if present', async () => {
      (storageService.getBookings as jest.Mock).mockResolvedValue([
        { ...MOCK_BOOKING, whatsapp: '0711111111' },
      ]);
      render(<AdminDashboard />);
      await login();
      fireEvent.click(screen.getByText('Bookings'));
      await waitFor(() => screen.getByText('Manage'));
      fireEvent.click(screen.getByText('Manage'));
      expect(screen.getByText(/0711111111/)).toBeInTheDocument();
    });

    test('shows notes if present', async () => {
      (storageService.getBookings as jest.Mock).mockResolvedValue([
        { ...MOCK_BOOKING, notes: 'Car makes noise' },
      ]);
      render(<AdminDashboard />);
      await login();
      fireEvent.click(screen.getByText('Bookings'));
      await waitFor(() => screen.getByText('Manage'));
      fireEvent.click(screen.getByText('Manage'));
      expect(screen.getByText(/Car makes noise/)).toBeInTheDocument();
    });
  });

  describe('Completion modal', () => {
    test('shows completion modal when Mark as Completed clicked', async () => {
      (storageService.getBookings as jest.Mock).mockResolvedValue([MOCK_BOOKING_IN_PROGRESS]);
      render(<AdminDashboard />);
      await login();
      fireEvent.click(screen.getByText('Bookings'));
      await waitFor(() => screen.getByText('Manage'));
      fireEvent.click(screen.getByText('Manage'));
      fireEvent.click(screen.getByText('Mark as Completed'));
      expect(screen.getByText('Complete Booking')).toBeInTheDocument();
    });

    test('completion modal has price, work done, and invoice items fields', async () => {
      (storageService.getBookings as jest.Mock).mockResolvedValue([MOCK_BOOKING_IN_PROGRESS]);
      render(<AdminDashboard />);
      await login();
      fireEvent.click(screen.getByText('Bookings'));
      await waitFor(() => screen.getByText('Manage'));
      fireEvent.click(screen.getByText('Manage'));
      fireEvent.click(screen.getByText('Mark as Completed'));

      expect(screen.getByPlaceholderText(/e.g. 55000/)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Describe the work/)).toBeInTheDocument();
      expect(screen.getByText('Add Item')).toBeInTheDocument();
    });
  });
});
