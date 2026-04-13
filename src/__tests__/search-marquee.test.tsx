import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CustomerLanding from '@/app/page';
import { LanguageProvider } from '@/components/language-provider';
import { SERVICES } from '@/lib/constants';

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(global, 'localStorage', { value: localStorageMock, writable: true });

jest.mock('jspdf', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    setFont: jest.fn(), setFontSize: jest.fn(), text: jest.fn(),
    line: jest.fn(), save: jest.fn(),
  })),
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
  useTheme: () => ({ resolvedTheme: 'light', setTheme: jest.fn() }),
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

beforeEach(() => localStorageMock.clear());

const renderPage = () => render(<LanguageProvider><CustomerLanding /></LanguageProvider>);

describe('Service Search Bar', () => {
  test('renders search input', () => {
    renderPage();
    expect(screen.getByPlaceholderText(/tafuta huduma|search services/i)).toBeInTheDocument();
  });

  test('shows all services when search is empty', () => {
    renderPage();
    SERVICES.forEach(s => {
      expect(screen.getByText(s.titleSw)).toBeInTheDocument();
    });
  });

  test('filters services by keyword', () => {
    renderPage();
    const input = screen.getByPlaceholderText(/tafuta huduma|search services/i);
    fireEvent.change(input, { target: { value: 'breki' } });
    // Brake card should appear
    expect(screen.getAllByText(/BREKI/i).length).toBeGreaterThan(0);
    // Non-brake services should not appear in catalog
    expect(screen.queryByText('SERVICE YA KAWAIDA (PERIODIC)')).not.toBeInTheDocument();
  });

  test('shows result count when searching', () => {
    renderPage();
    const input = screen.getByPlaceholderText(/tafuta huduma|search services/i);
    fireEvent.change(input, { target: { value: 'breki' } });
    expect(screen.getByText(/huduma zimepatikana|services found/i)).toBeInTheDocument();
  });

  test('clears search when ✕ clicked', () => {
    renderPage();
    const input = screen.getByPlaceholderText(/tafuta huduma|search services/i);
    fireEvent.change(input, { target: { value: 'breki' } });
    const clearBtn = screen.getByText('✕');
    fireEvent.click(clearBtn);
    expect((input as HTMLInputElement).value).toBe('');
    SERVICES.forEach(s => {
      expect(screen.getByText(s.titleSw)).toBeInTheDocument();
    });
  });
});

describe('Hero Marquee', () => {
  test('renders marquee ticker', () => {
    renderPage();
    expect(screen.getByLabelText('24/7 Service ticker')).toBeInTheDocument();
  });

  test('marquee contains 24/7 service text', () => {
    renderPage();
    const ticker = screen.getByLabelText('24/7 Service ticker');
    expect(ticker.textContent).toContain('24/7 Service');
    expect(ticker.textContent).toContain('Zanzibar Nzima');
  });
});
