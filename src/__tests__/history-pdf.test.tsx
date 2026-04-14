import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CustomerLanding from '@/app/page';
import { LanguageProvider } from '@/components/language-provider';
import { storageService, Booking } from '@/lib/storage';
import { generateHistoryPDF } from '@/lib/pdf-utils';

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(global, 'localStorage', { value: localStorageMock, writable: true });

const mockJsPDF = {
  setFont: jest.fn(),
  setFontSize: jest.fn(),
  text: jest.fn(),
  line: jest.fn(),
  save: jest.fn(),
  addPage: jest.fn(),
  setPage: jest.fn(),
  setFillColor: jest.fn(),
  rect: jest.fn(),
  getNumberOfPages: jest.fn().mockReturnValue(1),
};

jest.mock('jspdf', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => mockJsPDF),
}));
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean }) => <img {...props} />,
}));
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}));
jest.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'light', resolvedTheme: 'light', setTheme: jest.fn() }),
}));
jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
jest.mock('@/app/actions', () => ({ analyzeCarIssue: jest.fn().mockResolvedValue('advice') }));
jest.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
    section: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => <section {...props}>{children}</section>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const mockBookings: Booking[] = [
  {
    id: 'abc123',
    customerName: 'Test User',
    phone: '+255700111222',
    whatsapp: '+255700111222',
    carModel: 'Toyota Axio',
    serviceType: 'brake-systems',
    location: 'Zanzibar',
    preferredDate: '2026-04-20',
    preferredTime: '10:00',
    isEmergency: false,
    notes: '',
    status: 'Pending',
    createdAt: '2026-04-13T00:00:00Z',
  },
];

jest.mock('@/lib/storage', () => ({
  storageService: {
    getBookings: jest.fn(),
    saveBooking: jest.fn(),
  },
}));

beforeEach(() => {
  localStorageMock.clear();
  jest.clearAllMocks();
  mockJsPDF.getNumberOfPages.mockReturnValue(1);
});

const renderPage = () => render(<LanguageProvider><CustomerLanding /></LanguageProvider>);

describe('History PDF Download', () => {
  test('Download PDF button hidden when no history', () => {
    renderPage();
    expect(screen.queryByText(/Download PDF|Pakua PDF/i)).not.toBeInTheDocument();
  });

  test('Download PDF button appears after search with results', async () => {
    (storageService.getBookings as jest.Mock).mockResolvedValue(mockBookings);
    renderPage();
    const input = screen.getByPlaceholderText('07XXXXXXXX');
    fireEvent.change(input, { target: { value: '+255700111222' } });
    const form = input.closest('form')!;
    await fireEvent.submit(form);
    // Wait for async state update
    await screen.findByText(/Download PDF|Pakua PDF/i);
    expect(screen.getByText(/Download PDF|Pakua PDF/i)).toBeInTheDocument();
  });

  test('Download PDF button not shown when search returns empty', async () => {
    (storageService.getBookings as jest.Mock).mockResolvedValue([]);
    renderPage();
    const input = screen.getByPlaceholderText('07XXXXXXXX');
    fireEvent.change(input, { target: { value: '+255700000000' } });
    const form = input.closest('form')!;
    await fireEvent.submit(form);
    expect(screen.queryByText(/Download PDF|Pakua PDF/i)).not.toBeInTheDocument();
  });
});

describe('generateHistoryPDF utility', () => {
  test('calls jsPDF and saves with phone-based filename', () => {
    generateHistoryPDF(mockBookings, '+255700111222');
    expect(mockJsPDF.save).toHaveBeenCalledWith('History_+255700111222.pdf');
  });

  test('writes business name in header', () => {
    generateHistoryPDF(mockBookings, '+255700111222');
    expect(mockJsPDF.text).toHaveBeenCalledWith('GARAGE NYUMBANI', 20, 20);
  });

  test('includes page footer on each page', () => {
    mockJsPDF.getNumberOfPages.mockReturnValue(2);
    generateHistoryPDF(mockBookings, '+255700111222');
    expect(mockJsPDF.setPage).toHaveBeenCalledWith(1);
    expect(mockJsPDF.setPage).toHaveBeenCalledWith(2);
  });

  test('handles empty bookings array without error', () => {
    expect(() => generateHistoryPDF([], '+255700000000')).not.toThrow();
    expect(mockJsPDF.save).toHaveBeenCalledWith('History_+255700000000.pdf');
  });
});
