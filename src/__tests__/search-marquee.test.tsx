import React from 'react';
import { render, screen } from '@testing-library/react';
import CustomerLanding from '@/app/page';
import { LanguageProvider } from '@/components/language-provider';

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
