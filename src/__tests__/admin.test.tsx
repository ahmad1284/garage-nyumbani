import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import AdminDashboard from '@/app/admin/page';
import { MECHANICS } from '@/lib/constants';
import { storageService } from '@/lib/storage';

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

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(global, 'localStorage', { value: localStorageMock, writable: true });

const login = () => {
  const input = screen.getByPlaceholderText('Enter admin password');
  fireEvent.change(input, { target: { value: 'admin123' } });
  fireEvent.submit(input.closest('form')!);
};

beforeEach(() => {
  localStorageMock.clear();
  jest.clearAllMocks();
});

describe('AdminDashboard — Phase 3', () => {
  describe('Login', () => {
    test('shows login form when not authenticated', () => {
      render(<AdminDashboard />);
      expect(screen.getByText('Admin Access')).toBeInTheDocument();
    });

    test('shows dashboard after correct password', () => {
      render(<AdminDashboard />);
      login();
      expect(screen.getByText('Overview')).toBeInTheDocument();
    });
  });

  describe('Mechanics dropdown', () => {
    test('mechanics dropdown shows all 5 mechanics', async () => {
      // Save a booking first
      storageService.saveBooking({
        customerName: 'Test', phone: '0700', carModel: 'Toyota', serviceType: 'brake-systems',
        location: 'Mpendae', preferredDate: '2026-04-10', preferredTime: '10:00', isEmergency: false,
      });
      render(<AdminDashboard />);
      login();

      // Go to bookings tab
      fireEvent.click(screen.getByText('Bookings'));
      fireEvent.click(screen.getByText('Manage'));

      // Should have a select with mechanics
      const select = screen.getByRole('combobox');
      MECHANICS.forEach(m => {
        expect(select.innerHTML).toContain(m);
      });
    });

    test('no free-text mechanic input', async () => {
      storageService.saveBooking({
        customerName: 'Test', phone: '0700', carModel: 'Toyota', serviceType: 'brake-systems',
        location: 'Mpendae', preferredDate: '2026-04-10', preferredTime: '10:00', isEmergency: false,
      });
      render(<AdminDashboard />);
      login();
      fireEvent.click(screen.getByText('Bookings'));
      fireEvent.click(screen.getByText('Manage'));

      // Should not have a text input for mechanic name
      const textInputs = screen.queryAllByPlaceholderText(/mechanic name/i);
      expect(textInputs).toHaveLength(0);
    });
  });

  describe('Booking detail shows whatsapp and notes', () => {
    test('shows whatsapp if present', () => {
      storageService.saveBooking({
        customerName: 'Test', phone: '0700', whatsapp: '0711111111', carModel: 'Toyota',
        serviceType: 'brake-systems', location: 'Mpendae', preferredDate: '2026-04-10',
        preferredTime: '10:00', isEmergency: false,
      });
      render(<AdminDashboard />);
      login();
      fireEvent.click(screen.getByText('Bookings'));
      fireEvent.click(screen.getByText('Manage'));
      expect(screen.getByText(/0711111111/)).toBeInTheDocument();
    });

    test('shows notes if present', () => {
      storageService.saveBooking({
        customerName: 'Test', phone: '0700', notes: 'Car makes noise', carModel: 'Toyota',
        serviceType: 'brake-systems', location: 'Mpendae', preferredDate: '2026-04-10',
        preferredTime: '10:00', isEmergency: false,
      });
      render(<AdminDashboard />);
      login();
      fireEvent.click(screen.getByText('Bookings'));
      fireEvent.click(screen.getByText('Manage'));
      expect(screen.getByText(/Car makes noise/)).toBeInTheDocument();
    });
  });

  describe('Completion modal', () => {
    const setupInProgressBooking = () => {
      const booking = storageService.saveBooking({
        customerName: 'Test', phone: '0700', carModel: 'Toyota', serviceType: 'brake-systems',
        location: 'Mpendae', preferredDate: '2026-04-10', preferredTime: '10:00', isEmergency: false,
      });
      storageService.updateBookingStatus(booking.id, 'In Progress', 'Ali Hassan');
      return booking;
    };

    test('shows completion modal when Mark as Completed clicked', () => {
      setupInProgressBooking();
      render(<AdminDashboard />);
      login();
      fireEvent.click(screen.getByText('Bookings'));
      fireEvent.click(screen.getByText('Manage'));
      fireEvent.click(screen.getByText('Mark as Completed'));
      expect(screen.getByText('Complete Booking')).toBeInTheDocument();
    });

    test('completion modal has price, work done, and invoice items fields', () => {
      setupInProgressBooking();
      render(<AdminDashboard />);
      login();
      fireEvent.click(screen.getByText('Bookings'));
      fireEvent.click(screen.getByText('Manage'));
      fireEvent.click(screen.getByText('Mark as Completed'));

      expect(screen.getByPlaceholderText(/e.g. 55000/)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Describe the work/)).toBeInTheDocument();
      expect(screen.getByText('Add Item')).toBeInTheDocument();
    });

    test('accepts price 0 for other-specialist', async () => {
      const booking = storageService.saveBooking({
        customerName: 'Test', phone: '0700', carModel: 'Toyota', serviceType: 'other-specialist',
        location: 'Mpendae', preferredDate: '2026-04-10', preferredTime: '10:00', isEmergency: false,
      });
      storageService.updateBookingStatus(booking.id, 'In Progress', 'Ali Hassan');

      render(<AdminDashboard />);
      login();
      fireEvent.click(screen.getByText('Bookings'));
      fireEvent.click(screen.getByText('Manage'));
      fireEvent.click(screen.getByText('Mark as Completed'));

      const priceInput = screen.getByPlaceholderText(/e.g. 55000/);
      fireEvent.change(priceInput, { target: { value: '0' } });

      await act(async () => {
        fireEvent.click(screen.getByText('Save & Complete'));
      });

      const updated = storageService.getBookings().find(b => b.id === booking.id)!;
      expect(updated.price).toBe(0);
      expect(updated.status).toBe('Completed');
    });
  });
});
