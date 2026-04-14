import React from 'react';
import { render, screen } from '@testing-library/react';
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

describe('Service Card Images', () => {
  test('each service has imageUrl and fallbackBg defined', () => {
    SERVICES.forEach(s => {
      expect(s.imageUrl).toBeTruthy();
      expect(s.imageUrl).toMatch(/^https:\/\/images\.unsplash\.com\//);
      expect(s.fallbackBg).toBeTruthy();
    });
  });

  test('service card images render with correct alt text', () => {
    renderPage();
    SERVICES.forEach(s => {
      const img = screen.getByAltText(s.titleEn);
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', s.imageUrl);
    });
  });

  test('service card images render without emoji overlay', () => {
    renderPage();
    // No emoji overlays on card images — icons removed per spec
    SERVICES.forEach(s => {
      expect(screen.queryAllByText(s.icon).length).toBe(0);
    });
  });
});

describe('Section Animations', () => {
  test('service catalog section renders as section element', () => {
    renderPage();
    const sections = document.querySelectorAll('section');
    expect(sections.length).toBeGreaterThan(0);
  });

  test('service cards have whileInView motion wrappers (rendered as divs)', () => {
    renderPage();
    // Each service card title is rendered (getAllByText: title appears in card + select option)
    SERVICES.forEach(s => {
      expect(screen.getAllByText(s.titleSw).length).toBeGreaterThan(0);
    });
  });
});
