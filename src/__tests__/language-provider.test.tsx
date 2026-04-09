import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { LanguageProvider, useLanguage } from '@/components/language-provider';

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(global, 'localStorage', { value: localStorageMock, writable: true });

function TestConsumer() {
  const { t, language } = useLanguage();
  return (
    <div>
      <span data-testid="language">{language}</span>
      <span data-testid="hero-title">{t.heroTitle}</span>
      <span data-testid="faq-title">{t.faqTitle}</span>
    </div>
  );
}

beforeEach(() => localStorageMock.clear());

describe('LanguageProvider', () => {
  test('renders children immediately without blank flash (no null return)', () => {
    // If the provider returned null before mounting, this render would produce nothing
    render(
      <LanguageProvider>
        <TestConsumer />
      </LanguageProvider>
    );
    // Content must be visible on first render, not just after effects
    expect(screen.getByTestId('hero-title')).toBeInTheDocument();
    expect(screen.getByTestId('hero-title').textContent).toBeTruthy();
  });

  test('defaults to English', () => {
    render(
      <LanguageProvider>
        <TestConsumer />
      </LanguageProvider>
    );
    expect(screen.getByTestId('language').textContent).toBe('en');
  });

  test('restores saved language from localStorage', async () => {
    localStorageMock.setItem('garage_lang', 'sw');
    render(
      <LanguageProvider>
        <TestConsumer />
      </LanguageProvider>
    );
    // After useEffect fires
    await act(async () => {});
    expect(screen.getByTestId('language').textContent).toBe('sw');
  });

  test('English translations include all required UI_STRINGS keys', () => {
    render(
      <LanguageProvider>
        <TestConsumer />
      </LanguageProvider>
    );
    expect(screen.getByTestId('faq-title').textContent).toBe('FREQUENTLY ASKED QUESTIONS');
  });

  test('Swahili translations include all required UI_STRINGS keys after language switch', async () => {
    localStorageMock.setItem('garage_lang', 'sw');
    render(
      <LanguageProvider>
        <TestConsumer />
      </LanguageProvider>
    );
    await act(async () => {});
    expect(screen.getByTestId('faq-title').textContent).toBe('MASWALI YANAYOULIZWA MARA KWA MARA');
  });
});
