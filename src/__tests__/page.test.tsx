import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import CustomerLanding from '@/app/page';
import { LanguageProvider } from '@/components/language-provider';

const renderWithProviders = (ui: React.ReactElement) =>
  render(<LanguageProvider>{ui}</LanguageProvider>);
import { SERVICES, FAQ_ITEMS, PHONE_NUMBER, WHATSAPP_NUMBER } from '@/lib/constants';

// Mock jsPDF (requires TextEncoder not available in jsdom)
jest.mock('jspdf', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    setFont: jest.fn(), setFontSize: jest.fn(), text: jest.fn(),
    line: jest.fn(), save: jest.fn(),
  })),
}));

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean }) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

// Mock next/link
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

// Mock next-themes
jest.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'light', setTheme: jest.fn() }),
}));

// Mock sonner
jest.mock('sonner', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

// Mock actions
jest.mock('@/app/actions', () => ({
  analyzeCarIssue: jest.fn().mockResolvedValue('Test AI advice'),
}));

// Mock motion
jest.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
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

beforeEach(() => localStorageMock.clear());

describe('CustomerLanding — Phase 2', () => {
  describe('Service Catalog', () => {
    test('renders all 9 services', () => {
      renderWithProviders(<CustomerLanding />);
      SERVICES.forEach(service => {
        expect(screen.getByText(service.titleEn)).toBeInTheDocument();
      });
    });

    test('shows TZS price for paid services', () => {
      renderWithProviders(<CustomerLanding />);
      const paidService = SERVICES.find(s => s.price > 0)!;
      const priceEls = screen.getAllByText(`TZS ${paidService.price.toLocaleString()}`);
      expect(priceEls.length).toBeGreaterThan(0);
    });

    test('shows description when service card is expanded', () => {
      renderWithProviders(<CustomerLanding />);
      const firstService = SERVICES[0];
      // Description should not be visible initially
      expect(screen.queryByText(firstService.descriptionEn)).not.toBeInTheDocument();
      // Click to expand
      fireEvent.click(screen.getByText(firstService.titleEn));
      expect(screen.getByText(firstService.descriptionEn)).toBeInTheDocument();
    });

    test('collapses service when clicked again', () => {
      renderWithProviders(<CustomerLanding />);
      const firstService = SERVICES[0];
      const titleEl = screen.getByText(firstService.titleEn);
      fireEvent.click(titleEl);
      expect(screen.getByText(firstService.descriptionEn)).toBeInTheDocument();
      fireEvent.click(titleEl);
      expect(screen.queryByText(firstService.descriptionEn)).not.toBeInTheDocument();
    });
  });

  describe('Booking Form', () => {
    test('renders all 9 services in dropdown', () => {
      renderWithProviders(<CustomerLanding />);
      const select = screen.getByRole('combobox');
      SERVICES.forEach(service => {
        expect(select.innerHTML).toContain(service.id);
      });
    });

    test('renders whatsapp field', () => {
      renderWithProviders(<CustomerLanding />);
      // labelWhatsapp is in the translations
      expect(screen.getByText(/WHATSAPP NUMBER/i)).toBeInTheDocument();
    });

    test('renders notes field', () => {
      renderWithProviders(<CustomerLanding />);
      expect(screen.getByText(/ADDITIONAL NOTES/i)).toBeInTheDocument();
    });

    test('has single emergency checkbox', () => {
      renderWithProviders(<CustomerLanding />);
      const checkboxes = screen.getAllByRole('checkbox');
      // Only one emergency checkbox should be present
      const emergencyCheckboxes = checkboxes.filter(cb => cb.getAttribute('id') === 'emergency');
      expect(emergencyCheckboxes).toHaveLength(1);
    });
  });

  describe('FAQ Section', () => {
    test('renders all 4 FAQ questions', () => {
      renderWithProviders(<CustomerLanding />);
      FAQ_ITEMS.forEach(item => {
        expect(screen.getByText(item.qEn)).toBeInTheDocument();
      });
    });

    test('shows answer when FAQ item is clicked', () => {
      renderWithProviders(<CustomerLanding />);
      const firstFaq = FAQ_ITEMS[0];
      expect(screen.queryByText(firstFaq.aEn)).not.toBeInTheDocument();
      fireEvent.click(screen.getByText(firstFaq.qEn));
      expect(screen.getByText(firstFaq.aEn)).toBeInTheDocument();
    });
  });

  describe('Contact Section', () => {
    test('renders phone number as tap-to-call link', () => {
      renderWithProviders(<CustomerLanding />);
      const phoneLink = screen.getByRole('link', { name: PHONE_NUMBER });
      expect(phoneLink).toHaveAttribute('href', `tel:${PHONE_NUMBER}`);
    });

    test('renders WhatsApp CTA link', () => {
      renderWithProviders(<CustomerLanding />);
      const waLinks = screen.getAllByRole('link');
      const waLink = waLinks.find(l => l.getAttribute('href')?.includes(`wa.me/${WHATSAPP_NUMBER}`));
      expect(waLink).toBeTruthy();
    });
  });
});
